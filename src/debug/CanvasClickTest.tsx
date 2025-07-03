import React, { useState } from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'

export const CanvasClickTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([])
  const { activeTool, elements, selectedIds } = useEditorStore()
  
  // Monitor store changes
  React.useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(
      (state) => ({ elements: state.elements, activeTool: state.activeTool }),
      (curr, prev) => {
        if (curr.elements.size !== prev.elements.size) {
          const newLog = `Elements count changed: ${prev.elements.size} → ${curr.elements.size}`
          setLogs(logs => [...logs.slice(-9), newLog])
        }
        if (curr.activeTool !== prev.activeTool) {
          const newLog = `Active tool changed: ${prev.activeTool} → ${curr.activeTool}`
          setLogs(logs => [...logs.slice(-9), newLog])
        }
      }
    )
    
    return unsubscribe
  }, [])
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg max-w-md">
      <h3 className="font-bold mb-2">Canvas Debug Info</h3>
      <div className="space-y-1 text-sm">
        <div>Active Tool: <span className="font-mono">{activeTool}</span></div>
        <div>Elements: {elements.size}</div>
        <div>Selected: {selectedIds.size}</div>
        
        <div className="mt-2">
          <h4 className="font-semibold">Recent Events:</h4>
          <div className="mt-1 space-y-1 text-xs">
            {logs.map((log, i) => (
              <div key={i} className="font-mono text-gray-600">{log}</div>
            ))}
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="font-semibold">Elements:</h4>
          <div className="mt-1 space-y-1 text-xs max-h-40 overflow-y-auto">
            {Array.from(elements.values()).map((el) => (
              <div key={el.id} className="font-mono text-gray-600">
                {el.id}: {el.type} at ({el.position.x.toFixed(0)}, {el.position.y.toFixed(0)})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}