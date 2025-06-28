import { useEffect, useCallback, RefObject } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type Konva from 'konva'

export const useCanvasEvents = (stageRef: RefObject<Konva.Stage>) => {
  const { setZoom, setOffset } = useEditorStore()

  // 处理键盘快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 空格键 + 拖拽 = 平移画布
    if (e.code === 'Space') {
      e.preventDefault()
      const stage = stageRef.current
      if (stage) {
        stage.container().style.cursor = 'grab'
      }
    }
    
    // Ctrl/Cmd + 0 = 重置缩放
    if ((e.ctrlKey || e.metaKey) && e.code === 'Digit0') {
      e.preventDefault()
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    
    // Ctrl/Cmd + = 放大
    if ((e.ctrlKey || e.metaKey) && e.code === 'Equal') {
      e.preventDefault()
      const currentZoom = useEditorStore.getState().canvas.zoom
      setZoom(Math.min(5, currentZoom * 1.2))
    }
    
    // Ctrl/Cmd + - 缩小
    if ((e.ctrlKey || e.metaKey) && e.code === 'Minus') {
      e.preventDefault()
      const currentZoom = useEditorStore.getState().canvas.zoom
      setZoom(Math.max(0.1, currentZoom / 1.2))
    }
  }, [setZoom, setOffset, stageRef])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      const stage = stageRef.current
      if (stage) {
        stage.container().style.cursor = 'default'
      }
    }
  }, [stageRef])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])
}