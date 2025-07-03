/**
 * Example usage of the Image Processing System
 */

import React, { useState } from 'react'
import { 
  ImageUploader, 
  ImageElementComponent,
  useImageLoader,
  ImageProcessor,
  getImageManager,
  ImageElement 
} from '.'

/**
 * Example 1: Basic Image Display with Lazy Loading
 */
export function ImageGalleryExample() {
  const images = [
    'https://picsum.photos/400/300?random=1',
    'https://picsum.photos/400/300?random=2',
    'https://picsum.photos/400/300?random=3',
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((src, index) => (
        <LazyImage key={index} src={src} />
      ))}
    </div>
  )
}

function LazyImage({ src }: { src: string }) {
  const { loading, loaded, error, result, ref } = useImageLoader(src, {
    lazy: true,
    lazyOffset: '100px',
    placeholder: '/placeholder.svg',
  })

  return (
    <div ref={ref} className="relative aspect-video bg-gray-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          Failed to load
        </div>
      )}
      
      {loaded && result && (
        <img 
          src={result.url} 
          alt=""
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}

/**
 * Example 2: Image Upload with Processing
 */
export function ImageUploadExample() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleUpload = async (result: any) => {
    console.log('Uploaded image:', result)
    
    // Generate thumbnail
    const thumbnail = await ImageProcessor.generateThumbnail(
      result.url,
      200,
      { format: 'webp' }
    )
    
    setUploadedImage(thumbnail.dataUrl)
  }

  return (
    <div className="space-y-4">
      <ImageUploader
        onUpload={handleUpload}
        maxSize={5 * 1024 * 1024}
        accept={['image/jpeg', 'image/png', 'image/webp']}
      />
      
      {uploadedImage && (
        <div>
          <h3 className="text-sm font-medium mb-2">Thumbnail Preview:</h3>
          <img src={uploadedImage} alt="Thumbnail" className="rounded" />
        </div>
      )}
    </div>
  )
}

/**
 * Example 3: Image Editor with Filters
 */
export function ImageFilterExample() {
  const [originalUrl] = useState('https://picsum.photos/600/400')
  const [filteredUrl, setFilteredUrl] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    blur: 0,
    grayscale: 0,
  })

  const applyFilters = async () => {
    const result = await ImageProcessor.applyFilters(originalUrl, filters)
    setFilteredUrl(result.dataUrl)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Original</h3>
          <img src={originalUrl} alt="Original" className="w-full rounded" />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Filtered</h3>
          {filteredUrl ? (
            <img src={filteredUrl} alt="Filtered" className="w-full rounded" />
          ) : (
            <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">Apply filters to see result</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm">Brightness: {filters.brightness}%</span>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.brightness}
            onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        
        <label className="block">
          <span className="text-sm">Contrast: {filters.contrast}%</span>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.contrast}
            onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        
        <label className="block">
          <span className="text-sm">Blur: {filters.blur}px</span>
          <input
            type="range"
            min="0"
            max="10"
            value={filters.blur}
            onChange={(e) => setFilters({ ...filters, blur: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        
        <label className="block">
          <span className="text-sm">Grayscale: {filters.grayscale}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.grayscale}
            onChange={(e) => setFilters({ ...filters, grayscale: Number(e.target.value) })}
            className="w-full"
          />
        </label>
      </div>
      
      <button
        onClick={applyFilters}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>
    </div>
  )
}

/**
 * Example 4: Cache Management
 */
export function CacheManagementExample() {
  const [stats, setStats] = useState<any>(null)
  
  const updateStats = () => {
    const manager = getImageManager()
    setStats(manager.getStats())
  }
  
  const clearCache = () => {
    const manager = getImageManager()
    manager.clearCache()
    updateStats()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={updateStats}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Stats
        </button>
        
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Cache
        </button>
      </div>
      
      {stats && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-medium mb-2">Cache Statistics</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Cache Size:</dt>
              <dd>{(stats.cacheSize / 1024 / 1024).toFixed(2)} MB</dd>
            </div>
            <div className="flex justify-between">
              <dt>Cached Items:</dt>
              <dd>{stats.cacheItems}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Hit Rate:</dt>
              <dd>{(stats.hitRate * 100).toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Total Loads:</dt>
              <dd>{stats.loads}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Errors:</dt>
              <dd>{stats.errors}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

/**
 * Example 5: Using with Canvas Elements
 */
export function CanvasImageExample() {
  const [elements, setElements] = useState<ImageElement[]>([])

  const addImage = (url: string) => {
    const element = new ImageElement({
      id: `img-${Date.now()}`,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      size: { width: 200, height: 150 },
      src: url,
      imageStyle: {
        objectFit: 'cover',
        preserveAspectRatio: true,
      },
    })
    
    setElements([...elements, element])
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => addImage('https://picsum.photos/400/300?random=' + Date.now())}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Random Image
        </button>
      </div>
      
      <div className="relative border-2 border-gray-300 rounded-lg" style={{ height: 400 }}>
        {elements.map(element => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
            }}
          >
            <ImageElementComponent
              element={element}
              isSelected={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}