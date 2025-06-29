import React from 'react';
import { useEditorStore } from '@/features/editor/stores/editor.store';

export const RulerDebugInfo: React.FC = () => {
  const { canvas, template } = useEditorStore();
  const MM_TO_PX = 3.7795275591;
  
  return (
    <div style={{
      position: 'fixed',
      top: 150,
      right: 20,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: 10,
      borderRadius: 5,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 1000,
    }}>
      <div>Canvas Offset: ({canvas.offset.x.toFixed(2)}, {canvas.offset.y.toFixed(2)})</div>
      <div>Canvas Zoom: {canvas.zoom.toFixed(2)}</div>
      <div>Template Size: {template.size.width}mm x {template.size.height}mm</div>
      <div>Template Size (px): {(template.size.width * MM_TO_PX).toFixed(0)}px x {(template.size.height * MM_TO_PX).toFixed(0)}px</div>
      <div>Viewport X: {(-canvas.offset.x).toFixed(2)}</div>
      <div>Viewport Y: {(-canvas.offset.y).toFixed(2)}</div>
    </div>
  );
};