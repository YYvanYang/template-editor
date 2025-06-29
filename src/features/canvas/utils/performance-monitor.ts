/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 帧率 */
  fps: number;
  /** 帧时间 (ms) */
  frameTime: number;
  /** 对齐检查次数 */
  alignmentChecks: number;
  /** 平均对齐检查时间 (ms) */
  avgAlignmentTime: number;
  /** 最大对齐检查时间 (ms) */
  maxAlignmentTime: number;
  /** 缓存命中率 */
  cacheHitRate: number;
  /** 内存使用 (MB) */
  memoryUsage: number;
  /** 元素数量 */
  elementCount: number;
  /** 可见元素数量 */
  visibleElementCount: number;
  /** 空间索引大小 */
  spatialIndexSize: number;
  /** 性能等级 */
  performanceLevel: 'excellent' | 'good' | 'moderate' | 'poor';
}

/**
 * 性能事件
 */
export interface PerformanceEvent {
  type: 'alignment' | 'render' | 'drag' | 'zoom' | 'pan';
  duration: number;
  timestamp: number;
  details?: Record<string, any>;
}

/**
 * 性能阈值配置
 */
export interface PerformanceThresholds {
  targetFPS: number;
  maxFrameTime: number;
  maxAlignmentTime: number;
  minCacheHitRate: number;
  degradationThreshold: number;
}

/**
 * 性能监控器
 * 实时监控画布性能并提供自适应优化建议
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    alignmentChecks: 0,
    avgAlignmentTime: 0,
    maxAlignmentTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    elementCount: 0,
    visibleElementCount: 0,
    spatialIndexSize: 0,
    performanceLevel: 'excellent',
  };

  private thresholds: PerformanceThresholds = {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxAlignmentTime: 10,
    minCacheHitRate: 0.8,
    degradationThreshold: 3,
  };

  private events: PerformanceEvent[] = [];
  private frameTimestamps: number[] = [];
  private degradationCount = 0;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private rafId: number | null = null;
  private startTime = performance.now();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds };
    }
    this.startMonitoring();
  }

  /**
   * 开始监控
   */
  private startMonitoring() {
    const measureFrame = (timestamp: number) => {
      // 计算 FPS
      this.frameTimestamps.push(timestamp);
      this.frameTimestamps = this.frameTimestamps.filter(
        t => timestamp - t < 1000
      );

      this.metrics.fps = this.frameTimestamps.length;
      this.metrics.frameTime = this.frameTimestamps.length > 1
        ? (timestamp - this.frameTimestamps[0]) / (this.frameTimestamps.length - 1)
        : 16.67;

      // 更新内存使用（如果支持）
      if ('memory' in performance && (performance as any).memory) {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576;
      }

      // 评估性能等级
      this.evaluatePerformanceLevel();

      // 通知监听器
      this.notifyListeners();

      // 继续监控
      this.rafId = requestAnimationFrame(measureFrame);
    };

    this.rafId = requestAnimationFrame(measureFrame);
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 记录性能事件
   */
  recordEvent(type: PerformanceEvent['type'], duration: number, details?: Record<string, any>) {
    const event: PerformanceEvent = {
      type,
      duration,
      timestamp: performance.now(),
      details,
    };

    this.events.push(event);

    // 保留最近 1000 个事件
    if (this.events.length > 1000) {
      this.events.shift();
    }

    // 更新相关指标
    if (type === 'alignment') {
      this.updateAlignmentMetrics(duration);
    }
  }

  /**
   * 记录对齐操作
   */
  recordAlignment(duration: number, cacheHit: boolean) {
    this.recordEvent('alignment', duration, { cacheHit });
    this.metrics.alignmentChecks++;
    
    // 更新缓存命中率
    const recentAlignments = this.events
      .filter(e => e.type === 'alignment' && e.timestamp > performance.now() - 10000)
      .map(e => e.details?.cacheHit ?? false);
    
    if (recentAlignments.length > 0) {
      const hits = recentAlignments.filter(hit => hit).length;
      this.metrics.cacheHitRate = hits / recentAlignments.length;
    }
  }

  /**
   * 更新元素计数
   */
  updateElementCount(total: number, visible: number) {
    this.metrics.elementCount = total;
    this.metrics.visibleElementCount = visible;
  }

  /**
   * 更新空间索引大小
   */
  updateSpatialIndexSize(size: number) {
    this.metrics.spatialIndexSize = size;
  }

  /**
   * 更新对齐指标
   */
  private updateAlignmentMetrics(duration: number) {
    const recentAlignments = this.events
      .filter(e => e.type === 'alignment' && e.timestamp > performance.now() - 10000)
      .map(e => e.duration);

    if (recentAlignments.length > 0) {
      this.metrics.avgAlignmentTime = 
        recentAlignments.reduce((sum, d) => sum + d, 0) / recentAlignments.length;
      this.metrics.maxAlignmentTime = Math.max(...recentAlignments);
    }
  }

  /**
   * 评估性能等级
   */
  private evaluatePerformanceLevel() {
    let score = 100;

    // FPS 评分 (40%)
    const fpsRatio = this.metrics.fps / this.thresholds.targetFPS;
    score -= (1 - Math.min(1, fpsRatio)) * 40;

    // 帧时间评分 (30%)
    const frameTimeRatio = this.thresholds.maxFrameTime / this.metrics.frameTime;
    score -= (1 - Math.min(1, frameTimeRatio)) * 30;

    // 对齐时间评分 (20%)
    if (this.metrics.avgAlignmentTime > 0) {
      const alignmentRatio = this.thresholds.maxAlignmentTime / this.metrics.avgAlignmentTime;
      score -= (1 - Math.min(1, alignmentRatio)) * 20;
    }

    // 缓存命中率评分 (10%)
    score -= (1 - this.metrics.cacheHitRate) * 10;

    // 确定性能等级
    if (score >= 90) {
      this.metrics.performanceLevel = 'excellent';
      this.degradationCount = 0;
    } else if (score >= 75) {
      this.metrics.performanceLevel = 'good';
      this.degradationCount = 0;
    } else if (score >= 60) {
      this.metrics.performanceLevel = 'moderate';
      this.degradationCount++;
    } else {
      this.metrics.performanceLevel = 'poor';
      this.degradationCount++;
    }

    // 检查是否需要降级
    if (this.degradationCount >= this.thresholds.degradationThreshold) {
      this.triggerDegradation();
    }
  }

  /**
   * 触发性能降级
   */
  private triggerDegradation() {
    console.warn('Performance degradation detected, enabling optimized mode');
    // 降级策略由外部实现
    this.degradationCount = 0;
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    suggestions: string[];
    eventSummary: Record<string, { count: number; avgDuration: number }>;
  } {
    const suggestions: string[] = [];

    // 生成建议
    if (this.metrics.fps < this.thresholds.targetFPS * 0.9) {
      suggestions.push(`Frame rate is below target (${this.metrics.fps.toFixed(1)} FPS)`);
    }

    if (this.metrics.avgAlignmentTime > this.thresholds.maxAlignmentTime) {
      suggestions.push(`Alignment checks are slow (${this.metrics.avgAlignmentTime.toFixed(1)}ms avg)`);
    }

    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      suggestions.push(`Cache hit rate is low (${(this.metrics.cacheHitRate * 100).toFixed(1)}%)`);
    }

    if (this.metrics.elementCount > 500) {
      suggestions.push('Consider using viewport culling for better performance');
    }

    if (this.metrics.visibleElementCount > 100) {
      suggestions.push('Many elements visible, consider simplifying the view');
    }

    // 事件摘要
    const eventSummary: Record<string, { count: number; avgDuration: number }> = {};
    const eventGroups = this.groupEventsByType();

    for (const [type, events] of Object.entries(eventGroups)) {
      const durations = events.map(e => e.duration);
      eventSummary[type] = {
        count: events.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      };
    }

    return {
      metrics: this.getMetrics(),
      suggestions,
      eventSummary,
    };
  }

  /**
   * 按类型分组事件
   */
  private groupEventsByType(): Record<string, PerformanceEvent[]> {
    const groups: Record<string, PerformanceEvent[]> = {};
    
    this.events.forEach(event => {
      if (!groups[event.type]) {
        groups[event.type] = [];
      }
      groups[event.type].push(event);
    });

    return groups;
  }

  /**
   * 添加监听器
   */
  addListener(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.add(listener);
  }

  /**
   * 移除监听器
   */
  removeListener(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.metrics));
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      alignmentChecks: 0,
      avgAlignmentTime: 0,
      maxAlignmentTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      elementCount: 0,
      visibleElementCount: 0,
      spatialIndexSize: 0,
      performanceLevel: 'excellent',
    };
    this.events = [];
    this.frameTimestamps = [];
    this.degradationCount = 0;
    this.startTime = performance.now();
  }

  /**
   * 销毁监控器
   */
  dispose() {
    this.stopMonitoring();
    this.listeners.clear();
    this.events = [];
    this.frameTimestamps = [];
  }
}

/**
 * 创建性能监控器实例
 */
export function createPerformanceMonitor(thresholds?: Partial<PerformanceThresholds>): PerformanceMonitor {
  return new PerformanceMonitor(thresholds);
}