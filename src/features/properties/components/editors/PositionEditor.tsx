import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { PropertyEditorProps } from '../../types/property.types';

interface Position {
  x: number;
  y: number;
}

/**
 * 位置编辑器（X, Y 坐标）
 */
export const PositionEditor: React.FC<PropertyEditorProps> = ({
  property,
  value,
  onChange,
  disabled,
}) => {
  const position: Position = value || { x: 0, y: 0 };

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newX = Number(e.target.value) || 0;
    onChange({ ...position, x: newX });
  };

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newY = Number(e.target.value) || 0;
    onChange({ ...position, y: newY });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-1">
        <span className="text-xs text-gray-500">X:</span>
        <Input
          type="number"
          value={position.x}
          onChange={handleXChange}
          placeholder="X"
          disabled={disabled}
          className="text-center"
        />
      </div>
      <div className="flex-1 flex items-center gap-1">
        <span className="text-xs text-gray-500">Y:</span>
        <Input
          type="number"
          value={position.y}
          onChange={handleYChange}
          placeholder="Y"
          disabled={disabled}
          className="text-center"
        />
      </div>
    </div>
  );
};