import React from 'react';
import { PropertyPanelFloat } from './PropertyPanelFloat';
import { usePropertyPanelStore } from '../stores/property-panel.store';
import type { PropertyPanelProps } from '../types/property.types';

/**
 * 属性面板包装器
 * 处理布局占位，确保内容区域正确调整大小
 */
export const PropertyPanelWrapper: React.FC<PropertyPanelProps> = (props) => {
  const { isOpen, width } = usePropertyPanelStore();

  return (
    <>
      {/* 占位区域 - 确保内容区域正确调整 */}
      <div 
        className="relative h-full transition-all duration-300 ease-in-out"
        style={{ width: isOpen ? width : 0 }}
      >
        <PropertyPanelFloat {...props} />
      </div>
    </>
  );
};