import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { PropertyEditorProps } from '../../types/property.types';

/**
 * 下拉选择编辑器
 */
export const SelectEditor: React.FC<PropertyEditorProps> = ({
  property,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const handleValueChange = (newValue: string) => {
    // 转换值类型（如果选项值是数字）
    const option = property.options?.find(opt => opt.value.toString() === newValue);
    if (option) {
      onChange(option.value);
    }
  };

  return (
    <Select
      value={value?.toString() || ''}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger onBlur={onBlur} className="w-full">
        <SelectValue placeholder={property.placeholder || '请选择'} />
      </SelectTrigger>
      <SelectContent>
        {property.options?.map((option) => (
          <SelectItem 
            key={option.value?.toString() || option.label} 
            value={option.value?.toString() || 'undefined'}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};