import { useActionState } from 'react';

/**
 * React 19 表单处理示例
 * 展示如何使用 useActionState 处理表单提交
 * 
 * @example
 * ```tsx
 * <TemplateNameForm templateId="123" initialName="我的模板" />
 * ```
 */
export function TemplateNameForm({ 
  templateId, 
  initialName 
}: { 
  templateId: string;
  initialName: string;
}) {
  const [state, submitAction, isPending] = useActionState(
    async (previousState: { error?: string }, formData: FormData) => {
      const name = formData.get('name') as string;
      
      // 验证
      if (!name || name.trim().length < 2) {
        return { error: '模板名称至少需要2个字符' };
      }
      
      try {
        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟随机错误
        if (Math.random() > 0.8) {
          throw new Error('网络错误，请重试');
        }
        
        console.log(`更新模板 ${templateId} 名称为: ${name}`);
        return { success: true };
      } catch (error) {
        return { error: error instanceof Error ? error.message : '保存失败' };
      }
    },
    {} // 初始状态
  );

  return (
    <form action={submitAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          模板名称
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialName}
          disabled={isPending}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          placeholder="输入模板名称"
        />
      </div>
      
      {state.error && (
        <div className="text-sm text-destructive">
          {state.error}
        </div>
      )}
      
      {state.success && (
        <div className="text-sm text-green-600">
          保存成功！
        </div>
      )}
      
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '保存中...' : '保存'}
      </button>
    </form>
  );
}

/**
 * React 19 use Hook 数据加载示例
 * 注意：实际使用时，Promise 应该在 Server Component 中创建
 */
import { use, Suspense } from 'react';

// 模拟数据获取
const fetchTemplateData = (id: string) => {
  return new Promise<{ id: string; name: string; size: { width: number; height: number } }>(
    (resolve) => {
      setTimeout(() => {
        resolve({
          id,
          name: `模板 ${id}`,
          size: { width: 210, height: 297 }
        });
      }, 1000);
    }
  );
};

function TemplateDetails({ templatePromise }: { templatePromise: Promise<any> }) {
  // 使用 use Hook 读取 Promise
  const template = use(templatePromise);
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium">{template.name}</h3>
      <p className="text-sm text-muted-foreground">
        尺寸: {template.size.width} × {template.size.height} mm
      </p>
    </div>
  );
}

export function TemplateLoader({ templateId }: { templateId: string }) {
  // 在实际应用中，这个 Promise 应该在 Server Component 中创建
  const templatePromise = fetchTemplateData(templateId);
  
  return (
    <Suspense fallback={<div className="animate-pulse">加载中...</div>}>
      <TemplateDetails templatePromise={templatePromise} />
    </Suspense>
  );
}