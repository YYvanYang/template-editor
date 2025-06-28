import React, { useState } from 'react';
import { Ruler } from '@/features/canvas/components/Ruler';

export const RulerDebug: React.FC = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  
  return (
    <div style={{ padding: 20 }}>
      <h2>标尺调试页面</h2>
      
      <div style={{ marginBottom: 20 }}>
        <label>
          X偏移: 
          <input 
            type="range" 
            min="-500" 
            max="500" 
            value={offset.x} 
            onChange={(e) => setOffset({ ...offset, x: Number(e.target.value) })}
          />
          {offset.x}px
        </label>
        <br />
        <label>
          Y偏移: 
          <input 
            type="range" 
            min="-500" 
            max="500" 
            value={offset.y} 
            onChange={(e) => setOffset({ ...offset, y: Number(e.target.value) })}
          />
          {offset.y}px
        </label>
        <br />
        <label>
          缩放: 
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1"
            value={scale} 
            onChange={(e) => setScale(Number(e.target.value))}
          />
          {scale}x
        </label>
      </div>
      
      <div style={{ position: 'relative', border: '1px solid #ccc' }}>
        <div style={{ width: 800, height: 30 }}>
          <Ruler
            orientation="horizontal"
            length={800}
            thickness={30}
            unit="mm"
            scale={scale}
            offset={0}
            canvasSize={{ width: 800, height: 600 }}
            viewport={{ x: offset.x, y: offset.y, scale }}
            onClick={(value) => console.log('Clicked at:', value)}
          />
        </div>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <h3>调试信息</h3>
        <pre>
          {JSON.stringify({ offset, scale }, null, 2)}
        </pre>
      </div>
    </div>
  );
};