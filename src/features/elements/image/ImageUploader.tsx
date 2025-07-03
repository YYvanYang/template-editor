/**
 * Image Uploader Component
 * 
 * Supports:
 * - Drag and drop
 * - Click to upload
 * - Paste from clipboard
 * - URL input
 */

import React, { memo, useCallback, useRef, useState } from 'react'
import { useImageDrop, useImagePaste } from './use-image-loader'
import { ImageProcessor } from './image-processor'
import { ImageLoader } from './image-loader'

export interface ImageUploaderProps {
  onUpload: (result: {
    url: string
    width: number
    height: number
    format: string
    size: number
  }) => void
  maxSize?: number
  accept?: string[]
  className?: string
}

export const ImageUploader = memo<ImageUploaderProps>(({
  onUpload,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = '',
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file processing
  const processFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      // Load the file
      const loadResult = await ImageLoader.load(file, {
        maxSize,
        acceptedFormats: accept,
      })

      // Auto-optimize
      const optimized = await ImageProcessor.autoOptimize(loadResult.objectUrl || loadResult.url)

      // Call onUpload with result
      onUpload({
        url: optimized.dataUrl,
        width: optimized.width,
        height: optimized.height,
        format: optimized.format,
        size: optimized.size,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setLoading(false)
    }
  }, [onUpload, maxSize, accept])

  // Handle URL submission
  const handleUrlSubmit = useCallback(async () => {
    if (!urlValue.trim()) return

    setLoading(true)
    setError(null)

    try {
      const loadResult = await ImageLoader.load(urlValue, {
        maxSize,
        acceptedFormats: accept,
      })

      onUpload({
        url: loadResult.url,
        width: loadResult.width,
        height: loadResult.height,
        format: loadResult.format,
        size: loadResult.size,
      })

      setUrlValue('')
      setShowUrlInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image from URL')
    } finally {
      setLoading(false)
    }
  }, [urlValue, onUpload, maxSize, accept])

  // Set up drag and drop
  const { state: dropState, handlers } = useImageDrop({
    onDrop: (files) => {
      if (files.length > 0) {
        processFile(files[0])
      }
    },
    accept,
    maxSize,
    multiple: false,
  })

  // Set up paste
  useImagePaste((file) => {
    processFile(file)
  })

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  return (
    <div className={`image-uploader ${className}`}>
      {/* Main upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${dropState.isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
        {...handlers}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-center">
          {/* Icon */}
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Text */}
          <p className="mt-2 text-sm text-gray-600">
            {dropState.isDragging ? (
              'Drop image here'
            ) : (
              <>
                <span className="font-semibold">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, GIF, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
          <p className="text-xs text-gray-500 mt-1">
            You can also paste an image from clipboard
          </p>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {/* URL input section */}
      <div className="mt-4">
        {!showUrlInput ? (
          <button
            onClick={() => setShowUrlInput(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            Or add image from URL
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={loading}
            />
            <button
              onClick={handleUrlSubmit}
              disabled={loading || !urlValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowUrlInput(false)
                setUrlValue('')
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Drag error */}
      {dropState.dragError && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-600">{dropState.dragError}</p>
        </div>
      )}
    </div>
  )
})