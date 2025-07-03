/**
 * 性能监控增强
 * 提供 FPS、内存、渲染时间等详细性能指标监控
 * 参考 Chrome DevTools 和 Figma 的性能分析工具
 */

export interface PerformanceMetrics {
  fps: {
    current: number
    average: number
    min: number
    max: number
    history: number[]
  }
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
    usagePercentage: number
  }
  rendering: {
    frameTime: number
    paintTime: number
    layoutTime: number
    scriptTime: number
    idleTime: number
  }
  elements: {
    total: number
    visible: number
    cached: number
    rendered: number
  }
  performance: {
    score: number // 0-100
    bottleneck: 'cpu' | 'memory' | 'gpu' | 'none'
    suggestions: string[]
  }
}

export interface PerformanceMonitorConfig {
  enableFPSMonitoring: boolean
  enableMemoryMonitoring: boolean
  enableRenderingMetrics: boolean
  sampleRate: number // ms
  historySize: number
  performanceThresholds: {
    minFPS: number
    maxFrameTime: number
    maxMemoryUsage: number // percentage
  }
  enableAutoReport: boolean
  reportInterval: number // ms
}

export interface PerformanceReport {
  timestamp: number
  duration: number
  metrics: PerformanceMetrics
  events: PerformanceEvent[]
  summary: {
    averageFPS: number
    peakMemoryUsage: number
    totalRenderTime: number
    performanceScore: number
  }
}

export interface PerformanceEvent {
  type: 'fps_drop' | 'memory_spike' | 'long_frame' | 'gc_pause'
  timestamp: number
  severity: 'low' | 'medium' | 'high'
  details: Record<string, any>
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig
  private metrics: PerformanceMetrics
  private events: PerformanceEvent[] = []
  private isMonitoring: boolean = false
  private monitoringInterval: number | null = null
  private reportInterval: number | null = null
  private frameStartTime: number = 0
  private lastFrameTime: number = 0
  private observers: Map<string, PerformanceObserver> = new Map()
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set()
  private rafHandle: number | null = null

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      enableFPSMonitoring: true,
      enableMemoryMonitoring: true,
      enableRenderingMetrics: true,
      sampleRate: 100, // 100ms
      historySize: 60,
      performanceThresholds: {
        minFPS: 30,
        maxFrameTime: 33.33, // 30 FPS
        maxMemoryUsage: 80
      },
      enableAutoReport: false,
      reportInterval: 60000, // 1 分钟
      ...config
    }

    // 初始化指标
    this.metrics = this.createInitialMetrics()

    // 设置性能观察器
    this.setupPerformanceObservers()
  }

  /**
   * 创建初始指标
   */
  private createInitialMetrics(): PerformanceMetrics {
    return {
      fps: {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        history: []
      },
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usagePercentage: 0
      },
      rendering: {
        frameTime: 0,
        paintTime: 0,
        layoutTime: 0,
        scriptTime: 0,
        idleTime: 0
      },
      elements: {
        total: 0,
        visible: 0,
        cached: 0,
        rendered: 0
      },
      performance: {
        score: 100,
        bottleneck: 'none',
        suggestions: []
      }
    }
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return

    // 监控长任务
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // 超过 50ms 的任务
            this.recordEvent({
              type: 'long_frame',
              timestamp: entry.startTime,
              severity: entry.duration > 100 ? 'high' : 'medium',
              details: {
                duration: entry.duration,
                name: entry.name
              }
            })
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.set('longtask', longTaskObserver)
    } catch (error) {
      console.warn('Long task monitoring not supported')
    }

    // 监控渲染性能
    if (this.config.enableRenderingMetrics) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-paint' || entry.name === 'first-contentful-paint') {
              this.metrics.rendering.paintTime = entry.startTime
            }
          }
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.set('paint', paintObserver)
      } catch (error) {
        console.warn('Paint timing not supported')
      }
    }
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // 开始 FPS 监控
    if (this.config.enableFPSMonitoring) {
      this.startFPSMonitoring()
    }

    // 开始定期采样
    this.monitoringInterval = window.setInterval(() => {
      this.sample()
    }, this.config.sampleRate)

    // 开始自动报告
    if (this.config.enableAutoReport) {
      this.reportInterval = window.setInterval(() => {
        this.generateReport()
      }, this.config.reportInterval)
    }
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.isMonitoring = false

    // 停止 FPS 监控
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle)
      this.rafHandle = null
    }

    // 停止定期采样
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // 停止自动报告
    if (this.reportInterval !== null) {
      clearInterval(this.reportInterval)
      this.reportInterval = null
    }

    // 断开观察器
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }

  /**
   * 开始 FPS 监控
   */
  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (!this.isMonitoring) return

      if (this.lastFrameTime > 0) {
        const deltaTime = timestamp - this.lastFrameTime
        const currentFPS = Math.round(1000 / deltaTime)

        // 更新 FPS 指标
        this.updateFPSMetrics(currentFPS)

        // 检测 FPS 下降
        if (currentFPS < this.config.performanceThresholds.minFPS) {
          this.recordEvent({
            type: 'fps_drop',
            timestamp: timestamp,
            severity: currentFPS < 20 ? 'high' : 'medium',
            details: {
              fps: currentFPS,
              threshold: this.config.performanceThresholds.minFPS
            }
          })
        }
      }

      this.lastFrameTime = timestamp
      this.rafHandle = requestAnimationFrame(measureFPS)
    }

    this.rafHandle = requestAnimationFrame(measureFPS)
  }

  /**
   * 更新 FPS 指标
   */
  private updateFPSMetrics(currentFPS: number): void {
    const fps = this.metrics.fps

    fps.current = currentFPS
    fps.history.push(currentFPS)

    // 保持历史记录大小
    if (fps.history.length > this.config.historySize) {
      fps.history.shift()
    }

    // 计算统计值
    if (fps.history.length > 0) {
      fps.average = Math.round(
        fps.history.reduce((sum, val) => sum + val, 0) / fps.history.length
      )
      fps.min = Math.min(...fps.history)
      fps.max = Math.max(...fps.history)
    }
  }

  /**
   * 采样
   */
  private sample(): void {
    // 采样内存使用
    if (this.config.enableMemoryMonitoring) {
      this.sampleMemory()
    }

    // 采样渲染指标
    if (this.config.enableRenderingMetrics) {
      this.sampleRendering()
    }

    // 计算性能分数
    this.calculatePerformanceScore()

    // 通知监听器
    this.notifyListeners()
  }

  /**
   * 采样内存使用
   */
  private sampleMemory(): void {
    if (!('memory' in performance)) return

    const memory = (performance as any).memory
    this.metrics.memory = {
      usedJSHeapSize: memory.usedJSHeapSize / 1048576, // 转换为 MB
      totalJSHeapSize: memory.totalJSHeapSize / 1048576,
      jsHeapSizeLimit: memory.jsHeapSizeLimit / 1048576,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }

    // 检测内存峰值
    if (this.metrics.memory.usagePercentage > this.config.performanceThresholds.maxMemoryUsage) {
      this.recordEvent({
        type: 'memory_spike',
        timestamp: Date.now(),
        severity: 'high',
        details: {
          usage: this.metrics.memory.usagePercentage,
          threshold: this.config.performanceThresholds.maxMemoryUsage
        }
      })
    }
  }

  /**
   * 采样渲染指标
   */
  private sampleRendering(): void {
    // 获取导航时间
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) return

    // 使用 Performance API 获取渲染时间
    const paintEntries = performance.getEntriesByType('paint')
    const measureEntries = performance.getEntriesByType('measure')

    // 计算各种时间
    let frameTime = 0
    let scriptTime = 0

    measureEntries.forEach(entry => {
      if (entry.name.includes('frame')) {
        frameTime += entry.duration
      } else if (entry.name.includes('script')) {
        scriptTime += entry.duration
      }
    })

    this.metrics.rendering.frameTime = frameTime
    this.metrics.rendering.scriptTime = scriptTime
    
    // 计算空闲时间
    const totalTime = performance.now() - this.frameStartTime
    this.metrics.rendering.idleTime = Math.max(0, totalTime - frameTime - scriptTime)
  }

  /**
   * 计算性能分数
   */
  private calculatePerformanceScore(): void {
    let score = 100
    const weights = {
      fps: 0.4,
      memory: 0.3,
      frameTime: 0.3
    }

    // FPS 分数
    const fpsRatio = this.metrics.fps.average / 60
    const fpsScore = Math.min(100, fpsRatio * 100)
    score -= (100 - fpsScore) * weights.fps

    // 内存分数
    const memoryScore = Math.max(0, 100 - this.metrics.memory.usagePercentage)
    score -= (100 - memoryScore) * weights.memory

    // 帧时间分数
    const frameTimeRatio = this.config.performanceThresholds.maxFrameTime / 
                          (this.metrics.rendering.frameTime || 16.67)
    const frameTimeScore = Math.min(100, frameTimeRatio * 100)
    score -= (100 - frameTimeScore) * weights.frameTime

    this.metrics.performance.score = Math.round(Math.max(0, score))

    // 确定瓶颈
    this.identifyBottleneck()

    // 生成建议
    this.generateSuggestions()
  }

  /**
   * 识别性能瓶颈
   */
  private identifyBottleneck(): void {
    const { fps, memory, rendering } = this.metrics

    if (fps.average < 30) {
      if (rendering.scriptTime > rendering.frameTime * 0.6) {
        this.metrics.performance.bottleneck = 'cpu'
      } else {
        this.metrics.performance.bottleneck = 'gpu'
      }
    } else if (memory.usagePercentage > 80) {
      this.metrics.performance.bottleneck = 'memory'
    } else {
      this.metrics.performance.bottleneck = 'none'
    }
  }

  /**
   * 生成性能建议
   */
  private generateSuggestions(): void {
    const suggestions: string[] = []
    const { fps, memory, elements } = this.metrics

    if (fps.average < 30) {
      suggestions.push('考虑减少渲染元素数量或启用虚拟化渲染')
    }

    if (fps.min < 20) {
      suggestions.push('检测到严重的帧率下降，建议优化复杂的渲染操作')
    }

    if (memory.usagePercentage > 70) {
      suggestions.push('内存使用率较高，建议清理未使用的资源')
    }

    if (elements.visible > 1000) {
      suggestions.push('可见元素数量过多，建议使用视口裁剪或 LOD 技术')
    }

    if (elements.cached < elements.rendered * 0.5) {
      suggestions.push('缓存命中率较低，考虑增加缓存策略')
    }

    this.metrics.performance.suggestions = suggestions
  }

  /**
   * 记录事件
   */
  private recordEvent(event: PerformanceEvent): void {
    this.events.push(event)

    // 保持事件历史大小
    if (this.events.length > 1000) {
      this.events.shift()
    }
  }

  /**
   * 更新元素统计
   */
  updateElementStats(stats: Partial<PerformanceMetrics['elements']>): void {
    Object.assign(this.metrics.elements, stats)
  }

  /**
   * 标记帧开始
   */
  markFrameStart(): void {
    this.frameStartTime = performance.now()
  }

  /**
   * 标记帧结束
   */
  markFrameEnd(): void {
    const frameTime = performance.now() - this.frameStartTime
    this.metrics.rendering.frameTime = frameTime

    if (frameTime > this.config.performanceThresholds.maxFrameTime) {
      this.recordEvent({
        type: 'long_frame',
        timestamp: Date.now(),
        severity: frameTime > 50 ? 'high' : 'medium',
        details: {
          duration: frameTime,
          threshold: this.config.performanceThresholds.maxFrameTime
        }
      })
    }
  }

  /**
   * 添加监听器
   */
  addListener(callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.add(callback)
  }

  /**
   * 移除监听器
   */
  removeListener(callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.delete(callback)
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.getMetrics())
      } catch (error) {
        console.error('Performance monitor callback error:', error)
      }
    })
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return JSON.parse(JSON.stringify(this.metrics))
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      duration: this.events.length > 0 
        ? Date.now() - this.events[0].timestamp 
        : 0,
      metrics: this.getMetrics(),
      events: [...this.events],
      summary: {
        averageFPS: this.metrics.fps.average,
        peakMemoryUsage: Math.max(
          ...this.metrics.memory.usagePercentage,
          this.metrics.memory.usagePercentage
        ),
        totalRenderTime: this.metrics.rendering.frameTime * this.metrics.fps.history.length,
        performanceScore: this.metrics.performance.score
      }
    }

    // 清空事件历史
    this.events = []

    return report
  }

  /**
   * 导出报告
   */
  exportReport(format: 'json' | 'csv' = 'json'): string {
    const report = this.generateReport()

    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    } else {
      // CSV 格式
      const headers = ['Timestamp', 'FPS', 'Memory Usage', 'Frame Time', 'Performance Score']
      const rows = [headers.join(',')]

      // 添加数据行
      rows.push([
        report.timestamp,
        report.summary.averageFPS,
        report.metrics.memory.usagePercentage.toFixed(2),
        report.metrics.rendering.frameTime.toFixed(2),
        report.summary.performanceScore
      ].join(','))

      return rows.join('\n')
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop()
    this.callbacks.clear()
    this.events = []
  }
}

/**
 * 创建性能监控器
 */
export function createPerformanceMonitor(
  config?: Partial<PerformanceMonitorConfig>
): PerformanceMonitor {
  return new PerformanceMonitor(config)
}

/**
 * 全局性能监控器实例
 */
let globalMonitor: PerformanceMonitor | null = null

/**
 * 获取全局性能监控器
 */
export function getGlobalPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = createPerformanceMonitor({
      enableFPSMonitoring: true,
      enableMemoryMonitoring: true,
      enableRenderingMetrics: true,
      enableAutoReport: false
    })
  }
  return globalMonitor
}

/**
 * 销毁全局性能监控器
 */
export function destroyGlobalPerformanceMonitor(): void {
  if (globalMonitor) {
    globalMonitor.dispose()
    globalMonitor = null
  }
}