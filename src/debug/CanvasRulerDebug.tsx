import React, { useState } from 'react';
import { CanvasRuler } from '@/features/canvas/components/CanvasRuler';

export const CanvasRulerDebug: React.FC = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [unit, setUnit] = useState<'mm' | 'cm' | 'px'>('mm');
  
  return (
    <div style={{ padding: 20, backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h2>Canvas 标尺调试页面</h2>
      
      <div style={{ marginBottom: 20, backgroundColor: 'white', padding: 15, borderRadius: 5 }}>
        <div style={{ marginBottom: 10 }}>
          <label>
            单位: 
            <select 
              value={unit} 
              onChange={(e) => setUnit(e.target.value as 'mm' | 'cm' | 'px')}
              style={{ marginLeft: 10 }}
            >
              <option value="mm">毫米 (mm)</option>
              <option value="cm">厘米 (cm)</option>
              <option value="px">像素 (px)</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>
            X偏移: 
            <input 
              type="range" 
              min="-500" 
              max="500" 
              value={offset.x} 
              onChange={(e) => setOffset({ ...offset, x: Number(e.target.value) })}
              style={{ width: 200, marginLeft: 10, marginRight: 10 }}
            />
            {offset.x}px
          </label>
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>
            Y偏移: 
            <input 
              type="range" 
              min="-500" 
              max="500" 
              value={offset.y} 
              onChange={(e) => setOffset({ ...offset, y: Number(e.target.value) })}
              style={{ width: 200, marginLeft: 10, marginRight: 10 }}
            />
            {offset.y}px
          </label>
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>
            缩放: 
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1"
              value={scale} 
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ width: 200, marginLeft: 10, marginRight: 10 }}
            />
            {scale}x
          </label>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 5 }}>
        <h3>水平标尺</h3>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <CanvasRuler
            orientation="horizontal"
            length={800}
            thickness={30}
            unit={unit}
            scale={1}
            offset={0}
            canvasSize={{ width: 800, height: 600 }}
            viewport={{ x: offset.x, y: offset.y, scale }}
            onClick={(value) => console.log('Horizontal clicked at:', value)}
          />
        </div>
        
        <h3>垂直标尺</h3>
        <div style={{ position: 'relative' }}>
          <CanvasRuler
            orientation="vertical"
            length={600}
            thickness={30}
            unit={unit}
            scale={1}
            offset={0}
            canvasSize={{ width: 800, height: 600 }}
            viewport={{ x: offset.x, y: offset.y, scale }}
            onClick={(value) => console.log('Vertical clicked at:', value)}
          />
        </div>
      </div>
      
      <div style={{ marginTop: 20, backgroundColor: 'white', padding: 15, borderRadius: 5 }}>
        <h3>调试信息</h3>
        <pre style={{ fontSize: 12 }}>
          {JSON.stringify({ offset, scale, unit }, null, 2)}
        </pre>
        <p style={{ fontSize: 12, color: '#666' }}>
          说明：拖动滑块来测试标尺在不同偏移和缩放下的表现。
          标尺应该始终显示正确的刻度和标签，不会出现标签消失的问题。
        </p>
      </div>
    </div>
  );
};