# Web Worker 使用指南

## 概述
本项目已配置支持 Web Worker，用于处理耗时的计算任务，避免阻塞主线程。

## TypeScript 配置
- **主配置** (`tsconfig.app.json`): 已添加 `WebWorker` 到 lib 数组
- **Worker 专用配置** (`tsconfig.worker.json`): 专门用于 Worker 文件的 TypeScript 配置
- **类型声明** (`src/types/worker.d.ts`): Worker 模块的类型声明

## 文件命名规范
- Worker 文件必须以 `.worker.ts` 结尾
- Worker 文件应放置在 `src/workers/` 目录下或任何以 `workers/` 命名的子目录中

## 使用方法

### 1. 创建 Worker 文件
```typescript
// src/workers/myTask.worker.ts
/// <reference lib="webworker" />

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  // 处理消息
  switch (type) {
    case 'PROCESS':
      const result = processData(data);
      self.postMessage({ type: 'RESULT', result });
      break;
  }
});

function processData(data: any) {
  // 执行耗时操作
  return data;
}

export {};
```

### 2. 在 React 组件中使用 Worker

#### 方法一：使用 useWorker Hook
```typescript
import { useWorker } from '@/hooks/useWorker';
import MyTaskWorker from '@/workers/myTask.worker.ts';

function MyComponent() {
  const { postMessage, isReady } = useWorker(MyTaskWorker, {
    onMessage: (data) => {
      if (data.type === 'RESULT') {
        console.log('处理结果:', data.result);
      }
    }
  });
  
  const handleProcess = () => {
    if (isReady) {
      postMessage({ type: 'PROCESS', data: { /* ... */ } });
    }
  };
  
  return <button onClick={handleProcess}>开始处理</button>;
}
```

#### 方法二：直接使用 Worker
```typescript
import MyTaskWorker from '@/workers/myTask.worker.ts';

function MyComponent() {
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    const worker = new MyTaskWorker();
    workerRef.current = worker;
    
    worker.onmessage = (event) => {
      console.log('Worker 消息:', event.data);
    };
    
    return () => {
      worker.terminate();
    };
  }, []);
  
  // ...
}
```

### 3. Vite 中的 Worker 导入
Vite 支持多种 Worker 导入方式：

```typescript
// 标准导入（推荐）
import MyWorker from './my.worker.ts';
const worker = new MyWorker();

// 内联 Worker
import MyWorker from './my.worker.ts?worker&inline';

// 获取 Worker URL
import workerUrl from './my.worker.ts?worker&url';
```

## 最佳实践

1. **错误处理**: 始终为 Worker 添加错误处理
2. **内存管理**: 不再需要时及时调用 `terminate()`
3. **消息协议**: 定义清晰的消息类型和数据结构
4. **性能监控**: 监控 Worker 的执行时间和资源使用

## 适用场景

- 图像处理和滤镜
- 大数据集的排序和过滤
- 复杂的数学计算
- 文本解析和处理
- 实时数据转换

## 注意事项

1. Worker 中无法访问 DOM
2. Worker 中无法使用某些浏览器 API
3. 数据传递使用结构化克隆算法，某些对象类型无法传递
4. 避免频繁创建和销毁 Worker，考虑使用 Worker 池