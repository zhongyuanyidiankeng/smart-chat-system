import { ChatSession, UploadedFile } from '@/types';

const STORAGE_KEYS = {
  CHAT_SESSIONS: 'chat_sessions',
  UPLOADED_FILES: 'uploaded_files',
  CURRENT_SESSION: 'current_session_id',
} as const;

export class LocalStorage {
  static getChatSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      if (!data) return [];
      const sessions = JSON.parse(data);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  static saveChatSessions(sessions: ChatSession[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  }

  static getUploadedFiles(): UploadedFile[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILES);
      if (!data) return [];
      const files = JSON.parse(data);
      return files.map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate),
      }));
    } catch (error) {
      console.error('Error loading uploaded files:', error);
      return [];
    }
  }

  static saveUploadedFiles(files: UploadedFile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.UPLOADED_FILES, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving uploaded files:', error);
    }
  }

  static getCurrentSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  static setCurrentSessionId(sessionId: string | null): void {
    if (typeof window === 'undefined') return;
    if (sessionId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  }

  static clearAll(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}