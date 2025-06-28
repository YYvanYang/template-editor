import React from 'react';
import { Stage, Layer } from 'react-konva';
import { TableElement } from '@/features/elements/table/TableElement';
import { TableElementRenderer } from './TableElementRenderer';
import type { TableRow } from '@/features/elements/types/table.types';

/**
 * 表格元素示例组件
 * 展示各种表格配置和数据绑定用法
 */
export const TableElementExample: React.FC = () => {
  // 示例1：基础静态表格
  const basicTable = new TableElement({
    position: { x: 20, y: 20 },
    size: { width: 400, height: 150 },
    rows: [
      {
        type: 'header',
        cells: [
          { content: '订单号', width: '100' },
          { content: '客户', width: '150' },
          { content: '金额', width: '100' },
          { content: '状态', width: '50' },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: 'ORD-001' },
          { content: '张三' },
          { content: '¥99.99' },
          { content: '已发货' },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: 'ORD-002' },
          { content: '李四' },
          { content: '¥199.99' },
          { content: '待发货' },
        ],
      },
    ],
  });

  // 示例2：带样式的表格
  const styledTable = new TableElement({
    position: { x: 20, y: 200 },
    size: { width: 400, height: 120 },
    tableStyle: {
      borderWidth: '2pt',
      borderStyle: 'solid',
      borderColor: '#333333',
      cellBorderStyle: 'dashed',
      headerBorderWidth: '3pt',
      fontSize: 10,
      fontFamily: 'Arial',
    },
    rows: [
      {
        type: 'header',
        cells: [
          {
            content: '产品名称',
            width: '200',
            style: {
              backgroundColor: '#e3f2fd',
              fontWeight: 'bold',
              align: 'center',
            },
          },
          {
            content: '数量',
            width: '100',
            style: {
              backgroundColor: '#e3f2fd',
              fontWeight: 'bold',
              align: 'center',
            },
          },
          {
            content: '单价',
            width: '100',
            style: {
              backgroundColor: '#e3f2fd',
              fontWeight: 'bold',
              align: 'center',
            },
          },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: 'iPhone 15 Pro' },
          { content: '2', style: { align: 'center' } },
          { content: '¥8999', style: { align: 'right' } },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: 'MacBook Pro' },
          { content: '1', style: { align: 'center' } },
          { content: '¥14999', style: { align: 'right' } },
        ],
      },
    ],
  });

  // 示例3：动态数据绑定表格
  const dynamicTable = new TableElement({
    position: { x: 20, y: 340 },
    size: { width: 500, height: 200 },
    dataSource: {
      type: 'dynamic',
      binding: '{{orders}}',
      rowTemplate: {
        type: 'data',
        cells: [
          { content: '{{item.orderNo}}' },
          { content: '{{item.customer.name}}' },
          { content: '{{formatCurrency(item.total)}}' },
          { content: '{{item.status}}' },
        ],
      },
    },
    rows: [
      {
        type: 'header',
        cells: [
          { content: '订单号', width: '120' },
          { content: '客户姓名', width: '150' },
          { content: '订单金额', width: '130' },
          { content: '订单状态', width: '100' },
        ],
      },
    ],
  });

  // 动态数据
  const bindingData = {
    orders: [
      {
        orderNo: 'ORD-2024001',
        customer: { name: '王小明' },
        total: 599.99,
        status: '已完成',
      },
      {
        orderNo: 'ORD-2024002',
        customer: { name: '李小红' },
        total: 1299.50,
        status: '配送中',
      },
      {
        orderNo: 'ORD-2024003',
        customer: { name: '张大伟' },
        total: 99.00,
        status: '待支付',
      },
    ],
    formatCurrency: (value: number) => `¥${value.toFixed(2)}`,
  };

  // 示例4：跨行跨列表格
  const spanTable = new TableElement({
    position: { x: 20, y: 560 },
    size: { width: 400, height: 150 },
    rows: [
      {
        type: 'header',
        cells: [
          { content: '基本信息', colspan: 2, style: { align: 'center' } },
          { content: '联系方式', colspan: 2, style: { align: 'center' } },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '姓名' },
          { content: '张三' },
          { content: '电话' },
          { content: '13812345678' },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '年龄' },
          { content: '28' },
          { content: '邮箱', rowspan: 2 },
          { content: 'zhang@example.com', rowspan: 2 },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '职位' },
          { content: '软件工程师' },
        ],
      },
    ],
  });

  // 示例5：条件样式表格
  const conditionalTable = new TableElement({
    position: { x: 440, y: 20 },
    size: { width: 300, height: 150 },
    rows: [
      {
        type: 'header',
        cells: [
          { content: '商品', width: '150' },
          { content: '库存', width: '75' },
          { content: '状态', width: '75' },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '商品A' },
          { content: '100' },
          { 
            content: '充足',
            style: { backgroundColor: '#c8e6c9', color: '#2e7d32' },
          },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '商品B' },
          { content: '5' },
          { 
            content: '预警',
            style: { backgroundColor: '#fff3cd', color: '#856404' },
          },
        ],
      },
      {
        type: 'data',
        cells: [
          { content: '商品C' },
          { content: '0' },
          { 
            content: '缺货',
            style: { backgroundColor: '#f8d7da', color: '#721c24' },
          },
        ],
      },
    ],
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>表格元素示例</h2>
      <Stage width={800} height={800} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {/* 基础表格 */}
          <TableElementRenderer element={basicTable} />
          
          {/* 带样式的表格 */}
          <TableElementRenderer element={styledTable} />
          
          {/* 动态数据绑定表格 */}
          <TableElementRenderer 
            element={dynamicTable} 
            bindingData={bindingData} 
          />
          
          {/* 跨行跨列表格 */}
          <TableElementRenderer element={spanTable} />
          
          {/* 条件样式表格 */}
          <TableElementRenderer element={conditionalTable} />
        </Layer>
      </Stage>
      
      <div style={{ marginTop: 20 }}>
        <h3>说明：</h3>
        <ul>
          <li>基础表格：展示最简单的表格结构</li>
          <li>带样式的表格：自定义边框、字体、对齐等样式</li>
          <li>动态数据绑定：使用数据绑定系统动态生成表格行</li>
          <li>跨行跨列表格：支持复杂的表格布局</li>
          <li>条件样式：根据数据内容应用不同的单元格样式</li>
        </ul>
      </div>
    </div>
  );
};