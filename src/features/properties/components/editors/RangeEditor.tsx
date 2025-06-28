import React, { useState, useEffect } from 'react';
import { Slider } from '@/shared/components/ui/slider';
import { Input } from '@/shared/components/ui/input';
import { PropertyEditorProps } from '../../types/property.types';
import { validatePropertyValue, transformPropertyValue } from '../../utils/property.utils';

/**
 * 滑块编辑器
 */
export const RangeEditor: React.FC<PropertyEditorProps> = ({
  element,
  property,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState(value || property.defaultValue || 0);
  const [inputValue, setInputValue] = useState((value || property.defaultValue || 0).toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(value || property.defaultValue || 0);
    setInputValue((value || property.defaultValue || 0).toString());
  }, [value, property.defaultValue]);

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    setLocalValue(newValue);
    setInputValue(newValue.toString());
    onChange(newValue);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue === '' || !isNaN(Number(newValue))) {
      const numValue = newValue === '' ? property.defaultValue || 0 : Number(newValue);
      
      // 验证值
      const validationError = validatePropertyValue(property, numValue, element);
      setError(validationError);
      
      if (!validationError) {
        setLocalValue(numValue);
        onChange(numValue);
      }
    }
  };

  const handleInputBlur = () => {
    // 应用转换
    const transformedValue = transformPropertyValue(property, inputValue);
    
    // 再次验证转换后的值
    const validationError = validatePropertyValue(property, transformedValue, element);
    
    if (!validationError) {
      setLocalValue(transformedValue);
      setInputValue(transformedValue.toString());
      onChange(transformedValue);
    } else {
      // 恢复到有效值
      setInputValue(localValue.toString());
    }
    
    onBlur?.();
  };

  const min = property.min ?? 0;
  const max = property.max ?? 100;
  const step = property.step ?? 1;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3">
        <Slider
          value={[localValue]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="flex-1"
        />
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-20 ${error ? 'border-red-500' : ''}`}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};