/**
 * Image module exports
 */

// Core exports
export { ImageElement } from '../types/image.types'
export type { ImageElementData, ImageStyle, ImageFit, ImageAlign } from '../types/image.types'

// Components
export { ImageElementComponent } from './ImageElement'
export { ImageElementRenderer } from './ImageElementRenderer'
export { ImageUploader } from './ImageUploader'

// Image processing
export { ImageManager, getImageManager, resetImageManager } from './image-manager'
export { ImageLoader } from './image-loader'
export { ImageProcessor } from './image-processor'

// Hooks
export { useImageLoader, useImageDrop, useImagePaste } from './use-image-loader'

// Types
export type { 
  ImageResource, 
  ImageManagerConfig, 
  ImageLoadOptions 
} from './image-manager'

export type { 
  ImageSource, 
  ImageLoadResult, 
  ImageLoadProgress, 
  ImageLoaderOptions 
} from './image-loader'

export type { 
  ProcessOptions, 
  CropOptions, 
  ProcessResult 
} from './image-processor'

export type { 
  UseImageLoaderOptions, 
  UseImageLoaderState,
  UseImageDropOptions,
  UseImageDropState
} from './use-image-loader'