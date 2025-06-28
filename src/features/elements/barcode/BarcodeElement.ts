import { BaseElement } from '../types/base.types';
import type { IBarcodeElement, BarcodeStyle } from '../types/barcode.types';
import { BarcodeType, RatioMode, BARCODE_DEFAULTS, is2DBarcode } from '../types/barcode.types';

/**
 * 条码元素类
 * 支持一维条码和二维码的生成与管理
 */
export class BarcodeElement extends BaseElement<IBarcodeElement> {
  constructor(data: Partial<IBarcodeElement>) {
    const barcodeData: IBarcodeElement = {
      id: data.id || `barcode-${Date.now()}`,
      type: 'barcode',
      name: data.name || 'Barcode',
      position: data.position || { x: 0, y: 0 },
      size: data.size || { 
        width: BARCODE_DEFAULTS.width, 
        height: BARCODE_DEFAULTS.height 
      },
      rotation: data.rotation || 0,
      visible: data.visible ?? true,
      locked: data.locked ?? false,
      barcodeType: data.barcodeType || BARCODE_DEFAULTS.barcodeType,
      value: data.value !== undefined ? data.value : BARCODE_DEFAULTS.value,
      ratioMode: data.ratioMode || BARCODE_DEFAULTS.ratioMode,
      style: { ...BARCODE_DEFAULTS.style, ...data.style },
      mode: data.mode,
      primary: data.primary,
      errorCorrection: data.errorCorrection,
      symbolSize: data.symbolSize,
      displayValue: data.displayValue ?? !data.style?.hideText,
      format: data.format,
      encoding: data.encoding,
      width: data.width,
      height: data.height,
      binding: data.binding,
    } as IBarcodeElement;
    
    super(barcodeData);
  }
  
  get data(): IBarcodeElement {
    return this._data;
  }
  
  protected update(updates: Partial<IBarcodeElement>): void {
    Object.assign(this._data, updates);
  }
  
  /**
   * 设置条码值
   */
  setValue(value: string): void {
    this.update({ value });
  }
  
  /**
   * 设置条码类型
   */
  setBarcodeType(type: BarcodeType): void {
    this.update({ barcodeType: type });
    
    // 根据类型调整默认尺寸
    if (is2DBarcode(type)) {
      // 二维码通常是正方形
      const size = Math.min(this._data.size.width, this._data.size.height);
      this.resize(size, size);
    }
  }
  
  /**
   * 设置比例模式
   */
  setRatioMode(mode: RatioMode): void {
    this.update({ ratioMode: mode });
  }
  
  /**
   * 设置样式
   */
  setStyle(style: Partial<BarcodeStyle>): void {
    this.update({ 
      style: { ...this._data.style, ...style },
      displayValue: style.hideText !== undefined ? !style.hideText : this._data.displayValue
    });
  }
  
  /**
   * 设置数据绑定
   */
  setBinding(binding: string | undefined): void {
    this.update({ binding });
  }
  
  /**
   * 设置二维码纠错级别
   */
  setErrorCorrection(level: number): void {
    if (this._data.barcodeType === BarcodeType.QRCODE) {
      this.update({ errorCorrection: level });
    }
  }
  
  /**
   * 判断是否为二维码
   */
  is2D(): boolean {
    return is2DBarcode(this._data.barcodeType);
  }
  
  /**
   * 获取用于生成条码的实际值
   * 如果有绑定则返回绑定表达式，否则返回静态值
   */
  getDisplayValue(): string {
    return this._data.binding || this._data.value;
  }
  
  /**
   * 验证条码值是否有效
   */
  validateValue(value: string): boolean {
    // 基本验证：非空
    if (!value || value.trim() === '') {
      return false;
    }
    
    // 根据条码类型进行特定验证
    switch (this._data.barcodeType) {
      case BarcodeType.EAN8:
        return /^\d{7,8}$/.test(value);
      case BarcodeType.EAN13:
        return /^\d{12,13}$/.test(value);
      case BarcodeType.UPCA:
        return /^\d{11,12}$/.test(value);
      case BarcodeType.UPCE:
        return /^\d{6,8}$/.test(value);
      case BarcodeType.ITF14:
        return /^\d{13,14}$/.test(value);
      case BarcodeType.CODE11:
        return /^[\d\-]+$/.test(value);
      case BarcodeType.CODE39:
        return /^[0-9A-Z\-\.\s\$\/\+\%]+$/.test(value);
      case BarcodeType.POSTNET:
        return /^\d{5}$|^\d{9}$|^\d{11}$/.test(value);
      default:
        // 其他类型暂时只验证非空
        return true;
    }
  }
  
  /**
   * 验证元素
   */
  validate(): string[] {
    const errors: string[] = [];
    
    // 验证尺寸
    if (this._data.size.width <= 0 || this._data.size.height <= 0) {
      errors.push('条码尺寸必须大于0');
    }
    
    // 验证条码值（如果没有绑定）
    if (!this._data.binding) {
      if (!this._data.value) {
        errors.push('条码值不能为空');
      } else if (!this.validateValue(this._data.value)) {
        errors.push(`条码值 "${this._data.value}" 不符合 ${this._data.barcodeType} 格式要求`);
      }
    }
    
    // 验证二维码特定参数
    if (this._data.barcodeType === BarcodeType.QRCODE && this._data.errorCorrection !== undefined) {
      if (this._data.errorCorrection < 0 || this._data.errorCorrection > 3) {
        errors.push('二维码纠错级别必须在0-3之间');
      }
    }
    
    return errors;
  }
  
  /**
   * 克隆元素
   */
  clone(): BarcodeElement {
    return new BarcodeElement({
      ...this._data,
      id: `barcode-${Date.now()}`,
      position: {
        x: this._data.position.x + 10,
        y: this._data.position.y + 10,
      },
    });
  }
  
  /**
   * 导出为JSON
   */
  toJSON(): IBarcodeElement {
    return { ...this._data };
  }
  
  /**
   * 从JSON创建
   */
  static fromJSON(json: IBarcodeElement): BarcodeElement {
    return new BarcodeElement(json);
  }
}