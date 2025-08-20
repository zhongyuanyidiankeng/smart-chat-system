import React from 'react';
import { MessageCircle, Upload, History } from 'lucide-react';
import { ViewType } from '@/types';
import { useChat } from '@/hooks/useChat';
import { ChatHistory } from './ChatHistory';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { sessions, currentSessionId, createSession, switchSession } = useChat();

  const handleNewChat = () => {
    createSession();
    onViewChange('chat');
  };

  const handleSessionSelect = (sessionId: string) => {
    switchSession(sessionId);
    onViewChange('chat');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 顶部操作按钮 */}
      <div className="p-4 space-y-2 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          新的聊天
        </button>
        
        <button
          onClick={() => onViewChange('files')}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            currentView === 'files' 
              ? 'text-blue-600 bg-blue-50 border border-blue-200' 
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          上传资料
        </button>
      </div>

      {/* 聊天历史 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-3">
            <History className="w-4 h-4 mr-1" />
            聊天历史
          </div>
          <ChatHistory
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
          />
        </div>
      </div>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          智能聊天系统 v1.0
        </div>
      </div>
    </div>
  );
}