/**
 * @deprecated 此测试文件对应已废弃的 Ruler 组件
 * 请参考 RulerCanvas.test.tsx 中的测试用例
 * 
 * 这些测试用例已经在 RulerCanvas.test.tsx 中有了更完善的覆盖：
 * - 基础渲染测试
 * - 单位和刻度测试
 * - 鼠标交互测试
 * - 视口变换测试
 * - 性能优化测试
 * 
 * @see RulerCanvas.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Ruler } from './Ruler';
import type { RulerProps } from '../types/ruler.types';

describe('Ruler', () => {
  const defaultProps: RulerProps = {
    orientation: 'horizontal',
    length: 1000,
    canvasSize: { width: 800, height: 600 },
    viewport: { scale: 1, x: 0, y: 0 },
  };

  describe('渲染测试', () => {
    it('应该正确渲染水平标尺', () => {
      render(<Ruler {...defaultProps} />);
      
      const ruler = screen.getByTestId('ruler-horizontal');
      expect(ruler).toBeInTheDocument();
      expect(ruler).toHaveStyle({ width: '1000px', height: '20px' });
    });

    it('应该正确渲染垂直标尺', () => {
      render(<Ruler {...defaultProps} orientation="vertical" />);
      
      const ruler = screen.getByTestId('ruler-vertical');
      expect(ruler).toBeInTheDocument();
      expect(ruler).toHaveStyle({ width: '20px', height: '1000px' });
    });

    it('应该应用自定义样式', () => {
      render(
        <Ruler
          {...defaultProps}
          thickness={30}
          backgroundColor="#fff"
          textColor="#000"
        />
      );
      
      const ruler = screen.getByTestId('ruler-horizontal');
      expect(ruler).toHaveStyle({ 
        height: '30px',
        backgroundColor: '#fff',
      });
    });
  });

  describe('刻度渲染测试', () => {
    it('应该渲染正确的刻度线', () => {
      render(<Ruler {...defaultProps} unit="px" />);
      
      // 检查是否有刻度线
      const ticks = screen.getAllByTestId(/^tick-/);
      expect(ticks.length).toBeGreaterThan(0);
      
      // 检查主刻度
      const majorTicks = screen.getAllByTestId(/^tick-major-/);
      expect(majorTicks.length).toBeGreaterThan(0);
      
      // 检查次刻度
      const minorTicks = screen.getAllByTestId(/^tick-minor-/);
      expect(minorTicks.length).toBeGreaterThan(0);
    });

    it('应该显示刻度标签', () => {
      render(<Ruler {...defaultProps} unit="cm" />);
      
      // 检查是否有刻度标签
      const labels = screen.getAllByTestId(/^label-/);
      expect(labels.length).toBeGreaterThan(0);
      
      // 检查第一个标签
      expect(labels[0]).toHaveTextContent('0');
    });

    it('应该根据缩放比例调整刻度', () => {
      const { rerender } = render(
        <Ruler {...defaultProps} unit="px" viewport={{ scale: 1, x: 0, y: 0 }} />
      );
      
      // 验证有刻度
      const initialTicks = screen.getAllByTestId(/^tick-/);
      expect(initialTicks.length).toBeGreaterThan(0);
      
      // 缩放后仍然有刻度
      rerender(
        <Ruler {...defaultProps} unit="px" viewport={{ scale: 0.5, x: 0, y: 0 }} />
      );
      
      const zoomedTicks = screen.getAllByTestId(/^tick-/);
      expect(zoomedTicks.length).toBeGreaterThan(0);
    });

    it('应该根据偏移量调整刻度位置', () => {
      render(
        <Ruler 
          {...defaultProps} 
          orientation="horizontal"
          viewport={{ scale: 1, x: -100, y: 0 }} 
        />
      );
      
      // 检查第一个标签是否偏移
      const firstLabel = screen.getAllByTestId(/^label-/)[0];
      const labelText = firstLabel.textContent;
      
      // 偏移100px后，第一个标签不应该是0
      expect(labelText).not.toBe('0');
    });
  });

  describe('单位转换测试', () => {
    it('应该正确显示毫米单位', () => {
      render(<Ruler {...defaultProps} unit="mm" />);
      
      const labels = screen.getAllByTestId(/^label-/);
      // 检查是否有10的倍数（主刻度）
      const hasMultipleOf10 = labels.some(label => 
        parseInt(label.textContent || '0') % 10 === 0
      );
      expect(hasMultipleOf10).toBe(true);
    });

    it('应该正确显示厘米单位', () => {
      render(<Ruler {...defaultProps} unit="cm" />);
      
      const labels = screen.getAllByTestId(/^label-/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('应该正确显示像素单位', () => {
      render(<Ruler {...defaultProps} unit="px" />);
      
      const labels = screen.getAllByTestId(/^label-/);
      // 检查是否有100的倍数（主刻度）
      const hasMultipleOf100 = labels.some(label => 
        parseInt(label.textContent || '0') % 100 === 0
      );
      expect(hasMultipleOf100).toBe(true);
    });
  });

  describe('交互测试', () => {
    it('应该处理点击事件', () => {
      const onClick = vi.fn();
      render(<Ruler {...defaultProps} unit="px" onClick={onClick} />);
      
      const ruler = screen.getByTestId('ruler-horizontal');
      fireEvent.click(ruler, { clientX: 100, clientY: 10 });
      
      expect(onClick).toHaveBeenCalled();
      // 点击位置100px，在px单位下应该是100
      expect(onClick).toHaveBeenCalledWith(100);
    });

    it('应该显示鼠标位置指示器', () => {
      render(
        <Ruler 
          {...defaultProps} 
          mousePosition={{ x: 150, y: 0 }} 
        />
      );
      
      const indicator = screen.getByTestId('mouse-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveStyle({ left: '150px' });
    });

    it('垂直标尺应该正确显示鼠标位置', () => {
      render(
        <Ruler 
          {...defaultProps} 
          orientation="vertical"
          mousePosition={{ x: 0, y: 200 }} 
        />
      );
      
      const indicator = screen.getByTestId('mouse-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveStyle({ top: '200px' });
    });
  });

  describe('视口变换测试', () => {
    it('应该响应缩放变化', () => {
      const { rerender } = render(
        <Ruler {...defaultProps} unit="px" viewport={{ scale: 1, x: 0, y: 0 }} />
      );
      
      const initialTicks = screen.getAllByTestId(/^tick-/).length;
      
      // 极度缩小会减少刻度数量
      rerender(
        <Ruler {...defaultProps} unit="px" viewport={{ scale: 0.1, x: 0, y: 0 }} />
      );
      
      const scaledTicks = screen.getAllByTestId(/^tick-/).length;
      
      // 缩放后刻度数量应该改变
      expect(scaledTicks).not.toBe(initialTicks);
    });

    it('应该响应平移变化', () => {
      const { rerender } = render(
        <Ruler 
          {...defaultProps} 
          orientation="horizontal"
          viewport={{ scale: 1, x: 0, y: 0 }} 
        />
      );
      
      const initialLabels = screen.getAllByTestId(/^label-/);
      const initialFirstLabel = initialLabels[0].textContent;
      
      rerender(
        <Ruler 
          {...defaultProps} 
          orientation="horizontal"
          viewport={{ scale: 1, x: -200, y: 0 }} 
        />
      );
      
      const panedLabels = screen.getAllByTestId(/^label-/);
      const panedFirstLabel = panedLabels[0].textContent;
      
      // 平移后第一个刻度值应该改变
      expect(panedFirstLabel).not.toBe(initialFirstLabel);
    });
  });
});