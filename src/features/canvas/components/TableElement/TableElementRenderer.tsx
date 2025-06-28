import React, { useMemo } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import type { TableElement } from '@/features/elements/table/TableElement';
import type { TableCell, TableRow } from '@/features/elements/types/table.types';
import { render as renderTemplate } from '@/features/data-binding';

interface TableElementRendererProps {
  element: TableElement;
  bindingData?: any;
  selected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
}

/**
 * 表格元素渲染器
 */
export const TableElementRenderer: React.FC<TableElementRendererProps> = ({
  element,
  bindingData = {},
  selected = false,
  onSelect,
  onDeselect,
}) => {
  const { position, size, tableStyle } = element;

  // 处理数据绑定 - 如果有动态数据源，生成行
  const rows = useMemo(() => {
    if (element.dataSource?.type === 'dynamic' && element.dataSource.binding && bindingData) {
      try {
        // 评估绑定表达式获取数据
        const data = renderTemplate(element.dataSource.binding, bindingData);
        if (Array.isArray(data) && element.dataSource.rowTemplate) {
          // 生成动态行
          const dynamicRows = data.map((item, index) => {
            const row: TableRow = {
              type: 'data',
              cells: element.dataSource!.rowTemplate!.cells.map(cellTemplate => ({
                ...cellTemplate,
                // 使用数据绑定渲染单元格内容
                content: renderTemplate(cellTemplate.content, { ...bindingData, item, index }),
              })),
            };
            return row;
          });
          
          // 合并表头和动态行
          const headerRow = element.getHeaderRow();
          return headerRow ? [headerRow, ...dynamicRows] : dynamicRows;
        }
      } catch (error) {
        console.error('Error evaluating table data binding:', error);
      }
    }
    
    return element.rows;
  }, [element, bindingData]);

  // 计算单元格布局
  const cellLayout = useMemo(() => {
    const layout: {
      x: number;
      y: number;
      width: number;
      height: number;
      content: string;
      colspan?: number;
      rowspan?: number;
      isHeader: boolean;
      style?: any;
    }[][] = [];

    let currentY = 0;
    const columnWidths = calculateColumnWidths(element, rows);

    rows.forEach((row, rowIndex) => {
      const rowCells: typeof layout[0] = [];
      let currentX = 0;
      let cellIndex = 0;

      // 处理跨行单元格占用的列
      const occupiedColumns = new Set<number>();
      for (let i = 0; i < rowIndex; i++) {
        layout[i]?.forEach((cell) => {
          if (cell.rowspan && cell.rowspan > 1) {
            const endRow = i + cell.rowspan - 1;
            if (endRow >= rowIndex) {
              // 计算此单元格占用的列
              const startCol = columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0);
              const cellWidth = cell.width;
              let accumulated = 0;
              for (let col = 0; col < columnWidths.length; col++) {
                if (accumulated >= startCol && accumulated < startCol + cellWidth) {
                  occupiedColumns.add(col);
                }
                accumulated += columnWidths[col];
              }
            }
          }
        });
      }

      row.cells.forEach((cell, colIndex) => {
        // 跳过被占用的列
        while (occupiedColumns.has(cellIndex)) {
          currentX += columnWidths[cellIndex] || 0;
          cellIndex++;
        }

        const colspan = cell.colspan || 1;
        const rowspan = cell.rowspan || 1;
        
        // 计算单元格宽度
        let cellWidth = 0;
        for (let i = 0; i < colspan && cellIndex + i < columnWidths.length; i++) {
          cellWidth += columnWidths[cellIndex + i] || 0;
        }

        const cellHeight = row.height || (row.type === 'header' ? 40 : 30);

        // 处理数据绑定的内容
        const content = bindingData ? renderTemplate(cell.content, bindingData) : cell.content;

        rowCells.push({
          x: currentX,
          y: currentY,
          width: cellWidth,
          height: cellHeight * rowspan,
          content,
          colspan,
          rowspan,
          isHeader: row.type === 'header',
          style: cell.style,
        });

        currentX += cellWidth;
        cellIndex += colspan;
      });

      layout.push(rowCells);
      currentY += row.height || (row.type === 'header' ? 40 : 30);
    });

    return layout;
  }, [element, rows, bindingData]);

  // 渲染边框线
  const borderLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const style = tableStyle || {};
    
    // 外边框
    const borderWidth = parseBorderWidth(style.borderWidth || '1pt');
    const borderColor = style.borderColor || '#000000';
    
    if (style.borderStyle !== 'none') {
      // 上边框
      lines.push(
        <Line
          key="border-top"
          points={[0, 0, size.width, 0]}
          stroke={borderColor}
          strokeWidth={borderWidth}
          dash={getBorderDash(style.borderStyle)}
        />
      );
      // 右边框
      lines.push(
        <Line
          key="border-right"
          points={[size.width, 0, size.width, size.height]}
          stroke={borderColor}
          strokeWidth={borderWidth}
          dash={getBorderDash(style.borderStyle)}
        />
      );
      // 下边框
      lines.push(
        <Line
          key="border-bottom"
          points={[0, size.height, size.width, size.height]}
          stroke={borderColor}
          strokeWidth={borderWidth}
          dash={getBorderDash(style.borderStyle)}
        />
      );
      // 左边框
      lines.push(
        <Line
          key="border-left"
          points={[0, 0, 0, size.height]}
          stroke={borderColor}
          strokeWidth={borderWidth}
          dash={getBorderDash(style.borderStyle)}
        />
      );
    }

    // 内部边框
    const cellBorderWidth = parseBorderWidth(style.cellBorderWidth || '1pt');
    const cellBorderStyle = style.cellBorderStyle || 'solid';
    
    if (cellBorderStyle !== 'none') {
      // 横线
      let y = 0;
      cellLayout.forEach((row, rowIndex) => {
        if (rowIndex > 0) {
          const isHeaderBorder = cellLayout[rowIndex - 1]?.[0]?.isHeader;
          const borderStyle = isHeaderBorder ? 
            (style.headerBorderStyle || cellBorderStyle) : 
            cellBorderStyle;
          const borderW = isHeaderBorder ? 
            parseBorderWidth(style.headerBorderWidth || style.cellBorderWidth || '1pt') : 
            cellBorderWidth;
            
          lines.push(
            <Line
              key={`h-line-${rowIndex}`}
              points={[0, y, size.width, y]}
              stroke={borderColor}
              strokeWidth={borderW}
              dash={getBorderDash(borderStyle)}
            />
          );
        }
        y += row[0]?.height || 30;
      });

      // 竖线
      const columnWidths = calculateColumnWidths(element, rows);
      let x = 0;
      columnWidths.forEach((width, colIndex) => {
        if (colIndex > 0) {
          lines.push(
            <Line
              key={`v-line-${colIndex}`}
              points={[x, 0, x, size.height]}
              stroke={borderColor}
              strokeWidth={cellBorderWidth}
              dash={getBorderDash(cellBorderStyle)}
            />
          );
        }
        x += width;
      });
    }

    return lines;
  }, [element, tableStyle, size, cellLayout, rows]);

  return (
    <Group
      x={position.x}
      y={position.y}
      onClick={onSelect}
    >
      {/* 背景 */}
      <Rect
        width={size.width}
        height={size.height}
        fill="white"
        listening={true}
      />

      {/* 渲染单元格内容 */}
      {cellLayout.map((row, rowIndex) =>
        row.map((cell, cellIndex) => (
          <Group key={`cell-${rowIndex}-${cellIndex}`}>
            {/* 单元格背景 */}
            {(cell.isHeader || cell.style?.backgroundColor) && (
              <Rect
                x={cell.x}
                y={cell.y}
                width={cell.width}
                height={cell.height}
                fill={
                  cell.style?.backgroundColor ||
                  (cell.isHeader ? '#f5f5f5' : 'transparent')
                }
              />
            )}
            
            {/* 单元格文本 */}
            <Text
              x={cell.x + parsePadding(tableStyle?.cellPadding)}
              y={cell.y + parsePadding(tableStyle?.cellPadding)}
              width={cell.width - 2 * parsePadding(tableStyle?.cellPadding)}
              height={cell.height - 2 * parsePadding(tableStyle?.cellPadding)}
              text={cell.content}
              fontSize={cell.style?.fontSize || tableStyle?.fontSize || 8}
              fontFamily={cell.style?.fontFamily || tableStyle?.fontFamily || '宋体'}
              fontStyle={cell.isHeader ? 'bold' : (cell.style?.fontWeight || 'normal')}
              fill={cell.style?.color || tableStyle?.color || '#000000'}
              align={cell.style?.align || 'left'}
              verticalAlign={cell.style?.valign || 'middle'}
              wrap="word"
              ellipsis={true}
            />
          </Group>
        ))
      )}

      {/* 边框线 */}
      {borderLines}

      {/* 选中边框 */}
      {selected && (
        <Rect
          width={size.width}
          height={size.height}
          stroke="#0066FF"
          strokeWidth={2}
          fill="transparent"
          dash={[5, 5]}
          listening={false}
        />
      )}
    </Group>
  );
};

/**
 * 计算列宽
 */
function calculateColumnWidths(element: TableElement, rows: TableRow[]): number[] {
  const columns = element.columns;
  
  if (columns && columns.length > 0) {
    return columns.map(col => {
      const width = col.width;
      if (typeof width === 'string') {
        if (width.endsWith('%')) {
          const percentage = parseFloat(width) / 100;
          return element.size.width * percentage;
        } else if (width.endsWith('mm')) {
          return parseFloat(width);
        }
        return parseFloat(width) || 100;
      }
      return width || 100;
    });
  }

  // 如果没有列定义，平均分配
  const columnCount = element.getColumnCount();
  const avgWidth = element.size.width / columnCount;
  return Array(columnCount).fill(avgWidth);
}

/**
 * 解析边框宽度
 */
function parseBorderWidth(width: string | number): number {
  if (typeof width === 'number') return width;
  if (width.endsWith('pt')) return parseFloat(width) * 1.333; // pt to px
  if (width.endsWith('mm')) return parseFloat(width) * 3.78; // mm to px
  return parseFloat(width) || 1;
}

/**
 * 获取边框虚线样式
 */
function getBorderDash(style?: string): number[] | undefined {
  switch (style) {
    case 'dashed':
      return [6, 3];
    case 'dotted':
      return [2, 2];
    default:
      return undefined;
  }
}

/**
 * 解析内边距
 */
function parsePadding(padding?: number | string): number {
  if (typeof padding === 'number') return padding;
  if (typeof padding === 'string') {
    if (padding.endsWith('mm')) return parseFloat(padding) * 3.78;
    if (padding.endsWith('pt')) return parseFloat(padding) * 1.333;
    return parseFloat(padding) || 2;
  }
  return 2; // 默认2mm
}