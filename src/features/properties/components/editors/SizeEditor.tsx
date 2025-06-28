import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { PropertyEditorProps } from '../../types/property.types';
import { Lock, Unlock } from 'lucide-react';

interface Size {
  width: number;
  height: number;
}

/**
 * 尺寸编辑器（宽度 x 高度）
 */
export const SizeEditor: React.FC<PropertyEditorProps> = ({
  property,
  value,
  onChange,
  disabled,
}) => {
  const size: Size = value || { width: 100, height: 100 };
  const [isLocked, setIsLocked] = React.useState(false);
  const aspectRatio = size.width / size.height;

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value) || 0;
    let newHeight = size.height;

    if (isLocked && size.width > 0) {
      newHeight = Math.round(newWidth / aspectRatio);
    }

    onChange({ width: newWidth, height: newHeight });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Number(e.target.value) || 0;
    let newWidth = size.width;

    if (isLocked && size.height > 0) {
      newWidth = Math.round(newHeight * aspectRatio);
    }

    onChange({ width: newWidth, height: newHeight });
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Input
          type="number"
          value={size.width}
          onChange={handleWidthChange}
          placeholder="宽度"
          disabled={disabled}
          min={0}
          className="text-center"
        />
      </div>
      <button
        type="button"
        onClick={toggleLock}
        disabled={disabled}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title={isLocked ? '解锁比例' : '锁定比例'}
      >
        {isLocked ? (
          <Lock className="h-4 w-4 text-gray-600" />
        ) : (
          <Unlock className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <div className="flex-1">
        <Input
          type="number"
          value={size.height}
          onChange={handleHeightChange}
          placeholder="高度"
          disabled={disabled}
          min={0}
          className="text-center"
        />
      </div>
    </div>
  );
};