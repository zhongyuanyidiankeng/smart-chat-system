import { useState, useCallback, useEffect } from 'react';
import { UploadedFile, FileCategory } from '@/types';
import { LocalStorage } from '@/lib/storage';
import { generateId, sleep } from '@/lib/utils';
import { getCategoryByMimeType, getCategoryByExtension } from '@/lib/fileTypes';
import { 
  saveFileRecord, 
  getFileRecords, 
  updateFileUploadStatus, 
  removeFileRecord,
  initializeDatabase 
} from '@/lib/database';

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据库和加载文件
  useEffect(() => {
    const initializeAndLoadFiles = async () => {
      try {
        await initializeDatabase();
        await loadFilesFromDatabase();
      } catch (error) {
        console.error('Failed to initialize database, falling back to local storage:', error);
        // 如果数据库初始化失败，使用本地存储
        setFiles(LocalStorage.getUploadedFiles());
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadFiles();
  }, []);

  const loadFilesFromDatabase = async () => {
    try {
      const dbFiles = await getFileRecords();
      const uploadedFiles: UploadedFile[] = dbFiles.map(dbFile => ({
        id: dbFile.file_id,
        name: dbFile.name,
        size: dbFile.size,
        type: dbFile.mime_type,
        uploadDate: dbFile.upload_date,
        status: dbFile.status,
        category: dbFile.category as any,
        dbId: dbFile.id,
        url: dbFile.file_path,
      }));
      setFiles(uploadedFiles);
    } catch (error) {
      console.error('Failed to load files from database:', error);
      // 如果数据库加载失败，使用本地存储
      setFiles(LocalStorage.getUploadedFiles());
    }
  };

  const uploadFiles = useCallback(async (fileList: File[], selectedCategory?: FileCategory) => {
    if (fileList.length === 0) return;

    setIsUploading(true);

    const newFiles: UploadedFile[] = [];

    for (const file of fileList) {
      const fileId = generateId();
      // 使用用户选择的类型，如果没有选择则自动检测
      const category = selectedCategory || getCategoryByMimeType(file.type) || getCategoryByExtension(file.name);
      
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        status: 'uploading',
        progress: 0,
        category,
      };

      try {
        // 保存文件记录到数据库
        const dbRecord = await saveFileRecord({
          fileId,
          name: file.name,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          category,
          metadata: {
            lastModified: file.lastModified,
            webkitRelativePath: (file as any).webkitRelativePath || '',
          },
        });

        newFile.dbId = dbRecord.id;
        newFiles.push(newFile);
      } catch (error) {
        console.error('Failed to save file record to database:', error);
        // 如果数据库保存失败，依然添加文件但不设置 dbId
        newFiles.push(newFile);
      }
    }

    setFiles(prev => [...newFiles, ...prev]);

    // 模拟文件上传过程
    for (const newFile of newFiles) {
      try {
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 20) {
          await sleep(200);
          setFiles(prev =>
            prev.map(f =>
              f.id === newFile.id ? { ...f, progress } : f
            )
          );
        }

        // 完成上传
        setFiles(prev =>
          prev.map(f =>
            f.id === newFile.id
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );

        // 更新数据库记录状态
        if (newFile.dbId) {
          await updateFileUploadStatus(newFile.id, 'completed');
        }
      } catch (error) {
        console.error('File upload failed:', error);
        setFiles(prev =>
          prev.map(f =>
            f.id === newFile.id ? { ...f, status: 'error' } : f
          )
        );

        // 更新数据库记录状态
        if (newFile.dbId) {
          await updateFileUploadStatus(newFile.id, 'error');
        }
      }
    }

    setIsUploading(false);
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      // 从数据库删除
      await removeFileRecord(fileId);
    } catch (error) {
      console.error('Failed to delete file from database:', error);
    }

    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // 同时保存到本地存储作为备份
      LocalStorage.saveUploadedFiles(updated);
      return updated;
    });
  }, []);

  // 保存到本地存储作为备份
  useEffect(() => {
    if (!isLoading) {
      LocalStorage.saveUploadedFiles(files);
    }
  }, [files, isLoading]);

  return {
    files,
    uploadFiles,
    deleteFile,
    isUploading,
    isLoading,
    refreshFiles: loadFilesFromDatabase,
  };
}