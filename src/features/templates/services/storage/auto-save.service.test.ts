import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoSaveService } from './auto-save.service';
import { LocalStorageService } from './local-storage.service';
import { AutoSaveConfig, StorageEvent } from '../../types/storage.types';
import { Template, PaperSize, PaperOrientation, TEMPLATE_VERSION } from '../../types/template.types';
import { ElementType } from '@/features/elements/types';

// Mock timers
vi.useFakeTimers();

describe('AutoSaveService', () => {
  let autoSaveService: AutoSaveService;
  let storageService: LocalStorageService;
  let config: AutoSaveConfig;
  let mockTemplate: Template;
  
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    storageService = new LocalStorageService();
    
    config = {
      enabled: true,
      interval: 30000, // 30 seconds
      maxRetries: 3,
      conflictResolution: 'overwrite',
    };
    
    autoSaveService = new AutoSaveService(storageService, config);
    
    mockTemplate = {
      metadata: {
        id: 'template-1',
        name: 'Test Template',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: TEMPLATE_VERSION,
      },
      pageSettings: {
        size: PaperSize.A4,
        width: 210,
        height: 297,
        orientation: PaperOrientation.PORTRAIT,
        margins: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
      },
      content: {
        elements: [
          {
            id: 'element-1',
            type: ElementType.TEXT,
            x: 10,
            y: 10,
            width: 100,
            height: 20,
            rotation: 0,
            locked: false,
            visible: true,
            content: 'Hello World',
          },
        ],
      },
    };
  });
  
  afterEach(() => {
    autoSaveService.destroy();
    vi.clearAllMocks();
    vi.clearAllTimers();
  });
  
  describe('enable/disable', () => {
    it('应该启用自动保存', () => {
      autoSaveService.disable();
      autoSaveService.setTemplate(mockTemplate);
      autoSaveService.enable();
      
      // 检查是否设置了定时器
      expect(vi.getTimerCount()).toBe(1);
    });
    
    it('应该禁用自动保存', () => {
      autoSaveService.setTemplate(mockTemplate);
      expect(vi.getTimerCount()).toBe(1);
      
      autoSaveService.disable();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
  
  describe('setTemplate', () => {
    it('应该设置模板并启动自动保存', () => {
      autoSaveService.setTemplate(mockTemplate);
      
      expect(vi.getTimerCount()).toBe(1);
    });
    
    it('应该在设置空模板时取消自动保存', () => {
      autoSaveService.setTemplate(mockTemplate);
      expect(vi.getTimerCount()).toBe(1);
      
      autoSaveService.setTemplate(null);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
  
  describe('saveNow', () => {
    it('应该立即保存模板', async () => {
      const saveSpy = vi.spyOn(storageService, 'save').mockResolvedValue({
        success: true,
        data: {
          id: 'template-1',
          name: 'Test Template',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          size: 1000,
          version: TEMPLATE_VERSION,
        },
      });
      
      const saveListener = vi.fn();
      autoSaveService.on('save', saveListener);
      
      autoSaveService.setTemplate(mockTemplate);
      await autoSaveService.saveNow();
      
      expect(saveSpy).toHaveBeenCalledWith(mockTemplate);
      expect(saveListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEvent.SAVE_START,
          templateId: 'template-1',
        })
      );
      expect(saveListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEvent.SAVE_SUCCESS,
          templateId: 'template-1',
        })
      );
    });
    
    it('应该处理保存错误', async () => {
      const saveSpy = vi.spyOn(storageService, 'save').mockResolvedValue({
        success: false,
        error: 'Save failed',
      });
      
      const saveListener = vi.fn();
      autoSaveService.on('save', saveListener);
      
      autoSaveService.setTemplate(mockTemplate);
      await autoSaveService.saveNow();
      
      expect(saveSpy).toHaveBeenCalled();
      expect(saveListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEvent.SAVE_ERROR,
          templateId: 'template-1',
        })
      );
    });
  });
  
  describe('auto save timer', () => {
    it('应该按照设定的间隔自动保存', async () => {
      const saveSpy = vi.spyOn(storageService, 'save').mockResolvedValue({
        success: true,
        data: {
          id: 'template-1',
          name: 'Test Template',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          size: 1000,
          version: TEMPLATE_VERSION,
        },
      });
      
      autoSaveService.setTemplate(mockTemplate);
      
      // 初始时不应该保存
      expect(saveSpy).not.toHaveBeenCalled();
      
      // 快进到第一个保存点
      await vi.advanceTimersByTimeAsync(30000);
      
      expect(saveSpy).toHaveBeenCalledTimes(1);
      
      // 快进到第二个保存点
      await vi.advanceTimersByTimeAsync(30000);
      
      expect(saveSpy).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('needsSave', () => {
    it('应该检测模板是否需要保存', async () => {
      autoSaveService.setTemplate(mockTemplate);
      
      // 初始时需要保存
      expect(autoSaveService.needsSave()).toBe(true);
      
      // 保存后不需要
      vi.spyOn(storageService, 'save').mockResolvedValue({
        success: true,
        data: {
          id: 'template-1',
          name: 'Test Template',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          size: 1000,
          version: TEMPLATE_VERSION,
        },
      });
      
      await autoSaveService.saveNow();
      expect(autoSaveService.needsSave()).toBe(false);
      
      // 修改后需要保存
      mockTemplate.content.elements[0].content = 'Modified';
      expect(autoSaveService.needsSave()).toBe(true);
    });
  });
  
  describe('conflict detection', () => {
    it('应该检测冲突并触发事件', async () => {
      // 设置手动冲突解决
      autoSaveService.updateConfig({ conflictResolution: 'manual' });
      
      // 模拟存在冲突
      vi.spyOn(storageService, 'exists').mockResolvedValue(true);
      vi.spyOn(storageService, 'load').mockResolvedValue({
        success: true,
        data: {
          ...mockTemplate,
          metadata: {
            ...mockTemplate.metadata,
            updatedAt: '2024-01-02T00:00:00.000Z', // 更新的版本
          },
        },
      });
      
      const saveListener = vi.fn();
      autoSaveService.on('save', saveListener);
      
      autoSaveService.setTemplate(mockTemplate);
      await autoSaveService.saveNow();
      
      expect(saveListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEvent.CONFLICT_DETECTED,
          templateId: 'template-1',
        })
      );
    });
  });
  
  describe('retry logic', () => {
    it('应该在失败后重试', async () => {
      let callCount = 0;
      const saveSpy = vi.spyOn(storageService, 'save').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            success: false,
            error: 'Network error',
          });
        }
        return Promise.resolve({
          success: true,
          data: {
            id: 'template-1',
            name: 'Test Template',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            size: 1000,
            version: TEMPLATE_VERSION,
          },
        });
      });
      
      autoSaveService.setTemplate(mockTemplate);
      await autoSaveService.saveNow();
      
      // 第一次失败
      expect(saveSpy).toHaveBeenCalledTimes(1);
      
      // 第一次重试（2秒后）
      await vi.advanceTimersByTimeAsync(2000);
      expect(saveSpy).toHaveBeenCalledTimes(2);
      
      // 第二次重试（4秒后）
      await vi.advanceTimersByTimeAsync(4000);
      expect(saveSpy).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('updateConfig', () => {
    it('应该更新配置', () => {
      autoSaveService.setTemplate(mockTemplate);
      
      // 禁用自动保存
      autoSaveService.updateConfig({ enabled: false });
      expect(vi.getTimerCount()).toBe(0);
      
      // 重新启用
      autoSaveService.updateConfig({ enabled: true });
      expect(vi.getTimerCount()).toBe(1);
      
      // 更改间隔
      autoSaveService.updateConfig({ interval: 60000 });
      // 仍然有一个定时器
      expect(vi.getTimerCount()).toBe(1);
    });
  });
  
  describe('getLastSaveTime', () => {
    it('应该返回上次保存时间', async () => {
      autoSaveService.setTemplate(mockTemplate);
      
      // 保存前没有时间
      expect(autoSaveService.getLastSaveTime()).toBeNull();
      
      // 保存后有时间
      vi.spyOn(storageService, 'save').mockResolvedValue({
        success: true,
        data: {
          id: 'template-1',
          name: 'Test Template',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          size: 1000,
          version: TEMPLATE_VERSION,
        },
      });
      
      await autoSaveService.saveNow();
      
      const lastSaveTime = autoSaveService.getLastSaveTime();
      expect(lastSaveTime).toBeInstanceOf(Date);
      expect(lastSaveTime?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});