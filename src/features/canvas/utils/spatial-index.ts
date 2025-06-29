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