/// <reference lib="webworker" />

// Worker 模块声明
declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  
  export default WebpackWorker;
}

// Worker 消息类型定义示例
export interface WorkerMessage {
  type: string;
  data?: any;
}

export interface WorkerResponse {
  type: string;
  result?: any;
  error?: Error;
}