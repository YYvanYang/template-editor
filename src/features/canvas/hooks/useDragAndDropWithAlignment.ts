import { useCallback, useRef, useState, useEffect } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { useAlignment } from './useAlignment'
import { EnhancedAlignmentEngine } from '../utils/alignment-enhanced.utils'
import type { BaseElementData } from '@/features/elements'

export interface DragState {
  isDragging: boolean
  draggedElementIds: Set<string>
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  alignedPosition?: { x: number; y: number }
}

export interface UseDragAndDropWithAlignmentOptions {
  onDragStart?: (elementIds: Set<string>) => void
  onDragMove?: (deltaX: number, deltaY: number) => void
  onDragEnd?: (elementIds: Set<string>, deltaX: number, deltaY: number) => void
  enableAlignment?: boolean
  enableMagneticSnap?: boolean
}

/**
 * 增强的拖拽钩子，集成对齐系统
 */
export function useDragAndDropWithAlignment(options: UseDragAndDropWithAlignmentOptions = {}) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    enableAlignment = true,
    enableMagneticSnap = true,
  } = options
  
  const {
    elements,
    selectedIds,
    updateElement,
    canvas,
  } = useEditorStore()
  
  // 使用对齐系统
  const alignment = useAlignment({
    config: {
      enabled: enableAlignment,
      threshold: 5,
      snapToGrid: canvas.snapEnabled,
      gridSize: 10,
      snapToElements: true,
      showCenterGuides: true,
      showEdgeGuides: true,
    }
  })
  
  // 创建增强的对齐引擎
  const alignmentEngineRef = useRef<EnhancedAlignmentEngine>()
  if (!alignmentEngineRef.current) {
    alignmentEngineRef.current = new EnhancedAlignmentEngine(alignment.config)
  }
  
  // 更新空间索引
  useEffect(() => {
    const elementsArray = Array.from(elements.values()).map(el => ({
      id: el.id,
      x: el.position.x,
      y: el.position.y,
      width: el.size.width,
      height: el.size.height,
      rotation: el.rotation || 0,
    }))
    alignmentEngineRef.current?.updateElementIndex(elementsArray)
  }, [elements])
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElementIds: new Set(),
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  })
  
  const dragStateRef = useRef<DragState>(dragState)
  
  // Update ref whenever state changes
  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])
  
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  
  // Start dragging
  const startDrag = useCallback(
    (event: MouseEvent | React.MouseEvent, elementId?: string) => {
      const draggedIds = elementId
        ? selectedIds.has(elementId)
          ? selectedIds
          : new Set([elementId])
        : selectedIds
      
      if (draggedIds.size === 0) return
      
      // Store initial positions
      const initialPositions = new Map<string, { x: number; y: number }>()
      draggedIds.forEach((id) => {
        const element = elements.get(id)
        if (element) {
          initialPositions.set(id, { ...element.position })
        }
      })
      initialPositionsRef.current = initialPositions
      
      const startX = 'clientX' in event ? event.clientX : event.pageX
      const startY = 'clientY' in event ? event.clientY : event.pageY
      
      setDragState({
        isDragging: true,
        draggedElementIds: draggedIds,
        startPosition: { x: startX, y: startY },
        currentPosition: { x: startX, y: startY },
      })
      
      // 通知对齐系统开始拖拽
      if (enableAlignment && draggedIds.size === 1) {
        const elementId = Array.from(draggedIds)[0]
        alignment.startDragging(elementId)
      }
      
      onDragStart?.(draggedIds)
      
      // Prevent text selection during drag
      event.preventDefault()
    },
    [selectedIds, elements, onDragStart, enableAlignment, alignment]
  )
  
  // Handle drag move
  const handleDragMove = useCallback(
    (event: MouseEvent) => {
      const currentDragState = dragStateRef.current
      if (!currentDragState.isDragging) return
      
      const currentX = event.clientX
      const currentY = event.clientY
      
      const deltaX = currentX - currentDragState.startPosition.x
      const deltaY = currentY - currentDragState.startPosition.y
      
      // Update element positions
      const updates: Array<{ id: string; position: { x: number; y: number } }> = []
      
      // 如果启用对齐且只拖拽一个元素
      if (enableAlignment && currentDragState.draggedElementIds.size === 1) {
        const elementId = Array.from(currentDragState.draggedElementIds)[0]
        const element = elements.get(elementId)
        const initialPos = initialPositionsRef.current.get(elementId)
        
        if (element && initialPos) {
          const proposedPosition = {
            x: initialPos.x + deltaX,
            y: initialPos.y + deltaY,
          }
          
          // 使用增强的磁力对齐
          if (enableMagneticSnap && alignmentEngineRef.current) {
            const magneticResult = alignmentEngineRef.current.checkMagneticAlignment(
              {
                id: element.id,
                x: proposedPosition.x,
                y: proposedPosition.y,
                width: element.size.width,
                height: element.size.height,
                rotation: element.rotation || 0,
              },
              proposedPosition,
              alignment.staticGuides
            )
            
            if (magneticResult.aligned) {
              // 使用平滑的磁力位置
              updates.push({
                id: elementId,
                position: magneticResult.smoothPosition,
              })
              setDragState((prev) => ({
                ...prev,
                alignedPosition: magneticResult.smoothPosition,
              }))
            } else {
              updates.push({
                id: elementId,
                position: proposedPosition,
              })
            }
          } else {
            // 使用普通对齐
            const alignmentResult = alignment.checkDragAlignment(elementId, proposedPosition)
            
            if (alignmentResult.aligned) {
              updates.push({
                id: elementId,
                position: { x: alignmentResult.x, y: alignmentResult.y },
              })
              setDragState((prev) => ({
                ...prev,
                alignedPosition: { x: alignmentResult.x, y: alignmentResult.y },
              }))
            } else {
              updates.push({
                id: elementId,
                position: proposedPosition,
              })
            }
          }
        }
      } else {
        // 多选拖拽，暂时不应用对齐
        currentDragState.draggedElementIds.forEach((id) => {
          const initialPos = initialPositionsRef.current.get(id)
          if (!initialPos) return
          
          updates.push({
            id,
            position: {
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY,
            },
          })
        })
      }
      
      // 更新元素位置
      updates.forEach(({ id, position }) => {
        updateElement(id, { position })
      })
      
      setDragState((prev) => ({
        ...prev,
        currentPosition: { x: currentX, y: currentY },
      }))
      
      onDragMove?.(deltaX, deltaY)
    },
    [elements, updateElement, onDragMove, enableAlignment, enableMagneticSnap, alignment]
  )
  
  // End dragging
  const endDrag = useCallback(() => {
    const currentDragState = dragStateRef.current
    if (!currentDragState.isDragging) return
    
    const deltaX = currentDragState.currentPosition.x - currentDragState.startPosition.x
    const deltaY = currentDragState.currentPosition.y - currentDragState.startPosition.y
    
    // 通知对齐系统结束拖拽
    if (enableAlignment) {
      alignment.endDragging()
    }
    
    // History is automatically handled by the store when updating elements
    
    onDragEnd?.(currentDragState.draggedElementIds, deltaX, deltaY)
    
    setDragState({
      isDragging: false,
      draggedElementIds: new Set(),
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      alignedPosition: undefined,
    })
    
    initialPositionsRef.current.clear()
  }, [onDragEnd, enableAlignment, alignment])
  
  // Cancel dragging
  const cancelDrag = useCallback(() => {
    const currentDragState = dragStateRef.current
    if (!currentDragState.isDragging) return
    
    // 通知对齐系统结束拖拽
    if (enableAlignment) {
      alignment.endDragging()
    }
    
    // Restore initial positions
    const updates: Array<{ id: string; position: { x: number; y: number } }> = []
    
    currentDragState.draggedElementIds.forEach((id) => {
      const initialPos = initialPositionsRef.current.get(id)
      if (initialPos) {
        updates.push({ id, position: initialPos })
      }
    })
    
    // 恢复初始位置
    updates.forEach(({ id, position }) => {
      updateElement(id, { position })
    })
    
    setDragState({
      isDragging: false,
      draggedElementIds: new Set(),
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      alignedPosition: undefined,
    })
    
    initialPositionsRef.current.clear()
  }, [updateElement, enableAlignment, alignment])
  
  // Get drag offset for preview
  const getDragOffset = useCallback((): { x: number; y: number } => {
    if (!dragState.isDragging) return { x: 0, y: 0 }
    
    return {
      x: dragState.currentPosition.x - dragState.startPosition.x,
      y: dragState.currentPosition.y - dragState.startPosition.y,
    }
  }, [dragState])
  
  // Check if element is being dragged
  const isElementDragging = useCallback(
    (elementId: string): boolean => {
      return dragState.isDragging && dragState.draggedElementIds.has(elementId)
    },
    [dragState]
  )
  
  // Cleanup
  useEffect(() => {
    return () => {
      alignmentEngineRef.current?.dispose()
    }
  }, [])
  
  return {
    isDragging: dragState.isDragging,
    draggedElementIds: dragState.draggedElementIds,
    alignedPosition: dragState.alignedPosition,
    startDrag,
    handleDragMove,
    endDrag,
    cancelDrag,
    getDragOffset,
    isElementDragging,
    alignment, // Expose alignment for external use
  }
}