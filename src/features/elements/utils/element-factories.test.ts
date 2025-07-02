import { describe, it, expect } from 'vitest'
import { 
  createTextElement, 
  createRectangleElement,
  createImageElement,
  createBarcodeElement,
  createTableElement 
} from './element-factories'

describe('Element Factories', () => {
  describe('createTextElement', () => {
    it('should create a text element with default properties', () => {
      const position = { x: 100, y: 200 }
      const element = createTextElement(position)
      
      expect(element.type).toBe('text')
      expect(element.x).toBe(100)
      expect(element.y).toBe(200)
      expect(element.id).toMatch(/^text-\d+-\d+$/)
      expect(element.name).toBe('Text')
      expect(element.content).toBe('Double-click to edit')
      expect(element.fontFamily).toBe('Arial')
      expect(element.fontSize).toBe(16)
      expect(element.width).toBe(200)
      expect(element.height).toBe(50)
      expect(element.locked).toBe(false)
      expect(element.visible).toBe(true)
    })

    it('should generate unique IDs for multiple elements', () => {
      const element1 = createTextElement({ x: 0, y: 0 })
      const element2 = createTextElement({ x: 0, y: 0 })
      
      expect(element1.id).not.toBe(element2.id)
    })
  })

  describe('createRectangleElement', () => {
    it('should create a rectangle element with default properties', () => {
      const position = { x: 50, y: 100 }
      const element = createRectangleElement(position)
      
      expect(element.type).toBe('shape')
      expect(element.shapeType).toBe('rectangle')
      expect(element.x).toBe(50)
      expect(element.y).toBe(100)
      expect(element.id).toMatch(/^rect-\d+-\d+$/)
      expect(element.name).toBe('Rectangle')
      expect(element.width).toBe(100)
      expect(element.height).toBe(100)
      expect(element.fill).toBe('#ffffff')
      expect(element.stroke).toBe('#000000')
      expect(element.strokeWidth).toBe(1)
    })
  })

  describe('createImageElement', () => {
    it('should create an image element with default properties', () => {
      const position = { x: 150, y: 250 }
      const element = createImageElement(position)
      
      expect(element.type).toBe('image')
      expect(element.x).toBe(150)
      expect(element.y).toBe(250)
      expect(element.id).toMatch(/^image-\d+-\d+$/)
      expect(element.name).toBe('Image')
      expect(element.width).toBe(200)
      expect(element.height).toBe(150)
      expect(element.src).toBe('')
      expect(element.fit).toBe('contain')
    })
  })

  describe('createBarcodeElement', () => {
    it('should create a barcode element with default properties', () => {
      const position = { x: 200, y: 300 }
      const element = createBarcodeElement(position)
      
      expect(element.type).toBe('barcode')
      expect(element.x).toBe(200)
      expect(element.y).toBe(300)
      expect(element.id).toMatch(/^barcode-\d+-\d+$/)
      expect(element.name).toBe('Barcode')
      expect(element.width).toBe(200)
      expect(element.height).toBe(80)
      expect(element.format).toBe('CODE128')
      expect(element.value).toBe('123456789')
      expect(element.showText).toBe(true)
    })
  })

  describe('createTableElement', () => {
    it('should create a table element with default 3x3 structure', () => {
      const position = { x: 50, y: 50 }
      const element = createTableElement(position)
      
      expect(element.type).toBe('table')
      expect(element.x).toBe(50)
      expect(element.y).toBe(50)
      expect(element.id).toMatch(/^table-\d+-\d+$/)
      expect(element.name).toBe('Table')
      expect(element.width).toBe(300)
      expect(element.height).toBe(150)
      
      // Check table structure
      expect(element.rows).toHaveLength(3)
      expect(element.columns).toHaveLength(3)
      
      // Check first row (headers)
      const firstRow = element.rows[0]
      expect(firstRow.cells).toHaveLength(3)
      expect(firstRow.cells[0].type).toBe('th')
      expect(firstRow.cells[0].content).toBe('Header 1')
      
      // Check data rows
      const secondRow = element.rows[1]
      expect(secondRow.cells[0].type).toBe('td')
      expect(secondRow.cells[0].content).toBe('Cell 1-1')
    })

    it('should create table with custom dimensions', () => {
      const position = { x: 0, y: 0 }
      const element = createTableElement(position, 2, 4)
      
      expect(element.rows).toHaveLength(2)
      expect(element.columns).toHaveLength(4)
      expect(element.rows[0].cells).toHaveLength(4)
    })
  })

  describe('All factories', () => {
    it('should set common element properties correctly', () => {
      const position = { x: 10, y: 20 }
      const elements = [
        createTextElement(position),
        createRectangleElement(position),
        createImageElement(position),
        createBarcodeElement(position),
        createTableElement(position),
      ]
      
      elements.forEach(element => {
        expect(element.x).toBe(10)
        expect(element.y).toBe(20)
        expect(element.rotation).toBe(0)
        expect(element.locked).toBe(false)
        expect(element.visible).toBe(true)
        expect(element.opacity).toBe(1)
      })
    })
  })
})