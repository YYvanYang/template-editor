import React from 'react'
import { Line } from 'react-konva'
import { UNIT_CONVERSIONS } from '../types/ruler.types'

interface GridProps {
  zoom: number
  size: { width: number; height: number }
  offset: { x: number; y: number }
  unit?: 'mm' | 'cm' | 'px'
}

export const Grid: React.FC<GridProps> = ({ zoom, size, unit = 'mm' }) => {
  const unitConfig = UNIT_CONVERSIONS[unit]
  const strokeWidth = 1 / zoom // 保持线条粗细不变
  
  // 根据单位和缩放级别动态调整网格间隔
  let gridInterval: number = unitConfig.minorInterval // 默认使用次要刻度间隔
  
  if (unit === 'mm') {
    const pixelsPerMm = unitConfig.toPx * zoom
    
    if (pixelsPerMm < 1.5) {
      // 极小缩放：50mm 网格
      gridInterval = 50
    } else if (pixelsPerMm < 2.5) {
      // 小缩放：20mm 网格
      gridInterval = 20
    } else if (pixelsPerMm < 3.5) {
      // 中小缩放：10mm 网格
      gridInterval = 10
    } else if (pixelsPerMm < 7.5) {
      // 默认缩放：5mm 网格
      gridInterval = 5
    } else if (pixelsPerMm < 15) {
      // 中等缩放：2mm 网格
      gridInterval = 2
    } else if (pixelsPerMm < 30) {
      // 大缩放：1mm 网格
      gridInterval = 1
    } else {
      // 极大缩放：0.5mm 网格
      gridInterval = 0.5
    }
  } else if (unit === 'cm') {
    const pixelsPerCm = unitConfig.toPx * zoom
    
    if (pixelsPerCm < 30) {
      gridInterval = 5 // 5cm 网格
    } else if (pixelsPerCm < 75) {
      gridInterval = 1 // 1cm 网格
    } else {
      gridInterval = 0.5 // 0.5cm 网格
    }
  } else {
    // 像素单位
    if (zoom < 0.5) {
      gridInterval = 100
    } else if (zoom < 1) {
      gridInterval = 50
    } else if (zoom < 2) {
      gridInterval = 20
    } else {
      gridInterval = 10
    }
  }
  
  // 将间隔转换为像素
  const step = gridInterval * unitConfig.toPx
  
  const lines = []
  
  // 在画布区域内绘制网格
  const startX = 0
  const endX = size.width
  const startY = 0
  const endY = size.height
  
  // 计算网格起始位置，确保与0点对齐
  const gridStartX = Math.floor(startX / step) * step
  const gridStartY = Math.floor(startY / step) * step
  
  // 垂直线
  for (let x = gridStartX; x <= endX; x += step) {
    if (x >= startX) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
      )
    }
  }
  
  // 水平线
  for (let y = gridStartY; y <= endY; y += step) {
    if (y >= startY) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
      )
    }
  }
  
  
  return <>{lines}</>
}