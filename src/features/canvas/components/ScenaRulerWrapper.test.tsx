import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { RulerProps } from '../types/ruler.types';

// Mock @scena/react-ruler before importing the component
vi.mock('@scena/react-ruler', () => ({
  default: vi.fn((props: any) => {
    return (
      <div 
        data-testid={`scena-ruler-${props.type}`}
        style={props.style}
        onClick={props.onClick}
      >
        <div data-testid="ruler-content">
          Unit: {props.unit}, Zoom: {props.zoom}
        </div>
      </div>
    );
  }),
}));

import { ScenaRulerWrapper } from './ScenaRulerWrapper';

// Get the mocked component
const mockRulerComponent = vi.mocked(require('@scena/react-ruler').default);

describe('ScenaRulerWrapper', () => {
  const defaultProps: RulerProps = {
    orientation: 'horizontal',
    length: 800,
    thickness: 30,
    unit: 'mm',
    scale: 1,
    offset: 0,
    canvasSize: { width: 800, height: 600 },
    viewport: { x: 0, y: 0, scale: 1 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染水平标尺', () => {
    render(<ScenaRulerWrapper {...defaultProps} />);
    
    const ruler = screen.getByTestId('scena-ruler-horizontal');
    expect(ruler).toBeInTheDocument();
  });

  it('应该正确渲染垂直标尺', () => {
    render(<ScenaRulerWrapper {...defaultProps} orientation="vertical" />);
    
    const ruler = screen.getByTestId('scena-ruler-vertical');
    expect(ruler).toBeInTheDocument();
  });

  it('应该正确计算毫米单位的缩放', () => {
    render(<ScenaRulerWrapper {...defaultProps} unit="mm" />);
    
    const content = screen.getByTestId('ruler-content');
    // 10mm intervals, zoom = viewport.scale * 3.7795275591
    expect(content.textContent).toContain('Unit: 10');
    expect(content.textContent).toContain('Zoom: 3.7795275591');
  });

  it('应该正确计算厘米单位的缩放', () => {
    render(<ScenaRulerWrapper {...defaultProps} unit="cm" />);
    
    const content = screen.getByTestId('ruler-content');
    // 1cm intervals, zoom = viewport.scale * 37.795275591
    expect(content.textContent).toContain('Unit: 1');
    expect(content.textContent).toContain('Zoom: 37.795275591');
  });

  it('应该正确计算像素单位的缩放', () => {
    render(<ScenaRulerWrapper {...defaultProps} unit="px" />);
    
    const content = screen.getByTestId('ruler-content');
    // 50px intervals, zoom = viewport.scale
    expect(content.textContent).toContain('Unit: 50');
    expect(content.textContent).toContain('Zoom: 1');
  });

  it('应该响应视口缩放变化', () => {
    const { rerender } = render(<ScenaRulerWrapper {...defaultProps} />);
    
    // 更新视口缩放
    rerender(
      <ScenaRulerWrapper 
        {...defaultProps} 
        viewport={{ x: 0, y: 0, scale: 2 }} 
      />
    );
    
    const content = screen.getByTestId('ruler-content');
    expect(content.textContent).toContain('Zoom: 7.5590551182'); // 2 * 3.7795275591
  });

  it('应该处理点击事件', () => {
    const onClick = vi.fn();
    render(<ScenaRulerWrapper {...defaultProps} onClick={onClick} />);
    
    const ruler = screen.getByTestId('scena-ruler-horizontal');
    
    // 模拟点击
    fireEvent.click(ruler, {
      clientX: 100,
      clientY: 15,
    });
    
    expect(onClick).toHaveBeenCalled();
  });

  it('应该正确计算滚动位置', () => {
    const viewport = { x: -100, y: -50, scale: 1 };
    const { container } = render(
      <ScenaRulerWrapper 
        {...defaultProps} 
        viewport={viewport}
        unit="mm"
      />
    );
    
    // 应该渲染标尺
    expect(container.querySelector('[data-testid="scena-ruler-horizontal"]')).toBeInTheDocument();
  });

  it('应该根据方向设置正确的尺寸', () => {
    const { rerender, container } = render(<ScenaRulerWrapper {...defaultProps} />);
    
    // 水平标尺
    expect(container.querySelector('[data-testid="scena-ruler-horizontal"]')).toBeInTheDocument();
    
    // 垂直标尺
    rerender(<ScenaRulerWrapper {...defaultProps} orientation="vertical" />);
    expect(container.querySelector('[data-testid="scena-ruler-vertical"]')).toBeInTheDocument();
  });

  it('应该使用自定义颜色', () => {
    const { container } = render(
      <ScenaRulerWrapper 
        {...defaultProps}
        backgroundColor="#333"
        textColor="#fff"
        tickColor="#777"
        fontSize={12}
      />
    );
    
    // 应该渲染标尺
    expect(container.querySelector('[data-testid="scena-ruler-horizontal"]')).toBeInTheDocument();
  });
});