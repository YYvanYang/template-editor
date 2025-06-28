# Claude Code 项目上下文

## 项目概述
这是一个现代化的模板编辑器项目，用于创建和编辑打印模板（类似菜鸟物流的打印模板设计器）。

## 技术栈
- **框架**: React 19.1.0 + TypeScript 5.x
- **构建工具**: Vite 7.x
- **样式**: Tailwind CSS 4.x (使用新的 CSS 配置方式)
- **状态管理**: Zustand + Immer
- **画布渲染**: Konva.js / React-Konva
- **测试**: Vitest + React Testing Library
- **代码规范**: ESLint 9.x + Prettier

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 使用 @ 别名引用 src 目录
- 遵循 ESLint 和 Prettier 配置

### 测试要求
- 遵循 TDD（测试驱动开发）原则
- 每个模块先写测试，再写实现
- 单元测试覆盖率目标 > 80%
- 使用 Vitest 进行测试

### Git 提交规范
- 使用 Conventional Commits
- feat: 新功能
- fix: 修复bug
- test: 添加测试
- refactor: 重构代码
- docs: 文档更新
- style: 代码格式调整
- chore: 构建/工具链相关

### 项目结构
```
src/
├── features/       # 功能模块
│   ├── editor/    # 编辑器核心
│   ├── canvas/    # 画布模块
│   ├── elements/  # 元素组件
│   ├── properties/# 属性面板
│   └── templates/ # 模板管理
├── shared/        # 共享模块
│   ├── components/# 通用组件
│   ├── hooks/     # 自定义Hooks
│   ├── utils/     # 工具函数
│   └── types/     # 类型定义
└── services/      # API服务
```

## 常用命令
- `pnpm dev` - 启动开发服务器
- `pnpm test` - 运行测试
- `pnpm test:ui` - 启动测试UI
- `pnpm build` - 构建生产版本
- `pnpm lint` - 运行代码检查

## 当前进度
查看 PROGRESS.md 文件了解开发进度

## 注意事项
1. 每次修改代码前先运行测试确保没有破坏现有功能
2. 新功能开发遵循：测试 -> 实现 -> 重构的循环
3. 提交代码前确保通过 lint 检查
4. 复杂功能先设计接口和数据结构

## 核心概念

### 元素系统
- 所有可编辑的内容都是"元素"（Element）
- 元素类型：文本、图片、表格、条形码、二维码等
- 每个元素都有唯一ID和通用属性（位置、大小、旋转等）

### 数据绑定
- 使用 {{variable}} 语法进行数据绑定
- 支持嵌套属性访问：{{order.customer.name}}
- 支持条件和循环渲染

### 状态管理
- 使用 Zustand 进行全局状态管理
- 状态分为：画布状态、元素集合、历史记录、模板元数据等
- 支持撤销/重做功能

## 性能优化指南
1. 大量元素时使用虚拟化渲染
2. 拖拽操作使用防抖/节流
3. 图片资源懒加载
4. 使用 Web Worker 处理复杂计算

## Tailwind CSS v4 配置说明
项目使用 Tailwind CSS v4 的新配置方式：
- 配置文件：`tailwind.config.css` (CSS 格式，非 JS)
- 使用 `@theme` 定义设计系统变量
- 通过 CSS 变量实现主题切换
- 支持暗色模式自动切换

### 主题变量命名规范
- 颜色：`--color-{name}`
- 间距：`--spacing-{size}`
- 圆角：`--radius-{size}`

## React 19 新特性使用
- 避免使用 `forwardRef`（已标记为不推荐）
- 使用新的 ref 作为 props 传递方式
- 利用新的性能优化特性

## 测试最佳实践（2025年更新）

### React Hook 测试
1. **使用 `@testing-library/react` 的 `renderHook`**
   ```typescript
   import { renderHook, act, waitFor } from '@testing-library/react'
   ```

2. **处理 useRef 和 state 同步问题**
   - 问题：`useRef` 的值在测试中不会自动同步更新
   - 解决方案：使用 `useEffect` 同步 ref 值
   ```typescript
   const stateRef = useRef(state)
   useEffect(() => {
     stateRef.current = state
   }, [state])
   ```

3. **处理异步状态更新**
   - 使用 `waitFor` 等待状态更新
   ```typescript
   await waitFor(() => {
     expect(result.current.someState).toBe(expectedValue)
   })
   ```

4. **Mock 复杂组件（如 Konva）**
   ```typescript
   vi.mock('react-konva', () => ({
     Stage: React.forwardRef(({ children, onWheel, ...props }, ref) => {
       // 模拟 Konva 事件结构
       const handleWheel = (e) => {
         if (onWheel) {
           onWheel({ evt: e, target: { getPointerPosition: () => ({ x: 100, y: 100 }) } })
         }
       }
       return <div onWheel={handleWheel} {...props}>{children}</div>
     })
   }))
   ```

5. **处理拖拽测试**
   - 确保在 `startDrag` 时提供正确的参数
   - 使用 `waitFor` 等待状态更新后再进行断言

### 常见测试陷阱
1. **Hook 的 ref 同步问题**：ref 更新不会触发重渲染，需要手动同步
2. **事件模拟**：确保模拟的事件包含必要的属性（如 `preventDefault`）
3. **异步更新**：React 18+ 的批量更新可能导致状态不立即更新