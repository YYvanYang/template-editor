# Image Processing System

A professional-grade image processing system inspired by Figma's implementation, providing comprehensive image handling capabilities for the template editor.

## Features

### Core Capabilities
- **Smart Loading**: Lazy loading with IntersectionObserver
- **Progressive Enhancement**: Load low-res placeholders first, then high-res
- **Format Conversion**: Automatic WebP conversion when supported
- **Image Optimization**: Automatic compression and resizing
- **Caching**: LRU cache with configurable memory limits
- **Preloading**: Intelligent adjacent image preloading

### User Interactions
- **Drag & Drop**: Full drag and drop support
- **Clipboard**: Paste images directly from clipboard
- **URL Loading**: Load images from URLs with CORS support
- **File Upload**: Traditional file selection

### Processing Features
- **Compression**: Smart compression to target file sizes
- **Resizing**: Maintain aspect ratios or custom dimensions
- **Cropping**: Precise cropping with coordinates
- **Filters**: CSS filters (brightness, contrast, blur, etc.)
- **Format Detection**: Automatic format detection and validation

## Architecture

```
image/
├── image-manager.ts      # Resource management & caching
├── image-loader.ts       # Multi-source loading
├── image-processor.ts    # Image transformations
├── use-image-loader.ts   # React hooks
├── ImageElement.tsx      # React component
├── ImageElementRenderer.tsx # Konva renderer
└── ImageUploader.tsx     # Upload UI component
```

## Usage

### Basic Image Loading

```typescript
import { useImageLoader } from '@/features/elements/image'

function MyImageComponent({ src }) {
  const { loading, loaded, error, result } = useImageLoader(src, {
    lazy: true,
    placeholder: '/placeholder.svg',
    processOptions: {
      maxWidth: 800,
      quality: 0.9,
    },
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <img src={result.url} alt="" />
}
```

### Image Upload with Processing

```typescript
import { ImageUploader } from '@/features/elements/image'

function MyUploadComponent() {
  const handleUpload = async (result) => {
    console.log('Uploaded:', result)
    // result contains: url, width, height, format, size
  }

  return (
    <ImageUploader
      onUpload={handleUpload}
      maxSize={5 * 1024 * 1024} // 5MB
      accept={['image/jpeg', 'image/png']}
    />
  )
}
```

### Manual Image Processing

```typescript
import { ImageProcessor } from '@/features/elements/image'

// Compress to specific size
const compressed = await ImageProcessor.compressToSize(
  imageBlob,
  500 * 1024, // 500KB target
  { format: 'jpeg' }
)

// Generate thumbnail
const thumbnail = await ImageProcessor.generateThumbnail(
  imageUrl,
  200, // 200px max dimension
  { format: 'webp' }
)

// Apply filters
const filtered = await ImageProcessor.applyFilters(imageUrl, {
  brightness: 120,
  contrast: 110,
  blur: 2,
})
```

### Drag & Drop

```typescript
import { useImageDrop } from '@/features/elements/image'

function DropZone() {
  const { state, handlers } = useImageDrop({
    onDrop: (files) => {
      console.log('Dropped files:', files)
    },
    accept: ['image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div
      {...handlers}
      className={state.isDragging ? 'dragging' : ''}
    >
      Drop images here
    </div>
  )
}
```

## Performance Optimization

### Memory Management
- LRU cache automatically evicts old images
- Configurable cache size limits
- Automatic cleanup of object URLs

### Loading Strategy
1. Check cache first
2. Load with appropriate priority
3. Preload adjacent images
4. Progressive enhancement

### Best Practices
- Use lazy loading for off-screen images
- Set appropriate max dimensions
- Enable WebP conversion
- Use placeholders for better UX

## Configuration

### Image Manager Config

```typescript
const imageManager = getImageManager({
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  maxCacheItems: 500,
  preloadRadius: 2,
  enableWebP: true,
  enableCompression: true,
  compressionQuality: 0.9,
})
```

### Processing Options

```typescript
const processOptions = {
  format: 'webp',        // Output format
  quality: 0.85,         // Compression quality
  maxWidth: 1920,        // Maximum width
  maxHeight: 1080,       // Maximum height
  preserveAspectRatio: true,
  backgroundColor: '#fff', // For transparency
}
```

## Error Handling

The system provides comprehensive error handling:
- Network errors
- Invalid formats
- Size limits exceeded
- Loading timeouts
- Processing failures

All errors are properly typed and include descriptive messages.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- WebP support detection with fallback
- Progressive enhancement for older browsers

## Testing

Run tests with:
```bash
pnpm test image
```

## Future Enhancements

- [ ] Web Worker processing for large images
- [ ] AVIF format support
- [ ] Smart crop detection (face/object detection)
- [ ] Batch processing API
- [ ] Cloud storage integration