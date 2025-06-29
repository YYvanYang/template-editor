# 标尺系统问题修复报告

## 问题描述

垂直标尺（纵坐标）存在以下问题：
1. 刻度计算错误：垂直标尺使用了水平偏移量 (viewport.x) 而不是垂直偏移量 (viewport.y)
2. 0刻度与画布顶部不对齐
3. 拖动画布时垂直标尺刻度显示异常

## 根本原因

在 `RulerCanvas.tsx` 组件中，标尺的坐标计算没有区分水平和垂直方向：
- 所有计算都使用了 `viewport.x`，忽略了垂直标尺应该使用 `viewport.y`
- 刻度可见性判断使用了错误的边界值

## 修复内容

### 1. 修复可见范围计算（第118-121行）
```typescript
// 修复前
const startPixel = -viewport.x;
const endPixel = canvasWidth - viewport.x;

// 修复后
const startPixel = orientation === 'horizontal' ? -viewport.x : -viewport.y;
const endPixel = orientation === 'horizontal' 
  ? canvasWidth - viewport.x 
  : canvasHeight - viewport.y;
```

### 2. 修复刻度位置计算（第127-128行）
```typescript
// 修复前
const pixelPos = value * tickParams.unitConfig.toPx * viewport.scale + viewport.x;

// 修复后
const pixelPos = value * tickParams.unitConfig.toPx * viewport.scale + 
  (orientation === 'horizontal' ? viewport.x : viewport.y);
```

### 3. 修复刻度可见性判断（第131-132行）
```typescript
// 修复前
if (pixelPos < -50 || pixelPos > canvasWidth + 50) return;

// 修复后
const maxPos = orientation === 'horizontal' ? canvasWidth : canvasHeight;
if (pixelPos < -50 || pixelPos > maxPos + 50) return;
```

### 4. 修复鼠标数值标签计算（第216行）
```typescript
// 修复前
const pixelValue = (mousePos - viewport.x) / viewport.scale;

// 修复后
const pixelValue = (mousePos - (orientation === 'horizontal' ? viewport.x : viewport.y)) / viewport.scale;
```

### 5. 修复点击事件坐标计算（第283行）
```typescript
// 修复前
const pixelValue = (clickPos - viewport.x) / viewport.scale;

// 修复后
const pixelValue = (clickPos - (orientation === 'horizontal' ? viewport.x : viewport.y)) / viewport.scale;
```

## 测试验证

修复后，请验证以下场景：
1. **初始状态**：垂直标尺的0刻度应与画布顶部对齐
2. **拖动画布**：垂直标尺刻度应正确跟随画布移动
3. **缩放画布**：垂直标尺刻度间隔应正确调整
4. **鼠标悬停**：垂直标尺上的数值提示应显示正确的位置
5. **创建辅助线**：点击垂直标尺应在正确位置创建辅助线

## 相关文件
- `/home/yvan/developer/cainiao-template-editor/template-editor/src/features/canvas/components/RulerCanvas.tsx`
- `/home/yvan/developer/cainiao-template-editor/template-editor/src/features/canvas/components/CanvasWithRulersFixed.tsx`