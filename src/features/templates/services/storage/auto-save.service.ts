/**
 * 自动保存服务
 * 实现模板的自动保存功能
 */

import { IStorageService, AutoSaveConfig, StorageEvent, StorageEventData } from '../../types/storage.types';
import { Template } from '../../types/template.types';
import { EventEmitter } from 'events';

export class AutoSaveService extends EventEmitter {
  private config: AutoSaveConfig;
  private storageService: IStorageService;
  private saveTimer: NodeJS.Timeout | null = null;
  private currentTemplate: Template | null = null;
  private lastSavedVersion: string | null = null;
  private retryCount = 0;
  private isEnabled = false;

  constructor(storageService: IStorageService, config: AutoSaveConfig) {
    super();
    this.storageService = storageService;
    this.config = config;
    this.isEnabled = config.enabled;
  }

  /**
   * 启用自动保存
   */
  enable(): void {
    this.isEnabled = true;
    this.scheduleNextSave();
  }

  /**
   * 禁用自动保存
   */
  disable(): void {
    this.isEnabled = false;
    this.cancelScheduledSave();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled && !this.isEnabled) {
      this.enable();
    } else if (!this.config.enabled && this.isEnabled) {
      this.disable();
    }
  }

  /**
   * 设置当前模板
   */
  setTemplate(template: Template | null): void {
    this.currentTemplate = template;
    
    if (template && this.isEnabled) {
      this.scheduleNextSave();
    } else {
      this.cancelScheduledSave();
    }
  }

  /**
   * 立即保存
   */
  async saveNow(): Promise<void> {
    if (!this.currentTemplate) {
      return;
    }

    this.cancelScheduledSave();
    await this.performSave();
    
    if (this.isEnabled) {
      this.scheduleNextSave();
    }
  }

  /**
   * 检查是否需要保存
   */
  needsSave(): boolean {
    if (!this.currentTemplate) {
      return false;
    }

    const currentVersion = this.getTemplateVersion(this.currentTemplate);
    return currentVersion !== this.lastSavedVersion;
  }

  /**
   * 获取上次保存时间
   */
  getLastSaveTime(): Date | null {
    if (!this.currentTemplate || !this.lastSavedVersion) {
      return null;
    }
    
    return new Date(this.currentTemplate.metadata.updatedAt);
  }

  /**
   * 执行保存
   */
  private async performSave(): Promise<void> {
    if (!this.currentTemplate) {
      return;
    }

    const templateId = this.currentTemplate.metadata.id;
    
    this.emit('save', {
      type: StorageEvent.SAVE_START,
      templateId,
    } as StorageEventData);

    try {
      // 检查冲突
      const hasConflict = await this.checkForConflicts();
      if (hasConflict && this.config.conflictResolution === 'manual') {
        this.emit('save', {
          type: StorageEvent.CONFLICT_DETECTED,
          templateId,
        } as StorageEventData);
        return;
      }

      // 保存模板
      const result = await this.storageService.save(this.currentTemplate);
      
      if (result.success) {
        this.lastSavedVersion = this.getTemplateVersion(this.currentTemplate);
        this.retryCount = 0;
        
        this.emit('save', {
          type: StorageEvent.SAVE_SUCCESS,
          templateId,
          metadata: result.data,
        } as StorageEventData);
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (error) {
      this.retryCount++;
      
      this.emit('save', {
        type: StorageEvent.SAVE_ERROR,
        templateId,
        error: error as Error,
      } as StorageEventData);

      // 重试逻辑
      if (this.retryCount < this.config.maxRetries) {
        setTimeout(() => this.performSave(), Math.pow(2, this.retryCount) * 1000);
      }
    }
  }

  /**
   * 检查冲突
   */
  private async checkForConflicts(): Promise<boolean> {
    if (!this.currentTemplate) {
      return false;
    }

    const exists = await this.storageService.exists(this.currentTemplate.metadata.id);
    if (!exists) {
      return false;
    }

    const result = await this.storageService.load(this.currentTemplate.metadata.id);
    if (!result.success || !result.data) {
      return false;
    }

    const savedTemplate = result.data;
    const savedVersion = new Date(savedTemplate.metadata.updatedAt).getTime();
    const currentVersion = new Date(this.currentTemplate.metadata.updatedAt).getTime();

    // 如果保存的版本更新，则存在冲突
    return savedVersion > currentVersion;
  }

  /**
   * 计划下次保存
   */
  private scheduleNextSave(): void {
    this.cancelScheduledSave();
    
    if (this.isEnabled && this.currentTemplate) {
      this.saveTimer = setTimeout(async () => {
        await this.performSave();
        // 只在保存后仍然启用时才继续计划
        if (this.isEnabled) {
          this.scheduleNextSave();
        }
      }, this.config.interval);
    }
  }

  /**
   * 取消计划的保存
   */
  private cancelScheduledSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * 获取模板版本标识
   */
  private getTemplateVersion(template: Template): string {
    // 使用更新时间和内容哈希作为版本标识
    return `${template.metadata.updatedAt}_${this.hashTemplate(template)}`;
  }

  /**
   * 计算模板哈希
   */
  private hashTemplate(template: Template): string {
    // 简单的哈希实现，实际上可以使用更复杂的算法
    const str = JSON.stringify(template.content);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.disable();
    this.removeAllListeners();
    this.currentTemplate = null;
    this.lastSavedVersion = null;
  }
}