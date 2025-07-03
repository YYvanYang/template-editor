import React from 'react'
import { Group, Rect, Text, Image, Transformer } from 'react-konva'
import { useEditorStore } from '@/features/editor/stores/editor.store'
import { useDragAndDropWithAlignment } from '../hooks/useDragAndDropWithAlignment'
import type { 
  TemplateElement, 
  TextElement, 
  ImageElement, 
  ShapeElement
} from '@/types/unified.types'

interface ElementRendererProps {
  element: TemplateElement
  isSelected: boolean
  onSelect: (id: string, multi: boolean) => void
}

/**
 * 渲染单个元素的组件
 */
export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  onSelect,
}) => {
  const nodeRef = React.useRef<any>(null)
  const transformerRef = React.useRef<any>(null)
  
  const { updateElement, canvas } = useEditorStore()
  const dragAndDrop = useDragAndDropWithAlignment({
    enableAlignment: canvas.alignmentEnabled,
    enableMagneticSnap: canvas.magneticSnap,
  })

  // 更新 Transformer
  React.useEffect(() => {
    if (isSelected && nodeRef.current && transformerRef.current) {
      transformerRef.current.nodes([nodeRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  // 处理拖拽
  const handleDragStart = React.useCallback((e: any) => {
    e.cancelBubble = true
    dragAndDrop.startDrag(e.evt, element.id)
  }, [dragAndDrop, element.id])

  const handleDragMove = React.useCallback((e: any) => {
    const node = e.target
    // 更新位置
    updateElement(element.id, {
      position: {
        x: node.x(),
        y: node.y(),
      }
    } as any)
  }, [updateElement, element.id])

  const handleDragEnd = React.useCallback((_e: any) => {
    dragAndDrop.endDrag()
  }, [dragAndDrop])

  // 处理变换
  const handleTransformEnd = React.useCallback((e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // 重置缩放并更新尺寸
    node.scaleX(1)
    node.scaleY(1)

    updateElement(element.id, {
      position: {
        x: node.x(),
        y: node.y(),
      },
      size: {
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      },
      rotation: node.rotation(),
    } as any)
  }, [updateElement, element.id])

  // 处理点击
  const handleClick = React.useCallback((e: any) => {
    e.cancelBubble = true
    onSelect(element.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
  }, [onSelect, element.id])

  // 渲染元素内容
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        const textElement = element as TextElement
        return (
          <Text
            text={textElement.content || 'Text'}
            fontSize={textElement.style?.fontSize || 14}
            fontFamily={textElement.style?.fontFamily || 'Arial'}
            fill={textElement.style?.color || '#000000'}
            width={element.size.width}
            height={element.size.height}
            align={textElement.style?.textAlign || 'left'}
            verticalAlign={textElement.style?.verticalAlign || 'top'}
          />
        )

      case 'image':
        const imageElement = element as ImageElement
        if (imageElement.src) {
          return (
            <Image
              image={undefined} // 需要加载图片
              width={element.size.width}
              height={element.size.height}
            />
          )
        }
        // 图片占位符
        return (
          <Rect
            width={element.size.width}
            height={element.size.height}
            fill="#f0f0f0"
            stroke="#ccc"
            strokeWidth={1}
          />
        )

      case 'shape':
        const shapeElement = element as ShapeElement
        return (
          <Rect
            width={element.size.width}
            height={element.size.height}
            fill={shapeElement.style?.fill || '#ffffff'}
            stroke={shapeElement.style?.stroke || '#000000'}
            strokeWidth={shapeElement.style?.strokeWidth || 1}
            cornerRadius={0}
          />
        )

      case 'barcode':
        // 条形码占位符
        return (
          <Group>
            <Rect
              width={element.size.width}
              height={element.size.height}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth={1}
            />
            <Text
              text="BARCODE"
              fontSize={12}
              fill="#666666"
              width={element.size.width}
              height={element.size.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )

      case 'qrcode':
        // 二维码占位符
        return (
          <Group>
            <Rect
              width={element.size.width}
              height={element.size.height}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth={1}
            />
            <Text
              text="QR CODE"
              fontSize={12}
              fill="#666666"
              width={element.size.width}
              height={element.size.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )

      default:
        return (
          <Rect
            width={element.size.width}
            height={element.size.height}
            fill="#cccccc"
            stroke="#999999"
            strokeWidth={1}
          />
        )
    }
  }

  return (
    <>
      <Group
        ref={nodeRef}
        id={element.id}
        x={element.position.x}
        y={element.position.y}
        rotation={element.rotation || 0}
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={handleClick}
        onTap={handleClick}
      >
        {renderContent()}
      </Group>

      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 限制最小尺寸
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
          rotateEnabled={true}
          keepRatio={element.type === 'image' || element.type === 'qrcode'}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'middle-left',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]}
        />
      )}
    </>
  )
}

/**
 * 渲染所有元素的容器组件
 */
const ElementsRenderer: React.FC = () => {
  const { elements, selectedIds, selectElement, deselectElement, clearSelection } = useEditorStore()

  const handleSelect = React.useCallback((id: string, multi: boolean) => {
    if (multi) {
      if (selectedIds.has(id)) {
        deselectElement(id)
      } else {
        selectElement(id)
      }
    } else {
      clearSelection()
      selectElement(id)
    }
  }, [selectedIds, selectElement, deselectElement, clearSelection])

  // 处理画布点击（取消选择）
  const handleStageClick = React.useCallback((e: any) => {
    // 检查是否点击在空白处
    if (e.target === e.target.getStage()) {
      clearSelection()
    }
  }, [clearSelection])

  return (
    <Group onClick={handleStageClick}>
      {Array.from(elements.values()).map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          isSelected={selectedIds.has(element.id)}
          onSelect={handleSelect}
        />
      ))}
    </Group>
  )
}

// 导出两个组件
export { ElementsRenderer }