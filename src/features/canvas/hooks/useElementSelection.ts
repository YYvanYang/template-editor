import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { BaseElementData } from '@/features/elements'

export interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface UseElementSelectionOptions {
  onSelectionChange?: (selectedIds: Set<string>) => void
  multiSelect?: boolean
}

export function useElementSelection(options: UseElementSelectionOptions = {}) {
  const { multiSelect = true, onSelectionChange } = options
  
  const {
    elements,
    selectedElementIds,
    selectElement,
    selectElements,
    clearSelection,
    toggleElementSelection,
  } = useEditorStore()
  
  const selectionRef = useRef<Set<string>>(new Set())
  
  // Update ref when selection changes
  useEffect(() => {
    selectionRef.current = selectedElementIds
    onSelectionChange?.(selectedElementIds)
  }, [selectedElementIds, onSelectionChange])
  
  // Handle element click
  const handleElementClick = useCallback(
    (elementId: string, event?: MouseEvent | React.MouseEvent) => {
      const isMultiSelectKey = event && (event.ctrlKey || event.metaKey)
      
      if (multiSelect && isMultiSelectKey) {
        toggleElementSelection(elementId)
      } else if (selectedElementIds.has(elementId) && selectedElementIds.size === 1) {
        // Already selected, do nothing
        return
      } else {
        selectElement(elementId)
      }
    },
    [multiSelect, selectedElementIds, toggleElementSelection, selectElement]
  )
  
  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      // Check if click is on canvas background
      const target = event.target as HTMLElement
      if (target.classList.contains('canvas-background') || target.tagName === 'CANVAS') {
        clearSelection()
      }
    },
    [clearSelection]
  )
  
  // Handle selection box
  const handleSelectionBox = useCallback(
    (selectionBox: SelectionBox) => {
      const elementsInBox = new Set<string>()
      
      elements.forEach((element) => {
        if (isElementInSelectionBox(element, selectionBox)) {
          elementsInBox.add(element.id)
        }
      })
      
      if (elementsInBox.size > 0) {
        selectElements(elementsInBox)
      } else {
        clearSelection()
      }
    },
    [elements, selectElements, clearSelection]
  )
  
  // Check if element is in selection box
  const isElementInSelectionBox = (
    element: BaseElementData,
    box: SelectionBox
  ): boolean => {
    const elementBounds = {
      left: element.position.x,
      top: element.position.y,
      right: element.position.x + element.size.width,
      bottom: element.position.y + element.size.height,
    }
    
    const boxBounds = {
      left: Math.min(box.x, box.x + box.width),
      top: Math.min(box.y, box.y + box.height),
      right: Math.max(box.x, box.x + box.width),
      bottom: Math.max(box.y, box.y + box.height),
    }
    
    // Check if element intersects with selection box
    return !(
      elementBounds.right < boxBounds.left ||
      elementBounds.left > boxBounds.right ||
      elementBounds.bottom < boxBounds.top ||
      elementBounds.top > boxBounds.bottom
    )
  }
  
  // Get selection bounds
  const getSelectionBounds = useCallback((): SelectionBox | null => {
    if (selectedElementIds.size === 0) return null
    
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    selectedElementIds.forEach((id) => {
      const element = elements.get(id)
      if (!element) return
      
      const left = element.position.x
      const top = element.position.y
      const right = left + element.size.width
      const bottom = top + element.size.height
      
      minX = Math.min(minX, left)
      minY = Math.min(minY, top)
      maxX = Math.max(maxX, right)
      maxY = Math.max(maxY, bottom)
    })
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }, [selectedElementIds, elements])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Select all (Ctrl/Cmd + A)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault()
        const allIds = new Set(elements.keys())
        selectElements(allIds)
      }
      
      // Deselect all (Escape)
      if (event.key === 'Escape') {
        clearSelection()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [elements, selectElements, clearSelection])
  
  return {
    selectedElementIds,
    handleElementClick,
    handleCanvasClick,
    handleSelectionBox,
    getSelectionBounds,
    clearSelection,
  }
}