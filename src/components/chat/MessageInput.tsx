'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isInitialized } = useChat();

  const handleSend = async () => {
    if (!input.trim() || disabled || isLoading || !isInitialized) return;
    
    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      await onSendMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading || !input.trim() || !isInitialized;
  const placeholderText = !isInitialized 
    ? '系统初始化中...'
    : '请输入你的问题... Enter 发送，Shift + Enter 换行';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholderText}
          className="w-full px-6 py-4 pr-16 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none transition-all duration-200 min-h-[56px] max-h-40 text-gray-900 placeholder-gray-500"
          disabled={disabled || isLoading || !isInitialized}
          rows={1}
          style={{
            height: 'auto',
            minHeight: '56px',
            maxHeight: '160px'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 160) + 'px';
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* 字数统计 */}
          <span className={`text-xs transition-colors duration-200 ${
            input.length > 1800 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {input.length}/2000
          </span>
          
          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={isDisabled}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
              isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* 底部提示栏 */}
      <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span>📝</span>
            <span>支持 Markdown 格式</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⌨️</span>
            <span>Enter 发送</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🔄</span>
            <span>Shift+Enter 换行</span>
          </div>
        </div>
        
        {/* 状态指示器 */}
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>AI 思考中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}