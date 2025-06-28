import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TemplateIO } from './template-io';
import { Template, ExportFormat, PaperSize, PaperOrientation, TEMPLATE_VERSION } from '../types/template.types';
import { ElementType } from '@/features/elements/types';

// Mock DOM APIs
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('TemplateIO', () => {
  let mockTemplate: Template;
  
  beforeEach(() => {
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
            style: {
              fontSize: 14,
              fontFamily: 'Arial',
              color: '#000000',
            },
          },
        ],
      },
    };
    
    // Reset DOM mocks
    vi.clearAllMocks();
  });
  
  describe('exportTemplate', () => {
    it('应该导出为 JSON 格式', async () => {
      const result = await TemplateIO.exportTemplate(mockTemplate, {
        format: ExportFormat.JSON,
      });
      
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/json');
      
      // 读取 Blob 内容
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(result);
      });
      const data = JSON.parse(text);
      expect(data.__type).toBe('template');
      expect(data.metadata.name).toBe('Test Template');
    });
    
    it('应该支持压缩导出', async () => {
      const result = await TemplateIO.exportTemplate(mockTemplate, {
        format: ExportFormat.JSON,
        compress: true,
      });
      
      expect(result).toBeInstanceOf(Blob);
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(result);
      });
      // 压缩后的数据不应该是有效的 JSON
      expect(() => JSON.parse(text)).toThrow();
    });
    
    it('应该导出为 CNPL 格式', async () => {
      const result = await TemplateIO.exportTemplate(mockTemplate, {
        format: ExportFormat.CNPL,
      });
      
      expect(typeof result).toBe('string');
      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<layout>');
      expect(result).toContain('<page');
      expect(result).toContain('<text');
    });
    
    it('应该拒绝不支持的格式', async () => {
      await expect(
        TemplateIO.exportTemplate(mockTemplate, {
          format: ExportFormat.PDF,
        })
      ).rejects.toThrow('PDF export not implemented');
    });
  });
  
  describe('importTemplate', () => {
    it('应该从 JSON 字符串导入', async () => {
      const json = JSON.stringify({
        __type: 'template',
        __version: TEMPLATE_VERSION,
        ...mockTemplate,
      });
      
      const result = await TemplateIO.importTemplate(json);
      
      expect(result.metadata.name).toBe('Test Template');
      expect(result.content.elements.length).toBe(1);
    });
    
    it('应该从文件导入', async () => {
      const json = JSON.stringify({
        __type: 'template',
        __version: TEMPLATE_VERSION,
        ...mockTemplate,
      });
      
      const file = new File([json], 'template.json', { type: 'application/json' });
      const result = await TemplateIO.importTemplate(file);
      
      expect(result.metadata.name).toBe('Test Template');
    });
    
    it('应该自动检测 JSON 格式', async () => {
      const json = JSON.stringify({
        __type: 'template',
        __version: TEMPLATE_VERSION,
        ...mockTemplate,
      });
      
      // 不指定格式，应该自动检测
      const result = await TemplateIO.importTemplate(json);
      
      expect(result.metadata.name).toBe('Test Template');
    });
    
    it('应该拒绝无法识别的格式', async () => {
      const invalidData = 'invalid template data';
      
      await expect(
        TemplateIO.importTemplate(invalidData)
      ).rejects.toThrow('Unable to detect file format');
    });
  });
  
  describe('downloadTemplate', () => {
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let clickSpy: any;
    
    beforeEach(() => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      clickSpy = mockAnchor.click;
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
    });
    
    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
    
    it('应该下载 JSON 文件', async () => {
      await TemplateIO.downloadTemplate(mockTemplate, 'template.json', {
        format: ExportFormat.JSON,
      });
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
    
    it('应该下载 CNPL 文件', async () => {
      await TemplateIO.downloadTemplate(mockTemplate, 'template.cnpl', {
        format: ExportFormat.CNPL,
      });
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
      
      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('template.cnpl');
      expect(anchor.href).toContain('data:text/plain');
    });
  });
  
  describe('importFromFile', () => {
    it('应该从文件选择器导入', async () => {
      const mockFile = new File(
        [JSON.stringify({
          __type: 'template',
          __version: TEMPLATE_VERSION,
          ...mockTemplate,
        })],
        'template.json',
        { type: 'application/json' }
      );
      
      const mockInput = {
        type: '',
        accept: '',
        click: vi.fn(),
        onchange: null as any,
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement')
        .mockReturnValue(mockInput as any);
      
      const importPromise = TemplateIO.importFromFile();
      
      // 触发文件选择
      expect(mockInput.click).toHaveBeenCalled();
      expect(mockInput.accept).toBe('.json,.cnpl');
      
      // 模拟文件选择
      const changeEvent = { target: { files: [mockFile] } };
      await mockInput.onchange(changeEvent);
      
      const result = await importPromise;
      expect(result.metadata.name).toBe('Test Template');
      
      createElementSpy.mockRestore();
    });
  });
});