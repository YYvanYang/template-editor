import React from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { VerticalToolbar } from '@/features/toolbar'
import { SimpleVerticalToolbar } from './SimpleVerticalToolbar'

export const ToolbarTest: React.FC = () => {
  const toolbarPosition = useEditorStore(state => state.ui.toolbarPosition)
  const setToolbarPosition = useEditorStore(state => state.setToolbarPosition)

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <h1>工具栏测试页面</h1>
        <p>当前工具栏位置: {toolbarPosition}</p>
        <button 
          onClick={() => setToolbarPosition('top')}
          className="mr-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          顶部
        </button>
        <button 
          onClick={() => setToolbarPosition('left')}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          左侧
        </button>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* 总是显示左侧工具栏进行测试 */}
        <div className="bg-blue-200 border-r-2 border-blue-400 flex-shrink-0 w-20">
          <div className="text-blue-800 text-xs p-2 text-center">工具栏</div>
          <div className="h-full bg-blue-100">
            <SimpleVerticalToolbar />
            <div className="border-t-2 border-blue-300 mt-2 pt-2">
              <div className="text-blue-800 text-xs text-center mb-2">真实工具栏:</div>
              <VerticalToolbar />
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-50 p-4 overflow-hidden">
          <p>主内容区域</p>
          <p>工具栏位置: {toolbarPosition}</p>
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300">
            <p>这里应该可以看到左侧的垂直工具栏</p>
            <p>如果看不到工具栏，说明 VerticalToolbar 组件有问题</p>
          </div>
        </div>
      </div>
    </div>
  )
}