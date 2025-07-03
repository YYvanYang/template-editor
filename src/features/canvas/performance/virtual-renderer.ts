/**
 * 虚拟化渲染器
 * 参考 Figma 和 Sketch 的渲染优化策略
 * 只渲染视口内的元素，支持分层渲染和脏矩形优化
 */

import type { Bounds } from '@/shared/types'

export interface VirtualElement {
  id: string
  bounds: Bounds
  layer: number
  isDirty?: boolean
  lastRenderTime?: number
  cachedImage?: ImageBitmap | null
}

export interface ViewportInfo {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export interface RenderLayerConfig {
  layerIndex: number
  useOffscreen: boolean
  cacheStrategy: 'none' | 'static' | 'dynamic'
  maxCacheSize?: number
}

export interface VirtualRendererConfig {
  viewportPadding: number
  enableLayering: boolean
  enableDirtyRectangles: boolean
  enableOffscreenCanvas: boolean
  layerConfigs?: RenderLayerConfig[]
  maxConcurrentRenders: number
  renderBatchSize: number
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  totalElements: number
  visibleElements: number
  renderedElements: number
  cachedElements: number
  renderTime: number
  cacheHitRate: number
}

/**
 * 虚拟化渲染器类
 */
export class VirtualRenderer {
  private config: VirtualRendererConfig
  private elements: Map<string, VirtualElement> = new Map()
  private viewport: ViewportInfo = { x: 0, y: 0, width: 0, height: 0, scale: 1 }
  private layerCanvases: Map<number, OffscreenCanvas> = new Map()
  private dirtyRegions: Set<Bounds> = new Set()
  private renderStats: RenderStats = {
    totalElements: 0,
    visibleElements: 0,
    renderedElements: 0,
    cachedElements: 0,
    renderTime: 0,
    cacheHitRate: 0
  }
  private renderCallbacks: Map<string, (element: VirtualElement, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void> = new Map()
  private cacheStats = {
    hits: 0,
    misses: 0,
    total: 0
  }

  constructor(config: Partial<VirtualRendererConfig> = {}) {
    this.config = {
      viewportPadding: 100,
      enableLayering: true,
      enableDirtyRectangles: true,
      enableOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      maxConcurrentRenders: 4,
      renderBatchSize: 50,
      ...config
    }

    // 初始化层级画布
    if (this.config.enableLayering && this.config.layerConfigs) {
      this.initializeLayerCanvases()
    }
  }

  /**
   * 初始化层级画布
   */
  private initializeLayerCanvases(): void {
    if (!this.config.enableOffscreenCanvas) return

    this.config.layerConfigs?.forEach(layerConfig => {
      if (layerConfig.useOffscreen) {
        const offscreen = new OffscreenCanvas(
          this.viewport.width || 1920,
          this.viewport.height || 1080
        )
        this.layerCanvases.set(layerConfig.layerIndex, offscreen)
      }
    })
  }

  /**
   * 添加元素
   */
  addElement(element: VirtualElement, renderCallback: (element: VirtualElement, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void): void {
    this.elements.set(element.id, element)
    this.renderCallbacks.set(element.id, renderCallback)
    this.markDirty(element.bounds)
    this.updateStats()
  }

  /**
   * 更新元素
   */
  updateElement(id: string, updates: Partial<VirtualElement>): void {
    const element = this.elements.get(id)
    if (!element) return

    // 标记旧区域为脏
    this.markDirty(element.bounds)

    // 更新元素
    Object.assign(element, updates)
    element.isDirty = true

    // 清除缓存
    if (element.cachedImage) {
      element.cachedImage = null
    }

    // 标记新区域为脏
    if (updates.bounds) {
      this.markDirty(updates.bounds)
    }
  }

  /**
   * 移除元素
   */
  removeElement(id: string): void {
    const element = this.elements.get(id)
    if (!element) return

    this.markDirty(element.bounds)
    
    // 清理缓存
    if (element.cachedImage) {
      element.cachedImage = null
    }

    this.elements.delete(id)
    this.renderCallbacks.delete(id)
    this.updateStats()
  }

  /**
   * 更新视口
   */
  updateViewport(viewport: ViewportInfo): void {
    const viewportChanged = 
      this.viewport.x !== viewport.x ||
      this.viewport.y !== viewport.y ||
      this.viewport.width !== viewport.width ||
      this.viewport.height !== viewport.height ||
      this.viewport.scale !== viewport.scale

    if (viewportChanged) {
      this.viewport = { ...viewport }
      
      // 调整层级画布大小
      if (this.config.enableLayering && this.config.enableOffscreenCanvas) {
        this.layerCanvases.forEach(canvas => {
          canvas.width = viewport.width
          canvas.height = viewport.height
        })
      }

      // 视口变化时，重新计算可见元素
      this.updateStats()
    }
  }

  /**
   * 标记脏区域
   */
  private markDirty(bounds: Bounds): void {
    if (!this.config.enableDirtyRectangles) {
      // 如果不启用脏矩形，标记整个视口为脏
      this.dirtyRegions.clear()
      this.dirtyRegions.add({
        left: this.viewport.x,
        top: this.viewport.y,
        right: this.viewport.x + this.viewport.width,
        bottom: this.viewport.y + this.viewport.height
      })
      return
    }

    // 合并相邻的脏区域
    let merged = false
    const newRegion = { ...bounds }

    this.dirtyRegions.forEach(region => {
      if (this.intersects(region, newRegion)) {
        // 合并区域
        region.left = Math.min(region.left, newRegion.left)
        region.top = Math.min(region.top, newRegion.top)
        region.right = Math.max(region.right, newRegion.right)
        region.bottom = Math.max(region.bottom, newRegion.bottom)
        merged = true
      }
    })

    if (!merged) {
      this.dirtyRegions.add(newRegion)
    }
  }

  /**
   * 渲染
   */
  async render(targetCanvas: HTMLCanvasElement): Promise<void> {
    const startTime = performance.now()
    const ctx = targetCanvas.getContext('2d')
    if (!ctx) return

    // 获取可见元素
    const visibleElements = this.getVisibleElements()
    
    // 按层级分组
    const elementsByLayer = this.groupElementsByLayer(visibleElements)

    // 清除脏区域
    if (this.config.enableDirtyRectangles && this.dirtyRegions.size > 0) {
      this.clearDirtyRegions(ctx)
    } else {
      // 清除整个画布
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
    }

    // 分层渲染
    if (this.config.enableLayering) {
      await this.renderLayers(ctx, elementsByLayer)
    } else {
      // 直接渲染所有元素
      await this.renderElements(ctx, visibleElements)
    }

    // 清空脏区域
    this.dirtyRegions.clear()

    // 更新统计
    const renderTime = performance.now() - startTime
    this.renderStats.renderTime = renderTime
    this.renderStats.renderedElements = visibleElements.length
    this.renderStats.cacheHitRate = this.cacheStats.total > 0 
      ? this.cacheStats.hits / this.cacheStats.total 
      : 0
  }

  /**
   * 获取可见元素
   */
  private getVisibleElements(): VirtualElement[] {
    const padding = this.config.viewportPadding
    const viewportBounds: Bounds = {
      left: this.viewport.x - padding,
      top: this.viewport.y - padding,
      right: this.viewport.x + this.viewport.width + padding,
      bottom: this.viewport.y + this.viewport.height + padding
    }

    const visibleElements: VirtualElement[] = []
    this.elements.forEach(element => {
      if (this.intersects(element.bounds, viewportBounds)) {
        visibleElements.push(element)
      }
    })

    return visibleElements
  }

  /**
   * 按层级分组元素
   */
  private groupElementsByLayer(elements: VirtualElement[]): Map<number, VirtualElement[]> {
    const groups = new Map<number, VirtualElement[]>()
    
    elements.forEach(element => {
      const layer = element.layer || 0
      if (!groups.has(layer)) {
        groups.set(layer, [])
      }
      groups.get(layer)!.push(element)
    })

    return groups
  }

  /**
   * 清除脏区域
   */
  private clearDirtyRegions(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    
    // 设置裁剪区域
    ctx.beginPath()
    this.dirtyRegions.forEach(region => {
      ctx.rect(
        region.left - this.viewport.x,
        region.top - this.viewport.y,
        region.right - region.left,
        region.bottom - region.top
      )
    })
    ctx.clip()

    // 清除裁剪区域
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    ctx.restore()
  }

  /**
   * 分层渲染
   */
  private async renderLayers(
    ctx: CanvasRenderingContext2D,
    elementsByLayer: Map<number, VirtualElement[]>
  ): Promise<void> {
    // 按层级顺序渲染
    const sortedLayers = Array.from(elementsByLayer.keys()).sort((a, b) => a - b)

    for (const layer of sortedLayers) {
      const elements = elementsByLayer.get(layer)!
      const layerCanvas = this.layerCanvases.get(layer)

      if (layerCanvas && this.config.enableOffscreenCanvas) {
        // 使用离屏画布渲染
        const offscreenCtx = layerCanvas.getContext('2d')
        if (offscreenCtx) {
          offscreenCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height)
          await this.renderElements(offscreenCtx, elements)
          
          // 将离屏画布绘制到主画布
          ctx.drawImage(layerCanvas, 0, 0)
        }
      } else {
        // 直接渲染到主画布
        await this.renderElements(ctx, elements)
      }
    }
  }

  /**
   * 渲染元素
   */
  private async renderElements(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    elements: VirtualElement[]
  ): Promise<void> {
    // 批量渲染以提高性能
    const batches = this.createRenderBatches(elements)

    for (const batch of batches) {
      await this.renderBatch(ctx, batch)
    }
  }

  /**
   * 创建渲染批次
   */
  private createRenderBatches(elements: VirtualElement[]): VirtualElement[][] {
    const batches: VirtualElement[][] = []
    const batchSize = this.config.renderBatchSize

    for (let i = 0; i < elements.length; i += batchSize) {
      batches.push(elements.slice(i, i + batchSize))
    }

    return batches
  }

  /**
   * 渲染批次
   */
  private async renderBatch(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    batch: VirtualElement[]
  ): Promise<void> {
    const renderPromises = batch.map(element => this.renderElement(ctx, element))
    await Promise.all(renderPromises)
  }

  /**
   * 渲染单个元素
   */
  private async renderElement(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    element: VirtualElement
  ): Promise<void> {
    this.cacheStats.total++

    // 检查缓存
    if (element.cachedImage && !element.isDirty) {
      this.cacheStats.hits++
      ctx.drawImage(
        element.cachedImage,
        element.bounds.left - this.viewport.x,
        element.bounds.top - this.viewport.y
      )
      return
    }

    this.cacheStats.misses++

    // 获取渲染回调
    const renderCallback = this.renderCallbacks.get(element.id)
    if (!renderCallback) return

    ctx.save()

    // 应用视口变换
    ctx.translate(-this.viewport.x, -this.viewport.y)
    ctx.scale(this.viewport.scale, this.viewport.scale)

    // 设置裁剪区域（仅渲染元素区域）
    if (this.config.enableDirtyRectangles) {
      ctx.beginPath()
      ctx.rect(
        element.bounds.left,
        element.bounds.top,
        element.bounds.right - element.bounds.left,
        element.bounds.bottom - element.bounds.top
      )
      ctx.clip()
    }

    // 执行渲染
    renderCallback(element, ctx)

    // 更新缓存（如果元素是静态的）
    if (this.shouldCache(element)) {
      await this.cacheElement(element, ctx)
    }

    element.isDirty = false
    element.lastRenderTime = performance.now()

    ctx.restore()
  }

  /**
   * 判断是否应该缓存元素
   */
  private shouldCache(element: VirtualElement): boolean {
    const layerConfig = this.config.layerConfigs?.find(
      config => config.layerIndex === (element.layer || 0)
    )

    if (!layerConfig) return false

    return layerConfig.cacheStrategy === 'static' || 
           (layerConfig.cacheStrategy === 'dynamic' && !element.isDirty)
  }

  /**
   * 缓存元素
   */
  private async cacheElement(
    element: VirtualElement,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ): Promise<void> {
    if (!this.config.enableOffscreenCanvas || typeof OffscreenCanvas === 'undefined') {
      return
    }

    try {
      const width = element.bounds.right - element.bounds.left
      const height = element.bounds.bottom - element.bounds.top

      // 创建离屏画布
      const offscreen = new OffscreenCanvas(width, height)
      const offscreenCtx = offscreen.getContext('2d')
      if (!offscreenCtx) return

      // 渲染到离屏画布
      const renderCallback = this.renderCallbacks.get(element.id)
      if (renderCallback) {
        offscreenCtx.translate(-element.bounds.left, -element.bounds.top)
        renderCallback(element, offscreenCtx)

        // 创建图像位图
        element.cachedImage = await createImageBitmap(offscreen)
        this.renderStats.cachedElements++
      }
    } catch (error) {
      console.error('Failed to cache element:', error)
      element.cachedImage = null
    }
  }

  /**
   * 判断两个矩形是否相交
   */
  private intersects(a: Bounds, b: Bounds): boolean {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    )
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.renderStats.totalElements = this.elements.size
    this.renderStats.visibleElements = this.getVisibleElements().length
  }

  /**
   * 获取渲染统计
   */
  getStats(): RenderStats {
    return { ...this.renderStats }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 清理缓存的图像
    this.elements.forEach(element => {
      if (element.cachedImage) {
        element.cachedImage = null
      }
    })

    // 清理离屏画布
    this.layerCanvases.clear()

    // 清理所有数据
    this.elements.clear()
    this.renderCallbacks.clear()
    this.dirtyRegions.clear()
  }
}

/**
 * 创建虚拟渲染器
 */
export function createVirtualRenderer(config?: Partial<VirtualRendererConfig>): VirtualRenderer {
  return new VirtualRenderer(config)
}