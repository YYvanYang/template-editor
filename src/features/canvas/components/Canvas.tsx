import React, { useRef, useCallback, useEffect } from 'react'
import { Stage, Layer } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { Grid } from './Grid'
import { useCanvasEvents } from '../hooks/useCanvasEvents'

const ZOOM_SPEED = 0.002
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export const Canvas: React.FC = () => {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    canvas,
    elements,
    selectedIds,
    setZoom,
    setOffset,
  } = useEditorStore()

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    // 只有按住 Ctrl 或 Cmd 时才缩放
    if (!e.evt.ctrlKey && !e.evt.metaKey) return
    
    const stage = stageRef.current
    if (!stage) return
    
    const oldScale = canvas.zoom
    const pointer = stage.getPointerPosition()
    
    // 计算新的缩放比例
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, oldScale + direction * ZOOM_SPEED * oldScale)
    )
    
    // 计算新的偏移量，使缩放以鼠标位置为中心
    const mousePointTo = {
      x: (pointer.x - canvas.offset.x) / oldScale,
      y: (pointer.y - canvas.offset.y) / oldScale,
    }
    
    const newOffset = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    
    setZoom(newScale)
    setOffset(newOffset)
  }, [canvas, setZoom, setOffset])

  // 处理画布拖拽
  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const stage = e.target
    setOffset({
      x: stage.x(),
      y: stage.y(),
    })
  }, [setOffset])

  // 获取容器尺寸
  const [stageSize, setStageSize] = React.useState({ width: 800, height: 600 })
  
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 使用自定义钩子处理事件
  useCanvasEvents(stageRef)

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gray-100">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={canvas.zoom}
        scaleY={canvas.zoom}
        x={canvas.offset.x}
        y={canvas.offset.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {/* 网格背景 */}
          {canvas.gridEnabled && <Grid zoom={canvas.zoom} size={stageSize} />}
          
          {/* 渲染元素 */}
          {/* TODO: 实现元素渲染 */}
        </Layer>
      </Stage>
    </div>
  )
}