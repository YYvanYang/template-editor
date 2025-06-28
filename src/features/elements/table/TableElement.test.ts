import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TableElement } from './TableElement';
import type { TableRow, TableCell, TableDataSource } from '../types/table.types';

describe('TableElement', () => {
  const createTestHeaderCells = (): TableCell[] => [
    { content: '姓名', width: '40' },
    { content: '年龄', width: '30' },
    { content: '邮箱', width: '60' },
  ];

  const createTestDataCells = (name: string, age: number, email: string): TableCell[] => [
    { content: name },
    { content: age.toString() },
    { content: email },
  ];

  const createTestRows = (): TableRow[] => [
    {
      type: 'header',
      cells: createTestHeaderCells(),
    },
    {
      type: 'data',
      cells: createTestDataCells('张三', 30, 'zhang@example.com'),
    },
    {
      type: 'data',
      cells: createTestDataCells('李四', 25, 'li@example.com'),
    },
  ];

  describe('constructor', () => {
    it('应该创建默认表格元素', () => {
      const table = new TableElement({});
      
      expect(table.type).toBe('table');
      expect(table.rows).toEqual([]);
      expect(table.columns).toBeUndefined();
      expect(table.splitable).toBe(false);
      expect(table.tableStyle).toBeDefined();
      expect(table.tableStyle?.borderStyle).toBe('solid');
      expect(table.tableStyle?.fontSize).toBe(8);
    });

    it('应该使用提供的配置创建表格元素', () => {
      const rows = createTestRows();
      const table = new TableElement({
        id: 'table1',
        rows,
        splitable: true,
        tableStyle: {
          fontSize: 10,
          borderColor: '#ff0000',
        },
      });

      expect(table.id).toBe('table1');
      expect(table.rows).toEqual(rows);
      expect(table.splitable).toBe(true);
      expect(table.tableStyle?.fontSize).toBe(10);
      expect(table.tableStyle?.borderColor).toBe('#ff0000');
    });

    it('应该从行中提取列定义', () => {
      const rows = createTestRows();
      const table = new TableElement({ rows });

      expect(table.columns).toBeDefined();
      expect(table.columns).toHaveLength(3);
      expect(table.columns![0].title).toBe('姓名');
      expect(table.columns![0].width).toBe('40');
      expect(table.columns![1].title).toBe('年龄');
      expect(table.columns![2].title).toBe('邮箱');
    });

    it('应该初始化CNPL默认样式', () => {
      const table = new TableElement({});
      
      expect(table.tableStyle).toEqual({
        borderWidth: '1pt',
        borderStyle: 'solid',
        borderColor: '#000000',
        cellBorderWidth: '1pt',
        cellBorderStyle: 'solid',
        headerBorderWidth: '1pt',
        headerBorderStyle: 'solid',
        fontFamily: '宋体',
        fontSize: 8,
        color: '#000000',
      });
    });
  });

  describe('BaseElement implementation', () => {
    it('应该实现render方法', () => {
      const table = new TableElement({});
      expect(table.render()).toBe(null);
    });

    it('应该实现getBoundingBox方法', () => {
      const table = new TableElement({
        position: { x: 100, y: 50 },
        size: { width: 300, height: 200 },
      });

      const bbox = table.getBoundingBox();
      expect(bbox).toEqual({
        x: 100,
        y: 50,
        width: 300,
        height: 200,
      });
    });

    it('应该实现containsPoint方法', () => {
      const table = new TableElement({
        position: { x: 100, y: 50 },
        size: { width: 300, height: 200 },
      });

      expect(table.containsPoint(150, 100)).toBe(true);
      expect(table.containsPoint(400, 250)).toBe(true);
      expect(table.containsPoint(99, 100)).toBe(false);
      expect(table.containsPoint(401, 100)).toBe(false);
    });
  });

  describe('width calculation', () => {
    it('应该根据列定义计算宽度', () => {
      const table = new TableElement({
        columns: [
          { id: 'col1', title: '列1', width: '50' },
          { id: 'col2', title: '列2', width: '30' },
          { id: 'col3', title: '列3', width: '40' },
        ],
      });

      expect(table.size.width).toBe(120); // 50 + 30 + 40
    });

    it('应该从行中计算宽度', () => {
      const table = new TableElement({
        rows: createTestRows(),
      });

      expect(table.size.width).toBe(130); // 40 + 30 + 60
    });

    it('应该处理百分比宽度', () => {
      const table = new TableElement({
        size: { width: 200, height: 100 },
        columns: [
          { id: 'col1', title: '列1', width: '50%' },
          { id: 'col2', title: '列2', width: '50%' },
        ],
      });

      // 百分比基于已设置的宽度计算
      expect(table.size.width).toBe(200);
    });

    it('应该处理mm单位', () => {
      const table = new TableElement({
        columns: [
          { id: 'col1', title: '列1', width: '50mm' },
          { id: 'col2', title: '列2', width: '30mm' },
        ],
      });

      expect(table.size.width).toBe(80); // 50 + 30
    });
  });

  describe('row operations', () => {
    let table: TableElement;

    beforeEach(() => {
      table = new TableElement({
        rows: createTestRows(),
      });
    });

    describe('addHeaderRow', () => {
      it('应该添加表头行并确保在最前面', () => {
        const newTable = new TableElement({});
        const headerCells: TableCell[] = [
          { content: 'Column 1', width: '50' },
          { content: 'Column 2', width: '50' },
        ];

        newTable.addHeaderRow(headerCells);

        expect(newTable.rows).toHaveLength(1);
        expect(newTable.rows[0].type).toBe('header');
        expect(newTable.rows[0].cells).toEqual(headerCells);
      });

      it('应该替换现有表头', () => {
        const newHeaderCells: TableCell[] = [
          { content: 'New Column 1', width: '60' },
          { content: 'New Column 2', width: '70' },
        ];

        table.addHeaderRow(newHeaderCells);

        const headers = table.rows.filter(row => row.type === 'header');
        expect(headers).toHaveLength(1);
        expect(headers[0].cells).toEqual(newHeaderCells);
      });

      it('应该更新列定义', () => {
        const newHeaderCells: TableCell[] = [
          { content: 'ID', width: '20' },
          { content: 'Name', width: '80' },
        ];

        table.addHeaderRow(newHeaderCells);

        expect(table.columns).toHaveLength(2);
        expect(table.columns![0].title).toBe('ID');
        expect(table.columns![1].title).toBe('Name');
      });
    });

    describe('addDataRow', () => {
      it('应该在末尾添加数据行', () => {
        const newCells = createTestDataCells('王五', 35, 'wang@example.com');
        const originalLength = table.rows.length;

        table.addDataRow(newCells);

        expect(table.rows).toHaveLength(originalLength + 1);
        expect(table.rows[table.rows.length - 1].type).toBe('data');
        expect(table.rows[table.rows.length - 1].cells).toEqual(newCells);
      });

      it('应该在指定位置插入数据行', () => {
        const newCells = createTestDataCells('王五', 35, 'wang@example.com');

        table.addDataRow(newCells, 1); // 在第一个数据行后插入

        expect(table.rows[2].cells[0].content).toBe('王五');
      });

      it('应该跳过表头行进行插入', () => {
        const newCells = createTestDataCells('王五', 35, 'wang@example.com');

        table.addDataRow(newCells, 0); // 尝试在位置0插入

        // 应该在表头后插入
        expect(table.rows[1].cells[0].content).toBe('王五');
      });
    });

    describe('removeRow', () => {
      it('应该删除指定行', () => {
        const originalLength = table.rows.length;

        table.removeRow(1); // 删除第一个数据行

        expect(table.rows).toHaveLength(originalLength - 1);
        expect(table.rows[1].cells[0].content).toBe('李四');
      });

      it('应该忽略无效索引', () => {
        const originalLength = table.rows.length;

        table.removeRow(-1);
        table.removeRow(100);

        expect(table.rows).toHaveLength(originalLength);
      });
    });

    describe('getHeaderRow', () => {
      it('应该返回表头行', () => {
        const header = table.getHeaderRow();

        expect(header).toBeDefined();
        expect(header?.type).toBe('header');
        expect(header?.cells[0].content).toBe('姓名');
      });

      it('应该在没有表头时返回undefined', () => {
        const noHeaderTable = new TableElement({
          rows: [
            { type: 'data', cells: createTestDataCells('测试', 20, 'test@example.com') },
          ],
        });

        expect(noHeaderTable.getHeaderRow()).toBeUndefined();
      });
    });

    describe('getDataRows', () => {
      it('应该返回所有数据行', () => {
        const dataRows = table.getDataRows();

        expect(dataRows).toHaveLength(2);
        expect(dataRows[0].cells[0].content).toBe('张三');
        expect(dataRows[1].cells[0].content).toBe('李四');
      });
    });
  });

  describe('column and row counting', () => {
    it('应该正确计算列数', () => {
      const table = new TableElement({
        rows: createTestRows(),
      });

      expect(table.getColumnCount()).toBe(3);
    });

    it('应该考虑colspan计算列数', () => {
      const table = new TableElement({
        rows: [
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
        ],
      });

      expect(table.getColumnCount()).toBe(3); // 2 + 1
    });

    it('应该正确计算行数', () => {
      const table = new TableElement({
        rows: createTestRows(),
      });

      expect(table.getRowCount()).toBe(3); // 1 header + 2 data
    });
  });

  describe('data source', () => {
    it('应该根据数据源生成行', () => {
      const rowTemplate: TableRow = {
        type: 'data',
        cells: [
          { content: '{{name}}' },
          { content: '{{age}}' },
          { content: '{{email}}' },
        ],
      };

      const table = new TableElement({
        dataSource: {
          type: 'dynamic',
          binding: '{{users}}',
          rowTemplate,
        },
      });

      const data = [
        { name: '测试1', age: 20, email: 'test1@example.com' },
        { name: '测试2', age: 25, email: 'test2@example.com' },
      ];

      const generatedRows = table.generateRowsFromDataSource(data);

      expect(generatedRows).toHaveLength(2);
      expect(generatedRows[0].type).toBe('data');
      expect(generatedRows[0].cells).toHaveLength(3);
      // 注意：实际内容需要通过数据绑定系统处理
      expect(generatedRows[0].cells[0].content).toBe('{{name}}');
    });

    it('应该处理没有rowTemplate的情况', () => {
      const table = new TableElement({
        dataSource: {
          type: 'dynamic',
          binding: '{{users}}',
        },
      });

      const rows = table.generateRowsFromDataSource([{ name: 'test' }]);
      expect(rows).toEqual([]);
    });
  });

  describe('validation', () => {
    it('应该验证空表格', () => {
      const table = new TableElement({});
      const errors = table.validate();

      expect(errors).toContain('Table must have at least one row');
    });

    it('应该验证表头位置', () => {
      const table = new TableElement({
        rows: [
          { type: 'data', cells: createTestDataCells('张三', 30, 'zhang@example.com') },
          { type: 'header', cells: createTestHeaderCells() },
        ],
      });

      const errors = table.validate();
      expect(errors).toContain('Header row must be the first row');
    });

    it('应该验证多个表头', () => {
      const table = new TableElement({
        rows: [
          { type: 'header', cells: createTestHeaderCells() },
          { type: 'header', cells: createTestHeaderCells() },
          { type: 'data', cells: createTestDataCells('张三', 30, 'zhang@example.com') },
        ],
      });

      const errors = table.validate();
      expect(errors).toContain('Table can have at most one header row');
    });

    it('应该验证列数一致性', () => {
      const table = new TableElement({
        rows: [
          {
            type: 'data',
            cells: [
              { content: 'A' },
              { content: 'B' },
            ],
          },
          {
            type: 'data',
            cells: [
              { content: 'C' },
              { content: 'D' },
              { content: 'E' },
            ],
          },
        ],
      });

      const errors = table.validate();
      expect(errors).toContain('All rows must have the same number of columns (considering colspan)');
    });

    it('应该正确验证带colspan的表格', () => {
      const table = new TableElement({
        rows: [
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
        ],
      });

      const errors = table.validate();
      expect(errors).toHaveLength(0);
    });
  });

  describe('serialization', () => {
    it('应该序列化为JSON', () => {
      const rows = createTestRows();
      const table = new TableElement({
        id: 'table1',
        position: { x: 100, y: 50 },
        rows,
        splitable: true,
        tableStyle: {
          fontSize: 10,
          borderColor: '#ff0000',
        },
      });

      const json = table.toJSON();

      expect(json).toMatchObject({
        type: 'table',
        id: 'table1',
        position: { x: 100, y: 50 },
        rows,
        splitable: true,
        tableStyle: {
          fontSize: 10,
          borderColor: '#ff0000',
        },
      });
    });

    it('应该从JSON创建', () => {
      const json = {
        type: 'table' as const,
        id: 'table1',
        name: 'Test Table',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 200 },
        rows: createTestRows(),
        splitable: true,
        tableStyle: {
          fontSize: 10,
          borderStyle: 'dashed' as const,
        },
      };

      const table = TableElement.fromJSON(json);

      expect(table.id).toBe('table1');
      expect(table.position.x).toBe(100);
      expect(table.rows).toEqual(json.rows);
      expect(table.splitable).toBe(true);
      expect(table.tableStyle?.fontSize).toBe(10);
      expect(table.tableStyle?.borderStyle).toBe('dashed');
    });
  });

  describe('clone', () => {
    it('应该创建元素副本', () => {
      const table = new TableElement({
        id: 'original',
        rows: createTestRows(),
        splitable: true,
      });

      const clone = table.clone();

      expect(clone.id).not.toBe(table.id);
      expect(clone.rows).toEqual(table.rows);
      expect(clone.splitable).toBe(table.splitable);

      // 修改克隆不应影响原始对象
      clone.rows[0].cells[0].content = 'Modified';
      expect(table.rows[0].cells[0].content).toBe('姓名');
    });
  });

  describe('static methods', () => {
    it('应该生成唯一ID', () => {
      const id1 = TableElement.generateId();
      const id2 = TableElement.generateId();

      expect(id1).toMatch(/^table-\d+-[a-z0-9]{9}$/);
      expect(id2).toMatch(/^table-\d+-[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('CNPL specific features', () => {
    it('应该支持带样式的单元格', () => {
      const table = new TableElement({
        rows: [
          {
            type: 'header',
            cells: [
              {
                content: '产品名称',
                width: '100',
                style: {
                  backgroundColor: '#f0f0f0',
                  fontWeight: 'bold',
                  align: 'center',
                },
              },
            ],
          },
        ],
      });

      const header = table.getHeaderRow();
      expect(header?.cells[0].style?.backgroundColor).toBe('#f0f0f0');
      expect(header?.cells[0].style?.fontWeight).toBe('bold');
      expect(header?.cells[0].style?.align).toBe('center');
    });

    it('应该支持跨行跨列', () => {
      const table = new TableElement({
        rows: [
          {
            type: 'data',
            cells: [
              { content: '合并单元格', colspan: 2, rowspan: 2 },
              { content: '普通单元格' },
            ],
          },
          {
            type: 'data',
            cells: [
              { content: '第二行单元格' },
            ],
          },
        ],
      });

      expect(table.rows[0].cells[0].colspan).toBe(2);
      expect(table.rows[0].cells[0].rowspan).toBe(2);
    });
  });
});