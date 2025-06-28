import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { PropertyEditorProps } from '../../types/property.types';
import { validatePropertyValue, transformPropertyValue } from '../../utils/property.utils';

/**
 * 数字输入编辑器
 */
export const NumberEditor: React.FC<PropertyEditorProps> = ({
  element,
  property,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // 允许输入空值或数字
    if (newValue === '' || !isNaN(Number(newValue))) {
      const numValue = newValue === '' ? null : Number(newValue);
      
      // 验证值
      const validationError = validatePropertyValue(property, numValue, element);
      setError(validationError);
      
      if (!validationError) {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    // 应用转换
    const transformedValue = transformPropertyValue(property, localValue);
    
    // 再次验证转换后的值
    const validationError = validatePropertyValue(property, transformedValue, element);
    
    if (!validationError) {
      onChange(transformedValue);
      setLocalValue(transformedValue.toString());
    }
    
    onBlur?.();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const currentValue = Number(localValue) || 0;
    const step = property.step || 1;
    const delta = e.deltaY < 0 ? step : -step;
    const newValue = currentValue + delta;
    
    // 验证新值
    const validationError = validatePropertyValue(property, newValue, element);
    
    if (!validationError) {
      setLocalValue(newValue.toString());
      onChange(newValue);
      setError(null);
    }
  };

  return (
    <div className="w-full">
      <Input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onWheel={handleWheel}
        placeholder={property.placeholder}
        disabled={disabled}
        min={property.min}
        max={property.max}
        step={property.step}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};