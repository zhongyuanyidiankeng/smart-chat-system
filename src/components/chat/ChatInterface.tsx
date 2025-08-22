'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { ModeSelector } from './ModeSelector';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatInterface() {
  const { sessions, currentSessionId, isLoading, sendMessage } = useChat();
  
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const hasMessages = currentSession && currentSession.messages.length > 0;
  const isModeSelectorDisabled = hasMessages;

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* 消息列表区域 - 带边框 */}
      <div className="flex-1 overflow-hidden bg-gray-50 px-6 py-4">
        <div className="h-full border border-gray-200 rounded-lg bg-white">
          {hasMessages ? (
            <MessageList 
              messages={currentSession.messages} 
              isLoading={isLoading}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl mx-auto px-4">
                <div className="text-6xl mb-6">💬</div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-3">有什么可以帮助你的吗</h1>
                <p className="text-gray-600 text-base mb-8 leading-relaxed">
                  选择下方的会话模式，然后输入您的问题开始对话
                </p>
                
                {/* 初始界面的模式选择器 - 更突出的显示 */}
                <div className="mb-8">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-4 text-left">选择会话模式：</h3>
                    <ModeSelector 
                      disabled={false}
                      currentSessionMode={undefined}
                      compact={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 消息输入区域 - 包含模式选择器 */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* 对于已有消息的会话，显示简化的模式选择器 */}
          {hasMessages && (
            <div className="mb-2">
              <ModeSelector 
                disabled={isModeSelectorDisabled}
                currentSessionMode={currentSession?.mode}
                compact={true}
              />
            </div>
          )}
          
          {/* 消息输入 */}
          <MessageInput 
            onSendMessage={sendMessage} 
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}