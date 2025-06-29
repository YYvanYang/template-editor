import React from 'react';
import { Ruler } from '@/features/canvas/components/Ruler';

export const SimpleRulerTest: React.FC = () => {
  return (
    <div style={{ padding: 20, backgroundColor: '#ffffff' }}>
      <h2>简单标尺测试</h2>
      
      <div style={{ marginBottom: 40, border: '1px solid #ccc', display: 'inline-block' }}>
        <h3>水平标尺 (mm)</h3>
        <Ruler
          orientation="horizontal"
          length={800}
          thickness={20}
          unit="mm"
          scale={1}
          offset={0}
          backgroundColor="#f0f0f0"
          textColor="#333"
          tickColor="#666"
          fontSize={10}
          canvasSize={{ width: 210 * 3.7795275591, height: 297 * 3.7795275591 }}
          viewport={{ x: 0, y: 0, scale: 1 }}
        />
      </div>

      <div style={{ marginBottom: 40 }}>
        <h3>垂直标尺 (mm)</h3>
        <div style={{ display: 'inline-block', border: '1px solid #ccc' }}>
          <Ruler
            orientation="vertical"
            length={600}
            thickness={20}
            unit="mm"
            scale={1}
            offset={0}
            backgroundColor="#f0f0f0"
            textColor="#333"
            tickColor="#666"
            fontSize={10}
            canvasSize={{ width: 210 * 3.7795275591, height: 297 * 3.7795275591 }}
            viewport={{ x: 0, y: 0, scale: 1 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 40, border: '1px solid #ccc', display: 'inline-block' }}>
        <h3>水平标尺 (px)</h3>
        <Ruler
          orientation="horizontal"
          length={800}
          thickness={20}
          unit="px"
          scale={1}
          offset={0}
          backgroundColor="#f0f0f0"
          textColor="#333"
          tickColor="#666"
          fontSize={10}
          canvasSize={{ width: 800, height: 600 }}
          viewport={{ x: 0, y: 0, scale: 1 }}
        />
      </div>
    </div>
  );
};