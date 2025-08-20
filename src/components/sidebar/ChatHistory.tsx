import React from 'react';
import { ChatSession } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
}

const MODE_LABELS = {
  normal: '普通聊天',
  rag: 'RAG模式',
  agent: '智能体',
};

export function ChatHistory({ sessions, currentSessionId, onSessionSelect }: ChatHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        暂无聊天记录
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map(session => {
        const lastMessage = session.messages[session.messages.length - 1];
        const previewText = lastMessage 
          ? truncateText(lastMessage.content, 30)
          : '新的对话';

        return (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
              currentSessionId === session.id 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="space-y-1">
              <div className="font-medium truncate">{session.title}</div>
              <div className="text-xs text-gray-400 truncate">{previewText}</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">
                  {MODE_LABELS[session.mode]}
                </span>
                <span className="text-gray-400">
                  {formatDate(session.lastActivity)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}