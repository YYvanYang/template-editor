/**
 * Image Element Renderer for Konva
 * 
 * Renders image elements on the canvas
 */

import React, { memo, useEffect, useRef, useState } from 'react'
import { Image as KonvaImage, Group, Rect, Text } from 'react-konva'
import Konva from 'konva'
import { ImageElement } from '../types/image.types'
import { useImageLoader } from './use-image-loader'

export interface ImageElementRendererProps {
  element: ImageElement
  isSelected?: boolean
  isDragging?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

export const ImageElementRenderer = memo<ImageElementRendererProps>(({
  element,
  isSelected = false,
  isDragging = false,
  onLoad,
  onError,
}) => {
  const imageRef = useRef<Konva.Image>(null)
  const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null)

  const { loading, loaded, error, result } = useImageLoader(element.src, {
    onLoad: (result) => {
      // Create HTML image for Konva
      const img = new Image()
      img.src = result.objectUrl || result.url
      img.onload = () => {
        setKonvaImage(img)
        
        // Update element
        element.update({
          naturalWidth: result.width,
          naturalHeight: result.height,
          loaded: true,
          error: undefined,
        })
        
        onLoad?.()
      }
    },
    onError: (err) => {
      element.update({
        loaded: false,
        error: err.message,
      })
      onError?.(err)
    },
  })

  // Apply filters when image changes
  useEffect(() => {
    if (imageRef.current && konvaImage) {
      const filters = []
      const imageStyle = element.imageStyle

      if (imageStyle?.filter) {
        // Konva filters
        if (imageStyle.filter.brightness !== undefined) {
          filters.push(Konva.Filters.Brighten)
          imageRef.current.brightness((imageStyle.filter.brightness - 100) / 100)
        }
        if (imageStyle.filter.contrast !== undefined) {
          filters.push(Konva.Filters.Contrast)
          imageRef.current.contrast((imageStyle.filter.contrast - 100) / 100)
        }
        if (imageStyle.filter.blur !== undefined && imageStyle.filter.blur > 0) {
          filters.push(Konva.Filters.Blur)
          imageRef.current.blurRadius(imageStyle.filter.blur)
        }
        if (imageStyle.filter.hueRotate !== undefined) {
          filters.push(Konva.Filters.HSL)
          imageRef.current.hue(imageStyle.filter.hueRotate)
        }
      }

      imageRef.current.filters(filters)
      imageRef.current.cache()
    }
  }, [konvaImage, element.imageStyle])

  // Calculate crop and display dimensions
  const displayDimensions = element.getDisplayDimensions()
  const cropProps = element.objectFit === 'cover' || element.objectFit === 'none' 
    ? {
        crop: {
          x: -displayDimensions.x,
          y: -displayDimensions.y,
          width: element.size.width,
          height: element.size.height,
        }
      }
    : {}

  return (
    <Group
      x={element.position.x}
      y={element.position.y}
      rotation={element.rotation}
      opacity={element.style.opacity ?? 1}
      draggable={false}
    >
      {/* Background rect for loading/error states */}
      {(!loaded || error) && (
        <Rect
          width={element.size.width}
          height={element.size.height}
          fill={error ? '#FEE2E2' : '#F3F4F6'}
          stroke={isSelected ? '#3B82F6' : undefined}
          strokeWidth={isSelected ? 2 : 0}
        />
      )}

      {/* Loading indicator */}
      {loading && (
        <Group x={element.size.width / 2} y={element.size.height / 2}>
          <Rect
            width={40}
            height={40}
            offsetX={20}
            offsetY={20}
            fill="#3B82F6"
            cornerRadius={20}
            opacity={0.2}
          />
          <Text
            text="..."
            fontSize={20}
            fill="#3B82F6"
            offsetX={10}
            offsetY={10}
          />
        </Group>
      )}

      {/* Error indicator */}
      {error && (
        <Text
          x={element.size.width / 2}
          y={element.size.height / 2}
          text="⚠"
          fontSize={24}
          fill="#EF4444"
          align="center"
          verticalAlign="middle"
          offsetX={12}
          offsetY={12}
        />
      )}

      {/* Loaded image */}
      {loaded && konvaImage && (
        <KonvaImage
          ref={imageRef}
          image={konvaImage}
          x={displayDimensions.x}
          y={displayDimensions.y}
          width={displayDimensions.width}
          height={displayDimensions.height}
          {...cropProps}
          shadowColor={element.style.shadow?.color}
          shadowBlur={element.style.shadow?.blur}
          shadowOffset={element.style.shadow?.offset}
          shadowOpacity={element.style.shadow?.opacity}
        />
      )}

      {/* Selection border */}
      {isSelected && (
        <Rect
          width={element.size.width}
          height={element.size.height}
          stroke="#3B82F6"
          strokeWidth={2}
          fill="transparent"
          dash={isDragging ? [5, 5] : undefined}
        />
      )}
    </Group>
  )
})