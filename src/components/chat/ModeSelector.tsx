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
  compact?: boolean; // Add compact mode support
}

export function ModeSelector({ disabled = false, currentSessionMode, compact = false }: ModeSelectorProps) {
  const { currentMode, setMode } = useChat();
  
  // Use session mode if available and session has messages, otherwise use global mode
  const displayMode = currentSessionMode || currentMode;
  const isDisabled = disabled;

  const modes = [
    { 
      id: 'normal' as const, 
      name: '普通聊天', 
      icon: '💬', 
      description: '与AI进行自由对话交流',
      color: 'blue'
    },
    { 
      id: 'rag' as const, 
      name: 'RAG模式', 
      icon: '📚', 
      description: '基于知识库的问答模式',
      color: 'green'
    },
    { 
      id: 'agent' as const, 
      name: '智能体', 
      icon: '🤖', 
      description: '具备工具调用能力的智能助手',
      color: 'purple'
    }
  ];

  return (
    <div className="w-full">
      {compact ? (
        // Compact mode - horizontal layout with small buttons
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {modes.map((mode) => {
              const isSelected = displayMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => !isDisabled && setMode(mode.id)}
                  disabled={isDisabled}
                  className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-all duration-200 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <span className="mr-1 text-xs">{mode.icon}</span>
                  <span>{mode.name}</span>
                </button>
              );
            })}
          </div>
          
          {isDisabled && (
            <div className="text-xs text-gray-400">
              (已锁定)
            </div>
          )}
        </div>
      ) : (
        // Full mode - large card layout for initial interface
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modes.map((mode) => {
              const isSelected = displayMode === mode.id;
              const getColorClasses = (color: string, selected: boolean) => {
                if (selected) {
                  switch (color) {
                    case 'blue': return 'bg-blue-600 text-white border-blue-600 shadow-blue-100';
                    case 'green': return 'bg-green-600 text-white border-green-600 shadow-green-100';
                    case 'purple': return 'bg-purple-600 text-white border-purple-600 shadow-purple-100';
                    default: return 'bg-blue-600 text-white border-blue-600';
                  }
                } else if (isDisabled) {
                  return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
                } else {
                  return 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer';
                }
              };
              
              return (
                <button
                  key={mode.id}
                  onClick={() => !isDisabled && setMode(mode.id)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center p-4 rounded-xl text-center transition-all duration-200 border-2 ${
                    getColorClasses(mode.color, isSelected)
                  } ${isSelected ? 'shadow-lg scale-105' : 'hover:scale-102'}`}
                >
                  <div className="text-2xl mb-2">{mode.icon}</div>
                  <div className="font-semibold text-sm mb-1">{mode.name}</div>
                  <div className={`text-xs leading-relaxed ${
                    isSelected ? 'text-white/90' : isDisabled ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {mode.description}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* 当前模式显示 */}
          <div className="flex items-center justify-center mt-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 text-sm">
              <span>💡</span>
              <span className="text-gray-600">当前模式：</span>
              <span className="font-semibold text-gray-900">
                {modes.find(m => m.id === displayMode)?.name}
              </span>
              {isDisabled && (
                <span className="text-xs text-gray-500 ml-1">(已锁定)</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}