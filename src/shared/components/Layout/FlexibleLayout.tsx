import React from 'react'
import { Toolbar, VerticalToolbar } from '@/features/toolbar'
import { useEditorStore } from '@/features/editor/stores/editor.store'

import { Settings } from 'lucide-react'
import { cn } from '@/shared/utils'

interface FlexibleLayoutProps {
  children: React.ReactNode
}

export const FlexibleLayout: React.FC<FlexibleLayoutProps> = ({ children }) => {
  const toolbarPosition = useEditorStore(state => state.ui.toolbarPosition)
  const setToolbarPosition = useEditorStore(state => state.setToolbarPosition)
  

  const toggleToolbarPosition = () => {
    setToolbarPosition(toolbarPosition === 'top' ? 'left' : 'top')
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header role="banner" className="border-b border-border bg-card">
        <div className="h-14 px-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">模板编辑器</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleToolbarPosition}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-sm",
                "rounded-md border border-input bg-background",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-colors"
              )}
              title="切换工具栏位置"
            >
              <Settings className="w-4 h-4" />
              工具栏位置: {toolbarPosition === 'top' ? '顶部' : '侧边'}
            </button>
          </div>
        </div>
      </header>
      
      {/* 顶部工具栏 */}
      {toolbarPosition === 'top' && <Toolbar />}
      
      <main role="main" className="flex-1 overflow-hidden relative">
        {/* 主内容区域 */}
        {children}
        
        {/* 侧边工具栏 - 使用绝对定位覆盖在内容上方 */}
        {toolbarPosition === 'left' && (
          <div className="absolute left-0 top-0 h-full z-10">
            <VerticalToolbar />
          </div>
        )}
      </main>
    </div>
  )
}