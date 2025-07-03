import { BaseElement } from '../BaseElement';
import type { IQRCodeElement, QRCodeStyle, QRCodeErrorCorrection, QRCODE_DEFAULTS } from '../types/qrcode.types';
import { nanoid } from 'nanoid';

/**
 * 二维码元素类
 */
export class QRCodeElement extends BaseElement implements IQRCodeElement {
  type: 'qrcode' = 'qrcode';
  value: string;
  errorCorrection?: QRCodeErrorCorrection;
  style?: QRCodeStyle;
  binding?: string;
  
  constructor(data: Partial<IQRCodeElement> = {}) {
    super(data);
    
    // 使用 QRCODE_DEFAULTS 设置默认值
    this.value = data.value || 'https://example.com';
    this.errorCorrection = data.errorCorrection || 'M' as QRCodeErrorCorrection;
    this.style = {
      ...this.getDefaultStyle(),
      ...data.style,
    };
    this.binding = data.binding;
    
    // 设置默认尺寸
    if (!data.bounds?.width) this.bounds.width = 200;
    if (!data.bounds?.height) this.bounds.height = 200;
  }
  
  /**
   * 获取默认样式
   */
  private getDefaultStyle(): QRCodeStyle {
    return {
      size: 200,
      margin: 16,
      dotsColor: '#000000',
      backgroundColor: '#FFFFFF',
      dotsStyle: 'square' as any,
    };
  }
  
  /**
   * 克隆元素
   */
  clone(): QRCodeElement {
    return new QRCodeElement({
      ...this.toJSON(),
      id: nanoid(),
    });
  }
  
  /**
   * 转换为 JSON
   */
  toJSON(): IQRCodeElement {
    return {
      id: this.id,
      type: this.type,
      bounds: this.bounds,
      rotation: this.rotation,
      visible: this.visible,
      locked: this.locked,
      opacity: this.opacity,
      value: this.value,
      errorCorrection: this.errorCorrection,
      style: this.style,
      binding: this.binding,
    };
  }
  
  /**
   * 从 JSON 创建
   */
  static fromJSON(data: IQRCodeElement): QRCodeElement {
    return new QRCodeElement(data);
  }
  
  /**
   * 验证元素数据
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 验证基础属性
    const baseValidation = super.validate();
    if (!baseValidation.valid) {
      errors.push(...baseValidation.errors);
    }
    
    // 验证二维码特定属性
    if (!this.value && !this.binding) {
      errors.push('二维码内容不能为空');
    }
    
    if (this.value && this.value.length > 4000) {
      errors.push('二维码内容长度不能超过4000个字符');
    }
    
    // 验证纠错级别
    const validErrorLevels = ['L', 'M', 'Q', 'H'];
    if (this.errorCorrection && !validErrorLevels.includes(this.errorCorrection)) {
      errors.push('无效的纠错级别');
    }
    
    // 验证尺寸
    if (this.bounds.width !== this.bounds.height) {
      errors.push('二维码宽高必须相等');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * 更新二维码内容
   */
  updateValue(value: string): void {
    this.value = value;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新纠错级别
   */
  updateErrorCorrection(level: QRCodeErrorCorrection): void {
    this.errorCorrection = level;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新样式
   */
  updateStyle(style: Partial<QRCodeStyle>): void {
    this.style = {
      ...this.style,
      ...style,
    };
    this.updatedAt = new Date();
  }
  
  /**
   * 设置 Logo
   */
  setLogo(logo: QRCodeStyle['logo'] | null): void {
    if (!this.style) {
      this.style = this.getDefaultStyle();
    }
    
    if (logo) {
      this.style.logo = logo;
    } else {
      delete this.style.logo;
    }
    
    this.updatedAt = new Date();
  }
  
  /**
   * 应用预设样式
   */
  applyPreset(preset: 'default' | 'wechat' | 'alipay' | 'modern' | 'classic' | 'colorful'): void {
    // 导入预设样式函数
    import('../types/qrcode.types').then(({ getPresetStyle }) => {
      const presetStyle = getPresetStyle(preset as any);
      this.updateStyle(presetStyle);
    });
  }
  
  /**
   * 获取实际显示的值（考虑数据绑定）
   */
  getDisplayValue(data?: Record<string, any>): string {
    if (this.binding && data) {
      try {
        // 简单的属性访问解析
        const keys = this.binding.replace('{{', '').replace('}}', '').trim().split('.');
        let value: any = data;
        
        for (const key of keys) {
          value = value[key];
          if (value === undefined || value === null) {
            return this.value; // 绑定失败时返回默认值
          }
        }
        
        return String(value);
      } catch {
        return this.value;
      }
    }
    
    return this.value;
  }
  
  /**
   * 获取元素边界
   */
  getBounds(): { left: number; top: number; right: number; bottom: number } {
    // 考虑旋转的情况
    if (this.rotation === 0) {
      return {
        left: this.bounds.x,
        top: this.bounds.y,
        right: this.bounds.x + this.bounds.width,
        bottom: this.bounds.y + this.bounds.height,
      };
    }
    
    // 计算旋转后的边界
    const centerX = this.bounds.x + this.bounds.width / 2;
    const centerY = this.bounds.y + this.bounds.height / 2;
    const rad = (this.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // 四个角的坐标
    const corners = [
      { x: this.bounds.x, y: this.bounds.y },
      { x: this.bounds.x + this.bounds.width, y: this.bounds.y },
      { x: this.bounds.x + this.bounds.width, y: this.bounds.y + this.bounds.height },
      { x: this.bounds.x, y: this.bounds.y + this.bounds.height },
    ];
    
    // 旋转每个角
    const rotatedCorners = corners.map(corner => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    });
    
    // 找出边界
    const xs = rotatedCorners.map(c => c.x);
    const ys = rotatedCorners.map(c => c.y);
    
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
    };
  }
}