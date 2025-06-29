import { describe, it, expect, beforeEach } from 'vitest';
import { SmartSpacingDetector } from '../smart-spacing.utils';
import type { ElementBounds } from '../../types/alignment.types';

describe('SmartSpacingDetector', () => {
  let detector: SmartSpacingDetector;

  beforeEach(() => {
    detector = new SmartSpacingDetector(2); // 2px tolerance
  });

  const createBounds = (
    id: string,
    left: number,
    top: number,
    width: number,
    height: number
  ): ElementBounds => ({
    id,
    left,
    top,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height,
  });

  describe('analyzeSpacing', () => {
    it('should detect equal horizontal spacing', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 70, 0, 50, 50),   // 20px gap
        createBounds('3', 140, 0, 50, 50),  // 20px gap
        createBounds('4', 210, 0, 50, 50),  // 20px gap
      ];

      const analysis = detector.analyzeSpacing(elements);

      expect(analysis.horizontal).toHaveLength(1);
      expect(analysis.horizontal[0].spacing).toBe(20);
      expect(analysis.horizontal[0].count).toBe(3);
      expect(analysis.horizontal[0].isPrimary).toBe(true);
      expect(analysis.horizontal[0].confidence).toBeGreaterThan(0.9);
    });

    it('should detect equal vertical spacing', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 0, 60, 50, 50),   // 10px gap
        createBounds('3', 0, 120, 50, 50),  // 10px gap
      ];

      const analysis = detector.analyzeSpacing(elements);

      expect(analysis.vertical).toHaveLength(1);
      expect(analysis.vertical[0].spacing).toBe(10);
      expect(analysis.vertical[0].count).toBe(2);
      expect(analysis.vertical[0].isPrimary).toBe(true);
    });

    it('should detect multiple spacing patterns', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 70, 0, 50, 50),   // 20px gap
        createBounds('3', 140, 0, 50, 50),  // 20px gap
        createBounds('4', 190, 0, 50, 50),  // 0px gap (different pattern)
        createBounds('5', 240, 0, 50, 50),  // 0px gap
      ];

      const analysis = detector.analyzeSpacing(elements);

      expect(analysis.horizontal.length).toBeGreaterThanOrEqual(2);
      
      // Primary pattern should be the most frequent
      const twentyPxPattern = analysis.horizontal.find(p => p.spacing === 20);
      const zeroPxPattern = analysis.horizontal.find(p => p.spacing === 0);
      
      expect(twentyPxPattern).toBeDefined();
      expect(zeroPxPattern).toBeDefined();
      expect(twentyPxPattern!.count).toBe(2);
      expect(zeroPxPattern!.count).toBe(1);
    });

    it('should handle overlapping elements', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 30, 0, 50, 50),   // Overlapping
        createBounds('3', 100, 0, 50, 50),
      ];

      const analysis = detector.analyzeSpacing(elements);

      // Should not include negative spacing
      expect(analysis.horizontal.every(p => p.spacing >= 0)).toBe(true);
    });

    it('should generate distribution suggestions', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 70, 0, 50, 50),
        createBounds('3', 140, 0, 50, 50),
      ];

      const analysis = detector.analyzeSpacing(elements);

      expect(analysis.suggestions.length).toBeGreaterThan(0);
      
      const equalSpacingSuggestion = analysis.suggestions.find(
        s => s.type === 'equal-spacing'
      );
      expect(equalSpacingSuggestion).toBeDefined();
      expect(equalSpacingSuggestion!.elements).toHaveLength(3);
    });
  });

  describe('detectAlignmentGroups', () => {
    it('should detect horizontally aligned elements', () => {
      const elements = [
        createBounds('1', 0, 100, 50, 50),
        createBounds('2', 100, 100, 50, 50),
        createBounds('3', 200, 100, 50, 50),
      ];

      const groups = detector.detectAlignmentGroups(elements);

      const topAlignedGroup = groups.find(
        g => g.axis === 'horizontal' && g.alignment === 'start'
      );
      expect(topAlignedGroup).toBeDefined();
      expect(topAlignedGroup!.elements).toHaveLength(3);
    });

    it('should detect vertically aligned elements', () => {
      const elements = [
        createBounds('1', 100, 0, 50, 50),
        createBounds('2', 100, 100, 50, 50),
        createBounds('3', 100, 200, 50, 50),
      ];

      const groups = detector.detectAlignmentGroups(elements);

      const leftAlignedGroup = groups.find(
        g => g.axis === 'vertical' && g.alignment === 'start'
      );
      expect(leftAlignedGroup).toBeDefined();
      expect(leftAlignedGroup!.elements).toHaveLength(3);
    });

    it('should detect center-aligned elements', () => {
      const elements = [
        createBounds('1', 75, 0, 50, 50),
        createBounds('2', 50, 100, 100, 50),
        createBounds('3', 85, 200, 30, 50),
      ];

      const groups = detector.detectAlignmentGroups(elements);

      const centerAlignedGroup = groups.find(
        g => g.axis === 'vertical' && g.alignment === 'center'
      );
      expect(centerAlignedGroup).toBeDefined();
      expect(centerAlignedGroup!.elements).toHaveLength(3);
    });

    it('should respect tolerance', () => {
      const elements = [
        createBounds('1', 0, 100, 50, 50),
        createBounds('2', 100, 101, 50, 50),  // 1px off
        createBounds('3', 200, 102, 50, 50),  // 2px off (within tolerance)
        createBounds('4', 300, 105, 50, 50),  // 5px off (outside tolerance)
      ];

      const groups = detector.detectAlignmentGroups(elements);

      const topAlignedGroup = groups.find(
        g => g.axis === 'horizontal' && g.alignment === 'start'
      );
      expect(topAlignedGroup).toBeDefined();
      expect(topAlignedGroup!.elements).toHaveLength(3); // Should not include the 4th element
    });
  });

  describe('distributeElements', () => {
    it('should distribute elements with equal spacing', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 60, 0, 50, 50),
        createBounds('3', 150, 0, 50, 50),
      ];

      const updates = detector.distributeElements(elements, 'horizontal');

      expect(updates).toHaveLength(2); // First element stays in place
      expect(updates[0].id).toBe('2');
      expect(updates[0].position.x).toBe(100); // 50px element + 50px spacing
      expect(updates[1].id).toBe('3');
      expect(updates[1].position.x).toBe(200); // Previous + 50px element + 50px spacing
    });

    it('should distribute with custom spacing', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 100, 0, 50, 50),
        createBounds('3', 200, 0, 50, 50),
      ];

      const updates = detector.distributeElements(elements, 'horizontal', 20);

      expect(updates[0].position.x).toBe(70); // 50px element + 20px spacing
      expect(updates[1].position.x).toBe(140); // Previous + 50px element + 20px spacing
    });

    it('should maintain first and last positions when no spacing specified', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 100, 0, 50, 50),
        createBounds('3', 300, 0, 50, 50),
      ];

      const updates = detector.distributeElements(elements, 'horizontal');

      // First element should not move
      expect(updates.find(u => u.id === '1')).toBeUndefined();
      
      // Middle element should be repositioned
      const middleUpdate = updates.find(u => u.id === '2');
      expect(middleUpdate).toBeDefined();
      expect(middleUpdate!.position.x).toBe(150); // Centered between first and last
    });

    it('should handle vertical distribution', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 0, 100, 50, 50),
        createBounds('3', 0, 200, 50, 50),
      ];

      const updates = detector.distributeElements(elements, 'vertical', 25);

      expect(updates[0].position.y).toBe(75); // 50px element + 25px spacing
      expect(updates[1].position.y).toBe(150); // Previous + 50px element + 25px spacing
    });
  });

  describe('alignElements', () => {
    it('should align elements to average position', () => {
      const elements = [
        createBounds('1', 10, 0, 50, 50),
        createBounds('2', 20, 100, 50, 50),
        createBounds('3', 30, 200, 50, 50),
      ];

      const updates = detector.alignElements(elements, 'vertical', 'start');

      // All should align to average left position (20)
      expect(updates).toHaveLength(3);
      expect(updates.every(u => u.position.x === 20)).toBe(true);
    });

    it('should handle center alignment', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 10, 100, 70, 50),
        createBounds('3', 20, 200, 30, 50),
      ];

      const updates = detector.alignElements(elements, 'vertical', 'center');

      // Check that centers are aligned
      const centers = updates.map(u => {
        const el = elements.find(e => e.id === u.id)!;
        return u.position.x + el.width / 2;
      });

      const avgCenter = centers.reduce((sum, c) => sum + c, 0) / centers.length;
      expect(centers.every(c => Math.abs(c - avgCenter) < 1)).toBe(true);
    });

    it('should handle end alignment', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 10, 100, 70, 50),
        createBounds('3', 20, 200, 30, 50),
      ];

      const updates = detector.alignElements(elements, 'vertical', 'end');

      // Check that right edges are aligned
      const rightEdges = updates.map(u => {
        const el = elements.find(e => e.id === u.id)!;
        return u.position.x + el.width;
      });

      const avgRight = rightEdges.reduce((sum, r) => sum + r, 0) / rightEdges.length;
      expect(rightEdges.every(r => Math.abs(r - avgRight) < 1)).toBe(true);
    });
  });

  describe('grid detection', () => {
    it('should detect grid layout', () => {
      const elements = [
        // Row 1
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 100, 0, 50, 50),
        createBounds('3', 200, 0, 50, 50),
        // Row 2
        createBounds('4', 0, 100, 50, 50),
        createBounds('5', 100, 100, 50, 50),
        createBounds('6', 200, 100, 50, 50),
      ];

      const analysis = detector.analyzeSpacing(elements);

      const gridSuggestion = analysis.suggestions.find(s => s.type === 'grid-layout');
      expect(gridSuggestion).toBeDefined();
      expect(gridSuggestion!.action).toContain('2×3 grid');
    });

    it('should not detect grid for non-grid layouts', () => {
      const elements = [
        createBounds('1', 0, 0, 50, 50),
        createBounds('2', 100, 30, 50, 50),
        createBounds('3', 200, 60, 50, 50),
      ];

      const analysis = detector.analyzeSpacing(elements);

      const gridSuggestion = analysis.suggestions.find(s => s.type === 'grid-layout');
      expect(gridSuggestion).toBeUndefined();
    });
  });
});