import React from 'react';
import { ChatMode } from '@/types';
import { useChat } from '@/hooks/useChat';

const MODE_LABELS: Record<ChatMode, string> = {
  normal: '普通聊天',
  rag: 'RAG模式',
  agent: '智能体',
};

export function ModeSelector() {
  const { currentMode, setMode } = useChat();

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex space-x-2">
        {(['normal', 'rag', 'agent'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentMode === mode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}