/**
 * Image Element Component
 * 
 * Main component for image elements in the editor
 */

import React, { memo } from 'react'
import { ImageElement } from '../types/image.types'
import { useImageLoader } from './use-image-loader'

export interface ImageElementProps {
  element: ImageElement
  isSelected?: boolean
  isEditing?: boolean
  onLoad?: (element: ImageElement) => void
  onError?: (element: ImageElement, error: Error) => void
  placeholder?: string
  fallback?: string
}

export const ImageElementComponent = memo<ImageElementProps>(({
  element,
  isSelected = false,
  isEditing = false,
  onLoad,
  onError,
  placeholder = '/placeholder.svg',
  fallback = '/error.svg',
}) => {
  const { loading, loaded, error, result } = useImageLoader(element.src, {
    placeholder,
    fallback,
    lazy: true,
    lazyOffset: '100px',
    processOptions: {
      // Auto-optimize images
      maxWidth: element.size.width * 2, // 2x for retina
      maxHeight: element.size.height * 2,
      preserveAspectRatio: element.preserveAspectRatio,
    },
    onLoad: (result) => {
      // Update element with loaded dimensions
      element.update({
        naturalWidth: result.width,
        naturalHeight: result.height,
        loaded: true,
        error: undefined,
      })
      onLoad?.(element)
    },
    onError: (err) => {
      element.update({
        loaded: false,
        error: err.message,
      })
      onError?.(element, err)
    },
  })

  // Calculate display dimensions
  const displayDimensions = element.getDisplayDimensions()

  return (
    <div
      className={`
        image-element relative overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isEditing ? 'pointer-events-none' : ''}
      `}
      style={{
        width: element.size.width,
        height: element.size.height,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.style.opacity ?? 1,
      }}
    >
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <img 
            src={fallback} 
            alt="Error loading image"
            className="w-16 h-16 opacity-50"
          />
        </div>
      )}

      {/* Loaded image */}
      {loaded && result && (
        <img
          src={result.objectUrl || result.url}
          alt={element.alt}
          className="absolute"
          style={{
            width: displayDimensions.width,
            height: displayDimensions.height,
            left: displayDimensions.x,
            top: displayDimensions.y,
            filter: element.getCSSFilter(),
            clipPath: element.imageStyle?.clipPath,
            objectFit: element.objectFit,
            objectPosition: element.objectPosition,
          }}
        />
      )}

      {/* Placeholder while loading */}
      {!loaded && !error && placeholder && (
        <img
          src={placeholder}
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-contain opacity-30"
        />
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 left-0 text-xs bg-black bg-opacity-50 text-white p-1">
          {element.naturalWidth}x{element.naturalHeight} | {element.objectFit}
        </div>
      )}
    </div>
  )
})