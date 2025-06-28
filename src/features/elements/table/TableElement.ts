import React from 'react';
import { BaseElementClass as BaseElement } from '../types/base.types';
import type { 
  TableElement as ITableElement, 
  TableColumn, 
  TableRow,
  TableCell,
  TableDataSource,
  TableStyle
} from '../types/table.types';
import { TABLE_DEFAULTS } from '../types/table.types';

/**
 * 表格元素类（基于CNPL规范）
 */
export class TableElement extends BaseElement<ITableElement> {
  constructor(data: Partial<ITableElement>) {
    // 构造完整的表格数据
    const tableData: ITableElement = {
      id: data.id || `table-${Date.now()}`,
      type: 'table',
      name: data.name || 'Table',
      position: data.position || { x: 0, y: 0 },
      size: data.size || { width: 400, height: 200 },
      rotation: data.rotation ?? 0,
      visible: data.visible ?? true,
      locked: data.locked ?? false,
      zIndex: data.zIndex ?? 0,
      columns: data.columns,
      rows: data.rows || [],
      dataSource: data.dataSource,
      tableStyle: initializeStyle(data.tableStyle),
      splitable: data.splitable ?? false,
      style: data.style,
      groupId: data.groupId,
      data: data.data,
    };

    super(tableData);

    // 从rows中提取columns（如果没有显式定义）
    if (!this._data.columns && this._data.rows.length > 0) {
      this.extractColumnsFromRows();
    }

    // 设置默认尺寸
    if (!data.size?.width) {
      this._data.size.width = this.calculateDefaultWidth();
    }
  }

  // 实现抽象方法
  render(): React.ReactNode {
    // 这里返回null，实际渲染由React组件处理
    return null;
  }

  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this._data.position.x,
      y: this._data.position.y,
      width: this._data.size.width,
      height: this._data.size.height,
    };
  }

  containsPoint(x: number, y: number): boolean {
    const { position, size } = this._data;
    return (
      x >= position.x &&
      x <= position.x + size.width &&
      y >= position.y &&
      y <= position.y + size.height
    );
  }

  // 表格特有属性的getter和setter
  get columns(): TableColumn[] | undefined {
    return this._data.columns;
  }

  set columns(value: TableColumn[] | undefined) {
    this._data.columns = value;
  }

  get rows(): TableRow[] {
    return this._data.rows;
  }

  set rows(value: TableRow[]) {
    this._data.rows = value;
  }

  get dataSource(): TableDataSource | undefined {
    return this._data.dataSource;
  }

  set dataSource(value: TableDataSource | undefined) {
    this._data.dataSource = value;
  }

  get tableStyle(): TableStyle | undefined {
    return this._data.tableStyle;
  }

  set tableStyle(value: TableStyle | undefined) {
    this._data.tableStyle = value;
  }

  get splitable(): boolean {
    return this._data.splitable ?? false;
  }

  set splitable(value: boolean) {
    this._data.splitable = value;
  }

  /**
   * 从表格行中提取列定义
   */
  private extractColumnsFromRows(): void {
    const headerRow = this._data.rows.find(row => row.type === 'header');
    if (headerRow) {
      const columns: TableColumn[] = [];
      let colIndex = 0;
      
      for (const cell of headerRow.cells) {
        const colspan = cell.colspan || 1;
        // 对于跨列的单元格，创建多个列定义
        for (let i = 0; i < colspan; i++) {
          columns.push({
            id: `col-${colIndex}`,
            title: i === 0 ? cell.content : '', // 只有第一列显示标题
            width: cell.width || '100',
            align: cell.style?.align,
            valign: cell.style?.valign,
            style: cell.style,
          });
          colIndex++;
        }
      }
      
      this._data.columns = columns;
    }
  }

  /**
   * 计算默认宽度
   */
  private calculateDefaultWidth(): number {
    if (this._data.columns && this._data.columns.length > 0) {
      return this._data.columns.reduce((total, column) => {
        const width = this.parseWidth(column.width);
        return total + width;
      }, 0);
    }
    
    // 如果没有列定义，从第一行计算
    if (this._data.rows.length > 0 && this._data.rows[0].cells.length > 0) {
      return this._data.rows[0].cells.reduce((total, cell) => {
        const width = cell.width ? this.parseWidth(cell.width) : 100;
        return total + width;
      }, 0);
    }

    return 400; // 默认宽度
  }

  /**
   * 解析宽度值（支持mm和百分比）
   */
  private parseWidth(width: string | number): number {
    if (typeof width === 'number') {
      return width;
    }
    
    if (width.endsWith('%')) {
      // 百分比需要基于父容器宽度计算
      const percentage = parseFloat(width) / 100;
      return this._data.size.width ? this._data.size.width * percentage : 100;
    }
    
    if (width.endsWith('mm')) {
      return parseFloat(width);
    }
    
    return parseFloat(width) || 100;
  }

  /**
   * 添加表头行
   */
  addHeaderRow(cells: TableCell[]): void {
    const headerRow: TableRow = {
      type: 'header',
      cells,
    };
    
    // 确保表头在最前面
    this._data.rows = [headerRow, ...this._data.rows.filter(row => row.type !== 'header')];
    
    // 更新列定义
    this.extractColumnsFromRows();
  }

  /**
   * 添加数据行
   */
  addDataRow(cells: TableCell[], index?: number): void {
    const dataRow: TableRow = {
      type: 'data',
      cells,
    };
    
    if (index !== undefined) {
      // 跳过表头行
      const headerCount = this._data.rows.filter(row => row.type === 'header').length;
      const dataRowIndex = index + headerCount; // 转换为实际插入位置
      this._data.rows.splice(dataRowIndex, 0, dataRow);
    } else {
      this._data.rows.push(dataRow);
    }
  }

  /**
   * 删除行
   */
  removeRow(index: number): void {
    if (index >= 0 && index < this._data.rows.length) {
      this._data.rows.splice(index, 1);
    }
  }

  /**
   * 获取表头行
   */
  getHeaderRow(): TableRow | undefined {
    return this._data.rows.find(row => row.type === 'header');
  }

  /**
   * 获取数据行
   */
  getDataRows(): TableRow[] {
    return this._data.rows.filter(row => row.type === 'data');
  }

  /**
   * 获取列数
   */
  getColumnCount(): number {
    if (this._data.columns) {
      return this._data.columns.length;
    }
    
    // 从行中计算最大列数（考虑colspan）
    let maxColumns = 0;
    for (const row of this._data.rows) {
      let columnCount = 0;
      for (const cell of row.cells) {
        columnCount += cell.colspan || 1;
      }
      maxColumns = Math.max(maxColumns, columnCount);
    }
    
    return maxColumns;
  }

  /**
   * 获取行数
   */
  getRowCount(): number {
    return this._data.rows.length;
  }

  /**
   * 根据数据源生成行（用于动态数据）
   */
  generateRowsFromDataSource(data: any[]): TableRow[] {
    if (!this._data.dataSource || !this._data.dataSource.rowTemplate) {
      return [];
    }
    
    return data.map(item => {
      const row: TableRow = {
        type: 'data',
        cells: this._data.dataSource!.rowTemplate!.cells.map(cellTemplate => ({
          ...cellTemplate,
          // 这里需要通过数据绑定系统处理content
          content: cellTemplate.content,
        })),
      };
      return row;
    });
  }

  /**
   * 覆盖克隆方法
   */
  clone(): ITableElement {
    return {
      ...super.clone(),
      columns: this._data.columns ? [...this._data.columns] : undefined,
      rows: this._data.rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => ({ ...cell })),
      })),
      dataSource: this._data.dataSource ? { ...this._data.dataSource } : undefined,
      tableStyle: this._data.tableStyle ? { ...this._data.tableStyle } : undefined,
      splitable: this._data.splitable,
    };
  }

  /**
   * 从JSON创建
   */
  static fromJSON(json: ITableElement): TableElement {
    return new TableElement(json);
  }

  /**
   * 生成唯一ID
   */
  static generateId(): string {
    return `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证表格结构
   */
  validate(): string[] {
    const errors: string[] = [];
    
    // 检查是否有行
    if (this._data.rows.length === 0) {
      errors.push('Table must have at least one row');
    }
    
    // 检查表头（如果存在）是否在第一行
    const headerIndex = this._data.rows.findIndex(row => row.type === 'header');
    if (headerIndex > 0) {
      errors.push('Header row must be the first row');
    }
    
    // 检查是否有多个表头
    const headerCount = this._data.rows.filter(row => row.type === 'header').length;
    if (headerCount > 1) {
      errors.push('Table can have at most one header row');
    }
    
    // 检查列数一致性（考虑colspan）
    const columnCounts = new Set<number>();
    for (let i = 0; i < this._data.rows.length; i++) {
      const row = this._data.rows[i];
      let columnCount = 0;
      
      for (const cell of row.cells) {
        columnCount += cell.colspan || 1;
      }
      
      columnCounts.add(columnCount);
    }
    
    if (columnCounts.size > 1) {
      errors.push('All rows must have the same number of columns (considering colspan)');
    }
    
    return errors;
  }
}

/**
 * 初始化表格样式
 */
function initializeStyle(style?: Partial<TableStyle>): TableStyle {
  return {
    borderWidth: style?.borderWidth || TABLE_DEFAULTS.borderWidth,
    borderStyle: style?.borderStyle || TABLE_DEFAULTS.borderStyle,
    borderColor: style?.borderColor || TABLE_DEFAULTS.borderColor,
    cellBorderWidth: style?.cellBorderWidth || TABLE_DEFAULTS.cellBorderWidth,
    cellBorderStyle: style?.cellBorderStyle || TABLE_DEFAULTS.cellBorderStyle,
    headerBorderWidth: style?.headerBorderWidth || style?.cellBorderWidth || TABLE_DEFAULTS.cellBorderWidth,
    headerBorderStyle: style?.headerBorderStyle || style?.cellBorderStyle || TABLE_DEFAULTS.cellBorderStyle,
    fontFamily: style?.fontFamily || TABLE_DEFAULTS.fontFamily,
    fontSize: style?.fontSize || TABLE_DEFAULTS.fontSize,
    color: style?.color || TABLE_DEFAULTS.color,
  };
}