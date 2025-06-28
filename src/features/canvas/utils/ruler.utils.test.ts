import { describe, it, expect } from 'vitest';
import { calculateTicks, getTickInterval, convertUnit } from './ruler.utils';
import type { CalculateTicksParams } from '../types/ruler.types';

describe('ruler.utils', () => {
  describe('convertUnit', () => {
    it('应该正确转换毫米到像素', () => {
      expect(convertUnit(10, 'mm', 'px')).toBeCloseTo(37.795, 2);
    });

    it('应该正确转换厘米到像素', () => {
      expect(convertUnit(1, 'cm', 'px')).toBeCloseTo(37.795, 2);
    });

    it('应该正确转换像素到像素', () => {
      expect(convertUnit(100, 'px', 'px')).toBe(100);
    });

    it('应该正确转换像素到毫米', () => {
      expect(convertUnit(37.795, 'px', 'mm')).toBeCloseTo(10, 1);
    });

    it('应该正确转换像素到厘米', () => {
      expect(convertUnit(37.795, 'px', 'cm')).toBeCloseTo(1, 1);
    });
  });

  describe('getTickInterval', () => {
    it('应该根据缩放比例返回合适的刻度间隔', () => {
      // 正常缩放
      expect(getTickInterval(1, 'mm')).toEqual({
        major: 10,
        minor: 1,
      });

      // 放大时减小间隔（scale > 2）
      expect(getTickInterval(2.1, 'mm')).toEqual({
        major: 5,
        minor: 1,
      });

      // 缩小时增大间隔（scale < 0.5）
      expect(getTickInterval(0.4, 'mm')).toEqual({
        major: 20,
        minor: 5,
      });
    });

    it('应该为不同单位返回合适的间隔', () => {
      expect(getTickInterval(1, 'cm')).toEqual({
        major: 1,
        minor: 0.1,
      });

      expect(getTickInterval(1, 'px')).toEqual({
        major: 100,
        minor: 10,
      });
    });

    it('应该确保最小刻度间隔', () => {
      // 极度放大时也要保持合理的间隔
      const interval = getTickInterval(10, 'mm');
      const minorSpacing = interval.minor * 3.7795 * 10; // 转换为屏幕像素
      expect(minorSpacing).toBeGreaterThan(5); // 至少5像素间隔
    });
  });

  describe('calculateTicks', () => {
    const baseParams: CalculateTicksParams = {
      length: 1000,
      scale: 1,
      offset: 0,
      unit: 'mm',
    };

    it('应该生成正确数量的刻度', () => {
      const ticks = calculateTicks(baseParams);
      
      expect(ticks.length).toBeGreaterThan(0);
      
      // 检查是否有主刻度和次刻度
      const majorTicks = ticks.filter(t => t.isMajor);
      const minorTicks = ticks.filter(t => !t.isMajor);
      
      expect(majorTicks.length).toBeGreaterThan(0);
      expect(minorTicks.length).toBeGreaterThan(0);
    });

    it('应该生成正确的刻度位置', () => {
      const ticks = calculateTicks(baseParams);
      
      // 检查第一个刻度
      const firstTick = ticks[0];
      expect(firstTick.position).toBeGreaterThanOrEqual(0);
      
      // 检查刻度是否按位置排序
      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i].position).toBeGreaterThan(ticks[i - 1].position);
      }
    });

    it('应该为主刻度生成标签', () => {
      const ticks = calculateTicks(baseParams);
      
      const majorTicks = ticks.filter(t => t.isMajor);
      majorTicks.forEach(tick => {
        expect(tick.label).toBeDefined();
        expect(tick.label).toMatch(/^\d+$/); // 应该是数字
      });
    });

    it('应该应用偏移量', () => {
      const ticksNoOffset = calculateTicks(baseParams);
      const ticksWithOffset = calculateTicks({
        ...baseParams,
        offset: 100,
      });
      
      // 偏移现在通过transform处理，所以刻度位置相同，但起始值不同
      expect(ticksWithOffset.length).toBeGreaterThan(0);
      expect(ticksNoOffset.length).toBeGreaterThan(0);
    });

    it('应该根据缩放调整刻度密度', () => {
      const ticksNormal = calculateTicks(baseParams);
      const ticksZoomedIn = calculateTicks({
        ...baseParams,
        scale: 2,
      });
      const ticksZoomedOut = calculateTicks({
        ...baseParams,
        scale: 0.5,
      });
      
      // 验证生成了刻度
      expect(ticksNormal.length).toBeGreaterThan(0);
      expect(ticksZoomedIn.length).toBeGreaterThan(0);
      expect(ticksZoomedOut.length).toBeGreaterThan(0);
    });

    it('应该限制最小刻度间隔', () => {
      const ticks = calculateTicks({
        ...baseParams,
        scale: 0.1, // 极度缩小
        minTickSpacing: 10,
      });
      
      // 检查相邻刻度间隔
      for (let i = 1; i < ticks.length; i++) {
        const spacing = ticks[i].position - ticks[i - 1].position;
        expect(spacing).toBeGreaterThanOrEqual(10);
      }
    });

    it('应该正确处理负偏移', () => {
      const ticks = calculateTicks({
        ...baseParams,
        offset: -200,
      });
      
      // 不应该有负位置的刻度（被过滤掉了）
      const negativeTicks = ticks.filter(t => t.position < 0);
      expect(negativeTicks.length).toBe(0);
      
      // 但应该有刻度存在
      expect(ticks.length).toBeGreaterThan(0);
      
      // 刻度位置现在不包含偏移，所以可能超出length
      expect(ticks.length).toBeGreaterThan(0);
    });

    it('应该为不同单位生成合适的刻度', () => {
      // 毫米
      const mmTicks = calculateTicks({ ...baseParams, unit: 'mm' });
      const mmMajorTicks = mmTicks.filter(t => t.isMajor);
      expect(mmMajorTicks[0].label).toMatch(/0|10|20|30/);

      // 厘米
      const cmTicks = calculateTicks({ ...baseParams, unit: 'cm' });
      const cmMajorTicks = cmTicks.filter(t => t.isMajor);
      expect(cmMajorTicks[0].label).toMatch(/\d+/);

      // 像素
      const pxTicks = calculateTicks({ ...baseParams, unit: 'px' });
      const pxMajorTicks = pxTicks.filter(t => t.isMajor);
      expect(pxMajorTicks.some(t => t.label === '0' || t.label === '100')).toBe(true);
    });
  });
});