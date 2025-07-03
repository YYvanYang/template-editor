import React from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { FlexibleLayout } from '@/shared/components/Layout'
import { CanvasWithRulers } from '@/features/canvas/components/CanvasWithRulers'

export const LayoutTest: React.FC = () => {
  const toolbarPosition = useEditorStore(state => state.ui.toolbarPosition)
  const setToolbarPosition = useEditorStore(state => state.setToolbarPosition)

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 调试控制面板 */}
      <div className="p-2 bg-yellow-100 border-b border-yellow-300 flex items-center gap-4 z-50">
        <span className="text-sm font-medium">布局测试</span>
        <span className="text-sm">当前工具栏位置: {toolbarPosition}</span>
        <button 
          onClick={() => setToolbarPosition('top')}
          className={`px-2 py-1 text-xs rounded ${toolbarPosition === 'top' ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          顶部
        </button>
        <button 
          onClick={() => setToolbarPosition('left')}
          className={`px-2 py-1 text-xs rounded ${toolbarPosition === 'left' ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          左侧
        </button>
      </div>
      
      {/* 主要内容 */}
      <div className="flex-1 overflow-hidden">
        <FlexibleLayout>
          <div className="flex-1 h-full bg-red-50 border border-red-200">
            <div className="h-full relative">
              <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1 z-10">
                画布容器
              </div>
              <CanvasWithRulers showRulers={true} unit="mm" showDiagnostics={false} />
            </div>
          </div>
          
          <aside className="w-80 bg-blue-50 border-l border-blue-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium mb-2">属性面板</h3>
              <div className="space-y-2 text-sm">
                <div>工具栏位置: {toolbarPosition}</div>
                <div>应该检查的问题:</div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>顶部模式：垂直标尺是否贴左边？</li>
                  <li>侧边模式：底部是否有空白？</li>
                  <li>侧边工具栏：是否正确显示？</li>
                  <li>分隔条：是否正常？</li>
                </ul>
              </div>
            </div>
          </aside>
        </FlexibleLayout>
      </div>
    </div>
  )
}