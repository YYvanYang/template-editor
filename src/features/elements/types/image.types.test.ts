import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImageElement, type ImageElementData } from './image.types'

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: '',
  naturalWidth: 800,
  naturalHeight: 600,
}))

describe('ImageElement', () => {
  const createImageElement = (overrides?: Partial<Omit<ImageElementData, 'type'>>): ImageElement => {
    const data: Omit<ImageElementData, 'type'> = {
      id: 'image-1',
      name: 'Image Element',
      position: { x: 10, y: 20 },
      size: { width: 200, height: 150 },
      src: 'https://example.com/image.jpg',
      ...overrides,
    }
    return new ImageElement(data)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should create image element with type "image"', () => {
      const element = createImageElement()
      expect(element.type).toBe('image')
      expect(element.src).toBe('https://example.com/image.jpg')
      expect(element.loaded).toBe(false)
    })
  })

  describe('Image Properties', () => {
    it('should get and set src', () => {
      const element = createImageElement()
      
      expect(element.src).toBe('https://example.com/image.jpg')
      
      element.src = 'https://example.com/new-image.jpg'
      expect(element.src).toBe('https://example.com/new-image.jpg')
      expect(element.loaded).toBe(false)
      expect(element.error).toBeUndefined()
    })

    it('should get and set alt text', () => {
      const element = createImageElement()
      
      expect(element.alt).toBe('')
      
      element.alt = 'Description of image'
      expect(element.alt).toBe('Description of image')
    })

    it('should handle natural dimensions', () => {
      const element = createImageElement({
        naturalWidth: 800,
        naturalHeight: 600,
      })
      
      expect(element.naturalWidth).toBe(800)
      expect(element.naturalHeight).toBe(600)
      expect(element.aspectRatio).toBe(800 / 600)
    })

    it('should return undefined aspect ratio without dimensions', () => {
      const element = createImageElement()
      expect(element.aspectRatio).toBeUndefined()
    })
  })

  describe('Image Style', () => {
    it('should have default style values', () => {
      const element = createImageElement()
      
      expect(element.objectFit).toBe('contain')
      expect(element.objectPosition).toBe('center')
      expect(element.preserveAspectRatio).toBe(true)
    })

    it('should use custom style values', () => {
      const element = createImageElement({
        imageStyle: {
          objectFit: 'cover',
          objectPosition: 'top-left',
          preserveAspectRatio: false,
          filter: {
            brightness: 120,
            contrast: 80,
            grayscale: 50,
          },
        },
      })
      
      expect(element.objectFit).toBe('cover')
      expect(element.objectPosition).toBe('top-left')
      expect(element.preserveAspectRatio).toBe(false)
      expect(element.imageStyle.filter).toEqual({
        brightness: 120,
        contrast: 80,
        grayscale: 50,
      })
    })

    it('should update image style', () => {
      const element = createImageElement()
      
      element.updateImageStyle({
        objectFit: 'fill',
        filter: { blur: 5 },
      })
      
      expect(element.imageStyle).toEqual({
        objectFit: 'fill',
        filter: { blur: 5 },
      })
    })
  })

  describe('Data Binding', () => {
    it('should get and set binding', () => {
      const element = createImageElement()
      
      expect(element.binding).toBeUndefined()
      
      element.binding = '{{product.image}}'
      expect(element.binding).toBe('{{product.image}}')
    })

    it('should process src without binding', () => {
      const element = createImageElement({ src: '/static/image.jpg' })
      const data = { product: { image: '/dynamic/image.jpg' } }
      
      expect(element.processSrc(data)).toBe('/static/image.jpg')
    })

    it('should process src with binding', () => {
      const element = createImageElement({
        src: '/images/{{product.image}}',
        binding: '{{product.image}}',
      })
      const data = { product: { image: 'product-123.jpg' } }
      
      expect(element.processSrc(data)).toBe('/images/product-123.jpg')
    })

    it('should handle nested binding', () => {
      const element = createImageElement({
        src: '{{cdn.baseUrl}}/{{product.category}}/{{product.image}}',
        binding: '{{product.image}}',
      })
      const data = {
        cdn: { baseUrl: 'https://cdn.example.com' },
        product: {
          category: 'electronics',
          image: 'laptop.jpg',
        },
      }
      
      expect(element.processSrc(data)).toBe('https://cdn.example.com/electronics/laptop.jpg')
    })

    it('should handle missing binding data', () => {
      const element = createImageElement({
        src: '/images/{{product.image}}',
        binding: '{{product.image}}',
      })
      const data = {}
      
      expect(element.processSrc(data)).toBe('/images/{{product.image}}')
    })
  })

  describe('Image Loading', () => {
    it('should load image successfully', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        naturalWidth: 1024,
        naturalHeight: 768,
      }
      
      global.Image = vi.fn().mockImplementation(() => mockImage)
      
      const element = createImageElement()
      const loadPromise = element.loadImage()
      
      // Trigger onload
      mockImage.onload()
      
      await loadPromise
      
      expect(element.loaded).toBe(true)
      expect(element.naturalWidth).toBe(1024)
      expect(element.naturalHeight).toBe(768)
      expect(element.error).toBeUndefined()
    })

    it('should handle image load error', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      global.Image = vi.fn().mockImplementation(() => mockImage)
      
      const element = createImageElement()
      const loadPromise = element.loadImage()
      
      // Trigger onerror
      mockImage.onerror()
      
      await expect(loadPromise).rejects.toThrow('Failed to load image')
      
      expect(element.loaded).toBe(false)
      expect(element.error).toBe('Failed to load image')
    })

    it('should return existing promise if already loading', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      global.Image = vi.fn().mockImplementation(() => mockImage)
      
      const element = createImageElement()
      const promise1 = element.loadImage()
      const promise2 = element.loadImage()
      
      expect(promise1).toBe(promise2)
      
      mockImage.onload()
      await promise1
    })
  })

  describe('Display Dimensions', () => {
    it('should calculate dimensions for contain fit', () => {
      const element = createImageElement({
        size: { width: 200, height: 200 },
        naturalWidth: 800,
        naturalHeight: 600,
      })
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.width).toBe(200)
      expect(dims.height).toBe(150)
      expect(dims.x).toBe(0)
      expect(dims.y).toBe(25) // Centered vertically
    })

    it('should calculate dimensions for cover fit', () => {
      const element = createImageElement({
        size: { width: 200, height: 200 },
        naturalWidth: 800,
        naturalHeight: 600,
        imageStyle: { objectFit: 'cover' },
      })
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.width).toBeCloseTo(266.67, 1)
      expect(dims.height).toBe(200)
      expect(dims.x).toBeCloseTo(-33.33, 1) // Centered horizontally
      expect(dims.y).toBe(0)
    })

    it('should calculate dimensions for fill fit', () => {
      const element = createImageElement({
        size: { width: 200, height: 200 },
        naturalWidth: 800,
        naturalHeight: 600,
        imageStyle: { objectFit: 'fill' },
      })
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.width).toBe(200)
      expect(dims.height).toBe(200)
      expect(dims.x).toBe(0)
      expect(dims.y).toBe(0)
    })

    it('should calculate dimensions for none fit', () => {
      const element = createImageElement({
        size: { width: 200, height: 200 },
        naturalWidth: 800,
        naturalHeight: 600,
        imageStyle: { objectFit: 'none' },
      })
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.width).toBe(800)
      expect(dims.height).toBe(600)
      expect(dims.x).toBe(-300) // Centered
      expect(dims.y).toBe(-200) // Centered
    })

    it('should calculate dimensions for scale-down fit', () => {
      const element = createImageElement({
        size: { width: 200, height: 200 },
        naturalWidth: 100,
        naturalHeight: 75,
        imageStyle: { objectFit: 'scale-down' },
      })
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.width).toBe(100)
      expect(dims.height).toBe(75)
      expect(dims.x).toBe(50) // Centered
      expect(dims.y).toBe(62.5) // Centered
    })

    it('should handle missing natural dimensions', () => {
      const element = createImageElement()
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.width).toBe(200)
      expect(dims.height).toBe(150)
      expect(dims.x).toBe(0)
      expect(dims.y).toBe(0)
    })

    it('should apply object position', () => {
      const element = createImageElement({
        size: { width: 200, height: 200 },
        naturalWidth: 800,
        naturalHeight: 600,
        imageStyle: {
          objectFit: 'contain',
          objectPosition: 'top-left',
        },
      })
      
      const dims = element.getDisplayDimensions()
      
      expect(dims.x).toBe(0)
      expect(dims.y).toBe(0)
    })
  })

  describe('CSS Filter', () => {
    it('should generate CSS filter string', () => {
      const element = createImageElement({
        imageStyle: {
          filter: {
            brightness: 120,
            contrast: 80,
            grayscale: 50,
            blur: 5,
            sepia: 30,
            saturate: 150,
            hueRotate: 45,
            invert: 25,
          },
        },
      })
      
      const filter = element.getCSSFilter()
      
      expect(filter).toBe('brightness(120%) contrast(80%) grayscale(50%) blur(5px) sepia(30%) saturate(150%) hue-rotate(45deg) invert(25%)')
    })

    it('should return empty string without filter', () => {
      const element = createImageElement()
      expect(element.getCSSFilter()).toBe('')
    })

    it('should handle partial filter properties', () => {
      const element = createImageElement({
        imageStyle: {
          filter: {
            brightness: 150,
            blur: 10,
          },
        },
      })
      
      const filter = element.getCSSFilter()
      
      expect(filter).toBe('brightness(150%) blur(10px)')
    })
  })

  describe('Inherited Methods', () => {
    it('should return bounding box', () => {
      const element = createImageElement()
      const box = element.getBoundingBox()
      
      expect(box).toEqual({
        x: 10,
        y: 20,
        width: 200,
        height: 150,
      })
    })

    it('should check if point is contained', () => {
      const element = createImageElement()
      
      expect(element.containsPoint(100, 90)).toBe(true)
      expect(element.containsPoint(5, 90)).toBe(false)
    })

    it('should clone with image-specific properties', () => {
      const element = createImageElement({
        src: 'https://example.com/original.jpg',
        alt: 'Original Image',
        imageStyle: { objectFit: 'cover', filter: { blur: 5 } },
        binding: '{{image.url}}',
        naturalWidth: 1920,
        naturalHeight: 1080,
        loaded: true,
      })
      
      const clone = element.clone()
      
      expect(clone.id).not.toBe(element.id)
      expect(clone.src).toBe('https://example.com/original.jpg')
      expect(clone.alt).toBe('Original Image')
      expect(clone.imageStyle).toEqual({ objectFit: 'cover', filter: { blur: 5 } })
      expect(clone.binding).toBe('{{image.url}}')
      expect(clone.naturalWidth).toBe(1920)
      expect(clone.naturalHeight).toBe(1080)
      expect(clone.loaded).toBe(true)
    })
  })
})