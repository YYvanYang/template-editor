import React from 'react';
import { Stage, Layer } from 'react-konva';
import { BarcodeElement } from '@/features/elements/barcode/BarcodeElement';
import { BarcodeElementRenderer, BarcodePreview } from './BarcodeElementRenderer';
import { BarcodeType, QRErrorCorrection } from '@/features/elements/types/barcode.types';

/**
 * 条码元素示例组件
 * 展示各种条码类型和配置
 */
export const BarcodeElementExample: React.FC = () => {
  // 示例1：Code128 条码
  const code128Element = new BarcodeElement({
    position: { x: 20, y: 20 },
    size: { width: 200, height: 80 },
    barcodeType: BarcodeType.CODE128,
    value: 'ABC123456',
    style: {
      hideText: false,
      fontSize: 12,
    },
  });
  
  // 示例2：EAN13 条码
  const ean13Element = new BarcodeElement({
    position: { x: 250, y: 20 },
    size: { width: 150, height: 80 },
    barcodeType: BarcodeType.EAN13,
    value: '9781234567890',
    style: {
      hideText: false,
      fontSize: 10,
    },
  });
  
  // 示例3：QR 码
  const qrElement = new BarcodeElement({
    position: { x: 430, y: 20 },
    size: { width: 100, height: 100 },
    barcodeType: BarcodeType.QRCODE,
    value: 'https://www.cainiao.com',
    errorCorrection: QRErrorCorrection.M,
    style: {
      hideText: true,
    },
  });
  
  // 示例4：CODE39 条码
  const code39Element = new BarcodeElement({
    position: { x: 20, y: 130 },
    size: { width: 200, height: 80 },
    barcodeType: BarcodeType.CODE39,
    value: 'CODE-39-TEST',
    style: {
      hideText: false,
      fontSize: 11,
    },
  });
  
  // 示例5：数据绑定条码
  const bindingElement = new BarcodeElement({
    position: { x: 250, y: 130 },
    size: { width: 180, height: 80 },
    barcodeType: BarcodeType.CODE128,
    value: 'DEFAULT',
    binding: '{{order.trackingNumber}}',
    style: {
      hideText: false,
      fontSize: 10,
      backgroundColor: '#f0f0f0',
    },
  });
  
  // 示例6：带样式的二维码
  const styledQRElement = new BarcodeElement({
    position: { x: 460, y: 130 },
    size: { width: 100, height: 100 },
    barcodeType: BarcodeType.QRCODE,
    value: 'STYLED-QR-CODE',
    errorCorrection: QRErrorCorrection.H,
    style: {
      backgroundColor: '#fff',
      lineColor: '#2196F3',
      margin: 10,
    },
  });
  
  // 模拟绑定数据
  const bindingData = {
    order: {
      trackingNumber: 'TRK-2024-001234',
      customer: {
        name: '张三',
        phone: '13800138000',
      },
    },
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h2>条码元素示例</h2>
      
      <Stage width={600} height={300} style={{ border: '1px solid #ccc', marginBottom: 20 }}>
        <Layer>
          {/* Code128 条码 */}
          <BarcodeElementRenderer element={code128Element} />
          
          {/* EAN13 条码 */}
          <BarcodeElementRenderer element={ean13Element} />
          
          {/* QR 码 */}
          <BarcodeElementRenderer element={qrElement} />
          
          {/* Code39 条码 */}
          <BarcodeElementRenderer element={code39Element} />
          
          {/* 数据绑定条码 */}
          <BarcodeElementRenderer 
            element={bindingElement} 
            bindingData={bindingData}
          />
          
          {/* 带样式的二维码 */}
          <BarcodeElementRenderer element={styledQRElement} />
        </Layer>
      </Stage>
      
      <div style={{ marginTop: 20 }}>
        <h3>条码预览组件示例</h3>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h4>Code128</h4>
            <BarcodePreview element={code128Element} width={150} height={60} />
          </div>
          <div>
            <h4>QR Code</h4>
            <BarcodePreview element={qrElement} width={80} height={80} />
          </div>
          <div>
            <h4>数据绑定</h4>
            <BarcodePreview 
              element={bindingElement} 
              bindingData={bindingData}
              width={150} 
              height={60} 
            />
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <h3>支持的条码类型：</h3>
        <ul>
          <li><strong>一维条码</strong>：CODE128、CODE39、CODE93、EAN8、EAN13、UPC-A、UPC-E、ITF14、Codabar 等</li>
          <li><strong>二维码</strong>：QR Code（支持纠错级别 L/M/Q/H）</li>
        </ul>
        
        <h3>功能特性：</h3>
        <ul>
          <li>数据绑定：支持使用 {'{{expression}}'} 语法绑定动态数据</li>
          <li>样式定制：可自定义背景色、条码颜色、字体大小等</li>
          <li>文本显示：可控制是否显示条码文本</li>
          <li>比例模式：支持保持比例或填充区域</li>
          <li>错误处理：自动验证条码格式，显示错误提示</li>
        </ul>
      </div>
    </div>
  );
};