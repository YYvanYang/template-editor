import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { UNIT_CONVERSIONS } from '@/features/canvas/types/ruler.types';
import { convertUnit, calculateTicks } from '@/features/canvas/utils/ruler.utils';

export const RulerDiagnostics: React.FC = () => {
  const { canvas, template } = useEditorStore();
  const [diagnostics, setDiagnostics] = useState<any>({});
  
  useEffect(() => {
    const MM_TO_PX = UNIT_CONVERSIONS.mm.toPx;
    
    // 计算诊断信息
    const viewport = {
      x: -canvas.offset.x,
      y: -canvas.offset.y,
      scale: canvas.zoom,
    };
    
    // 测试刻度计算
    const testTicks = calculateTicks({
      length: 800, // 假设标尺长度
      scale: viewport.scale,
      offset: viewport.x,
      unit: 'mm',
      minTickSpacing: 5,
    });
    
    // 画布坐标系
    const canvasOriginInScreen = {
      x: canvas.offset.x,
      y: canvas.offset.y,
    };
    
    // 0,0 在屏幕上的位置
    const zeroPositionInScreen = {
      x: canvasOriginInScreen.x,
      y: canvasOriginInScreen.y,
    };
    
    // 测试坐标转换
    const testPoints = [
      { screen: 100, canvas: (100 - canvas.offset.x) / canvas.zoom },
      { screen: 200, canvas: (200 - canvas.offset.x) / canvas.zoom },
    ];
    
    setDiagnostics({
      canvas: {
        offset: canvas.offset,
        zoom: canvas.zoom,
        gridEnabled: canvas.gridEnabled,
        snapEnabled: canvas.snapEnabled,
      },
      viewport,
      template: {
        size: template.size,
        sizeInPixels: {
          width: template.size.width * MM_TO_PX,
          height: template.size.height * MM_TO_PX,
        },
      },
      ruler: {
        tickCount: testTicks.length,
        firstTick: testTicks[0],
        lastTick: testTicks[testTicks.length - 1],
        majorTicks: testTicks.filter(t => t.isMajor).length,
        minorTicks: testTicks.filter(t => !t.isMajor).length,
      },
      coordinates: {
        canvasOriginInScreen,
        zeroPositionInScreen,
        testPoints,
      },
      calculations: {
        startValue: convertUnit(-viewport.x / viewport.scale, 'px', 'mm'),
        endValue: convertUnit((800 - viewport.x) / viewport.scale, 'px', 'mm'),
        pixelsPerMm: MM_TO_PX * canvas.zoom,
      },
    });
  }, [canvas, template]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      width: 400,
      maxHeight: '80vh',
      overflow: 'auto',
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: 15,
      borderRadius: 5,
      fontSize: 11,
      fontFamily: 'Consolas, monospace',
      zIndex: 10000,
      border: '1px solid #0f0',
    }}>
      <h3 style={{ margin: 0, marginBottom: 10, color: '#0f0' }}>标尺诊断信息</h3>
      
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ color: '#ff0', margin: '10px 0 5px' }}>画布状态</h4>
        <pre style={{ margin: 0 }}>{JSON.stringify(diagnostics.canvas, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ color: '#ff0', margin: '10px 0 5px' }}>视口变换</h4>
        <pre style={{ margin: 0 }}>{JSON.stringify(diagnostics.viewport, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ color: '#ff0', margin: '10px 0 5px' }}>模板尺寸</h4>
        <pre style={{ margin: 0 }}>{JSON.stringify(diagnostics.template, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ color: '#ff0', margin: '10px 0 5px' }}>标尺刻度</h4>
        <pre style={{ margin: 0 }}>{JSON.stringify(diagnostics.ruler, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ color: '#ff0', margin: '10px 0 5px' }}>坐标系统</h4>
        <pre style={{ margin: 0 }}>{JSON.stringify(diagnostics.coordinates, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ color: '#ff0', margin: '10px 0 5px' }}>计算值</h4>
        <pre style={{ margin: 0 }}>{JSON.stringify(diagnostics.calculations, null, 2)}</pre>
      </div>
      
      <div style={{ 
        marginTop: 15, 
        padding: 10, 
        background: 'rgba(255,0,0,0.2)',
        border: '1px solid #f00',
        borderRadius: 3,
      }}>
        <h4 style={{ color: '#f00', margin: '0 0 5px' }}>问题分析</h4>
        <div style={{ color: '#fff' }}>
          {diagnostics.calculations?.pixelsPerMm < 3.7795275591 && (
            <div>⚠️ 缩放级别过小，标尺可能显示不正确</div>
          )}
          {diagnostics.ruler?.tickCount === 0 && (
            <div>❌ 没有生成刻度！检查计算逻辑</div>
          )}
          {diagnostics.viewport?.x > 0 && (
            <div>⚠️ 视口X偏移为正值，可能导致标尺显示异常</div>
          )}
        </div>
      </div>
    </div>
  );
};