# 条形码渲染系统

本模块实现了一个专业级的条形码渲染系统，支持 Web Worker 异步生成、智能缓存、错误处理和降级方案。

## 核心特性

### 1. Web Worker 异步生成
- 使用独立的 Worker 线程处理条形码生成，不阻塞主线程
- 支持并发生成多个条形码
- 自动管理 Worker 生命周期

### 2. 智能缓存机制
- 使用 Map 实现高效的内存缓存
- 基于内容和选项的缓存键生成
- 自动清理过期缓存（5分钟超时）
- 缓存大小限制（默认100个）

### 3. 完整的条形码格式支持
- **一维码**：CODE128、CODE39、EAN13、EAN8、UPC-A/E、ITF14 等
- **二维码**：QR Code（支持4级纠错）
- 未来可扩展：PDF417、DataMatrix、Aztec 等

### 4. 错误处理和降级
- Worker 加载失败时自动降级到主线程
- 生成超时保护（10秒）
- 详细的错误信息和验证

### 5. 性能优化
- 缓存命中率监控
- 批量预热功能
- 防抖处理避免频繁生成

## 使用方法

### 基础使用

```typescript
import { getBarcodeRenderer } from '@/features/elements/barcode';

// 获取渲染器实例（单例）
const renderer = getBarcodeRenderer();

// 生成条形码
const result = await renderer.generate('123456789', {
  barcodeType: BarcodeType.CODE128,
  width: 200,
  height: 100,
  displayValue: true,
  fontSize: 12,
  lineColor: '#000000',
  background: '#FFFFFF',
});

// 使用生成的图像数据
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.putImageData(result.imageData, 0, 0);
```

### React 组件使用

```tsx
import { BarcodeElementRenderer } from '@/features/elements/barcode';

function MyComponent() {
  const barcodeElement = {
    id: 'barcode-1',
    type: 'barcode',
    barcodeType: BarcodeType.QRCODE,
    value: 'https://example.com',
    position: { x: 100, y: 100 },
    size: { width: 150, height: 150 },
    // ... 其他属性
  };

  return (
    <Stage width={800} height={600}>
      <Layer>
        <BarcodeElementRenderer 
          element={barcodeElement}
          isSelected={false}
          onSelect={() => console.log('Selected')}
        />
      </Layer>
    </Stage>
  );
}
```

### React Hook 使用

```tsx
import { useBarcodeRenderer } from '@/features/elements/barcode';

function BarcodeComponent({ element }) {
  const {
    canvasRef,
    loading,
    error,
    regenerate,
    validate,
  } = useBarcodeRenderer({
    element,
    autoGenerate: true,
    debounceMs: 300,
    onError: (err) => console.error(err),
  });

  if (loading) return <div>生成中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <canvas ref={canvasRef} />
      <button onClick={regenerate}>重新生成</button>
    </div>
  );
}
```

### 预览组件

```tsx
import { BarcodeElementPreview } from '@/features/elements/barcode';

function PropertyPanel({ element }) {
  return (
    <div>
      <h3>条形码预览</h3>
      <BarcodeElementPreview 
        element={element}
        width={200}
        height={100}
        className="border rounded"
      />
    </div>
  );
}
```

## API 参考

### BarcodeRenderer

#### 方法

- `generate(value: string, options: BarcodeRenderOptions): Promise<BarcodeGenerationResult>`
  生成条形码

- `generateFromElement(element: IBarcodeElement, value: string): Promise<BarcodeGenerationResult>`
  从元素配置生成条形码

- `validate(type: BarcodeType, value: string): Promise<{ valid: boolean; error?: string }>`
  验证条形码值

- `getSupportedTypes(): Promise<{ types: string[]; formats: Record<string, string[]> }>`
  获取支持的条形码类型

- `preheat(values: string[], options: BarcodeRenderOptions): Promise<void>`
  预热缓存

- `clearCache(): void`
  清除所有缓存

- `destroy(): void`
  销毁渲染器

### useBarcodeRenderer Hook

#### 选项

```typescript
interface UseBarcodeRendererOptions {
  element: IBarcodeElement;      // 条形码元素
  value?: string;                // 覆盖元素的值
  onError?: (error: Error) => void;
  onSuccess?: (result: BarcodeGenerationResult) => void;
  autoGenerate?: boolean;        // 自动生成（默认 true）
  debounceMs?: number;          // 防抖延迟（默认 300ms）
}
```

#### 返回值

```typescript
interface UseBarcodeRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageData: ImageData | null;
  loading: boolean;
  error: Error | null;
  regenerate: () => Promise<void>;
  validate: (value?: string) => Promise<{ valid: boolean; error?: string }>;
}
```

## 性能考虑

1. **缓存策略**
   - 相同的值和选项会返回缓存结果
   - 缓存自动过期（5分钟）
   - 最多缓存100个条形码

2. **Worker 管理**
   - 单例模式，全局共享一个 Worker
   - Worker 崩溃时自动重启
   - 支持降级到主线程

3. **渲染优化**
   - 使用 OffscreenCanvas（Worker 中）
   - 防抖处理避免频繁生成
   - 批量预热减少首次加载延迟

## 错误处理

系统会自动处理以下错误情况：

1. **Worker 加载失败**：降级到主线程生成
2. **生成超时**：10秒后超时，返回错误
3. **无效的条形码值**：返回详细的验证错误
4. **Worker 崩溃**：自动重启并重试

## 扩展性

### 添加新的条形码格式

1. 在 Worker 中添加格式映射
2. 实现相应的验证逻辑
3. 添加降级实现（如果需要额外的库）

### 自定义缓存策略

可以通过继承 `BarcodeRenderer` 类来实现自定义缓存：

```typescript
class CustomBarcodeRenderer extends BarcodeRenderer {
  constructor() {
    super();
    this.maxCacheSize = 200;
    this.cacheTimeout = 10 * 60 * 1000; // 10分钟
  }
}
```

## 注意事项

1. Worker 文件必须放在 `public` 目录下
2. 首次加载可能需要下载条形码生成库
3. 某些条形码格式有特定的值要求（如 EAN13 需要12-13位数字）
4. 生成的 ImageData 可以直接用于 Canvas 或转换为其他格式

## 与 Adobe XD 的对比

我们的实现参考了 Adobe XD 的条形码功能，并进行了以下优化：

1. **更好的性能**：使用 Web Worker 避免阻塞
2. **智能缓存**：减少重复生成
3. **更多格式**：支持更多条形码类型
4. **实时预览**：支持动态值更新
5. **错误恢复**：自动降级和重试机制