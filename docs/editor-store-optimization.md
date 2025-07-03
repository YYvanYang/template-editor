# Editor Store 优化记录

## 概述
对 `src/features/editor/stores/editor.store.ts` 进行了全面优化，实现了选择器缓存机制、性能优化和类型安全改进。

## 主要改进

### 1. 迁移到统一类型系统
- 将所有导入从 `@/features/editor/types` 迁移到 `@/types/unified.types.ts`
- 使用新的统一类型系统，提供更好的类型安全和一致性
- 更新了所有相关组件的类型导入

### 2. 选择器缓存机制
实现了多个性能优化的选择器：
- `getElementById(id)` - 获取单个元素
- `getElementsByType(type)` - 按类型获取元素
- `getSelectedElements()` - 获取选中的元素
- `getSelectedElement()` - 获取单个选中元素
- `getVisibleElements()` - 获取可见元素
- `getElementCount()` - 获取元素总数
- `getSelectedCount()` - 获取选中元素数量

### 3. 性能优化的 Hook
创建了一系列细粒度的 Hook，避免不必要的重渲染：

#### 状态 Hooks（订阅状态变化）
- `useCanvasState()` - 使用画布状态（浅比较）
- `useSelectedIds()` - 使用选中的元素 IDs
- `useElement(id)` - 使用特定元素
- `useElements()` - 使用元素列表
- `useSelectedElements()` - 使用选中的元素
- `useSelectedElement()` - 使用单个选中的元素
- `useHistoryState()` - 使用历史状态
- `useTemplateInfo()` - 使用模板信息
- `useActiveTool()` - 使用当前工具

#### 动作 Hooks（无状态订阅）
- `useCanvasActions()` - 画布操作
- `useElementActions()` - 元素操作
- `useHistoryActions()` - 历史操作
- `useAlignmentActions()` - 对齐系统操作

### 4. 批量操作优化
新增批量操作方法，减少状态更新次数：
- `addElements()` - 批量添加元素
- `updateElements()` - 批量更新元素
- `deleteElements()` - 批量删除元素
- `selectElements()` - 批量选择元素

### 5. 增强的元素操作
- `selectElement()` 支持多选选项
- `selectAll()` - 选择所有元素
- 自动清理无效元素的引用
- 历史记录大小限制（最多100条）

### 6. 类型安全改进
- 使用泛型 `ElementUpdate<T>` 提供更严格的类型检查
- 使用 `Point` 和 `Size` 类型替代内联对象
- 使用 `ExtractElement<T>` 类型工具提取特定元素类型

## 使用示例

### 基础使用
```typescript
// 获取特定元素（细粒度订阅）
const element = useElement('element-id')

// 获取选中的元素
const selectedElement = useSelectedElement()

// 获取画布状态（浅比较优化）
const canvas = useCanvasState()
```

### 动作使用（无状态订阅）
```typescript
// 获取元素操作方法
const { addElement, updateElement, deleteElement } = useElementActions()

// 批量更新元素
updateElements([
  { id: 'el1', updates: { position: { x: 100, y: 100 } } },
  { id: 'el2', updates: { position: { x: 200, y: 200 } } }
])
```

### 选择器使用
```typescript
// 在 store 内部使用选择器
const store = useEditorStore()
const textElements = store.getElementsByType('text')
const visibleElements = store.getVisibleElements()
```

## 性能优势

1. **细粒度订阅**：组件只订阅需要的特定状态片段
2. **浅比较优化**：复杂对象使用浅比较避免不必要的重渲染
3. **批量操作**：减少状态更新次数，提高性能
4. **动作分离**：动作 Hooks 不订阅状态，避免触发重渲染
5. **选择器缓存**：通过 getter 实现的选择器自动缓存计算结果

## 最佳实践

1. **优先使用特定的 Hook**
   ```typescript
   // ✅ 好 - 只订阅需要的状态
   const selectedIds = useSelectedIds()
   
   // ❌ 避免 - 订阅整个 store
   const store = useEditorStore()
   ```

2. **使用动作 Hook 进行操作**
   ```typescript
   // ✅ 好 - 不会触发组件重渲染
   const { updateElement } = useElementActions()
   
   // ❌ 避免 - 会订阅整个 store
   const updateElement = useEditorStore(state => state.updateElement)
   ```

3. **批量操作优化**
   ```typescript
   // ✅ 好 - 一次状态更新
   updateElements(updates)
   
   // ❌ 避免 - 多次状态更新
   updates.forEach(({ id, updates }) => updateElement(id, updates))
   ```

## 兼容性说明

- 保持了原有的 API 接口，现有代码无需大规模修改
- 新增的批量操作方法是可选的优化
- 类型系统迁移可能需要更新相关组件的导入路径