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
          className="w-px h-6 bg-border mx-1"
          aria-hidden="true"
        />
      )}
    </>
  );
};