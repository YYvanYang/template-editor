import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseWorkerOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useWorker(
  workerConstructor: new () => Worker,
  options: UseWorkerOptions = {}
) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  useEffect(() => {
    try {
      // 创建 Worker 实例
      const worker = new workerConstructor();
      workerRef.current = worker;
      
      // 设置消息处理器
      worker.onmessage = (event) => {
        options.onMessage?.(event.data);
      };
      
      // 设置错误处理器
      worker.onerror = (event) => {
        const error = new Error(event.message || 'Worker error');
        setError(error);
        options.onError?.(error);
      };
      
      setIsReady(true);
      
      // 清理函数
      return () => {
        worker.terminate();
        workerRef.current = null;
        setIsReady(false);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create worker');
      setError(error);
      options.onError?.(error);
    }
  }, [workerConstructor]);
  
  const postMessage = useCallback((message: any) => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage(message);
    } else {
      console.warn('Worker is not ready');
    }
  }, [isReady]);
  
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
    }
  }, []);
  
  return {
    isReady,
    error,
    postMessage,
    terminate
  };
}

// 使用示例：
// import ExampleWorker from '@/workers/example.worker.ts';
// 
// const MyComponent = () => {
//   const { postMessage, isReady } = useWorker(ExampleWorker, {
//     onMessage: (data) => {
//       console.log('Received from worker:', data);
//     }
//   });
//   
//   const handleCompute = () => {
//     if (isReady) {
//       postMessage({ type: 'COMPUTE', data: 42 });
//     }
//   };
//   
//   return <button onClick={handleCompute}>Start Computation</button>;
// };