'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileText, Image, Video, Music, Archive, X } from 'lucide-react';
import { FileCategory } from '@/types';
import { FILE_TYPE_FILTERS, validateFileType, getCategoryByMimeType, getCategoryByExtension } from '@/lib/fileTypes';

interface FileUploadProps {
  onFilesSelected: (files: File[], selectedCategory: FileCategory) => void;
  isUploading: boolean;
  maxFileSize?: number; // MB
  allowedCategories?: FileCategory[];
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return Archive;
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUpload({ 
  onFilesSelected, 
  isUploading, 
  maxFileSize = 10, // 默认10MB
  allowedCategories = ['other'] // 默认允许所有类型
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Clear selected files when upload is completed
  useEffect(() => {
    if (!isUploading && selectedFiles.length > 0) {
      const timer = setTimeout(() => {
        setSelectedFiles([]);
      }, 1000); // Clear after 1 second when upload is finished
      
      return () => clearTimeout(timer);
    }
  }, [isUploading, selectedFiles.length]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('other');

  const validateFiles = (files: File[]): { valid: File[], invalid: { file: File, reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];
    
    files.forEach(file => {
      // 检查文件大小
      if (file.size > maxFileSize * 1024 * 1024) {
        invalid.push({ file, reason: `文件大小超过 ${maxFileSize}MB` });
        return;
      }
      
      // 检查文件类型
      const currentCategories = selectedCategory === 'other' ? allowedCategories : [selectedCategory];
      if (!validateFileType(file, currentCategories)) {
        const category = getCategoryByMimeType(file.type) || getCategoryByExtension(file.name);
        invalid.push({ file, reason: `不支持的文件类型: ${category}` });
        return;
      }
      
      valid.push(file);
    });
    
    return { valid, invalid };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const { valid, invalid } = validateFiles(fileArray);
      
      if (invalid.length > 0) {
        // 显示错误信息
        invalid.forEach(({ file, reason }) => {
          console.warn(`文件 ${file.name}: ${reason}`);
        });
      }
      
      if (valid.length > 0) {
        setSelectedFiles(valid);
        onFilesSelected(valid, selectedCategory);
      } else {
        setSelectedFiles([]); // Clear if no valid files
      }
    }
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const { valid, invalid } = validateFiles(files);
      
      if (invalid.length > 0) {
        invalid.forEach(({ file, reason }) => {
          console.warn(`文件 ${file.name}: ${reason}`);
        });
      }
      
      if (valid.length > 0) {
        setSelectedFiles(valid);
        onFilesSelected(valid, selectedCategory);
      } else {
        setSelectedFiles([]); // Clear if no valid files
      }
    }
  };

  const getAcceptTypes = (): string => {
    if (selectedCategory === 'other') {
      return '';
    }
    
    const filter = FILE_TYPE_FILTERS.find(f => f.category === selectedCategory);
    if (!filter) return '';
    
    return [...filter.extensions, ...filter.mimeTypes].join(',');
  };

  return (
    <div className="mb-8">
      {/* 文件类型选择器 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择文件类型
        </label>
        <div className="flex flex-wrap gap-2">
          {FILE_TYPE_FILTERS.map((filter) => (
            <button
              key={filter.category}
              type="button"
              onClick={() => setSelectedCategory(filter.category)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                selectedCategory === filter.category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
        {selectedCategory !== 'other' && (
          <div className="mt-2 text-xs text-gray-500">
            支持格式: {FILE_TYPE_FILTERS.find(f => f.category === selectedCategory)?.extensions.join(', ')}
          </div>
        )}
      </div>
      <div 
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : isUploading 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
          dragActive ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">上传文件</h3>
        <p className="text-gray-500 mb-4">
          {isUploading 
            ? '正在上传文件...' 
            : dragActive 
            ? '释放文件开始上传' 
            : '拖拽文件到此处或点击选择文件'
          }
        </p>
        
        {/* 文件限制说明 */}
        <div className="text-xs text-gray-400 mb-4">
          <p>支持最大 {maxFileSize}MB 的文件</p>
          {selectedCategory !== 'other' && (
            <p>当前类型: {FILE_TYPE_FILTERS.find(f => f.category === selectedCategory)?.label}</p>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
          accept={getAcceptTypes()}
        />
        
        <button
          type="button"
          disabled={isUploading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isUploading ? '上传中...' : '选择文件'}
        </button>
        
        {/* 已选择文件预览 */}
        {selectedFiles.length > 0 && !isUploading && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">已选择 {selectedFiles.length} 个文件:</p>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-gray-500 hover:text-red-500 flex items-center space-x-1 transition-colors"
                title="清除选择"
              >
                <X className="w-3 h-3" />
                <span>清除</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedFiles.slice(0, 3).map((file, index) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div key={index} className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    <IconComponent className="w-3 h-3" />
                    <span className="truncate max-w-20">{file.name}</span>
                    <span>({formatFileSize(file.size)})</span>
                  </div>
                );
              })}
              {selectedFiles.length > 3 && (
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  +{selectedFiles.length - 3} 更多
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}