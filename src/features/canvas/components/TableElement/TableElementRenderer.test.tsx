import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TableElementRenderer } from './TableElementRenderer';
import { TableElement } from '@/features/elements/table/TableElement';
import type { TableRow, TableCell } from '@/features/elements/types/table.types';

// Mock react-konva components
// 使用 div 元素替代 Konva 组件以避免 JSDOM 环境限制
// 参见 SelectionOverlay.test.tsx 中的详细说明
vi.mock('react-konva', () => ({
  Group: ({ children, listening, ...props }: any) => (
    <div data-testid="konva-group" data-listening={listening} {...props}>{children}</div>
  ),
  Rect: ({ listening, strokeWidth, ...props }: any) => (
    <div data-testid="konva-rect" data-listening={listening} data-strokewidth={strokeWidth} {...props} />
  ),
  Text: ({ text, fontSize, verticalAlign, ellipsis, wrap, fontStyle, ...props }: any) => (
    <div 
      data-testid="konva-text" 
      data-fontsize={fontSize}
      data-verticalalign={verticalAlign}
      data-ellipsis={ellipsis}
      data-wrap={wrap}
      data-fontstyle={fontStyle}
      {...props}
    >
      {text}
    </div>
  ),
  Line: ({ listening, ...props }: any) => (
    <div data-testid="konva-line" data-listening={listening} {...props} />
  ),
}));

// Mock data-binding
vi.mock('@/features/data-binding', () => ({
  render: (template: string, data: any) => {
    // Simple template replacement for tests
    if (template.startsWith('{{') && template.endsWith('}}')) {
      const key = template.slice(2, -2).trim();
      
      // Handle nested properties
      if (key.includes('.')) {
        const parts = key.split('.');
        let value = data;
        for (const part of parts) {
          value = value?.[part];
        }
        return String(value || '');
      }
      
      // Handle array data for dynamic sources
      if (key === 'users' && Array.isArray(data[key])) {
        return data[key];
      }
      
      return data[key] !== undefined ? String(data[key]) : template;
    }
    return template;
  },
}));

describe('TableElementRenderer', () => {
  const createTestTable = (overrides?: Partial<TableElement>) => {
    const rows: TableRow[] = [
      {
        type: 'header',
        cells: [
          { content: '姓名', width: '100' },
          { content: '年龄', width: '80' },
          { content: '邮箱', width: '120' },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '张三' },
          { content: '30' },
          { content: 'zhang@example.com' },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '李四' },
          { content: '25' },
          { content: 'li@example.com' },
        ],
      },
    ];

    return new TableElement({
      position: { x: 100, y: 50 },
      size: { width: 300, height: 150 },
      rows,
      ...overrides,
    });
  };

  describe('Basic Rendering', () => {
    it('应该渲染表格元素', () => {
      const table = createTestTable();
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const groups = container.querySelectorAll('[data-testid="konva-group"]');
      expect(groups.length).toBeGreaterThan(0);
    });

    it('应该在正确位置渲染', () => {
      const table = createTestTable({
        position: { x: 200, y: 100 },
      });
      
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const mainGroup = container.querySelector('[data-testid="konva-group"]');
      expect(mainGroup).toHaveAttribute('x', '200');
      expect(mainGroup).toHaveAttribute('y', '100');
    });

    it('应该渲染背景矩形', () => {
      const table = createTestTable();
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const backgroundRect = container.querySelector('[data-testid="konva-rect"]');
      expect(backgroundRect).toBeTruthy();
      expect(backgroundRect).toHaveAttribute('width', '300');
      expect(backgroundRect).toHaveAttribute('height', '150');
      expect(backgroundRect).toHaveAttribute('fill', 'white');
    });
  });

  describe('Cell Rendering', () => {
    it('应该渲染所有单元格内容', () => {
      const table = createTestTable();
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      const textContents = Array.from(texts).map(el => el.textContent);
      
      expect(textContents).toContain('姓名');
      expect(textContents).toContain('年龄');
      expect(textContents).toContain('邮箱');
      expect(textContents).toContain('张三');
      expect(textContents).toContain('30');
      expect(textContents).toContain('zhang@example.com');
    });

    it('应该为表头单元格应用不同样式', () => {
      const table = createTestTable();
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      // 查找表头背景
      const rects = container.querySelectorAll('[data-testid="konva-rect"]');
      const headerBgRects = Array.from(rects).filter(rect => 
        rect.getAttribute('fill') === '#f5f5f5'
      );
      
      expect(headerBgRects.length).toBe(3); // 3个表头单元格
    });

    it('应该应用单元格样式', () => {
      const rows: TableRow[] = [
        {
          type: 'data',
          cells: [
            {
              content: 'Styled Cell',
              style: {
                backgroundColor: '#ff0000',
                color: '#ffffff',
                fontSize: 16,
                align: 'center',
              },
            },
          ],
        },
      ];

      const table = createTestTable({ rows });
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      // 检查背景色
      const bgRect = Array.from(container.querySelectorAll('[data-testid="konva-rect"]'))
        .find(rect => rect.getAttribute('fill') === '#ff0000');
      expect(bgRect).toBeTruthy();

      // 检查文本样式
      const text = container.querySelector('[data-testid="konva-text"]');
      expect(text).toHaveAttribute('fill', '#ffffff');
      expect(text).toHaveAttribute('data-fontsize', '16');
      expect(text).toHaveAttribute('align', 'center');
    });
  });

  describe('Border Rendering', () => {
    it('应该渲染表格边框', () => {
      const table = createTestTable({
        tableStyle: {
          borderWidth: '2pt',
          borderStyle: 'solid',
          borderColor: '#000000',
        },
      });

      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const lines = container.querySelectorAll('[data-testid="konva-line"]');
      expect(lines.length).toBeGreaterThan(0);
      
      // 检查外边框（4条线）
      const borderLines = Array.from(lines).filter(line => 
        line.getAttribute('stroke') === '#000000'
      );
      expect(borderLines.length).toBeGreaterThanOrEqual(4);
    });

    it('应该渲染虚线边框', () => {
      const table = createTestTable({
        tableStyle: {
          borderStyle: 'dashed',
          cellBorderStyle: 'dotted',
        },
      });

      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const lines = container.querySelectorAll('[data-testid="konva-line"]');
      const dashedLines = Array.from(lines).filter(line => 
        line.hasAttribute('dash')
      );
      
      expect(dashedLines.length).toBeGreaterThan(0);
    });

    it('应该在边框样式为none时不渲染边框', () => {
      const table = createTestTable({
        tableStyle: {
          borderStyle: 'none',
          cellBorderStyle: 'none',
        },
      });

      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const lines = container.querySelectorAll('[data-testid="konva-line"]');
      expect(lines.length).toBe(0);
    });
  });

  describe('Data Binding', () => {
    it('应该渲染绑定的数据', () => {
      const rows: TableRow[] = [
        {
          type: 'data',
          cells: [
            { content: '{{name}}' },
            { content: '{{age}}' },
          ],
        },
      ];

      const table = createTestTable({ rows });
      const bindingData = {
        name: 'Test User',
        age: 28,
      };

      const { container } = render(
        <TableElementRenderer element={table} bindingData={bindingData} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      const textContents = Array.from(texts).map(el => el.textContent);
      
      expect(textContents).toContain('Test User');
      expect(textContents).toContain('28');
    });

    it('应该处理动态数据源', () => {
      const table = new TableElement({
        position: { x: 0, y: 0 },
        size: { width: 300, height: 150 },
        rows: [
          {
            type: 'header',
            cells: [
              { content: 'Name', width: '150' },
              { content: 'Age', width: '150' },
            ],
          },
        ],
        dataSource: {
          type: 'dynamic',
          binding: '{{users}}',
          rowTemplate: {
            type: 'data',
            cells: [
              { content: '{{item.name}}' },
              { content: '{{item.age}}' },
            ],
          },
        },
      });

      const bindingData = {
        users: [
          { name: 'User 1', age: 20 },
          { name: 'User 2', age: 25 },
        ],
      };

      const { container } = render(
        <TableElementRenderer element={table} bindingData={bindingData} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      const textContents = Array.from(texts).map(el => el.textContent);
      
      // Should have header
      expect(textContents).toContain('Name');
      expect(textContents).toContain('Age');
      // Should have dynamic rows
      expect(textContents).toContain('User 1');
      expect(textContents).toContain('20');
      expect(textContents).toContain('User 2');
      expect(textContents).toContain('25');
    });

    it('应该处理无效的绑定表达式', () => {
      const table = createTestTable({
        dataSource: {
          type: 'dynamic',
          binding: '{{invalid}}',
        },
      });

      // 不应该抛出错误
      expect(() => {
        render(<TableElementRenderer element={table} bindingData={{}} />);
      }).not.toThrow();
    });
  });

  describe('Selection', () => {
    it('应该在选中时显示选中边框', () => {
      const table = createTestTable();
      const { container } = render(
        <TableElementRenderer element={table} selected={true} />
      );

      const selectionRect = Array.from(container.querySelectorAll('[data-testid="konva-rect"]'))
        .find(rect => 
          rect.getAttribute('stroke') === '#0066FF' &&
          rect.getAttribute('dash') === '5,5'
        );
      
      expect(selectionRect).toBeTruthy();
    });

    it('应该调用onSelect回调', () => {
      const table = createTestTable();
      const onSelect = vi.fn();
      
      const { container } = render(
        <TableElementRenderer element={table} onSelect={onSelect} />
      );

      const mainGroup = container.querySelector('[data-testid="konva-group"]');
      mainGroup?.dispatchEvent(new Event('click', { bubbles: true }));
      
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Colspan and Rowspan', () => {
    it('应该正确处理colspan', () => {
      const rows: TableRow[] = [
        {
          type: 'header',
          cells: [
            { content: '基本信息', colspan: 2 },
            { content: '联系方式' },
          ],
        },
        {
          type: 'data',
          cells: [
            { content: '张三' },
            { content: '30' },
            { content: 'zhang@example.com' },
          ],
        },
      ];

      const table = createTestTable({ rows });
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      const textContents = Array.from(texts).map(el => el.textContent);
      
      expect(textContents).toContain('基本信息');
      expect(textContents).toContain('联系方式');
      expect(textContents).toContain('张三');
    });

    it('应该正确处理rowspan', () => {
      const rows: TableRow[] = [
        {
          type: 'data',
          cells: [
            { content: '跨行单元格', rowspan: 2 },
            { content: 'A1' },
          ],
        },
        {
          type: 'data',
          cells: [
            { content: 'B1' },
          ],
        },
      ];

      const table = createTestTable({ rows });
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      const textContents = Array.from(texts).map(el => el.textContent);
      
      expect(textContents).toContain('跨行单元格');
      expect(textContents).toContain('A1');
      expect(textContents).toContain('B1');
    });
  });

  describe('Column Width Calculation', () => {
    it('应该根据列定义计算宽度', () => {
      const table = createTestTable({
        columns: [
          { id: '1', title: 'Col1', width: '50%' },
          { id: '2', title: 'Col2', width: '50%' },
        ],
        size: { width: 200, height: 100 },
      });

      const { container } = render(
        <TableElementRenderer element={table} />
      );

      // 验证渲染的元素存在
      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('应该处理毫米单位的宽度', () => {
      const table = createTestTable({
        columns: [
          { id: '1', title: 'Col1', width: '50mm' },
          { id: '2', title: 'Col2', width: '30mm' },
        ],
      });

      const { container } = render(
        <TableElementRenderer element={table} />
      );

      // 验证渲染的元素存在
      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('应该在没有列定义时平均分配宽度', () => {
      const rows: TableRow[] = [
        {
          type: 'data',
          cells: [
            { content: 'A' },
            { content: 'B' },
            { content: 'C' },
          ],
        },
      ];

      const table = new TableElement({
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 },
        rows,
      });

      const { container } = render(
        <TableElementRenderer element={table} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      expect(texts.length).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('应该处理空行数组', () => {
      const table = createTestTable({ rows: [] });
      
      expect(() => {
        render(<TableElementRenderer element={table} />);
      }).not.toThrow();
    });

    it('应该处理缺失的样式属性', () => {
      const table = createTestTable({ tableStyle: undefined });
      
      const { container } = render(
        <TableElementRenderer element={table} />
      );

      // 应该使用默认样式
      const lines = container.querySelectorAll('[data-testid="konva-line"]');
      expect(lines.length).toBeGreaterThan(0);
    });
  });
});