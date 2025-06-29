# 专业对齐辅助线系统设计文档

## 1. 系统概述

本文档描述了基于 Konva.js 和 React-Konva 实现的高性能、专业级对齐辅助线系统。该系统参考了 Figma、Adobe XD、Sketch 等业界领先设计工具的最佳实践，并结合了 Polotno 等 Web 端编辑器的优秀实现。

### 1.1 核心目标

- **高性能**：支持 1000+ 元素的实时对齐检测，保持 60fps 流畅度
- **专业体验**：提供磁力吸附、智能间距、等分布检测等专业功能
- **可扩展性**：模块化设计，易于添加新的对齐策略
- **无依赖**：仅使用 Konva.js 原生功能，不依赖第三方对齐库

### 1.2 关键特性

1. **智能对齐检测**
   - 边缘对齐（上下左右）
   - 中心对齐（水平/垂直）
   - 等间距检测
   - 尺寸匹配检测

2. **磁力吸附效果**
   - 渐进式吸附强度
   - 可配置的吸附范围
   - 平滑的吸附动画

3. **视觉反馈**
   - 动态辅助线显示
   - 间距数值标注
   - 对齐点高亮提示
   - 不同类型辅助线的视觉区分

4. **性能优化**
   - 空间索引加速
   - 视口裁剪
   - 缓存机制
   - 自适应降级

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Canvas Component                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Viewport   │  │   Elements   │  │ AlignmentGuides  │  │
│  │   Manager    │  │   Renderer   │  │    Component     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                    │            │
├─────────┴──────────────────┴───────────────────┴────────────┤
│                     Alignment Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Spatial    │  │  Alignment   │  │    Guide Line    │  │
│  │    Index     │  │  Calculator  │  │     Renderer     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Magnetic   │  │   Spacing    │  │   Performance    │  │
│  │   Snapping   │  │  Detection   │  │     Monitor      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块

#### 2.2.1 空间索引模块 (Spatial Index)

使用 R-tree 数据结构实现高效的空间查询：

```typescript
interface SpatialIndex {
  insert(element: Element): void;
  remove(elementId: string): void;
  update(element: Element): void;
  queryIntersecting(bounds: Bounds): Element[];
  queryNearby(point: Point, radius: number): Element[];
  clear(): void;
}
```

**性能指标**：
- 插入/删除：O(log n)
- 范围查询：O(log n + k)，k 为结果数量
- 内存占用：O(n)

#### 2.2.2 对齐计算器 (Alignment Calculator)

负责计算元素间的对齐关系：

```typescript
interface AlignmentCalculator {
  // 计算对齐点
  calculateAlignmentPoints(element: Element): AlignmentPoint[];
  
  // 检测对齐
  detectAlignment(
    source: Element,
    targets: Element[],
    threshold: number
  ): AlignmentResult[];
  
  // 计算吸附力
  calculateMagneticForce(
    distance: number,
    threshold: number
  ): number;
}
```

#### 2.2.3 辅助线渲染器 (Guide Renderer)

使用 Konva 图形对象渲染辅助线：

```typescript
interface GuideRenderer {
  renderStaticGuides(guides: Guide[]): Konva.Group;
  renderDynamicGuides(guides: DynamicGuide[]): Konva.Group;
  renderMeasurements(measurements: Measurement[]): Konva.Group;
  animateGuideAppearance(guide: Konva.Line): void;
}
```

## 3. 核心算法

### 3.1 磁力吸附算法

磁力吸附使用非线性函数计算吸附强度，提供更自然的用户体验：

```typescript
/**
 * 计算磁力吸附强度
 * @param distance 当前距离
 * @param threshold 吸附阈值
 * @param curve 曲线类型 ('linear' | 'quadratic' | 'cubic')
 * @returns 吸附强度 [0, 1]
 */
function calculateMagneticStrength(
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
    
    default:
      return 1 - normalized;
  }
}

/**
 * 应用磁力吸附
 * @param position 当前位置
 * @param snapPoint 吸附点
 * @param strength 吸附强度
 * @returns 调整后的位置
 */
function applyMagneticSnap(
  position: Point,
  snapPoint: Point,
  strength: number
): Point {
  // 使用插值实现平滑过渡
  return {
    x: position.x + (snapPoint.x - position.x) * strength,
    y: position.y + (snapPoint.y - position.y) * strength
  };
}
```

### 3.2 智能间距检测算法

检测元素间的等间距分布，帮助用户创建整齐的布局：

```typescript
/**
 * 检测等间距分布
 * @param elements 元素数组
 * @param axis 检测轴向 ('horizontal' | 'vertical')
 * @param tolerance 容差值
 * @returns 间距信息
 */
function detectEqualSpacing(
  elements: Element[],
  axis: 'horizontal' | 'vertical',
  tolerance: number = 2
): SpacingInfo[] {
  // 1. 按位置排序
  const sorted = [...elements].sort((a, b) => {
    return axis === 'horizontal' ? 
      a.bounds.left - b.bounds.left : 
      a.bounds.top - b.bounds.top;
  });
  
  // 2. 计算相邻元素间距
  const spacings: Array<{
    value: number;
    between: [string, string];
  }> = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    const spacing = axis === 'horizontal' ?
      curr.bounds.left - prev.bounds.right :
      curr.bounds.top - prev.bounds.bottom;
    
    spacings.push({
      value: spacing,
      between: [prev.id, curr.id]
    });
  }
  
  // 3. 查找重复间距（使用容差）
  const groups = groupByTolerance(spacings, tolerance);
  
  // 4. 返回出现2次以上的间距模式
  return groups
    .filter(group => group.length >= 2)
    .map(group => ({
      spacing: Math.round(group[0].value),
      count: group.length,
      elements: extractElements(group)
    }));
}

/**
 * 分布对齐算法
 * 将选中元素按等间距分布
 */
function distributeElements(
  elements: Element[],
  axis: 'horizontal' | 'vertical',
  spacing?: number
): ElementUpdate[] {
  const sorted = [...elements].sort((a, b) => {
    return axis === 'horizontal' ? 
      a.bounds.left - b.bounds.left : 
      a.bounds.top - b.bounds.top;
  });
  
  // 计算总宽度/高度
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const totalSize = axis === 'horizontal' ?
    last.bounds.right - first.bounds.left :
    last.bounds.bottom - first.bounds.top;
  
  // 计算元素占用的空间
  const elementSize = sorted.reduce((sum, el) => {
    return sum + (axis === 'horizontal' ? 
      el.bounds.width : el.bounds.height);
  }, 0);
  
  // 计算间距
  const gaps = sorted.length - 1;
  const calculatedSpacing = spacing ?? 
    (totalSize - elementSize) / gaps;
  
  // 生成更新
  const updates: ElementUpdate[] = [];
  let currentPos = axis === 'horizontal' ? 
    first.bounds.left : first.bounds.top;
  
  sorted.forEach((el, index) => {
    if (index > 0) {
      updates.push({
        id: el.id,
        [axis === 'horizontal' ? 'x' : 'y']: currentPos
      });
    }
    
    currentPos += (axis === 'horizontal' ? 
      el.bounds.width : el.bounds.height) + calculatedSpacing;
  });
  
  return updates;
}
```

### 3.3 空间索引优化

使用 R-tree 实现高效的空间查询：

```typescript
/**
 * R-tree 实现
 * 优化大量元素的空间查询性能
 */
class RTree<T extends { bounds: Bounds }> {
  private root: RTreeNode<T>;
  private maxEntries: number = 9;
  private minEntries: number = 4;
  
  insert(item: T): void {
    const leaf = this.chooseLeaf(this.root, item.bounds);
    leaf.entries.push({ bounds: item.bounds, data: item });
    
    if (leaf.entries.length > this.maxEntries) {
      this.split(leaf);
    }
    
    this.adjustTree(leaf);
  }
  
  search(searchBounds: Bounds): T[] {
    const results: T[] = [];
    this.searchNode(this.root, searchBounds, results);
    return results;
  }
  
  private searchNode(
    node: RTreeNode<T>, 
    searchBounds: Bounds, 
    results: T[]
  ): void {
    if (!intersects(node.bounds, searchBounds)) {
      return;
    }
    
    if (node.isLeaf) {
      for (const entry of node.entries) {
        if (intersects(entry.bounds, searchBounds)) {
          results.push(entry.data);
        }
      }
    } else {
      for (const child of node.children) {
        this.searchNode(child, searchBounds, results);
      }
    }
  }
}
```

### 3.4 视口优化策略

只处理视口内及附近的元素，大幅提升性能：

```typescript
/**
 * 视口管理器
 * 负责视口相关的优化
 */
class ViewportManager {
  private viewport: Viewport;
  private buffer: number = 100; // 视口外缓冲区域
  private visibleElements: Set<string> = new Set();
  
  /**
   * 获取视口内的元素
   */
  getVisibleElements(elements: Element[]): Element[] {
    const expandedBounds = {
      left: this.viewport.x - this.buffer,
      top: this.viewport.y - this.buffer,
      right: this.viewport.x + this.viewport.width + this.buffer,
      bottom: this.viewport.y + this.viewport.height + this.buffer
    };
    
    return elements.filter(el => {
      const isVisible = intersects(el.bounds, expandedBounds);
      
      // 跟踪可见性变化
      if (isVisible && !this.visibleElements.has(el.id)) {
        this.onElementBecameVisible(el);
      } else if (!isVisible && this.visibleElements.has(el.id)) {
        this.onElementBecameInvisible(el);
      }
      
      return isVisible;
    });
  }
  
  /**
   * 动态加载优化
   * 根据元素密度调整处理策略
   */
  getOptimizationLevel(elementCount: number): OptimizationLevel {
    const density = elementCount / 
      (this.viewport.width * this.viewport.height);
    
    if (density > 0.001) {
      return 'aggressive'; // 降低对齐精度，禁用某些特性
    } else if (density > 0.0005) {
      return 'moderate';   // 正常精度，启用核心特性
    } else {
      return 'none';       // 完整功能
    }
  }
}
```

## 4. 性能优化策略

### 4.1 缓存机制

```typescript
/**
 * 对齐缓存
 * 缓存计算结果避免重复计算
 */
class AlignmentCache {
  private cache = new Map<string, CachedAlignment>();
  private maxSize = 1000;
  private hitRate = { hits: 0, misses: 0 };
  
  get(key: string): CachedAlignment | null {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      this.hitRate.hits++;
      return cached;
    }
    this.hitRate.misses++;
    return null;
  }
  
  set(key: string, value: AlignmentResult): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  private generateKey(source: Element, target: Element): string {
    // 使用元素位置和大小生成缓存键
    return `${source.id}-${target.id}-${source.x}-${source.y}-${target.x}-${target.y}`;
  }
}
```

### 4.2 批处理优化

```typescript
/**
 * 批处理管理器
 * 合并多个对齐检测请求
 */
class BatchProcessor {
  private pendingRequests: AlignmentRequest[] = [];
  private batchTimeout: number | null = null;
  private batchSize = 50;
  
  scheduleAlignment(request: AlignmentRequest): Promise<AlignmentResult> {
    return new Promise((resolve) => {
      this.pendingRequests.push({ ...request, resolve });
      
      if (this.pendingRequests.length >= this.batchSize) {
        this.processBatch();
      } else {
        this.scheduleBatch();
      }
    });
  }
  
  private scheduleBatch(): void {
    if (this.batchTimeout) return;
    
    this.batchTimeout = requestAnimationFrame(() => {
      this.processBatch();
    });
  }
  
  private processBatch(): void {
    const requests = this.pendingRequests.splice(0, this.batchSize);
    const results = this.batchCalculateAlignments(requests);
    
    requests.forEach((req, index) => {
      req.resolve(results[index]);
    });
    
    this.batchTimeout = null;
  }
}
```

### 4.3 性能监控

```typescript
/**
 * 性能监控器
 * 实时监控对齐系统性能
 */
class PerformanceMonitor {
  private metrics = {
    alignmentChecks: 0,
    averageCheckTime: 0,
    maxCheckTime: 0,
    cacheHitRate: 0,
    frameDrops: 0
  };
  
  private degradationThreshold = {
    checkTime: 16,      // 超过16ms触发降级
    frameDrops: 3       // 3帧掉帧触发降级
  };
  
  measureAlignment<T>(operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    this.updateMetrics(duration);
    
    if (this.shouldDegrade()) {
      this.enableDegradedMode();
    }
    
    return result;
  }
  
  private shouldDegrade(): boolean {
    return this.metrics.averageCheckTime > this.degradationThreshold.checkTime ||
           this.metrics.frameDrops > this.degradationThreshold.frameDrops;
  }
  
  private enableDegradedMode(): void {
    // 降级策略
    // 1. 增加对齐阈值（减少检测频率）
    // 2. 禁用智能间距检测
    // 3. 减少动态辅助线数量
    // 4. 简化视觉效果
    console.warn('Performance degradation detected, enabling optimized mode');
  }
}
```

## 5. 用户交互设计

### 5.1 键盘快捷键

| 快捷键 | 功能 |
|-------|------|
| `Alt` (按住) | 临时禁用对齐 |
| `Shift` (按住) | 限制为 45° 角度移动 |
| `Ctrl + Alt + G` | 显示/隐藏辅助线 |
| `Ctrl + Shift + ;` | 锁定/解锁辅助线 |

### 5.2 鼠标交互

1. **辅助线交互**
   - 悬停：高亮显示
   - 单击：选中辅助线
   - 双击：删除辅助线
   - 拖拽：移动辅助线位置

2. **从标尺创建辅助线**
   - 从标尺拖出：创建新辅助线
   - 拖回标尺：删除辅助线

### 5.3 视觉反馈层次

```typescript
const visualFeedbackConfig = {
  // 辅助线样式
  guides: {
    static: {
      stroke: '#E5E7EB',    // 灰色静态辅助线
      strokeWidth: 1,
      dash: [4, 4]
    },
    dynamic: {
      stroke: '#3B82F6',    // 蓝色动态辅助线
      strokeWidth: 1,
      dash: null            // 实线
    },
    center: {
      stroke: '#10B981',    // 绿色中心线
      strokeWidth: 1,
      dash: [8, 4]
    },
    spacing: {
      stroke: '#F59E0B',    // 橙色间距线
      strokeWidth: 1,
      dash: [2, 2]
    }
  },
  
  // 测量标注样式
  measurements: {
    fontSize: 11,
    fill: '#6B7280',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
    cornerRadius: 3
  },
  
  // 动画配置
  animations: {
    guideAppear: {
      duration: 150,
      easing: 'ease-out'
    },
    snapFeedback: {
      duration: 100,
      scale: 1.05
    }
  }
};
```

## 6. 实施计划

### 第一阶段：核心功能实现（第1-2周）
1. 实现空间索引结构
2. 完成基础对齐算法
3. 集成到现有拖拽系统
4. 添加基本视觉反馈

### 第二阶段：高级功能（第3-4周）
1. 实现磁力吸附效果
2. 添加智能间距检测
3. 实现从标尺创建辅助线
4. 优化性能和缓存

### 第三阶段：用户体验优化（第5周）
1. 完善键盘快捷键
2. 添加动画效果
3. 实现配置面板
4. 性能监控和自适应优化

### 第四阶段：测试和优化（第6周）
1. 编写完整测试套件
2. 性能基准测试
3. 用户体验测试
4. 文档完善

## 7. 性能基准

### 目标性能指标

| 场景 | 元素数量 | 目标响应时间 | 目标帧率 |
|-----|---------|------------|----------|
| 轻量场景 | < 50 | < 1ms | 60 fps |
| 中等场景 | 50-200 | < 5ms | 60 fps |
| 复杂场景 | 200-500 | < 10ms | 60 fps |
| 极限场景 | 500-1000 | < 16ms | 60 fps |

### 测试方法

```typescript
// 性能基准测试
async function runPerformanceBenchmark() {
  const scenarios = [
    { name: 'Light', elementCount: 50 },
    { name: 'Medium', elementCount: 200 },
    { name: 'Heavy', elementCount: 500 },
    { name: 'Extreme', elementCount: 1000 }
  ];
  
  for (const scenario of scenarios) {
    const elements = generateRandomElements(scenario.elementCount);
    const results = await measureAlignmentPerformance(elements);
    
    console.log(`${scenario.name} scenario results:`, {
      avgTime: results.averageTime,
      maxTime: results.maxTime,
      fps: results.averageFPS
    });
  }
}
```

## 8. 与现有系统集成

### 8.1 Canvas 组件集成

```typescript
// Canvas.tsx 集成示例
function Canvas() {
  const { viewport, elements } = useCanvasState();
  const alignment = useAlignment({
    config: {
      enabled: true,
      threshold: 5,
      snapToGrid: true,
      gridSize: 10
    }
  });
  
  return (
    <Stage>
      <Layer>
        {/* 网格背景 */}
        <GridBackground />
        
        {/* 元素渲染 */}
        <ElementsRenderer elements={elements} />
        
        {/* 对齐辅助线 */}
        <AlignmentGuides 
          staticGuides={alignment.staticGuides}
          dynamicGuides={alignment.dynamicGuides}
          viewport={viewport}
        />
        
        {/* 选择框和控制手柄 */}
        <SelectionOverlay />
      </Layer>
    </Stage>
  );
}
```

### 8.2 拖拽系统集成

```typescript
// useDragAndDrop.ts 集成
function useDragAndDrop() {
  const alignment = useAlignment();
  
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const position = { x: node.x(), y: node.y() };
    
    // 检查对齐
    const alignmentResult = alignment.checkDragAlignment(
      node.id(), 
      position
    );
    
    if (alignmentResult.aligned) {
      // 应用对齐位置
      node.x(alignmentResult.x);
      node.y(alignmentResult.y);
      
      // 显示吸附反馈
      showSnapFeedback(node);
    }
  }, [alignment]);
  
  return { handleDragMove };
}
```

## 9. 扩展性设计

系统设计支持以下扩展：

1. **自定义对齐策略**
   - 插件式对齐算法
   - 用户自定义对齐规则

2. **智能布局建议**
   - 基于设计原则的布局推荐
   - AI 辅助对齐

3. **协作功能**
   - 共享辅助线
   - 实时协作时的对齐同步

4. **高级测量工具**
   - 角度测量
   - 路径长度测量
   - 面积计算

## 10. 参考资源

1. **Konva.js 官方文档**
   - [Snapping Tutorial](https://konvajs.org/docs/sandbox/Objects_Snapping.html)
   - [Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)

2. **业界最佳实践**
   - Figma: [Building a professional design tool on the web](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)
   - Adobe: [Snap and Align in Creative Cloud](https://helpx.adobe.com/illustrator/using/snap-align.html)

3. **算法参考**
   - [R-tree: A Dynamic Index Structure](https://en.wikipedia.org/wiki/R-tree)
   - [Spatial Indexing for Graphics](https://www.cs.umd.edu/~mount/Papers/cgta95-spiraltree.pdf)

4. **性能优化**
   - [Optimizing Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
   - [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

本设计文档为模板编辑器的对齐系统提供了完整的技术方案。通过结合业界最佳实践和创新算法，我们将打造一个高性能、专业级的对齐辅助系统。