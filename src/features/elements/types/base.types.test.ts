import { describe, it, expect } from 'vitest'
import { BaseElement, type BaseElementData } from './base.types'

// Test implementation of BaseElement
class TestElement extends BaseElement {
  render(): React.ReactNode {
    return null
  }

  getBoundingBox() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    }
  }

  containsPoint(x: number, y: number): boolean {
    const box = this.getBoundingBox()
    return (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height
    )
  }
}

describe('BaseElement', () => {
  const createTestElement = (overrides?: Partial<BaseElementData>): TestElement => {
    const data: BaseElementData = {
      id: 'test-id',
      type: 'test',
      name: 'Test Element',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      ...overrides,
    }
    return new TestElement(data)
  }

  describe('Basic Properties', () => {
    it('should initialize with provided data', () => {
      const element = createTestElement()
      
      expect(element.id).toBe('test-id')
      expect(element.type).toBe('test')
      expect(element.name).toBe('Test Element')
      expect(element.position).toEqual({ x: 10, y: 20 })
      expect(element.size).toEqual({ width: 100, height: 50 })
    })

    it('should have default values for optional properties', () => {
      const element = createTestElement()
      
      expect(element.rotation).toBe(0)
      expect(element.visible).toBe(true)
      expect(element.locked).toBe(false)
      expect(element.zIndex).toBe(0)
      expect(element.groupId).toBeUndefined()
    })

    it('should allow setting properties', () => {
      const element = createTestElement()
      
      element.name = 'Updated Name'
      element.position = { x: 30, y: 40 }
      element.size = { width: 200, height: 100 }
      element.rotation = 45
      element.visible = false
      element.locked = true
      element.zIndex = 10
      element.groupId = 'group-1'
      
      expect(element.name).toBe('Updated Name')
      expect(element.position).toEqual({ x: 30, y: 40 })
      expect(element.size).toEqual({ width: 200, height: 100 })
      expect(element.rotation).toBe(45)
      expect(element.visible).toBe(false)
      expect(element.locked).toBe(true)
      expect(element.zIndex).toBe(10)
      expect(element.groupId).toBe('group-1')
    })
  })

  describe('Style Properties', () => {
    it('should handle style properties', () => {
      const style = {
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 0.8,
      }
      
      const element = createTestElement({ style })
      expect(element.style).toEqual(style)
      
      const newStyle = { fill: '#00ff00' }
      element.style = newStyle
      expect(element.style).toEqual(newStyle)
    })
  })

  describe('Movement Methods', () => {
    it('should move element by delta', () => {
      const element = createTestElement()
      
      element.move(15, 25)
      expect(element.position).toEqual({ x: 25, y: 45 })
      
      element.move(-5, -10)
      expect(element.position).toEqual({ x: 20, y: 35 })
    })

    it('should move element to absolute position', () => {
      const element = createTestElement()
      
      element.moveTo(100, 200)
      expect(element.position).toEqual({ x: 100, y: 200 })
    })
  })

  describe('Size Methods', () => {
    it('should resize element', () => {
      const element = createTestElement()
      
      element.resize(150, 75)
      expect(element.size).toEqual({ width: 150, height: 75 })
    })
  })

  describe('Rotation Methods', () => {
    it('should rotate element by angle', () => {
      const element = createTestElement({ rotation: 30 })
      
      element.rotate(15)
      expect(element.rotation).toBe(45)
      
      element.rotate(-20)
      expect(element.rotation).toBe(25)
    })

    it('should rotate element to absolute angle', () => {
      const element = createTestElement({ rotation: 30 })
      
      element.rotateTo(90)
      expect(element.rotation).toBe(90)
    })
  })

  describe('Clone Method', () => {
    it('should create a copy with new ID', () => {
      const element = createTestElement({
        style: { fill: '#ff0000' },
        data: { custom: 'value' },
      })
      
      const clone = element.clone()
      
      expect(clone.id).not.toBe(element.id)
      expect(clone.id).toContain('test-id_copy_')
      expect(clone.type).toBe(element.type)
      expect(clone.name).toBe(element.name)
      expect(clone.position).toEqual(element.position)
      expect(clone.size).toEqual(element.size)
      expect(clone.style).toEqual(element.style)
      expect(clone.data).toEqual(element.data)
    })

    it('should deep copy nested objects', () => {
      const element = createTestElement()
      const clone = element.clone()
      
      // Modify original
      element.position.x = 999
      
      // Clone should not be affected
      expect(clone.position.x).toBe(10)
    })
  })

  describe('toJSON Method', () => {
    it('should return element data as JSON', () => {
      const data: BaseElementData = {
        id: 'test-id',
        type: 'test',
        name: 'Test Element',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        rotation: 45,
        visible: false,
        locked: true,
        style: { fill: '#ff0000' },
        zIndex: 5,
        groupId: 'group-1',
        data: { custom: 'value' },
      }
      
      const element = createTestElement(data)
      const json = element.toJSON()
      
      expect(json).toEqual(data)
    })
  })

  describe('Abstract Methods', () => {
    it('should implement getBoundingBox', () => {
      const element = createTestElement()
      const box = element.getBoundingBox()
      
      expect(box).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      })
    })

    it('should implement containsPoint', () => {
      const element = createTestElement()
      
      // Inside
      expect(element.containsPoint(50, 40)).toBe(true)
      expect(element.containsPoint(10, 20)).toBe(true)
      expect(element.containsPoint(110, 70)).toBe(true)
      
      // Outside
      expect(element.containsPoint(5, 40)).toBe(false)
      expect(element.containsPoint(50, 75)).toBe(false)
      expect(element.containsPoint(115, 40)).toBe(false)
    })
  })
})