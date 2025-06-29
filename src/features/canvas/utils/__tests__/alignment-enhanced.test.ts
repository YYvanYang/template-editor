import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedAlignmentEngine } from '../alignment-enhanced.utils';
import { DEFAULT_ALIGNMENT_CONFIG } from '../../types/alignment.types';
import type { GuideLine } from '../../types/alignment.types';

describe('EnhancedAlignmentEngine', () => {
  let engine: EnhancedAlignmentEngine;

  beforeEach(() => {
    engine = new EnhancedAlignmentEngine(DEFAULT_ALIGNMENT_CONFIG);
  });

  describe('calculateMagneticStrength', () => {
    it('should return 0 when distance exceeds threshold', () => {
      const strength = engine.calculateMagneticStrength(10, 5);
      expect(strength).toBe(0);
    });

    it('should return 1 when distance is 0', () => {
      const strength = engine.calculateMagneticStrength(0, 10);
      expect(strength).toBe(1);
    });

    it('should calculate linear magnetic strength', () => {
      const strength = engine.calculateMagneticStrength(5, 10, 'linear');
      expect(strength).toBe(0.5);
    });

    it('should calculate quadratic magnetic strength', () => {
      const strength = engine.calculateMagneticStrength(5, 10, 'quadratic');
      expect(strength).toBe(0.25); // (1 - 0.5)^2 = 0.25
    });

    it('should calculate cubic magnetic strength', () => {
      const strength = engine.calculateMagneticStrength(5, 10, 'cubic');
      expect(strength).toBe(0.125); // (1 - 0.5)^3 = 0.125
    });

    it('should calculate exponential magnetic strength', () => {
      const strength = engine.calculateMagneticStrength(5, 10, 'exponential');
      // Exponential curve calculation
      const expected = Math.exp(-3 * 0.5) - Math.exp(-3);
      expect(strength).toBeCloseTo(expected, 5);
    });
  });

  describe('applyMagneticSnap', () => {
    it('should interpolate position based on strength', () => {
      const position = { x: 100, y: 100 };
      const snapPoint = { x: 110, y: 90 };
      const strength = 0.5;

      const result = engine.applyMagneticSnap(position, snapPoint, strength);

      expect(result.x).toBe(105); // 100 + (110 - 100) * 0.5
      expect(result.y).toBe(95);  // 100 + (90 - 100) * 0.5
    });

    it('should not move when strength is 0', () => {
      const position = { x: 100, y: 100 };
      const snapPoint = { x: 200, y: 200 };
      const strength = 0;

      const result = engine.applyMagneticSnap(position, snapPoint, strength);

      expect(result).toEqual(position);
    });

    it('should fully snap when strength is 1', () => {
      const position = { x: 100, y: 100 };
      const snapPoint = { x: 200, y: 200 };
      const strength = 1;

      const result = engine.applyMagneticSnap(position, snapPoint, strength);

      expect(result).toEqual(snapPoint);
    });
  });

  describe('checkMagneticAlignment', () => {
    const guides: GuideLine[] = [
      {
        id: 'v1',
        orientation: 'vertical',
        position: 100,
        type: 'manual',
        visible: true,
      },
      {
        id: 'h1',
        orientation: 'horizontal',
        position: 200,
        type: 'manual',
        visible: true,
      },
    ];

    it('should detect magnetic alignment with vertical guide', () => {
      const element = {
        id: 'elem1',
        x: 98,
        y: 150,
        width: 50,
        height: 50,
        rotation: 0,
      };

      const result = engine.checkMagneticAlignment(
        element,
        { x: 98, y: 150 },
        guides
      );

      expect(result.aligned).toBe(true);
      expect(result.x).toBe(100); // Snapped to guide
      expect(result.magneticStrength).toBeGreaterThan(0);
      expect(result.smoothPosition.x).toBeCloseTo(99, 0); // Smooth interpolation
    });

    it('should detect magnetic alignment with horizontal guide', () => {
      const element = {
        id: 'elem1',
        x: 150,
        y: 198,
        width: 50,
        height: 50,
        rotation: 0,
      };

      const result = engine.checkMagneticAlignment(
        element,
        { x: 150, y: 198 },
        guides
      );

      expect(result.aligned).toBe(true);
      expect(result.y).toBe(200); // Snapped to guide
      expect(result.magneticStrength).toBeGreaterThan(0);
      expect(result.smoothPosition.y).toBeCloseTo(199, 0); // Smooth interpolation
    });

    it('should handle both vertical and horizontal alignment', () => {
      const element = {
        id: 'elem1',
        x: 98,
        y: 198,
        width: 50,
        height: 50,
        rotation: 0,
      };

      const result = engine.checkMagneticAlignment(
        element,
        { x: 98, y: 198 },
        guides
      );

      expect(result.aligned).toBe(true);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
      expect(result.verticalGuide).toBeDefined();
      expect(result.horizontalGuide).toBeDefined();
    });

    it('should consider element alignment points', () => {
      const element = {
        id: 'elem1',
        x: 75,
        y: 150,
        width: 50,
        height: 50,
        rotation: 0,
      };

      // Element right edge is at x=125, should align to guide at x=100
      const result = engine.checkMagneticAlignment(
        element,
        { x: 75, y: 150 },
        guides
      );

      expect(result.aligned).toBe(true);
      expect(result.x).toBe(50); // Adjusted so right edge aligns to guide
    });
  });

  describe('detectEqualSpacing', () => {
    it('should detect horizontal equal spacing', () => {
      const elements = [
        { id: '1', x: 0, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '2', x: 70, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '3', x: 140, y: 0, width: 50, height: 50, rotation: 0 },
      ];

      const spacings = engine.detectEqualSpacing(elements, 'horizontal');

      expect(spacings).toHaveLength(1);
      expect(spacings[0].spacing).toBe(20);
      expect(spacings[0].count).toBe(2);
      expect(spacings[0].elements).toContain('1');
      expect(spacings[0].elements).toContain('2');
      expect(spacings[0].elements).toContain('3');
    });

    it('should detect vertical equal spacing', () => {
      const elements = [
        { id: '1', x: 0, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '2', x: 0, y: 60, width: 50, height: 50, rotation: 0 },
        { id: '3', x: 0, y: 120, width: 50, height: 50, rotation: 0 },
      ];

      const spacings = engine.detectEqualSpacing(elements, 'vertical');

      expect(spacings).toHaveLength(1);
      expect(spacings[0].spacing).toBe(10);
      expect(spacings[0].count).toBe(2);
    });

    it('should group similar spacings within tolerance', () => {
      const elements = [
        { id: '1', x: 0, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '2', x: 71, y: 0, width: 50, height: 50, rotation: 0 },  // 21px gap
        { id: '3', x: 140, y: 0, width: 50, height: 50, rotation: 0 }, // 19px gap
        { id: '4', x: 210, y: 0, width: 50, height: 50, rotation: 0 }, // 20px gap
      ];

      const spacings = engine.detectEqualSpacing(elements, 'horizontal', 2);

      expect(spacings).toHaveLength(1);
      expect(spacings[0].spacing).toBe(20); // Average of similar spacings
      expect(spacings[0].count).toBe(3);
    });
  });

  describe('generateDistributionGuides', () => {
    it('should generate spacing guides for equally spaced elements', () => {
      const draggedElement = { id: 'dragged', x: 210, y: 0, width: 50, height: 50, rotation: 0 };
      const targetElements = [
        { id: '1', x: 0, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '2', x: 70, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '3', x: 140, y: 0, width: 50, height: 50, rotation: 0 },
      ];

      const guides = engine.generateDistributionGuides(draggedElement, targetElements);

      const spacingGuide = guides.find(g => g.type === 'spacing');
      expect(spacingGuide).toBeDefined();
      expect(spacingGuide?.metadata?.spacing).toBe(20);
    });

    it('should not generate guides for non-matching patterns', () => {
      const draggedElement = { id: 'dragged', x: 300, y: 300, width: 50, height: 50, rotation: 0 };
      const targetElements = [
        { id: '1', x: 0, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '2', x: 70, y: 0, width: 50, height: 50, rotation: 0 },
        { id: '3', x: 140, y: 0, width: 50, height: 50, rotation: 0 },
      ];

      const guides = engine.generateDistributionGuides(draggedElement, targetElements);

      expect(guides).toHaveLength(0);
    });
  });

  describe('generateDynamicGuidesOptimized', () => {
    beforeEach(() => {
      // Set up spatial index with some elements
      engine.updateElementIndex([
        { id: '1', x: 100, y: 100, width: 50, height: 50, rotation: 0 },
        { id: '2', x: 200, y: 100, width: 50, height: 50, rotation: 0 },
        { id: '3', x: 100, y: 200, width: 50, height: 50, rotation: 0 },
      ]);
    });

    it('should generate guides only for visible elements', () => {
      const draggedBounds = {
        id: 'dragged',
        left: 150,
        top: 150,
        right: 200,
        bottom: 200,
        centerX: 175,
        centerY: 175,
        width: 50,
        height: 50,
      };

      const viewport = {
        x: 0,
        y: 0,
        width: 400,
        height: 400,
      };

      const guides = engine.generateDynamicGuidesOptimized(draggedBounds, viewport);

      expect(guides.length).toBeGreaterThan(0);
      
      // Should have alignment guides
      const verticalGuides = guides.filter(g => g.orientation === 'vertical');
      const horizontalGuides = guides.filter(g => g.orientation === 'horizontal');
      
      expect(verticalGuides.length).toBeGreaterThan(0);
      expect(horizontalGuides.length).toBeGreaterThan(0);
    });

    it('should not generate guides for elements outside viewport', () => {
      const draggedBounds = {
        id: 'dragged',
        left: 1000,
        top: 1000,
        right: 1050,
        bottom: 1050,
        centerX: 1025,
        centerY: 1025,
        width: 50,
        height: 50,
      };

      const viewport = {
        x: 0,
        y: 0,
        width: 400,
        height: 400,
      };

      const guides = engine.generateDynamicGuidesOptimized(draggedBounds, viewport);

      expect(guides).toHaveLength(0);
    });
  });

  describe('performance monitoring', () => {
    it('should track performance metrics', () => {
      // Perform some operations
      engine.checkMagneticAlignment(
        { id: 'test', x: 100, y: 100, width: 50, height: 50, rotation: 0 },
        { x: 100, y: 100 },
        []
      );

      const metrics = engine.getPerformanceMetrics();

      expect(metrics.totalChecks).toBe(1);
      expect(metrics.averageCheckTime).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeDefined();
    });

    it('should cache alignment results', () => {
      const element = { id: 'test', x: 100, y: 100, width: 50, height: 50, rotation: 0 };
      const position = { x: 100, y: 100 };
      const guides: GuideLine[] = [];

      // First call - cache miss
      engine.checkMagneticAlignment(element, position, guides);
      
      // Second call - cache hit
      engine.checkMagneticAlignment(element, position, guides);

      const metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      engine.updateElementIndex([
        { id: '1', x: 0, y: 0, width: 50, height: 50, rotation: 0 },
      ]);

      engine.dispose();

      // After disposal, spatial index should be empty
      const viewport = { x: 0, y: 0, width: 1000, height: 1000 };
      const guides = engine.generateDynamicGuidesOptimized(
        {
          id: 'test',
          left: 0,
          top: 0,
          right: 50,
          bottom: 50,
          centerX: 25,
          centerY: 25,
          width: 50,
          height: 50,
        },
        viewport
      );

      expect(guides).toHaveLength(0);
    });
  });
});