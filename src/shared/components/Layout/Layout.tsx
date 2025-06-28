import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header role="banner" className="h-14 border-b border-border bg-card">
        <div className="h-full px-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">模板编辑器</h1>
          {/* 后续添加工具栏按钮 */}
        </div>
      </header>
      
      <main role="main" className="flex-1 flex">
        {children}
      </main>
    </div>
  )
}