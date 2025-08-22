'use client';

import React, { createContext, useReducer, useEffect } from 'react';
import { ChatSession, Message, ChatMode, ChatContextType } from '@/types';
import { LocalStorage } from '@/lib/storage';
import { generateId, sleep } from '@/lib/utils';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMode: ChatMode;
  isLoading: boolean;
}

type ChatAction =
  | { type: 'LOAD_SESSIONS'; payload: ChatSession[] }
  | { type: 'CREATE_SESSION'; payload: ChatSession }
  | { type: 'SWITCH_SESSION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: Message } }
  | { type: 'SET_MODE'; payload: ChatMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_SESSION'; payload: { sessionId: string; updates: Partial<ChatSession> } }
  | { type: 'DELETE_SESSION'; payload: string };

const initialState: ChatState = {
  sessions: [],
  currentSessionId: null,
  currentMode: 'normal',
  isLoading: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'LOAD_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
      };
    
    case 'CREATE_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
        currentSessionId: action.payload.id,
      };
    
    case 'SWITCH_SESSION':
      const session = state.sessions.find(s => s.id === action.payload);
      return {
        ...state,
        currentSessionId: action.payload,
        currentMode: session?.mode || state.currentMode,
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                messages: [...session.messages, action.payload.message],
                lastActivity: new Date(),
              }
            : session
        ),
      };
    
    case 'SET_MODE':
      // Only allow mode changes for new sessions (no messages) or when no session is active
      const currentSession = state.currentSessionId ? state.sessions.find(s => s.id === state.currentSessionId) : null;
      const canChangeMode = !currentSession || currentSession.messages.length === 0;
      
      if (!canChangeMode) {
        return state; // Don't allow mode change for sessions with messages
      }
      
      return {
        ...state,
        currentMode: action.payload,
        sessions: state.currentSessionId
          ? state.sessions.map(session =>
              session.id === state.currentSessionId
                ? { ...session, mode: action.payload }
                : session
            )
          : state.sessions,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };
    
    case 'DELETE_SESSION':
      const remainingSessions = state.sessions.filter(session => session.id !== action.payload);
      const wasCurrentSession = state.currentSessionId === action.payload;
      
      return {
        ...state,
        sessions: remainingSessions,
        currentSessionId: wasCurrentSession ? null : state.currentSessionId,
      };
    
    default:
      return state;
  }
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // 加载数据
  useEffect(() => {
    const sessions = LocalStorage.getChatSessions();
    const currentSessionId = LocalStorage.getCurrentSessionId();
    
    dispatch({ type: 'LOAD_SESSIONS', payload: sessions });
    
    if (currentSessionId && sessions.find(s => s.id === currentSessionId)) {
      dispatch({ type: 'SWITCH_SESSION', payload: currentSessionId });
    }
  }, []);

  // 保存数据
  useEffect(() => {
    LocalStorage.saveChatSessions(state.sessions);
  }, [state.sessions]);

  useEffect(() => {
    LocalStorage.setCurrentSessionId(state.currentSessionId);
  }, [state.currentSessionId]);

  const createSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: `聊天 ${state.sessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      mode: state.currentMode,
    };
    
    dispatch({ type: 'CREATE_SESSION', payload: newSession });
  };

  const switchSession = (sessionId: string) => {
    dispatch({ type: 'SWITCH_SESSION', payload: sessionId });
  };

  const sendMessage = async (content: string) => {
    let sessionId = state.currentSessionId;
    let targetSession: ChatSession;
    
    // 如果没有当前会话，创建新会话
    if (!sessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: `聊天 ${state.sessions.length + 1}`,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        mode: state.currentMode,
      };
      
      dispatch({ type: 'CREATE_SESSION', payload: newSession });
      sessionId = newSession.id;
      targetSession = newSession;
    } else {
      targetSession = state.sessions.find(s => s.id === sessionId)!;
    }

    if (!sessionId || !targetSession) return;

    // 添加用户消息
    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
      mode: targetSession.mode, // Use session's mode instead of global currentMode
    };

    dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: userMessage } });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // 模拟系统响应
      await sleep(1000);

      const systemMessage = generateSystemResponse(content, targetSession.mode); // Use session's mode
      dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: systemMessage } });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSessionTitle = (sessionId: string, newTitle: string) => {
    dispatch({ 
      type: 'UPDATE_SESSION', 
      payload: { 
        sessionId, 
        updates: { title: newTitle } 
      } 
    });
  };

  const deleteSession = (sessionId: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
  };

  const setMode = (mode: ChatMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  return (
    <ChatContext.Provider
      value={{
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        currentMode: state.currentMode,
        isLoading: state.isLoading,
        createSession,
        switchSession,
        sendMessage,
        setMode,
        updateSessionTitle,
        deleteSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// 生成系统响应的辅助函数
function generateSystemResponse(userInput: string, mode: ChatMode): Message {
  const baseMessage: Message = {
    id: generateId(),
    type: 'system',
    content: '',
    timestamp: new Date(),
    mode,
  };

  switch (mode) {
    case 'agent':
      return {
        ...baseMessage,
        content: `正在为您执行智能体任务："${userInput}"`,
        progress: {
          step: 4,
          totalSteps: 4,
          currentTask: '智能体执行完成',
          details: [
            '✅ 第1步：Python脚本 - 数据采集和分析完成',
            '✅ 第2步：Python脚本 - 数据处理和清洗完成',
            '✅ 第3步：Python脚本 - 机器学习模型训练完成',
            '✅ 第4步：HTTP请求 - 结果推送和反馈收集完成'
          ],
          status: 'completed',
          stepType: 'http'
        }
      };
    
    case 'rag':
      return {
        ...baseMessage,
        content: `基于知识库搜索，我找到了相关信息来回答您的问题："${userInput}"。根据文档内容，这个问题的答案是...`,
        ragInfo: {
          sources: ['文档1.pdf', '知识库索引_章节3', '参考资料.docx'],
          relevanceScore: 0.85,
          searchQuery: userInput,
          totalResults: 15
        }
      };
    
    default:
      return {
        ...baseMessage,
        content: `您好！我理解您想了解关于"${userInput}"的信息。作为AI助手，我很乐意为您提供帮助和解答。`
      };
  }
}