import { FileCategory, ChatMessage, ChatSession, ChatType } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Generic API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

// File API functions
export const fileApi = {
  // Upload files
  async uploadFiles(files: File[], category: FileCategory): Promise<{
    results: Array<{
      filename: string;
      success: boolean;
      fileId?: string;
      dbId?: number;
      error?: string;
    }>;
    totalFiles: number;
    successCount: number;
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', category);

    return apiRequest('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  },

  // Get files list
  async getFiles(params: {
    category?: string;
    search?: string;
    sortBy?: 'name' | 'uploadDate' | 'size';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    files: any[];
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/files?${queryString}` : '/files';
    
    return apiRequest(endpoint);
  },

  // Delete file
  async deleteFile(fileId: string): Promise<{ fileId: string }> {
    return apiRequest(`/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  // Download file
  async downloadFile(fileId: string): Promise<Blob> {
    const url = `${API_BASE_URL}/api/files/${fileId}/download`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    
    return response.blob();
  },
};

// Chat API functions
export const chatApi = {
  // Send message
  async sendMessage(sessionId: string, message: string, type: ChatType): Promise<{
    userMessage: ChatMessage;
    aiMessage: ChatMessage;
    sessionId: string;
  }> {
    return apiRequest('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message,
        type,
      }),
    });
  },

  // Get messages for session
  async getMessages(sessionId: string): Promise<{
    messages: ChatMessage[];
    total: number;
    sessionInfo: {
      id: string;
      type: ChatType;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return apiRequest(`/chat/messages?sessionId=${sessionId}`);
  },

  // Get all sessions
  async getSessions(): Promise<{
    sessions: ChatSession[];
    total: number;
  }> {
    return apiRequest('/chat/sessions');
  },

  // Create new session
  async createSession(name: string, type: ChatType): Promise<ChatSession> {
    return apiRequest('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({
        name,
        type,
      }),
    });
  },

  // Update session
  async updateSession(sessionId: string, updates: { name?: string }): Promise<ChatSession> {
    return apiRequest('/chat/sessions', {
      method: 'PUT',
      body: JSON.stringify({
        sessionId,
        ...updates,
      }),
    });
  },

  // Delete session
  async deleteSession(sessionId: string): Promise<{ sessionId: string }> {
    return apiRequest(`/chat/sessions?sessionId=${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// Environment configuration check
export const isServerMode = () => {
  return process.env.NEXT_PUBLIC_USE_API === 'true' || process.env.NODE_ENV === 'production';
};