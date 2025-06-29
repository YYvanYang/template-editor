import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { BarcodeElementRenderer, BarcodePreview } from './BarcodeElementRenderer';
import { BarcodeElement } from '@/features/elements/barcode/BarcodeElement';
import { BarcodeType } from '@/features/elements/types/barcode.types';
import * as barcodeGenerator from '@/features/elements/barcode/barcode-generator';

// Mock react-konva components
// 使用 div 元素替代 Konva 组件以避免 JSDOM 环境限制
// 参见 SelectionOverlay.test.tsx 中的详细说明
vi.mock('react-konva', () => ({
  Group: ({ children, onClick, onTap, listening, ...props }: any) => (
    <div data-testid="konva-group" onClick={onClick} data-listening={listening} {...props}>{children}</div>
  ),
  Rect: ({ strokeWidth, listening, ...props }: any) => (
    <div 
      data-testid="konva-rect" 
      {...(strokeWidth ? { 'data-strokewidth': String(strokeWidth) } : {})}
      {...(listening !== undefined ? { 'data-listening': String(listening) } : {})}
      {...props} 
    />
  ),
  Image: ({ listening, ...props }: any) => (
    <div data-testid="konva-image" data-listening={listening} {...props} />
  ),
  Text: ({ text, fontSize, fontFamily, listening, ...props }: any) => (
    <div 
      data-testid="konva-text" 
      data-fontsize={fontSize} 
      data-fontfamily={fontFamily}
      data-listening={listening}
      {...props}
    >
      {text}
    </div>
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
vi.mock('@/features/elements/barcode/barcode-generator');

describe('BarcodeElementRenderer', () => {
  let mockCanvas: HTMLCanvasElement;
  let originalCreateElement: typeof document.createElement;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Spy on console.error to suppress error logs in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup barcode generator mocks
    vi.mocked(barcodeGenerator.generateBarcode).mockResolvedValue(undefined);
    vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
    
    // Mock canvas with proper HTMLElement interface
    mockCanvas = {
      width: 200,
      height: 100,
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;
    
    // Save original createElement
    originalCreateElement = document.createElement.bind(document);
    
    // Mock document.createElement
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement(tag);
    });
    
    // Mock Image constructor with onload trigger
    global.Image = vi.fn().mockImplementation(() => {
      const img = {
        src: '',
        onload: null,
        onerror: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      // Trigger onload when src is set
      Object.defineProperty(img, 'src', {
        set(value) {
          this._src = value;
          if (this.onload) {
            setTimeout(() => this.onload(), 0);
          }
        },
        get() {
          return this._src;
        }
      });
      return img;
    }) as any;
  });
  
  afterEach(() => {
    // Restore original createElement
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
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
    
    it('应该在正确位置渲染', async () => {
      const element = createTestElement({
        position: { x: 50, y: 100 },
      });
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} />
        ));
      });
      
      await waitFor(() => {
        const group = container.querySelector('[data-testid="konva-group"]');
        expect(group).toHaveAttribute('x', '50');
        expect(group).toHaveAttribute('y', '100');
      });
    });
    
    it('应该应用旋转', async () => {
      const element = createTestElement({
        rotation: 45,
      });
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} />
        ));
      });
      
      await waitFor(() => {
        const group = container.querySelector('[data-testid="konva-group"]');
        expect(group).toHaveAttribute('rotation', '45');
      });
    });
  });
  
  describe('条码生成', () => {
    it('应该调用生成函数', async () => {
      const element = createTestElement();
      
      await act(async () => {
        render(<BarcodeElementRenderer element={element} />);
      });
      
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
      let container: HTMLElement;
      
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} />
        ));
      });
      
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
    it('应该应用背景色', async () => {
      const element = createTestElement({
        style: { backgroundColor: '#ff0000' },
      });
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} />
        ));
      });
      
      await waitFor(() => {
        const rect = container.querySelector('[data-testid="konva-rect"]');
        expect(rect).toHaveAttribute('fill', '#ff0000');
      });
    });
    
    it('应该应用边框', async () => {
      const element = createTestElement({
        style: { borderColor: '#0000ff', borderWidth: 2 },
      });
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} />
        ));
      });
      
      await waitFor(() => {
        const rect = container.querySelector('[data-testid="konva-rect"]');
        expect(rect).toHaveAttribute('stroke', '#0000ff');
        expect(rect).toHaveAttribute('data-strokewidth', '2');
      });
    });
    
    it('应该处理不可见状态', async () => {
      const element = createTestElement({
        visible: false,
      });
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} />
        ));
      });
      
      await waitFor(() => {
        const rect = container.querySelector('[data-testid="konva-rect"]');
        expect(rect).toHaveAttribute('opacity', '0.3');
      });
    });
  });
  
  describe('选中状态', () => {
    it('应该显示选中边框', async () => {
      const element = createTestElement();
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} selected={true} />
        ));
      });
      
      await waitFor(() => {
        const rects = container.querySelectorAll('[data-testid="konva-rect"]');
        const selectionRect = Array.from(rects).find(rect => 
          rect.getAttribute('stroke') === '#0066FF' &&
          rect.getAttribute('dash') === '5,5'
        );
        
        expect(selectionRect).toBeTruthy();
      });
    });
    
    it('应该调用onSelect回调', async () => {
      const element = createTestElement();
      const onSelect = vi.fn();
      
      let container: HTMLElement;
      await act(async () => {
        ({ container } = render(
          <BarcodeElementRenderer element={element} onSelect={onSelect} />
        ));
      });
      
      await waitFor(() => {
        const group = container.querySelector('[data-testid="konva-group"]');
        expect(group).toBeTruthy();
      });
      
      const group = container.querySelector('[data-testid="konva-group"]');
      group?.dispatchEvent(new Event('click', { bubbles: true }));
      
      expect(onSelect).toHaveBeenCalled();
    });
  });
});

describe('BarcodePreview', () => {
  let mockCanvas: HTMLCanvasElement;
  let originalCreateElement: typeof document.createElement;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Spy on console.error to suppress error logs in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup barcode generator mocks
    vi.mocked(barcodeGenerator.generateBarcode).mockResolvedValue(undefined);
    vi.mocked(barcodeGenerator.isBarcodeTypeSupported).mockReturnValue(true);
    
    // Create a proper mock canvas element
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;
    
    // Mock ref assignment
    Object.defineProperty(mockCanvas, 'width', {
      get() { return this._width || 0; },
      set(value) { this._width = value; }
    });
    Object.defineProperty(mockCanvas, 'height', {
      get() { return this._height || 0; },
      set(value) { this._height = value; }
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
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
    
    await act(async () => {
      render(<BarcodePreview element={element} width={150} height={60} />);
    });
    
    await waitFor(() => {
      expect(barcodeGenerator.generateBarcode).toHaveBeenCalledWith(
        expect.objectContaining({
          barcodeType: BarcodeType.CODE128,
          size: { width: 150, height: 60 },
        }),
        expect.any(HTMLCanvasElement),
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
    
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(<BarcodePreview element={element} />));
    });
    
    await waitFor(() => {
      const errorDiv = container.querySelector('div[style*="position: absolute"]');
      expect(errorDiv?.textContent).toContain('Preview generation failed');
    });
  });
});