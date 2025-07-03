import React from 'react'
import { Toolbar } from '@/features/toolbar'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header role="banner" className="border-b border-border bg-card">
        <div className="h-14 px-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">模板编辑器</h1>
          {/* 后续添加更多头部功能 */}
        </div>
      </header>
      
      {/* 工具栏放在头部下方 */}
      <Toolbar />
      
      <main role="main" className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  )
}