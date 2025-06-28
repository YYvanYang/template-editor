import { BaseElement, type BaseElementData } from './base.types'

export type ImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
export type ImageAlign = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface ImageStyle {
  objectFit?: ImageFit
  objectPosition?: ImageAlign
  preserveAspectRatio?: boolean
  clipPath?: string
  filter?: {
    brightness?: number // 0-200, 100 is normal
    contrast?: number // 0-200, 100 is normal
    grayscale?: number // 0-100
    blur?: number // pixels
    sepia?: number // 0-100
    saturate?: number // 0-200, 100 is normal
    hueRotate?: number // degrees
    invert?: number // 0-100
  }
}

export interface ImageElementData extends BaseElementData {
  type: 'image'
  src: string
  alt?: string
  imageStyle?: ImageStyle
  naturalWidth?: number
  naturalHeight?: number
  loaded?: boolean
  error?: string
  binding?: string // Data binding for dynamic image URLs
}

export class ImageElement extends BaseElement<ImageElementData> {
  private _imageLoadPromise?: Promise<void>

  constructor(data: Omit<ImageElementData, 'type'>) {
    super({ ...data, type: 'image', loaded: data.loaded ?? false })
  }

  get src(): string {
    return this._data.src
  }

  set src(value: string) {
    this._data.src = value
    this._data.loaded = false
    this._data.error = undefined
  }

  get alt(): string {
    return this._data.alt ?? ''
  }

  set alt(value: string) {
    this._data.alt = value
  }

  get imageStyle(): ImageStyle {
    return { ...this._data.imageStyle }
  }

  set imageStyle(value: ImageStyle) {
    this._data.imageStyle = { ...value }
  }

  get objectFit(): ImageFit {
    return this._data.imageStyle?.objectFit ?? 'contain'
  }

  get objectPosition(): ImageAlign {
    return this._data.imageStyle?.objectPosition ?? 'center'
  }

  get preserveAspectRatio(): boolean {
    return this._data.imageStyle?.preserveAspectRatio ?? true
  }

  get naturalWidth(): number | undefined {
    return this._data.naturalWidth
  }

  get naturalHeight(): number | undefined {
    return this._data.naturalHeight
  }

  get aspectRatio(): number | undefined {
    if (this._data.naturalWidth && this._data.naturalHeight) {
      return this._data.naturalWidth / this._data.naturalHeight
    }
    return undefined
  }

  get loaded(): boolean {
    return this._data.loaded ?? false
  }

  get error(): string | undefined {
    return this._data.error
  }

  get binding(): string | undefined {
    return this._data.binding
  }

  set binding(value: string | undefined) {
    this._data.binding = value
  }

  // Update image style property
  updateImageStyle(style: Partial<ImageStyle>): void {
    this._data.imageStyle = {
      ...this._data.imageStyle,
      ...style,
    }
  }

  // Process src with data binding
  processSrc(data: Record<string, any>): string {
    if (!this._data.binding) {
      return this._data.src
    }

    const bindingRegex = /\{\{([^}]+)\}\}/g
    
    return this._data.src.replace(bindingRegex, (match, expression) => {
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

  // Load image and update dimensions
  loadImage(): Promise<void> {
    if (!this._imageLoadPromise) {
      this._imageLoadPromise = new Promise<void>((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          this._data.naturalWidth = img.naturalWidth
          this._data.naturalHeight = img.naturalHeight
          this._data.loaded = true
          this._data.error = undefined
          resolve()
        }
        
        img.onerror = () => {
          this._data.loaded = false
          this._data.error = 'Failed to load image'
          reject(new Error(this._data.error))
        }
        
        img.src = this._data.src
      })
    }

    return this._imageLoadPromise
  }

  // Calculate display dimensions based on fit mode
  getDisplayDimensions(): { width: number; height: number; x: number; y: number } {
    if (!this.naturalWidth || !this.naturalHeight) {
      return { width: this.size.width, height: this.size.height, x: 0, y: 0 }
    }

    const containerWidth = this.size.width
    const containerHeight = this.size.height
    const imageAspectRatio = this.naturalWidth / this.naturalHeight
    const containerAspectRatio = containerWidth / containerHeight

    let width = containerWidth
    let height = containerHeight
    let x = 0
    let y = 0

    switch (this.objectFit) {
      case 'contain':
        if (imageAspectRatio > containerAspectRatio) {
          width = containerWidth
          height = containerWidth / imageAspectRatio
        } else {
          height = containerHeight
          width = containerHeight * imageAspectRatio
        }
        break

      case 'cover':
        if (imageAspectRatio > containerAspectRatio) {
          height = containerHeight
          width = containerHeight * imageAspectRatio
        } else {
          width = containerWidth
          height = containerWidth / imageAspectRatio
        }
        break

      case 'fill':
        // Use container dimensions as-is
        break

      case 'none':
        width = this.naturalWidth
        height = this.naturalHeight
        break

      case 'scale-down':
        const containDims = this.getContainDimensions()
        width = Math.min(containDims.width, this.naturalWidth)
        height = Math.min(containDims.height, this.naturalHeight)
        break
    }

    // Apply object position
    switch (this.objectPosition) {
      case 'center':
        x = (containerWidth - width) / 2
        y = (containerHeight - height) / 2
        break
      case 'top':
        x = (containerWidth - width) / 2
        y = 0
        break
      case 'bottom':
        x = (containerWidth - width) / 2
        y = containerHeight - height
        break
      case 'left':
        x = 0
        y = (containerHeight - height) / 2
        break
      case 'right':
        x = containerWidth - width
        y = (containerHeight - height) / 2
        break
      case 'top-left':
        x = 0
        y = 0
        break
      case 'top-right':
        x = containerWidth - width
        y = 0
        break
      case 'bottom-left':
        x = 0
        y = containerHeight - height
        break
      case 'bottom-right':
        x = containerWidth - width
        y = containerHeight - height
        break
    }

    return { width, height, x, y }
  }

  private getContainDimensions(): { width: number; height: number } {
    if (!this.naturalWidth || !this.naturalHeight) {
      return { width: this.size.width, height: this.size.height }
    }

    const containerWidth = this.size.width
    const containerHeight = this.size.height
    const imageAspectRatio = this.naturalWidth / this.naturalHeight
    const containerAspectRatio = containerWidth / containerHeight

    if (imageAspectRatio > containerAspectRatio) {
      return {
        width: containerWidth,
        height: containerWidth / imageAspectRatio,
      }
    } else {
      return {
        width: containerHeight * imageAspectRatio,
        height: containerHeight,
      }
    }
  }

  // Generate CSS filter string
  getCSSFilter(): string {
    const filter = this._data.imageStyle?.filter
    if (!filter) return ''

    const filters: string[] = []
    
    if (filter.brightness !== undefined) filters.push(`brightness(${filter.brightness}%)`)
    if (filter.contrast !== undefined) filters.push(`contrast(${filter.contrast}%)`)
    if (filter.grayscale !== undefined) filters.push(`grayscale(${filter.grayscale}%)`)
    if (filter.blur !== undefined) filters.push(`blur(${filter.blur}px)`)
    if (filter.sepia !== undefined) filters.push(`sepia(${filter.sepia}%)`)
    if (filter.saturate !== undefined) filters.push(`saturate(${filter.saturate}%)`)
    if (filter.hueRotate !== undefined) filters.push(`hue-rotate(${filter.hueRotate}deg)`)
    if (filter.invert !== undefined) filters.push(`invert(${filter.invert}%)`)
    
    return filters.join(' ')
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