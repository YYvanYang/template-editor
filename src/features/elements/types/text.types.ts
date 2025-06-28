import { BaseElement, type BaseElementData } from './base.types'

export interface TextStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline' | 'line-through'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  letterSpacing?: number
  color?: string
}

export interface TextElementData extends BaseElementData {
  type: 'text'
  content: string
  textStyle?: TextStyle
  maxLines?: number
  ellipsis?: boolean
  autoSize?: boolean
  minFontSize?: number
  maxFontSize?: number
  binding?: string // Data binding expression like {{variable}}
}

export class TextElement extends BaseElement<TextElementData> {
  constructor(data: Omit<TextElementData, 'type'>) {
    super({ ...data, type: 'text' })
  }

  get content(): string {
    return this._data.content
  }

  set content(value: string) {
    this._data.content = value
  }

  get textStyle(): TextStyle {
    return { ...this._data.textStyle }
  }

  set textStyle(value: TextStyle) {
    this._data.textStyle = { ...value }
  }

  get fontFamily(): string {
    return this._data.textStyle?.fontFamily ?? 'Arial'
  }

  get fontSize(): number {
    return this._data.textStyle?.fontSize ?? 14
  }

  get fontWeight(): string {
    return this._data.textStyle?.fontWeight ?? 'normal'
  }

  get fontStyle(): string {
    return this._data.textStyle?.fontStyle ?? 'normal'
  }

  get textAlign(): string {
    return this._data.textStyle?.textAlign ?? 'left'
  }

  get verticalAlign(): string {
    return this._data.textStyle?.verticalAlign ?? 'top'
  }

  get color(): string {
    return this._data.textStyle?.color ?? '#000000'
  }

  get lineHeight(): number {
    return this._data.textStyle?.lineHeight ?? 1.2
  }

  get letterSpacing(): number {
    return this._data.textStyle?.letterSpacing ?? 0
  }

  get maxLines(): number | undefined {
    return this._data.maxLines
  }

  set maxLines(value: number | undefined) {
    this._data.maxLines = value
  }

  get ellipsis(): boolean {
    return this._data.ellipsis ?? false
  }

  set ellipsis(value: boolean) {
    this._data.ellipsis = value
  }

  get autoSize(): boolean {
    return this._data.autoSize ?? false
  }

  set autoSize(value: boolean) {
    this._data.autoSize = value
  }

  get binding(): string | undefined {
    return this._data.binding
  }

  set binding(value: string | undefined) {
    this._data.binding = value
  }

  // Update text style property
  updateTextStyle(style: Partial<TextStyle>): void {
    this._data.textStyle = {
      ...this._data.textStyle,
      ...style,
    }
  }

  // Process content with data binding
  processContent(data: Record<string, any>): string {
    if (!this._data.binding) {
      return this._data.content
    }

    let content = this._data.content
    const bindingRegex = /\{\{([^}]+)\}\}/g
    
    return content.replace(bindingRegex, (match, expression) => {
      const trimmed = expression.trim()
      const value = this.resolveBinding(trimmed, data)
      return value !== undefined ? String(value) : match
    })
  }

  private resolveBinding(expression: string, data: Record<string, any>): any {
    const parts = expression.split('.')
    let current = data
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }
    
    return current
  }

  // Calculate text metrics
  getTextMetrics(ctx: CanvasRenderingContext2D): TextMetrics {
    ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`
    return ctx.measureText(this.content)
  }

  render(): React.ReactNode {
    // This will be implemented when we create the React component
    return null
  }

  getBoundingBox(): { x: number; y: number; width: number; height: number } {
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