import { Layout } from '@/shared/components/Layout'
import { CanvasWithRulers, CanvasWithCanvasRulers, CanvasWithScenaRulers, CanvasWithGuides } from '@/features/canvas/components'
import { RulerDebug } from '@/debug/RulerDebug'
import { CanvasRulerDebug } from '@/debug/CanvasRulerDebug'

function App() {
  // 临时添加调试模式
  const isDebugMode = window.location.search.includes('debug=ruler');
  const isCanvasDebugMode = window.location.search.includes('debug=canvas-ruler');
  
  if (isDebugMode) {
    return <RulerDebug />;
  }
  
  if (isCanvasDebugMode) {
    return <CanvasRulerDebug />;
  }
  return (
    <>
      {/* React 19 原生文档元数据支持 */}
      <title>菜鸟模板编辑器</title>
      <meta name="description" content="现代化的打印模板设计工具" />
      
      <Layout>
      <div className="flex-1 flex">
        {/* 左侧工具栏 */}
        <aside className="w-12 bg-slate-900 border-r border-border">
          {/* 后续添加工具图标 */}
        </aside>
        
        {/* 中间画布区域 */}
        <div className="flex-1">
          <CanvasWithScenaRulers showRulers={true} />
        </div>
        
        {/* 右侧属性面板 */}
        <aside className="w-80 bg-card border-l border-border p-4">
          <h2 className="text-lg font-medium mb-4">属性面板</h2>
          <p className="text-sm text-muted-foreground">选择元素查看属性</p>
        </aside>
      </div>
    </Layout>
    </>
  )
}

export default App