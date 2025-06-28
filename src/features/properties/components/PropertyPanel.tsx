import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Settings2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { usePropertyPanelStore } from '../stores/property-panel.store';
import { PropertyEditor } from './PropertyEditor';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  getElementProperties,
  groupPropertiesByCategory,
  getPropertyValue,
  getCategoryInfo,
  sortCategories,
  filterVisibleProperties,
  searchProperties,
} from '../utils/property.utils';
import type { PropertyPanelProps, PropertyDefinition } from '../types/property.types';
import type { BaseElementData } from '@/features/elements/types/base.types';

/**
 * 属性面板组件
 */
export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  element,
  onPropertyChange,
  disabled = false,
}) => {
  const {
    isOpen,
    width,
    expandedCategories,
    searchKeyword,
    showAdvanced,
    setSearchKeyword,
    toggleCategory,
    toggleShowAdvanced,
  } = usePropertyPanelStore();

  // 获取元素的所有属性定义
  const allProperties = useMemo(() => {
    if (!element) return [];
    return getElementProperties(element);
  }, [element]);

  // 过滤可见属性
  const visibleProperties = useMemo(() => {
    if (!element) return [];
    return filterVisibleProperties(allProperties, element, showAdvanced);
  }, [allProperties, element, showAdvanced]);

  // 搜索属性
  const searchedProperties = useMemo(() => {
    return searchProperties(visibleProperties, searchKeyword);
  }, [visibleProperties, searchKeyword]);

  // 按分类分组
  const groupedProperties = useMemo(() => {
    return groupPropertiesByCategory(searchedProperties);
  }, [searchedProperties]);

  // 排序后的分类
  const sortedCategories = useMemo(() => {
    return sortCategories(Array.from(groupedProperties.keys()));
  }, [groupedProperties]);

  const handlePropertyChange = (key: string, value: any) => {
    if (!disabled && element) {
      onPropertyChange(key, value);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-l border-gray-200 h-full',
        'transition-all duration-200'
      )}
      style={{ width }}
    >
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-medium text-sm">属性面板</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleShowAdvanced}
          title={showAdvanced ? '隐藏高级属性' : '显示高级属性'}
        >
          <Settings2 className={cn('h-4 w-4', showAdvanced && 'text-blue-600')} />
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="px-4 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索属性..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </div>

      {/* 属性列表 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!element ? (
            <div className="text-center text-gray-500 text-sm py-8">
              请选择一个元素以查看其属性
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              {searchKeyword ? '没有找到匹配的属性' : '没有可配置的属性'}
            </div>
          ) : (
            sortedCategories.map((categoryName) => {
              const properties = groupedProperties.get(categoryName)!;
              const category = getCategoryInfo(categoryName);
              const isExpanded = expandedCategories.has(categoryName);

              return (
                <div key={categoryName} className="space-y-2">
                  {/* 分类标题 */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryName)}
                    className="w-full flex items-center justify-between py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {category.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {properties.length}
                    </span>
                  </button>

                  {/* 属性列表 */}
                  {isExpanded && (
                    <div className="space-y-3 pl-5">
                      {properties.map((property) => (
                        <PropertyItem
                          key={property.key}
                          element={element}
                          property={property}
                          value={getPropertyValue(element, property.key)}
                          onChange={(value) => handlePropertyChange(property.key, value)}
                          disabled={disabled}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

/**
 * 属性项组件
 */
interface PropertyItemProps {
  element: BaseElementData;
  property: PropertyDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const PropertyItem: React.FC<PropertyItemProps> = ({
  element,
  property,
  value,
  onChange,
  disabled,
}) => {
  // 对于 checkbox 类型，不显示标签（编辑器内部会显示）
  if (property.type === 'checkbox') {
    return (
      <PropertyEditor
        element={element}
        property={property}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">
        {property.label}
      </label>
      <PropertyEditor
        element={element}
        property={property}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};