import { BaseElementClass as BaseElement, type BaseElementData } from './base.types'

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'ellipse' | 'polygon'

export interface ShapeStyle {
  cornerRadius?: number | number[] // For rounded corners on rectangles
  strokeDashArray?: number[] // For dashed lines
  strokeLineCap?: 'butt' | 'round' | 'square'
  strokeLineJoin?: 'miter' | 'round' | 'bevel'
}

export interface ShapeElementData extends BaseElementData {
  type: 'shape'
  shapeType: ShapeType
  shapeStyle?: ShapeStyle
  // For line shapes
  points?: Array<{ x: number; y: number }>
  // For polygon shapes
  sides?: number // For regular polygons
  // For custom polygons
  vertices?: Array<{ x: number; y: number }>
}

export class ShapeElement extends BaseElement<ShapeElementData> {
  constructor(data: Omit<ShapeElementData, 'type'>) {
    super({ ...data, type: 'shape' })
  }

  get shapeType(): ShapeType {
    return this._data.shapeType
  }

  set shapeType(value: ShapeType) {
    this._data.shapeType = value
  }

  get shapeStyle(): ShapeStyle {
    return { ...this._data.shapeStyle }
  }

  set shapeStyle(value: ShapeStyle) {
    this._data.shapeStyle = { ...value }
  }

  get cornerRadius(): number | number[] {
    return this._data.shapeStyle?.cornerRadius ?? 0
  }

  get strokeDashArray(): number[] | undefined {
    return this._data.shapeStyle?.strokeDashArray
  }

  get points(): Array<{ x: number; y: number }> | undefined {
    return this._data.points
  }

  set points(value: Array<{ x: number; y: number }> | undefined) {
    this._data.points = value
  }

  get sides(): number | undefined {
    return this._data.sides
  }

  set sides(value: number | undefined) {
    this._data.sides = value
  }

  get vertices(): Array<{ x: number; y: number }> | undefined {
    return this._data.vertices
  }

  set vertices(value: Array<{ x: number; y: number }> | undefined) {
    this._data.vertices = value
  }

  // Update shape style property
  updateShapeStyle(style: Partial<ShapeStyle>): void {
    this._data.shapeStyle = {
      ...this._data.shapeStyle,
      ...style,
    }
  }

  // Generate vertices for regular polygon
  generateRegularPolygonVertices(): Array<{ x: number; y: number }> {
    if (this.shapeType !== 'polygon' || !this.sides || this.sides < 3) {
      return []
    }

    const vertices: Array<{ x: number; y: number }> = []
    const centerX = this.size.width / 2
    const centerY = this.size.height / 2
    const radiusX = this.size.width / 2
    const radiusY = this.size.height / 2
    const angleStep = (2 * Math.PI) / this.sides

    for (let i = 0; i < this.sides; i++) {
      const angle = i * angleStep - Math.PI / 2 // Start from top
      vertices.push({
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      })
    }

    return vertices
  }

  // Get path for the shape (useful for SVG or Canvas rendering)
  getPath(): string {
    switch (this.shapeType) {
      case 'rectangle': {
        const radius = this.cornerRadius
        if (!radius || (Array.isArray(radius) && radius.every(r => r === 0))) {
          return `M 0 0 L ${this.size.width} 0 L ${this.size.width} ${this.size.height} L 0 ${this.size.height} Z`
        }
        // Rounded rectangle
        const r = Array.isArray(radius) ? radius : [radius, radius, radius, radius]
        const [tl, tr, br, bl] = r
        return `
          M ${tl} 0
          L ${this.size.width - tr} 0
          Q ${this.size.width} 0 ${this.size.width} ${tr}
          L ${this.size.width} ${this.size.height - br}
          Q ${this.size.width} ${this.size.height} ${this.size.width - br} ${this.size.height}
          L ${bl} ${this.size.height}
          Q 0 ${this.size.height} 0 ${this.size.height - bl}
          L 0 ${tl}
          Q 0 0 ${tl} 0
          Z
        `.trim()
      }

      case 'circle':
        return `M ${this.size.width / 2} 0 A ${this.size.width / 2} ${this.size.height / 2} 0 1 0 ${this.size.width / 2} ${this.size.height} A ${this.size.width / 2} ${this.size.height / 2} 0 1 0 ${this.size.width / 2} 0 Z`

      case 'ellipse':
        return `M ${this.size.width / 2} 0 A ${this.size.width / 2} ${this.size.height / 2} 0 1 0 ${this.size.width / 2} ${this.size.height} A ${this.size.width / 2} ${this.size.height / 2} 0 1 0 ${this.size.width / 2} 0 Z`

      case 'line':
        if (this.points && this.points.length >= 2) {
          let path = `M ${this.points[0].x} ${this.points[0].y}`
          for (let i = 1; i < this.points.length; i++) {
            path += ` L ${this.points[i].x} ${this.points[i].y}`
          }
          return path
        }
        return `M 0 0 L ${this.size.width} ${this.size.height}`

      case 'polygon':
        const vertices = this.vertices || this.generateRegularPolygonVertices()
        if (vertices.length < 3) return ''
        let path = `M ${vertices[0].x} ${vertices[0].y}`
        for (let i = 1; i < vertices.length; i++) {
          path += ` L ${vertices[i].x} ${vertices[i].y}`
        }
        return path + ' Z'

      default:
        return ''
    }
  }

  render(): React.ReactNode {
    // This will be implemented when we create the React component
    return null
  }

  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    if (this.shapeType === 'line' && this.points && this.points.length >= 2) {
      const xs = this.points.map(p => p.x)
      const ys = this.points.map(p => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      const maxX = Math.max(...xs)
      const maxY = Math.max(...ys)
      
      return {
        x: this.position.x + minX,
        y: this.position.y + minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    }

    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    }
  }

  containsPoint(x: number, y: number): boolean {
    const relX = x - this.position.x
    const relY = y - this.position.y

    switch (this.shapeType) {
      case 'rectangle':
        return relX >= 0 && relX <= this.size.width && relY >= 0 && relY <= this.size.height

      case 'circle': {
        const centerX = this.size.width / 2
        const centerY = this.size.height / 2
        const radius = Math.min(this.size.width, this.size.height) / 2
        const distance = Math.sqrt(Math.pow(relX - centerX, 2) + Math.pow(relY - centerY, 2))
        return distance <= radius
      }

      case 'ellipse': {
        const centerX = this.size.width / 2
        const centerY = this.size.height / 2
        const radiusX = this.size.width / 2
        const radiusY = this.size.height / 2
        const normalizedX = (relX - centerX) / radiusX
        const normalizedY = (relY - centerY) / radiusY
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1
      }

      case 'line':
        // For lines, check if point is near the line within a threshold
        if (this.points && this.points.length >= 2) {
          const threshold = 5 // pixels
          for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i]
            const p2 = this.points[i + 1]
            const distance = this.pointToLineDistance(relX, relY, p1.x, p1.y, p2.x, p2.y)
            if (distance <= threshold) return true
          }
        }
        return false

      case 'polygon':
        const vertices = this.vertices || this.generateRegularPolygonVertices()
        return this.pointInPolygon(relX, relY, vertices)

      default:
        return false
    }
  }

  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  private pointInPolygon(x: number, y: number, vertices: Array<{ x: number; y: number }>): boolean {
    let inside = false
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x
      const yi = vertices[i].y
      const xj = vertices[j].x
      const yj = vertices[j].y
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }
}