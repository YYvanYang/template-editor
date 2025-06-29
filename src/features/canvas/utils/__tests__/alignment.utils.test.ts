import { describe, it, expect } from 'vitest';
import {
  calculateElementBounds,
  findAlignmentPoints,
  checkAlignment,
  snapToGrid,
  generateDynamicGuides,
  getElementsAlignmentGuides,
} from '../alignment.utils';
import type { ElementBounds, GuideLine, AlignmentConfig } from '../../types/alignment.types';

describe('alignment.utils', () => {
  describe('calculateElementBounds', () => {
    it('should calculate bounds for non-rotated element', () => {
      const element = {
        id: 'test',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
      };

      const bounds = calculateElementBounds(element);

      expect(bounds).toEqual({
        id: 'test',
        left: 100,
        top: 100,
        right: 300,
        bottom: 200,
        centerX: 200,
        centerY: 150,
        width: 200,
        height: 100,
      });
    });

    it('should calculate bounds for rotated element', () => {
      const element = {
        id: 'test',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 45,
      };

      const bounds = calculateElementBounds(element);

      // After 45-degree rotation, the bounding box should be larger
      expect(bounds.width).toBeCloseTo(141.42, 1);
      expect(bounds.height).toBeCloseTo(141.42, 1);
      expect(bounds.centerX).toBe(150);
      expect(bounds.centerY).toBe(150);
    });

    it('should handle 90-degree rotation', () => {
      const element = {
        id: 'test',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 90,
      };

      const bounds = calculateElementBounds(element);

      expect(bounds.width).toBeCloseTo(50, 1);
      expect(bounds.height).toBeCloseTo(100, 1);
    });
  });

  describe('findAlignmentPoints', () => {
    it('should find all alignment points for an element', () => {
      const bounds: ElementBounds = {
        id: 'test',
        left: 100,
        top: 100,
        right: 300,
        bottom: 200,
        centerX: 200,
        centerY: 150,
        width: 200,
        height: 100,
      };

      const points = findAlignmentPoints(bounds);

      expect(points).toHaveLength(9);
      
      // Check center point
      expect(points).toContainEqual({
        x: 200,
        y: 150,
        elementId: 'test',
        type: 'center',
      });

      // Check corners
      expect(points).toContainEqual({
        x: 100,
        y: 100,
        elementId: 'test',
        type: 'corner',
      });
      expect(points).toContainEqual({
        x: 300,
        y: 200,
        elementId: 'test',
        type: 'corner',
      });

      // Check edge centers
      expect(points).toContainEqual({
        x: 200,
        y: 100,
        elementId: 'test',
        type: 'top',
      });
      expect(points).toContainEqual({
        x: 100,
        y: 150,
        elementId: 'test',
        type: 'left',
      });
    });
  });

  describe('checkAlignment', () => {
    const config: AlignmentConfig = {
      enabled: true,
      threshold: 5,
      snapToGrid: false,
      gridSize: 10,
      snapToElements: true,
      showCenterGuides: true,
      showEdgeGuides: true,
    };

    it('should detect alignment with vertical guide', () => {
      const point = { x: 102, y: 150 };
      const guides: GuideLine[] = [
        {
          id: 'guide1',
          orientation: 'vertical',
          position: 100,
          type: 'manual',
          visible: true,
        },
      ];

      const result = checkAlignment(point, guides, config);

      expect(result.aligned).toBe(true);
      expect(result.x).toBe(100);
      expect(result.y).toBe(150);
      expect(result.deltaX).toBe(-2);
      expect(result.deltaY).toBe(0);
      expect(result.verticalGuide).toBeDefined();
    });

    it('should detect alignment with horizontal guide', () => {
      const point = { x: 150, y: 98 };
      const guides: GuideLine[] = [
        {
          id: 'guide1',
          orientation: 'horizontal',
          position: 100,
          type: 'manual',
          visible: true,
        },
      ];

      const result = checkAlignment(point, guides, config);

      expect(result.aligned).toBe(true);
      expect(result.x).toBe(150);
      expect(result.y).toBe(100);
      expect(result.deltaX).toBe(0);
      expect(result.deltaY).toBe(2);
      expect(result.horizontalGuide).toBeDefined();
    });

    it('should not align when outside threshold', () => {
      const point = { x: 110, y: 150 };
      const guides: GuideLine[] = [
        {
          id: 'guide1',
          orientation: 'vertical',
          position: 100,
          type: 'manual',
          visible: true,
        },
      ];

      const result = checkAlignment(point, guides, config);

      expect(result.aligned).toBe(false);
      expect(result.x).toBe(110);
      expect(result.y).toBe(150);
    });

    it('should not align when disabled', () => {
      const disabledConfig = { ...config, enabled: false };
      const point = { x: 102, y: 150 };
      const guides: GuideLine[] = [
        {
          id: 'guide1',
          orientation: 'vertical',
          position: 100,
          type: 'manual',
          visible: true,
        },
      ];

      const result = checkAlignment(point, guides, disabledConfig);

      expect(result.aligned).toBe(false);
      expect(result.x).toBe(102);
    });

    it('should ignore invisible guides', () => {
      const point = { x: 102, y: 150 };
      const guides: GuideLine[] = [
        {
          id: 'guide1',
          orientation: 'vertical',
          position: 100,
          type: 'manual',
          visible: false,
        },
      ];

      const result = checkAlignment(point, guides, config);

      expect(result.aligned).toBe(false);
    });
  });

  describe('snapToGrid', () => {
    it('should snap point to grid', () => {
      const point = { x: 23, y: 47 };
      const gridSize = 10;

      const snapped = snapToGrid(point, gridSize);

      expect(snapped).toEqual({ x: 20, y: 50 });
    });

    it('should handle negative coordinates', () => {
      const point = { x: -23, y: -47 };
      const gridSize = 10;

      const snapped = snapToGrid(point, gridSize);

      expect(snapped).toEqual({ x: -20, y: -50 });
    });

    it('should handle exact grid positions', () => {
      const point = { x: 30, y: 50 };
      const gridSize = 10;

      const snapped = snapToGrid(point, gridSize);

      expect(snapped).toEqual({ x: 30, y: 50 });
    });
  });

  describe('generateDynamicGuides', () => {
    const config: AlignmentConfig = {
      enabled: true,
      threshold: 5,
      snapToGrid: false,
      gridSize: 10,
      snapToElements: true,
      showCenterGuides: true,
      showEdgeGuides: true,
    };

    it('should generate guides for aligned elements', () => {
      const draggedBounds: ElementBounds = {
        id: 'dragged',
        left: 100,
        top: 100,
        right: 200,
        bottom: 200,
        centerX: 150,
        centerY: 150,
        width: 100,
        height: 100,
      };

      const targetBounds: ElementBounds[] = [
        {
          id: 'target1',
          left: 100,
          top: 250,
          right: 200,
          bottom: 350,
          centerX: 150,
          centerY: 300,
          width: 100,
          height: 100,
        },
      ];

      const guides = generateDynamicGuides(draggedBounds, targetBounds, config);

      // Should generate vertical guides for left alignment
      const leftGuide = guides.find(g => 
        g.orientation === 'vertical' && g.position === 100
      );
      expect(leftGuide).toBeDefined();
      expect(leftGuide?.relatedElements).toContain('dragged');
      expect(leftGuide?.relatedElements).toContain('target1');

      // Should generate vertical guides for center alignment
      const centerGuide = guides.find(g => 
        g.orientation === 'vertical' && g.position === 150
      );
      expect(centerGuide).toBeDefined();
    });

    it('should not generate guides when disabled', () => {
      const disabledConfig = { ...config, enabled: false };
      const draggedBounds: ElementBounds = {
        id: 'dragged',
        left: 100,
        top: 100,
        right: 200,
        bottom: 200,
        centerX: 150,
        centerY: 150,
        width: 100,
        height: 100,
      };

      const targetBounds: ElementBounds[] = [
        {
          id: 'target1',
          left: 100,
          top: 250,
          right: 200,
          bottom: 350,
          centerX: 150,
          centerY: 300,
          width: 100,
          height: 100,
        },
      ];

      const guides = generateDynamicGuides(draggedBounds, targetBounds, disabledConfig);

      expect(guides).toHaveLength(0);
    });

    it('should merge guides for multiple aligned elements', () => {
      const draggedBounds: ElementBounds = {
        id: 'dragged',
        left: 100,
        top: 100,
        right: 200,
        bottom: 200,
        centerX: 150,
        centerY: 150,
        width: 100,
        height: 100,
      };

      const targetBounds: ElementBounds[] = [
        {
          id: 'target1',
          left: 100,
          top: 250,
          right: 200,
          bottom: 350,
          centerX: 150,
          centerY: 300,
          width: 100,
          height: 100,
        },
        {
          id: 'target2',
          left: 100,
          top: 400,
          right: 200,
          bottom: 500,
          centerX: 150,
          centerY: 450,
          width: 100,
          height: 100,
        },
      ];

      const guides = generateDynamicGuides(draggedBounds, targetBounds, config);

      // Should have a single guide for left alignment with all related elements
      const leftGuide = guides.find(g => 
        g.orientation === 'vertical' && g.position === 100
      );
      expect(leftGuide?.relatedElements).toHaveLength(3);
      expect(leftGuide?.start).toBe(100);
      expect(leftGuide?.end).toBe(500);
    });
  });

  describe('getElementsAlignmentGuides', () => {
    const config: AlignmentConfig = {
      enabled: true,
      threshold: 5,
      snapToGrid: false,
      gridSize: 10,
      snapToElements: true,
      showCenterGuides: true,
      showEdgeGuides: true,
    };

    it('should generate center and edge guides for elements', () => {
      const elements = [
        {
          id: 'elem1',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
        },
      ];

      const guides = getElementsAlignmentGuides(elements, config);

      // Should have 2 center guides (vertical and horizontal)
      const centerGuides = guides.filter(g => g.type === 'center');
      expect(centerGuides).toHaveLength(2);

      // Should have 4 edge guides (left, right, top, bottom)
      const edgeGuides = guides.filter(g => g.type === 'edge');
      expect(edgeGuides).toHaveLength(4);
    });

    it('should skip rotated elements', () => {
      const elements = [
        {
          id: 'elem1',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 45,
        },
      ];

      const guides = getElementsAlignmentGuides(elements, config);

      expect(guides).toHaveLength(0);
    });

    it('should respect config options', () => {
      const noEdgeConfig = { ...config, showEdgeGuides: false };
      const elements = [
        {
          id: 'elem1',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
        },
      ];

      const guides = getElementsAlignmentGuides(elements, noEdgeConfig);

      // Should only have center guides
      expect(guides).toHaveLength(2);
      expect(guides.every(g => g.type === 'center')).toBe(true);
    });
  });
});