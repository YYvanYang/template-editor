import { useCallback } from 'react'
import { FlexibleLayout } from '@/shared/components/Layout'
import { CanvasWithRulers } from '@/features/canvas/components/CanvasWithRulers'
import { PropertyPanelPro } from '@/features/properties/components/PropertyPanelPro'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { RulerDebug } from '@/debug/RulerDebug'
import { CanvasRulerDebug } from '@/debug/CanvasRulerDebug'
import { RulerTest } from '@/debug/RulerTest'
import { SimpleRulerTest } from '@/debug/SimpleRulerTest'
import { RulerAlignmentDebug } from '@/debug/RulerAlignmentDebug'
import { RulerAlignmentTest } from '@/debug/RulerAlignmentTest'
import { EnhancedRulerDebug } from '@/debug/EnhancedRulerDebug'
import { SimpleCoordinateTest } from '@/debug/SimpleCoordinateTest'
import { CanvasClickTest } from '@/debug/CanvasClickTest'
import { ToolbarTest } from '@/debug/ToolbarTest'
import { LayoutTest } from '@/debug/LayoutTest'
import { IndustryStandardTest } from '@/debug/IndustryStandardTest'
import { SeparatorTest } from '@/debug/SeparatorTest'

function App() {
  // 获取选中的元素和更新函数
  const selectedElement = useEditorStore(state => state.getSelectedElement())
  const updateElement = useEditorStore(state => state.updateElement)
  
  // 优化 PropertyPanel 的回调，避免不必要的重渲染
  const handlePropertyChange = useCallback((key: string, value: any) => {
    if (selectedElement) {
      // 处理嵌套属性的更新
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.')
        const currentValue = selectedElement[parentKey as keyof typeof selectedElement]
        if (typeof currentValue === 'object' && currentValue !== null) {
          updateElement(selectedElement.id, {
            [parentKey]: {
              ...currentValue,
              [childKey]: value
            }
          })
        }
      } else {
        updateElement(selectedElement.id, { [key]: value })
      }
    }
  }, [selectedElement, updateElement])
  
  // 临时添加调试模式
  const isDebugMode = window.location.search.includes('debug=ruler');
  const isCanvasDebugMode = window.location.search.includes('debug=canvas-ruler');
  const isRulerTestMode = window.location.search.includes('debug=ruler-test');
  const isSimpleRulerTestMode = window.location.search.includes('debug=simple-ruler');
  const isAlignmentTestMode = window.location.search.includes('debug=alignment');
  const isEnhancedDebugMode = window.location.search.includes('debug=enhanced');
  const isAlignmentDebugMode = window.location.search.includes('debug=alignment-debug');
  const isCoordTestMode = window.location.search.includes('debug=coord-test');
  const isCanvasClickTestMode = window.location.search.includes('debug=canvas-click');
  const isToolbarTestMode = window.location.search.includes('debug=toolbar');
  const isLayoutTestMode = window.location.search.includes('debug=layout');
  const isIndustryStandardMode = window.location.search.includes('debug=industry');
  const isSeparatorTestMode = window.location.search.includes('debug=separator');
  
  if (isDebugMode) {
    return <RulerDebug />;
  }
  
  if (isCanvasDebugMode) {
    return <CanvasRulerDebug />;
  }
  
  if (isRulerTestMode) {
    return <RulerTest />;
  }
  
  if (isSimpleRulerTestMode) {
    return <SimpleRulerTest />;
  }
  
  if (isAlignmentTestMode) {
    return <RulerAlignmentTest />;
  }
  
  if (isEnhancedDebugMode) {
    return <EnhancedRulerDebug />;
  }
  
  if (isAlignmentDebugMode) {
    return <RulerAlignmentDebug />;
  }
  
  if (isCoordTestMode) {
    return <SimpleCoordinateTest />;
  }
  
  if (isCanvasClickTestMode) {
    return (
      <FlexibleLayout>
        <div className="flex-1 flex">
          <div className="flex-1 h-full">
            <CanvasWithRulers showRulers={true} unit="mm" showDiagnostics={false} />
          </div>
          <PropertyPanelPro 
            element={selectedElement}
            onPropertyChange={handlePropertyChange}
          />
        </div>
        <CanvasClickTest />
      </FlexibleLayout>
    );
  }
  
  if (isToolbarTestMode) {
    return <ToolbarTest />;
  }
  
  if (isLayoutTestMode) {
    return <LayoutTest />;
  }
  
  if (isIndustryStandardMode) {
    return <IndustryStandardTest />;
  }
  
  if (isSeparatorTestMode) {
    return <SeparatorTest />;
  }
  
  
  return (
    <>
      {/* React 19 原生文档元数据支持 */}
      <title>菜鸟模板编辑器</title>
      <meta name="description" content="现代化的打印模板设计工具" />
      
      <FlexibleLayout>
        {/* 中间画布区域 */}
        <div className="flex-1 h-full">
          <CanvasWithRulers showRulers={true} unit="mm" showDiagnostics={false} />
        </div>
        
        {/* 右侧属性面板 */}
        <PropertyPanelPro 
          element={selectedElement}
          onPropertyChange={handlePropertyChange}
        />
      </FlexibleLayout>
    </>
  )
}

export default App