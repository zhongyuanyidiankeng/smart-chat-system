import React, { useState, useCallback } from 'react';
import { UploadedFile } from '@/types';
import { LocalStorage } from '@/lib/storage';
import { generateId, sleep } from '@/lib/utils';

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>(() => 
    LocalStorage.getUploadedFiles()
  );
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (fileList.length === 0) return;

    setIsUploading(true);

    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      status: 'uploading',
      progress: 0,
    }));

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
      } catch (error) {
        setFiles(prev =>
          prev.map(f =>
            f.id === newFile.id ? { ...f, status: 'error' } : f
          )
        );
      }
    }

    setIsUploading(false);
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      LocalStorage.saveUploadedFiles(updated);
      return updated;
    });
  }, []);

  // 保存到本地存储
  React.useEffect(() => {
    LocalStorage.saveUploadedFiles(files);
  }, [files]);

  return {
    files,
    uploadFiles,
    deleteFile,
    isUploading,
  };
}