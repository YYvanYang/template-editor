import { Layout } from '@/shared/components/Layout'

function App() {
  return (
    <Layout>
      <div className="flex-1 flex">
        {/* 左侧工具栏 */}
        <aside className="w-12 bg-slate-900 border-r border-border">
          {/* 后续添加工具图标 */}
        </aside>
        
        {/* 中间画布区域 */}
        <div className="flex-1 bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-border h-96 flex items-center justify-center">
              <p className="text-muted-foreground">画布区域</p>
            </div>
          </div>
        </div>
        
        {/* 右侧属性面板 */}
        <aside className="w-80 bg-card border-l border-border p-4">
          <h2 className="text-lg font-medium mb-4">属性面板</h2>
          <p className="text-sm text-muted-foreground">选择元素查看属性</p>
        </aside>
      </div>
    </Layout>
  )
}

export default App