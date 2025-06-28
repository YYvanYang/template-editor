import React from 'react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { PropertyEditorProps } from '../../types/property.types';

/**
 * 复选框编辑器
 */
export const CheckboxEditor: React.FC<PropertyEditorProps> = ({
  property,
  value,
  onChange,
  disabled,
}) => {
  const handleCheckedChange = (checked: boolean) => {
    onChange(checked);
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={property.key}
        checked={!!value}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
      />
      <label
        htmlFor={property.key}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {property.label}
      </label>
    </div>
  );
};