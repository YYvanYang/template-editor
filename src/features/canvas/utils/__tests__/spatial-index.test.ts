import { describe, it, expect, beforeEach } from 'vitest';
import { RTree, createSpatialIndex } from '../spatial-index';
import { OptimizedRTree, createOptimizedSpatialIndex } from '../spatial-index-optimized';
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

      // Search with only left boundary - this creates a search from (150, -∞) to (∞, ∞)
      // elem1's right edge is at 150, so it intersects
      const results = rtree.search({ left: 150 });

      expect(results).toHaveLength(2); // Both elements intersect with x >= 150
      expect(results.map(r => r.id).sort()).toEqual(['elem1', 'elem2']);
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

describe('optimized-spatial-index', () => {
  let rtree: OptimizedRTree<{ id: string; bounds: ElementBounds }>;

  beforeEach(() => {
    rtree = new OptimizedRTree();
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

  describe('basic operations', () => {
    it('should insert and search elements', () => {
      const elem1 = createTestElement('1', 0, 0, 50, 50);
      const elem2 = createTestElement('2', 100, 100, 50, 50);
      
      rtree.insert(elem1, elem1.bounds);
      rtree.insert(elem2, elem2.bounds);
      
      expect(rtree.size()).toBe(2);
      
      const results = rtree.search({ left: 25, top: 25, right: 75, bottom: 75 });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should handle bulk loading', () => {
      const elements: Array<{ item: { id: string; bounds: ElementBounds }; bounds: ElementBounds }> = [];
      
      // Create a 10x10 grid
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const elem = createTestElement(`${row}-${col}`, col * 60, row * 60, 50, 50);
          elements.push({ item: elem, bounds: elem.bounds });
        }
      }
      
      rtree.bulkLoad(elements);
      
      expect(rtree.size()).toBe(100);
      expect(rtree.validate()).toBe(true);
      
      // Search in the middle
      const results = rtree.search({
        left: 150,
        top: 150,
        right: 350,
        bottom: 350,
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(16); // At most 4x4 grid
    });
  });

  describe('performance with large datasets', () => {
    it('should handle 1000 elements efficiently', () => {
      const elementCount = 1000;
      const elements: Array<{ item: { id: string; bounds: ElementBounds }; bounds: ElementBounds }> = [];
      
      // Create elements in a grid pattern
      const cols = Math.ceil(Math.sqrt(elementCount));
      for (let i = 0; i < elementCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const elem = createTestElement(
          `elem${i}`,
          col * 100,
          row * 100,
          50,
          50
        );
        elements.push({ item: elem, bounds: elem.bounds });
      }
      
      // Bulk load for better performance
      const loadStart = performance.now();
      rtree.bulkLoad(elements);
      const loadTime = performance.now() - loadStart;
      
      expect(rtree.size()).toBe(elementCount);
      expect(rtree.validate()).toBe(true);
      expect(loadTime).toBeLessThan(50); // Should load in < 50ms
      
      // Test search performance
      const searchStart = performance.now();
      const results = rtree.search({
        left: 500,
        top: 500,
        right: 1500,
        bottom: 1500,
      });
      const searchTime = performance.now() - searchStart;
      
      expect(results.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(5); // Search should be < 5ms
      
      // Get performance metrics
      const metrics = rtree.getMetrics();
      console.log('Performance metrics:', metrics);
    });

    it('should handle 10000 elements efficiently', () => {
      const elementCount = 10000;
      const elements: Array<{ item: { id: string; bounds: ElementBounds }; bounds: ElementBounds }> = [];
      
      // Create elements in a grid pattern
      const cols = Math.ceil(Math.sqrt(elementCount));
      for (let i = 0; i < elementCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const elem = createTestElement(
          `elem${i}`,
          col * 100,
          row * 100,
          50,
          50
        );
        elements.push({ item: elem, bounds: elem.bounds });
      }
      
      // Bulk load
      const loadStart = performance.now();
      rtree.bulkLoad(elements);
      const loadTime = performance.now() - loadStart;
      
      expect(rtree.size()).toBe(elementCount);
      expect(loadTime).toBeLessThan(200); // Should load in < 200ms
      
      // Test multiple searches
      const searchCount = 100;
      const totalSearchTime = performance.now();
      
      for (let i = 0; i < searchCount; i++) {
        const x = Math.random() * 10000;
        const y = Math.random() * 10000;
        const results = rtree.search({
          left: x,
          top: y,
          right: x + 500,
          bottom: y + 500,
        });
        expect(results).toBeDefined();
      }
      
      const avgSearchTime = (performance.now() - totalSearchTime) / searchCount;
      expect(avgSearchTime).toBeLessThan(2); // Average search < 2ms
    });
  });

  describe('edge cases', () => {
    it('should handle remove and reinsert', () => {
      const elements: Array<{ item: { id: string; bounds: ElementBounds }; bounds: ElementBounds }> = [];
      
      // Create 50 elements
      for (let i = 0; i < 50; i++) {
        const elem = createTestElement(`elem${i}`, i * 20, i * 20, 50, 50);
        elements.push({ item: elem, bounds: elem.bounds });
      }
      
      rtree.bulkLoad(elements);
      expect(rtree.size()).toBe(50);
      
      // Remove half
      for (let i = 0; i < 25; i++) {
        rtree.remove(`elem${i}`);
      }
      
      expect(rtree.size()).toBe(25);
      expect(rtree.validate()).toBe(true);
      
      // Reinsert with different positions
      for (let i = 0; i < 25; i++) {
        const elem = createTestElement(`elem${i}`, i * 30, i * 30, 60, 60);
        rtree.insert(elem, elem.bounds);
      }
      
      expect(rtree.size()).toBe(50);
      expect(rtree.validate()).toBe(true);
    });

    it('should handle radius search', () => {
      const elements: Array<{ item: { id: string; bounds: ElementBounds }; bounds: ElementBounds }> = [];
      
      // Create elements in a circle pattern
      const centerX = 500;
      const centerY = 500;
      const radius = 200;
      const count = 50;
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const elem = createTestElement(`elem${i}`, x - 25, y - 25, 50, 50);
        elements.push({ item: elem, bounds: elem.bounds });
      }
      
      rtree.bulkLoad(elements);
      
      // Search within radius
      const results = rtree.searchRadius({ x: centerX, y: centerY }, radius + 50);
      expect(results.length).toBe(count);
      
      // Search outside radius
      const outsideResults = rtree.searchRadius({ x: centerX, y: centerY }, radius / 2);
      expect(outsideResults.length).toBe(0);
    });
  });

  describe('createOptimizedSpatialIndex', () => {
    it('should create an optimized spatial index instance', () => {
      const index = createOptimizedSpatialIndex<{ id: string }>();
      
      expect(index).toBeDefined();
      expect(index.insert).toBeDefined();
      expect(index.search).toBeDefined();
      expect(index.remove).toBeDefined();
      expect(index.clear).toBeDefined();
      expect(index.bulkLoad).toBeDefined();
      expect(index.validate).toBeDefined();
    });
  });
});