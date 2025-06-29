import { describe, it, expect, beforeEach } from 'vitest';
import { RTree, createSpatialIndex } from '../spatial-index';
import type { ElementBounds } from '../../types/alignment.types';

describe('spatial-index', () => {
  let rtree: RTree<{ id: string; bounds: ElementBounds }>;

  beforeEach(() => {
    rtree = new RTree();
  });

  const createTestElement = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): { id: string; bounds: ElementBounds } => {
    const bounds: ElementBounds = {
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
    return { id, bounds };
  };

  describe('insert and search', () => {
    it('should insert and retrieve single element', () => {
      const element = createTestElement('elem1', 100, 100, 50, 50);
      rtree.insert(element, element.bounds);

      const results = rtree.search({
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('elem1');
    });

    it('should retrieve multiple overlapping elements', () => {
      const elem1 = createTestElement('elem1', 100, 100, 50, 50);
      const elem2 = createTestElement('elem2', 120, 120, 50, 50);
      const elem3 = createTestElement('elem3', 300, 300, 50, 50);

      rtree.insert(elem1, elem1.bounds);
      rtree.insert(elem2, elem2.bounds);
      rtree.insert(elem3, elem3.bounds);

      const results = rtree.search({
        left: 90,
        top: 90,
        right: 180,
        bottom: 180,
      });

      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['elem1', 'elem2']);
    });

    it('should handle exact boundary matches', () => {
      const element = createTestElement('elem1', 100, 100, 50, 50);
      rtree.insert(element, element.bounds);

      const results = rtree.search({
        left: 100,
        top: 100,
        right: 150,
        bottom: 150,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('elem1');
    });

    it('should return empty array for non-overlapping search', () => {
      const element = createTestElement('elem1', 100, 100, 50, 50);
      rtree.insert(element, element.bounds);

      const results = rtree.search({
        left: 200,
        top: 200,
        right: 300,
        bottom: 300,
      });

      expect(results).toHaveLength(0);
    });

    it('should handle partial search bounds', () => {
      const elem1 = createTestElement('elem1', 100, 100, 50, 50);
      const elem2 = createTestElement('elem2', 200, 200, 50, 50);

      rtree.insert(elem1, elem1.bounds);
      rtree.insert(elem2, elem2.bounds);

      // Search with only left boundary
      const results = rtree.search({ left: 150 });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('elem2');
    });
  });

  describe('searchRadius', () => {
    it('should find elements within radius', () => {
      const elem1 = createTestElement('elem1', 100, 100, 50, 50);
      const elem2 = createTestElement('elem2', 200, 100, 50, 50);
      const elem3 = createTestElement('elem3', 400, 400, 50, 50);

      rtree.insert(elem1, elem1.bounds);
      rtree.insert(elem2, elem2.bounds);
      rtree.insert(elem3, elem3.bounds);

      const results = rtree.searchRadius({ x: 150, y: 150 }, 100);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['elem1', 'elem2']);
    });

    it('should handle exact radius boundaries', () => {
      const element = createTestElement('elem1', 150, 150, 50, 50);
      rtree.insert(element, element.bounds);

      // Element center is at (175, 175)
      // Distance from (100, 100) to (175, 175) is ~106
      const results1 = rtree.searchRadius({ x: 100, y: 100 }, 105);
      expect(results1).toHaveLength(0);

      const results2 = rtree.searchRadius({ x: 100, y: 100 }, 110);
      expect(results2).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should remove element by id', () => {
      const elem1 = createTestElement('elem1', 100, 100, 50, 50);
      const elem2 = createTestElement('elem2', 200, 200, 50, 50);

      rtree.insert(elem1, elem1.bounds);
      rtree.insert(elem2, elem2.bounds);

      expect(rtree.size()).toBe(2);

      rtree.remove('elem1');

      expect(rtree.size()).toBe(1);
      const results = rtree.search({ left: 0, top: 0, right: 300, bottom: 300 });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('elem2');
    });

    it('should handle removing non-existent element', () => {
      const element = createTestElement('elem1', 100, 100, 50, 50);
      rtree.insert(element, element.bounds);

      rtree.remove('non-existent');

      expect(rtree.size()).toBe(1);
    });
  });

  describe('update', () => {
    it('should update element position', () => {
      const element = createTestElement('elem1', 100, 100, 50, 50);
      rtree.insert(element, element.bounds);

      // Move element to new position
      const updatedElement = createTestElement('elem1', 200, 200, 50, 50);
      rtree.update(updatedElement, updatedElement.bounds);

      // Should not find at old position
      const oldResults = rtree.search({
        left: 100,
        top: 100,
        right: 150,
        bottom: 150,
      });
      expect(oldResults).toHaveLength(0);

      // Should find at new position
      const newResults = rtree.search({
        left: 200,
        top: 200,
        right: 250,
        bottom: 250,
      });
      expect(newResults).toHaveLength(1);
      expect(newResults[0].id).toBe('elem1');
    });
  });

  describe('clear', () => {
    it('should remove all elements', () => {
      const elem1 = createTestElement('elem1', 100, 100, 50, 50);
      const elem2 = createTestElement('elem2', 200, 200, 50, 50);

      rtree.insert(elem1, elem1.bounds);
      rtree.insert(elem2, elem2.bounds);

      expect(rtree.size()).toBe(2);

      rtree.clear();

      expect(rtree.size()).toBe(0);
      const results = rtree.search({ left: 0, top: 0, right: 1000, bottom: 1000 });
      expect(results).toHaveLength(0);
    });
  });

  describe('performance with many elements', () => {
    it('should handle large number of elements efficiently', () => {
      const elementCount = 1000;
      const elements: Array<{ id: string; bounds: ElementBounds }> = [];

      // Insert elements in a grid pattern
      for (let i = 0; i < elementCount; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const element = createTestElement(
          `elem${i}`,
          col * 100,
          row * 100,
          50,
          50
        );
        elements.push(element);
        rtree.insert(element, element.bounds);
      }

      expect(rtree.size()).toBe(elementCount);

      // Search for elements in a specific area
      const startTime = performance.now();
      const results = rtree.search({
        left: 250,
        top: 250,
        right: 450,
        bottom: 450,
      });
      const searchTime = performance.now() - startTime;

      // Should find elements in the 3x3 grid area
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(20);
      
      // Search should be fast (< 5ms)
      expect(searchTime).toBeLessThan(5);
    });
  });

  describe('createSpatialIndex', () => {
    it('should create a spatial index instance', () => {
      const index = createSpatialIndex<{ id: string }>();
      
      expect(index).toBeDefined();
      expect(index.insert).toBeDefined();
      expect(index.search).toBeDefined();
      expect(index.remove).toBeDefined();
      expect(index.clear).toBeDefined();
    });

    it('should accept custom max entries', () => {
      const index = createSpatialIndex<{ id: string }>(16);
      
      // Should work normally with custom configuration
      const element = createTestElement('test', 0, 0, 10, 10);
      index.insert(element, element.bounds);
      
      const results = index.search({ left: 0, top: 0, right: 10, bottom: 10 });
      expect(results).toHaveLength(1);
    });
  });
});