import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { PropertyEditorProps } from '../../types/property.types';
import { validatePropertyValue } from '../../utils/property.utils';

/**
 * 颜色选择器
 */
export const ColorEditor: React.FC<PropertyEditorProps> = ({
  element,
  property,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState(value || '#000000');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value || '#000000');
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    
    // 验证值
    const validationError = validatePropertyValue(property, newValue, element);
    setError(validationError);
    
    if (!validationError) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.value);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.value);
  };

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded border border-input cursor-pointer"
              style={{ backgroundColor: localValue }}
              onClick={() => !disabled && setIsOpen(true)}
            />
            <Input
              type="text"
              value={localValue}
              onChange={handleInputChange}
              onBlur={onBlur}
              placeholder={property.placeholder || '#000000'}
              disabled={disabled}
              className={`flex-1 ${error ? 'border-destructive' : ''}`}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            <input
              ref={colorInputRef}
              type="color"
              value={localValue}
              onChange={handleColorPickerChange}
              className="w-full h-32 cursor-pointer"
            />
            <div className="grid grid-cols-8 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-input hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange(color)}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

// 预设颜色
const PRESET_COLORS = [
  '#000000', '#424242', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#F5F5F5', '#FFFFFF',
  '#D32F2F', '#C2185B', '#7B1FA2', '#512DA8', '#303F9F', '#1976D2', '#0288D1', '#0097A7',
  '#00796B', '#388E3C', '#689F38', '#AFB42B', '#FBC02D', '#FFA000', '#F57C00', '#E64A19',
  '#5D4037', '#616161', '#455A64', '#FF5252', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B',
  '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B',
];