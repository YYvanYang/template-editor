/**
 * Tests for Image Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImageManager, getImageManager, resetImageManager } from './image-manager'

// Mock fetch
global.fetch = vi.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('ImageManager', () => {
  let manager: ImageManager

  beforeEach(() => {
    resetImageManager()
    manager = getImageManager()
    vi.clearAllMocks()
  })

  afterEach(() => {
    manager.clearCache()
  })

  describe('loadImage', () => {
    it('should load and cache an image', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any)

      // Mock image loading
      const mockImage = {
        naturalWidth: 100,
        naturalHeight: 100,
        onload: null as any,
        onerror: null as any,
        src: '',
      }

      global.Image = vi.fn().mockImplementation(() => {
        setTimeout(() => mockImage.onload?.(), 0)
        return mockImage
      }) as any

      const result = await manager.loadImage('test.jpg')

      expect(result).toMatchObject({
        url: 'test.jpg',
        width: 100,
        height: 100,
        format: 'image/jpeg',
        size: mockBlob.size,
      })

      // Check cache hit
      const cached = await manager.loadImage('test.jpg')
      expect(cached).toBe(result)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle loading errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(manager.loadImage('test.jpg')).rejects.toThrow('Network error')
    })

    it('should respect force reload option', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      // Mock image
      global.Image = vi.fn().mockImplementation(() => ({
        naturalWidth: 100,
        naturalHeight: 100,
        onload: function() { setTimeout(() => this.onload?.(), 0) },
        src: '',
      })) as any

      await manager.loadImage('test.jpg')
      await manager.loadImage('test.jpg', { forceReload: true })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('preloadImages', () => {
    it('should preload multiple images', async () => {
      const urls = ['img1.jpg', 'img2.jpg', 'img3.jpg']
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      global.Image = vi.fn().mockImplementation(() => ({
        naturalWidth: 100,
        naturalHeight: 100,
        onload: function() { setTimeout(() => this.onload?.(), 0) },
        src: '',
      })) as any

      await manager.preloadImages(urls)

      expect(global.fetch).toHaveBeenCalledTimes(3)
      urls.forEach(url => {
        expect(global.fetch).toHaveBeenCalledWith(
          url,
          expect.objectContaining({ priority: 'low' })
        )
      })
    })
  })

  describe('cache management', () => {
    it('should enforce memory limits', async () => {
      // Create manager with small cache
      resetImageManager()
      manager = getImageManager({
        maxCacheSize: 1000, // 1KB
        maxCacheItems: 10,
      })

      const largeBlobSize = 600
      const mockBlob = new Blob(new Array(largeBlobSize).fill('x'), { type: 'image/jpeg' })
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      global.Image = vi.fn().mockImplementation(() => ({
        naturalWidth: 100,
        naturalHeight: 100,
        onload: function() { setTimeout(() => this.onload?.(), 0) },
        src: '',
      })) as any

      // Load first image
      await manager.loadImage('img1.jpg')
      const stats1 = manager.getStats()
      expect(stats1.cacheItems).toBe(1)

      // Load second image - should evict first
      await manager.loadImage('img2.jpg')
      const stats2 = manager.getStats()
      expect(stats2.cacheItems).toBe(1)
      expect(stats2.cacheSize).toBeLessThanOrEqual(1000)
    })

    it('should clean up object URLs on eviction', async () => {
      resetImageManager()
      manager = getImageManager({ maxCacheItems: 1 })

      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      global.Image = vi.fn().mockImplementation(() => ({
        naturalWidth: 100,
        naturalHeight: 100,
        onload: function() { setTimeout(() => this.onload?.(), 0) },
        src: '',
      })) as any

      await manager.loadImage('img1.jpg')
      await manager.loadImage('img2.jpg')

      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('statistics', () => {
    it('should track performance metrics', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
      const mockResponse = {
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      global.Image = vi.fn().mockImplementation(() => ({
        naturalWidth: 100,
        naturalHeight: 100,
        onload: function() { setTimeout(() => this.onload?.(), 0) },
        src: '',
      })) as any

      // First load - miss
      await manager.loadImage('test.jpg')
      
      // Second load - hit
      await manager.loadImage('test.jpg')

      // Failed load
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))
      await manager.loadImage('error.jpg').catch(() => {})

      const stats = manager.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(2)
      expect(stats.loads).toBe(2)
      expect(stats.errors).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.333, 2)
    })
  })
})