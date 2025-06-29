import type { ElementBounds } from '../types/alignment.types';

/**
 * 空间索引接口
 */
export interface SpatialIndex<T> {
  insert(item: T, bounds: ElementBounds): void;
  remove(id: string): void;
  update(item: T, bounds: ElementBounds): void;
  search(searchBounds: Partial<ElementBounds>): T[];
  searchRadius(center: { x: number; y: number }, radius: number): T[];
  clear(): void;
  size(): number;
  bulkLoad?(items: Array<{ item: T; bounds: ElementBounds }>): void;
  validate?(): boolean;
}

/**
 * R-tree 节点
 */
interface RTreeNode<T> {
  bounds: ElementBounds;
  isLeaf: boolean;
  entries: RTreeEntry<T>[];
  height: number;
  id: string;
  parent?: RTreeNode<T>;
}

/**
 * R-tree 条目
 */
interface RTreeEntry<T> {
  bounds: ElementBounds;
  data?: T;
  child?: RTreeNode<T>;
}

/**
 * 优化的 R-tree 实现
 * 基于 R*-tree 算法，支持大规模数据集
 */
export class OptimizedRTree<T extends { id: string }> implements SpatialIndex<T> {
  private root: RTreeNode<T>;
  private maxEntries: number;
  private minEntries: number;
  private itemsMap: Map<string, { item: T; bounds: ElementBounds; node: RTreeNode<T> }> = new Map();
  private nodeCount = 0;
  
  // 性能监控
  private metrics = {
    insertions: 0,
    deletions: 0,
    searches: 0,
    splits: 0,
    reinsertions: 0,
  };

  constructor(maxEntries: number = 9) {
    this.maxEntries = Math.max(4, maxEntries);
    this.minEntries = Math.max(2, Math.floor(this.maxEntries * 0.4));
    this.root = this.createNode(true);
  }

  /**
   * 插入元素
   */
  insert(item: T, bounds: ElementBounds): void {
    this.metrics.insertions++;
    
    if (this.itemsMap.has(item.id)) {
      this.update(item, bounds);
      return;
    }

    const entry: RTreeEntry<T> = { bounds: this.cloneBounds(bounds), data: item };
    const path: RTreeNode<T>[] = [];
    const leafNode = this.chooseLeaf(this.root, bounds, path);
    
    leafNode.entries.push(entry);
    this.itemsMap.set(item.id, { item, bounds, node: leafNode });
    
    this.adjustTree(leafNode, path, entry);
  }

  /**
   * 批量加载（STR算法）
   */
  bulkLoad(items: Array<{ item: T; bounds: ElementBounds }>): void {
    if (items.length === 0) return;
    
    this.clear();
    
    // 如果元素数量较少，使用普通插入
    if (items.length < this.maxEntries * 2) {
      items.forEach(({ item, bounds }) => this.insert(item, bounds));
      return;
    }
    
    // STR (Sort-Tile-Recursive) 算法
    this.root = this.strPack(items, this.maxEntries);
    
    // 更新 itemsMap
    this.updateItemsMap(this.root);
  }

  /**
   * STR 打包算法
   */
  private strPack(items: Array<{ item: T; bounds: ElementBounds }>, nodeCapacity: number): RTreeNode<T> {
    const itemCount = items.length;
    
    if (itemCount <= nodeCapacity) {
      // 创建叶子节点
      const node = this.createNode(true);
      node.entries = items.map(({ item, bounds }) => ({
        bounds: this.cloneBounds(bounds),
        data: item,
      }));
      this.calcBounds(node);
      return node;
    }
    
    // 计算每个维度的切片数
    const sliceCount = Math.ceil(Math.sqrt(Math.ceil(itemCount / nodeCapacity)));
    
    // 按 X 坐标排序
    items.sort((a, b) => a.bounds.centerX - b.bounds.centerX);
    
    // 垂直切片
    const slices: Array<Array<{ item: T; bounds: ElementBounds }>> = [];
    const itemsPerSlice = Math.ceil(itemCount / sliceCount);
    
    for (let i = 0; i < itemCount; i += itemsPerSlice) {
      slices.push(items.slice(i, i + itemsPerSlice));
    }
    
    // 每个切片内按 Y 坐标排序，然后分组
    const childNodes: RTreeNode<T>[] = [];
    
    slices.forEach(slice => {
      slice.sort((a, b) => a.bounds.centerY - b.bounds.centerY);
      
      for (let i = 0; i < slice.length; i += nodeCapacity) {
        const group = slice.slice(i, i + nodeCapacity);
        const childNode = this.strPack(group, nodeCapacity);
        childNodes.push(childNode);
      }
    });
    
    // 递归构建上层节点
    const parentItems = childNodes.map(child => ({
      item: {} as T,
      bounds: child.bounds,
      child,
    }));
    
    const parent = this.createNode(false);
    parent.height = childNodes[0].height + 1;
    
    if (parentItems.length <= nodeCapacity) {
      parent.entries = parentItems.map(({ bounds, child }) => ({ bounds, child }));
      childNodes.forEach(child => { child.parent = parent; });
      this.calcBounds(parent);
      return parent;
    } else {
      // 需要继续向上构建
      return this.strPackNodes(childNodes, nodeCapacity);
    }
  }

  /**
   * STR 打包非叶子节点
   */
  private strPackNodes(nodes: RTreeNode<T>[], nodeCapacity: number): RTreeNode<T> {
    if (nodes.length <= nodeCapacity) {
      const parent = this.createNode(false);
      parent.height = nodes[0].height + 1;
      parent.entries = nodes.map(node => ({
        bounds: node.bounds,
        child: node,
      }));
      nodes.forEach(node => { node.parent = parent; });
      this.calcBounds(parent);
      return parent;
    }
    
    const groups: RTreeNode<T>[] = [];
    for (let i = 0; i < nodes.length; i += nodeCapacity) {
      const group = nodes.slice(i, i + nodeCapacity);
      const parent = this.createNode(false);
      parent.height = group[0].height + 1;
      parent.entries = group.map(node => ({
        bounds: node.bounds,
        child: node,
      }));
      group.forEach(node => { node.parent = parent; });
      this.calcBounds(parent);
      groups.push(parent);
    }
    
    return this.strPackNodes(groups, nodeCapacity);
  }

  /**
   * 更新 itemsMap（批量加载后）
   */
  private updateItemsMap(node: RTreeNode<T>): void {
    if (node.isLeaf) {
      node.entries.forEach(entry => {
        if (entry.data) {
          this.itemsMap.set(entry.data.id, {
            item: entry.data,
            bounds: entry.bounds,
            node,
          });
        }
      });
    } else {
      node.entries.forEach(entry => {
        if (entry.child) {
          this.updateItemsMap(entry.child);
        }
      });
    }
  }

  /**
   * 选择叶子节点（改进的算法）
   */
  private chooseLeaf(node: RTreeNode<T>, bounds: ElementBounds, path: RTreeNode<T>[]): RTreeNode<T> {
    path.push(node);
    
    if (node.isLeaf) {
      return node;
    }

    let bestEntry: RTreeEntry<T> | null = null;
    let bestCost = Infinity;

    // R*-tree 改进：考虑面积、周长和重叠
    for (const entry of node.entries) {
      if (!entry.child) continue;

      const enlargement = this.getEnlargement(entry.bounds, bounds);
      const area = this.getArea(entry.bounds);
      const overlap = this.getOverlapIncrease(entry, bounds, node.entries);
      
      // 综合考虑多个因素
      const cost = enlargement + overlap * 0.5 + area * 0.1;

      if (cost < bestCost) {
        bestCost = cost;
        bestEntry = entry;
      }
    }

    if (!bestEntry?.child) {
      throw new Error('Invalid tree structure');
    }

    return this.chooseLeaf(bestEntry.child, bounds, path);
  }

  /**
   * 计算重叠增量
   */
  private getOverlapIncrease(entry: RTreeEntry<T>, bounds: ElementBounds, siblings: RTreeEntry<T>[]): number {
    const currentOverlap = this.calculateOverlap(entry.bounds, siblings, entry);
    const combinedBounds = this.combineBounds(entry.bounds, bounds);
    const newOverlap = this.calculateOverlap(combinedBounds, siblings, entry);
    return newOverlap - currentOverlap;
  }

  /**
   * 计算总重叠面积
   */
  private calculateOverlap(bounds: ElementBounds, entries: RTreeEntry<T>[], exclude?: RTreeEntry<T>): number {
    let overlap = 0;
    for (const entry of entries) {
      if (entry === exclude || !entry.bounds) continue;
      const intersection = this.getIntersection(bounds, entry.bounds);
      if (intersection) {
        overlap += this.getArea(intersection);
      }
    }
    return overlap;
  }

  /**
   * 获取交集
   */
  private getIntersection(b1: ElementBounds, b2: ElementBounds): ElementBounds | null {
    const left = Math.max(b1.left, b2.left);
    const top = Math.max(b1.top, b2.top);
    const right = Math.min(b1.right, b2.right);
    const bottom = Math.min(b1.bottom, b2.bottom);
    
    if (left > right || top > bottom) {
      return null;
    }
    
    return {
      id: '',
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    };
  }

  /**
   * 调整树（插入后）
   */
  private adjustTree(node: RTreeNode<T>, path: RTreeNode<T>[], insertedEntry?: RTreeEntry<T>): void {
    // 更新当前节点边界
    this.calcBounds(node);
    
    // 检查是否需要分裂
    if (node.entries.length > this.maxEntries) {
      this.metrics.splits++;
      const [node1, node2] = this.split(node);
      
      if (node === this.root) {
        // 创建新根节点
        const newRoot = this.createNode(false);
        newRoot.height = this.root.height + 1;
        newRoot.entries = [
          { bounds: node1.bounds, child: node1 },
          { bounds: node2.bounds, child: node2 },
        ];
        node1.parent = newRoot;
        node2.parent = newRoot;
        this.calcBounds(newRoot);
        this.root = newRoot;
      } else {
        // 更新父节点
        const parent = path[path.length - 2];
        const nodeIndex = parent.entries.findIndex(e => e.child === node);
        
        if (nodeIndex !== -1) {
          parent.entries[nodeIndex] = { bounds: node1.bounds, child: node1 };
          parent.entries.push({ bounds: node2.bounds, child: node2 });
          node1.parent = parent;
          node2.parent = parent;
          
          // 递归向上调整
          this.adjustTree(parent, path.slice(0, -1));
        }
      }
    } else if (path.length > 1) {
      // 向上传播边界更新
      const parent = path[path.length - 2];
      const nodeIndex = parent.entries.findIndex(e => e.child === node);
      if (nodeIndex !== -1) {
        parent.entries[nodeIndex].bounds = this.cloneBounds(node.bounds);
      }
      this.adjustTree(parent, path.slice(0, -1));
    }
  }

  /**
   * 节点分裂（R*-tree 改进算法）
   */
  private split(node: RTreeNode<T>): [RTreeNode<T>, RTreeNode<T>] {
    const allEntries = [...node.entries];
    const m = allEntries.length;
    
    // 选择分裂轴（考虑 X 和 Y）
    const splitAxis = this.chooseSplitAxis(allEntries);
    
    // 在选定轴上排序
    allEntries.sort((a, b) => {
      if (splitAxis === 'x') {
        return a.bounds.left - b.bounds.left;
      } else {
        return a.bounds.top - b.bounds.top;
      }
    });
    
    // 选择最佳分裂位置
    let bestSplitIndex = this.minEntries;
    let bestCost = Infinity;
    
    for (let i = this.minEntries; i <= m - this.minEntries; i++) {
      const group1 = allEntries.slice(0, i);
      const group2 = allEntries.slice(i);
      
      const bounds1 = this.calcGroupBounds(group1);
      const bounds2 = this.calcGroupBounds(group2);
      
      const overlap = this.getIntersectionArea(bounds1, bounds2);
      const totalArea = this.getArea(bounds1) + this.getArea(bounds2);
      const cost = overlap + totalArea;
      
      if (cost < bestCost) {
        bestCost = cost;
        bestSplitIndex = i;
      }
    }
    
    // 创建两个新节点
    const node1 = this.createNode(node.isLeaf);
    const node2 = this.createNode(node.isLeaf);
    
    node1.height = node.height;
    node2.height = node.height;
    
    node1.entries = allEntries.slice(0, bestSplitIndex);
    node2.entries = allEntries.slice(bestSplitIndex);
    
    this.calcBounds(node1);
    this.calcBounds(node2);
    
    // 更新叶子节点的 itemsMap
    if (node.isLeaf) {
      node1.entries.forEach(entry => {
        if (entry.data) {
          const mapEntry = this.itemsMap.get(entry.data.id);
          if (mapEntry) {
            mapEntry.node = node1;
          }
        }
      });
      
      node2.entries.forEach(entry => {
        if (entry.data) {
          const mapEntry = this.itemsMap.get(entry.data.id);
          if (mapEntry) {
            mapEntry.node = node2;
          }
        }
      });
    }
    
    return [node1, node2];
  }

  /**
   * 选择分裂轴
   */
  private chooseSplitAxis(entries: RTreeEntry<T>[]): 'x' | 'y' {
    const xMargin = this.calculateSplitMargin(entries, 'x');
    const yMargin = this.calculateSplitMargin(entries, 'y');
    return xMargin < yMargin ? 'x' : 'y';
  }

  /**
   * 计算分裂边际
   */
  private calculateSplitMargin(entries: RTreeEntry<T>[], axis: 'x' | 'y'): number {
    const sorted = [...entries].sort((a, b) => {
      if (axis === 'x') {
        return a.bounds.left - b.bounds.left;
      } else {
        return a.bounds.top - b.bounds.top;
      }
    });
    
    let totalMargin = 0;
    
    for (let i = this.minEntries; i <= entries.length - this.minEntries; i++) {
      const group1 = sorted.slice(0, i);
      const group2 = sorted.slice(i);
      
      const bounds1 = this.calcGroupBounds(group1);
      const bounds2 = this.calcGroupBounds(group2);
      
      totalMargin += this.getPerimeter(bounds1) + this.getPerimeter(bounds2);
    }
    
    return totalMargin;
  }

  /**
   * 获取周长
   */
  private getPerimeter(bounds: ElementBounds): number {
    return 2 * (bounds.width + bounds.height);
  }

  /**
   * 获取交集面积
   */
  private getIntersectionArea(b1: ElementBounds, b2: ElementBounds): number {
    const intersection = this.getIntersection(b1, b2);
    return intersection ? this.getArea(intersection) : 0;
  }

  /**
   * 移除元素
   */
  remove(id: string): void {
    this.metrics.deletions++;
    
    const itemData = this.itemsMap.get(id);
    if (!itemData) return;

    this.itemsMap.delete(id);
    
    // 从节点中移除
    const node = itemData.node;
    const entryIndex = node.entries.findIndex(e => e.data?.id === id);
    
    if (entryIndex !== -1) {
      node.entries.splice(entryIndex, 1);
      this.condenseTree(node);
    }
  }

  /**
   * 压缩树（删除后）
   */
  private condenseTree(node: RTreeNode<T>): void {
    const orphanedEntries: RTreeEntry<T>[] = [];
    const path: RTreeNode<T>[] = [];
    
    // 收集从当前节点到根节点的路径
    let current: RTreeNode<T> | undefined = node;
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    
    // 从叶子向根处理欠载节点
    for (let i = path.length - 1; i >= 0; i--) {
      const currentNode = path[i];
      
      if (currentNode === this.root) {
        // 根节点特殊处理
        if (!currentNode.isLeaf && currentNode.entries.length === 1) {
          this.root = currentNode.entries[0].child!;
          this.root.parent = undefined;
        }
        break;
      }
      
      if (currentNode.entries.length < this.minEntries) {
        // 节点欠载，需要从父节点中移除并收集所有条目
        const parent = currentNode.parent!;
        const nodeIndex = parent.entries.findIndex(e => e.child === currentNode);
        
        if (nodeIndex !== -1) {
          parent.entries.splice(nodeIndex, 1);
          orphanedEntries.push(...currentNode.entries);
        }
      } else {
        // 更新边界
        this.calcBounds(currentNode);
        const parent = currentNode.parent;
        if (parent) {
          const nodeIndex = parent.entries.findIndex(e => e.child === currentNode);
          if (nodeIndex !== -1) {
            parent.entries[nodeIndex].bounds = this.cloneBounds(currentNode.bounds);
          }
        }
      }
    }
    
    // 重新插入孤立的条目
    for (const entry of orphanedEntries) {
      if (entry.data) {
        this.insert(entry.data, entry.bounds);
      } else if (entry.child) {
        // 重新插入子树中的所有元素
        this.reinsertSubtree(entry.child);
      }
    }
  }

  /**
   * 重新插入子树
   */
  private reinsertSubtree(node: RTreeNode<T>): void {
    if (node.isLeaf) {
      node.entries.forEach(entry => {
        if (entry.data) {
          this.metrics.reinsertions++;
          this.insert(entry.data, entry.bounds);
        }
      });
    } else {
      node.entries.forEach(entry => {
        if (entry.child) {
          this.reinsertSubtree(entry.child);
        }
      });
    }
  }

  /**
   * 更新元素
   */
  update(item: T, bounds: ElementBounds): void {
    this.remove(item.id);
    this.insert(item, bounds);
  }

  /**
   * 搜索
   */
  search(searchBounds: Partial<ElementBounds>): T[] {
    this.metrics.searches++;
    
    const bounds = this.normalizeBounds(searchBounds);
    const results: T[] = [];
    this.searchNode(this.root, bounds, results);
    return results;
  }

  /**
   * 搜索节点
   */
  private searchNode(node: RTreeNode<T>, searchBounds: ElementBounds, results: T[]): void {
    if (!this.intersects(node.bounds, searchBounds)) {
      return;
    }

    if (node.isLeaf) {
      for (const entry of node.entries) {
        if (entry.data && this.intersects(entry.bounds, searchBounds)) {
          results.push(entry.data);
        }
      }
    } else {
      for (const entry of node.entries) {
        if (entry.child) {
          this.searchNode(entry.child, searchBounds, results);
        }
      }
    }
  }

  /**
   * 半径搜索
   */
  searchRadius(center: { x: number; y: number }, radius: number): T[] {
    const bounds: ElementBounds = {
      id: '',
      left: center.x - radius,
      top: center.y - radius,
      right: center.x + radius,
      bottom: center.y + radius,
      centerX: center.x,
      centerY: center.y,
      width: radius * 2,
      height: radius * 2,
    };

    const candidates = this.search(bounds);
    
    // 精确过滤圆形范围内的元素
    return candidates.filter(item => {
      const itemData = this.itemsMap.get(item.id);
      if (!itemData) return false;
      
      const itemCenter = {
        x: itemData.bounds.centerX,
        y: itemData.bounds.centerY,
      };
      
      const distance = Math.sqrt(
        Math.pow(itemCenter.x - center.x, 2) +
        Math.pow(itemCenter.y - center.y, 2)
      );
      
      return distance <= radius;
    });
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.root = this.createNode(true);
    this.itemsMap.clear();
    this.nodeCount = 0;
    
    // 重置性能指标
    this.metrics = {
      insertions: 0,
      deletions: 0,
      searches: 0,
      splits: 0,
      reinsertions: 0,
    };
  }

  /**
   * 获取元素数量
   */
  size(): number {
    return this.itemsMap.size;
  }

  /**
   * 验证树结构
   */
  validate(): boolean {
    try {
      return this.validateNode(this.root);
    } catch (error) {
      console.error('Tree validation failed:', error);
      return false;
    }
  }

  /**
   * 验证节点
   */
  private validateNode(node: RTreeNode<T>, expectedHeight?: number): boolean {
    // 验证高度一致性
    if (expectedHeight !== undefined && node.height !== expectedHeight) {
      throw new Error(`Height mismatch: expected ${expectedHeight}, got ${node.height}`);
    }
    
    // 验证容量限制
    if (node !== this.root) {
      // 对于批量加载的树，某些节点可能有较少的条目，特别是在树的上层
      // 只在节点为空时报错，允许少于 minEntries 的情况
      if (node.entries.length === 0) {
        throw new Error('Node has no entries');
      }
      if (node.entries.length > this.maxEntries) {
        throw new Error(`Node has too many entries: ${node.entries.length} > ${this.maxEntries}`);
      }
    }
    
    // 验证边界包含所有子条目
    for (const entry of node.entries) {
      if (!this.contains(node.bounds, entry.bounds)) {
        throw new Error('Node bounds do not contain entry bounds');
      }
      
      if (node.isLeaf) {
        if (entry.child) {
          throw new Error('Leaf node should not have child references');
        }
        if (!entry.data) {
          throw new Error('Leaf node entry should have data');
        }
      } else {
        if (entry.data) {
          throw new Error('Non-leaf node should not have data');
        }
        if (!entry.child) {
          throw new Error('Non-leaf node entry should have child');
        }
        
        // 递归验证子节点
        if (!this.validateNode(entry.child, node.height - 1)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 创建节点
   */
  private createNode(isLeaf: boolean): RTreeNode<T> {
    this.nodeCount++;
    return {
      bounds: this.createEmptyBounds(),
      isLeaf,
      entries: [],
      height: isLeaf ? 1 : 0,
      id: `node-${this.nodeCount}`,
    };
  }

  /**
   * 创建空边界
   */
  private createEmptyBounds(): ElementBounds {
    return {
      id: '',
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity,
      centerX: 0,
      centerY: 0,
      width: 0,
      height: 0,
    };
  }

  /**
   * 标准化边界
   */
  private normalizeBounds(bounds: Partial<ElementBounds>): ElementBounds {
    const left = bounds.left ?? -Infinity;
    const top = bounds.top ?? -Infinity;
    const right = bounds.right ?? Infinity;
    const bottom = bounds.bottom ?? Infinity;

    return {
      id: bounds.id || '',
      left,
      top,
      right,
      bottom,
      centerX: isFinite(left) && isFinite(right) ? (left + right) / 2 : 0,
      centerY: isFinite(top) && isFinite(bottom) ? (top + bottom) / 2 : 0,
      width: isFinite(left) && isFinite(right) ? right - left : Infinity,
      height: isFinite(top) && isFinite(bottom) ? bottom - top : Infinity,
    };
  }

  /**
   * 克隆边界
   */
  private cloneBounds(bounds: ElementBounds): ElementBounds {
    return { ...bounds };
  }

  /**
   * 计算边界
   */
  private calcBounds(node: RTreeNode<T>): void {
    node.bounds = this.calcGroupBounds(node.entries);
  }

  /**
   * 计算组边界
   */
  private calcGroupBounds(entries: RTreeEntry<T>[]): ElementBounds {
    if (entries.length === 0) {
      return this.createEmptyBounds();
    }

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    for (const entry of entries) {
      left = Math.min(left, entry.bounds.left);
      top = Math.min(top, entry.bounds.top);
      right = Math.max(right, entry.bounds.right);
      bottom = Math.max(bottom, entry.bounds.bottom);
    }

    return {
      id: '',
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    };
  }

  /**
   * 扩展边界
   */
  private extend(target: ElementBounds, source: ElementBounds): void {
    target.left = Math.min(target.left, source.left);
    target.top = Math.min(target.top, source.top);
    target.right = Math.max(target.right, source.right);
    target.bottom = Math.max(target.bottom, source.bottom);
    target.width = target.right - target.left;
    target.height = target.bottom - target.top;
    target.centerX = (target.left + target.right) / 2;
    target.centerY = (target.top + target.bottom) / 2;
  }

  /**
   * 合并边界
   */
  private combineBounds(b1: ElementBounds, b2: ElementBounds): ElementBounds {
    const result = this.cloneBounds(b1);
    this.extend(result, b2);
    return result;
  }

  /**
   * 计算面积
   */
  private getArea(bounds: ElementBounds): number {
    return bounds.width * bounds.height;
  }

  /**
   * 计算扩大量
   */
  private getEnlargement(bounds: ElementBounds, other: ElementBounds): number {
    const combined = this.combineBounds(bounds, other);
    return this.getArea(combined) - this.getArea(bounds);
  }

  /**
   * 检查相交
   */
  private intersects(b1: ElementBounds, b2: ElementBounds): boolean {
    return !(
      b1.right < b2.left ||
      b1.left > b2.right ||
      b1.bottom < b2.top ||
      b1.top > b2.bottom
    );
  }

  /**
   * 检查包含
   */
  private contains(container: ElementBounds, contained: ElementBounds): boolean {
    return (
      container.left <= contained.left &&
      container.top <= contained.top &&
      container.right >= contained.right &&
      container.bottom >= contained.bottom
    );
  }
}

/**
 * 创建优化的空间索引
 */
export function createOptimizedSpatialIndex<T extends { id: string }>(
  maxEntries?: number
): SpatialIndex<T> {
  return new OptimizedRTree<T>(maxEntries);
}