'use client';

import React from 'react';
import { ChatMode } from '@/types';
import { useChat } from '@/hooks/useChat';

const MODE_LABELS: Record<ChatMode, string> = {
  normal: '普通聊天',
  rag: 'RAG模式',
  agent: '智能体',
};

interface ModeSelectorProps {
  disabled?: boolean;
  currentSessionMode?: ChatMode;
}

export function ModeSelector({ disabled = false, currentSessionMode }: ModeSelectorProps) {
  const { currentMode, setMode } = useChat();
  
  // Use session mode if available and session has messages, otherwise use global mode
  const displayMode = currentSessionMode || currentMode;
  const isDisabled = disabled;

  const modes = [
    { id: 'normal' as const, name: '普通聊天', icon: '💬', description: '与AI进行自由对话交流' },
    { id: 'rag' as const, name: 'RAG模式', icon: '📚', description: '基于知识库的问答模式' },
    { id: 'agent' as const, name: '智能体', icon: '🤖', description: '具备工具调用能力的智能助手' }
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => !isDisabled && setMode(mode.id)}
            disabled={isDisabled}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${
              displayMode === mode.id
                ? 'bg-blue-600 text-white border-blue-600'
                : isDisabled
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <span className="mr-1.5 text-xs">{mode.icon}</span>
            <span>{mode.name}</span>
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="flex items-center space-x-1 px-2 py-1">
          <span>💡</span>
          <span className="text-blue-600 font-medium">{modes.find(m => m.id === displayMode)?.name}</span>
          {isDisabled && (
            <span className="text-xs text-gray-400 ml-1">(已固化)</span>
          )}
        </div>
      </div>
    </div>
  );
}