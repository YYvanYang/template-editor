/**
 * Image Resource Manager
 * 
 * Professional-grade image management system with:
 * - LRU cache mechanism
 * - Preloading strategy
 * - Memory management
 * - Performance monitoring
 */

import { LRUCache } from '@/shared/utils/lru-cache'

export interface ImageResource {
  url: string
  blob?: Blob
  objectUrl?: string
  width: number
  height: number
  size: number
  format: string
  lastAccess: number
  preloaded?: boolean
  error?: Error
}

export interface ImageManagerConfig {
  maxCacheSize: number // in bytes
  maxCacheItems: number
  preloadRadius: number // number of adjacent images to preload
  enableWebP: boolean
  enableCompression: boolean
  compressionQuality: number
}

export interface ImageLoadOptions {
  priority?: 'high' | 'normal' | 'low'
  signal?: AbortSignal
  forceReload?: boolean
  preload?: boolean
}

class ImageManager {
  private cache: LRUCache<string, ImageResource>
  private loadingMap: Map<string, Promise<ImageResource>>
  private preloadQueue: Set<string>
  private config: ImageManagerConfig
  private totalCacheSize: number = 0
  private performanceMetrics: {
    hits: number
    misses: number
    loads: number
    errors: number
  }

  constructor(config?: Partial<ImageManagerConfig>) {
    this.config = {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxCacheItems: 500,
      preloadRadius: 2,
      enableWebP: true,
      enableCompression: true,
      compressionQuality: 0.9,
      ...config,
    }

    this.cache = new LRUCache<string, ImageResource>({
      max: this.config.maxCacheItems,
      dispose: (key, value) => {
        this.onCacheEvict(value)
      },
    })

    this.loadingMap = new Map()
    this.preloadQueue = new Set()
    this.performanceMetrics = {
      hits: 0,
      misses: 0,
      loads: 0,
      errors: 0,
    }

    // Start preload worker
    this.startPreloadWorker()
  }

  /**
   * Load an image with caching and optimization
   */
  async loadImage(url: string, options: ImageLoadOptions = {}): Promise<ImageResource> {
    // Check cache first
    const cached = this.cache.get(url)
    if (cached && !options.forceReload) {
      this.performanceMetrics.hits++
      cached.lastAccess = Date.now()
      return cached
    }

    this.performanceMetrics.misses++

    // Check if already loading
    const loading = this.loadingMap.get(url)
    if (loading && !options.forceReload) {
      return loading
    }

    // Start loading
    const loadPromise = this.performLoad(url, options)
    this.loadingMap.set(url, loadPromise)

    try {
      const resource = await loadPromise
      this.cache.set(url, resource)
      this.totalCacheSize += resource.size
      this.enforceMemoryLimit()
      return resource
    } finally {
      this.loadingMap.delete(url)
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.loadImage(url, { preload: true, priority: 'low' })
        .catch(error => {
          console.warn(`Failed to preload image: ${url}`, error)
        })
    )
    await Promise.all(promises)
  }

  /**
   * Get adjacent images for preloading
   */
  getAdjacentImages(currentUrl: string, allUrls: string[]): string[] {
    const index = allUrls.indexOf(currentUrl)
    if (index === -1) return []

    const radius = this.config.preloadRadius
    const start = Math.max(0, index - radius)
    const end = Math.min(allUrls.length, index + radius + 1)

    return allUrls.slice(start, end).filter(url => url !== currentUrl)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.forEach((key, value) => {
      if (value.objectUrl) {
        URL.revokeObjectURL(value.objectUrl)
      }
    })
    this.cache.clear()
    this.totalCacheSize = 0
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.totalCacheSize,
      cacheItems: this.cache.size,
      ...this.performanceMetrics,
      hitRate: this.performanceMetrics.hits / 
        (this.performanceMetrics.hits + this.performanceMetrics.misses) || 0,
    }
  }

  /**
   * Check if WebP is supported
   */
  private async checkWebPSupport(): Promise<boolean> {
    if (!this.config.enableWebP) return false

    return new Promise(resolve => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  /**
   * Perform the actual image loading
   */
  private async performLoad(
    url: string, 
    options: ImageLoadOptions
  ): Promise<ImageResource> {
    this.performanceMetrics.loads++

    try {
      // Fetch the image
      const response = await fetch(url, {
        signal: options.signal,
        priority: options.priority,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      // Get image dimensions
      const dimensions = await this.getImageDimensions(objectUrl)

      // Detect format
      const format = blob.type || this.detectFormat(url)

      const resource: ImageResource = {
        url,
        blob,
        objectUrl,
        width: dimensions.width,
        height: dimensions.height,
        size: blob.size,
        format,
        lastAccess: Date.now(),
        preloaded: options.preload,
      }

      return resource
    } catch (error) {
      this.performanceMetrics.errors++
      throw error
    }
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        reject(new Error('Failed to load image for dimensions'))
      }
      img.src = url
    })
  }

  /**
   * Detect image format from URL
   */
  private detectFormat(url: string): string {
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
   * Handle cache eviction
   */
  private onCacheEvict(resource: ImageResource): void {
    if (resource.objectUrl) {
      URL.revokeObjectURL(resource.objectUrl)
    }
    this.totalCacheSize -= resource.size
  }

  /**
   * Enforce memory limit
   */
  private enforceMemoryLimit(): void {
    while (this.totalCacheSize > this.config.maxCacheSize && this.cache.size > 0) {
      const oldest = this.cache.removeOldest()
      if (!oldest) break
    }
  }

  /**
   * Start preload worker
   */
  private startPreloadWorker(): void {
    // Implement background preloading logic
    setInterval(() => {
      if (this.preloadQueue.size > 0) {
        const urls = Array.from(this.preloadQueue).slice(0, 3)
        urls.forEach(url => {
          this.preloadQueue.delete(url)
          this.loadImage(url, { preload: true, priority: 'low' })
            .catch(() => {}) // Ignore preload errors
        })
      }
    }, 1000)
  }

  /**
   * Add URLs to preload queue
   */
  queuePreload(urls: string[]): void {
    urls.forEach(url => {
      if (!this.cache.has(url)) {
        this.preloadQueue.add(url)
      }
    })
  }
}

// Singleton instance
let imageManagerInstance: ImageManager | null = null

export function getImageManager(config?: Partial<ImageManagerConfig>): ImageManager {
  if (!imageManagerInstance) {
    imageManagerInstance = new ImageManager(config)
  }
  return imageManagerInstance
}

export function resetImageManager(): void {
  if (imageManagerInstance) {
    imageManagerInstance.clearCache()
    imageManagerInstance = null
  }
}

export default ImageManager