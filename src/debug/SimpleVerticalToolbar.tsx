import React from 'react'
import { MousePointer2, Hand, Type, Square } from 'lucide-react'

export const SimpleVerticalToolbar: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-14 h-full py-2 bg-gray-100 border-r border-gray-300">
      <div className="text-xs text-gray-600 mb-2">工具</div>
      
      <button className="w-10 h-10 mb-1 rounded bg-white border hover:bg-gray-50 flex items-center justify-center">
        <MousePointer2 className="w-4 h-4" />
      </button>
      
      <button className="w-10 h-10 mb-1 rounded bg-white border hover:bg-gray-50 flex items-center justify-center">
        <Hand className="w-4 h-4" />
      </button>
      
      <button className="w-10 h-10 mb-1 rounded bg-white border hover:bg-gray-50 flex items-center justify-center">
        <Type className="w-4 h-4" />
      </button>
      
      <button className="w-10 h-10 mb-1 rounded bg-white border hover:bg-gray-50 flex items-center justify-center">
        <Square className="w-4 h-4" />
      </button>
    </div>
  )
}