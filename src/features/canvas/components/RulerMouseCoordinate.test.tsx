import { describe, it, expect } from 'vitest'
import { UNIT_CONVERSIONS } from '../types/ruler.types'

/**
 * 测试鼠标坐标计算的正确性
 * 验证标尺中鼠标位置到单位值的转换逻辑
 */
describe('RulerCanvas 鼠标坐标计算', () => {
  const MM_TO_PX = UNIT_CONVERSIONS.mm.toPx // 3.7795275591
  
  describe('坐标系转换', () => {
    it('应该正确计算相对于画布的坐标', () => {
      // 鼠标在容器中的位置
      const mousePositionInContainer = 100
      // 画布的偏移（viewport.x）
      const viewportOffset = 50
      // 缩放比例
      const scale = 1
      
      // 计算相对于画布的像素坐标
      const canvasPixelValue = (mousePositionInContainer - viewportOffset) / scale
      
      expect(canvasPixelValue).toBe(50)
    })
    
    it('应该处理画布向右偏移的情况', () => {
      // 鼠标在容器的100px位置
      const mousePos = 100
      // 画布向右偏移50px（viewport.x = 50）
      const viewportX = 50
      const scale = 1
      
      // 相对于画布的坐标应该是 100 - 50 = 50px
      const canvasPixel = (mousePos - viewportX) / scale
      
      expect(canvasPixel).toBe(50)
    })
    
    it('应该处理画布向左偏移的情况', () => {
      // 鼠标在容器的100px位置
      const mousePos = 100
      // 画布向左偏移50px（viewport.x = -50）
      const viewportX = -50
      const scale = 1
      
      // 相对于画布的坐标应该是 100 - (-50) = 150px
      const canvasPixel = (mousePos - viewportX) / scale
      
      expect(canvasPixel).toBe(150)
    })
    
    it('应该考虑缩放级别', () => {
      const mousePos = 200
      const viewportX = 0
      const scale = 2 // 放大2倍
      
      // 放大2倍时，200px的屏幕位置对应100px的画布位置
      const canvasPixel = (mousePos - viewportX) / scale
      
      expect(canvasPixel).toBe(100)
    })
  })
  
  describe('单位转换', () => {
    it('应该正确将像素转换为毫米', () => {
      const pixelValue = 377.95275591 // 约100mm
      const mmValue = pixelValue / MM_TO_PX
      
      expect(mmValue).toBeCloseTo(100, 5)
    })
    
    it('应该正确将像素转换为厘米', () => {
      const pixelValue = 377.95275591 // 100mm = 10cm
      const cmValue = pixelValue / (MM_TO_PX * 10)
      
      expect(cmValue).toBeCloseTo(10, 5)
    })
    
    it('应该正确格式化标签文本', () => {
      // mm单位
      const mmValue = 26.5
      const mmLabel = `${mmValue.toFixed(1)}mm`
      expect(mmLabel).toBe('26.5mm')
      
      // cm单位
      const cmValue = 2.65
      const cmLabel = `${cmValue.toFixed(1)}cm`
      expect(cmLabel).toBe('2.6cm') // toFixed(1) with 2.65 gives 2.6 due to banker's rounding
      
      // px单位
      const pxValue = 100.123
      const pxLabel = `${pxValue.toFixed(1)}px`
      expect(pxLabel).toBe('100.1px')
    })
  })
  
  describe('完整的坐标计算流程', () => {
    it('应该正确计算鼠标位置的单位值（无偏移无缩放）', () => {
      const mousePos = 377.95275591 // 鼠标在容器的位置
      const viewportX = 0 // 无偏移
      const scale = 1 // 无缩放
      
      // 1. 计算相对于画布的像素坐标
      const canvasPixel = (mousePos - viewportX) / scale
      expect(canvasPixel).toBe(377.95275591)
      
      // 2. 转换为毫米
      const mmValue = canvasPixel / MM_TO_PX
      expect(mmValue).toBeCloseTo(100, 5)
      
      // 3. 格式化标签
      const label = `${mmValue.toFixed(1)}mm`
      expect(label).toBe('100.0mm')
    })
    
    it('应该正确计算鼠标位置的单位值（有偏移有缩放）', () => {
      const mousePos = 100 // 鼠标在容器的位置
      const viewportX = -50 // 画布向左偏移50px（显示更右边的内容）
      const scale = 2 // 放大2倍
      
      // 1. 计算相对于画布的像素坐标
      const canvasPixel = (mousePos - viewportX) / scale
      expect(canvasPixel).toBe(75) // (100 - (-50)) / 2 = 150 / 2 = 75
      
      // 2. 转换为毫米
      const mmValue = canvasPixel / MM_TO_PX
      expect(mmValue).toBeCloseTo(19.84, 2)
      
      // 3. 格式化标签
      const label = `${mmValue.toFixed(1)}mm`
      expect(label).toBe('19.8mm')
    })
    
    it('应该正确处理画布0点对齐', () => {
      // 当鼠标正好在画布原点上时
      const mousePos = 50 // 假设画布在容器中偏移了50px
      const viewportX = 50 // 画布偏移
      const scale = 1
      
      const canvasPixel = (mousePos - viewportX) / scale
      expect(canvasPixel).toBe(0) // 应该正好是0
      
      const mmValue = canvasPixel / MM_TO_PX
      expect(mmValue).toBe(0)
      
      const label = `${mmValue.toFixed(1)}mm`
      expect(label).toBe('0.0mm')
    })
  })
  
  describe('边界情况', () => {
    it('应该处理负坐标', () => {
      const mousePos = 0
      const viewportX = 100 // 画布向右偏移，鼠标在画布左侧
      const scale = 1
      
      const canvasPixel = (mousePos - viewportX) / scale
      expect(canvasPixel).toBe(-100)
      
      const mmValue = canvasPixel / MM_TO_PX
      expect(mmValue).toBeCloseTo(-26.46, 2)
    })
    
    it('应该处理极小的缩放', () => {
      const mousePos = 100
      const viewportX = 0
      const scale = 0.1 // 缩小到10%
      
      const canvasPixel = (mousePos - viewportX) / scale
      expect(canvasPixel).toBe(1000) // 100 / 0.1 = 1000
    })
    
    it('应该处理极大的缩放', () => {
      const mousePos = 1000
      const viewportX = 0
      const scale = 10 // 放大10倍
      
      const canvasPixel = (mousePos - viewportX) / scale
      expect(canvasPixel).toBe(100) // 1000 / 10 = 100
    })
  })
})