import type { ElementBounds } from '../types/alignment.types';

/**
 * 间距分析结果
 */
export interface SpacingAnalysis {
  /** 水平间距模式 */
  horizontal: SpacingPattern[];
  /** 垂直间距模式 */
  vertical: SpacingPattern[];
  /** 建议的分布操作 */
  suggestions: DistributionSuggestion[];
}

/**
 * 间距模式
 */
export interface SpacingPattern {
  /** 间距值 */
  spacing: number;
  /** 出现次数 */
  count: number;
  /** 涉及的元素对 */
  pairs: Array<[string, string]>;
  /** 置信度 (0-1) */
  confidence: number;
  /** 是否为主要模式 */
  isPrimary: boolean;
}

/**
 * 分布建议
 */
export interface DistributionSuggestion {
  /** 建议类型 */
  type: 'equal-spacing' | 'align-edges' | 'center-align' | 'grid-layout';
  /** 涉及的元素 */
  elements: string[];
  /** 建议的操作 */
  action: string;
  /** 优先级 */
  priority: number;
}

/**
 * 元素组
 */
interface ElementGroup {
  elements: ElementBounds[];
  axis: 'horizontal' | 'vertical';
  alignment: 'start' | 'center' | 'end';
}

/**
 * 智能间距检测器
 * 分析元素布局并提供智能建议
 */
export class SmartSpacingDetector {
  private tolerance: number = 2; // 像素容差
  private minGroupSize: number = 3; // 最小组大小

  constructor(tolerance?: number) {
    if (tolerance !== undefined) {
      this.tolerance = tolerance;
    }
  }

  /**
   * 分析元素间距
   */
  analyzeSpacing(elements: ElementBounds[]): SpacingAnalysis {
    if (elements.length < 2) {
      return {
        horizontal: [],
        vertical: [],
        suggestions: [],
      };
    }

    const horizontalPatterns = this.detectSpacingPatterns(elements, 'horizontal');
    const verticalPatterns = this.detectSpacingPatterns(elements, 'vertical');
    const suggestions = this.generateSuggestions(elements, horizontalPatterns, verticalPatterns);

    return {
      horizontal: horizontalPatterns,
      vertical: verticalPatterns,
      suggestions,
    };
  }

  /**
   * 检测间距模式
   */
  private detectSpacingPatterns(elements: ElementBounds[], axis: 'horizontal' | 'vertical'): SpacingPattern[] {
    // 按位置排序
    const sorted = [...elements].sort((a, b) => {
      return axis === 'horizontal' ? a.left - b.left : a.top - b.top;
    });

    // 计算所有相邻间距
    const spacings: Array<{
      value: number;
      pair: [string, string];
    }> = [];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const spacing = axis === 'horizontal'
        ? curr.left - prev.right
        : curr.top - prev.bottom;

      if (spacing >= 0) { // 只考虑非重叠的情况
        spacings.push({
          value: spacing,
          pair: [prev.id, curr.id],
        });
      }
    }

    // 按容差分组
    const groups = this.groupByTolerance(spacings);

    // 转换为间距模式
    const patterns = groups.map(group => {
      const avgSpacing = group.reduce((sum, s) => sum + s.value, 0) / group.length;
      const variance = group.reduce((sum, s) => sum + Math.pow(s.value - avgSpacing, 2), 0) / group.length;
      const confidence = 1 - Math.min(1, Math.sqrt(variance) / avgSpacing);

      return {
        spacing: Math.round(avgSpacing),
        count: group.length,
        pairs: group.map(s => s.pair),
        confidence,
        isPrimary: false,
      };
    });

    // 标记主要模式
    if (patterns.length > 0) {
      const maxCount = Math.max(...patterns.map(p => p.count));
      patterns.forEach(p => {
        p.isPrimary = p.count === maxCount && p.count >= 2;
      });
    }

    return patterns.sort((a, b) => b.count - a.count);
  }

  /**
   * 检测对齐组
   */
  detectAlignmentGroups(elements: ElementBounds[]): ElementGroup[] {
    const groups: ElementGroup[] = [];

    // 检测水平对齐组
    this.detectAxisAlignmentGroups(elements, 'horizontal').forEach(g => groups.push(g));

    // 检测垂直对齐组
    this.detectAxisAlignmentGroups(elements, 'vertical').forEach(g => groups.push(g));

    return groups;
  }

  /**
   * 检测单轴对齐组
   */
  private detectAxisAlignmentGroups(elements: ElementBounds[], axis: 'horizontal' | 'vertical'): ElementGroup[] {
    const groups: ElementGroup[] = [];
    const processed = new Set<string>();

    for (const element of elements) {
      if (processed.has(element.id)) continue;

      // 检查各种对齐方式
      for (const alignment of ['start', 'center', 'end'] as const) {
        const alignedElements = this.findAlignedElements(element, elements, axis, alignment);

        if (alignedElements.length >= this.minGroupSize) {
          groups.push({
            elements: alignedElements,
            axis,
            alignment,
          });

          alignedElements.forEach(el => processed.add(el.id));
        }
      }
    }

    return groups;
  }

  /**
   * 查找对齐的元素
   */
  private findAlignedElements(
    reference: ElementBounds,
    elements: ElementBounds[],
    axis: 'horizontal' | 'vertical',
    alignment: 'start' | 'center' | 'end'
  ): ElementBounds[] {
    const getValue = (el: ElementBounds) => {
      if (axis === 'horizontal') {
        switch (alignment) {
          case 'start': return el.top;
          case 'center': return el.centerY;
          case 'end': return el.bottom;
        }
      } else {
        switch (alignment) {
          case 'start': return el.left;
          case 'center': return el.centerX;
          case 'end': return el.right;
        }
      }
    };

    const referenceValue = getValue(reference);
    const aligned = elements.filter(el => {
      const value = getValue(el);
      return Math.abs(value - referenceValue) <= this.tolerance;
    });

    return aligned;
  }

  /**
   * 生成分布建议
   */
  private generateSuggestions(
    elements: ElementBounds[],
    horizontalPatterns: SpacingPattern[],
    verticalPatterns: SpacingPattern[]
  ): DistributionSuggestion[] {
    const suggestions: DistributionSuggestion[] = [];

    // 建议1：等间距分布
    if (horizontalPatterns.length > 0 && horizontalPatterns[0].isPrimary) {
      const pattern = horizontalPatterns[0];
      const involvedElements = new Set<string>();
      pattern.pairs.forEach(pair => {
        involvedElements.add(pair[0]);
        involvedElements.add(pair[1]);
      });

      suggestions.push({
        type: 'equal-spacing',
        elements: Array.from(involvedElements),
        action: `Distribute elements horizontally with ${pattern.spacing}px spacing`,
        priority: pattern.confidence * 10,
      });
    }

    if (verticalPatterns.length > 0 && verticalPatterns[0].isPrimary) {
      const pattern = verticalPatterns[0];
      const involvedElements = new Set<string>();
      pattern.pairs.forEach(pair => {
        involvedElements.add(pair[0]);
        involvedElements.add(pair[1]);
      });

      suggestions.push({
        type: 'equal-spacing',
        elements: Array.from(involvedElements),
        action: `Distribute elements vertically with ${pattern.spacing}px spacing`,
        priority: pattern.confidence * 10,
      });
    }

    // 建议2：对齐边缘
    const alignmentGroups = this.detectAlignmentGroups(elements);
    alignmentGroups.forEach(group => {
      if (group.elements.length >= this.minGroupSize) {
        suggestions.push({
          type: 'align-edges',
          elements: group.elements.map(el => el.id),
          action: `Align ${group.elements.length} elements ${group.alignment} ${group.axis}`,
          priority: group.elements.length,
        });
      }
    });

    // 建议3：网格布局
    const gridLayout = this.detectGridLayout(elements);
    if (gridLayout) {
      suggestions.push({
        type: 'grid-layout',
        elements: gridLayout.elements.map(el => el.id),
        action: `Arrange ${gridLayout.elements.length} elements in a ${gridLayout.rows}×${gridLayout.cols} grid`,
        priority: gridLayout.elements.length * 2,
      });
    }

    // 按优先级排序
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 检测网格布局
   * 参考 Figma、Adobe XD、Sketch 等工具的最佳实践
   */
  private detectGridLayout(elements: ElementBounds[]): {
    elements: ElementBounds[];
    rows: number;
    cols: number;
  } | null {
    if (elements.length < 4) return null;

    // 1. 智能检测行列 - 使用中心点聚类
    const centers = elements.map(e => ({
      x: e.centerX,
      y: e.centerY,
      element: e,
    }));

    // 2. 检测X轴和Y轴的对齐线
    const xAlignments = this.detectAlignmentLines(centers.map(c => c.x));
    const yAlignments = this.detectAlignmentLines(centers.map(c => c.y));

    // 3. 需要至少2行2列才认为是网格
    if (xAlignments.length < 2 || yAlignments.length < 2) return null;

    // 4. 将元素分配到网格位置
    const grid = new Map<string, ElementBounds>();
    const gridElements: ElementBounds[] = [];
    
    centers.forEach(({ x, y, element }) => {
      const colIndex = this.findClosestIndex(x, xAlignments);
      const rowIndex = this.findClosestIndex(y, yAlignments);
      
      if (colIndex !== -1 && rowIndex !== -1) {
        const key = `${rowIndex},${colIndex}`;
        if (!grid.has(key)) { // 避免重复
          grid.set(key, element);
          gridElements.push(element);
        }
      }
    });

    // 5. 计算网格填充率
    const totalCells = xAlignments.length * yAlignments.length;
    const filledCells = grid.size;
    const fillRate = filledCells / totalCells;

    // 6. 检测是否为有效网格（参考业界标准）
    // - 至少填充50%的单元格
    // - 或者元素数量符合完整行/列模式
    const isCompleteRows = filledCells === xAlignments.length * Math.floor(filledCells / xAlignments.length);
    const isCompleteCols = filledCells === yAlignments.length * Math.floor(filledCells / yAlignments.length);
    
    if (fillRate >= 0.5 || isCompleteRows || isCompleteCols) {
      return {
        elements: gridElements,
        rows: yAlignments.length,
        cols: xAlignments.length,
      };
    }

    return null;
  }

  /**
   * 检测对齐线（使用聚类算法）
   * 参考 Figma 的自动对齐检测
   */
  private detectAlignmentLines(values: number[]): number[] {
    if (values.length < 2) return [];

    // 排序并去重相近的值
    const sorted = [...values].sort((a, b) => a - b);
    const alignments: number[] = [];
    
    let currentGroup: number[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i] - sorted[i - 1];
      
      // 如果间距小于容差阈值，归为同一组
      if (diff <= this.tolerance * 3) {
        currentGroup.push(sorted[i]);
      } else {
        // 计算当前组的平均值作为对齐线
        const avg = currentGroup.reduce((sum, v) => sum + v, 0) / currentGroup.length;
        alignments.push(avg);
        currentGroup = [sorted[i]];
      }
    }
    
    // 处理最后一组
    if (currentGroup.length > 0) {
      const avg = currentGroup.reduce((sum, v) => sum + v, 0) / currentGroup.length;
      alignments.push(avg);
    }
    
    return alignments;
  }

  /**
   * 找到最接近的对齐线索引
   */
  private findClosestIndex(value: number, alignments: number[]): number {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    alignments.forEach((alignment, index) => {
      const distance = Math.abs(value - alignment);
      if (distance <= this.tolerance * 3 && distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }

  /**
   * 按容差分组间距
   */
  private groupByTolerance(
    spacings: Array<{ value: number; pair: [string, string] }>
  ): Array<Array<{ value: number; pair: [string, string] }>> {
    const groups: Array<Array<{ value: number; pair: [string, string] }>> = [];

    spacings.forEach(spacing => {
      let added = false;
      for (const group of groups) {
        const avgValue = group.reduce((sum, s) => sum + s.value, 0) / group.length;
        if (Math.abs(avgValue - spacing.value) <= this.tolerance) {
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
   * 应用等间距分布
   */
  distributeElements(
    elements: ElementBounds[],
    axis: 'horizontal' | 'vertical',
    spacing?: number
  ): Array<{ id: string; position: { x: number; y: number } }> {
    // 按位置排序
    const sorted = [...elements].sort((a, b) => {
      return axis === 'horizontal' ? a.left - b.left : a.top - b.top;
    });

    if (sorted.length < 2) return [];

    // 计算间距
    if (spacing === undefined) {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace = axis === 'horizontal'
        ? last.right - first.left
        : last.bottom - first.top;
      const elementsSpace = sorted.reduce((sum, el) => 
        sum + (axis === 'horizontal' ? el.width : el.height), 0
      );
      spacing = (totalSpace - elementsSpace) / (sorted.length - 1);
    }

    // 生成新位置
    const updates: Array<{ id: string; position: { x: number; y: number } }> = [];
    let currentPos = axis === 'horizontal' ? sorted[0].left : sorted[0].top;

    sorted.forEach((el, index) => {
      if (index > 0) {
        const newPos = axis === 'horizontal'
          ? { x: currentPos, y: el.top }
          : { x: el.left, y: currentPos };

        updates.push({
          id: el.id,
          position: newPos,
        });
      }

      currentPos += (axis === 'horizontal' ? el.width : el.height) + spacing;
    });

    return updates;
  }

  /**
   * 对齐元素
   */
  alignElements(
    elements: ElementBounds[],
    axis: 'horizontal' | 'vertical',
    alignment: 'start' | 'center' | 'end'
  ): Array<{ id: string; position: { x: number; y: number } }> {
    if (elements.length < 2) return [];

    // 计算对齐位置
    let alignPosition: number;
    if (axis === 'horizontal') {
      const values = elements.map(el => {
        switch (alignment) {
          case 'start': return el.top;
          case 'center': return el.centerY;
          case 'end': return el.bottom;
        }
      });
      alignPosition = values.reduce((sum, v) => sum + v, 0) / values.length;
    } else {
      const values = elements.map(el => {
        switch (alignment) {
          case 'start': return el.left;
          case 'center': return el.centerX;
          case 'end': return el.right;
        }
      });
      alignPosition = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    // 生成更新
    return elements.map(el => {
      const newPos = { ...el };
      
      if (axis === 'horizontal') {
        switch (alignment) {
          case 'start':
            newPos.top = alignPosition;
            break;
          case 'center':
            newPos.top = alignPosition - el.height / 2;
            break;
          case 'end':
            newPos.top = alignPosition - el.height;
            break;
        }
        return {
          id: el.id,
          position: { x: el.left, y: newPos.top },
        };
      } else {
        switch (alignment) {
          case 'start':
            newPos.left = alignPosition;
            break;
          case 'center':
            newPos.left = alignPosition - el.width / 2;
            break;
          case 'end':
            newPos.left = alignPosition - el.width;
            break;
        }
        return {
          id: el.id,
          position: { x: newPos.left, y: el.top },
        };
      }
    });
  }
}