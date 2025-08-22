'use client';

import React, { useState, useRef } from 'react';
import { ChatSession } from '@/types';
import { formatDate } from '@/lib/utils';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onUpdateSessionTitle?: (sessionId: string, newTitle: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const MODE_ICONS = {
  normal: '💬',
  rag: '📚',
  agent: '🤖',
};

export function ChatHistory({ sessions, currentSessionId, onSessionSelect, onUpdateSessionTitle, onDeleteSession }: ChatHistoryProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const handleTitleClick = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation(); // 防止触发session选择
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveTitle = async (sessionId: string) => {
    if (isSavingRef.current) return; // Prevent multiple saves
    
    if (editingTitle.trim() && onUpdateSessionTitle) {
      isSavingRef.current = true;
      try {
        await onUpdateSessionTitle(sessionId, editingTitle.trim());
      } catch (error) {
        console.error('Failed to update session title:', error);
      } finally {
        isSavingRef.current = false;
      }
    }
    
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    isSavingRef.current = false;
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle(sessionId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleBlur = (sessionId: string) => {
    // 延迟执行保存，以防用户点击了其他按钮
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (editingSessionId === sessionId && !isSavingRef.current) {
        handleSaveTitle(sessionId);
      }
    }, 150); // 增加延迟时间以获得更好的用户体验
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (onDeleteSession && window.confirm('确定要删除这个聊天记录吗？')) {
      onDeleteSession(sessionId);
    }
  };
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <div className="mb-2">📝</div>
        <div>暂无聊天记录</div>
        <div className="text-xs mt-1">开始新的对话吧</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map(session => {
        return (
          <div
            key={session.id}
            className={`relative px-3 py-2 text-sm rounded-lg transition-all duration-200 border group cursor-pointer ${
              currentSessionId === session.id 
                ? 'bg-white text-blue-600 border-blue-200 shadow-sm' 
                : 'text-gray-600 hover:bg-white hover:border-gray-200 border-transparent hover:shadow-sm'
            } ${editingSessionId === session.id ? 'z-10' : ''}`}
            onClick={() => editingSessionId !== session.id && onSessionSelect(session.id)}
            style={{
              minHeight: '48px' // Ensure consistent height
            }}
          >
            <div className="flex items-center justify-between min-h-[32px]"> {/* Fixed height to prevent layout shift */}
              {editingSessionId === session.id ? (
                <div className="flex items-center flex-1 relative">
                  <span className="text-base mr-2 flex-shrink-0">{MODE_ICONS[session.mode]}</span>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, session.id)}
                      onBlur={() => handleBlur(session.id)}
                      className="w-full text-gray-800 font-medium bg-white border border-blue-300 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm resize-none"
                      style={{
                        height: '28px', // Fixed height to match original text
                        fontSize: '14px',
                        lineHeight: '20px'
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => {
                        // Select all text when focused for better UX
                        setTimeout(() => e.target.select(), 0);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-base mr-2 flex-shrink-0">{MODE_ICONS[session.mode]}</span>
                    <div 
                      className="font-medium truncate text-gray-800 flex-1 py-1.5 px-2"
                      style={{
                        minHeight: '28px', // Match input field height
                        fontSize: '14px',
                        lineHeight: '20px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {session.title}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTitleClick(e, session);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                      title="编辑名称"
                    >
                      <span className="text-xs">✏️</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                      title="删除聊天"
                    >
                      <span className="text-xs">🗑️</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}