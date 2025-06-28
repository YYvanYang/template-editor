import React, { useEffect } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'
import { useElementSelection, useDragAndDrop, useResize, useRotation } from '../hooks'
import { SelectionOverlay } from './SelectionOverlay'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

/**
 * Example component demonstrating rotation functionality integration
 * This shows how to combine selection, drag & drop, resize, and rotation features
 */
export const RotatableCanvasExample: React.FC = () => {
  const { elements, addElement } = useEditorStore()
  
  // Initialize with some example elements
  useEffect(() => {
    const exampleElements: BaseElementData[] = [
      {
        id: 'text1',
        type: 'text',
        name: 'Rotatable Text',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 50 },
        rotation: 0,
      },
      {
        id: 'shape1',
        type: 'shape',
        name: 'Rotatable Rectangle',
        position: { x: 150, y: 200 },
        size: { width: 150, height: 100 },
        rotation: 45,
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
    isDragging,
  } = useDragAndDrop({
    snapToGrid: true,
    gridSize: 10,
  })
  
  // Resize hook
  const {
    startResize,
    isResizing,
  } = useResize({
    snapToGrid: true,
    gridSize: 10,
    minWidth: 30,
    minHeight: 30,
  })
  
  // Rotation hook
  const {
    startRotation,
    isRotating,
    currentAngle,
  } = useRotation({
    snapToAngles: false, // Will snap with shift key
  })
  
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
    
    // Only start drag if not clicking on a handle
    if (!isResizing && !isRotating) {
      startDrag(e.evt, elementId)
    }
  }
  
  const renderElement = (element: BaseElementData) => {
    const isSelected = selectedElementIds.has(element.id)
    
    // Apply rotation transform
    const rotation = element.rotation || 0
    
    return (
      <Group
        key={element.id}
        x={element.position.x + element.size.width / 2}
        y={element.position.y + element.size.height / 2}
        rotation={rotation}
        offsetX={element.size.width / 2}
        offsetY={element.size.height / 2}
      >
        {element.type === 'text' ? (
          <Text
            x={0}
            y={0}
            width={element.size.width}
            height={element.size.height}
            text={element.name}
            fontSize={16}
            fill={isSelected ? '#0969da' : '#000'}
            align="center"
            verticalAlign="middle"
            onClick={(e) => handleElementClick(element.id, e)}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            width={element.size.width}
            height={element.size.height}
            fill={isSelected ? '#e3f2fd' : '#f5f5f5'}
            stroke={isSelected ? '#0969da' : '#ccc'}
            strokeWidth={2}
            onClick={(e) => handleElementClick(element.id, e)}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
          />
        )}
      </Group>
    )
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
          
          {/* Selection overlay with resize and rotation handles */}
          {selectionBounds && selectedElementIds.size === 1 && (
            <SelectionOverlay
              selectionBounds={selectionBounds}
              elementId={Array.from(selectedElementIds)[0]}
              onResizeStart={startResize}
              onRotationStart={startRotation}
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
          <li>Drag the rotation handle (circle above) to rotate</li>
          <li>Hold Shift while rotating to snap to 15° increments</li>
          <li>Press Escape while rotating to cancel</li>
          <li>Click on empty space to clear selection</li>
        </ul>
        <p>
          Selected: {selectedElementIds.size} element(s)
          {isDragging && ' (Dragging...)'}
          {isResizing && ' (Resizing...)'}
          {isRotating && ` (Rotating: ${Math.round(currentAngle)}°)`}
        </p>
      </div>
    </div>
  )
}