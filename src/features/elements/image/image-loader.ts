/**
 * Smart Image Loader
 * 
 * Supports multiple sources:
 * - URLs (HTTP/HTTPS)
 * - Base64 data URLs
 * - File uploads
 * - Blob URLs
 */

export type ImageSource = string | File | Blob

export interface ImageLoadResult {
  url: string
  objectUrl?: string
  width: number
  height: number
  format: string
  size: number
  originalSource: ImageSource
}

export interface ImageLoadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface ImageLoaderOptions {
  onProgress?: (progress: ImageLoadProgress) => void
  signal?: AbortSignal
  maxSize?: number // Maximum file size in bytes
  acceptedFormats?: string[] // e.g., ['image/jpeg', 'image/png']
  timeout?: number // Timeout in milliseconds
}

export class ImageLoader {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly DEFAULT_TIMEOUT = 30000 // 30 seconds
  private static readonly ACCEPTED_FORMATS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/ico',
    'image/x-icon',
  ]

  /**
   * Load image from various sources
   */
  static async load(
    source: ImageSource,
    options: ImageLoaderOptions = {}
  ): Promise<ImageLoadResult> {
    // Validate source
    if (!source) {
      throw new Error('Image source is required')
    }

    // Determine source type and load accordingly
    if (source instanceof File || source instanceof Blob) {
      return this.loadFromBlob(source, options)
    } else if (typeof source === 'string') {
      if (this.isDataUrl(source)) {
        return this.loadFromDataUrl(source, options)
      } else if (this.isBlobUrl(source)) {
        return this.loadFromBlobUrl(source, options)
      } else {
        return this.loadFromUrl(source, options)
      }
    } else {
      throw new Error('Invalid image source type')
    }
  }

  /**
   * Load image from URL
   */
  private static async loadFromUrl(
    url: string,
    options: ImageLoaderOptions
  ): Promise<ImageLoadResult> {
    const controller = new AbortController()
    const signal = options.signal || controller.signal

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, options.timeout || this.DEFAULT_TIMEOUT)

    try {
      const response = await fetch(url, {
        signal,
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.statusText}`)
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (contentType && !this.isAcceptedFormat(contentType, options.acceptedFormats)) {
        throw new Error(`Unsupported image format: ${contentType}`)
      }

      // Get total size for progress
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      // Read response with progress
      const blob = await this.readResponseWithProgress(
        response,
        total,
        options.onProgress
      )

      // Validate size
      if (options.maxSize && blob.size > options.maxSize) {
        throw new Error(`Image size exceeds maximum allowed size of ${options.maxSize} bytes`)
      }

      // Create object URL and get dimensions
      const objectUrl = URL.createObjectURL(blob)
      const dimensions = await this.getImageDimensions(objectUrl)

      return {
        url,
        objectUrl,
        width: dimensions.width,
        height: dimensions.height,
        format: blob.type || this.guessFormat(url),
        size: blob.size,
        originalSource: url,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Image loading was cancelled or timed out')
      }
      throw error
    }
  }

  /**
   * Load image from Blob or File
   */
  private static async loadFromBlob(
    blob: Blob | File,
    options: ImageLoaderOptions
  ): Promise<ImageLoadResult> {
    // Validate format
    if (!this.isAcceptedFormat(blob.type, options.acceptedFormats)) {
      throw new Error(`Unsupported image format: ${blob.type}`)
    }

    // Validate size
    if (options.maxSize && blob.size > options.maxSize) {
      throw new Error(`Image size exceeds maximum allowed size of ${options.maxSize} bytes`)
    }

    // Create object URL
    const objectUrl = URL.createObjectURL(blob)

    try {
      // Get dimensions
      const dimensions = await this.getImageDimensions(objectUrl)

      // For files, we might want to use the file name as URL
      const url = blob instanceof File ? blob.name : objectUrl

      return {
        url,
        objectUrl,
        width: dimensions.width,
        height: dimensions.height,
        format: blob.type,
        size: blob.size,
        originalSource: blob,
      }
    } catch (error) {
      URL.revokeObjectURL(objectUrl)
      throw error
    }
  }

  /**
   * Load image from data URL
   */
  private static async loadFromDataUrl(
    dataUrl: string,
    options: ImageLoaderOptions
  ): Promise<ImageLoadResult> {
    // Parse data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid data URL format')
    }

    const [, mimeType, base64Data] = matches

    // Validate format
    if (!this.isAcceptedFormat(mimeType, options.acceptedFormats)) {
      throw new Error(`Unsupported image format: ${mimeType}`)
    }

    // Convert to blob
    const blob = this.base64ToBlob(base64Data, mimeType)

    // Validate size
    if (options.maxSize && blob.size > options.maxSize) {
      throw new Error(`Image size exceeds maximum allowed size of ${options.maxSize} bytes`)
    }

    // Get dimensions
    const dimensions = await this.getImageDimensions(dataUrl)

    return {
      url: dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      format: mimeType,
      size: blob.size,
      originalSource: dataUrl,
    }
  }

  /**
   * Load image from blob URL
   */
  private static async loadFromBlobUrl(
    blobUrl: string,
    options: ImageLoaderOptions
  ): Promise<ImageLoadResult> {
    // Fetch the blob
    const response = await fetch(blobUrl)
    const blob = await response.blob()

    // Load as blob
    const result = await this.loadFromBlob(blob, options)
    return {
      ...result,
      url: blobUrl,
      originalSource: blobUrl,
    }
  }

  /**
   * Read response with progress tracking
   */
  private static async readResponseWithProgress(
    response: Response,
    total: number,
    onProgress?: (progress: ImageLoadProgress) => void
  ): Promise<Blob> {
    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      loaded += value.length

      if (onProgress) {
        onProgress({
          loaded,
          total,
          percentage: total > 0 ? (loaded / total) * 100 : 0,
        })
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, {
      type: response.headers.get('content-type') || 'image/unknown',
    })

    return blob
  }

  /**
   * Get image dimensions
   */
  private static getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()

      const cleanup = () => {
        img.onload = null
        img.onerror = null
      }

      img.onload = () => {
        cleanup()
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }

      img.onerror = () => {
        cleanup()
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Convert base64 to blob
   */
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  /**
   * Check if URL is a data URL
   */
  private static isDataUrl(url: string): boolean {
    return url.startsWith('data:')
  }

  /**
   * Check if URL is a blob URL
   */
  private static isBlobUrl(url: string): boolean {
    return url.startsWith('blob:')
  }

  /**
   * Check if format is accepted
   */
  private static isAcceptedFormat(
    format: string,
    acceptedFormats?: string[]
  ): boolean {
    const formats = acceptedFormats || this.ACCEPTED_FORMATS
    return formats.includes(format.toLowerCase())
  }

  /**
   * Guess format from URL
   */
  private static guessFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    const formatMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
    }
    return formatMap[extension || ''] || 'image/unknown'
  }

  /**
   * Create image element for testing/preview
   */
  static createImageElement(result: ImageLoadResult): HTMLImageElement {
    const img = new Image()
    img.src = result.objectUrl || result.url
    img.width = result.width
    img.height = result.height
    return img
  }

  /**
   * Clean up resources
   */
  static cleanup(result: ImageLoadResult): void {
    if (result.objectUrl && result.objectUrl !== result.url) {
      URL.revokeObjectURL(result.objectUrl)
    }
  }
}