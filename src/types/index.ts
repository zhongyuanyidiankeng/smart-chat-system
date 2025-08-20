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
}

export interface FileContextType {
  files: UploadedFile[];
  uploadFiles: (files: File[]) => Promise<void>;
  deleteFile: (fileId: string) => void;
  isUploading: boolean;
}