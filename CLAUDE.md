# Claude Code 项目上下文

## 项目概述
这是一个现代化的模板编辑器项目，用于创建和编辑打印模板（类似菜鸟物流的打印模板设计器）。

## 技术栈
- **框架**: React 19.1.0 + TypeScript 5.x
- **构建工具**: Vite 7.x (推荐使用 @vitejs/plugin-react-swc)
- **样式**: Tailwind CSS 4.x (使用新的 CSS 配置方式)
- **状态管理**: Zustand + Immer
- **画布渲染**: Konva.js / React-Konva
- **测试**: Vitest + React Testing Library
- **代码规范**: ESLint 9.x (扁平化配置) + Prettier

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

### 核心改进
1. **Oxide 引擎**
   - 基于 Rust 的高性能引擎
   - 构建速度提升 5 倍，增量构建提升 100 倍
   - 安装体积减小 35%

2. **零配置理念**
   - 自动内容检测，无需手动配置 content 数组
   - 与 Vite 深度集成，利用模块图谱
   - 内置 Lightning CSS，无需额外 PostCSS 插件

### CSS-First 配置
项目使用 Tailwind CSS v4 的新配置方式：
- 配置文件：主 CSS 文件中使用 `@theme` (非 `tailwind.config.js`)
- 使用 `@theme` 定义设计系统变量
- 通过 CSS 变量实现主题切换
- 支持暗色模式自动切换

示例配置：
```css
@import "tailwindcss";

@theme {
  --color-brand-primary: oklch(65% 0.22 260);
  --font-display: "Satoshi", var(--font-sans);
  --spacing-128: 32rem;
}
```

### 主题变量命名规范
- 颜色：`--color-{name}` (推荐使用 OKLCH 色彩空间)
- 间距：`--spacing-{size}`
- 圆角：`--radius-{size}`
- 字体：`--font-{name}`

### v4.1 新增工具类
- `text-shadow-*` - 文本阴影
- `mask-*` - 遮罩效果
- `wrap-*` - 文本换行控制
- `safe-*` - 安全对齐变体
- `pointer-*` - 输入设备检测
- `user-valid/user-invalid` - 用户交互后的表单验证

## React 19 新特性使用

### 核心新特性
1. **Actions 和 useActionState**
   - 使用 `useActionState` 处理表单提交和异步操作
   - 自动管理 loading、error、success 状态
   - 示例：
   ```typescript
   const [error, submitAction, isPending] = useActionState(
     async (previousState, formData) => {
       // 处理表单提交
     },
     initialState
   );
   ```

2. **use Hook**
   - 可在条件语句中使用的新 Hook
   - 读取 Promise 和 Context
   - 与 Suspense 无缝集成
   - 注意：Promise 应在 Server Component 中创建

3. **原生文档元数据**
   - 直接在组件中使用 `<title>`, `<meta>`, `<link>`
   - React 会自动提升到 `<head>`

4. **简化的 Context**
   - 直接使用 `<Context value={...}>` 代替 `<Context.Provider>`

### 废弃的 API
- **避免使用 `forwardRef`**（已标记为不推荐）
  - React 19 允许 ref 作为普通 prop 传递
  - 旧方式：`React.forwardRef((props, ref) => <div ref={ref} />)`
  - 新方式：`function Component({ ref, ...props }) { return <div ref={ref} /> }`
  - 函数组件现在可以直接接收 `ref` 作为 prop
  - TypeScript 中添加 `ref?: React.Ref<HTMLElement>` 到接口定义
- **`propTypes` 和 `defaultProps` 已移除**（使用 TypeScript 代替）
- **避免字符串 refs**（早已废弃，使用 useRef 或回调 refs）

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

### React 19 act() 警告处理
React 19 对测试中的状态更新有更严格的要求，所有可能导致状态更新的操作都需要包装在 act() 中：

1. **组件渲染时的异步操作**
   ```typescript
   // ❌ 错误：会产生 act() 警告
   const { container } = render(<ComponentWithAsyncEffect />);
   
   // ✅ 正确：使用 act 包装
   let container: HTMLElement;
   await act(async () => {
     ({ container } = render(<ComponentWithAsyncEffect />));
   });
   ```

2. **useEffect 中的异步状态更新**
   ```typescript
   // 当组件在 useEffect 中有异步操作时
   await act(async () => {
     render(<BarcodeElementRenderer element={element} />);
   });
   
   // 等待异步操作完成
   await waitFor(() => {
     expect(someAsyncResult).toBeTruthy();
   });
   ```

3. **Canvas 和图片加载**
   - Canvas 元素需要完整的 DOM API mock
   - Image 对象的 onload 需要模拟触发
   ```typescript
   global.Image = vi.fn().mockImplementation(() => {
     const img = {
       src: '',
       onload: null,
       onerror: null,
     };
     // 设置 src 时触发 onload
     Object.defineProperty(img, 'src', {
       set(value) {
         this._src = value;
         if (this.onload) setTimeout(() => this.onload(), 0);
       }
     });
     return img;
   });
   ```

4. **Mock 初始化时机**
   - 在 beforeEach 中重置所有 mock
   - 确保每个测试的 mock 状态一致
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(someFunction).mockReturnValue(defaultValue);
   });
   ```

## ESLint 9 扁平化配置

### 核心概念
- 使用 `eslint.config.js` 替代 `.eslintrc`
- 导出配置对象数组，显式定义规则应用范围
- 支持 ES 模块，可使用 import/export

### React + TypeScript 配置示例
```javascript
// eslint.config.js
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: {
      react: fixupPluginRules(pluginReact),
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: { react: { version: "detect" } },
  }
);
```

### 关键要点
- 使用 `@eslint/compat` 处理未完全适配的插件
- 通过 `files` 属性精确控制规则应用范围
- Node.js 版本要求：18.18.0+ 或 20.9.0+

## Vite 7 配置指南

### 核心更新
1. **Node.js 要求**：20.19+ 或 22.12+
2. **默认构建目标**：`baseline-widely-available`
   - Chrome 107+, Firefox 104+, Safari 16.0+
3. **Rolldown**：基于 Rust 的下一代打包工具（实验性）

### React 插件选择
| 插件 | 性能 | 灵活性 | 适用场景 |
|------|------|--------|----------|
| `@vitejs/plugin-react` | 快速 | 高（支持 Babel 插件） | 需要自定义 Babel 转换 |
| `@vitejs/plugin-react-swc` | 极快 | 较低 | 标准项目，追求性能 |

**推荐**：对于本项目，使用 `@vitejs/plugin-react-swc` 以获得最佳性能。

### 配置示例
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
});
```

## 项目文档

### 设计文档
- `analysis/cainiao-template-analysis.md` - 菜鸟官方模板设计器深度分析
- `design/modern-template-editor-design.md` - 现代化模板编辑器设计方案
- `design/implementation-plan.md` - 详细实施计划

### 技术文档
- `docs/2025 年现代前端技术栈：React 19、Tailwind 4、ESLint 9 与 Vite 7 技术深度调研报告.md` - 技术栈调研报告
- `docs/菜鸟云打印标记语言规范(CNPL).md` - **重要：菜鸟打印标记语言规范，所有元素实现必须符合此规范**

### CNPL 规范要点
菜鸟云打印标记语言（CAINIAO PRINT LANGUAGE）定义了打印内容的标准规范：
- 使用自定义 XML 标签描述样式信息
- 支持嵌入 JS 代码片段（ES5 规范）
- 二维坐标系，左上角为原点（0,0）
- 使用相对坐标系统
- 支持的元素：page、layout、text、table、barcode、image、line、rect 等
- 表格元素规范：table 只能包含 tr，tr 只能包含 th 或 td
- 样式规范：边框、字体、对齐、旋转等属性
- 动态内容：支持循环、条件判断、数据绑定

## 标尺组件实现说明

### 技术选型
- 使用 `@scena/react-ruler` 作为标尺组件库
- 原因：成熟稳定，解决了自定义实现中标签消失的问题

### 标尺配置
```typescript
// 毫米单位配置
if (unit === 'mm') {
  zoom = viewport.scale * 3.7795275591; // 1mm = 3.7795275591px
  unitSize = 10; // 10mm 间隔
}

// 厘米单位配置  
if (unit === 'cm') {
  zoom = viewport.scale * 37.795275591; // 1cm = 37.795275591px
  unitSize = 1; // 1cm 间隔
}
```

### 关键实现要点
1. **容器尺寸监听**：使用 ResizeObserver 精确监听容器大小变化
2. **滚动位置转换**：将像素偏移转换为对应单位（mm/cm）的偏移
3. **文本格式化**：通过 textFormat 函数显示正确的单位值
4. **响应式调整**：调用 ruler.resize() 方法处理尺寸变化

### 常见问题
1. **标尺标签消失**：使用 @scena/react-ruler 替代自定义实现
2. **刻度显示不全**：设置容器 overflow: visible，确保内容不被截断
3. **单位转换错误**：正确设置 zoom 和 unit 参数，参考官方文档

## 专业对齐辅助线系统

### 系统概述
基于 Konva.js 实现的高性能、专业级对齐辅助线系统，提供了完整的对齐、分布和智能布局功能。

### 核心特性
1. **高性能空间索引**
   - R-tree 数据结构，O(log n) 空间查询
   - 支持 1000+ 元素实时对齐检测
   - 视口裁剪优化

2. **磁力吸附效果**
   - 多种吸附曲线：线性、二次、三次、指数
   - 渐进式吸附体验
   - 可配置吸附强度和范围

3. **智能间距检测**
   - 自动识别等间距分布
   - 智能分布建议
   - 一键对齐和分布

4. **标尺集成**
   - 支持从标尺拖拽创建辅助线
   - 多单位支持（px、mm、cm）
   - 实时坐标显示

5. **性能监控**
   - 实时 FPS 监控
   - 对齐操作性能跟踪
   - 自动性能降级策略

### 使用示例
```typescript
// 基础使用
import { useAlignment } from '@/features/canvas';

const alignment = useAlignment({
  config: {
    enabled: true,
    threshold: 5,
    snapToGrid: true,
    gridSize: 10,
  }
});

// 磁力吸附
import { useDragAndDropWithAlignment } from '@/features/canvas';

const dragAndDrop = useDragAndDropWithAlignment({
  enableAlignment: true,
  enableMagneticSnap: true,
});
```

### 性能指标
- 对齐检测：< 2ms（100 个元素）
- 空间查询：< 5ms（1000 个元素）
- 缓存命中率：> 80%
- 目标帧率：60 FPS

### 相关文档
- `docs/alignment-system-design.md` - 对齐系统设计文档
- `src/features/canvas/README.md` - 详细使用指南
- `src/features/canvas/examples/` - 示例代码