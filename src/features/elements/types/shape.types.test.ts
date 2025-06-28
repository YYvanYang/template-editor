import { describe, it, expect } from 'vitest'
import { ShapeElement, type ShapeElementData, type ShapeType } from './shape.types'

describe('ShapeElement', () => {
  const createShapeElement = (
    shapeType: ShapeType,
    overrides?: Partial<Omit<ShapeElementData, 'type'>>
  ): ShapeElement => {
    const data: Omit<ShapeElementData, 'type'> = {
      id: 'shape-1',
      name: 'Shape Element',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      shapeType,
      ...overrides,
    }
    return new ShapeElement(data)
  }

  describe('Constructor', () => {
    it('should create shape element with type "shape"', () => {
      const element = createShapeElement('rectangle')
      expect(element.type).toBe('shape')
      expect(element.shapeType).toBe('rectangle')
    })
  })

  describe('Shape Type and Style', () => {
    it('should get and set shape type', () => {
      const element = createShapeElement('rectangle')
      
      expect(element.shapeType).toBe('rectangle')
      
      element.shapeType = 'circle'
      expect(element.shapeType).toBe('circle')
    })

    it('should handle shape style', () => {
      const element = createShapeElement('rectangle', {
        shapeStyle: {
          cornerRadius: 5,
          strokeDashArray: [5, 5],
          strokeLineCap: 'round',
        },
      })
      
      expect(element.cornerRadius).toBe(5)
      expect(element.strokeDashArray).toEqual([5, 5])
      expect(element.shapeStyle).toEqual({
        cornerRadius: 5,
        strokeDashArray: [5, 5],
        strokeLineCap: 'round',
      })
    })

    it('should update shape style', () => {
      const element = createShapeElement('rectangle')
      
      element.updateShapeStyle({
        cornerRadius: 10,
        strokeLineCap: 'square',
      })
      
      expect(element.shapeStyle).toEqual({
        cornerRadius: 10,
        strokeLineCap: 'square',
      })
    })
  })

  describe('Line Properties', () => {
    it('should handle line points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: 200, y: 25 },
      ]
      
      const element = createShapeElement('line', { points })
      
      expect(element.points).toEqual(points)
      
      const newPoints = [{ x: 0, y: 0 }, { x: 50, y: 50 }]
      element.points = newPoints
      expect(element.points).toEqual(newPoints)
    })
  })

  describe('Polygon Properties', () => {
    it('should handle polygon sides', () => {
      const element = createShapeElement('polygon', { sides: 6 })
      
      expect(element.sides).toBe(6)
      
      element.sides = 8
      expect(element.sides).toBe(8)
    })

    it('should handle custom vertices', () => {
      const vertices = [
        { x: 50, y: 0 },
        { x: 100, y: 50 },
        { x: 0, y: 50 },
      ]
      
      const element = createShapeElement('polygon', { vertices })
      
      expect(element.vertices).toEqual(vertices)
    })

    it('should generate regular polygon vertices', () => {
      const element = createShapeElement('polygon', {
        sides: 4,
        size: { width: 100, height: 100 },
      })
      
      const vertices = element.generateRegularPolygonVertices()
      
      expect(vertices).toHaveLength(4)
      // Check first vertex is at top center
      expect(vertices[0].x).toBeCloseTo(50, 5)
      expect(vertices[0].y).toBeCloseTo(0, 5)
    })

    it('should return empty array for invalid polygon', () => {
      const element = createShapeElement('rectangle')
      expect(element.generateRegularPolygonVertices()).toEqual([])
      
      const polygonElement = createShapeElement('polygon', { sides: 2 })
      expect(polygonElement.generateRegularPolygonVertices()).toEqual([])
    })
  })

  describe('Path Generation', () => {
    it('should generate rectangle path', () => {
      const element = createShapeElement('rectangle')
      const path = element.getPath()
      
      expect(path).toBe('M 0 0 L 100 0 L 100 50 L 0 50 Z')
    })

    it('should generate rounded rectangle path', () => {
      const element = createShapeElement('rectangle', {
        shapeStyle: { cornerRadius: 5 },
      })
      const path = element.getPath()
      
      expect(path).toContain('M 5 0')
      expect(path).toContain('Q')
    })

    it('should generate circle path', () => {
      const element = createShapeElement('circle', {
        size: { width: 100, height: 100 },
      })
      const path = element.getPath()
      
      expect(path).toContain('M 50 0')
      expect(path).toContain('A 50 50')
    })

    it('should generate ellipse path', () => {
      const element = createShapeElement('ellipse')
      const path = element.getPath()
      
      expect(path).toContain('A 50 25')
    })

    it('should generate line path from points', () => {
      const element = createShapeElement('line', {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 25 },
          { x: 100, y: 50 },
        ],
      })
      const path = element.getPath()
      
      expect(path).toBe('M 0 0 L 50 25 L 100 50')
    })

    it('should generate default line path', () => {
      const element = createShapeElement('line')
      const path = element.getPath()
      
      expect(path).toBe('M 0 0 L 100 50')
    })

    it('should generate polygon path from vertices', () => {
      const element = createShapeElement('polygon', {
        vertices: [
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 0, y: 50 },
        ],
      })
      const path = element.getPath()
      
      expect(path).toBe('M 50 0 L 100 50 L 0 50 Z')
    })

    it('should generate regular polygon path', () => {
      const element = createShapeElement('polygon', {
        sides: 3,
        size: { width: 100, height: 100 },
      })
      const path = element.getPath()
      
      expect(path).toMatch(/^M \d+\.?\d* \d+\.?\d*/)
      expect(path).toContain(' Z')
    })
  })

  describe('Bounding Box', () => {
    it('should return standard bounding box for shapes', () => {
      const element = createShapeElement('rectangle')
      const box = element.getBoundingBox()
      
      expect(box).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      })
    })

    it('should calculate bounding box for line', () => {
      const element = createShapeElement('line', {
        points: [
          { x: 10, y: 20 },
          { x: 110, y: 70 },
          { x: 60, y: 10 },
        ],
      })
      const box = element.getBoundingBox()
      
      expect(box).toEqual({
        x: 20, // position.x + minX
        y: 30, // position.y + minY
        width: 100,
        height: 60,
      })
    })
  })

  describe('Point Containment', () => {
    it('should check point in rectangle', () => {
      const element = createShapeElement('rectangle')
      
      expect(element.containsPoint(50, 40)).toBe(true)
      expect(element.containsPoint(10, 20)).toBe(true)
      expect(element.containsPoint(110, 70)).toBe(true)
      expect(element.containsPoint(5, 40)).toBe(false)
      expect(element.containsPoint(115, 40)).toBe(false)
    })

    it('should check point in circle', () => {
      const element = createShapeElement('circle', {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      })
      
      expect(element.containsPoint(50, 50)).toBe(true) // Center
      expect(element.containsPoint(50, 0)).toBe(true) // Edge
      expect(element.containsPoint(100, 50)).toBe(true) // Edge
      expect(element.containsPoint(100, 100)).toBe(false) // Outside
    })

    it('should check point in ellipse', () => {
      const element = createShapeElement('ellipse', {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      })
      
      expect(element.containsPoint(50, 25)).toBe(true) // Center
      expect(element.containsPoint(100, 25)).toBe(true) // Edge
      expect(element.containsPoint(50, 50)).toBe(true) // Edge
      expect(element.containsPoint(100, 50)).toBe(false) // Outside
    })

    it('should check point near line', () => {
      const element = createShapeElement('line', {
        position: { x: 0, y: 0 },
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      })
      
      expect(element.containsPoint(50, 0)).toBe(true) // On line
      expect(element.containsPoint(50, 3)).toBe(true) // Near line
      expect(element.containsPoint(50, 10)).toBe(false) // Far from line
    })

    it('should check point in polygon', () => {
      const element = createShapeElement('polygon', {
        position: { x: 0, y: 0 },
        vertices: [
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 50, y: 100 },
          { x: 0, y: 50 },
        ],
      })
      
      expect(element.containsPoint(50, 50)).toBe(true) // Center
      expect(element.containsPoint(25, 50)).toBe(true) // Inside
      expect(element.containsPoint(0, 0)).toBe(false) // Outside
      expect(element.containsPoint(100, 100)).toBe(false) // Outside
    })
  })

  describe('Clone', () => {
    it('should clone shape with all properties', () => {
      const element = createShapeElement('polygon', {
        shapeStyle: { cornerRadius: 5 },
        sides: 6,
        vertices: [{ x: 0, y: 0 }, { x: 50, y: 50 }],
      })
      
      const clone = element.clone()
      
      expect(clone.id).not.toBe(element.id)
      expect(clone.shapeType).toBe('polygon')
      expect(clone.shapeStyle).toEqual({ cornerRadius: 5 })
      expect(clone.sides).toBe(6)
      expect(clone.vertices).toEqual([{ x: 0, y: 0 }, { x: 50, y: 50 }])
    })
  })
})