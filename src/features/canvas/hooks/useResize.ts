import { useCallback, useRef, useState, useEffect } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface ResizeState {
  isResizing: boolean
  resizingElementId: string | null
  resizeHandle: ResizeHandle | null
  startPosition: { x: number; y: number }
  startSize: { width: number; height: number }
  startElementPosition: { x: number; y: number }
}

export interface UseResizeOptions {
  onResizeStart?: (elementId: string, handle: ResizeHandle) => void
  onResizeMove?: (elementId: string, newSize: { width: number; height: number }) => void
  onResizeEnd?: (elementId: string, newSize: { width: number; height: number }) => void
  snapToGrid?: boolean
  gridSize?: number
  minWidth?: number
  minHeight?: number
  maintainAspectRatio?: boolean
}

export function useResize(options: UseResizeOptions = {}) {
  const {
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    snapToGrid = false,
    gridSize = 10,
    minWidth = 20,
    minHeight = 20,
    maintainAspectRatio = false,
  } = options
  
  const {
    elements,
    updateElements,
    addHistoryEntry,
  } = useEditorStore()
  
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizingElementId: null,
    resizeHandle: null,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    startElementPosition: { x: 0, y: 0 },
  })
  
  const resizeStateRef = useRef<ResizeState>(resizeState)
  resizeStateRef.current = resizeState
  
  const initialStateRef = useRef<{
    size: { width: number; height: number }
    position: { x: number; y: number }
  } | null>(null)
  
  // Snap value to grid
  const snapValue = useCallback(
    (value: number): number => {
      if (!snapToGrid) return value
      return Math.round(value / gridSize) * gridSize
    },
    [snapToGrid, gridSize]
  )
  
  // Calculate new size based on handle and mouse position
  const calculateNewSize = useCallback(
    (
      handle: ResizeHandle,
      deltaX: number,
      deltaY: number,
      startSize: { width: number; height: number },
      startPosition: { x: number; y: number }
    ): { size: { width: number; height: number }; position?: { x: number; y: number } } => {
      let newWidth = startSize.width
      let newHeight = startSize.height
      let newX = startPosition.x
      let newY = startPosition.y
      
      // Calculate size changes based on handle
      switch (handle) {
        case 'e':
          newWidth = startSize.width + deltaX
          break
        case 'w':
          newWidth = startSize.width - deltaX
          newX = startPosition.x + deltaX
          break
        case 's':
          newHeight = startSize.height + deltaY
          break
        case 'n':
          newHeight = startSize.height - deltaY
          newY = startPosition.y + deltaY
          break
        case 'se':
          newWidth = startSize.width + deltaX
          newHeight = startSize.height + deltaY
          break
        case 'sw':
          newWidth = startSize.width - deltaX
          newHeight = startSize.height + deltaY
          newX = startPosition.x + deltaX
          break
        case 'ne':
          newWidth = startSize.width + deltaX
          newHeight = startSize.height - deltaY
          newY = startPosition.y + deltaY
          break
        case 'nw':
          newWidth = startSize.width - deltaX
          newHeight = startSize.height - deltaY
          newX = startPosition.x + deltaX
          newY = startPosition.y + deltaY
          break
      }
      
      // Apply aspect ratio if needed
      if (maintainAspectRatio && startSize.width > 0 && startSize.height > 0) {
        const aspectRatio = startSize.width / startSize.height
        
        // For corner handles, maintain aspect ratio based on larger dimension change
        if (['nw', 'ne', 'sw', 'se'].includes(handle)) {
          const widthChange = Math.abs(newWidth - startSize.width)
          const heightChange = Math.abs(newHeight - startSize.height)
          
          if (widthChange > heightChange) {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }
        }
      }
      
      // Apply minimum size constraints
      newWidth = Math.max(minWidth, snapValue(newWidth))
      newHeight = Math.max(minHeight, snapValue(newHeight))
      
      // Adjust position if resizing from left/top edges
      if (handle.includes('w')) {
        newX = startPosition.x + startSize.width - newWidth
      }
      if (handle.includes('n')) {
        newY = startPosition.y + startSize.height - newHeight
      }
      
      // Snap position to grid
      newX = snapValue(newX)
      newY = snapValue(newY)
      
      const result: { size: { width: number; height: number }; position?: { x: number; y: number } } = {
        size: { width: newWidth, height: newHeight },
      }
      
      // Only include position if it changed
      if (newX !== startPosition.x || newY !== startPosition.y) {
        result.position = { x: newX, y: newY }
      }
      
      return result
    },
    [snapValue, minWidth, minHeight, maintainAspectRatio]
  )
  
  // Start resizing
  const startResize = useCallback(
    (elementId: string, handle: ResizeHandle, event: MouseEvent | React.MouseEvent) => {
      const element = elements.get(elementId)
      if (!element) return
      
      initialStateRef.current = {
        size: { ...element.size },
        position: { ...element.position },
      }
      
      const startX = 'clientX' in event ? event.clientX : event.pageX
      const startY = 'clientY' in event ? event.clientY : event.pageY
      
      setResizeState({
        isResizing: true,
        resizingElementId: elementId,
        resizeHandle: handle,
        startPosition: { x: startX, y: startY },
        startSize: { ...element.size },
        startElementPosition: { ...element.position },
      })
      
      onResizeStart?.(elementId, handle)
      
      // Prevent text selection during resize
      event.preventDefault()
    },
    [elements, onResizeStart]
  )
  
  // Handle resize move
  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      const currentResizeState = resizeStateRef.current
      if (!currentResizeState.isResizing || !currentResizeState.resizingElementId || !currentResizeState.resizeHandle) {
        return
      }
      
      const currentX = event.clientX
      const currentY = event.clientY
      
      const deltaX = currentX - currentResizeState.startPosition.x
      const deltaY = currentY - currentResizeState.startPosition.y
      
      const { size, position } = calculateNewSize(
        currentResizeState.resizeHandle,
        deltaX,
        deltaY,
        currentResizeState.startSize,
        currentResizeState.startElementPosition
      )
      
      const update: any = {
        id: currentResizeState.resizingElementId,
        size,
      }
      
      if (position) {
        update.position = position
      }
      
      updateElements([update])
      onResizeMove?.(currentResizeState.resizingElementId, size)
    },
    [calculateNewSize, updateElements, onResizeMove]
  )
  
  // End resizing
  const endResize = useCallback(() => {
    const currentResizeState = resizeStateRef.current
    if (!currentResizeState.isResizing || !currentResizeState.resizingElementId) return
    
    const element = elements.get(currentResizeState.resizingElementId)
    if (!element || !initialStateRef.current) return
    
    // Check if size or position changed
    const sizeChanged = 
      element.size.width !== initialStateRef.current.size.width ||
      element.size.height !== initialStateRef.current.size.height
    const positionChanged =
      element.position.x !== initialStateRef.current.position.x ||
      element.position.y !== initialStateRef.current.position.y
    
    if (sizeChanged || positionChanged) {
      addHistoryEntry()
      onResizeEnd?.(currentResizeState.resizingElementId, element.size)
    }
    
    setResizeState({
      isResizing: false,
      resizingElementId: null,
      resizeHandle: null,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 },
      startElementPosition: { x: 0, y: 0 },
    })
    
    initialStateRef.current = null
  }, [elements, addHistoryEntry, onResizeEnd])
  
  // Cancel resizing
  const cancelResize = useCallback(() => {
    const currentResizeState = resizeStateRef.current
    if (!currentResizeState.isResizing || !currentResizeState.resizingElementId || !initialStateRef.current) {
      return
    }
    
    // Restore original size and position
    updateElements([{
      id: currentResizeState.resizingElementId,
      size: initialStateRef.current.size,
      position: initialStateRef.current.position,
    }])
    
    setResizeState({
      isResizing: false,
      resizingElementId: null,
      resizeHandle: null,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 },
      startElementPosition: { x: 0, y: 0 },
    })
    
    initialStateRef.current = null
  }, [updateElements])
  
  // Set up global mouse event listeners
  useEffect(() => {
    const currentResizeState = resizeStateRef.current
    if (!currentResizeState.isResizing) return
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleResizeMove(e)
    }
    
    const handleGlobalMouseUp = () => {
      endResize()
    }
    
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [resizeState.isResizing, handleResizeMove, endResize])
  
  return {
    isResizing: resizeState.isResizing,
    resizingElementId: resizeState.resizingElementId,
    resizeHandle: resizeState.resizeHandle,
    startResize,
    handleResizeMove,
    endResize,
    cancelResize,
  }
}