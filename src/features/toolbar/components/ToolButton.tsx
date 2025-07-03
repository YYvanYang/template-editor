import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { ToolType } from '../types/toolbar.types';

interface ToolButtonProps {
  type: ToolType;
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  separator?: boolean;
  className?: string;
  iconOnly?: boolean;
  vertical?: boolean; // 新增：是否为垂直布局
  onClick?: () => void;
}

/**
 * 工具栏按钮组件
 */
export const ToolButton: React.FC<ToolButtonProps> = ({
  icon: Icon,
  label,
  tooltip,
  active = false,
  disabled = false,
  separator = false,
  className,
  iconOnly = false,
  vertical = false,
  onClick,
}) => {
  return (
    <>
      <button
        type="button"
        className={cn(
          'relative inline-flex items-center justify-center',
          'w-9 h-9 rounded-md',
          'transition-all duration-150',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          active && 'bg-accent text-accent-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !active && 'text-muted-foreground',
          className
        )}
        title={tooltip}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon className="w-4 h-4" />
      </button>
      {separator && (
        <div
          data-separator="true"
          className={cn(
            "bg-border",
            vertical 
              ? "h-px w-6 my-1" // 垂直布局：横线分隔符
              : "w-px h-6 mx-1"  // 水平布局：竖线分隔符
          )}
          aria-hidden="true"
        />
      )}
    </>
  );
};