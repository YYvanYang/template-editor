import React from 'react';
import { Ruler } from '@/features/canvas/components/Ruler';

export const RulerTest: React.FC = () => {
  return (
    <div style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
      <h2>标尺测试</h2>
      
      <div style={{ marginBottom: 20 }}>
        <h3>水平标尺</h3>
        <Ruler
          orientation="horizontal"
          length={800}
          thickness={20}
          unit="mm"
          canvasSize={{ width: 210, height: 297 }}
          viewport={{ x: 0, y: 0, scale: 1 }}
          mousePosition={undefined}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>垂直标尺</h3>
        <div style={{ display: 'flex' }}>
          <Ruler
            orientation="vertical"
            length={600}
            thickness={20}
            unit="mm"
            canvasSize={{ width: 210, height: 297 }}
            viewport={{ x: 0, y: 0, scale: 1 }}
            mousePosition={undefined}
          />
        </div>
      </div>
    </div>
  );
};