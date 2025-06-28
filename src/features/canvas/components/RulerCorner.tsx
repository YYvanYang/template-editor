import React from 'react';

interface RulerCornerProps {
  size: number;
  backgroundColor?: string;
  borderColor?: string;
  unit?: 'mm' | 'cm' | 'px';
  onClick?: () => void;
}

/**
 * 标尺角落组件
 * 显示在水平和垂直标尺的交叉点
 */
export const RulerCorner: React.FC<RulerCornerProps> = ({
  size,
  backgroundColor = '#f8f9fa',
  borderColor = '#adb5bd',
  unit = 'mm',
  onClick,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: '#6c757d',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
      title={onClick ? '点击切换单位' : undefined}
    >
      {unit}
    </div>
  );
};