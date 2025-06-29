import type { RulerTick, CalculateTicksParams } from '../types/ruler.types';
import { UNIT_CONVERSIONS } from '../types/ruler.types';

/**
 * 单位转换
 */
export function convertUnit(
  value: number,
  fromUnit: 'mm' | 'cm' | 'px',
  toUnit: 'mm' | 'cm' | 'px'
): number {
  if (fromUnit === toUnit) return value;
  
  // 先转换到像素
  const pixels = value * UNIT_CONVERSIONS[fromUnit].toPx;
  
  // 再从像素转换到目标单位
  return pixels / UNIT_CONVERSIONS[toUnit].toPx;
}

/**
 * 根据缩放比例获取合适的刻度间隔
 */
export function getTickInterval(
  scale: number,
  unit: 'mm' | 'cm' | 'px'
): { major: number; minor: number } {
  const config = UNIT_CONVERSIONS[unit];
  
  // 基础间隔
  let majorInterval = config.majorInterval;
  let minorInterval = config.minorInterval;
  
  // 根据缩放调整间隔
  if (scale > 5) {
    // 极度放大时大幅减小间隔
    majorInterval = majorInterval / 5;
    minorInterval = minorInterval / 2;
  } else if (scale > 2) {
    // 放大时减小间隔
    majorInterval = majorInterval / 2;
    minorInterval = minorInterval;
  } else if (scale < 0.2) {
    // 极度缩小时大幅增大间隔
    majorInterval = majorInterval * 5;
    minorInterval = majorInterval / 2;
  } else if (scale < 0.5) {
    // 缩小时增大间隔
    majorInterval = majorInterval * 2;
    minorInterval = majorInterval / 4;
  }
  
  return { major: majorInterval, minor: minorInterval };
}

/**
 * 计算标尺刻度
 */
export function calculateTicks(params: CalculateTicksParams): RulerTick[] {
  const {
    length,
    scale,
    offset,
    unit,
    minTickSpacing = 5,
  } = params;
  
  const ticks: RulerTick[] = [];
  const unitConfig = UNIT_CONVERSIONS[unit];
  const { major: majorInterval, minor: minorInterval } = getTickInterval(scale, unit);
  
  // 计算可见范围（转换为实际单位）
  // offset 是负值时表示画布向右/下拖动，所以起始值应该是正的
  const startValue = convertUnit(-offset / scale, 'px', unit);
  const endValue = convertUnit((length - offset) / scale, 'px', unit);
  
  // 计算起始刻度值（对齐到次刻度间隔）
  const startTick = Math.floor(startValue / minorInterval) * minorInterval;
  
  // 动态调整步长以避免过多刻度
  let step = minorInterval;
  const maxTicks = length / minTickSpacing;
  const estimatedTicks = (endValue - startTick) / minorInterval;
  
  // 根据单位和缩放级别决定是否显示次刻度
  // 对于毫米单位，当缩放较小时，跳过1mm刻度，只显示5mm或10mm
  if (unit === 'mm') {
    if (scale < 0.5) {
      step = majorInterval; // 只显示10mm刻度
    } else if (scale < 1) {
      step = 5; // 显示5mm刻度
    }
    // scale >= 1 时显示所有1mm刻度
  } else if (estimatedTicks > maxTicks) {
    step = minorInterval * Math.ceil(estimatedTicks / maxTicks);
  }
  
  // 生成刻度
  for (let value = startTick; value <= endValue; value += step) {
    // 计算屏幕位置（不包含偏移，偏移通过transform处理）
    const position = convertUnit(value, unit, 'px') * scale;
    
    // 只生成在合理范围内的刻度
    if (position < -length || position > length * 2) continue;
    
    // 判断是否为主刻度
    const isMajor = Math.abs(value % majorInterval) < 0.0001;
    
    // 格式化标签
    let label: string | undefined;
    if (unit === 'mm') {
      // 毫米单位：根据缩放级别决定显示哪些标签
      if (scale < 0.5 && isMajor) {
        label = formatLabel(value, unit); // 只在10mm倍数显示
      } else if (scale < 1 && value % 5 === 0) {
        label = formatLabel(value, unit); // 在5mm倍数显示
      } else if (scale >= 1 && value % 10 === 0) {
        label = formatLabel(value, unit); // 在10mm倍数显示
      }
    } else if (isMajor) {
      label = formatLabel(value, unit);
    }
    
    ticks.push({
      position,
      label,
      isMajor,
    });
  }
  
  return ticks;
}

/**
 * 格式化标尺标签
 */
export function formatLabel(value: number, unit: 'mm' | 'cm' | 'px'): string {
  switch (unit) {
    case 'mm':
    case 'cm':
      return value % 1 === 0 ? value.toString() : value.toFixed(1);
    case 'px':
      return Math.round(value).toString();
    default:
      return value.toString();
  }
}

/**
 * 获取鼠标在标尺上的实际位置值
 */
export function getMouseValue(
  mousePosition: number,
  scale: number,
  offset: number,
  unit: 'mm' | 'cm' | 'px'
): number {
  const pixelValue = (mousePosition - offset) / scale;
  return convertUnit(pixelValue, 'px', unit);
}

/**
 * 计算标尺的最佳厚度
 */
export function getRulerThickness(fontSize: number = 10): number {
  return Math.max(20, fontSize * 2);
}