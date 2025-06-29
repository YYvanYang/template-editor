// Components
export { Canvas } from './components/Canvas'
export { Grid } from './components/Grid'
export { AlignmentGuidesKonva } from './components/AlignmentGuidesKonva'
export { ElementRenderer, ElementsRenderer } from './components/ElementRenderer'

// Hooks
export { useCanvasEvents } from './hooks/useCanvasEvents'
export { useDragAndDrop } from './hooks/useDragAndDrop'
export { useDragAndDropWithAlignment } from './hooks/useDragAndDropWithAlignment'
export { useAlignment } from './hooks/useAlignment'

// Utils
export * from './utils/alignment.utils'
export * from './utils/alignment-enhanced.utils'
export { createSpatialIndex, RTree } from './utils/spatial-index'
export type { SpatialIndex } from './utils/spatial-index'

// Types
export * from './types/alignment.types'