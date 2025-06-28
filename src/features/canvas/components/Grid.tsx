import React from 'react'
import { Line } from 'react-konva'

interface GridProps {
  zoom: number
  size: { width: number; height: number }
}

export const Grid: React.FC<GridProps> = ({ zoom, size }) => {
  const gridSize = 20 // 基础网格大小
  const strokeWidth = 1 / zoom // 保持线条粗细不变
  
  // 动态调整网格密度
  const step = zoom < 0.5 ? gridSize * 4 : zoom < 1 ? gridSize * 2 : gridSize
  
  const lines = []
  
  // 垂直线
  for (let x = 0; x <= size.width / zoom; x += step) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, size.height / zoom]}
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
    )
  }
  
  // 水平线
  for (let y = 0; y <= size.height / zoom; y += step) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, size.width / zoom, y]}
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
    )
  }
  
  return <>{lines}</>
}