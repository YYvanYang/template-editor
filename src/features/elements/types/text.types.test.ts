import { describe, it, expect, vi } from 'vitest'
import { TextElement, type TextElementData } from './text.types'

describe('TextElement', () => {
  const createTextElement = (overrides?: Partial<Omit<TextElementData, 'type'>>): TextElement => {
    const data: Omit<TextElementData, 'type'> = {
      id: 'text-1',
      name: 'Text Element',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      content: 'Hello World',
      ...overrides,
    }
    return new TextElement(data)
  }

  describe('Constructor', () => {
    it('should create text element with type "text"', () => {
      const element = createTextElement()
      expect(element.type).toBe('text')
      expect(element.content).toBe('Hello World')
    })
  })

  describe('Content Properties', () => {
    it('should get and set content', () => {
      const element = createTextElement()
      
      expect(element.content).toBe('Hello World')
      
      element.content = 'Updated Content'
      expect(element.content).toBe('Updated Content')
    })
  })

  describe('Text Style Properties', () => {
    it('should have default text style values', () => {
      const element = createTextElement()
      
      expect(element.fontFamily).toBe('Arial')
      expect(element.fontSize).toBe(14)
      expect(element.fontWeight).toBe('normal')
      expect(element.fontStyle).toBe('normal')
      expect(element.textAlign).toBe('left')
      expect(element.verticalAlign).toBe('top')
      expect(element.color).toBe('#000000')
      expect(element.lineHeight).toBe(1.2)
      expect(element.letterSpacing).toBe(0)
    })

    it('should use custom text style values', () => {
      const element = createTextElement({
        textStyle: {
          fontFamily: 'Helvetica',
          fontSize: 18,
          fontWeight: 'bold',
          fontStyle: 'italic',
          textAlign: 'center',
          verticalAlign: 'middle',
          color: '#ff0000',
          lineHeight: 1.5,
          letterSpacing: 2,
        },
      })
      
      expect(element.fontFamily).toBe('Helvetica')
      expect(element.fontSize).toBe(18)
      expect(element.fontWeight).toBe('bold')
      expect(element.fontStyle).toBe('italic')
      expect(element.textAlign).toBe('center')
      expect(element.verticalAlign).toBe('middle')
      expect(element.color).toBe('#ff0000')
      expect(element.lineHeight).toBe(1.5)
      expect(element.letterSpacing).toBe(2)
    })

    it('should update text style', () => {
      const element = createTextElement()
      
      element.updateTextStyle({
        fontSize: 20,
        color: '#0000ff',
        fontWeight: 'bold',
      })
      
      expect(element.fontSize).toBe(20)
      expect(element.color).toBe('#0000ff')
      expect(element.fontWeight).toBe('bold')
      expect(element.fontFamily).toBe('Arial') // Should keep other values
    })

    it('should set entire text style object', () => {
      const element = createTextElement()
      
      element.textStyle = {
        fontFamily: 'Times New Roman',
        fontSize: 24,
      }
      
      expect(element.textStyle).toEqual({
        fontFamily: 'Times New Roman',
        fontSize: 24,
      })
    })
  })

  describe('Text Layout Properties', () => {
    it('should handle maxLines property', () => {
      const element = createTextElement()
      
      expect(element.maxLines).toBeUndefined()
      
      element.maxLines = 3
      expect(element.maxLines).toBe(3)
    })

    it('should handle ellipsis property', () => {
      const element = createTextElement()
      
      expect(element.ellipsis).toBe(false)
      
      element.ellipsis = true
      expect(element.ellipsis).toBe(true)
    })

    it('should handle autoSize property', () => {
      const element = createTextElement()
      
      expect(element.autoSize).toBe(false)
      
      element.autoSize = true
      expect(element.autoSize).toBe(true)
    })
  })

  describe('Data Binding', () => {
    it('should get and set binding expression', () => {
      const element = createTextElement()
      
      expect(element.binding).toBeUndefined()
      
      element.binding = '{{customer.name}}'
      expect(element.binding).toBe('{{customer.name}}')
    })

    it('should process content without binding', () => {
      const element = createTextElement({ content: 'Static Text' })
      const data = { customer: { name: 'John' } }
      
      expect(element.processContent(data)).toBe('Static Text')
    })

    it('should process content with simple binding', () => {
      const element = createTextElement({
        content: 'Hello {{name}}!',
        binding: '{{name}}',
      })
      const data = { name: 'John' }
      
      expect(element.processContent(data)).toBe('Hello John!')
    })

    it('should process content with nested binding', () => {
      const element = createTextElement({
        content: 'Customer: {{customer.name}}, Order: {{order.id}}',
        binding: '{{customer.name}}',
      })
      const data = {
        customer: { name: 'John Doe' },
        order: { id: '12345' },
      }
      
      expect(element.processContent(data)).toBe('Customer: John Doe, Order: 12345')
    })

    it('should handle missing binding data', () => {
      const element = createTextElement({
        content: 'Hello {{name}}!',
        binding: '{{name}}',
      })
      const data = {}
      
      expect(element.processContent(data)).toBe('Hello {{name}}!')
    })

    it('should handle deeply nested bindings', () => {
      const element = createTextElement({
        content: 'Address: {{user.address.city.name}}',
        binding: '{{user.address.city.name}}',
      })
      const data = {
        user: {
          address: {
            city: {
              name: 'New York',
            },
          },
        },
      }
      
      expect(element.processContent(data)).toBe('Address: New York')
    })

    it('should handle non-string binding values', () => {
      const element = createTextElement({
        content: 'Count: {{count}}, Price: {{price}}',
        binding: '{{count}}',
      })
      const data = {
        count: 42,
        price: 19.99,
      }
      
      expect(element.processContent(data)).toBe('Count: 42, Price: 19.99')
    })
  })

  describe('Text Metrics', () => {
    it('should calculate text metrics', () => {
      const element = createTextElement({
        textStyle: {
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 'bold',
          fontStyle: 'italic',
        },
      })
      
      const mockCtx = {
        font: '',
        measureText: vi.fn().mockReturnValue({ width: 100 }),
      } as unknown as CanvasRenderingContext2D
      
      const metrics = element.getTextMetrics(mockCtx)
      
      expect(mockCtx.font).toBe('italic bold 16px Arial')
      expect(mockCtx.measureText).toHaveBeenCalledWith('Hello World')
      expect(metrics.width).toBe(100)
    })
  })

  describe('Inherited Methods', () => {
    it('should return bounding box', () => {
      const element = createTextElement()
      const box = element.getBoundingBox()
      
      expect(box).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      })
    })

    it('should check if point is contained', () => {
      const element = createTextElement()
      
      expect(element.containsPoint(50, 40)).toBe(true)
      expect(element.containsPoint(5, 40)).toBe(false)
    })

    it('should clone with text-specific properties', () => {
      const element = createTextElement({
        content: 'Original',
        textStyle: { fontSize: 20, color: '#ff0000' },
        binding: '{{value}}',
        maxLines: 2,
        ellipsis: true,
      })
      
      const clone = element.clone()
      
      expect(clone.id).not.toBe(element.id)
      expect(clone.content).toBe('Original')
      expect(clone.textStyle).toEqual({ fontSize: 20, color: '#ff0000' })
      expect(clone.binding).toBe('{{value}}')
      expect(clone.maxLines).toBe(2)
      expect(clone.ellipsis).toBe(true)
    })
  })
})