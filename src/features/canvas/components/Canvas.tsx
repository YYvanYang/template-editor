import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Group } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { ToolType } from '@/features/toolbar/types/toolbar.types'
import { Grid } from './Grid'
import { useCanvasEvents } from '../hooks/useCanvasEvents'
import { useAlignment } from '../hooks/useAlignment'
import { useElementCreation } from '../hooks/useElementCreation'
import { AlignmentGuidesKonva } from './AlignmentGuidesKonva'
import { ElementsRenderer } from './ElementRenderer'
import { PerformancePanel } from './PerformancePanel'
import { PerformanceMonitor } from '../utils/performance-monitor'

const ZOOM_SPEED = 0.002
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const MM_TO_PX = 3.7795275591 // 1mm = 3.7795275591px at 96dpi

interface CanvasProps {
  unit?: 'mm' | 'cm' | 'px'
}

export const Canvas: React.FC<CanvasProps> = ({ unit = 'mm' }) => {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [performanceMonitor] = useState(() => new PerformanceMonitor())
  
  const {
    canvas,
    template,
    activeTool,
    setZoom,
    setOffset,
  } = useEditorStore()

  // 初始化对齐系统，使用 store 中的配置
  const alignment = useAlignment({
    config: {
      enabled: canvas.alignmentEnabled,
      threshold: canvas.alignmentThreshold,
      snapToGrid: canvas.snapEnabled,
      gridSize: 10,
      snapToElements: true,
      showCenterGuides: true,
      showEdgeGuides: true,
    },
  })

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

  // 用于节流的 ref
  const dragAnimationFrame = useRef<number | null>(null)
  
  // 处理画布拖拽移动 - 实时更新标尺
  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    // 取消之前的动画帧
    if (dragAnimationFrame.current) {
      cancelAnimationFrame(dragAnimationFrame.current)
    }
    
    // 使用 requestAnimationFrame 节流更新
    dragAnimationFrame.current = requestAnimationFrame(() => {
      const stage = e.target
      setOffset({
        x: stage.x(),
        y: stage.y(),
      })
    })
  }, [setOffset])
  
  // 处理画布拖拽结束
  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    // 清理动画帧
    if (dragAnimationFrame.current) {
      cancelAnimationFrame(dragAnimationFrame.current)
      dragAnimationFrame.current = null
    }
    
    // 确保最终位置准确
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
    return () => {
      window.removeEventListener('resize', updateSize)
      // 清理拖拽动画帧
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current)
      }
    }
  }, [])

  // 使用自定义钩子处理事件
  useCanvasEvents(stageRef)
  
  // 处理元素创建
  const { handleCanvasClick } = useElementCreation()

  // 处理辅助线点击
  const handleGuideClick = useCallback((guideId: string) => {
    console.log('Guide clicked:', guideId)
  }, [])

  // 处理辅助线双击（删除）
  const handleGuideDoubleClick = useCallback((guideId: string) => {
    alignment.removeManualGuide(guideId)
  }, [alignment])

  // 处理辅助线拖拽
  const handleGuideDrag = useCallback((guideId: string, position: number) => {
    // 更新辅助线位置
    console.log('Guide dragged:', guideId, position)
  }, [])

  // Determine cursor style based on active tool
  const getCursorStyle = () => {
    switch (activeTool) {
      case ToolType.HAND:
        return 'grab'
      case ToolType.TEXT:
        return 'text'
      case ToolType.SELECT:
        return 'default'
      default:
        return 'crosshair'
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden" 
      style={{ backgroundColor: '#f5f5f5', cursor: getCursorStyle() }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={canvas.zoom}
        scaleY={canvas.zoom}
        x={canvas.offset.x}
        y={canvas.offset.y}
        draggable={activeTool === ToolType.HAND}
        onWheel={handleWheel}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={handleCanvasClick}
      >
        <Layer>
          {/* 画布背景 */}
          <Rect
            x={0}
            y={0}
            width={template.size.width * MM_TO_PX}
            height={template.size.height * MM_TO_PX}
            fill="white"
            shadowColor="rgba(0,0,0,0.1)"
            shadowBlur={10}
            shadowOffsetX={2}
            shadowOffsetY={2}
          />
          
          {/* 网格背景 */}
          {canvas.gridEnabled && (
            <Group clip={{
              x: 0,
              y: 0,
              width: template.size.width * MM_TO_PX,
              height: template.size.height * MM_TO_PX,
            }}>
              <Grid 
                zoom={canvas.zoom} 
                size={{ 
                  width: template.size.width * MM_TO_PX,
                  height: template.size.height * MM_TO_PX,
                }} 
                offset={{ x: 0, y: 0 }}
                unit={unit}
              />
            </Group>
          )}
          
          {/* 渲染元素 */}
          <ElementsRenderer />
          
          {/* 对齐辅助线 */}
          {canvas.showAlignmentGuides && (
            <AlignmentGuidesKonva
              guides={alignment.staticGuides}
              dynamicGuides={alignment.dynamicGuides}
              viewport={{
                scale: canvas.zoom,
                x: canvas.offset.x,
                y: canvas.offset.y,
                width: stageSize.width,
                height: stageSize.height,
              }}
              canvasSize={{
                width: template.size.width * MM_TO_PX,
                height: template.size.height * MM_TO_PX,
              }}
              onGuideClick={handleGuideClick}
              onGuideDoubleClick={handleGuideDoubleClick}
              onGuideDrag={handleGuideDrag}
              showMeasurements={canvas.showMeasurements}
            />
          )}
        </Layer>
      </Stage>
      
      {/* 性能监控面板 */}
      {canvas.showPerformanceMonitor && (
        <PerformancePanel
          monitor={performanceMonitor}
          position="bottom-right"
          expanded={false}
        />
      )}
    </div>
  )
}