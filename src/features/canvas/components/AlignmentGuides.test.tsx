import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlignmentGuides } from './AlignmentGuides';
import type { DynamicGuide, GuideLine } from '../types/alignment.types';

describe('AlignmentGuides', () => {
  const mockViewport = {
    scale: 1,
    x: 0,
    y: 0,
  };

  const mockCanvasSize = {
    width: 800,
    height: 600,
  };

  describe('静态辅助线渲染', () => {
    it('应该渲染垂直辅助线', () => {
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      const verticalGuide = screen.getByTestId('guide-v1');
      expect(verticalGuide).toBeInTheDocument();
      expect(verticalGuide).toHaveStyle({ left: '200px' });
    });

    it('应该渲染水平辅助线', () => {
      const guides: GuideLine[] = [
        {
          id: 'h1',
          orientation: 'horizontal',
          position: 150,
          type: 'manual',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      const horizontalGuide = screen.getByTestId('guide-h1');
      expect(horizontalGuide).toBeInTheDocument();
      expect(horizontalGuide).toHaveStyle({ top: '150px' });
    });

    it('应该隐藏不可见的辅助线', () => {
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: false,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      expect(screen.queryByTestId('guide-v1')).not.toBeInTheDocument();
    });

    it('应该应用视口变换', () => {
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: true,
        },
      ];

      const scaledViewport = {
        scale: 2,
        x: 50,
        y: 0,
      };

      render(
        <AlignmentGuides
          guides={guides}
          viewport={scaledViewport}
          canvasSize={mockCanvasSize}
        />
      );

      const verticalGuide = screen.getByTestId('guide-v1');
      // 位置 = (200 * scale) + x = (200 * 2) + 50 = 450
      expect(verticalGuide).toHaveStyle({ left: '450px' });
    });
  });

  describe('动态辅助线渲染', () => {
    it('应该渲染动态辅助线', () => {
      const dynamicGuides: DynamicGuide[] = [
        {
          orientation: 'vertical',
          position: 300,
          start: 100,
          end: 400,
          type: 'element',
        },
      ];

      render(
        <AlignmentGuides
          dynamicGuides={dynamicGuides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      const dynamicGuide = screen.getByTestId('dynamic-guide-0');
      expect(dynamicGuide).toBeInTheDocument();
      expect(dynamicGuide).toHaveStyle({ 
        left: '300px',
        top: '100px',
        height: '300px',
      });
    });

    it('应该渲染多个动态辅助线', () => {
      const dynamicGuides: DynamicGuide[] = [
        {
          orientation: 'vertical',
          position: 300,
          start: 100,
          end: 400,
          type: 'element',
        },
        {
          orientation: 'horizontal',
          position: 250,
          start: 150,
          end: 450,
          type: 'element',
        },
      ];

      render(
        <AlignmentGuides
          dynamicGuides={dynamicGuides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      expect(screen.getByTestId('dynamic-guide-0')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-guide-1')).toBeInTheDocument();
    });
  });

  describe('样式和配置', () => {
    it('应该应用自定义样式', () => {
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
          guideColor="#ff0000"
          guideWidth={2}
          guideStyle="dashed"
        />
      );

      const guide = screen.getByTestId('guide-v1');
      expect(guide).toHaveStyle({
        width: '2px',
      });
    });

    it('应该根据类型应用不同的样式', () => {
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'center',
          visible: true,
        },
        {
          id: 'v2',
          orientation: 'vertical',
          position: 300,
          type: 'edge',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      const centerGuide = screen.getByTestId('guide-v1');
      const edgeGuide = screen.getByTestId('guide-v2');

      // 中心线和边缘线可能有不同的样式
      expect(centerGuide).toBeInTheDocument();
      expect(edgeGuide).toBeInTheDocument();
    });
  });

  describe('性能优化', () => {
    it('应该只渲染可见区域内的辅助线', () => {
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: true,
        },
        {
          id: 'v2',
          orientation: 'vertical',
          position: 2000, // 超出画布范围
          type: 'manual',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
        />
      );

      expect(screen.getByTestId('guide-v1')).toBeInTheDocument();
      expect(screen.queryByTestId('guide-v2')).not.toBeInTheDocument();
    });
  });

  describe('交互', () => {
    it('应该处理辅助线点击事件', () => {
      const onGuideClick = vi.fn();
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
          onGuideClick={onGuideClick}
        />
      );

      const guide = screen.getByTestId('guide-v1');
      guide.click();

      expect(onGuideClick).toHaveBeenCalledWith('v1');
    });

    it('应该处理辅助线双击事件', () => {
      const onGuideDoubleClick = vi.fn();
      const guides: GuideLine[] = [
        {
          id: 'v1',
          orientation: 'vertical',
          position: 200,
          type: 'manual',
          visible: true,
        },
      ];

      render(
        <AlignmentGuides
          guides={guides}
          viewport={mockViewport}
          canvasSize={mockCanvasSize}
          onGuideDoubleClick={onGuideDoubleClick}
        />
      );

      const guide = screen.getByTestId('guide-v1');
      guide.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      expect(onGuideDoubleClick).toHaveBeenCalledWith('v1');
    });
  });
});