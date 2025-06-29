import type { ElementBounds } from '../types/alignment.types';
import { OptimizedRTree } from './spatial-index-optimized';

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
 * R-tree 实现（原始版本，保留用于参考）
 * 注意：此实现存在大数据集的性能问题，请使用 OptimizedRTree
 */
class RTreeOriginal<T extends { id: string }> implements SpatialIndex<T> {
  private root: RTreeNode<T>;
  private maxEntries: number;
  private minEntries: number;
  private itemsMap: Map<string, { item: T; bounds: ElementBounds }> = new Map();

  constructor(maxEntries: number = 9) {
    this.maxEntries = Math.max(4, maxEntries);
    this.minEntries = Math.max(2, Math.floor(this.maxEntries * 0.4));
    this.root = this.createNode(true);
  }

  /**
   * 插入元素
   */
  insert(item: T, bounds: ElementBounds): void {
    this.itemsMap.set(item.id, { item, bounds });
    const entry: RTreeEntry<T> = { bounds, data: item };
    this.insertEntry(entry, this.root.height);
  }

  /**
   * 移除元素
   */
  remove(id: string): void {
    const itemData = this.itemsMap.get(id);
    if (!itemData) return;

    this.itemsMap.delete(id);
    this.removeEntry(itemData.item, itemData.bounds, this.root);
  }

  /**
   * 更新元素
   */
  update(item: T, bounds: ElementBounds): void {
    this.remove(item.id);
    this.insert(item, bounds);
  }

  /**
   * 搜索与给定边界相交的元素
   */
  search(searchBounds: Partial<ElementBounds>): T[] {
    const bounds = this.normalizeBounds(searchBounds);
    const results: T[] = [];
    this.searchNode(this.root, bounds, results);
    return results;
  }

  /**
   * 搜索给定半径内的元素
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

    // 先获取边界框内的所有元素
    const candidates = this.search(bounds);

    // 然后过滤出真正在半径内的元素
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
  }

  /**
   * 获取元素数量
   */
  size(): number {
    return this.itemsMap.size;
  }

  /**
   * 创建新节点
   */
  private createNode(isLeaf: boolean): RTreeNode<T> {
    return {
      bounds: this.createEmptyBounds(),
      isLeaf,
      entries: [],
      height: isLeaf ? 1 : 0,
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
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
    // For partial bounds, we need to handle them differently
    // If only left is provided, we want elements where right >= left
    // If only right is provided, we want elements where left <= right
    // etc.
    const left = bounds.left ?? -Infinity;
    const top = bounds.top ?? -Infinity;
    const right = bounds.right ?? Infinity;
    const bottom = bounds.bottom ?? Infinity;

    return {
      id: bounds.id ?? '',
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
   * 插入条目
   */
  private insertEntry(entry: RTreeEntry<T>, level: number): void {
    const node = this.chooseLeaf(this.root, entry.bounds, level);
    node.entries.push(entry);
    this.extend(node.bounds, entry.bounds);

    if (node.entries.length > this.maxEntries) {
      this.split(node);
    } else {
      this.adjustBounds(node);
    }
  }

  /**
   * 选择叶子节点
   */
  private chooseLeaf(
    node: RTreeNode<T>,
    bounds: ElementBounds,
    level: number
  ): RTreeNode<T> {
    if (node.height === level) {
      return node;
    }

    let minEnlargement = Infinity;
    let minArea = Infinity;
    let targetEntry: RTreeEntry<T> | null = null;

    for (const entry of node.entries) {
      if (!entry.child) continue;

      const area = this.getArea(entry.bounds);
      const enlargement = this.getEnlargement(entry.bounds, bounds);

      if (enlargement < minEnlargement ||
          (enlargement === minEnlargement && area < minArea)) {
        minEnlargement = enlargement;
        minArea = area;
        targetEntry = entry;
      }
    }

    if (!targetEntry?.child) {
      throw new Error('Invalid tree structure');
    }

    return this.chooseLeaf(targetEntry.child, bounds, level);
  }

  /**
   * 分裂节点
   */
  private split(node: RTreeNode<T>): void {
    const newNode = this.createNode(node.isLeaf);
    newNode.height = node.height;

    const seeds = this.pickSeeds(node.entries);
    const group1: RTreeEntry<T>[] = [seeds[0]];
    const group2: RTreeEntry<T>[] = [seeds[1]];

    this.distributeEntries(
      node.entries.filter(e => e !== seeds[0] && e !== seeds[1]),
      group1,
      group2
    );

    node.entries = group1;
    newNode.entries = group2;

    this.calcBounds(node);
    this.calcBounds(newNode);

    if (node === this.root) {
      const newRoot = this.createNode(false);
      newRoot.height = node.height + 1;
      newRoot.entries.push(
        { bounds: node.bounds, child: node },
        { bounds: newNode.bounds, child: newNode }
      );
      this.calcBounds(newRoot);
      this.root = newRoot;
    } else {
      this.insertEntry({ bounds: newNode.bounds, child: newNode }, newNode.height);
    }
  }

  /**
   * 选择种子节点
   */
  private pickSeeds(entries: RTreeEntry<T>[]): [RTreeEntry<T>, RTreeEntry<T>] {
    let maxWaste = -Infinity;
    let seed1: RTreeEntry<T> = entries[0];
    let seed2: RTreeEntry<T> = entries[1];

    for (let i = 0; i < entries.length - 1; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const bounds = this.combineBounds(entries[i].bounds, entries[j].bounds);
        const waste = this.getArea(bounds) -
                     this.getArea(entries[i].bounds) -
                     this.getArea(entries[j].bounds);

        if (waste > maxWaste) {
          maxWaste = waste;
          seed1 = entries[i];
          seed2 = entries[j];
        }
      }
    }

    return [seed1, seed2];
  }

  /**
   * 分配条目到两个组
   */
  private distributeEntries(
    entries: RTreeEntry<T>[],
    group1: RTreeEntry<T>[],
    group2: RTreeEntry<T>[]
  ): void {
    while (entries.length > 0) {
      if (group1.length + entries.length <= this.minEntries) {
        group1.push(...entries);
        break;
      }
      if (group2.length + entries.length <= this.minEntries) {
        group2.push(...entries);
        break;
      }

      const entry = entries.pop()!;
      const bounds1 = this.calcGroupBounds(group1);
      const bounds2 = this.calcGroupBounds(group2);

      const enlargement1 = this.getEnlargement(bounds1, entry.bounds);
      const enlargement2 = this.getEnlargement(bounds2, entry.bounds);

      if (enlargement1 < enlargement2) {
        group1.push(entry);
      } else if (enlargement2 < enlargement1) {
        group2.push(entry);
      } else {
        const area1 = this.getArea(bounds1);
        const area2 = this.getArea(bounds2);
        if (area1 < area2) {
          group1.push(entry);
        } else if (area2 < area1) {
          group2.push(entry);
        } else if (group1.length < group2.length) {
          group1.push(entry);
        } else {
          group2.push(entry);
        }
      }
    }
  }

  /**
   * 搜索节点
   */
  private searchNode(
    node: RTreeNode<T>,
    searchBounds: ElementBounds,
    results: T[]
  ): void {
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
   * 删除条目
   */
  private removeEntry(
    item: T,
    bounds: ElementBounds,
    node: RTreeNode<T>
  ): boolean {
    if (node.isLeaf) {
      const index = node.entries.findIndex(
        e => e.data && e.data.id === item.id
      );
      if (index !== -1) {
        node.entries.splice(index, 1);
        this.condenseTree(node);
        return true;
      }
      return false;
    }

    for (const entry of node.entries) {
      if (entry.child && this.intersects(entry.bounds, bounds)) {
        if (this.removeEntry(item, bounds, entry.child)) {
          this.calcBounds(node);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 压缩树
   */
  private condenseTree(node: RTreeNode<T>): void {
    if (node === this.root) {
      if (!node.isLeaf && node.entries.length === 1) {
        this.root = node.entries[0].child!;
      }
      return;
    }

    if (node.entries.length < this.minEntries) {
      // 重新插入所有条目
      const entries = [...node.entries];
      // 实际实现中需要从父节点中删除当前节点，然后重新插入所有条目
      // 这里简化处理
    } else {
      this.adjustBounds(node);
    }
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

    const bounds = { ...entries[0].bounds };
    for (let i = 1; i < entries.length; i++) {
      this.extend(bounds, entries[i].bounds);
    }
    return bounds;
  }

  /**
   * 扩展边界
   */
  private extend(bounds: ElementBounds, other: ElementBounds): void {
    bounds.left = Math.min(bounds.left, other.left);
    bounds.top = Math.min(bounds.top, other.top);
    bounds.right = Math.max(bounds.right, other.right);
    bounds.bottom = Math.max(bounds.bottom, other.bottom);
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    bounds.centerX = (bounds.left + bounds.right) / 2;
    bounds.centerY = (bounds.top + bounds.bottom) / 2;
  }

  /**
   * 合并边界
   */
  private combineBounds(b1: ElementBounds, b2: ElementBounds): ElementBounds {
    const result = { ...b1 };
    this.extend(result, b2);
    return result;
  }

  /**
   * 调整边界
   */
  private adjustBounds(node: RTreeNode<T>): void {
    this.calcBounds(node);
    // 递归向上调整父节点边界
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
}

// 导出优化版本作为默认 RTree
export { OptimizedRTree as RTree } from './spatial-index-optimized';

/**
 * 创建空间索引
 */
export function createSpatialIndex<T extends { id: string }>(
  maxEntries?: number
): SpatialIndex<T> {
  return new OptimizedRTree<T>(maxEntries);
}