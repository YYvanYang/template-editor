/**
 * React Hook for Image Loading
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Progressive loading
 * - Error handling
 * - Drag and drop support
 * - Automatic format conversion
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { ImageLoader, ImageLoadResult, ImageSource } from './image-loader'
import { ImageProcessor, ProcessOptions } from './image-processor'
import { getImageManager } from './image-manager'

export interface UseImageLoaderOptions {
  lazy?: boolean
  lazyOffset?: string // e.g., '50px', '10%'
  placeholder?: string
  fallback?: string
  processOptions?: ProcessOptions
  onLoad?: (result: ImageLoadResult) => void
  onError?: (error: Error) => void
  preloadAdjacent?: string[] // URLs of adjacent images to preload
}

export interface UseImageLoaderState {
  loading: boolean
  loaded: boolean
  error: Error | null
  result: ImageLoadResult | null
  isIntersecting: boolean
  retry: () => void
  load: (source: ImageSource) => Promise<void>
}

export function useImageLoader(
  source: ImageSource | null,
  options: UseImageLoaderOptions = {}
): UseImageLoaderState {
  const [state, setState] = useState<UseImageLoaderState>({
    loading: false,
    loaded: false,
    error: null,
    result: null,
    isIntersecting: false,
    retry: () => {},
    load: async () => {},
  })

  const elementRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  const imageManager = useMemo(() => getImageManager(), [])

  // Load image function
  const loadImage = useCallback(
    async (imageSource: ImageSource) => {
      if (loadingRef.current) return
      loadingRef.current = true

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Load image
        let result: ImageLoadResult
        
        if (typeof imageSource === 'string') {
          // Use image manager for URLs
          const resource = await imageManager.loadImage(imageSource)
          result = {
            url: resource.url,
            objectUrl: resource.objectUrl,
            width: resource.width,
            height: resource.height,
            format: resource.format,
            size: resource.size,
            originalSource: imageSource,
          }
        } else {
          // Use image loader for files/blobs
          result = await ImageLoader.load(imageSource)
        }

        // Apply processing if needed
        if (options.processOptions) {
          const processed = await ImageProcessor.process(
            result.objectUrl || result.url,
            options.processOptions
          )
          
          // Update result with processed data
          result = {
            ...result,
            url: processed.dataUrl,
            objectUrl: processed.dataUrl,
            width: processed.width,
            height: processed.height,
            format: processed.format,
            size: processed.size,
          }
        }

        if (!mountedRef.current) return

        setState(prev => ({
          ...prev,
          loading: false,
          loaded: true,
          result,
          error: null,
        }))

        options.onLoad?.(result)

        // Preload adjacent images
        if (options.preloadAdjacent && options.preloadAdjacent.length > 0) {
          imageManager.queuePreload(options.preloadAdjacent)
        }
      } catch (error) {
        if (!mountedRef.current) return

        const errorObj = error instanceof Error ? error : new Error(String(error))
        
        setState(prev => ({
          ...prev,
          loading: false,
          loaded: false,
          error: errorObj,
        }))

        options.onError?.(errorObj)
      } finally {
        loadingRef.current = false
      }
    },
    [imageManager, options]
  )

  // Retry function
  const retry = useCallback(() => {
    if (source) {
      loadImage(source)
    }
  }, [source, loadImage])

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!options.lazy || !elementRef.current) return

    observerRef.current = new IntersectionObserver(
      entries => {
        const [entry] = entries
        const isIntersecting = entry.isIntersecting

        setState(prev => ({ ...prev, isIntersecting }))

        if (isIntersecting && source && !state.loaded && !state.loading) {
          loadImage(source)
        }
      },
      {
        rootMargin: options.lazyOffset || '50px',
      }
    )

    observerRef.current.observe(elementRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [options.lazy, options.lazyOffset, source, state.loaded, state.loading, loadImage])

  // Load image immediately if not lazy
  useEffect(() => {
    if (!options.lazy && source && !state.loaded && !state.loading) {
      loadImage(source)
    }
  }, [options.lazy, source, state.loaded, state.loading, loadImage])

  // Cleanup
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      if (state.result?.objectUrl) {
        ImageLoader.cleanup(state.result)
      }
    }
  }, [state.result])

  // Update state with functions
  useEffect(() => {
    setState(prev => ({
      ...prev,
      retry,
      load: loadImage,
    }))
  }, [retry, loadImage])

  return {
    ...state,
    ref: elementRef,
  } as UseImageLoaderState & { ref: React.RefObject<HTMLElement> }
}

/**
 * Hook for drag and drop image upload
 */
export interface UseImageDropOptions {
  onDrop?: (files: File[]) => void
  accept?: string[] // MIME types
  maxSize?: number
  multiple?: boolean
}

export interface UseImageDropState {
  isDragging: boolean
  dragError: string | null
}

export function useImageDrop(
  options: UseImageDropOptions = {}
): {
  state: UseImageDropState
  handlers: {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
} {
  const [state, setState] = useState<UseImageDropState>({
    isDragging: false,
    dragError: null,
  })

  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current++
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setState({ isDragging: true, dragError: null })
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setState({ isDragging: false, dragError: null })
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      dragCounter.current = 0
      setState({ isDragging: false, dragError: null })

      const files: File[] = []
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files)
        
        // Filter by type
        const validFiles = fileList.filter(file => {
          if (options.accept && options.accept.length > 0) {
            return options.accept.includes(file.type)
          }
          return file.type.startsWith('image/')
        })

        // Check size
        const sizeValidFiles = validFiles.filter(file => {
          if (options.maxSize) {
            return file.size <= options.maxSize
          }
          return true
        })

        // Handle multiple
        if (options.multiple) {
          files.push(...sizeValidFiles)
        } else if (sizeValidFiles.length > 0) {
          files.push(sizeValidFiles[0])
        }

        if (files.length === 0) {
          setState({
            isDragging: false,
            dragError: 'No valid images found',
          })
        } else if (files.length < validFiles.length) {
          setState({
            isDragging: false,
            dragError: 'Some files exceeded size limit',
          })
          options.onDrop?.(files)
        } else {
          options.onDrop?.(files)
        }
      }
    },
    [options]
  )

  return {
    state,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  }
}

/**
 * Hook for image clipboard paste
 */
export function useImagePaste(
  onPaste: (file: File) => void
): void {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            onPaste(file)
            e.preventDefault()
            break
          }
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onPaste])
}