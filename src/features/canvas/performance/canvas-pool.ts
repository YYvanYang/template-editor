/**
 * Canvas 对象池
 * 复用 Canvas 元素，优化内存使用和性能
 * 参考 Figma 的 Canvas 管理策略
 */

export interface CanvasPoolConfig {
  maxPoolSize: number
  initialPoolSize: number
  enableOffscreenCanvas: boolean
  autoCleanup: boolean
  cleanupInterval: number
  maxIdleTime: number
  enableMemoryPressureHandling: boolean
  memoryPressureThreshold: number // MB
}

export interface PooledCanvas {
  canvas: HTMLCanvasElement | OffscreenCanvas
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  width: number
  height: number
  lastUsedTime: number
  usageCount: number
  isOffscreen: boolean
}

export interface CanvasPoolStats {
  totalCreated: number
  activeCount: number
  idleCount: number
  recycledCount: number
  destroyedCount: number
  memoryUsage: number // MB
  hitRate: number
}

/**
 * Canvas 对象池类
 */
export class CanvasPool {
  private config: CanvasPoolConfig
  private idleCanvases: PooledCanvas[] = []
  private activeCanvases: Set<PooledCanvas> = new Set()
  private cleanupTimer: number | null = null
  private stats: CanvasPoolStats = {
    totalCreated: 0,
    activeCount: 0,
    idleCount: 0,
    recycledCount: 0,
    destroyedCount: 0,
    memoryUsage: 0,
    hitRate: 0
  }
  private requestCount = 0
  private hitCount = 0
  private memoryPressureCallback: (() => void) | null = null

  constructor(config: Partial<CanvasPoolConfig> = {}) {
    this.config = {
      maxPoolSize: 50,
      initialPoolSize: 5,
      enableOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      autoCleanup: true,
      cleanupInterval: 30000, // 30 秒
      maxIdleTime: 60000, // 60 秒
      enableMemoryPressureHandling: true,
      memoryPressureThreshold: 100, // 100MB
      ...config
    }

    // 初始化对象池
    this.initialize()

    // 监听内存压力
    if (this.config.enableMemoryPressureHandling) {
      this.setupMemoryPressureHandling()
    }
  }

  /**
   * 初始化对象池
   */
  private initialize(): void {
    // 预创建初始画布
    for (let i = 0; i < this.config.initialPoolSize; i++) {
      const canvas = this.createCanvas(300, 300, false)
      this.idleCanvases.push(canvas)
    }

    // 启动自动清理
    if (this.config.autoCleanup) {
      this.startAutoCleanup()
    }

    this.updateStats()
  }

  /**
   * 设置内存压力处理
   */
  private setupMemoryPressureHandling(): void {
    // 监听内存压力事件（如果浏览器支持）
    if ('memory' in performance && 'addEventListener' in performance.memory) {
      this.memoryPressureCallback = () => {
        this.handleMemoryPressure()
      }
      
      // 注意：这是一个实验性 API，可能不被所有浏览器支持
      try {
        (performance.memory as any).addEventListener('pressure', this.memoryPressureCallback)
      } catch (error) {
        console.warn('Memory pressure API not supported')
      }
    }

    // 定期检查内存使用
    setInterval(() => {
      if (this.getMemoryUsage() > this.config.memoryPressureThreshold) {
        this.handleMemoryPressure()
      }
    }, 10000)
  }

  /**
   * 获取画布
   */
  acquire(width: number, height: number, preferOffscreen: boolean = false): PooledCanvas {
    this.requestCount++

    // 尝试从空闲池中获取合适的画布
    const canvas = this.findSuitableCanvas(width, height, preferOffscreen)

    if (canvas) {
      this.hitCount++
      this.idleCanvases = this.idleCanvases.filter(c => c !== canvas)
      this.activeCanvases.add(canvas)
      
      // 调整画布大小
      this.resizeCanvas(canvas, width, height)
      
      // 清空画布
      this.clearCanvas(canvas)
      
      canvas.lastUsedTime = Date.now()
      canvas.usageCount++
      
      this.updateStats()
      return canvas
    }

    // 创建新画布
    const newCanvas = this.createCanvas(width, height, preferOffscreen)
    this.activeCanvases.add(newCanvas)
    this.updateStats()
    
    return newCanvas
  }

  /**
   * 归还画布
   */
  release(canvas: PooledCanvas): void {
    if (!this.activeCanvases.has(canvas)) {
      console.warn('Attempting to release a canvas that is not active')
      return
    }

    this.activeCanvases.delete(canvas)
    
    // 检查是否应该保留在池中
    if (this.shouldKeepInPool(canvas)) {
      // 清空画布内容
      this.clearCanvas(canvas)
      
      canvas.lastUsedTime = Date.now()
      this.idleCanvases.push(canvas)
      this.stats.recycledCount++
    } else {
      // 销毁画布
      this.destroyCanvas(canvas)
    }

    this.updateStats()
  }

  /**
   * 批量获取画布
   */
  acquireBatch(
    count: number,
    width: number,
    height: number,
    preferOffscreen: boolean = false
  ): PooledCanvas[] {
    const canvases: PooledCanvas[] = []
    
    for (let i = 0; i < count; i++) {
      canvases.push(this.acquire(width, height, preferOffscreen))
    }

    return canvases
  }

  /**
   * 批量归还画布
   */
  releaseBatch(canvases: PooledCanvas[]): void {
    canvases.forEach(canvas => this.release(canvas))
  }

  /**
   * 查找合适的画布
   */
  private findSuitableCanvas(
    width: number,
    height: number,
    preferOffscreen: boolean
  ): PooledCanvas | null {
    // 优先查找完全匹配的画布
    let bestMatch = this.idleCanvases.find(canvas => 
      canvas.width === width &&
      canvas.height === height &&
      canvas.isOffscreen === preferOffscreen
    )

    if (bestMatch) return bestMatch

    // 查找可以重用的画布（尺寸接近）
    const tolerance = 1.5 // 允许 150% 的尺寸差异
    bestMatch = this.idleCanvases.find(canvas => {
      if (canvas.isOffscreen !== preferOffscreen) return false
      
      const widthRatio = canvas.width / width
      const heightRatio = canvas.height / height
      
      return widthRatio >= 1 && widthRatio <= tolerance &&
             heightRatio >= 1 && heightRatio <= tolerance
    })

    return bestMatch || null
  }

  /**
   * 创建画布
   */
  private createCanvas(
    width: number,
    height: number,
    isOffscreen: boolean
  ): PooledCanvas {
    let canvas: HTMLCanvasElement | OffscreenCanvas
    let context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null

    if (isOffscreen && this.config.enableOffscreenCanvas) {
      canvas = new OffscreenCanvas(width, height)
      context = canvas.getContext('2d')
    } else {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      context = canvas.getContext('2d')
    }

    this.stats.totalCreated++

    return {
      canvas,
      context,
      width,
      height,
      lastUsedTime: Date.now(),
      usageCount: 0,
      isOffscreen
    }
  }

  /**
   * 调整画布大小
   */
  private resizeCanvas(pooledCanvas: PooledCanvas, width: number, height: number): void {
    if (pooledCanvas.width === width && pooledCanvas.height === height) {
      return
    }

    pooledCanvas.canvas.width = width
    pooledCanvas.canvas.height = height
    pooledCanvas.width = width
    pooledCanvas.height = height

    // 重新获取上下文（调整大小后可能会丢失）
    if (pooledCanvas.isOffscreen) {
      pooledCanvas.context = (pooledCanvas.canvas as OffscreenCanvas).getContext('2d')
    } else {
      pooledCanvas.context = (pooledCanvas.canvas as HTMLCanvasElement).getContext('2d')
    }
  }

  /**
   * 清空画布
   */
  private clearCanvas(pooledCanvas: PooledCanvas): void {
    if (!pooledCanvas.context) return

    pooledCanvas.context.clearRect(0, 0, pooledCanvas.width, pooledCanvas.height)
    
    // 重置变换和样式
    pooledCanvas.context.setTransform(1, 0, 0, 1, 0, 0)
    pooledCanvas.context.globalAlpha = 1
    pooledCanvas.context.globalCompositeOperation = 'source-over'
  }

  /**
   * 判断是否应该保留在池中
   */
  private shouldKeepInPool(canvas: PooledCanvas): boolean {
    // 检查池大小限制
    if (this.idleCanvases.length >= this.config.maxPoolSize) {
      return false
    }

    // 检查画布尺寸是否合理
    const maxSize = 4096 // 最大边长
    if (canvas.width > maxSize || canvas.height > maxSize) {
      return false
    }

    // 检查内存使用
    if (this.getMemoryUsage() > this.config.memoryPressureThreshold * 0.8) {
      return false
    }

    return true
  }

  /**
   * 销毁画布
   */
  private destroyCanvas(canvas: PooledCanvas): void {
    // 清理资源
    if (canvas.context) {
      canvas.context = null
    }

    // 对于 HTMLCanvasElement，可以移除
    if (!canvas.isOffscreen && canvas.canvas instanceof HTMLCanvasElement) {
      canvas.canvas.width = 0
      canvas.canvas.height = 0
    }

    this.stats.destroyedCount++
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer !== null) return

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 清理空闲画布
   */
  private cleanup(): void {
    const now = Date.now()
    const maxIdleTime = this.config.maxIdleTime

    // 清理超时的画布
    const activeCanvases: PooledCanvas[] = []
    const toDestroy: PooledCanvas[] = []

    this.idleCanvases.forEach(canvas => {
      if (now - canvas.lastUsedTime > maxIdleTime) {
        toDestroy.push(canvas)
      } else {
        activeCanvases.push(canvas)
      }
    })

    // 更新空闲池
    this.idleCanvases = activeCanvases

    // 销毁超时画布
    toDestroy.forEach(canvas => this.destroyCanvas(canvas))

    // 根据使用情况调整池大小
    this.adjustPoolSize()

    this.updateStats()
  }

  /**
   * 调整池大小
   */
  private adjustPoolSize(): void {
    const hitRate = this.stats.hitRate
    const currentSize = this.idleCanvases.length

    if (hitRate < 0.5 && currentSize < this.config.maxPoolSize) {
      // 命中率低，增加池大小
      const newCanvases = Math.min(5, this.config.maxPoolSize - currentSize)
      for (let i = 0; i < newCanvases; i++) {
        const canvas = this.createCanvas(300, 300, false)
        this.idleCanvases.push(canvas)
      }
    } else if (hitRate > 0.9 && currentSize > this.config.initialPoolSize) {
      // 命中率很高，可以减少池大小
      const toRemove = Math.min(3, currentSize - this.config.initialPoolSize)
      const removed = this.idleCanvases.splice(0, toRemove)
      removed.forEach(canvas => this.destroyCanvas(canvas))
    }
  }

  /**
   * 处理内存压力
   */
  private handleMemoryPressure(): void {
    console.warn('Memory pressure detected, cleaning up canvas pool')

    // 清理所有空闲画布
    const toDestroy = [...this.idleCanvases]
    this.idleCanvases = []
    toDestroy.forEach(canvas => this.destroyCanvas(canvas))

    // 触发垃圾回收（如果可能）
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc()
    }

    this.updateStats()
  }

  /**
   * 获取内存使用量（估算）
   */
  private getMemoryUsage(): number {
    let totalBytes = 0

    // 计算所有画布的内存使用
    const allCanvases = [...this.idleCanvases, ...this.activeCanvases]
    allCanvases.forEach(canvas => {
      // 每个像素 4 字节（RGBA）
      totalBytes += canvas.width * canvas.height * 4
    })

    // 转换为 MB
    return totalBytes / (1024 * 1024)
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.activeCount = this.activeCanvases.size
    this.stats.idleCount = this.idleCanvases.length
    this.stats.memoryUsage = this.getMemoryUsage()
    this.stats.hitRate = this.requestCount > 0 ? this.hitCount / this.requestCount : 0
  }

  /**
   * 获取统计信息
   */
  getStats(): CanvasPoolStats {
    return { ...this.stats }
  }

  /**
   * 清空对象池
   */
  clear(): void {
    // 清理所有画布
    const allCanvases = [...this.idleCanvases, ...this.activeCanvases]
    allCanvases.forEach(canvas => this.destroyCanvas(canvas))

    this.idleCanvases = []
    this.activeCanvases.clear()

    // 重置统计
    this.requestCount = 0
    this.hitCount = 0

    this.updateStats()
  }

  /**
   * 销毁对象池
   */
  dispose(): void {
    // 停止自动清理
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 移除内存压力监听
    if (this.memoryPressureCallback && 'memory' in performance) {
      try {
        (performance.memory as any).removeEventListener('pressure', this.memoryPressureCallback)
      } catch (error) {
        // 忽略错误
      }
    }

    // 清空对象池
    this.clear()
  }
}

/**
 * 创建 Canvas 对象池
 */
export function createCanvasPool(config?: Partial<CanvasPoolConfig>): CanvasPool {
  return new CanvasPool(config)
}

/**
 * 全局 Canvas 对象池实例
 */
let globalCanvasPool: CanvasPool | null = null

/**
 * 获取全局 Canvas 对象池
 */
export function getGlobalCanvasPool(): CanvasPool {
  if (!globalCanvasPool) {
    globalCanvasPool = createCanvasPool({
      maxPoolSize: 100,
      initialPoolSize: 10,
      enableOffscreenCanvas: true,
      autoCleanup: true
    })
  }
  return globalCanvasPool
}

/**
 * 销毁全局 Canvas 对象池
 */
export function destroyGlobalCanvasPool(): void {
  if (globalCanvasPool) {
    globalCanvasPool.dispose()
    globalCanvasPool = null
  }
}