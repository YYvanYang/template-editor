import React, { useState } from 'react';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { CanvasWithRulers } from '@/features/canvas/components/CanvasWithRulers';

/**
 * 标尺对齐调试工具
 */
export const RulerAlignmentDebug: React.FC = () => {
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [unit, setUnit] = useState<'mm' | 'cm' | 'px'>('mm');
  const { canvas } = useEditorStore();
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 控制面板 */}
      <div style={{ 
        height: 50, 
        background: '#1a1a1a', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 20
      }}>
        <h2 style={{ margin: 0 }}>标尺对齐调试工具</h2>
        
        <button onClick={() => setShowDiagnostics(!showDiagnostics)}>
          {showDiagnostics ? '隐藏' : '显示'}调试信息
        </button>
        
        <label>
          单位：
          <select 
            value={unit} 
            onChange={(e) => setUnit(e.target.value as 'mm' | 'cm' | 'px')}
            style={{ marginLeft: 5 }}
          >
            <option value="mm">毫米 (mm)</option>
            <option value="cm">厘米 (cm)</option>
            <option value="px">像素 (px)</option>
          </select>
        </label>
        
        <div style={{ marginLeft: 'auto' }}>
          缩放: {(canvas.zoom * 100).toFixed(0)}% | 
          偏移: ({canvas.offset.x.toFixed(1)}, {canvas.offset.y.toFixed(1)})
        </div>
      </div>
      
      {/* 画布区域 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <CanvasWithRulers 
          showRulers={true} 
          unit={unit}
          showDiagnostics={showDiagnostics}
        />
        
        {/* 测试标记 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
        }}>
          {/* 在特定坐标位置显示标记 */}
          {[0, 50, 100, 150, 200].map(value => (
            <React.Fragment key={value}>
              {/* 水平标记线 */}
              <div style={{
                position: 'absolute',
                left: 20 + canvas.offset.x + value * 3.7795275591 * canvas.zoom,
                top: 20,
                width: 1,
                height: '100%',
                background: 'rgba(255, 0, 0, 0.3)',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 5,
                  left: 5,
                  background: 'red',
                  color: 'white',
                  padding: '2px 5px',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                }}>
                  {value}mm
                </div>
              </div>
              
              {/* 垂直标记线 */}
              <div style={{
                position: 'absolute',
                top: 20 + canvas.offset.y + value * 3.7795275591 * canvas.zoom,
                left: 20,
                width: '100%',
                height: 1,
                background: 'rgba(255, 0, 0, 0.3)',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 5,
                  left: 5,
                  background: 'red',
                  color: 'white',
                  padding: '2px 5px',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                }}>
                  {value}mm
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};