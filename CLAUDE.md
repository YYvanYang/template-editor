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
- `pnpm build` - 快速构建生产版本（跳过类型检查）
- `pnpm build:check` - 完整构建生产版本（包含类型检查）
- `pnpm typecheck` - 仅运行 TypeScript 类型检查
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

### 技术选型历程
1. **初始方案**：使用 `@scena/react-ruler` 
   - 问题：标签消失、坐标对齐困难、与新版本 React 兼容性问题
2. **过渡方案**：
   - `Ruler.tsx` - DOM 实现，性能受限（已废弃）
   - `CanvasRuler.tsx` - 早期 Canvas 版本，功能不完善（已废弃）
3. **最终方案**：自定义 Canvas 实现 (`RulerCanvas.tsx`)
   - 优势：完全控制渲染、高性能、精确对齐、支持设备像素比
   - 这是当前推荐使用的标尺组件

### Canvas 标尺实现要点

#### 1. 坐标系统
```typescript
// 关键公式
画布坐标 = (鼠标位置 - 视口偏移) / 缩放比例
单位值 = 画布坐标 / 像素每单位

// 单位转换常量
const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px at 96dpi
```

#### 2. 动态刻度间隔
根据缩放级别自动调整刻度密度，避免过于密集或稀疏：
```typescript
// 毫米单位的刻度间隔
if (pixelsPerMm >= 15) {
  subMinorInterval = 0.5;  // 显示0.5mm刻度
  minorInterval = 1;       // 显示1mm刻度
  majorInterval = 10;      // 10mm为主刻度
} else if (pixelsPerMm >= 7.5) {
  minorInterval = 1;
  majorInterval = 10;
} // ... 更多级别
```

#### 3. 鼠标事件处理
```typescript
// 重要：在整个容器监听鼠标事件，而不是只在画布区域
<div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
  {/* 标尺和画布组件 */}
</div>

// 正确计算鼠标位置
const canvasX = event.clientX - rect.left - rulerThickness;
const canvasY = event.clientY - rect.top - rulerThickness;
```

#### 4. 高清屏支持
```typescript
// 设置画布尺寸（考虑设备像素比）
canvas.width = canvasWidth * devicePixelRatio;
canvas.height = canvasHeight * devicePixelRatio;
canvas.style.width = `${canvasWidth}px`;
canvas.style.height = `${canvasHeight}px`;

// 缩放上下文
ctx.scale(devicePixelRatio, devicePixelRatio);
```

### 网格系统实现

#### 1. 网格与标尺对齐
- 网格使用与标尺相同的单位系统（毫米）
- 根据缩放级别动态调整网格间隔
- 默认显示5mm网格，提供更好的视觉效果

#### 2. 网格间隔配置
```typescript
// 根据缩放调整网格密度
if (pixelsPerMm < 3.5) {
  gridInterval = 10;  // 10mm 网格
} else if (pixelsPerMm < 7.5) {
  gridInterval = 5;   // 5mm 网格（默认）
} else if (pixelsPerMm < 15) {
  gridInterval = 2;   // 2mm 网格
} // ... 更多级别
```

### 常见问题及解决方案

#### 1. 坐标对齐问题
- **问题**：鼠标位置与标尺显示数值不匹配
- **原因**：坐标系统混淆、视口偏移计算错误
- **解决**：
  - 明确区分容器坐标、画布坐标、标尺坐标
  - 正确处理标尺厚度偏移
  - 在整个容器而非画布区域监听鼠标事件

#### 2. 垂直标尺显示问题
- **问题**：文字被遮挡、标签显示不全
- **原因**：标尺宽度不足、标签位置计算错误
- **解决**：
  - 增加标尺厚度到30px
  - 垂直标尺标签：宽14px，高40px（考虑旋转）
  - 调整文字位置，避免边缘裁剪

#### 3. 刻度密度问题
- **问题**：缩放时刻度过密或过疏
- **原因**：固定刻度间隔不适应动态缩放
- **解决**：根据像素/单位比例动态调整刻度间隔

#### 4. 性能优化
- 使用 `requestAnimationFrame` 优化渲染
- 跳过不可见的刻度绘制
- 使用 Canvas 而非 DOM 元素提升性能

### 调试工具
项目提供了多个调试工具帮助开发和问题排查：
- `?debug=coord-test` - 坐标系统测试工具
- `?debug=alignment-debug` - 标尺对齐调试工具
- `?debug=enhanced` - 增强调试界面

### 实施经验总结
1. **先理解坐标系统**：清晰区分各个坐标系之间的转换关系
2. **渐进式开发**：先实现基础功能，再逐步优化细节
3. **充分测试**：不同缩放级别、不同单位、拖动画布等场景
4. **性能优先**：使用 Canvas 而非 DOM，避免频繁重绘
5. **用户体验**：合理的默认值、平滑的交互反馈

### 标尺实时更新优化（2025年1月更新）

#### 问题背景
初始实现中，标尺只在拖动结束后更新（`onDragEnd`），与 Figma 等专业工具的体验不一致。

#### 解决方案
1. **添加 `onDragMove` 事件处理**
   ```typescript
   // 使用 requestAnimationFrame 进行节流
   const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
     if (dragAnimationFrame.current) {
       cancelAnimationFrame(dragAnimationFrame.current)
     }
     
     dragAnimationFrame.current = requestAnimationFrame(() => {
       const stage = e.target
       setOffset({ x: stage.x(), y: stage.y() })
     })
   }, [setOffset])
   ```

2. **性能优化策略**
   - 使用 `requestAnimationFrame` 确保更新与浏览器渲染同步
   - 避免在单帧内多次更新，自动取消之前的帧
   - 组件卸载时清理未完成的动画帧

3. **保留 `onDragEnd`**
   - 确保最终位置的准确性
   - 清理动画帧引用

#### 效果
- 标尺刻度在拖动时实时跟随画布移动
- 流畅的 60fps 更新，无卡顿感
- 与业界领先设计工具保持一致的交互体验

### 鼠标坐标显示修复（2025年1月更新）

#### 问题描述
鼠标辅助线显示的坐标是相对于容器的，而不是相对于画布左上角的，导致：
- 拖动画布后，坐标显示不正确
- 鼠标在画布(0,0)位置时，不显示0mm

#### 根本原因
在 `RulerCanvas.tsx` 中计算鼠标坐标时，没有考虑画布的偏移（viewport offset）：
```typescript
// 错误：直接使用鼠标位置
const canvasPixelValue = mousePos / viewport.scale;

// 正确：需要减去视口偏移
const canvasPixelValue = (mousePos - viewportOffset) / viewport.scale;
```

#### 解决方案
修改鼠标数值标签的计算逻辑，确保坐标相对于画布：
```typescript
// 获取对应方向的视口偏移
const viewportOffset = orientation === 'horizontal' ? viewport.x : viewport.y;
// 计算相对于画布的像素值
const canvasPixelValue = (mousePos - viewportOffset) / viewport.scale;
// 转换为单位值
const unitValue = canvasPixelValue / tickParams.unitConfig.toPx;
```

#### 效果
- ✅ 鼠标坐标始终相对于画布左上角(0,0)
- ✅ 拖动画布后坐标值仍然准确
- ✅ 与标尺刻度系统保持一致的坐标计算方式

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

## 空间索引优化（2025年1月更新）

### R-tree 实现优化
项目实现了优化的 R-tree 空间索引（`spatial-index-optimized.ts`），用于高效处理大规模元素的空间查询。

#### 核心改进
1. **基于 R*-tree 算法**
   - 改进的节点选择策略（考虑面积、周长、重叠）
   - 优化的节点分裂算法
   - 完整的父子关系维护

2. **STR 批量加载**
   - Sort-Tile-Recursive 算法实现
   - 批量加载性能提升 10x
   - 自动构建平衡树结构

3. **性能指标**
   - 支持 100,000+ 元素
   - 1000 元素搜索 < 5ms
   - 10000 元素平均搜索 < 2ms

4. **新增功能**
   - `bulkLoad()` - 批量数据加载
   - `validate()` - 树结构验证
   - `getMetrics()` - 性能监控

#### 使用示例
```typescript
import { createSpatialIndex } from '@/features/canvas/utils/spatial-index';

// 创建空间索引
const index = createSpatialIndex();

// 批量加载
const items = elements.map(el => ({
  item: { id: el.id, bounds: el.bounds },
  bounds: el.bounds
}));
index.bulkLoad(items);

// 区域搜索
const results = index.search({
  left: 100,
  top: 100,
  right: 500,
  bottom: 500
});

// 半径搜索
const nearbyElements = index.searchRadius(
  { x: 250, y: 250 },
  100
);
```

#### 参考资料
- Guttman (1984): "R-trees: A Dynamic Index Structure"
- Beckmann et al. (1990): "The R*-tree: An Efficient and Robust Access Method"
- Leutenegger et al. (1997): "STR: A Simple and Efficient Algorithm"