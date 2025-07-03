# Canvas 性能优化系统

这是一个专业级的 Canvas 渲染性能优化系统，参考了 Sketch 和 Figma 的实现方案，提供了完整的虚拟化渲染、调度管理、资源池化和性能监控功能。

## 核心模块

### 1. 虚拟化渲染器 (VirtualRenderer)

只渲染视口内的元素，支持分层渲染和脏矩形优化。

**主要特性：**
- 视口裁剪：只渲染可见元素
- 分层渲染：支持多层独立渲染
- 脏矩形优化：只重绘变化区域
- 离屏画布：使用 OffscreenCanvas 提升性能
- 缓存机制：静态元素自动缓存

**使用示例：**
```typescript
import { createVirtualRenderer } from '@/features/canvas/performance'

const renderer = createVirtualRenderer({
  viewportPadding: 100,
  enableLayering: true,
  enableDirtyRectangles: true,
  enableOffscreenCanvas: true,
  layerConfigs: [
    { layerIndex: 0, useOffscreen: true, cacheStrategy: 'static' },
    { layerIndex: 1, useOffscreen: true, cacheStrategy: 'dynamic' },
    { layerIndex: 2, useOffscreen: false, cacheStrategy: 'none' }
  ]
})

// 添加元素
renderer.addElement({
  id: 'element-1',
  bounds: { left: 0, top: 0, right: 100, bottom: 100 },
  layer: 0
}, (element, ctx) => {
  // 自定义渲染逻辑
  ctx.fillRect(element.bounds.left, element.bounds.top, 100, 100)
})

// 更新视口
renderer.updateViewport({
  x: 0,
  y: 0,
  width: 800,
  height: 600,
  scale: 1
})

// 渲染到画布
const canvas = document.getElementById('canvas') as HTMLCanvasElement
await renderer.render(canvas)

// 获取性能统计
const stats = renderer.getStats()
console.log(`渲染元素: ${stats.renderedElements}/${stats.totalElements}`)
console.log(`缓存命中率: ${(stats.cacheHitRate * 100).toFixed(2)}%`)
```

### 2. 渲染调度器 (RenderScheduler)

实现优先级队列、帧率控制和批量更新。

**主要特性：**
- 优先级调度：immediate > high > normal > low > idle
- 自适应帧率：根据性能动态调整
- 批量处理：优化渲染性能
- 空闲时间利用：使用 requestIdleCallback
- 重试机制：失败任务自动重试

**使用示例：**
```typescript
import { createRenderScheduler, createRenderTask } from '@/features/canvas/performance'

const scheduler = createRenderScheduler({
  targetFPS: 60,
  enableIdleCallback: true,
  enableAdaptiveFPS: true,
  minFPS: 30,
  maxFPS: 120
})

// 调度高优先级任务
scheduler.scheduleTask(createRenderTask(
  'render-critical',
  async () => {
    // 关键渲染逻辑
  },
  'high'
))

// 批量调度任务
const tasks = elements.map(element => 
  createRenderTask(
    `render-${element.id}`,
    () => renderElement(element),
    'normal',
    {
      deadline: Date.now() + 1000,
      onComplete: () => console.log(`Element ${element.id} rendered`),
      onError: (error) => console.error(`Failed to render ${element.id}:`, error)
    }
  )
)
scheduler.scheduleBatch(tasks)

// 监控调度状态
const stats = scheduler.getStats()
console.log(`队列长度: ${stats.queueLength}`)
console.log(`平均 FPS: ${stats.averageFPS}`)
```

### 3. Canvas 对象池 (CanvasPool)

复用 Canvas 元素，优化内存使用。

**主要特性：**
- 对象复用：减少 GC 压力
- 自动清理：定期清理闲置对象
- 内存管理：监控内存压力
- 智能调整：根据使用情况调整池大小
- 支持离屏画布：OffscreenCanvas 池化

**使用示例：**
```typescript
import { getGlobalCanvasPool } from '@/features/canvas/performance'

const pool = getGlobalCanvasPool()

// 获取画布
const canvas1 = pool.acquire(800, 600, true) // 获取离屏画布
const canvas2 = pool.acquire(400, 300, false) // 获取普通画布

// 使用画布
if (canvas1.context) {
  canvas1.context.fillStyle = 'blue'
  canvas1.context.fillRect(0, 0, 100, 100)
}

// 归还画布
pool.release(canvas1)
pool.release(canvas2)

// 批量操作
const canvases = pool.acquireBatch(10, 200, 200, true)
// ... 使用画布
pool.releaseBatch(canvases)

// 查看统计
const stats = pool.getStats()
console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(2)}%`)
console.log(`内存使用: ${stats.memoryUsage.toFixed(2)} MB`)
```

### 4. 性能监控器 (PerformanceMonitor)

提供详细的性能指标监控和分析。

**主要特性：**
- FPS 监控：实时帧率统计
- 内存监控：JS 堆使用情况
- 渲染分析：帧时间、脚本时间等
- 性能评分：0-100 分性能打分
- 智能建议：性能优化建议
- 事件记录：性能异常事件

**使用示例：**
```typescript
import { getGlobalPerformanceMonitor } from '@/features/canvas/performance'

const monitor = getGlobalPerformanceMonitor()

// 开始监控
monitor.start()

// 标记帧渲染
monitor.markFrameStart()
// ... 渲染逻辑
monitor.markFrameEnd()

// 更新元素统计
monitor.updateElementStats({
  total: 1000,
  visible: 200,
  cached: 150,
  rendered: 50
})

// 添加监听器
monitor.addListener((metrics) => {
  console.log(`FPS: ${metrics.fps.current}`)
  console.log(`内存使用: ${metrics.memory.usagePercentage.toFixed(2)}%`)
  console.log(`性能分数: ${metrics.performance.score}`)
  
  if (metrics.performance.suggestions.length > 0) {
    console.log('优化建议:', metrics.performance.suggestions)
  }
})

// 生成报告
const report = monitor.generateReport()
console.log('性能报告:', report)

// 导出报告
const jsonReport = monitor.exportReport('json')
const csvReport = monitor.exportReport('csv')
```

## 集成使用

创建完整的性能优化系统：

```typescript
import { createCanvasPerformanceSystem } from '@/features/canvas/performance'
import { useCanvasStore } from '@/features/canvas/store'

// 创建性能系统
const performanceSystem = createCanvasPerformanceSystem({
  virtualRenderer: {
    viewportPadding: 200,
    enableLayering: true,
    maxConcurrentRenders: 4
  },
  renderScheduler: {
    targetFPS: 60,
    enableAdaptiveFPS: true
  }
})

// 与 Canvas Store 集成
const canvasStore = useCanvasStore.getState()

// 监听元素变化，更新虚拟渲染器
canvasStore.subscribe((state) => {
  state.elements.forEach(element => {
    performanceSystem.virtualRenderer.updateElement(element.id, {
      bounds: element.bounds,
      isDirty: true
    })
  })
})

// 渲染循环
function renderLoop() {
  performanceSystem.performanceMonitor.markFrameStart()
  
  // 使用调度器安排渲染任务
  performanceSystem.renderScheduler.scheduleTask({
    id: 'main-render',
    priority: 'high',
    execute: async () => {
      const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
      await performanceSystem.virtualRenderer.render(canvas)
    }
  })
  
  performanceSystem.performanceMonitor.markFrameEnd()
  
  requestAnimationFrame(renderLoop)
}

// 启动渲染
renderLoop()
```

## 性能优化建议

### 1. 分层策略
- **背景层**：静态背景，使用 'static' 缓存策略
- **内容层**：主要内容，使用 'dynamic' 缓存策略
- **交互层**：鼠标悬停、选中等，不缓存

### 2. 渲染优先级
- **immediate**：用户交互反馈（如拖拽）
- **high**：视口内的重要元素
- **normal**：常规渲染任务
- **low**：视口外的预渲染
- **idle**：缓存生成、预计算等

### 3. 内存管理
- 设置合理的对象池大小
- 定期清理未使用的缓存
- 监控内存使用情况
- 响应内存压力事件

### 4. 性能监控
- 设定性能基准线
- 持续监控关键指标
- 定期生成性能报告
- 根据建议优化代码

## 最佳实践

1. **渐进式启用**：根据元素数量和复杂度逐步启用优化功能
2. **合理分层**：避免过多层级，通常 3-5 层足够
3. **批量更新**：收集多个更新操作，批量执行
4. **懒加载**：只在需要时创建和渲染元素
5. **资源管理**：及时释放不再使用的资源

## 性能指标参考

| 元素数量 | 推荐配置 | 预期性能 |
|---------|---------|---------|
| < 100 | 基础配置 | 60 FPS |
| 100-1000 | 启用虚拟化 | 50-60 FPS |
| 1000-10000 | 完整优化 | 30-50 FPS |
| > 10000 | 自定义优化 | 需要特殊处理 |

## 故障排除

### 性能下降
1. 检查脏矩形区域是否过大
2. 确认缓存策略是否合理
3. 查看是否有内存泄漏

### 渲染异常
1. 检查视口计算是否正确
2. 确认元素边界是否有效
3. 查看离屏画布支持情况

### 内存问题
1. 减小对象池大小
2. 缩短缓存时间
3. 启用内存压力处理