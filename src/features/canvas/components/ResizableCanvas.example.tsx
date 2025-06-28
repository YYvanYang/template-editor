import React, { useEffect } from 'react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import { useElementSelection, useDragAndDrop, useResize } from '../hooks'
import { SelectionOverlay } from './SelectionOverlay'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

/**
 * Example component demonstrating resize functionality integration
 * This shows how to combine selection, drag & drop, and resize features
 */
export const ResizableCanvasExample: React.FC = () => {
  const { elements, addElement } = useEditorStore()
  
  // Initialize with some example elements
  useEffect(() => {
    const exampleElements: BaseElementData[] = [
      {
        id: 'text1',
        type: 'text',
        name: 'Text Element',
        position: { x: 50, y: 50 },
        size: { width: 200, height: 50 },
      },
      {
        id: 'shape1',
        type: 'shape',
        name: 'Rectangle',
        position: { x: 100, y: 150 },
        size: { width: 150, height: 100 },
      },
    ]
    
    exampleElements.forEach(element => {
      addElement(element)
    })
  }, [addElement])
  
  // Selection hook
  const {
    selectedElementIds,
    selectionBounds,
    selectElement,
    clearSelection,
  } = useElementSelection()
  
  // Drag & Drop hook
  const {
    startDrag,
    handleDragMove,
    endDrag,
    isDragging,
  } = useDragAndDrop({
    snapToGrid: true,
    gridSize: 10,
  })
  
  // Resize hook
  const {
    startResize,
    handleResizeMove,
    endResize,
    isResizing,
  } = useResize({
    snapToGrid: true,
    gridSize: 10,
    minWidth: 30,
    minHeight: 30,
  })
  
  // Set up global mouse event listeners for drag and resize
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e)
      const handleMouseUp = () => endDrag()
      
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleDragMove, endDrag])
  
  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e)
      const handleMouseUp = () => endResize()
      
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleResizeMove, endResize])
  
  const handleStageClick = (e: any) => {
    // Clear selection when clicking on empty space
    if (e.target === e.target.getStage()) {
      clearSelection()
    }
  }
  
  const handleElementClick = (elementId: string, e: any) => {
    e.cancelBubble = true
    selectElement(elementId)
  }
  
  const handleElementMouseDown = (elementId: string, e: any) => {
    e.cancelBubble = true
    selectElement(elementId)
    startDrag(e.evt, elementId)
  }
  
  const renderElement = (element: BaseElementData) => {
    const isSelected = selectedElementIds.has(element.id)
    
    if (element.type === 'text') {
      return (
        <Text
          key={element.id}
          x={element.position.x}
          y={element.position.y}
          width={element.size.width}
          height={element.size.height}
          text={element.name}
          fontSize={16}
          fill={isSelected ? '#0969da' : '#000'}
          onClick={(e) => handleElementClick(element.id, e)}
          onMouseDown={(e) => handleElementMouseDown(element.id, e)}
        />
      )
    } else if (element.type === 'shape') {
      return (
        <Rect
          key={element.id}
          x={element.position.x}
          y={element.position.y}
          width={element.size.width}
          height={element.size.height}
          fill={isSelected ? '#e3f2fd' : '#f5f5f5'}
          stroke={isSelected ? '#0969da' : '#ccc'}
          strokeWidth={2}
          onClick={(e) => handleElementClick(element.id, e)}
          onMouseDown={(e) => handleElementMouseDown(element.id, e)}
        />
      )
    }
    
    return null
  }
  
  return (
    <div style={{ border: '1px solid #ccc' }}>
      <Stage
        width={800}
        height={600}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Render all elements */}
          {Array.from(elements.values()).map(renderElement)}
          
          {/* Selection overlay with resize handles */}
          {selectionBounds && selectedElementIds.size === 1 && (
            <SelectionOverlay
              selectionBounds={selectionBounds}
              elementId={Array.from(selectedElementIds)[0]}
              onResizeStart={startResize}
            />
          )}
        </Layer>
      </Stage>
      
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5' }}>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul>
          <li>Click on an element to select it</li>
          <li>Drag selected elements to move them</li>
          <li>Drag the resize handles to resize elements</li>
          <li>Hold Ctrl/Cmd for multi-selection (drag only)</li>
          <li>Click on empty space to clear selection</li>
        </ul>
        <p>
          Selected: {selectedElementIds.size} element(s)
          {isDragging && ' (Dragging...)'}
          {isResizing && ' (Resizing...)'}
        </p>
      </div>
    </div>
  )
}