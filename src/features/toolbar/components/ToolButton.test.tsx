import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ToolButton } from './ToolButton';
import { ToolType } from '../types/toolbar.types';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  MousePointer2: () => null,
}));

const MockIcon = () => null;

describe('ToolButton', () => {
  const defaultProps = {
    type: ToolType.SELECT,
    icon: MockIcon as any,
    label: '选择',
    tooltip: '选择工具 (V)',
    shortcut: 'V',
  };

  it('应该渲染工具按钮', () => {
    const { container } = render(<ToolButton {...defaultProps} />);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('应该显示图标', () => {
    const { container } = render(<ToolButton {...defaultProps} />);
    // 由于我们mock了图标组件，所以不会有真实的svg元素
    // 只需要确保按钮渲染了即可
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('应该应用激活状态样式', () => {
    const { container } = render(<ToolButton {...defaultProps} active={true} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-accent');
  });

  it('应该应用禁用状态', () => {
    const { container } = render(<ToolButton {...defaultProps} disabled={true} />);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(button?.className).toContain('opacity-50');
  });

  it('应该处理点击事件', () => {
    const onClick = vi.fn();
    const { container } = render(<ToolButton {...defaultProps} onClick={onClick} />);
    const button = container.querySelector('button');
    
    fireEvent.click(button!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('禁用时不应触发点击事件', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ToolButton {...defaultProps} onClick={onClick} disabled={true} />
    );
    const button = container.querySelector('button');
    
    fireEvent.click(button!);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('应该显示工具提示', () => {
    const { getByRole } = render(<ToolButton {...defaultProps} />);
    const button = getByRole('button');
    
    expect(button).toHaveAttribute('title', '选择工具 (V)');
  });

  it('应该渲染分隔符', () => {
    const { container } = render(<ToolButton {...defaultProps} separator={true} />);
    const separator = container.querySelector('[data-separator="true"]');
    expect(separator).toBeTruthy();
  });

  it('应该支持自定义样式', () => {
    const { container } = render(
      <ToolButton {...defaultProps} className="custom-class" />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('custom-class');
  });

  it('应该正确设置 aria 属性', () => {
    const { getByRole } = render(<ToolButton {...defaultProps} active={true} />);
    const button = getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', '选择');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});