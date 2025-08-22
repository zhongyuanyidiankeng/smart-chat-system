// Database configuration - using placeholder values
// TODO: Replace with actual PostgreSQL connection details
export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chat_system',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here',
  ssl: process.env.NODE_ENV === 'production'
};

// Database schema for file uploads table
export const CREATE_FILES_TABLE = `
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    file_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    file_path VARCHAR(1000),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed',
    user_id VARCHAR(255), -- for future user management
    metadata JSONB, -- for additional file metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_files_file_id ON uploaded_files(file_id);
  CREATE INDEX IF NOT EXISTS idx_files_category ON uploaded_files(category);
  CREATE INDEX IF NOT EXISTS idx_files_upload_date ON uploaded_files(upload_date);
  CREATE INDEX IF NOT EXISTS idx_files_user_id ON uploaded_files(user_id);
`;

// TypeScript interface for database record
export interface FileRecord {
  id: number;
  file_id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  category: string;
  file_path?: string;
  upload_date: Date;
  updated_date: Date;
  status: 'uploading' | 'completed' | 'error';
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

// Mock database operations for now (since we don't have actual DB connection)
class MockDatabase {
  private files: FileRecord[] = [];
  private nextId = 1;

  async connect(): Promise<void> {
    console.log('Mock database connected');
  }

  async createFile(fileData: Omit<FileRecord, 'id' | 'upload_date' | 'updated_date' | 'created_at'>): Promise<FileRecord> {
    const now = new Date();
    const record: FileRecord = {
      ...fileData,
      id: this.nextId++,
      upload_date: now,
      updated_date: now,
      created_at: now,
    };
    
    this.files.push(record);
    return record;
  }

  async getAllFiles(userId?: string): Promise<FileRecord[]> {
    return this.files
      .filter(file => !userId || file.user_id === userId)
      .sort((a, b) => b.upload_date.getTime() - a.upload_date.getTime());
  }

  async getFileById(fileId: string): Promise<FileRecord | null> {
    return this.files.find(file => file.file_id === fileId) || null;
  }

  async updateFileStatus(fileId: string, status: 'uploading' | 'completed' | 'error'): Promise<void> {
    const file = this.files.find(f => f.file_id === fileId);
    if (file) {
      file.status = status;
      file.updated_date = new Date();
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    this.files = this.files.filter(file => file.file_id !== fileId);
  }

  async searchFiles(query: string, category?: string): Promise<FileRecord[]> {
    return this.files.filter(file => {
      const matchesQuery = file.name.toLowerCase().includes(query.toLowerCase()) ||
                          file.original_name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || file.category === category;
      return matchesQuery && matchesCategory;
    });
  }
}

// Singleton instance
export const db = new MockDatabase();

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await db.connect();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Utility functions for database operations
export async function saveFileRecord(fileData: {
  fileId: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: string;
  filePath?: string;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<FileRecord> {
  return await db.createFile({
    file_id: fileData.fileId,
    name: fileData.name,
    original_name: fileData.originalName,
    size: fileData.size,
    mime_type: fileData.mimeType,
    category: fileData.category,
    file_path: fileData.filePath,
    status: 'uploading',
    user_id: fileData.userId,
    metadata: fileData.metadata,
  });
}

export async function getFileRecords(userId?: string): Promise<FileRecord[]> {
  return await db.getAllFiles(userId);
}

export async function updateFileUploadStatus(fileId: string, status: 'completed' | 'error'): Promise<void> {
  await db.updateFileStatus(fileId, status);
}

export async function removeFileRecord(fileId: string): Promise<void> {
  await db.deleteFile(fileId);
}

// Additional functions for API layer
export async function saveFileToDatabase(fileData: {
  name: string;
  size: number;
  type: string;
  category: string;
  filePath: string;
  uploadDate: Date;
  userId?: string;
}): Promise<{ id: string; dbId: number }> {
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const record = await saveFileRecord({
    fileId,
    name: fileData.name,
    originalName: fileData.name,
    size: fileData.size,
    mimeType: fileData.type,
    category: fileData.category,
    filePath: fileData.filePath,
    userId: fileData.userId,
  });
  
  await updateFileUploadStatus(fileId, 'completed');
  
  return {
    id: fileId,
    dbId: record.id
  };
}

export async function getFilesFromDatabase(options: {
  category?: string;
  search?: string;
  sortBy?: 'name' | 'uploadDate' | 'size';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
} = {}): Promise<any[]> {
  let files = await getFileRecords(options.userId);
  
  // Apply filters
  if (options.category) {
    files = files.filter(file => file.category === options.category);
  }
  
  if (options.search) {
    files = files.filter(file => 
      file.name.toLowerCase().includes(options.search!.toLowerCase()) ||
      file.original_name.toLowerCase().includes(options.search!.toLowerCase())
    );
  }
  
  // Apply sorting
  files.sort((a, b) => {
    let comparison = 0;
    
    switch (options.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'uploadDate':
        comparison = a.upload_date.getTime() - b.upload_date.getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      default:
        comparison = a.upload_date.getTime() - b.upload_date.getTime();
    }
    
    return options.sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Convert to client format
  return files.map(file => ({
    id: file.file_id,
    dbId: file.id,
    name: file.name,
    size: file.size,
    type: file.mime_type,
    category: file.category,
    uploadDate: file.upload_date,
    status: file.status,
    filePath: file.file_path
  }));
}

export async function getFileFromDatabase(fileId: string): Promise<any | null> {
  const record = await db.getFileById(fileId);
  
  if (!record) {
    return null;
  }
  
  return {
    id: record.file_id,
    dbId: record.id,
    name: record.name,
    size: record.size,
    type: record.mime_type,
    category: record.category,
    uploadDate: record.upload_date,
    status: record.status,
    filePath: record.file_path
  };
}

export async function deleteFileFromDatabase(fileId: string): Promise<void> {
  await db.deleteFile(fileId);
}