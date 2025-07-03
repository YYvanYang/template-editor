/**
 * Image Processor
 * 
 * Advanced image processing capabilities:
 * - Format conversion
 * - Compression
 * - Resizing
 * - Cropping
 * - Filters
 */

export interface ProcessOptions {
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number // 0-1
  maxWidth?: number
  maxHeight?: number
  width?: number
  height?: number
  crop?: CropOptions
  preserveAspectRatio?: boolean
  backgroundColor?: string // For transparent to opaque conversion
}

export interface CropOptions {
  x: number
  y: number
  width: number
  height: number
}

export interface ProcessResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  format: string
  size: number
  compressionRatio?: number
}

export class ImageProcessor {
  private static readonly DEFAULT_QUALITY = 0.9
  private static readonly DEFAULT_FORMAT = 'jpeg'

  /**
   * Process an image with various transformations
   */
  static async process(
    source: Blob | string,
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    // Load image
    const img = await this.loadImage(source)

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Calculate dimensions
    const dimensions = this.calculateDimensions(img, options)
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Apply background color if needed
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Apply crop if specified
    if (options.crop) {
      this.drawCropped(ctx, img, options.crop, dimensions)
    } else {
      // Draw image with calculated dimensions
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
    }

    // Convert to blob
    const format = options.format || this.DEFAULT_FORMAT
    const quality = options.quality || this.DEFAULT_QUALITY
    const blob = await this.canvasToBlob(canvas, format, quality)

    // Get data URL
    const dataUrl = canvas.toDataURL(`image/${format}`, quality)

    // Calculate compression ratio if original was provided as blob
    let compressionRatio: number | undefined
    if (source instanceof Blob) {
      compressionRatio = blob.size / source.size
    }

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      format: `image/${format}`,
      size: blob.size,
      compressionRatio,
    }
  }

  /**
   * Compress image to target size
   */
  static async compressToSize(
    source: Blob | string,
    targetSize: number,
    options: Omit<ProcessOptions, 'quality'> = {}
  ): Promise<ProcessResult> {
    let quality = 0.9
    let result: ProcessResult | null = null
    let attempts = 0
    const maxAttempts = 10

    // Binary search for optimal quality
    let minQuality = 0.1
    let maxQuality = 1.0

    while (attempts < maxAttempts) {
      quality = (minQuality + maxQuality) / 2
      result = await this.process(source, { ...options, quality })

      if (result.size <= targetSize) {
        // If we're under target, try higher quality
        if (maxQuality - quality < 0.05) {
          break // Close enough
        }
        minQuality = quality
      } else {
        // If we're over target, reduce quality
        maxQuality = quality
      }

      attempts++
    }

    if (!result || result.size > targetSize) {
      // Last attempt with minimum quality
      result = await this.process(source, { ...options, quality: minQuality })
    }

    return result
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    source: Blob | string,
    size: number,
    options: Omit<ProcessOptions, 'width' | 'height'> = {}
  ): Promise<ProcessResult> {
    return this.process(source, {
      ...options,
      maxWidth: size,
      maxHeight: size,
      preserveAspectRatio: true,
    })
  }

  /**
   * Convert format
   */
  static async convertFormat(
    source: Blob | string,
    format: 'jpeg' | 'png' | 'webp',
    options: Omit<ProcessOptions, 'format'> = {}
  ): Promise<ProcessResult> {
    return this.process(source, {
      ...options,
      format,
    })
  }

  /**
   * Auto-optimize image
   */
  static async autoOptimize(
    source: Blob | string,
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    // Check if WebP is supported
    const webpSupported = await this.checkWebPSupport()
    
    // Determine best format
    let format: 'jpeg' | 'png' | 'webp' = 'jpeg'
    if (webpSupported) {
      format = 'webp'
    } else if (source instanceof Blob && source.type === 'image/png') {
      // Check if PNG has transparency
      const hasTransparency = await this.checkTransparency(source)
      if (hasTransparency) {
        format = 'png'
      }
    }

    // Process with optimal settings
    return this.process(source, {
      ...options,
      format,
      quality: format === 'png' ? 1 : 0.85,
    })
  }

  /**
   * Load image from source
   */
  private static loadImage(source: Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))

      if (source instanceof Blob) {
        img.src = URL.createObjectURL(source)
      } else {
        img.src = source
      }
    })
  }

  /**
   * Calculate output dimensions
   */
  private static calculateDimensions(
    img: HTMLImageElement,
    options: ProcessOptions
  ): { width: number; height: number } {
    let { width, height } = img
    const aspectRatio = width / height

    // If specific dimensions are provided
    if (options.width && options.height) {
      return { width: options.width, height: options.height }
    }

    // If only width is provided
    if (options.width) {
      return {
        width: options.width,
        height: options.preserveAspectRatio
          ? Math.round(options.width / aspectRatio)
          : options.height || height,
      }
    }

    // If only height is provided
    if (options.height) {
      return {
        width: options.preserveAspectRatio
          ? Math.round(options.height * aspectRatio)
          : options.width || width,
        height: options.height,
      }
    }

    // If max dimensions are provided
    if (options.maxWidth || options.maxHeight) {
      const maxWidth = options.maxWidth || Infinity
      const maxHeight = options.maxHeight || Infinity

      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
    }

    return { width, height }
  }

  /**
   * Draw cropped image
   */
  private static drawCropped(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    crop: CropOptions,
    canvasDimensions: { width: number; height: number }
  ): void {
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvasDimensions.width,
      canvasDimensions.height
    )
  }

  /**
   * Convert canvas to blob
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }

  /**
   * Check WebP support
   */
  private static async checkWebPSupport(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  /**
   * Check if image has transparency
   */
  private static async checkTransparency(blob: Blob): Promise<boolean> {
    const img = await this.loadImage(blob)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return false

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Check alpha channel
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true
      }
    }

    return false
  }

  /**
   * Apply filters
   */
  static async applyFilters(
    source: Blob | string,
    filters: {
      brightness?: number
      contrast?: number
      grayscale?: number
      blur?: number
      sepia?: number
      saturate?: number
      hueRotate?: number
      invert?: number
    }
  ): Promise<ProcessResult> {
    const img = await this.loadImage(source)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    canvas.width = img.width
    canvas.height = img.height

    // Apply CSS filters
    const filterStrings: string[] = []
    if (filters.brightness !== undefined) {
      filterStrings.push(`brightness(${filters.brightness}%)`)
    }
    if (filters.contrast !== undefined) {
      filterStrings.push(`contrast(${filters.contrast}%)`)
    }
    if (filters.grayscale !== undefined) {
      filterStrings.push(`grayscale(${filters.grayscale}%)`)
    }
    if (filters.blur !== undefined) {
      filterStrings.push(`blur(${filters.blur}px)`)
    }
    if (filters.sepia !== undefined) {
      filterStrings.push(`sepia(${filters.sepia}%)`)
    }
    if (filters.saturate !== undefined) {
      filterStrings.push(`saturate(${filters.saturate}%)`)
    }
    if (filters.hueRotate !== undefined) {
      filterStrings.push(`hue-rotate(${filters.hueRotate}deg)`)
    }
    if (filters.invert !== undefined) {
      filterStrings.push(`invert(${filters.invert}%)`)
    }

    ctx.filter = filterStrings.join(' ')
    ctx.drawImage(img, 0, 0)

    const blob = await this.canvasToBlob(canvas, 'png', 1)
    const dataUrl = canvas.toDataURL('image/png')

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      format: 'image/png',
      size: blob.size,
    }
  }
}