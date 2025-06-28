import React from 'react';
import { PropertyEditorProps, PropertyType } from '../types/property.types';
import { TextEditor } from './editors/TextEditor';
import { NumberEditor } from './editors/NumberEditor';
import { ColorEditor } from './editors/ColorEditor';
import { SelectEditor } from './editors/SelectEditor';
import { CheckboxEditor } from './editors/CheckboxEditor';
import { RangeEditor } from './editors/RangeEditor';
import { TextareaEditor } from './editors/TextareaEditor';
import { BindingEditor } from './editors/BindingEditor';
import { SizeEditor } from './editors/SizeEditor';
import { PositionEditor } from './editors/PositionEditor';

/**
 * 属性编辑器组件
 * 根据属性类型选择对应的编辑器
 */
export const PropertyEditor: React.FC<PropertyEditorProps> = (props) => {
  const { property } = props;

  // 根据属性类型返回对应的编辑器
  switch (property.type) {
    case PropertyType.TEXT:
      return <TextEditor {...props} />;
      
    case PropertyType.NUMBER:
      return <NumberEditor {...props} />;
      
    case PropertyType.COLOR:
      return <ColorEditor {...props} />;
      
    case PropertyType.SELECT:
      return <SelectEditor {...props} />;
      
    case PropertyType.CHECKBOX:
      return <CheckboxEditor {...props} />;
      
    case PropertyType.RANGE:
      return <RangeEditor {...props} />;
      
    case PropertyType.TEXTAREA:
      return <TextareaEditor {...props} />;
      
    case PropertyType.BINDING:
      return <BindingEditor {...props} />;
      
    case PropertyType.SIZE:
      return <SizeEditor {...props} />;
      
    case PropertyType.POSITION:
      return <PositionEditor {...props} />;
      
    case PropertyType.FONT_FAMILY:
      // 字体选择器使用 SELECT 类型
      return <SelectEditor {...props} property={{
        ...property,
        options: [
          { label: '宋体', value: '宋体' },
          { label: '黑体', value: '黑体' },
          { label: '微软雅黑', value: '微软雅黑' },
          { label: '楷体', value: '楷体' },
          { label: '仿宋', value: '仿宋' },
          { label: 'Arial', value: 'Arial' },
          { label: 'Times New Roman', value: 'Times New Roman' },
          { label: 'Helvetica', value: 'Helvetica' },
          { label: 'Courier New', value: 'Courier New' },
        ],
      }} />;
      
    case PropertyType.FONT_SIZE:
      // 字号选择器使用 SELECT 类型
      return <SelectEditor {...props} property={{
        ...property,
        options: [
          { label: '12px', value: 12 },
          { label: '14px', value: 14 },
          { label: '16px', value: 16 },
          { label: '18px', value: 18 },
          { label: '20px', value: 20 },
          { label: '24px', value: 24 },
          { label: '28px', value: 28 },
          { label: '32px', value: 32 },
          { label: '36px', value: 36 },
          { label: '48px', value: 48 },
          { label: '64px', value: 64 },
        ],
      }} />;
      
    case PropertyType.ALIGNMENT:
      // 对齐方式选择器使用 SELECT 类型
      return <SelectEditor {...props} property={{
        ...property,
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
          { label: '两端对齐', value: 'justify' },
        ],
      }} />;
      
    case PropertyType.BORDER_STYLE:
      // 边框样式选择器使用 SELECT 类型
      return <SelectEditor {...props} property={{
        ...property,
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
          { label: '双线', value: 'double' },
          { label: '无', value: 'none' },
        ],
      }} />;
      
    default:
      // 默认使用文本编辑器
      return <TextEditor {...props} />;
  }
};