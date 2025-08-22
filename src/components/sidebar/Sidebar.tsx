'use client';

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
  const { sessions, currentSessionId, createSession, switchSession, updateSessionTitle, deleteSession } = useChat();

  const handleNewChat = () => {
    createSession();
    onViewChange('chat');
  };

  const handleSessionSelect = (sessionId: string) => {
    switchSession(sessionId);
    onViewChange('chat');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* 顶部操作按钮 */}
      <div className="p-4 space-y-3 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            currentView === 'chat' && !currentSessionId
              ? 'text-white bg-blue-600 shadow-md hover:bg-blue-700'
              : 'text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
          }`}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          新的聊天
        </button>
        
        <button
          onClick={() => onViewChange('files')}
          className={`w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            currentView === 'files' 
              ? 'text-white bg-blue-600 shadow-md hover:bg-blue-700'
              : 'text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          上传资料
        </button>
      </div>

      {/* 聊天历史 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center text-sm font-medium text-gray-600 mb-4">
            <History className="w-4 h-4 mr-2" />
            聊天历史
          </div>
          <div className="bg-gray-50 rounded-lg p-3 min-h-[200px]">
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onUpdateSessionTitle={updateSessionTitle}
              onDeleteSession={deleteSession}
            />
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="text-xs text-gray-500 text-center">
          智能聊天系统 v1.0
        </div>
      </div>
    </div>
  );
}