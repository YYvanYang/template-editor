import { useCallback, useRef, useState } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

export interface DragState {
  isDragging: boolean
  draggedElementIds: Set<string>
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
}

export interface UseDragAndDropOptions {
  onDragStart?: (elementIds: Set<string>) => void
  onDragMove?: (deltaX: number, deltaY: number) => void
  onDragEnd?: (elementIds: Set<string>, deltaX: number, deltaY: number) => void
  snapToGrid?: boolean
  gridSize?: number
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    snapToGrid = false,
    gridSize = 10,
  } = options
  
  const {
    elements,
    selectedElementIds,
    updateElements,
    addHistoryEntry,
  } = useEditorStore()
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElementIds: new Set(),
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  })
  
  const dragStateRef = useRef<DragState>(dragState)
  dragStateRef.current = dragState
  
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  
  // Snap position to grid
  const snapPosition = useCallback(
    (position: number): number => {
      if (!snapToGrid) return position
      return Math.round(position / gridSize) * gridSize
    },
    [snapToGrid, gridSize]
  )
  
  // Start dragging
  const startDrag = useCallback(
    (event: MouseEvent | React.MouseEvent, elementId?: string) => {
      const draggedIds = elementId
        ? selectedElementIds.has(elementId)
          ? selectedElementIds
          : new Set([elementId])
        : selectedElementIds
      
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
      
      onDragStart?.(draggedIds)
      
      // Prevent text selection during drag
      event.preventDefault()
    },
    [selectedElementIds, elements, onDragStart]
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
      
      currentDragState.draggedElementIds.forEach((id) => {
        const initialPos = initialPositionsRef.current.get(id)
        if (!initialPos) return
        
        const newX = snapPosition(initialPos.x + deltaX)
        const newY = snapPosition(initialPos.y + deltaY)
        
        updates.push({
          id,
          position: { x: newX, y: newY },
        })
      })
      
      if (updates.length > 0) {
        updateElements(updates)
      }
      
      setDragState((prev) => ({
        ...prev,
        currentPosition: { x: currentX, y: currentY },
      }))
      
      onDragMove?.(deltaX, deltaY)
    },
    [snapPosition, updateElements, onDragMove]
  )
  
  // End dragging
  const endDrag = useCallback(() => {
    const currentDragState = dragStateRef.current
    if (!currentDragState.isDragging) return
    
    const deltaX = currentDragState.currentPosition.x - currentDragState.startPosition.x
    const deltaY = currentDragState.currentPosition.y - currentDragState.startPosition.y
    
    // Add to history if elements were moved
    if (deltaX !== 0 || deltaY !== 0) {
      addHistoryEntry()
    }
    
    onDragEnd?.(currentDragState.draggedElementIds, deltaX, deltaY)
    
    setDragState({
      isDragging: false,
      draggedElementIds: new Set(),
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })
    
    initialPositionsRef.current.clear()
  }, [addHistoryEntry, onDragEnd])
  
  // Cancel dragging
  const cancelDrag = useCallback(() => {
    const currentDragState = dragStateRef.current
    if (!currentDragState.isDragging) return
    
    // Restore initial positions
    const updates: Array<{ id: string; position: { x: number; y: number } }> = []
    
    currentDragState.draggedElementIds.forEach((id) => {
      const initialPos = initialPositionsRef.current.get(id)
      if (initialPos) {
        updates.push({ id, position: initialPos })
      }
    })
    
    if (updates.length > 0) {
      updateElements(updates)
    }
    
    setDragState({
      isDragging: false,
      draggedElementIds: new Set(),
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })
    
    initialPositionsRef.current.clear()
  }, [updateElements])
  
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
  
  return {
    isDragging: dragState.isDragging,
    draggedElementIds: dragState.draggedElementIds,
    startDrag,
    handleDragMove,
    endDrag,
    cancelDrag,
    getDragOffset,
    isElementDragging,
  }
}