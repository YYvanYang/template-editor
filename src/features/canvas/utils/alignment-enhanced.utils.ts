import type {
  ElementBounds,
  AlignmentPoint,
  AlignmentConfig,
  AlignmentResult,
  GuideLine,
  DynamicGuide,
} from '../types/alignment.types';
import { createSpatialIndex, type SpatialIndex } from './spatial-index';

/**
 * 磁力曲线类型
 */
export type MagneticCurve = 'linear' | 'quadratic' | 'cubic' | 'exponential';

/**
 * 间距信息
 */
export interface SpacingInfo {
  spacing: number;
  count: number;
  elements: string[];
  axis: 'horizontal' | 'vertical';
}

/**
 * 磁力对齐结果
 */
export interface MagneticAlignmentResult extends AlignmentResult {
  magneticStrength: number;
  smoothPosition: { x: number; y: number };
}

/**
 * 对齐缓存条目
 */
interface CachedAlignment {
  result: AlignmentResult;
  timestamp: number;
}

/**
 * 增强的对齐引擎
 * 提供高性能的对齐检测和磁力吸附功能
 */
export class EnhancedAlignmentEngine {
  private spatialIndex: SpatialIndex<{ id: string; bounds: ElementBounds }>;
  private alignmentCache: Map<string, CachedAlignment> = new Map();
  private cacheTimeout = 100; // 缓存过期时间（毫秒）
  private performanceMetrics = {
    totalChecks: 0,
    cacheHits: 0,
    averageCheckTime: 0,
  };

  constructor(private config: AlignmentConfig) {
    this.spatialIndex = createSpatialIndex();
  }

  /**
   * 更新元素索引
   */
  updateElementIndex(elements: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>) {
    this.spatialIndex.clear();
    elements.forEach(element => {
      const bounds = this.calculateElementBounds(element);
      this.spatialIndex.insert({ id: element.id, bounds }, bounds);
    });
  }

  /**
   * 计算磁力吸附强度
   */
  calculateMagneticStrength(
    distance: number,
    threshold: number,
    curve: MagneticCurve = 'quadratic'
  ): number {
    if (distance >= threshold) return 0;

    const normalized = distance / threshold;

    switch (curve) {
      case 'linear':
        return 1 - normalized;

      case 'quadratic':
        // 平滑的二次曲线，提供渐进式吸附
        return Math.pow(1 - normalized, 2);

      case 'cubic':
        // 更强烈的吸附效果
        return Math.pow(1 - normalized, 3);

      case 'exponential':
        // 指数曲线，近距离时吸附力急剧增强
        return Math.exp(-3 * normalized) - Math.exp(-3);

      default:
        return 1 - normalized;
    }
  }

  /**
   * 应用磁力吸附
   */
  applyMagneticSnap(
    position: { x: number; y: number },
    snapPoint: { x: number; y: number },
    strength: number
  ): { x: number; y: number } {
    // 使用插值实现平滑过渡
    return {
      x: position.x + (snapPoint.x - position.x) * strength,
      y: position.y + (snapPoint.y - position.y) * strength,
    };
  }

  /**
   * 检查磁力对齐
   */
  checkMagneticAlignment(
    element: { id: string; x: number; y: number; width: number; height: number; rotation: number },
    position: { x: number; y: number },
    guides: GuideLine[]
  ): MagneticAlignmentResult {
    const startTime = performance.now();

    // 检查缓存
    const cacheKey = this.generateCacheKey(element.id, position);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return cached as MagneticAlignmentResult;
    }

    // 计算元素边界
    const bounds = this.calculateElementBounds({
      ...element,
      x: position.x,
      y: position.y,
    });

    // 获取所有对齐点
    const alignmentPoints = this.findAlignmentPoints(bounds);

    let bestAlignment: MagneticAlignmentResult = {
      aligned: false,
      x: position.x,
      y: position.y,
      deltaX: 0,
      deltaY: 0,
      magneticStrength: 0,
      smoothPosition: position,
    };

    let minDistance = Infinity;

    // 检查每个对齐点
    for (const point of alignmentPoints) {
      // 检查垂直辅助线
      for (const guide of guides.filter(g => g.orientation === 'vertical' && g.visible !== false)) {
        const distance = Math.abs(point.x - guide.position);
        if (distance < this.config.threshold && distance < minDistance) {
          const strength = this.calculateMagneticStrength(distance, this.config.threshold);
          const snapX = guide.position - (point.x - position.x);
          const smoothX = this.applyMagneticSnap({ x: position.x, y: 0 }, { x: snapX, y: 0 }, strength).x;

          bestAlignment = {
            aligned: true,
            x: snapX,
            y: position.y,
            deltaX: snapX - position.x,
            deltaY: 0,
            verticalGuide: guide,
            magneticStrength: strength,
            smoothPosition: { x: smoothX, y: position.y },
          };
          minDistance = distance;
        }
      }

      // 检查水平辅助线
      for (const guide of guides.filter(g => g.orientation === 'horizontal' && g.visible !== false)) {
        const distance = Math.abs(point.y - guide.position);
        if (distance < this.config.threshold && distance < minDistance) {
          const strength = this.calculateMagneticStrength(distance, this.config.threshold);
          const snapY = guide.position - (point.y - position.y);
          const smoothY = this.applyMagneticSnap({ x: 0, y: position.y }, { x: 0, y: snapY }, strength).y;

          if (bestAlignment.aligned && bestAlignment.verticalGuide) {
            // 同时对齐到垂直和水平辅助线
            bestAlignment.y = snapY;
            bestAlignment.deltaY = snapY - position.y;
            bestAlignment.horizontalGuide = guide;
            bestAlignment.smoothPosition.y = smoothY;
          } else {
            bestAlignment = {
              aligned: true,
              x: position.x,
              y: snapY,
              deltaX: 0,
              deltaY: snapY - position.y,
              horizontalGuide: guide,
              magneticStrength: strength,
              smoothPosition: { x: position.x, y: smoothY },
            };
          }
          minDistance = distance;
        }
      }
    }

    // 更新性能指标
    const checkTime = performance.now() - startTime;
    this.updatePerformanceMetrics(checkTime);

    // 缓存结果
    this.addToCache(cacheKey, bestAlignment);

    return bestAlignment;
  }

  /**
   * 检测智能间距
   */
  detectEqualSpacing(
    elements: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>,
    axis: 'horizontal' | 'vertical',
    tolerance: number = 2
  ): SpacingInfo[] {
    // 计算所有元素的边界
    const boundsArray = elements.map(el => ({
      id: el.id,
      bounds: this.calculateElementBounds(el),
    }));

    // 按位置排序
    const sorted = [...boundsArray].sort((a, b) => {
      return axis === 'horizontal'
        ? a.bounds.left - b.bounds.left
        : a.bounds.top - b.bounds.top;
    });

    // 计算相邻元素间距
    const spacings: Array<{
      value: number;
      between: [string, string];
    }> = [];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const spacing = axis === 'horizontal'
        ? curr.bounds.left - prev.bounds.right
        : curr.bounds.top - prev.bounds.bottom;

      spacings.push({
        value: spacing,
        between: [prev.id, curr.id],
      });
    }

    // 使用容差分组
    const groups = this.groupByTolerance(spacings, tolerance);

    // 返回出现2次以上的间距模式
    return groups
      .filter(group => group.length >= 2)
      .map(group => ({
        spacing: Math.round(group[0].value),
        count: group.length,
        elements: this.extractElements(group),
        axis,
      }));
  }

  /**
   * 生成智能分布辅助线
   */
  generateDistributionGuides(
    draggedElement: { id: string; x: number; y: number; width: number; height: number; rotation: number },
    targetElements: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>
  ): DynamicGuide[] {
    const guides: DynamicGuide[] = [];

    // 检测水平间距
    const horizontalSpacings = this.detectEqualSpacing(
      [...targetElements, draggedElement],
      'horizontal'
    );

    // 检测垂直间距
    const verticalSpacings = this.detectEqualSpacing(
      [...targetElements, draggedElement],
      'vertical'
    );

    // 为等间距生成辅助线
    horizontalSpacings.forEach(spacing => {
      if (spacing.elements.includes(draggedElement.id)) {
        const bounds = this.calculateElementBounds(draggedElement);
        guides.push({
          id: `spacing-h-${spacing.spacing}`,
          orientation: 'horizontal',
          position: bounds.centerY,
          start: bounds.left - spacing.spacing,
          end: bounds.right + spacing.spacing,
          type: 'spacing',
          relatedElements: spacing.elements,
          metadata: { spacing: spacing.spacing },
        });
      }
    });

    verticalSpacings.forEach(spacing => {
      if (spacing.elements.includes(draggedElement.id)) {
        const bounds = this.calculateElementBounds(draggedElement);
        guides.push({
          id: `spacing-v-${spacing.spacing}`,
          orientation: 'vertical',
          position: bounds.centerX,
          start: bounds.top - spacing.spacing,
          end: bounds.bottom + spacing.spacing,
          type: 'spacing',
          relatedElements: spacing.elements,
          metadata: { spacing: spacing.spacing },
        });
      }
    });

    return guides;
  }

  /**
   * 优化的动态辅助线生成
   */
  generateDynamicGuidesOptimized(
    draggedBounds: ElementBounds,
    viewport: { x: number; y: number; width: number; height: number }
  ): DynamicGuide[] {
    // 使用空间索引查询视口内的元素
    const nearbyElements = this.spatialIndex.search({
      left: viewport.x - 100,
      top: viewport.y - 100,
      right: viewport.x + viewport.width + 100,
      bottom: viewport.y + viewport.height + 100,
    });

    const guides: DynamicGuide[] = [];
    const guideMap = new Map<string, DynamicGuide>();

    const draggedPoints = this.findAlignmentPoints(draggedBounds);

    // 只处理视口内的元素
    for (const element of nearbyElements) {
      if (element.id === draggedBounds.id) continue;

      const targetPoints = this.findAlignmentPoints(element.bounds);

      // 检查对齐
      for (const dragPoint of draggedPoints) {
        for (const targetPoint of targetPoints) {
          // 垂直对齐
          const vDistance = Math.abs(dragPoint.x - targetPoint.x);
          if (vDistance <= this.config.threshold) {
            const key = `v-${targetPoint.x}`;
            const existing = guideMap.get(key);

            const guide: DynamicGuide = {
              id: key,
              orientation: 'vertical',
              position: targetPoint.x,
              start: Math.min(dragPoint.y, targetPoint.y, existing?.start ?? Infinity),
              end: Math.max(dragPoint.y, targetPoint.y, existing?.end ?? -Infinity),
              type: 'element',
              relatedElements: existing
                ? [...(existing.relatedElements ?? []), draggedBounds.id, element.id]
                : [draggedBounds.id, element.id],
            };

            guideMap.set(key, guide);
          }

          // 水平对齐
          const hDistance = Math.abs(dragPoint.y - targetPoint.y);
          if (hDistance <= this.config.threshold) {
            const key = `h-${targetPoint.y}`;
            const existing = guideMap.get(key);

            const guide: DynamicGuide = {
              id: key,
              orientation: 'horizontal',
              position: targetPoint.y,
              start: Math.min(dragPoint.x, targetPoint.x, existing?.start ?? Infinity),
              end: Math.max(dragPoint.x, targetPoint.x, existing?.end ?? -Infinity),
              type: 'element',
              relatedElements: existing
                ? [...(existing.relatedElements ?? []), draggedBounds.id, element.id]
                : [draggedBounds.id, element.id],
            };

            guideMap.set(key, guide);
          }
        }
      }
    }

    // 去重相关元素
    guideMap.forEach(guide => {
      if (guide.relatedElements) {
        guide.relatedElements = [...new Set(guide.relatedElements)];
      }
    });

    return Array.from(guideMap.values());
  }

  /**
   * 计算元素边界（支持旋转）
   */
  private calculateElementBounds(element: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }): ElementBounds {
    const { id, x, y, width, height, rotation } = element;

    if (rotation === 0) {
      return {
        id,
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        centerX: x + width / 2,
        centerY: y + height / 2,
        width,
        height,
      };
    }

    // 计算旋转后的边界
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const corners = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + height },
      { x: x, y: y + height },
    ];

    const rotatedCorners = corners.map(corner => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    });

    const xs = rotatedCorners.map(c => c.x);
    const ys = rotatedCorners.map(c => c.y);

    return {
      id,
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
      centerX,
      centerY,
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  /**
   * 查找对齐点
   */
  private findAlignmentPoints(bounds: ElementBounds): AlignmentPoint[] {
    const points: AlignmentPoint[] = [];
    const { id, left, top, right, bottom, centerX, centerY } = bounds;

    // 中心点
    points.push({ x: centerX, y: centerY, elementId: id, type: 'center' });

    // 四个角
    points.push({ x: left, y: top, elementId: id, type: 'corner' });
    points.push({ x: right, y: top, elementId: id, type: 'corner' });
    points.push({ x: right, y: bottom, elementId: id, type: 'corner' });
    points.push({ x: left, y: bottom, elementId: id, type: 'corner' });

    // 四条边的中点
    points.push({ x: centerX, y: top, elementId: id, type: 'top' });
    points.push({ x: right, y: centerY, elementId: id, type: 'right' });
    points.push({ x: centerX, y: bottom, elementId: id, type: 'bottom' });
    points.push({ x: left, y: centerY, elementId: id, type: 'left' });

    return points;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(elementId: string, position: { x: number; y: number }): string {
    return `${elementId}-${Math.round(position.x)}-${Math.round(position.y)}`;
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): AlignmentResult | null {
    const cached = this.alignmentCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, result: AlignmentResult): void {
    this.alignmentCache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // 限制缓存大小
    if (this.alignmentCache.size > 1000) {
      const firstKey = this.alignmentCache.keys().next().value;
      this.alignmentCache.delete(firstKey);
    }
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(checkTime: number): void {
    this.performanceMetrics.totalChecks++;
    this.performanceMetrics.averageCheckTime =
      (this.performanceMetrics.averageCheckTime * (this.performanceMetrics.totalChecks - 1) + checkTime) /
      this.performanceMetrics.totalChecks;
  }

  /**
   * 按容差分组
   */
  private groupByTolerance(
    spacings: Array<{ value: number; between: [string, string] }>,
    tolerance: number
  ): Array<Array<{ value: number; between: [string, string] }>> {
    const groups: Array<Array<{ value: number; between: [string, string] }>> = [];

    spacings.forEach(spacing => {
      let added = false;
      for (const group of groups) {
        if (Math.abs(group[0].value - spacing.value) <= tolerance) {
          group.push(spacing);
          added = true;
          break;
        }
      }
      if (!added) {
        groups.push([spacing]);
      }
    });

    return groups;
  }

  /**
   * 提取元素ID
   */
  private extractElements(
    group: Array<{ value: number; between: [string, string] }>
  ): string[] {
    const elements = new Set<string>();
    group.forEach(item => {
      elements.add(item.between[0]);
      elements.add(item.between[1]);
    });
    return Array.from(elements);
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    const hitRate = this.performanceMetrics.totalChecks > 0
      ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalChecks
      : 0;

    return {
      ...this.performanceMetrics,
      cacheHitRate: hitRate,
      cacheSize: this.alignmentCache.size,
    };
  }

  /**
   * 清理资源
   */
  dispose() {
    this.spatialIndex.clear();
    this.alignmentCache.clear();
  }
}