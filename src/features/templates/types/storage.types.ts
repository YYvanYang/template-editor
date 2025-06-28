/**
 * 存储服务类型定义
 */

import { Template } from './template.types';

/**
 * 存储后端类型
 */
export enum StorageBackend {
  LOCAL = 'local',
  CLOUD = 'cloud',
  MEMORY = 'memory',
}

/**
 * 存储项元数据
 */
export interface StorageItemMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  version: string;
  tags?: string[];
  thumbnail?: string;
}

/**
 * 存储操作结果
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 存储查询选项
 */
export interface StorageQueryOptions {
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 存储服务接口
 */
export interface IStorageService {
  /**
   * 保存模板
   */
  save(template: Template): Promise<StorageResult<StorageItemMetadata>>;
  
  /**
   * 加载模板
   */
  load(id: string): Promise<StorageResult<Template>>;
  
  /**
   * 删除模板
   */
  delete(id: string): Promise<StorageResult<void>>;
  
  /**
   * 列出所有模板
   */
  list(options?: StorageQueryOptions): Promise<StorageResult<StorageItemMetadata[]>>;
  
  /**
   * 检查模板是否存在
   */
  exists(id: string): Promise<boolean>;
  
  /**
   * 获取存储统计信息
   */
  getStats(): Promise<StorageResult<StorageStats>>;
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  totalItems: number;
  totalSize: number;
  usedSpace: number;
  availableSpace: number;
}

/**
 * 自动保存配置
 */
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // 毫秒
  maxRetries: number;
  conflictResolution: 'overwrite' | 'rename' | 'manual';
}

/**
 * 存储事件
 */
export enum StorageEvent {
  SAVE_START = 'save:start',
  SAVE_SUCCESS = 'save:success',
  SAVE_ERROR = 'save:error',
  LOAD_START = 'load:start',
  LOAD_SUCCESS = 'load:success',
  LOAD_ERROR = 'load:error',
  DELETE_SUCCESS = 'delete:success',
  DELETE_ERROR = 'delete:error',
  CONFLICT_DETECTED = 'conflict:detected',
}

/**
 * 存储事件数据
 */
export interface StorageEventData {
  type: StorageEvent;
  templateId?: string;
  error?: Error;
  metadata?: StorageItemMetadata;
}

/**
 * 存储冲突信息
 */
export interface StorageConflict {
  localVersion: Template;
  remoteVersion: Template;
  conflictedAt: Date;
  resolution?: 'local' | 'remote' | 'merge';
}