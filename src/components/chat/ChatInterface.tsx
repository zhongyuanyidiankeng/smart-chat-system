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
          {currentSession && currentSession.messages.length > 0 ? (
            <MessageList 
              messages={currentSession.messages} 
              isLoading={isLoading}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">有什么可以帮助你的吗</h3>
                <p className="text-gray-500 text-sm max-w-md">
                  请在下方输入框中输入您的问题
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 消息输入区域 - 包含模式选择器 */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* 模式选择器作为小工具 */}
          <div className="mb-4">
            <ModeSelector 
              disabled={isModeSelectorDisabled}
              currentSessionMode={currentSession?.mode}
            />
          </div>
          
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