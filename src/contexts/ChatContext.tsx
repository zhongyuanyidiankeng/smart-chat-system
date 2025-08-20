'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
  | { type: 'UPDATE_SESSION'; payload: { sessionId: string; updates: Partial<ChatSession> } };

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
        currentMode: session?.mode || 'normal',
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
    if (!state.currentSessionId) {
      createSession();
      await sleep(100); // 等待会话创建
    }

    const sessionId = state.currentSessionId || state.sessions[0]?.id;
    if (!sessionId) return;

    // 添加用户消息
    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
      mode: state.currentMode,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: userMessage } });
    dispatch({ type: 'SET_LOADING', payload: true });

    // 模拟系统响应
    await sleep(1000);

    const systemMessage = generateSystemResponse(content, state.currentMode);
    dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: systemMessage } });
    dispatch({ type: 'SET_LOADING', payload: false });
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
          step: 3,
          totalSteps: 3,
          currentTask: 'agent执行完成',
          details: [
            '✅ 任务一：爬取多个文档已完成，下载4个文件',
            '✅ 任务二：添加知识库已完成',
            '✅ 任务三：agent工作流执行完成'
          ],
          status: 'completed'
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