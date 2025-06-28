import { describe, it, expect } from 'vitest';
import {
  calculateElementBounds,
  findAlignmentPoints,
  checkAlignment,
  generateDynamicGuides,
  snapToGrid,
  getElementsAlignmentGuides,
} from './alignment.utils';
import type {
  ElementBounds,
  AlignmentPoint,
  AlignmentConfig,
  GuideLine,
} from '../types/alignment.types';

describe('alignment.utils', () => {
  const mockElement = {
    id: 'elem1',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
  };

  const defaultConfig: AlignmentConfig = {
    enabled: true,
    threshold: 8,
    showGuides: true,
    snapToGrid: false,
    gridSize: 10,
    snapToElements: true,
    showCenterGuides: true,
    showEdgeGuides: true,
  };

  describe('calculateElementBounds', () => {
    it('应该正确计算元素边界', () => {
      const bounds = calculateElementBounds(mockElement);
      
      expect(bounds).toEqual({
        id: 'elem1',
        left: 100,
        top: 100,
        right: 300,
        bottom: 250,
        centerX: 200,
        centerY: 175,
        width: 200,
        height: 150,
      });
    });

    it('应该处理旋转的元素', () => {
      const rotatedElement = { ...mockElement, rotation: 45 };
      const bounds = calculateElementBounds(rotatedElement);
      
      // 旋转后的边界应该包含整个旋转后的矩形
      expect(bounds.width).toBeGreaterThan(mockElement.width);
      expect(bounds.height).toBeGreaterThan(mockElement.height);
    });

    it('应该处理负坐标', () => {
      const negativeElement = { ...mockElement, x: -50, y: -30 };
      const bounds = calculateElementBounds(negativeElement);
      
      expect(bounds.left).toBe(-50);
      expect(bounds.top).toBe(-30);
      expect(bounds.right).toBe(150);
      expect(bounds.bottom).toBe(120);
    });
  });

  describe('findAlignmentPoints', () => {
    it('应该找到所有对齐点', () => {
      const bounds: ElementBounds = {
        id: 'elem1',
        left: 100,
        top: 100,
        right: 300,
        bottom: 250,
        centerX: 200,
        centerY: 175,
        width: 200,
        height: 150,
      };

      const points = findAlignmentPoints(bounds);
      
      expect(points).toHaveLength(9); // 4个角 + 4个边中点 + 1个中心
      
      // 检查中心点
      expect(points).toContainEqual({
        x: 200,
        y: 175,
        elementId: 'elem1',
        type: 'center',
      });
      
      // 检查角点
      expect(points).toContainEqual({
        x: 100,
        y: 100,
        elementId: 'elem1',
        type: 'corner',
      });
    });
  });

  describe('checkAlignment', () => {
    const guides: GuideLine[] = [
      {
        id: 'v1',
        orientation: 'vertical',
        position: 200,
        type: 'manual',
      },
      {
        id: 'h1',
        orientation: 'horizontal',
        position: 175,
        type: 'manual',
      },
    ];

    it('应该检测到对齐', () => {
      const point = { x: 202, y: 178 };
      const result = checkAlignment(point, guides, defaultConfig);
      
      expect(result.aligned).toBe(true);
      expect(result.x).toBe(200); // 对齐到垂直辅助线
      expect(result.y).toBe(175); // 对齐到水平辅助线
      expect(result.verticalGuide).toBeDefined();
      expect(result.horizontalGuide).toBeDefined();
    });

    it('应该在阈值外不对齐', () => {
      const point = { x: 220, y: 190 };
      const result = checkAlignment(point, guides, defaultConfig);
      
      expect(result.aligned).toBe(false);
      expect(result.x).toBe(220);
      expect(result.y).toBe(190);
      expect(result.verticalGuide).toBeUndefined();
      expect(result.horizontalGuide).toBeUndefined();
    });

    it('应该只对齐一个方向', () => {
      const point = { x: 202, y: 150 };
      const result = checkAlignment(point, guides, defaultConfig);
      
      expect(result.aligned).toBe(true);
      expect(result.x).toBe(200); // 对齐到垂直辅助线
      expect(result.y).toBe(150); // 保持原位
      expect(result.verticalGuide).toBeDefined();
      expect(result.horizontalGuide).toBeUndefined();
    });

    it('应该在禁用时不对齐', () => {
      const disabledConfig = { ...defaultConfig, enabled: false };
      const point = { x: 202, y: 178 };
      const result = checkAlignment(point, guides, disabledConfig);
      
      expect(result.aligned).toBe(false);
      expect(result.x).toBe(202);
      expect(result.y).toBe(178);
    });
  });

  describe('snapToGrid', () => {
    it('应该对齐到网格', () => {
      const point = { x: 107, y: 193 };
      const snapped = snapToGrid(point, 10);
      
      expect(snapped).toEqual({ x: 110, y: 190 });
    });

    it('应该处理不同的网格大小', () => {
      const point = { x: 107, y: 193 };
      const snapped = snapToGrid(point, 25);
      
      expect(snapped).toEqual({ x: 100, y: 200 });
    });

    it('应该处理负坐标', () => {
      const point = { x: -107, y: -193 };
      const snapped = snapToGrid(point, 10);
      
      expect(snapped).toEqual({ x: -110, y: -190 });
    });
  });

  describe('generateDynamicGuides', () => {
    it('应该生成元素之间的动态辅助线', () => {
      const draggedBounds: ElementBounds = {
        id: 'dragged',
        left: 195,
        top: 170,
        right: 395,
        bottom: 320,
        centerX: 295,
        centerY: 245,
        width: 200,
        height: 150,
      };

      const targetBounds: ElementBounds = {
        id: 'target',
        left: 100,
        top: 100,
        right: 300,
        bottom: 250,
        centerX: 200,
        centerY: 175,
        width: 200,
        height: 150,
      };

      const guides = generateDynamicGuides(
        draggedBounds,
        [targetBounds],
        defaultConfig
      );

      // 应该检测到垂直对齐（left对齐到center）
      const verticalGuide = guides.find(g => 
        g.orientation === 'vertical' && g.position === 200
      );
      expect(verticalGuide).toBeDefined();

      // 应该检测到水平对齐（top对齐到center）
      const horizontalGuide = guides.find(g => 
        g.orientation === 'horizontal' && g.position === 175
      );
      expect(horizontalGuide).toBeDefined();
    });

    it('应该不生成重复的辅助线', () => {
      const draggedBounds: ElementBounds = {
        id: 'dragged',
        left: 200,
        top: 175,
        right: 400,
        bottom: 325,
        centerX: 300,
        centerY: 250,
        width: 200,
        height: 150,
      };

      const targetBounds: ElementBounds = {
        id: 'target',
        left: 100,
        top: 100,
        right: 300,
        bottom: 250,
        centerX: 200,
        centerY: 175,
        width: 200,
        height: 150,
      };

      const guides = generateDynamicGuides(
        draggedBounds,
        [targetBounds],
        defaultConfig
      );

      // 检查是否有重复的辅助线
      const positions = guides.map(g => `${g.orientation}-${g.position}`);
      const uniquePositions = new Set(positions);
      expect(positions.length).toBe(uniquePositions.size);
    });
  });

  describe('getElementsAlignmentGuides', () => {
    it('应该从元素生成静态辅助线', () => {
      const elements = [
        { id: 'elem1', x: 100, y: 100, width: 200, height: 150, rotation: 0 },
        { id: 'elem2', x: 400, y: 200, width: 200, height: 150, rotation: 0 },
      ];

      const guides = getElementsAlignmentGuides(elements, defaultConfig);

      // 应该包含中心线和边缘线
      expect(guides.length).toBeGreaterThan(0);
      
      // 检查是否有垂直中心线
      const verticalCenterGuides = guides.filter(g => 
        g.orientation === 'vertical' && g.type === 'center'
      );
      expect(verticalCenterGuides.length).toBeGreaterThan(0);
      
      // 检查是否有水平中心线
      const horizontalCenterGuides = guides.filter(g => 
        g.orientation === 'horizontal' && g.type === 'center'
      );
      expect(horizontalCenterGuides.length).toBeGreaterThan(0);
    });

    it('应该根据配置过滤辅助线', () => {
      const elements = [
        { id: 'elem1', x: 100, y: 100, width: 200, height: 150, rotation: 0 },
      ];

      const configNoCenters = { ...defaultConfig, showCenterGuides: false };
      const guides = getElementsAlignmentGuides(elements, configNoCenters);

      // 不应该有中心线
      const centerGuides = guides.filter(g => g.type === 'center');
      expect(centerGuides.length).toBe(0);
    });

    it('应该跳过旋转的元素', () => {
      const elements = [
        { id: 'elem1', x: 100, y: 100, width: 200, height: 150, rotation: 45 },
      ];

      const guides = getElementsAlignmentGuides(elements, defaultConfig);

      // 旋转的元素不应该生成辅助线
      expect(guides.length).toBe(0);
    });
  });
});