'use client';

import React, { createContext, useReducer, useEffect, useRef } from 'react';
import { ChatSession, Message, ChatMode, ChatContextType } from '@/types';
import { LocalStorage } from '@/lib/storage';
import { generateId, sleep } from '@/lib/utils';
import { chatApi, isServerMode } from '@/lib/apiClient';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMode: ChatMode;
  isLoading: boolean;
  isInitialized: boolean; // Add initialization tracking
}

type ChatAction =
  | { type: 'LOAD_SESSIONS'; payload: ChatSession[] }
  | { type: 'CREATE_SESSION'; payload: ChatSession }
  | { type: 'SWITCH_SESSION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: Message } }
  | { type: 'SET_MODE'; payload: ChatMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'UPDATE_SESSION'; payload: { sessionId: string; updates: Partial<ChatSession> } }
  | { type: 'DELETE_SESSION'; payload: string };

const initialState: ChatState = {
  sessions: [],
  currentSessionId: null,
  currentMode: 'normal',
  isLoading: false,
  isInitialized: false,
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
    
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
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
  const sessionCreationRef = useRef<boolean>(false); // Lock for session creation

  // 加载数据
  useEffect(() => {
    const loadSessions = async () => {
      try {
        dispatch({ type: 'SET_INITIALIZED', payload: false });
        
        if (isServerMode()) {
          // Server mode: load from API
          const response = await chatApi.getSessions();
          dispatch({ type: 'LOAD_SESSIONS', payload: response.sessions });
        } else {
          // Local mode: load from localStorage
          const sessions = LocalStorage.getChatSessions();
          const currentSessionId = LocalStorage.getCurrentSessionId();
          
          dispatch({ type: 'LOAD_SESSIONS', payload: sessions });
          
          if (currentSessionId && sessions.find(s => s.id === currentSessionId)) {
            dispatch({ type: 'SWITCH_SESSION', payload: currentSessionId });
          }
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        // Fallback to localStorage
        const sessions = LocalStorage.getChatSessions();
        const currentSessionId = LocalStorage.getCurrentSessionId();
        
        dispatch({ type: 'LOAD_SESSIONS', payload: sessions });
        
        if (currentSessionId && sessions.find(s => s.id === currentSessionId)) {
          dispatch({ type: 'SWITCH_SESSION', payload: currentSessionId });
        }
      } finally {
        // Mark as initialized regardless of success/failure
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    loadSessions();
  }, []);

  // 保存数据
  useEffect(() => {
    LocalStorage.saveChatSessions(state.sessions);
  }, [state.sessions]);

  useEffect(() => {
    LocalStorage.setCurrentSessionId(state.currentSessionId);
  }, [state.currentSessionId]);

  const createSession = async () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: `聊天 ${state.sessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      mode: state.currentMode,
    };
    
    if (isServerMode()) {
      try {
        const apiSession = await chatApi.createSession(newSession.title, newSession.mode);
        const sessionWithApiData = { ...newSession, id: apiSession.id };
        dispatch({ type: 'CREATE_SESSION', payload: sessionWithApiData });
      } catch (error) {
        console.error('Failed to create session via API:', error);
        // Fallback to local creation
        dispatch({ type: 'CREATE_SESSION', payload: newSession });
      }
    } else {
      dispatch({ type: 'CREATE_SESSION', payload: newSession });
    }
  };

  const switchSession = (sessionId: string) => {
    dispatch({ type: 'SWITCH_SESSION', payload: sessionId });
  };

  const sendMessage = async (content: string) => {
    // Wait for initialization to complete
    if (!state.isInitialized) {
      console.warn('Chat system not initialized yet, waiting...');
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!state.isInitialized) {
        console.error('Chat system initialization timeout');
        return;
      }
    }
    
    let sessionId = state.currentSessionId;
    let targetSession: ChatSession | undefined;
    
    // 如果没有当前会话，创建新会话
    if (!sessionId) {
      // Prevent concurrent session creation
      if (sessionCreationRef.current) {
        console.log('Session creation already in progress, waiting...');
        // Wait for ongoing session creation
        let retries = 0;
        while (sessionCreationRef.current && retries < 50) { // Max 5 seconds
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        // Re-check if session was created
        if (state.currentSessionId) {
          sessionId = state.currentSessionId;
          const foundSession = state.sessions.find(s => s.id === sessionId);
          if (foundSession) {
            targetSession = foundSession;
            // Session was created by another call, proceed with it
            console.log('Using session created by concurrent call:', sessionId);
          }
        }
      }
      
      // If still no session, create one
      if (!sessionId || !targetSession) {
        sessionCreationRef.current = true;
        
        try {
          const newSession: ChatSession = {
            id: generateId(),
            title: `聊天 ${state.sessions.length + 1}`,
            messages: [],
            createdAt: new Date(),
            lastActivity: new Date(),
            mode: state.currentMode,
          };
          
          if (isServerMode()) {
            try {
              // Create session via API first
              const apiSession = await chatApi.createSession(newSession.title, newSession.mode);
              const sessionWithApiData = { ...newSession, id: apiSession.id };
              dispatch({ type: 'CREATE_SESSION', payload: sessionWithApiData });
              sessionId = apiSession.id;
              targetSession = sessionWithApiData;
            } catch (error) {
              console.error('Failed to create session via API, using local session:', error);
              // Fallback to local creation
              dispatch({ type: 'CREATE_SESSION', payload: newSession });
              sessionId = newSession.id;
              targetSession = newSession;
            }
          } else {
            // Local mode: create session locally
            dispatch({ type: 'CREATE_SESSION', payload: newSession });
            sessionId = newSession.id;
            targetSession = newSession;
          }
        } finally {
          sessionCreationRef.current = false;
        }
      }
    } else {
      const foundSession = state.sessions.find(s => s.id === sessionId);
      if (!foundSession) {
        console.error(`Session ${sessionId} not found, creating new session`);
        // If session not found, create a new one
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
        targetSession = foundSession;
      }
    }
    
    // Ensure we have a valid session and target before proceeding
    if (!sessionId || !targetSession) {
      console.error('Failed to create or find session');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (isServerMode()) {
        // Server mode: use API
        const response = await chatApi.sendMessage(sessionId, content, targetSession.mode);
        
        // Convert API messages to local format and add to state
        const userMessage: Message = {
          id: response.userMessage.id,
          type: 'user',
          content: response.userMessage.content,
          timestamp: new Date(response.userMessage.timestamp),
          mode: targetSession.mode,
        };
        
        const aiMessage: Message = {
          id: response.aiMessage.id,
          type: 'system',
          content: response.aiMessage.content,
          timestamp: new Date(response.aiMessage.timestamp),
          mode: targetSession.mode,
        };
        
        dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: userMessage } });
        dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: aiMessage } });
      } else {
        // Local mode: generate responses locally
        // 添加用户消息
        const userMessage: Message = {
          id: generateId(),
          type: 'user',
          content,
          timestamp: new Date(),
          mode: targetSession.mode,
        };

        dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: userMessage } });

        // 模拟系统响应
        await sleep(1000);

        const systemMessage = generateSystemResponse(content, targetSession.mode);
        dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: systemMessage } });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    if (isServerMode()) {
      try {
        await chatApi.updateSession(sessionId, { name: newTitle });
      } catch (error) {
        console.error('Failed to update session title via API:', error);
      }
    }
    
    dispatch({ 
      type: 'UPDATE_SESSION', 
      payload: { 
        sessionId, 
        updates: { title: newTitle } 
      } 
    });
  };

  const deleteSession = async (sessionId: string) => {
    if (isServerMode()) {
      try {
        await chatApi.deleteSession(sessionId);
      } catch (error) {
        console.error('Failed to delete session via API:', error);
      }
    }
    
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
        isInitialized: state.isInitialized,
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