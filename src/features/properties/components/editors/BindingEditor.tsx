import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { PropertyEditorProps } from '../../types/property.types';
import { validatePropertyValue } from '../../utils/property.utils';
import { Database, X } from 'lucide-react';

/**
 * 数据绑定编辑器
 */
export const BindingEditor: React.FC<PropertyEditorProps> = ({
  element,
  property,
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // 只在完整的绑定表达式时验证
    if (newValue && !newValue.startsWith('{{')) {
      setError('绑定表达式必须以 {{ 开始');
    } else if (newValue && !newValue.endsWith('}}') && newValue.length > 2) {
      setError('绑定表达式必须以 }} 结束');
    } else {
      const validationError = validatePropertyValue(property, newValue, element);
      setError(validationError);
      
      if (!validationError) {
        onChange(newValue);
      }
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setError(null);
  };

  const insertBinding = (binding: string) => {
    const newValue = `{{${binding}}}`;
    setLocalValue(newValue);
    onChange(newValue);
    setError(null);
    setShowHelper(false);
  };

  const commonBindings = [
    { label: '订单号', value: 'order.number' },
    { label: '客户姓名', value: 'customer.name' },
    { label: '客户电话', value: 'customer.phone' },
    { label: '商品名称', value: 'product.name' },
    { label: '商品价格', value: 'product.price' },
    { label: '发货地址', value: 'shipping.address' },
    { label: '收货地址', value: 'delivery.address' },
    { label: '当前日期', value: 'date.now' },
    { label: '条形码', value: 'barcode' },
    { label: '二维码', value: 'qrcode' },
  ];

  const conditionalBindings = [
    { label: '条件判断', value: '#if condition}}...{{#else}}...{{/if' },
    { label: '循环渲染', value: '#each items}}...{{/each' },
    { label: '条件显示', value: '#unless condition}}...{{/unless' },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={property.placeholder || '{{variable}}'}
            disabled={disabled}
            className={`pr-8 ${error ? 'border-red-500' : ''}`}
          />
          {localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowHelper(!showHelper)}
          disabled={disabled}
          title="选择绑定变量"
        >
          <Database className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      
      {property.description && !error && (
        <p className="text-xs text-gray-500">{property.description}</p>
      )}
      
      {showHelper && (
        <div className="p-3 bg-gray-50 rounded-md space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">常用变量</h4>
            <div className="flex flex-wrap gap-1">
              {commonBindings.map((binding) => (
                <button
                  key={binding.value}
                  type="button"
                  onClick={() => insertBinding(binding.value)}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  {binding.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">控制结构</h4>
            <div className="flex flex-wrap gap-1">
              {conditionalBindings.map((binding) => (
                <button
                  key={binding.value}
                  type="button"
                  onClick={() => insertBinding(binding.value)}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                >
                  {binding.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <p>提示：</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>使用 {'{variable}'} 语法绑定数据</li>
              <li>支持嵌套属性访问，如 {'{order.customer.name}'}</li>
              <li>使用 {'#{if}'} 进行条件渲染</li>
              <li>使用 {'#{each}'} 进行列表渲染</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};