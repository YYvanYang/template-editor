import React from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { FlexibleLayout } from '@/shared/components/Layout'
import { CanvasWithRulers } from '@/features/canvas/components/CanvasWithRulers'

export const IndustryStandardTest: React.FC = () => {
  const toolbarPosition = useEditorStore(state => state.ui.toolbarPosition)
  const setToolbarPosition = useEditorStore(state => state.setToolbarPosition)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 行业标准对比说明 */}
      <div className="p-3 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-blue-900">
              🎨 行业标准布局测试 - 参考 Figma/Adobe XD/Sketch
            </h2>
            <p className="text-xs text-blue-700 mt-1">
              ✓ 垂直标尺始终有 56px 左边距 ✓ 保持视觉一致性 ✓ 工具栏覆盖预留区域
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-800">当前: {toolbarPosition}</span>
            <button 
              onClick={() => setToolbarPosition('top')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                toolbarPosition === 'top' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
              }`}
            >
              顶部模式
            </button>
            <button 
              onClick={() => setToolbarPosition('left')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                toolbarPosition === 'left' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
              }`}
            >
              侧边模式
            </button>
          </div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="flex-1 overflow-hidden">
        <FlexibleLayout>
          <div className="flex-1 h-full">
            <CanvasWithRulers showRulers={true} unit="mm" showDiagnostics={false} />
          </div>
          
          <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium mb-3 text-gray-900">检查项目</h3>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-800 mb-2">✅ 符合行业标准</h4>
                  <ul className="space-y-1 text-green-700 text-xs">
                    <li>• 垂直标尺有固定 56px 左边距</li>
                    <li>• 水平标尺从左边距开始</li>
                    <li>• 角落区域正确对齐</li>
                    <li>• 工具栏切换时布局保持一致</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">📐 当前模式: {toolbarPosition}</h4>
                  {toolbarPosition === 'top' ? (
                    <ul className="space-y-1 text-blue-700 text-xs">
                      <li>• 左边距区域显示为灰色背景</li>
                      <li>• 垂直标尺从 56px 位置开始</li>
                      <li>• 保持与专业设计工具一致</li>
                    </ul>
                  ) : (
                    <ul className="space-y-1 text-blue-700 text-xs">
                      <li>• 工具栏覆盖在左边距区域</li>
                      <li>• 垂直标尺紧贴工具栏右侧</li>
                      <li>• 无额外空间浪费</li>
                    </ul>
                  )}
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">🔍 参考对比</h4>
                  <p className="text-yellow-700 text-xs">
                    这个布局现在符合 Figma、Adobe XD、Sketch 等专业设计工具的标准：
                    垂直标尺始终保持固定左边距，确保界面的视觉一致性和专业性。
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </FlexibleLayout>
      </div>
    </div>
  )
}