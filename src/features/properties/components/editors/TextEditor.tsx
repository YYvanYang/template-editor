import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { PropertyEditorProps } from '../../types/property.types';
import { validatePropertyValue, transformPropertyValue } from '../../utils/property.utils';

/**
 * 文本输入编辑器
 */
export const TextEditor: React.FC<PropertyEditorProps> = ({
  element,
  property,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // 验证值
    const validationError = validatePropertyValue(property, newValue, element);
    setError(validationError);
    
    if (!validationError) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    // 应用转换
    const transformedValue = transformPropertyValue(property, localValue);
    
    // 再次验证转换后的值
    const validationError = validatePropertyValue(property, transformedValue, element);
    
    if (!validationError) {
      onChange(transformedValue);
      setLocalValue(transformedValue);
    }
    
    onBlur?.();
  };

  return (
    <div className="w-full">
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={property.placeholder}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};