import React, { useState, useCallback } from 'react';

export const SimpleCoordinateTest: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasOffset] = useState({ x: 100, y: 100 });
  const [zoom] = useState(1);
  const rulerThickness = 20;
  const MM_TO_PX = 3.7795275591;
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  }, []);
  
  // 计算实际的画布坐标
  const canvasX = (mousePos.x - rulerThickness - canvasOffset.x) / zoom;
  const canvasY = (mousePos.y - rulerThickness - canvasOffset.y) / zoom;
  const canvasXmm = canvasX / MM_TO_PX;
  const canvasYmm = canvasY / MM_TO_PX;
  
  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>坐标系统测试</h2>
      
      <div 
        style={{ 
          position: 'relative',
          width: 600,
          height: 400,
          border: '1px solid #ccc',
          cursor: 'crosshair'
        }}
        onMouseMove={handleMouseMove}
      >
        {/* 标尺区域 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: rulerThickness,
          height: rulerThickness,
          background: '#f0f0f0',
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc'
        }} />
        
        {/* 水平标尺 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: rulerThickness,
          right: 0,
          height: rulerThickness,
          background: '#f8f8f8',
          borderBottom: '1px solid #ccc'
        }}>
          {/* 标尺刻度 */}
          {[0, 50, 100, 150, 200].map(mm => {
            const px = mm * MM_TO_PX * zoom + canvasOffset.x;
            return (
              <div key={mm} style={{
                position: 'absolute',
                left: px,
                top: 0,
                width: 1,
                height: '100%',
                background: '#666'
              }}>
                <span style={{ 
                  position: 'absolute', 
                  top: 2, 
                  left: 2,
                  fontSize: 10 
                }}>
                  {mm}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* 垂直标尺 */}
        <div style={{
          position: 'absolute',
          top: rulerThickness,
          left: 0,
          width: rulerThickness,
          bottom: 0,
          background: '#f8f8f8',
          borderRight: '1px solid #ccc'
        }}>
          {/* 标尺刻度 */}
          {[0, 50, 100, 150, 200].map(mm => {
            const px = mm * MM_TO_PX * zoom + canvasOffset.y;
            return (
              <div key={mm} style={{
                position: 'absolute',
                top: px,
                left: 0,
                height: 1,
                width: '100%',
                background: '#666'
              }}>
                <span style={{ 
                  position: 'absolute', 
                  top: -5, 
                  left: 2,
                  fontSize: 10 
                }}>
                  {mm}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* 画布区域 */}
        <div style={{
          position: 'absolute',
          top: rulerThickness,
          left: rulerThickness,
          right: 0,
          bottom: 0,
          background: '#fff',
          overflow: 'hidden'
        }}>
          {/* 画布内容 */}
          <div style={{
            position: 'absolute',
            left: canvasOffset.x,
            top: canvasOffset.y,
            width: 400,
            height: 300,
            background: '#f0f0f0',
            border: '2px solid #333'
          }}>
            <div style={{ padding: 10 }}>
              画布 (0,0) 在这里
            </div>
            
            {/* 测试点 */}
            {[
              { x: 0, y: 0, label: '0,0' },
              { x: 50, y: 50, label: '50,50' },
              { x: 100, y: 100, label: '100,100' },
            ].map(point => (
              <div key={point.label} style={{
                position: 'absolute',
                left: point.x * MM_TO_PX,
                top: point.y * MM_TO_PX,
                width: 10,
                height: 10,
                background: 'red',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <span style={{
                  position: 'absolute',
                  top: 12,
                  left: -20,
                  fontSize: 10,
                  whiteSpace: 'nowrap'
                }}>
                  {point.label}mm
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 鼠标十字线 */}
        <div style={{
          position: 'absolute',
          left: mousePos.x,
          top: rulerThickness,
          width: 1,
          height: '100%',
          background: 'rgba(0, 123, 255, 0.5)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: mousePos.y,
          left: rulerThickness,
          height: 1,
          width: '100%',
          background: 'rgba(0, 123, 255, 0.5)',
          pointerEvents: 'none'
        }} />
      </div>
      
      <div style={{ marginTop: 20 }}>
        <h3>坐标信息</h3>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: 5 }}>鼠标位置（相对容器）：</td>
              <td style={{ padding: 5 }}>({mousePos.x.toFixed(1)}, {mousePos.y.toFixed(1)}) px</td>
            </tr>
            <tr>
              <td style={{ padding: 5 }}>鼠标位置（相对标尺）：</td>
              <td style={{ padding: 5 }}>
                H: {(mousePos.x - rulerThickness).toFixed(1)} px, 
                V: {(mousePos.y - rulerThickness).toFixed(1)} px
              </td>
            </tr>
            <tr>
              <td style={{ padding: 5 }}>画布偏移：</td>
              <td style={{ padding: 5 }}>({canvasOffset.x}, {canvasOffset.y}) px</td>
            </tr>
            <tr>
              <td style={{ padding: 5 }}>画布坐标（像素）：</td>
              <td style={{ padding: 5 }}>({canvasX.toFixed(1)}, {canvasY.toFixed(1)}) px</td>
            </tr>
            <tr>
              <td style={{ padding: 5 }}>画布坐标（毫米）：</td>
              <td style={{ padding: 5 }}>({canvasXmm.toFixed(1)}, {canvasYmm.toFixed(1)}) mm</td>
            </tr>
          </tbody>
        </table>
        
        <h3>计算公式</h3>
        <pre style={{ background: '#f0f0f0', padding: 10 }}>
{`// 从鼠标位置到画布坐标
canvasX = (mouseX - rulerThickness - canvasOffset.x) / zoom
canvasY = (mouseY - rulerThickness - canvasOffset.y) / zoom

// 从画布坐标到毫米
mm = pixels / ${MM_TO_PX}

// 标尺上显示的值应该是：
rulerValue = (mousePos - rulerThickness - canvasOffset) / zoom / ${MM_TO_PX}`}
        </pre>
      </div>
    </div>
  );
};