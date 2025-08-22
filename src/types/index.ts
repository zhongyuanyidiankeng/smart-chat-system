export interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
  mode?: ChatMode;
  progress?: AgentProgress;
  ragInfo?: RagInfo;
}

export interface AgentProgress {
  step: number;
  totalSteps: number;
  currentTask: string;
  details: string[];
  status: 'running' | 'completed' | 'error';
  stepType: 'python' | 'http';
}

export interface RagInfo {
  sources: string[];
  relevanceScore: number;
  searchQuery?: string;
  totalResults?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  mode: ChatMode;
  lastActivity: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  category?: FileCategory;
  dbId?: number; // PostgreSQL database ID
}

export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'other';

export interface FileTypeFilter {
  category: FileCategory;
  label: string;
  extensions: string[];
  mimeTypes: string[];
  icon: string;
}

export type ChatMode = 'agent' | 'rag' | 'normal';

export type ViewType = 'chat' | 'files';

export interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMode: ChatMode;
  isLoading: boolean;
  createSession: () => void;
  switchSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: ChatMode) => void;
  updateSessionTitle: (sessionId: string, newTitle: string) => void;
  deleteSession: (sessionId: string) => void;
}

export interface FileContextType {
  files: UploadedFile[];
  uploadFiles: (files: File[], selectedCategory?: FileCategory) => Promise<void>;
  deleteFile: (fileId: string) => void;
  isUploading: boolean;
}