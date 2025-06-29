import React, { useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { RulerContainer } from '../components/RulerContainer';
import { AlignmentGuidesKonva } from '../components/AlignmentGuidesKonva';
import { ElementsRenderer } from '../components/ElementRenderer';
import { SmartDistributeToolbar } from '../components/SmartDistributeToolbar';
import { PerformancePanel } from '../components/PerformancePanel';
import { useAlignment } from '../hooks/useAlignment';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useEditorStore } from '@/features/editor/stores/editor.store';

/**
 * 完整的对齐系统示例
 * 展示所有功能的集成使用
 */
export const AlignmentSystemExample: React.FC = () => {
  const [showPerformance, setShowPerformance] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [unit, setUnit] = useState<'px' | 'mm' | 'cm'>('mm');

  const { canvas, template, addElement } = useEditorStore();
  
  // 初始化对齐系统
  const alignment = useAlignment({
    config: {
      enabled: true,
      threshold: 5,
      snapToGrid: canvas.snapEnabled,
      gridSize: 10,
      snapToElements: true,
      showCenterGuides: true,
      showEdgeGuides: true,
    }
  });

  // 初始化性能监控
  const { monitor } = usePerformanceMonitor({
    enabled: showPerformance,
    onDegradation: () => {
      console.warn('Performance degradation detected!');
      // 可以在这里自动调整设置
    }
  });

  // 添加示例元素
  const addExampleElements = () => {
    // 添加一些测试元素
    const elements = [
      { type: 'text', x: 100, y: 100, width: 150, height: 50, content: 'Element 1' },
      { type: 'text', x: 300, y: 100, width: 150, height: 50, content: 'Element 2' },
      { type: 'text', x: 500, y: 100, width: 150, height: 50, content: 'Element 3' },
      { type: 'shape', x: 100, y: 200, width: 100, height: 100 },
      { type: 'shape', x: 250, y: 200, width: 100, height: 100 },
      { type: 'shape', x: 400, y: 200, width: 100, height: 100 },
    ];

    elements.forEach((el, index) => {
      addElement({
        id: `example-${Date.now()}-${index}`,
        type: el.type as any,
        position: { x: el.x, y: el.y },
        size: { width: el.width, height: el.height },
        content: el.content,
        style: {
          backgroundColor: el.type === 'shape' ? '#e0e7ff' : undefined,
          borderColor: '#6366f1',
          borderWidth: 2,
        },
      });
    });
  };

  // 创建辅助线示例
  const addExampleGuides = () => {
    // 添加一些手动辅助线
    alignment.addManualGuide({
      orientation: 'vertical',
      position: 200,
      visible: true,
    });
    alignment.addManualGuide({
      orientation: 'vertical',
      position: 400,
      visible: true,
    });
    alignment.addManualGuide({
      orientation: 'horizontal',
      position: 150,
      visible: true,
    });
    alignment.addManualGuide({
      orientation: 'horizontal',
      position: 250,
      visible: true,
    });
  };

  const canvasContent = (
    <Stage
      width={window.innerWidth - 300}
      height={window.innerHeight - 100}
      scaleX={canvas.zoom}
      scaleY={canvas.zoom}
      x={canvas.offset.x}
      y={canvas.offset.y}
      draggable
    >
      <Layer>
        {/* 背景 */}
        <rect
          x={0}
          y={0}
          width={template.size.width * 3.7795275591}
          height={template.size.height * 3.7795275591}
          fill="white"
        />

        {/* 元素 */}
        <ElementsRenderer />

        {/* 对齐辅助线 */}
        <AlignmentGuidesKonva
          guides={alignment.staticGuides}
          dynamicGuides={alignment.dynamicGuides}
          viewport={{
            scale: canvas.zoom,
            x: canvas.offset.x,
            y: canvas.offset.y,
            width: window.innerWidth - 300,
            height: window.innerHeight - 100,
          }}
          canvasSize={{
            width: template.size.width * 3.7795275591,
            height: template.size.height * 3.7795275591,
          }}
          showMeasurements={true}
        />
      </Layer>
    </Stage>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧工具栏 */}
      <div className="w-64 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Alignment System Demo</h2>
        </div>

        {/* 控制面板 */}
        <div className="p-4 space-y-4">
          {/* 示例操作 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={addExampleElements}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Example Elements
              </button>
              <button
                onClick={addExampleGuides}
                className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Example Guides
              </button>
              <button
                onClick={() => alignment.clearManualGuides()}
                className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear All Guides
              </button>
            </div>
          </div>

          {/* 设置 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRulers}
                  onChange={(e) => setShowRulers(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Rulers</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPerformance}
                  onChange={(e) => setShowPerformance(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Performance Monitor</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={alignment.config.enabled}
                  onChange={(e) => alignment.updateConfig({ enabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Enable Alignment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={alignment.config.snapToGrid}
                  onChange={(e) => alignment.updateConfig({ snapToGrid: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Snap to Grid</span>
              </label>
            </div>
          </div>

          {/* 单位选择 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Unit</h3>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="px">Pixels</option>
              <option value="mm">Millimeters</option>
              <option value="cm">Centimeters</option>
            </select>
          </div>

          {/* 对齐设置 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Alignment Settings</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600">Snap Threshold</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={alignment.config.threshold}
                  onChange={(e) => alignment.updateConfig({ threshold: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{alignment.config.threshold}px</span>
              </div>
              <div>
                <label className="text-xs text-gray-600">Grid Size</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={alignment.config.gridSize}
                  onChange={(e) => alignment.updateConfig({ gridSize: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{alignment.config.gridSize}px</span>
              </div>
            </div>
          </div>

          {/* 智能分布工具 */}
          <SmartDistributeToolbar />
        </div>
      </div>

      {/* 主画布区域 */}
      <div className="flex-1 relative">
        {showRulers ? (
          <RulerContainer
            unit={unit}
            thickness={30}
            backgroundColor="#f8f9fa"
            textColor="#6c757d"
            tickColor="#dee2e6"
            fontSize={11}
          >
            {canvasContent}
          </RulerContainer>
        ) : (
          <div className="w-full h-full">
            {canvasContent}
          </div>
        )}

        {/* 性能监控面板 */}
        {showPerformance && monitor && (
          <PerformancePanel
            monitor={monitor}
            position="bottom-right"
            expanded={false}
          />
        )}

        {/* 快捷键提示 */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Keyboard Shortcuts</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Hold <kbd className="px-1 bg-gray-200 rounded">Alt</kbd> - Disable snapping</div>
            <div>Hold <kbd className="px-1 bg-gray-200 rounded">Shift</kbd> - Multi-select</div>
            <div><kbd className="px-1 bg-gray-200 rounded">Ctrl</kbd> + Wheel - Zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
};