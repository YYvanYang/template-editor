import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageService } from './local-storage.service';
import { Template, PaperSize, PaperOrientation, TEMPLATE_VERSION } from '../../types/template.types';
import { ElementType } from '@/features/elements/types';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let mockTemplate: Template;
  let localStorageMock: Storage;
  
  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
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
    
    service = new LocalStorageService();
    
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
    vi.clearAllMocks();
  });
  
  describe('save', () => {
    it('应该保存模板到 localStorage', async () => {
      const result = await service.save(mockTemplate);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('template-1');
      expect(result.data?.name).toBe('Test Template');
      
      // 检查 localStorage 调用
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // 模板 + 元数据
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('template:template-1'),
        expect.any(String)
      );
    });
    
    it('应该为没有 ID 的模板生成新 ID', async () => {
      const templateWithoutId = { ...mockTemplate };
      templateWithoutId.metadata.id = '';
      
      const result = await service.save(templateWithoutId);
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.id).not.toBe('');
    });
    
    it('应该处理保存错误', async () => {
      vi.mocked(localStorageMock.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const result = await service.save(mockTemplate);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
    });
  });
  
  describe('load', () => {
    it('应该从 localStorage 加载模板', async () => {
      const serialized = JSON.stringify({
        __type: 'template',
        __version: TEMPLATE_VERSION,
        ...mockTemplate,
      });
      
      vi.mocked(localStorageMock.getItem).mockReturnValue(serialized);
      
      const result = await service.load('template-1');
      
      expect(result.success).toBe(true);
      expect(result.data?.metadata.id).toBe('template-1');
      expect(result.data?.metadata.name).toBe('Test Template');
    });
    
    it('应该处理不存在的模板', async () => {
      vi.mocked(localStorageMock.getItem).mockReturnValue(null);
      
      const result = await service.load('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });
    
    it('应该处理无效的 JSON', async () => {
      vi.mocked(localStorageMock.getItem).mockReturnValue('invalid json');
      
      const result = await service.load('template-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON format');
    });
  });
  
  describe('delete', () => {
    beforeEach(() => {
      // 模拟元数据已存在
      vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
        if (key === 'template-editor:metadata') {
          return JSON.stringify([{
            id: 'template-1',
            name: 'Test Template',
            size: 1000,
          }]);
        }
        return null;
      });
      
      // 重新创建服务以加载元数据
      service = new LocalStorageService();
    });
    
    it('应该删除模板', async () => {
      const result = await service.delete('template-1');
      
      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'template-editor:template:template-1'
      );
      
      // 检查元数据更新
      const exists = await service.exists('template-1');
      expect(exists).toBe(false);
    });
  });
  
  describe('list', () => {
    beforeEach(() => {
      const metadata = [
        {
          id: 'template-1',
          name: 'Template A',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          size: 1000,
          version: '1.0.0',
          tags: ['invoice', 'business'],
        },
        {
          id: 'template-2',
          name: 'Template B',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          size: 2000,
          version: '1.0.0',
          tags: ['receipt', 'personal'],
        },
      ];
      
      vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
        if (key === 'template-editor:metadata') {
          return JSON.stringify(metadata);
        }
        return null;
      });
      
      service = new LocalStorageService();
    });
    
    it('应该列出所有模板', async () => {
      const result = await service.list();
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });
    
    it('应该支持搜索', async () => {
      const result = await service.list({ search: 'Template A' });
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].name).toBe('Template A');
    });
    
    it('应该支持标签过滤', async () => {
      const result = await service.list({ tags: ['invoice'] });
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].id).toBe('template-1');
    });
    
    it('应该支持排序', async () => {
      const result = await service.list({ sortBy: 'name', sortOrder: 'desc' });
      
      expect(result.success).toBe(true);
      expect(result.data?.[0].name).toBe('Template B');
      expect(result.data?.[1].name).toBe('Template A');
    });
    
    it('应该支持分页', async () => {
      const result = await service.list({ limit: 1, offset: 1 });
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].id).toBe('template-2');
    });
  });
  
  describe('exists', () => {
    beforeEach(() => {
      vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
        if (key === 'template-editor:metadata') {
          return JSON.stringify([{ id: 'template-1' }]);
        }
        return null;
      });
      
      service = new LocalStorageService();
    });
    
    it('应该检查模板是否存在', async () => {
      expect(await service.exists('template-1')).toBe(true);
      expect(await service.exists('template-2')).toBe(false);
    });
  });
  
  describe('getStats', () => {
    beforeEach(() => {
      vi.mocked(localStorageMock.getItem).mockImplementation((key) => {
        if (key === 'template-editor:metadata') {
          return JSON.stringify([
            { id: 'template-1', size: 1000 },
            { id: 'template-2', size: 2000 },
          ]);
        }
        return null;
      });
      
      service = new LocalStorageService();
    });
    
    it('应该返回存储统计信息', async () => {
      const result = await service.getStats();
      
      expect(result.success).toBe(true);
      expect(result.data?.totalItems).toBe(2);
      expect(result.data?.totalSize).toBe(3000);
      expect(result.data?.usedSpace).toBeGreaterThan(0);
      expect(result.data?.availableSpace).toBeGreaterThan(0);
    });
  });
  
  describe('clear', () => {
    it('应该清空所有模板数据', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          ...localStorageMock,
          // Mock Object.keys(localStorage)
          'template-editor:metadata': 'data',
          'template-editor:template:1': 'data',
          'other-key': 'data',
        },
        writable: true,
      });
      
      Object.keys = vi.fn().mockReturnValue([
        'template-editor:metadata',
        'template-editor:template:1',
        'other-key',
      ]);
      
      await service.clear();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('template-editor:metadata');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('template-editor:template:1');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other-key');
    });
  });
});