import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BarcodeElementRenderer, BarcodePreview } from './BarcodeElementRenderer';
import { BarcodeElement } from '@/features/elements/barcode/BarcodeElement';
import { BarcodeType } from '@/features/elements/types/barcode.types';
import * as barcodeGenerator from '@/features/elements/barcode/barcode-generator';

// Mock react-konva components
vi.mock('react-konva', () => ({
  Group: ({ children, onClick, onTap, ...props }: any) => (
    <div data-testid="konva-group" onClick={onClick} {...props}>{children}</div>
  ),
  Rect: ({ strokeWidth, ...props }: any) => (
    <div data-testid="konva-rect" {...(strokeWidth ? { strokeWidth: String(strokeWidth) } : {})} {...props} />
  ),
  Image: ({ ...props }: any) => <div data-testid="konva-image" {...props} />,
  Text: ({ text, fontSize, fontFamily, ...props }: any) => (
    <div data-testid="konva-text" fontSize={fontSize} fontFamily={fontFamily} {...props}>{text}</div>
  ),
}));

// Mock data-binding
vi.mock('@/features/data-binding', () => ({
  render: (template: string, data: any) => {
    if (template.startsWith('{{') && template.endsWith('}}')) {
      const key = template.slice(2, -2).trim();
      const keys = key.split('.');
      let value = data;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || template;
    }
    return template;
  },
}));

// Mock barcode generator
vi.mock('@/features/elements/barcode/barcode-generator', () => ({
  generateBarcode: vi.fn().mockResolvedValue(undefined),
  isBarcodeTypeSupported: vi.fn().mockReturnValue(true),
}));

describe('BarcodeElementRenderer', () => {
  let mockCanvas: HTMLCanvasElement;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas
    mockCanvas = {
      width: 200,
      height: 100,
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
    } as any;
    
    // Mock document.createElement
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tag);
    });
    
    // Mock Image constructor
    global.Image = vi.fn().mockImplementation(() => ({
      src: '',
      onload: null,
      onerror: null,
    })) as any;
  });
  
  const createTestElement = (overrides?: Partial<any>) => {
    return new BarcodeElement({
      position: { x: 10, y: 20 },
      size: { width: 200, height: 100 },
      barcodeType: BarcodeType.CODE128,
      value: 'TEST123',
      ...overrides,
    });
  };
  
  describe('基本渲染', () => {
    it('应该渲染条码元素', async () => {
      const element = createTestElement();
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      await waitFor(() => {
        const group = container.querySelector('[data-testid="konva-group"]');
        expect(group).toBeTruthy();
      });
    });
    
    it('应该在正确位置渲染', () => {
      const element = createTestElement({
        position: { x: 50, y: 100 },
      });
      
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toHaveAttribute('x', '50');
      expect(group).toHaveAttribute('y', '100');
    });
    
    it('应该应用旋转', () => {
      const element = createTestElement({
        rotation: 45,
      });
      
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toHaveAttribute('rotation', '45');
    });
  });
  
  describe('条码生成', () => {
    it('应该调用生成函数', async () => {
      const element = createTestElement();
      render(<BarcodeElementRenderer element={element} />);
      
      await waitFor(() => {
        expect(barcodeGenerator.generateBarcode).toHaveBeenCalledWith(
          element.data,
          mockCanvas,
          'TEST123'
        );
      });
    });
    
    it('应该显示生成的图片', async () => {
      const element = createTestElement();
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      await waitFor(() => {
        const image = container.querySelector('[data-testid="konva-image"]');
        expect(image).toBeTruthy();
      });
    });
    
    it('应该处理不支持的条码类型', async () => {
      vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(false);
      
      const element = createTestElement();
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      await waitFor(() => {
        const errorText = container.querySelector('[data-testid="konva-text"]');
        expect(errorText?.textContent).toContain('Unsupported barcode type');
      });
    });
    
    it('应该处理生成错误', async () => {
      vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
      vi.mocked(barcodeGenerator.generateBarcode).mockRejectedValue(
        new Error('Invalid barcode value')
      );
      
      const element = createTestElement();
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      await waitFor(() => {
        const errorText = container.querySelector('[data-testid="konva-text"]');
        expect(errorText?.textContent).toContain('Invalid barcode value');
      });
    });
  });
  
  describe('数据绑定', () => {
    it('应该处理数据绑定', async () => {
      vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
      const element = createTestElement({
        value: 'DEFAULT',
        binding: '{{order.number}}',
      });
      
      const bindingData = {
        order: { number: 'ORD-12345' },
      };
      
      render(
        <BarcodeElementRenderer element={element} bindingData={bindingData} />
      );
      
      await waitFor(() => {
        expect(barcodeGenerator.generateBarcode).toHaveBeenCalledWith(
          element.data,
          mockCanvas,
          'ORD-12345'
        );
      });
    });
    
    it('应该处理无效的绑定', async () => {
      vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
      const element = createTestElement({
        value: 'DEFAULT',
        binding: '{{invalid.path}}',
      });
      
      render(
        <BarcodeElementRenderer element={element} bindingData={{}} />
      );
      
      await waitFor(() => {
        expect(barcodeGenerator.generateBarcode).toHaveBeenCalledWith(
          element.data,
          mockCanvas,
          '{{invalid.path}}'
        );
      });
    });
  });
  
  describe('样式应用', () => {
    it('应该应用背景色', () => {
      const element = createTestElement({
        style: { backgroundColor: '#ff0000' },
      });
      
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toHaveAttribute('fill', '#ff0000');
    });
    
    it('应该应用边框', () => {
      const element = createTestElement({
        style: { borderColor: '#0000ff', borderWidth: 2 },
      });
      
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toHaveAttribute('stroke', '#0000ff');
      expect(rect).toHaveAttribute('strokewidth', '2');
    });
    
    it('应该处理不可见状态', async () => {
      const element = createTestElement({
        visible: false,
      });
      
      const { container } = render(
        <BarcodeElementRenderer element={element} />
      );
      
      await waitFor(() => {
        const rect = container.querySelector('[data-testid="konva-rect"]');
        expect(rect).toHaveAttribute('opacity', '0.3');
      });
    });
  });
  
  describe('选中状态', () => {
    it('应该显示选中边框', () => {
      const element = createTestElement();
      const { container } = render(
        <BarcodeElementRenderer element={element} selected={true} />
      );
      
      const rects = container.querySelectorAll('[data-testid="konva-rect"]');
      const selectionRect = Array.from(rects).find(rect => 
        rect.getAttribute('stroke') === '#0066FF' &&
        rect.getAttribute('dash') === '5,5'
      );
      
      expect(selectionRect).toBeTruthy();
    });
    
    it('应该调用onSelect回调', () => {
      const element = createTestElement();
      const onSelect = vi.fn();
      
      const { container } = render(
        <BarcodeElementRenderer element={element} onSelect={onSelect} />
      );
      
      const group = container.querySelector('[data-testid="konva-group"]');
      group?.dispatchEvent(new Event('click', { bubbles: true }));
      
      expect(onSelect).toHaveBeenCalled();
    });
  });
});

describe('BarcodePreview', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      clearRect: vi.fn(),
    };
    
    mockCanvas = document.createElement('canvas');
    Object.defineProperties(mockCanvas, {
      width: { value: 200, writable: true },
      height: { value: 100, writable: true },
      getContext: { value: vi.fn().mockReturnValue(mockContext) },
      toDataURL: { value: vi.fn().mockReturnValue('data:image/png;base64,mock') },
    });
  });
  
  it('应该渲染预览容器', () => {
    const element = new BarcodeElement({
      barcodeType: BarcodeType.CODE128,
      value: 'PREVIEW',
    });
    
    const { container } = render(
      <BarcodePreview element={element} width={150} height={60} />
    );
    
    const div = container.querySelector('div');
    expect(div).toBeTruthy();
    expect(div?.style.position).toBe('relative');
    expect(div?.style.width).toBe('150px');
    expect(div?.style.height).toBe('60px');
  });
  
  it('应该调用生成函数', async () => {
    vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
    vi.mocked(barcodeGenerator.generateBarcode).mockResolvedValue(undefined);
    
    const element = new BarcodeElement({
      barcodeType: BarcodeType.CODE128,
      value: 'PREVIEW',
    });
    
    // Mock canvas ref
    const mockCanvasRef = { current: mockCanvas };
    vi.spyOn(React, 'useRef').mockReturnValue(mockCanvasRef);
    
    render(<BarcodePreview element={element} width={150} height={60} />);
    
    await waitFor(() => {
      expect(barcodeGenerator.generateBarcode).toHaveBeenCalledWith(
        expect.objectContaining({
          barcodeType: BarcodeType.CODE128,
          size: { width: 150, height: 60 },
        }),
        mockCanvas,
        'PREVIEW'
      );
    });
  });
  
  it('应该显示错误信息', async () => {
    vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
    vi.mocked(barcodeGenerator.generateBarcode).mockRejectedValue(
      new Error('Preview generation failed')
    );
    
    const element = new BarcodeElement({
      barcodeType: BarcodeType.CODE128,
      value: 'ERROR',
    });
    
    // Mock canvas ref
    const mockCanvasRef = { current: mockCanvas };
    vi.spyOn(React, 'useRef').mockReturnValue(mockCanvasRef);
    
    const { container } = render(<BarcodePreview element={element} />);
    
    await waitFor(() => {
      const errorDiv = container.querySelector('div[style*="position: absolute"]');
      expect(errorDiv?.textContent).toContain('Preview generation failed');
    });
  });
});