import React, { useMemo, useCallback } from 'react';
import { useEditorStore } from '@/features/editor/stores/editor.store';
import { SmartSpacingDetector } from '../utils/smart-spacing.utils';
import { calculateElementBounds } from '../utils/alignment.utils';

interface SmartDistributeToolbarProps {
  className?: string;
}

/**
 * 智能分布工具栏
 * 提供快速对齐和分布功能
 */
export const SmartDistributeToolbar: React.FC<SmartDistributeToolbarProps> = ({ className }) => {
  const { elements, selectedElementIds, updateElements, addHistoryEntry } = useEditorStore();
  const detector = useMemo(() => new SmartSpacingDetector(), []);

  // 获取选中元素的边界
  const selectedBounds = useMemo(() => {
    const selected = Array.from(selectedElementIds)
      .map(id => elements.get(id))
      .filter(Boolean)
      .map(el => calculateElementBounds({
        id: el!.id,
        x: el!.position.x,
        y: el!.position.y,
        width: el!.size.width,
        height: el!.size.height,
        rotation: el!.rotation || 0,
      }));
    return selected;
  }, [elements, selectedElementIds]);

  // 分析间距
  const spacingAnalysis = useMemo(() => {
    if (selectedBounds.length < 2) return null;
    return detector.analyzeSpacing(selectedBounds);
  }, [selectedBounds, detector]);

  // 水平等间距分布
  const distributeHorizontally = useCallback(() => {
    if (selectedBounds.length < 3) return;

    const updates = detector.distributeElements(selectedBounds, 'horizontal');
    if (updates.length > 0) {
      updateElements(updates);
      addHistoryEntry();
    }
  }, [selectedBounds, detector, updateElements, addHistoryEntry]);

  // 垂直等间距分布
  const distributeVertically = useCallback(() => {
    if (selectedBounds.length < 3) return;

    const updates = detector.distributeElements(selectedBounds, 'vertical');
    if (updates.length > 0) {
      updateElements(updates);
      addHistoryEntry();
    }
  }, [selectedBounds, detector, updateElements, addHistoryEntry]);

  // 对齐功能
  const align = useCallback((axis: 'horizontal' | 'vertical', alignment: 'start' | 'center' | 'end') => {
    if (selectedBounds.length < 2) return;

    const updates = detector.alignElements(selectedBounds, axis, alignment);
    if (updates.length > 0) {
      updateElements(updates);
      addHistoryEntry();
    }
  }, [selectedBounds, detector, updateElements, addHistoryEntry]);

  // 应用建议
  const applySuggestion = useCallback((index: number) => {
    if (!spacingAnalysis || !spacingAnalysis.suggestions[index]) return;

    const suggestion = spacingAnalysis.suggestions[index];
    let updates: Array<{ id: string; position: { x: number; y: number } }> = [];

    switch (suggestion.type) {
      case 'equal-spacing':
        const axis = suggestion.action.includes('horizontally') ? 'horizontal' : 'vertical';
        const suggestedElements = selectedBounds.filter(el => suggestion.elements.includes(el.id));
        updates = detector.distributeElements(suggestedElements, axis);
        break;

      case 'align-edges':
        // 从 action 中解析对齐信息
        const match = suggestion.action.match(/Align \d+ elements (\w+) (\w+)/);
        if (match) {
          const [, alignType, axisType] = match;
          const alignElements = selectedBounds.filter(el => suggestion.elements.includes(el.id));
          updates = detector.alignElements(
            alignElements,
            axisType as 'horizontal' | 'vertical',
            alignType as 'start' | 'center' | 'end'
          );
        }
        break;
    }

    if (updates.length > 0) {
      updateElements(updates);
      addHistoryEntry();
    }
  }, [spacingAnalysis, selectedBounds, detector, updateElements, addHistoryEntry]);

  const isDisabled = selectedBounds.length < 2;

  return (
    <div className={`flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm ${className}`}>
      {/* 对齐工具 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Alignment</h3>
        <div className="grid grid-cols-3 gap-1">
          {/* 水平对齐 */}
          <button
            onClick={() => align('vertical', 'start')}
            disabled={isDisabled}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Align Left"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="4" width="2" height="12" />
              <rect x="8" y="6" width="6" height="2" />
              <rect x="8" y="12" width="8" height="2" />
            </svg>
          </button>
          <button
            onClick={() => align('vertical', 'center')}
            disabled={isDisabled}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Align Center Horizontally"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <rect x="9" y="4" width="2" height="12" />
              <rect x="7" y="6" width="6" height="2" />
              <rect x="6" y="12" width="8" height="2" />
            </svg>
          </button>
          <button
            onClick={() => align('vertical', 'end')}
            disabled={isDisabled}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Align Right"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <rect x="14" y="4" width="2" height="12" />
              <rect x="6" y="6" width="6" height="2" />
              <rect x="4" y="12" width="8" height="2" />
            </svg>
          </button>

          {/* 垂直对齐 */}
          <button
            onClick={() => align('horizontal', 'start')}
            disabled={isDisabled}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Align Top"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="4" width="12" height="2" />
              <rect x="6" y="8" width="2" height="6" />
              <rect x="12" y="8" width="2" height="8" />
            </svg>
          </button>
          <button
            onClick={() => align('horizontal', 'center')}
            disabled={isDisabled}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Align Center Vertically"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="9" width="12" height="2" />
              <rect x="6" y="7" width="2" height="6" />
              <rect x="12" y="6" width="2" height="8" />
            </svg>
          </button>
          <button
            onClick={() => align('horizontal', 'end')}
            disabled={isDisabled}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Align Bottom"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="14" width="12" height="2" />
              <rect x="6" y="8" width="2" height="6" />
              <rect x="12" y="4" width="2" height="8" />
            </svg>
          </button>
        </div>
      </div>

      {/* 分布工具 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Distribution</h3>
        <div className="flex gap-1">
          <button
            onClick={distributeHorizontally}
            disabled={selectedBounds.length < 3}
            className="flex-1 p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Distribute Horizontally"
          >
            <svg className="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="8" width="2" height="4" />
              <rect x="9" y="8" width="2" height="4" />
              <rect x="16" y="8" width="2" height="4" />
            </svg>
          </button>
          <button
            onClick={distributeVertically}
            disabled={selectedBounds.length < 3}
            className="flex-1 p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Distribute Vertically"
          >
            <svg className="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <rect x="8" y="2" width="4" height="2" />
              <rect x="8" y="9" width="4" height="2" />
              <rect x="8" y="16" width="4" height="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 智能建议 */}
      {spacingAnalysis && spacingAnalysis.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Smart Suggestions</h3>
          <div className="space-y-1">
            {spacingAnalysis.suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(index)}
                className="w-full p-2 text-left text-sm rounded hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>{suggestion.action}</span>
                  <span className="text-xs text-gray-500">
                    {suggestion.elements.length} elements
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 间距信息 */}
      {spacingAnalysis && (spacingAnalysis.horizontal.length > 0 || spacingAnalysis.vertical.length > 0) && (
        <div className="text-xs text-gray-500">
          <div className="mb-1">
            <span className="font-medium">Detected patterns:</span>
          </div>
          {spacingAnalysis.horizontal.filter(p => p.isPrimary).map((pattern, i) => (
            <div key={`h-${i}`}>
              Horizontal: {pattern.spacing}px ({pattern.count} gaps)
            </div>
          ))}
          {spacingAnalysis.vertical.filter(p => p.isPrimary).map((pattern, i) => (
            <div key={`v-${i}`}>
              Vertical: {pattern.spacing}px ({pattern.count} gaps)
            </div>
          ))}
        </div>
      )}
    </div>
  );
};