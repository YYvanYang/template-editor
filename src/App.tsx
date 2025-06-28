import { Layout } from '@/shared/components/Layout'
import { Canvas } from '@/features/canvas/components'

function App() {
  return (
    <Layout>
      <div className="flex-1 flex">
        {/* 左侧工具栏 */}
        <aside className="w-12 bg-slate-900 border-r border-border">
          {/* 后续添加工具图标 */}
        </aside>
        
        {/* 中间画布区域 */}
        <div className="flex-1">
          <Canvas />
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