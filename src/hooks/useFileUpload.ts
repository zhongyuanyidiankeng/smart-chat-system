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
import { fileApi, isServerMode } from '@/lib/apiClient';

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据库和加载文件
  useEffect(() => {
    const initializeAndLoadFiles = async () => {
      try {
        if (isServerMode()) {
          // Server mode: use API
          await loadFilesFromAPI();
        } else {
          // Local mode: use database
          await initializeDatabase();
          await loadFilesFromDatabase();
        }
      } catch (error) {
        console.error('Failed to initialize, falling back to local storage:', error);
        // 如果初始化失败，使用本地存储
        setFiles(LocalStorage.getUploadedFiles());
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadFiles();
  }, []);

  const loadFilesFromAPI = async () => {
    try {
      const response = await fileApi.getFiles();
      const uploadedFiles: UploadedFile[] = response.files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(file.uploadDate),
        status: file.status,
        category: file.category,
        dbId: file.dbId,
        url: file.filePath,
      }));
      setFiles(uploadedFiles);
    } catch (error) {
      console.error('Failed to load files from API:', error);
      throw error;
    }
  };

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

    try {
      if (isServerMode()) {
        // Server mode: use API
        await uploadFilesViaAPI(fileList, selectedCategory);
      } else {
        // Local mode: use database
        await uploadFilesLocally(fileList, selectedCategory);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFilesViaAPI = async (fileList: File[], selectedCategory?: FileCategory) => {
    const category = selectedCategory || 'other';
    
    try {
      const response = await fileApi.uploadFiles(fileList, category);
      
      // Add uploaded files to state
      const newFiles: UploadedFile[] = response.results
        .filter(result => result.success)
        .map(result => ({
          id: result.fileId!,
          name: result.filename,
          size: fileList.find(f => f.name === result.filename)?.size || 0,
          type: fileList.find(f => f.name === result.filename)?.type || '',
          uploadDate: new Date(),
          status: 'completed' as const,
          category,
          dbId: result.dbId,
        }));
      
      setFiles(prev => [...newFiles, ...prev]);
      
      // Handle failed uploads
      const failedUploads = response.results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        console.warn('Some files failed to upload:', failedUploads);
      }
    } catch (error) {
      console.error('API upload failed:', error);
      throw error;
    }
  };

  const uploadFilesLocally = async (fileList: File[], selectedCategory?: FileCategory) => {
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
  };

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      if (isServerMode()) {
        // Server mode: use API
        await fileApi.deleteFile(fileId);
      } else {
        // Local mode: use database
        await removeFileRecord(fileId);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // 同时保存到本地存储作为备份
      LocalStorage.saveUploadedFiles(updated);
      return updated;
    });
  }, []);

  const downloadFile = useCallback(async (fileId: string, fileName: string) => {
    try {
      if (isServerMode()) {
        // Server mode: use API
        const blob = await fileApi.downloadFile(fileId);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Local mode: Show informative message about limitations
        alert('本地模式下文件仅保存在浏览器中，无法下载。\n要启用下载功能，请设置 NEXT_PUBLIC_USE_API=true 并重启服务。');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`文件下载失败: ${errorMessage}\n\n请检查网络连接和服务器状态。`);
    }
  }, []);

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isServerMode()) {
        await loadFilesFromAPI();
      } else {
        await loadFilesFromDatabase();
      }
    } catch (error) {
      console.error('Failed to refresh files:', error);
    } finally {
      setIsLoading(false);
    }
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
    downloadFile,
    isUploading,
    isLoading,
    refreshFiles,
  };
}