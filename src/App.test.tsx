import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import type { TextElement } from '@/types/template.types'

// Mock 依赖
vi.mock('@/features/canvas/components/CanvasWithRulers', () => ({
  CanvasWithRulers: () => <div data-testid="canvas">Canvas</div>
}))

vi.mock('@/features/properties/components/PropertyPanel', () => ({
  PropertyPanel: ({ element, onPropertyChange }: any) => (
    <div data-testid="property-panel">
      {element ? (
        <div>
          <div data-testid="element-name">{element.name}</div>
          <button 
            data-testid="change-property" 
            onClick={() => onPropertyChange('name', 'Updated Name')}
          >
            Change Name
          </button>
        </div>
      ) : (
        <div data-testid="no-selection">No element selected</div>
      )}
    </div>
  )
}))

vi.mock('@/shared/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('App - PropertyPanel Integration', () => {
  beforeEach(() => {
    // 重置 store
    useEditorStore.setState({
      elements: new Map(),
      selectedIds: new Set(),
    })
  })

  it('should show "No element selected" message when nothing is selected', () => {
    render(<App />)
    
    expect(screen.getByTestId('property-panel')).toBeInTheDocument()
    expect(screen.getByTestId('no-selection')).toHaveTextContent('No element selected')
  })

  it('should show element properties when an element is selected', () => {
    // 添加一个元素并选中它
    const element: TextElement = {
      id: 'test-1',
      type: 'text',
      name: 'Test Text',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      content: 'Test Content',
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      lineHeight: 1.2,
    }
    
    useEditorStore.getState().addElement(element)
    useEditorStore.getState().selectElement('test-1')
    
    render(<App />)
    
    expect(screen.getByTestId('element-name')).toHaveTextContent('Test Text')
    expect(screen.queryByTestId('no-selection')).not.toBeInTheDocument()
  })

  it('should update element when property changes', () => {
    // 添加一个元素并选中它
    const element: TextElement = {
      id: 'test-1',
      type: 'text',
      name: 'Test Text',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      content: 'Test Content',
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      lineHeight: 1.2,
    }
    
    useEditorStore.getState().addElement(element)
    useEditorStore.getState().selectElement('test-1')
    
    render(<App />)
    
    // 点击更改属性按钮
    screen.getByTestId('change-property').click()
    
    // 验证 store 中的元素已更新
    const updatedElement = useEditorStore.getState().elements.get('test-1')
    expect(updatedElement?.name).toBe('Updated Name')
  })

  it('should show "No element selected" when multiple elements are selected', () => {
    // 添加两个元素并都选中
    const element1: TextElement = {
      id: 'test-1',
      type: 'text',
      name: 'Text 1',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      content: 'Content 1',
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      lineHeight: 1.2,
    }
    
    const element2: TextElement = {
      id: 'test-2',
      type: 'text',
      name: 'Text 2',
      x: 50,
      y: 60,
      width: 100,
      height: 50,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      content: 'Content 2',
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      lineHeight: 1.2,
    }
    
    useEditorStore.getState().addElement(element1)
    useEditorStore.getState().addElement(element2)
    useEditorStore.getState().selectElement('test-1')
    useEditorStore.getState().selectElement('test-2')
    
    render(<App />)
    
    // 多选时应该显示 "No element selected"
    expect(screen.getByTestId('no-selection')).toHaveTextContent('No element selected')
  })
})