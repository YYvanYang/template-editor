import type {
  ElementBounds,
  AlignmentPoint,
  AlignmentConfig,
  AlignmentResult,
  GuideLine,
  DynamicGuide,
} from '../types/alignment.types';

/**
 * 计算元素的边界框
 */
export function calculateElementBounds(element: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}): ElementBounds {
  const { id, x, y, width, height, rotation } = element;
  
  if (rotation === 0) {
    // 没有旋转的情况
    return {
      id,
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      width,
      height,
    };
  }
  
  // 计算旋转后的边界框
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  // 计算四个角点旋转后的位置
  const corners = [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + height },
    { x: x, y: y + height },
  ];
  
  const rotatedCorners = corners.map(corner => {
    const dx = corner.x - centerX;
    const dy = corner.y - centerY;
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  });
  
  // 找出最小和最大的x、y值
  const xs = rotatedCorners.map(c => c.x);
  const ys = rotatedCorners.map(c => c.y);
  
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  
  return {
    id,
    left,
    top,
    right,
    bottom,
    centerX,
    centerY,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * 查找元素的所有对齐点
 */
export function findAlignmentPoints(bounds: ElementBounds): AlignmentPoint[] {
  const points: AlignmentPoint[] = [];
  const { id, left, top, right, bottom, centerX, centerY } = bounds;
  
  // 中心点
  points.push({ x: centerX, y: centerY, elementId: id, type: 'center' });
  
  // 四个角
  points.push({ x: left, y: top, elementId: id, type: 'corner' });
  points.push({ x: right, y: top, elementId: id, type: 'corner' });
  points.push({ x: right, y: bottom, elementId: id, type: 'corner' });
  points.push({ x: left, y: bottom, elementId: id, type: 'corner' });
  
  // 四条边的中点
  points.push({ x: centerX, y: top, elementId: id, type: 'top' });
  points.push({ x: right, y: centerY, elementId: id, type: 'right' });
  points.push({ x: centerX, y: bottom, elementId: id, type: 'bottom' });
  points.push({ x: left, y: centerY, elementId: id, type: 'left' });
  
  return points;
}

/**
 * 检查点是否对齐到辅助线
 */
export function checkAlignment(
  point: { x: number; y: number },
  guides: GuideLine[],
  config: AlignmentConfig
): AlignmentResult {
  if (!config.enabled) {
    return {
      aligned: false,
      x: point.x,
      y: point.y,
      deltaX: 0,
      deltaY: 0,
    };
  }
  
  let alignedX = point.x;
  let alignedY = point.y;
  let verticalGuide: GuideLine | undefined;
  let horizontalGuide: GuideLine | undefined;
  
  // 检查垂直辅助线
  const visibleVerticalGuides = guides.filter(
    g => g.orientation === 'vertical' && g.visible !== false
  );
  
  for (const guide of visibleVerticalGuides) {
    const distance = Math.abs(point.x - guide.position);
    if (distance <= config.threshold) {
      alignedX = guide.position;
      verticalGuide = guide;
      break;
    }
  }
  
  // 检查水平辅助线
  const visibleHorizontalGuides = guides.filter(
    g => g.orientation === 'horizontal' && g.visible !== false
  );
  
  for (const guide of visibleHorizontalGuides) {
    const distance = Math.abs(point.y - guide.position);
    if (distance <= config.threshold) {
      alignedY = guide.position;
      horizontalGuide = guide;
      break;
    }
  }
  
  return {
    aligned: verticalGuide !== undefined || horizontalGuide !== undefined,
    x: alignedX,
    y: alignedY,
    verticalGuide,
    horizontalGuide,
    deltaX: alignedX - point.x,
    deltaY: alignedY - point.y,
  };
}

/**
 * 对齐到网格
 */
export function snapToGrid(
  point: { x: number; y: number },
  gridSize: number
): { x: number; y: number } {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * 生成动态辅助线
 */
export function generateDynamicGuides(
  draggedBounds: ElementBounds,
  targetBounds: ElementBounds[],
  config: AlignmentConfig
): DynamicGuide[] {
  if (!config.enabled || !config.snapToElements) {
    return [];
  }
  
  const guides: DynamicGuide[] = [];
  const guideMap = new Map<string, DynamicGuide>();
  
  const draggedPoints = findAlignmentPoints(draggedBounds);
  
  for (const target of targetBounds) {
    const targetPoints = findAlignmentPoints(target);
    
    // 检查每个拖拽点与每个目标点的对齐
    for (const dragPoint of draggedPoints) {
      for (const targetPoint of targetPoints) {
        // 垂直对齐检查
        const vDistance = Math.abs(dragPoint.x - targetPoint.x);
        if (vDistance <= config.threshold) {
          const key = `v-${targetPoint.x}`;
          const existing = guideMap.get(key);
          
          const guide: DynamicGuide = {
            orientation: 'vertical',
            position: targetPoint.x,
            start: Math.min(dragPoint.y, targetPoint.y, existing?.start ?? Infinity),
            end: Math.max(dragPoint.y, targetPoint.y, existing?.end ?? -Infinity),
            type: 'element',
            relatedElements: existing
              ? [...(existing.relatedElements ?? []), draggedBounds.id, target.id]
              : [draggedBounds.id, target.id],
          };
          
          guideMap.set(key, guide);
        }
        
        // 水平对齐检查
        const hDistance = Math.abs(dragPoint.y - targetPoint.y);
        if (hDistance <= config.threshold) {
          const key = `h-${targetPoint.y}`;
          const existing = guideMap.get(key);
          
          const guide: DynamicGuide = {
            orientation: 'horizontal',
            position: targetPoint.y,
            start: Math.min(dragPoint.x, targetPoint.x, existing?.start ?? Infinity),
            end: Math.max(dragPoint.x, targetPoint.x, existing?.end ?? -Infinity),
            type: 'element',
            relatedElements: existing
              ? [...(existing.relatedElements ?? []), draggedBounds.id, target.id]
              : [draggedBounds.id, target.id],
          };
          
          guideMap.set(key, guide);
        }
      }
    }
  }
  
  // 去重相关元素
  guideMap.forEach(guide => {
    if (guide.relatedElements) {
      guide.relatedElements = [...new Set(guide.relatedElements)];
    }
  });
  
  return Array.from(guideMap.values());
}

/**
 * 从元素生成静态辅助线
 */
export function getElementsAlignmentGuides(
  elements: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }>,
  config: AlignmentConfig
): GuideLine[] {
  const guides: GuideLine[] = [];
  let guideId = 0;
  
  for (const element of elements) {
    // 跳过旋转的元素
    if (element.rotation !== 0) continue;
    
    const bounds = calculateElementBounds(element);
    
    // 添加中心辅助线
    if (config.showCenterGuides) {
      guides.push({
        id: `guide-${guideId++}`,
        orientation: 'vertical',
        position: bounds.centerX,
        type: 'center',
        visible: true,
      });
      
      guides.push({
        id: `guide-${guideId++}`,
        orientation: 'horizontal',
        position: bounds.centerY,
        type: 'center',
        visible: true,
      });
    }
    
    // 添加边缘辅助线
    if (config.showEdgeGuides) {
      guides.push({
        id: `guide-${guideId++}`,
        orientation: 'vertical',
        position: bounds.left,
        type: 'edge',
        visible: true,
      });
      
      guides.push({
        id: `guide-${guideId++}`,
        orientation: 'vertical',
        position: bounds.right,
        type: 'edge',
        visible: true,
      });
      
      guides.push({
        id: `guide-${guideId++}`,
        orientation: 'horizontal',
        position: bounds.top,
        type: 'edge',
        visible: true,
      });
      
      guides.push({
        id: `guide-${guideId++}`,
        orientation: 'horizontal',
        position: bounds.bottom,
        type: 'edge',
        visible: true,
      });
    }
  }
  
  return guides;
}