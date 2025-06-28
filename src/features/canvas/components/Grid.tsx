import React from 'react'
import { Line } from 'react-konva'

interface GridProps {
  zoom: number
  size: { width: number; height: number }
  offset: { x: number; y: number }
}

export const Grid: React.FC<GridProps> = ({ zoom, size, offset }) => {
  const gridSize = 20 // 基础网格大小
  const strokeWidth = 1 / zoom // 保持线条粗细不变
  
  // 动态调整网格密度
  const step = zoom < 0.5 ? gridSize * 4 : zoom < 1 ? gridSize * 2 : gridSize
  
  const lines = []
  
  // 在画布区域内绘制网格（size 已经是画布的实际尺寸）
  const startX = 0
  const endX = size.width
  const startY = 0
  const endY = size.height
  
  // 垂直线
  for (let x = startX; x <= endX; x += step) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
    )
  }
  
  // 水平线
  for (let y = startY; y <= endY; y += step) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
    )
  }
  
  return <>{lines}</>
}