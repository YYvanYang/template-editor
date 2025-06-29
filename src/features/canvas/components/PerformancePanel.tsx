import React, { useState, useEffect, useRef } from 'react';
import { PerformanceMonitor, type PerformanceMetrics } from '../utils/performance-monitor';

interface PerformancePanelProps {
  monitor: PerformanceMonitor;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  expanded?: boolean;
}

/**
 * 性能监控面板
 * 实时显示画布性能指标
 */
export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  monitor,
  className = '',
  position = 'bottom-right',
  expanded: initialExpanded = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(monitor.getMetrics());
  const [expanded, setExpanded] = useState(initialExpanded);
  const [report, setReport] = useState(monitor.getPerformanceReport());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    // 监听性能指标更新
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
      
      // 更新 FPS 历史
      fpsHistoryRef.current.push(newMetrics.fps);
      if (fpsHistoryRef.current.length > 60) {
        fpsHistoryRef.current.shift();
      }

      // 绘制 FPS 图表
      drawFPSChart();
    };

    monitor.addListener(handleMetricsUpdate);

    // 定期更新报告
    const intervalId = setInterval(() => {
      setReport(monitor.getPerformanceReport());
    }, 1000);

    return () => {
      monitor.removeListener(handleMetricsUpdate);
      clearInterval(intervalId);
    };
  }, [monitor]);

  // 绘制 FPS 图表
  const drawFPSChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const history = fpsHistoryRef.current;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景网格
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 绘制 60 FPS 基准线
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    const targetY = height - (60 / 120) * height;
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制 FPS 曲线
    if (history.length > 1) {
      ctx.strokeStyle = metrics.fps >= 55 ? '#3b82f6' : metrics.fps >= 30 ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();

      history.forEach((fps, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - (fps / 120) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }
  };

  // 获取位置样式
  const getPositionStyles = () => {
    const base = 'absolute z-50';
    switch (position) {
      case 'top-left':
        return `${base} top-4 left-4`;
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      case 'bottom-right':
        return `${base} bottom-4 right-4`;
      default:
        return base;
    }
  };

  // 获取性能等级颜色
  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  return (
    <div
      className={`${getPositionStyles()} bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}
      style={{ minWidth: expanded ? '320px' : '160px' }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceLevelColor(metrics.performanceLevel)}`}>
            {metrics.performanceLevel.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatNumber(metrics.fps, 0)} FPS
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 简略视图 */}
      {!expanded && (
        <div className="p-2">
          <canvas
            ref={canvasRef}
            width={144}
            height={40}
            className="w-full"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
      )}

      {/* 详细视图 */}
      {expanded && (
        <div className="p-3 space-y-3">
          {/* FPS 图表 */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Frame Rate</h4>
            <canvas
              ref={canvasRef}
              width={280}
              height={60}
              className="w-full border border-gray-200 rounded"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          {/* 关键指标 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Frame Time:</span>
              <span className="ml-1 font-medium">{formatNumber(metrics.frameTime)}ms</span>
            </div>
            <div>
              <span className="text-gray-500">Elements:</span>
              <span className="ml-1 font-medium">{metrics.visibleElementCount}/{metrics.elementCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Alignment:</span>
              <span className="ml-1 font-medium">{formatNumber(metrics.avgAlignmentTime)}ms</span>
            </div>
            <div>
              <span className="text-gray-500">Cache Hit:</span>
              <span className="ml-1 font-medium">{formatNumber(metrics.cacheHitRate * 100, 0)}%</span>
            </div>
          </div>

          {/* 内存使用 */}
          {metrics.memoryUsage > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Memory Usage</span>
                <span className="font-medium">{formatNumber(metrics.memoryUsage, 0)} MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.memoryUsage / 1024) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 事件摘要 */}
          {Object.keys(report.eventSummary).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">Event Summary</h4>
              <div className="space-y-1">
                {Object.entries(report.eventSummary).map(([type, summary]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-gray-600 capitalize">{type}:</span>
                    <span className="text-gray-800">
                      {summary.count} calls, {formatNumber(summary.avgDuration)}ms avg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 建议 */}
          {report.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">Suggestions</h4>
              <ul className="space-y-1">
                {report.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-yellow-500 mr-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => monitor.reset()}
              className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                const report = monitor.getPerformanceReport();
                console.log('Performance Report:', report);
              }}
              className="flex-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};