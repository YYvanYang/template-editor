import { useCallback } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { ToolType } from '@/features/toolbar/types/toolbar.types'
import {
  createTextElement,
  createRectangleElement,
  createImageElement,
  createBarcodeElement,
  createTableElement,
} from '@/features/elements/utils/element-factories'

export function useElementCreation() {
  const { activeTool, addElement, setActiveTool, clearSelection } = useEditorStore()

  const handleCanvasClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // Only create elements if a creation tool is active
      if (activeTool === ToolType.SELECT || activeTool === ToolType.HAND) {
        return
      }

      // Get click position
      const stage = e.target.getStage()
      const pos = stage?.getPointerPosition()
      
      if (!pos) {
        return
      }

      // Clear current selection before creating new element
      clearSelection()

      // Create element based on active tool
      let newElement = null
      
      switch (activeTool) {
        case ToolType.TEXT:
          newElement = createTextElement(pos)
          break
        case ToolType.SHAPE:
          newElement = createRectangleElement(pos)
          break
        case ToolType.IMAGE:
          newElement = createImageElement(pos)
          break
        case ToolType.BARCODE:
          newElement = createBarcodeElement(pos)
          break
        case ToolType.TABLE:
          newElement = createTableElement(pos)
          break
        default:
          return
      }

      if (newElement) {
        // Add element to store with auto-select
        addElement(newElement, { autoSelect: true })
        
        // Switch back to select tool
        setActiveTool(ToolType.SELECT)
      }
    },
    [activeTool, addElement, setActiveTool, clearSelection]
  )

  return {
    handleCanvasClick,
  }
}