import { useCallback, useRef, useState, useEffect } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'

export interface RotationState {
  isRotating: boolean
  rotatingElementId: string | null
  startAngle: number
  currentAngle: number
  elementCenter: { x: number; y: number }
}

export interface UseRotationOptions {
  onRotationStart?: (elementId: string) => void
  onRotationMove?: (elementId: string, angle: number) => void
  onRotationEnd?: (elementId: string, angle: number) => void
  snapToAngles?: boolean
  snapAngle?: number // Default 45 degrees
}

export function useRotation(options: UseRotationOptions = {}) {
  const {
    onRotationStart,
    onRotationMove,
    onRotationEnd,
    snapToAngles = false,
    snapAngle = 45,
  } = options
  
  const {
    elements,
    updateElements,
    addHistoryEntry,
  } = useEditorStore()
  
  const [rotationState, setRotationState] = useState<RotationState>({
    isRotating: false,
    rotatingElementId: null,
    startAngle: 0,
    currentAngle: 0,
    elementCenter: { x: 0, y: 0 },
  })
  
  const rotationStateRef = useRef<RotationState>(rotationState)
  
  // Update ref whenever state changes
  useEffect(() => {
    rotationStateRef.current = rotationState
  }, [rotationState])
  
  const initialRotationRef = useRef<number>(0)
  
  // Calculate angle between two points
  const getAngleBetweenPoints = useCallback(
    (center: { x: number; y: number }, point: { x: number; y: number }): number => {
      const dx = point.x - center.x
      const dy = center.y - point.y // Invert Y because canvas Y grows downward
      const radians = Math.atan2(dy, dx)
      const degrees = radians * (180 / Math.PI)
      return degrees
    },
    []
  )
  
  // Normalize angle to -180 to 180 range
  const normalizeAngle = useCallback((angle: number): number => {
    while (angle > 180) angle -= 360
    while (angle < -180) angle += 360
    return angle
  }, [])
  
  // Snap angle to nearest increment
  const snapAngleToIncrement = useCallback(
    (angle: number, increment: number): number => {
      return Math.round(angle / increment) * increment
    },
    []
  )
  
  // Start rotation
  const startRotation = useCallback(
    (elementId: string, event: MouseEvent | React.MouseEvent) => {
      const element = elements.get(elementId)
      if (!element) return
      
      // Calculate element center
      const centerX = element.position.x + element.size.width / 2
      const centerY = element.position.y + element.size.height / 2
      const elementCenter = { x: centerX, y: centerY }
      
      // Calculate starting angle
      const mouseX = 'clientX' in event ? event.clientX : event.pageX
      const mouseY = 'clientY' in event ? event.clientY : event.pageY
      const startAngle = getAngleBetweenPoints(elementCenter, { x: mouseX, y: mouseY })
      
      // Store initial rotation
      initialRotationRef.current = element.rotation || 0
      
      setRotationState({
        isRotating: true,
        rotatingElementId: elementId,
        startAngle,
        currentAngle: element.rotation || 0,
        elementCenter,
      })
      
      onRotationStart?.(elementId)
      
      // Prevent text selection during rotation
      event.preventDefault()
    },
    [elements, getAngleBetweenPoints, onRotationStart]
  )
  
  // Handle rotation move
  const handleRotationMove = useCallback(
    (event: MouseEvent) => {
      const currentRotationState = rotationStateRef.current
      if (!currentRotationState.isRotating || !currentRotationState.rotatingElementId) {
        return
      }
      
      const mouseX = event.clientX
      const mouseY = event.clientY
      
      // Calculate current angle
      const currentMouseAngle = getAngleBetweenPoints(
        currentRotationState.elementCenter,
        { x: mouseX, y: mouseY }
      )
      
      // Calculate rotation delta
      let deltaAngle = currentMouseAngle - currentRotationState.startAngle
      deltaAngle = normalizeAngle(deltaAngle)
      
      // Calculate new rotation
      let newRotation = initialRotationRef.current + deltaAngle
      
      // Apply snapping
      if (snapToAngles || event.shiftKey) {
        const snapIncrement = event.shiftKey ? 15 : snapAngle
        newRotation = snapAngleToIncrement(newRotation, snapIncrement)
      }
      
      // Normalize to -180 to 180 range
      newRotation = normalizeAngle(newRotation)
      
      // Update element
      updateElements([{
        id: currentRotationState.rotatingElementId,
        rotation: newRotation,
      }])
      
      setRotationState(prev => ({
        ...prev,
        currentAngle: newRotation,
      }))
      
      onRotationMove?.(currentRotationState.rotatingElementId, newRotation)
    },
    [
      getAngleBetweenPoints,
      normalizeAngle,
      snapToAngles,
      snapAngle,
      snapAngleToIncrement,
      updateElements,
      onRotationMove,
    ]
  )
  
  // End rotation
  const endRotation = useCallback(() => {
    const currentRotationState = rotationStateRef.current
    if (!currentRotationState.isRotating || !currentRotationState.rotatingElementId) return
    
    const element = elements.get(currentRotationState.rotatingElementId)
    if (!element) return
    
    // Check if rotation changed
    const rotationChanged = (element.rotation || 0) !== initialRotationRef.current
    
    if (rotationChanged) {
      addHistoryEntry()
      onRotationEnd?.(currentRotationState.rotatingElementId, element.rotation || 0)
    }
    
    setRotationState({
      isRotating: false,
      rotatingElementId: null,
      startAngle: 0,
      currentAngle: 0,
      elementCenter: { x: 0, y: 0 },
    })
    
    initialRotationRef.current = 0
  }, [elements, addHistoryEntry, onRotationEnd])
  
  // Cancel rotation
  const cancelRotation = useCallback(() => {
    const currentRotationState = rotationStateRef.current
    if (!currentRotationState.isRotating || !currentRotationState.rotatingElementId) {
      return
    }
    
    // Restore original rotation
    updateElements([{
      id: currentRotationState.rotatingElementId,
      rotation: initialRotationRef.current,
    }])
    
    setRotationState({
      isRotating: false,
      rotatingElementId: null,
      startAngle: 0,
      currentAngle: 0,
      elementCenter: { x: 0, y: 0 },
    })
    
    initialRotationRef.current = 0
  }, [updateElements])
  
  // Set up global mouse event listeners
  useEffect(() => {
    const currentRotationState = rotationStateRef.current
    if (!currentRotationState.isRotating) return
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleRotationMove(e)
    }
    
    const handleGlobalMouseUp = () => {
      endRotation()
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelRotation()
      }
    }
    
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('keydown', handleEscape)
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [rotationState.isRotating, handleRotationMove, endRotation, cancelRotation])
  
  return {
    isRotating: rotationState.isRotating,
    rotatingElementId: rotationState.rotatingElementId,
    currentAngle: rotationState.currentAngle,
    startRotation,
    handleRotationMove,
    endRotation,
    cancelRotation,
    getAngleBetweenPoints,
    normalizeAngle,
  }
}