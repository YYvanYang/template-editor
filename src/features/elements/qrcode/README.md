# 二维码生成系统

专业的二维码生成系统，支持高度自定义的样式、Logo 嵌入、渐变色彩等高级特性。

## 特性

### 核心功能
- ✅ 支持 L/M/Q/H 四级纠错
- ✅ Web Worker 异步生成，不阻塞主线程
- ✅ 智能缓存机制，提升重复生成性能
- ✅ 支持批量生成
- ✅ 数据绑定支持

### 样式定制
- ✅ 多种点样式：方形、圆点、圆角、优雅等
- ✅ 多种角样式：方形、圆点、超圆角
- ✅ 支持线性/径向渐变
- ✅ Logo 嵌入支持
- ✅ 自定义颜色和边距

### 预设样式
- 微信风格
- 支付宝风格
- 现代渐变风格
- 经典黑白风格
- 彩色风格

## 使用示例

### 基础使用

```typescript
import { QRCodeElement } from '@/features/elements/qrcode';

// 创建二维码元素
const qrcode = new QRCodeElement({
  x: 100,
  y: 100,
  width: 200,
  height: 200,
  value: 'https://example.com',
  errorCorrection: 'M',
});
```

### React 组件中使用

```tsx
import { QRCodeElementRenderer } from '@/features/elements/qrcode';

function MyComponent() {
  const element = {
    id: '1',
    type: 'qrcode',
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    value: 'Hello World',
    errorCorrection: 'M',
    style: {
      dotsColor: '#000000',
      backgroundColor: '#FFFFFF',
    }
  };
  
  return (
    <QRCodeElementRenderer
      element={element}
      isSelected={false}
      onSelect={(e) => console.log('Selected')}
    />
  );
}
```

### 使用 Hook 生成二维码

```tsx
import { useQRCodeGenerator } from '@/features/elements/qrcode';

function QRGenerator() {
  const { dataUrl, isLoading, error, generate } = useQRCodeGenerator();
  
  const handleGenerate = () => {
    generate({
      value: 'https://example.com',
      size: 300,
      errorCorrectionLevel: 'H',
      style: {
        dotsGradient: {
          type: 'linear',
          colorStops: [
            { offset: 0, color: '#667EEA' },
            { offset: 1, color: '#764BA2' },
          ],
        },
        dotsStyle: 'dots',
      }
    });
  };
  
  return (
    <div>
      <button onClick={handleGenerate}>生成二维码</button>
      {isLoading && <p>生成中...</p>}
      {error && <p>错误: {error.message}</p>}
      {dataUrl && <img src={dataUrl} alt="QR Code" />}
    </div>
  );
}
```

### 批量生成

```tsx
import { useQRCodeBatch } from '@/features/elements/qrcode';

function BatchGenerator() {
  const urls = ['url1', 'url2', 'url3'];
  const options = urls.map(url => ({
    value: url,
    size: 200,
    errorCorrectionLevel: 'M' as const,
  }));
  
  const { results, errors, isLoading, progress, generate } = useQRCodeBatch(options);
  
  return (
    <div>
      <button onClick={generate}>批量生成</button>
      {isLoading && <progress value={progress} max={100} />}
      <div className="grid grid-cols-3 gap-4">
        {Array.from(results.entries()).map(([index, dataUrl]) => (
          <img key={index} src={dataUrl} alt={`QR ${index}`} />
        ))}
      </div>
    </div>
  );
}
```

### 应用预设样式

```typescript
// 微信风格
qrcode.applyPreset('wechat');

// 支付宝风格
qrcode.applyPreset('alipay');

// 现代渐变风格
qrcode.applyPreset('modern');
```

### 添加 Logo

```typescript
qrcode.setLogo({
  src: '/path/to/logo.png',
  width: 0.3,  // Logo 占二维码 30% 的宽度
  height: 0.3,
  margin: 5,
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
});
```

### 数据绑定

```typescript
// 创建带数据绑定的二维码
const qrcode = new QRCodeElement({
  value: 'default value',
  binding: '{{order.trackingNumber}}',
});

// 渲染时传入数据
<QRCodeElementRenderer
  element={qrcode}
  data={{
    order: {
      trackingNumber: 'TN123456789',
    }
  }}
/>
```

## 性能优化

### 缓存机制
- 自动缓存最近生成的 100 个二维码
- 缓存有效期 1 小时
- 相同参数直接返回缓存结果

### Web Worker
- 复杂二维码在 Worker 中生成
- 不阻塞主线程，保持 UI 流畅
- 自动降级：Worker 不可用时在主线程生成

### 批量生成优化
- 并发控制：同时最多处理 5 个
- 进度反馈：实时显示生成进度
- 错误隔离：单个失败不影响其他

## API 参考

### QRCodeElement

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| value | string | 'https://example.com' | 二维码内容 |
| errorCorrection | 'L' \| 'M' \| 'Q' \| 'H' | 'M' | 纠错级别 |
| style | QRCodeStyle | - | 样式配置 |
| binding | string | - | 数据绑定表达式 |

### QRCodeStyle

| 属性 | 类型 | 说明 |
|-----|------|------|
| size | number | 二维码尺寸 |
| margin | number | 边距 |
| backgroundColor | string | 背景色 |
| dotsColor | string | 数据点颜色 |
| dotsGradient | QRCodeGradient | 数据点渐变 |
| dotsStyle | QRCodeDotStyle | 数据点样式 |
| cornersSquareColor | string | 定位角外框颜色 |
| cornersSquareStyle | QRCodeCornerStyle | 定位角外框样式 |
| cornersDotColor | string | 定位角内点颜色 |
| cornersDotStyle | QRCodeCornerStyle | 定位角内点样式 |
| logo | QRCodeLogo | Logo 配置 |

## 注意事项

1. **二维码内容限制**：最大支持 4000 个字符
2. **纠错级别选择**：
   - L (7%)：数据量大时使用
   - M (15%)：一般用途（默认）
   - Q (25%)：有 Logo 时推荐
   - H (30%)：恶劣环境或需要最高可靠性
3. **Logo 大小**：建议不超过二维码面积的 30%
4. **性能考虑**：复杂样式（如渐变）会增加生成时间

## 依赖项

需要安装以下依赖：

```bash
pnpm add qr-code-styling
```

## 测试

```bash
# 运行测试
pnpm test qrcode

# 运行性能测试
pnpm test:perf qrcode
```