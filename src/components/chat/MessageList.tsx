'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '@/types';
import { ProgressDisplay } from '@/components/ui/ProgressDisplay';
import { RagInfo } from '@/components/ui/RagInfo';
import { formatDate } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 space-y-6">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[80%] ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* 头像 */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.type === 'user' ? '你' : 'AI'}
              </div>
              
              {/* 消息内容 */}
              <div className="flex-1 min-w-0">
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  
                  {/* 进度显示 */}
                  {message.progress && (
                    <div className="mt-3 pt-3 border-t border-blue-500/20">
                      <ProgressDisplay progress={message.progress} />
                    </div>
                  )}
                  
                  {/* RAG信息 */}
                  {message.ragInfo && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <RagInfo ragInfo={message.ragInfo} />
                    </div>
                  )}
                </div>
                
                {/* 时间戳 */}
                <div className={`text-xs text-gray-500 mt-1 px-1 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatDate(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium">
                AI
              </div>
              <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-gray-600">正在思考中...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}