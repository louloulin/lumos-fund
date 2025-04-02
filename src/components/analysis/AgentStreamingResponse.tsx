'use client';

// 注意: 这是一个客户端组件，用于显示流式响应内容
import { useEffect, useRef } from 'react';

export interface AgentStreamingResponseProps {
  content: string;
}

export function AgentStreamingResponse({ content }: AgentStreamingResponseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新内容
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="max-h-[300px] overflow-auto p-3 rounded bg-muted/30 whitespace-pre-line"
    >
      {content || (
        <div className="text-muted-foreground text-sm">
          正在等待响应...
        </div>
      )}
    </div>
  );
} 