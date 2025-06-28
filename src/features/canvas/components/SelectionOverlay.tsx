import React from 'react'
import { Group, Rect, Circle } from 'react-konva'
import type { SelectionBox } from '../hooks/useElementSelection'
import type { ResizeHandle } from '../hooks/useResize'

export interface SelectionOverlayProps {
  selectionBounds: SelectionBox | null
  visible?: boolean
  onResizeStart?: (elementId: string, handle: ResizeHandle, event: MouseEvent) => void
  onRotationStart?: (elementId: string, event: MouseEvent) => void
  elementId?: string
  showRotationHandle?: boolean
}

const HANDLE_SIZE = 8
const ROTATION_HANDLE_OFFSET = 20
const SELECTION_COLOR = '#0969da'
const HANDLE_COLOR = '#ffffff'
const HANDLE_STROKE = '#0969da'

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectionBounds,
  visible = true,
  onResizeStart,
  onRotationStart,
  elementId,
  showRotationHandle = true,
}) => {
  if (!selectionBounds || !visible) return null

  const { x, y, width, height } = selectionBounds

  // Calculate handle positions
  const handles: Array<{ handle: ResizeHandle; x: number; y: number }> = [
    { handle: 'nw', x: x, y: y },
    { handle: 'n', x: x + width / 2, y: y },
    { handle: 'ne', x: x + width, y: y },
    { handle: 'e', x: x + width, y: y + height / 2 },
    { handle: 'se', x: x + width, y: y + height },
    { handle: 's', x: x + width / 2, y: y + height },
    { handle: 'sw', x: x, y: y + height },
    { handle: 'w', x: x, y: y + height / 2 },
  ]

  // Rotation handle position
  const rotationHandleX = x + width / 2
  const rotationHandleY = y - ROTATION_HANDLE_OFFSET

  const handleResizeMouseDown = (handle: ResizeHandle) => (e: any) => {
    e.cancelBubble = true
    if (!onResizeStart || !elementId) return

    // Convert Konva event to MouseEvent-like object
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: e.evt.clientX,
      clientY: e.evt.clientY,
      bubbles: true,
    })
    
    onResizeStart(elementId, handle, mouseEvent)
  }

  const handleRotationMouseDown = (e: any) => {
    e.cancelBubble = true
    if (!onRotationStart || !elementId) return

    // Convert Konva event to MouseEvent-like object
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: e.evt.clientX,
      clientY: e.evt.clientY,
      bubbles: true,
    })
    
    onRotationStart(elementId, mouseEvent)
  }

  const getCursor = (handle: ResizeHandle): string => {
    const cursors: Record<ResizeHandle, string> = {
      nw: 'nw-resize',
      n: 'n-resize',
      ne: 'ne-resize',
      e: 'e-resize',
      se: 'se-resize',
      s: 's-resize',
      sw: 'sw-resize',
      w: 'w-resize',
    }
    return cursors[handle]
  }

  return (
    <Group>
      {/* Selection border */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={SELECTION_COLOR}
        strokeWidth={1}
        fill="transparent"
        dash={[5, 5]}
        listening={false}
      />

      {/* Resize handles */}
      {handles.map(({ handle, x: hx, y: hy }) => (
        <Rect
          key={handle}
          x={hx - HANDLE_SIZE / 2}
          y={hy - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill={HANDLE_COLOR}
          stroke={HANDLE_STROKE}
          strokeWidth={1}
          onMouseDown={handleResizeMouseDown(handle)}
          onMouseEnter={(e) => {
            const stage = e.target.getStage()
            if (stage) {
              stage.container().style.cursor = getCursor(handle)
            }
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage()
            if (stage) {
              stage.container().style.cursor = 'default'
            }
          }}
        />
      ))}

      {/* Rotation handle */}
      {showRotationHandle && onRotationStart && (
        <>
          {/* Line connecting to rotation handle */}
          <Rect
            x={x + width / 2 - 0.5}
            y={y - ROTATION_HANDLE_OFFSET}
            width={1}
            height={ROTATION_HANDLE_OFFSET}
            fill={SELECTION_COLOR}
            listening={false}
          />
          
          {/* Rotation handle circle */}
          <Circle
            x={rotationHandleX}
            y={rotationHandleY}
            radius={HANDLE_SIZE / 2}
            fill={HANDLE_COLOR}
            stroke={HANDLE_STROKE}
            strokeWidth={1}
            onMouseDown={handleRotationMouseDown}
            onMouseEnter={(e) => {
              const stage = e.target.getStage()
              if (stage) {
                stage.container().style.cursor = 'grab'
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage()
              if (stage) {
                stage.container().style.cursor = 'default'
              }
            }}
          />
        </>
      )}
    </Group>
  )
}