/**
 * 本地存储服务实现
 * 使用 localStorage 存储模板数据
 */

import { IStorageService, StorageResult, StorageItemMetadata, StorageQueryOptions, StorageStats } from '../../types/storage.types';
import { Template } from '../../types/template.types';
import { TemplateSerializer } from '../template-serializer';
import { nanoid } from 'nanoid';

const STORAGE_PREFIX = 'template-editor:';
const METADATA_KEY = `${STORAGE_PREFIX}metadata`;
const TEMPLATE_KEY_PREFIX = `${STORAGE_PREFIX}template:`;

export class LocalStorageService implements IStorageService {
  private metadata: Map<string, StorageItemMetadata> = new Map();

  constructor() {
    this.loadMetadata();
  }

  /**
   * 保存模板
   */
  async save(template: Template): Promise<StorageResult<StorageItemMetadata>> {
    try {
      // 确保模板有 ID
      if (!template.metadata.id) {
        template.metadata.id = nanoid();
      }

      // 序列化模板
      const serialized = TemplateSerializer.serialize(template);
      const size = new Blob([serialized]).size;

      // 创建元数据
      const metadata: StorageItemMetadata = {
        id: template.metadata.id,
        name: template.metadata.name,
        createdAt: template.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        size,
        version: template.metadata.version,
        tags: template.metadata.tags,
      };

      // 保存到 localStorage
      const key = `${TEMPLATE_KEY_PREFIX}${template.metadata.id}`;
      localStorage.setItem(key, serialized);

      // 更新元数据
      this.metadata.set(template.metadata.id, metadata);
      this.saveMetadata();

      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save template',
      };
    }
  }

  /**
   * 加载模板
   */
  async load(id: string): Promise<StorageResult<Template>> {
    try {
      const key = `${TEMPLATE_KEY_PREFIX}${id}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      const template = TemplateSerializer.deserialize(data);
      return {
        success: true,
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load template',
      };
    }
  }

  /**
   * 删除模板
   */
  async delete(id: string): Promise<StorageResult<void>> {
    try {
      const key = `${TEMPLATE_KEY_PREFIX}${id}`;
      localStorage.removeItem(key);

      this.metadata.delete(id);
      this.saveMetadata();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      };
    }
  }

  /**
   * 列出所有模板
   */
  async list(options: StorageQueryOptions = {}): Promise<StorageResult<StorageItemMetadata[]>> {
    try {
      let items = Array.from(this.metadata.values());

      // 搜索过滤
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // 标签过滤
      if (options.tags && options.tags.length > 0) {
        items = items.filter(item => 
          options.tags!.every(tag => item.tags?.includes(tag))
        );
      }

      // 排序
      if (options.sortBy) {
        const order = options.sortOrder === 'desc' ? -1 : 1;
        items.sort((a, b) => {
          const aVal = a[options.sortBy!];
          const bVal = b[options.sortBy!];
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * order;
          }
          
          return ((aVal as any) - (bVal as any)) * order;
        });
      }

      // 分页
      if (options.limit) {
        const offset = options.offset || 0;
        items = items.slice(offset, offset + options.limit);
      }

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list templates',
      };
    }
  }

  /**
   * 检查模板是否存在
   */
  async exists(id: string): Promise<boolean> {
    return this.metadata.has(id);
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<StorageResult<StorageStats>> {
    try {
      const totalItems = this.metadata.size;
      let totalSize = 0;

      // 计算总大小
      for (const metadata of this.metadata.values()) {
        totalSize += metadata.size;
      }

      // 估算 localStorage 使用情况
      const usedSpace = new Blob([localStorage.toString()]).size;
      const availableSpace = 5 * 1024 * 1024; // 假设 5MB 限制

      return {
        success: true,
        data: {
          totalItems,
          totalSize,
          usedSpace,
          availableSpace: availableSpace - usedSpace,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      };
    }
  }

  /**
   * 加载元数据
   */
  private loadMetadata(): void {
    try {
      const data = localStorage.getItem(METADATA_KEY);
      if (data) {
        const metadata = JSON.parse(data) as StorageItemMetadata[];
        this.metadata = new Map(metadata.map(item => [item.id, item]));
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
      this.metadata = new Map();
    }
  }

  /**
   * 保存元数据
   */
  private saveMetadata(): void {
    try {
      const metadata = Array.from(this.metadata.values());
      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  /**
   * 清空所有数据（用于测试）
   */
  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    this.metadata.clear();
  }
}