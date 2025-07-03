/**
 * 渲染调度器
 * 实现优先级队列、帧率控制和批量更新
 * 参考 React Fiber 和 Figma 的渲染调度策略
 */

export type RenderPriority = 'immediate' | 'high' | 'normal' | 'low' | 'idle'

export interface RenderTask {
  id: string
  priority: RenderPriority
  deadline?: number
  execute: () => void | Promise<void>
  onComplete?: () => void
  onError?: (error: Error) => void
  retryCount?: number
  maxRetries?: number
}

export interface RenderSchedulerConfig {
  targetFPS: number
  enableIdleCallback: boolean
  maxConcurrentTasks: number
  batchSize: number
  priorityBoostThreshold: number
  enableAdaptiveFPS: boolean
  minFPS: number
  maxFPS: number
}

export interface SchedulerStats {
  queueLength: number
  processingTasks: number
  completedTasks: number
  failedTasks: number
  averageFPS: number
  frameTime: number
  idleTime: number
}

/**
 * 优先级权重
 */
const PRIORITY_WEIGHTS: Record<RenderPriority, number> = {
  immediate: 1000,
  high: 100,
  normal: 10,
  low: 1,
  idle: 0
}

/**
 * 渲染调度器类
 */
export class RenderScheduler {
  private config: RenderSchedulerConfig
  private taskQueue: Map<string, RenderTask> = new Map()
  private processingTasks: Set<string> = new Set()
  private frameHandle: number | null = null
  private idleHandle: number | null = null
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private fpsHistory: number[] = []
  private stats: SchedulerStats = {
    queueLength: 0,
    processingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageFPS: 60,
    frameTime: 16.67,
    idleTime: 0
  }
  private isRunning: boolean = false
  private adaptiveFPSMultiplier: number = 1

  constructor(config: Partial<RenderSchedulerConfig> = {}) {
    this.config = {
      targetFPS: 60,
      enableIdleCallback: typeof requestIdleCallback !== 'undefined',
      maxConcurrentTasks: 4,
      batchSize: 10,
      priorityBoostThreshold: 500, // ms
      enableAdaptiveFPS: true,
      minFPS: 30,
      maxFPS: 120,
      ...config
    }

    this.lastFrameTime = performance.now()
  }

  /**
   * 调度任务
   */
  scheduleTask(task: RenderTask): void {
    // 添加到队列
    this.taskQueue.set(task.id, {
      ...task,
      retryCount: task.retryCount || 0,
      maxRetries: task.maxRetries || 3
    })

    this.updateStats()

    // 如果是立即执行的任务，直接执行
    if (task.priority === 'immediate') {
      this.executeImmediate(task)
      return
    }

    // 启动调度器
    if (!this.isRunning) {
      this.start()
    }
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): void {
    this.taskQueue.delete(taskId)
    this.processingTasks.delete(taskId)
    this.updateStats()
  }

  /**
   * 批量调度任务
   */
  scheduleBatch(tasks: RenderTask[]): void {
    tasks.forEach(task => {
      this.taskQueue.set(task.id, {
        ...task,
        retryCount: task.retryCount || 0,
        maxRetries: task.maxRetries || 3
      })
    })

    this.updateStats()

    if (!this.isRunning) {
      this.start()
    }
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.scheduleNextFrame()
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.isRunning = false

    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = null
    }

    if (this.idleHandle !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleHandle)
      this.idleHandle = null
    }
  }

  /**
   * 立即执行任务
   */
  private async executeImmediate(task: RenderTask): Promise<void> {
    try {
      this.processingTasks.add(task.id)
      await task.execute()
      
      if (task.onComplete) {
        task.onComplete()
      }

      this.stats.completedTasks++
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error)
      
      if (task.onError) {
        task.onError(error as Error)
      }

      this.stats.failedTasks++
    } finally {
      this.taskQueue.delete(task.id)
      this.processingTasks.delete(task.id)
      this.updateStats()
    }
  }

  /**
   * 调度下一帧
   */
  private scheduleNextFrame(): void {
    if (!this.isRunning) return

    // 使用自适应帧率
    const targetFrameTime = this.getTargetFrameTime()

    this.frameHandle = requestAnimationFrame((timestamp) => {
      this.processFrame(timestamp)
    })

    // 同时调度空闲回调
    if (this.config.enableIdleCallback && this.hasIdleTasks()) {
      this.scheduleIdleCallback()
    }
  }

  /**
   * 处理一帧
   */
  private async processFrame(timestamp: number): Promise<void> {
    const frameStartTime = performance.now()
    const deltaTime = timestamp - this.lastFrameTime
    this.lastFrameTime = timestamp

    // 更新 FPS
    this.updateFPS(deltaTime)

    // 获取本帧要处理的任务
    const tasks = this.getFrameTasks()
    
    // 处理任务
    await this.processTasks(tasks)

    // 计算帧时间
    const frameTime = performance.now() - frameStartTime
    this.stats.frameTime = frameTime

    // 自适应 FPS 调整
    if (this.config.enableAdaptiveFPS) {
      this.adjustAdaptiveFPS(frameTime)
    }

    // 继续下一帧
    if (this.taskQueue.size > 0 || this.processingTasks.size > 0) {
      this.scheduleNextFrame()
    } else {
      this.isRunning = false
    }
  }

  /**
   * 获取目标帧时间
   */
  private getTargetFrameTime(): number {
    const baseFPS = this.config.targetFPS * this.adaptiveFPSMultiplier
    const clampedFPS = Math.max(
      this.config.minFPS,
      Math.min(this.config.maxFPS, baseFPS)
    )
    return 1000 / clampedFPS
  }

  /**
   * 调整自适应 FPS
   */
  private adjustAdaptiveFPS(frameTime: number): void {
    const targetFrameTime = this.getTargetFrameTime()
    
    if (frameTime > targetFrameTime * 1.2) {
      // 帧时间过长，降低 FPS
      this.adaptiveFPSMultiplier *= 0.95
    } else if (frameTime < targetFrameTime * 0.8 && this.taskQueue.size > 0) {
      // 帧时间较短且有待处理任务，提高 FPS
      this.adaptiveFPSMultiplier *= 1.05
    }

    // 限制倍数范围
    this.adaptiveFPSMultiplier = Math.max(0.5, Math.min(2, this.adaptiveFPSMultiplier))
  }

  /**
   * 获取本帧要处理的任务
   */
  private getFrameTasks(): RenderTask[] {
    const tasks: RenderTask[] = []
    const targetFrameTime = this.getTargetFrameTime()
    const maxTasks = Math.min(
      this.config.batchSize,
      this.config.maxConcurrentTasks - this.processingTasks.size
    )

    // 按优先级排序任务
    const sortedTasks = this.sortTasksByPriority()

    // 选择任务直到达到批量大小或预计超过帧时间
    let estimatedTime = 0
    for (const task of sortedTasks) {
      if (tasks.length >= maxTasks) break
      if (estimatedTime > targetFrameTime * 0.8) break // 留出 20% 的缓冲

      // 检查是否需要提升优先级
      if (task.deadline && Date.now() > task.deadline - this.config.priorityBoostThreshold) {
        task.priority = 'high'
      }

      tasks.push(task)
      estimatedTime += this.estimateTaskTime(task)
    }

    return tasks
  }

  /**
   * 按优先级排序任务
   */
  private sortTasksByPriority(): RenderTask[] {
    return Array.from(this.taskQueue.values())
      .filter(task => !this.processingTasks.has(task.id))
      .sort((a, b) => {
        // 首先按优先级权重排序
        const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
        if (weightDiff !== 0) return weightDiff

        // 相同优先级，按截止时间排序
        if (a.deadline && b.deadline) {
          return a.deadline - b.deadline
        }

        return 0
      })
  }

  /**
   * 估算任务执行时间
   */
  private estimateTaskTime(task: RenderTask): number {
    // 基于任务优先级的简单估算
    const baseTime = {
      immediate: 1,
      high: 5,
      normal: 10,
      low: 15,
      idle: 20
    }[task.priority]

    return baseTime || 10
  }

  /**
   * 处理任务
   */
  private async processTasks(tasks: RenderTask[]): Promise<void> {
    const promises = tasks.map(task => this.processTask(task))
    await Promise.allSettled(promises)
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: RenderTask): Promise<void> {
    try {
      this.processingTasks.add(task.id)
      this.taskQueue.delete(task.id)

      await task.execute()

      if (task.onComplete) {
        task.onComplete()
      }

      this.stats.completedTasks++
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error)

      // 重试逻辑
      if (task.retryCount! < task.maxRetries!) {
        task.retryCount!++
        this.taskQueue.set(task.id, task)
      } else {
        if (task.onError) {
          task.onError(error as Error)
        }
        this.stats.failedTasks++
      }
    } finally {
      this.processingTasks.delete(task.id)
      this.updateStats()
    }
  }

  /**
   * 是否有空闲任务
   */
  private hasIdleTasks(): boolean {
    return Array.from(this.taskQueue.values()).some(task => task.priority === 'idle')
  }

  /**
   * 调度空闲回调
   */
  private scheduleIdleCallback(): void {
    if (!this.config.enableIdleCallback || typeof requestIdleCallback === 'undefined') {
      return
    }

    this.idleHandle = requestIdleCallback((deadline) => {
      this.processIdleTasks(deadline)
    }, { timeout: 1000 })
  }

  /**
   * 处理空闲任务
   */
  private async processIdleTasks(deadline: IdleDeadline): Promise<void> {
    const idleStartTime = performance.now()
    const idleTasks = Array.from(this.taskQueue.values())
      .filter(task => task.priority === 'idle' && !this.processingTasks.has(task.id))

    for (const task of idleTasks) {
      if (deadline.timeRemaining() <= 0) break

      await this.processTask(task)
    }

    this.stats.idleTime = performance.now() - idleStartTime

    // 如果还有空闲任务，继续调度
    if (this.hasIdleTasks()) {
      this.scheduleIdleCallback()
    }
  }

  /**
   * 更新 FPS
   */
  private updateFPS(deltaTime: number): void {
    if (deltaTime <= 0) return

    const currentFPS = 1000 / deltaTime
    this.fpsHistory.push(currentFPS)

    // 保持最近 60 帧的历史
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift()
    }

    // 计算平均 FPS
    const averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
    this.stats.averageFPS = Math.round(averageFPS)
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.queueLength = this.taskQueue.size
    this.stats.processingTasks = this.processingTasks.size
  }

  /**
   * 获取统计信息
   */
  getStats(): SchedulerStats {
    return { ...this.stats }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop()
    this.taskQueue.clear()
    this.processingTasks.clear()
    this.fpsHistory = []
  }
}

/**
 * 创建渲染调度器
 */
export function createRenderScheduler(config?: Partial<RenderSchedulerConfig>): RenderScheduler {
  return new RenderScheduler(config)
}

/**
 * 创建渲染任务
 */
export function createRenderTask(
  id: string,
  execute: () => void | Promise<void>,
  priority: RenderPriority = 'normal',
  options: Partial<RenderTask> = {}
): RenderTask {
  return {
    id,
    priority,
    execute,
    ...options
  }
}