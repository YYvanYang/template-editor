/**
 * Canvas 性能优化模块
 * 导出所有性能相关的工具和组件
 */

export * from './virtual-renderer'
export * from './render-scheduler'
export * from './canvas-pool'
export * from './performance-monitor'

// 导出便捷的集成接口
import { VirtualRenderer, createVirtualRenderer } from './virtual-renderer'
import { RenderScheduler, createRenderScheduler } from './render-scheduler'
import { CanvasPool, getGlobalCanvasPool } from './canvas-pool'
import { PerformanceMonitor, getGlobalPerformanceMonitor } from './performance-monitor'

export interface CanvasPerformanceSystem {
  virtualRenderer: VirtualRenderer
  renderScheduler: RenderScheduler
  canvasPool: CanvasPool
  performanceMonitor: PerformanceMonitor
}

/**
 * 创建完整的性能优化系统
 */
export function createCanvasPerformanceSystem(config?: {
  virtualRenderer?: Parameters<typeof createVirtualRenderer>[0]
  renderScheduler?: Parameters<typeof createRenderScheduler>[0]
  canvasPool?: Parameters<typeof getGlobalCanvasPool>[0]
  performanceMonitor?: Parameters<typeof getGlobalPerformanceMonitor>[0]
}): CanvasPerformanceSystem {
  const system: CanvasPerformanceSystem = {
    virtualRenderer: createVirtualRenderer(config?.virtualRenderer),
    renderScheduler: createRenderScheduler(config?.renderScheduler),
    canvasPool: getGlobalCanvasPool(),
    performanceMonitor: getGlobalPerformanceMonitor()
  }

  // 集成性能监控
  system.renderScheduler.addListener((metrics) => {
    system.performanceMonitor.updateElementStats({
      total: metrics.queueLength + metrics.processingTasks,
      rendered: metrics.completedTasks
    })
  })

  return system
}

/**
 * 销毁性能系统
 */
export function disposeCanvasPerformanceSystem(system: CanvasPerformanceSystem): void {
  system.virtualRenderer.dispose()
  system.renderScheduler.dispose()
  system.canvasPool.dispose()
  system.performanceMonitor.dispose()
}