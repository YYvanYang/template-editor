import React from 'react'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { VerticalToolbar } from '@/features/toolbar'

export const SeparatorTest: React.FC = () => {
  const toolbarPosition = useEditorStore(state => state.ui.toolbarPosition)
  const setToolbarPosition = useEditorStore(state => state.setToolbarPosition)

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 控制面板 */}
      <div className="p-4 bg-white border-b shadow-sm">
        <h1 className="text-lg font-semibold mb-3">🔧 分隔符测试</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">工具栏方向:</span>
          <button 
            onClick={() => setToolbarPosition('top')}
            className={`px-3 py-1 text-sm rounded ${
              toolbarPosition === 'top' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            水平 (竖线分隔)
          </button>
          <button 
            onClick={() => setToolbarPosition('left')}
            className={`px-3 py-1 text-sm rounded ${
              toolbarPosition === 'left' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            垂直 (横线分隔)
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* 垂直工具栏展示 */}
        <div className="w-80 p-4 bg-white border-r">
          <h2 className="font-medium mb-3">垂直工具栏 (应该是横线分隔)</h2>
          <div className="flex justify-center">
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <VerticalToolbar />
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <h3 className="font-medium mb-2">检查项目:</h3>
            <ul className="space-y-1 text-xs">
              <li>✅ 工具组之间应该有横线分隔</li>
              <li>✅ 工具项分隔符应该是横线 (h-px w-6)</li>
              <li>❌ 不应该出现竖线分隔符</li>
              <li>✅ 分隔符应该居中对齐</li>
            </ul>
          </div>
        </div>
        
        {/* 说明区域 */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold mb-4">分隔符方向说明</h2>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📏 垂直工具栏 (当前测试)</h3>
              <p className="text-blue-800 text-sm mb-3">
                工具排列方向：从上到下 ⬇️
              </p>
              <div className="text-blue-700 text-sm space-y-1">
                <div>• 分隔符方向：<strong>横线</strong> (perpendicular to layout)</div>
                <div>• CSS 类：<code className="bg-blue-100 px-1 rounded">h-px w-6 my-1</code></div>
                <div>• 视觉效果：将工具分成上下两部分</div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">📏 水平工具栏 (参考)</h3>
              <p className="text-green-800 text-sm mb-3">
                工具排列方向：从左到右 ➡️
              </p>
              <div className="text-green-700 text-sm space-y-1">
                <div>• 分隔符方向：<strong>竖线</strong> (perpendicular to layout)</div>
                <div>• CSS 类：<code className="bg-green-100 px-1 rounded">w-px h-6 mx-1</code></div>
                <div>• 视觉效果：将工具分成左右两部分</div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">🎯 设计原则</h3>
              <p className="text-yellow-800 text-sm">
                分隔符应该<strong>垂直于工具排列方向</strong>，这样才能有效地分隔工具组，
                符合用户界面设计的基本原则。Figma、Adobe XD、Sketch 等专业工具都遵循这个标准。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}