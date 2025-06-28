import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
  it('should render with all main sections', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    // 应该渲染顶部工具栏
    expect(screen.getByRole('banner')).toBeInTheDocument()
    
    // 应该渲染主内容区域
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // 应该渲染子内容
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should render header with title', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    expect(screen.getByText('模板编辑器')).toBeInTheDocument()
  })

  it('should have proper layout structure', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const layoutRoot = container.firstChild
    expect(layoutRoot).toHaveClass('min-h-screen', 'flex', 'flex-col')
  })
})