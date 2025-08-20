import React from 'react';
import { useChat } from '@/hooks/useChat';
import { ModeSelector } from './ModeSelector';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatInterface() {
  const { sessions, currentSessionId, isLoading } = useChat();
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            欢迎使用智能聊天系统
          </h2>
          <p className="text-gray-600">
            点击"新的聊天"开始对话
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ModeSelector />
      <MessageList 
        messages={currentSession.messages} 
        isLoading={isLoading}
      />
      <MessageInput />
    </div>
  );
}