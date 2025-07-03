import React, { useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search, Settings2 } from 'lucide-react';
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
 * 固定布局的属性面板
 * 参考 Figma、Adobe XD 的实现
 */
export const PropertyPanelFixed: React.FC<PropertyPanelProps> = ({
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
    togglePanel,
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

  return (
    <aside 
      className={cn(
        "absolute right-0 top-0 bg-background border-l border-border h-full flex z-10",
        "transition-transform duration-300 ease-in-out"
      )}
      style={{ 
        width: width,
        transform: isOpen ? 'translateX(0)' : `translateX(${width - 48}px)`
      }}
    >
      {/* 主面板内容 - 改用transform和opacity实现动画 */}
              {isOpen && (
          <div className="flex flex-col overflow-hidden flex-1">
            {/* 面板头部 */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-muted/30">
          <h3 className="font-medium text-sm text-foreground select-none">属性</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleShowAdvanced}
              title={showAdvanced ? '隐藏高级选项' : '显示高级选项'}
            >
              <Settings2 className={cn('h-4 w-4', showAdvanced && 'text-primary')} />
            </Button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="px-4 py-3 border-b border-border bg-muted/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索属性..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 h-8 bg-background/60 border-input/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* 属性列表 */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-1">
            {!element ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground text-sm">未选中任何元素</div>
                <div className="text-muted-foreground/60 text-xs mt-1">选择一个元素以查看其属性</div>
              </div>
            ) : sortedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground text-sm">
                  {searchKeyword ? '未找到匹配的属性' : '无可用属性'}
                </div>
              </div>
            ) : (
              sortedCategories.map((categoryName) => {
                const properties = groupedProperties.get(categoryName)!;
                const category = getCategoryInfo(categoryName);
                const isExpanded = expandedCategories.has(categoryName);

                return (
                  <div key={categoryName} className="select-none">
                    {/* 分类标题 */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryName)}
                      className={cn(
                        "w-full flex items-center justify-between py-2 px-2 -mx-2 rounded",
                        "text-sm font-medium transition-colors",
                        "hover:bg-muted/50",
                        isExpanded && "bg-muted/30"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-foreground/80">{category.label}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {properties.length}
                      </span>
                    </button>

                    {/* 属性列表 */}
                    {isExpanded && (
                      <div className="space-y-3 pl-5 pr-1 py-2">
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
        )}

      {/* 切换按钮 - 始终可见 */}
      <div className="w-12 flex items-center justify-center border-l border-border bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePanel}
          className="h-full w-full rounded-none"
          title={isOpen ? "收起属性面板" : "展开属性面板"}
        >
          {isOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
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
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground/70 select-none">
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