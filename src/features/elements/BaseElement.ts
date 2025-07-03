import { nanoid } from 'nanoid';
import type { BaseElement as IBaseElement, ElementBounds } from '@/types/unified.types';

/**
 * 元素基类
 */
export abstract class BaseElement implements IBaseElement {
  id: string;
  abstract type: string;
  bounds: ElementBounds;
  rotation: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(data: Partial<IBaseElement> = {}) {
    this.id = data.id || nanoid();
    this.type = data.type || '';
    this.bounds = data.bounds || {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    this.rotation = data.rotation ?? 0;
    this.visible = data.visible ?? true;
    this.locked = data.locked ?? false;
    this.opacity = data.opacity ?? 1;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }
  
  /**
   * 验证元素数据
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.id) {
      errors.push('元素ID不能为空');
    }
    
    if (this.bounds.width <= 0) {
      errors.push('元素宽度必须大于0');
    }
    
    if (this.bounds.height <= 0) {
      errors.push('元素高度必须大于0');
    }
    
    if (this.opacity < 0 || this.opacity > 1) {
      errors.push('透明度必须在0-1之间');
    }
    
    if (this.rotation < -360 || this.rotation > 360) {
      errors.push('旋转角度必须在-360到360之间');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * 更新元素位置
   */
  updatePosition(x: number, y: number): void {
    this.bounds.x = x;
    this.bounds.y = y;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新元素尺寸
   */
  updateSize(width: number, height: number): void {
    this.bounds.width = width;
    this.bounds.height = height;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新元素旋转角度
   */
  updateRotation(rotation: number): void {
    this.rotation = rotation;
    this.updatedAt = new Date();
  }
  
  /**
   * 切换可见性
   */
  toggleVisibility(): void {
    this.visible = !this.visible;
    this.updatedAt = new Date();
  }
  
  /**
   * 切换锁定状态
   */
  toggleLocked(): void {
    this.locked = !this.locked;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新透明度
   */
  updateOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.updatedAt = new Date();
  }
  
  /**
   * 克隆元素（子类需要实现）
   */
  abstract clone(): BaseElement;
  
  /**
   * 转换为JSON（子类需要实现）
   */
  abstract toJSON(): any;
}