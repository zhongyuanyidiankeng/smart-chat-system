import React, { useState, useMemo } from 'react';
import { File, CheckCircle, AlertCircle, X, Search, Filter, FileText, Download, Loader2, RefreshCw } from 'lucide-react';
import { UploadedFile, FileCategory } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { isServerMode } from '@/lib/apiClient';

interface FileListProps {
  files: UploadedFile[];
  onDeleteFile: (fileId: string) => void;
  onDownloadFile?: (fileId: string, fileName: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const getFileIcon = (category?: FileCategory) => {
  // Always use a generic file icon for business types
  return FileText;
};

const getFileCategory = (file: UploadedFile): FileCategory => {
  // 使用业务类型，优先使用数据库中的 category
  if (file.category) {
    return file.category;
  }
  
  // 如果没有指定类型，默认为 other
  return 'other';
};

type FileFilterCategory = FileCategory | 'all';

const categoryLabels: Record<FileFilterCategory, string> = {
  all: '全部',
  document: '类型1',
  image: '类型2',
  video: '类型3',
  audio: '类型4',
  code: '类型5',
  archive: '类型6',
  other: '其他'
};

export function FileList({ files, onDeleteFile, onDownloadFile, isLoading = false, onRefresh }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileFilterCategory>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 文件分类统计
  const categoryStats = useMemo(() => {
    const stats: Record<FileFilterCategory, number> = {
      all: files.length,
      document: 0,
      image: 0,
      video: 0,
      audio: 0,
      code: 0,
      archive: 0,
      other: 0
    };
    
    files.forEach(file => {
      const category = getFileCategory(file);
      stats[category]++;
    });
    
    return stats;
  }, [files]);

  // 过滤和排序文件
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || getFileCategory(file) === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [files, searchTerm, selectedCategory, sortBy, sortOrder]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Loader2 className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">加载中...</h3>
        <p className="text-gray-500">正在从数据库加载文件列表</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无上传文件</h3>
        <p className="text-gray-500">上传您的第一个文件开始使用</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和过滤栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文件名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* 排序选择 */}
        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
              title="刷新文件列表"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">按日期</option>
            <option value="name">按名称</option>
            <option value="size">按大小</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={sortOrder === 'asc' ? '升序' : '降序'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* 文件分类标签 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryLabels).map(([category, label]) => {
          const count = categoryStats[category as FileCategory];
          if (category !== 'all' && count === 0) return null;
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as FileFilterCategory)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* 文件列表 */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p>没有找到匹配的文件</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredAndSortedFiles.map(file => {
            const category = getFileCategory(file);
            const IconComponent = getFileIcon(category);
            
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate mb-1">{file.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploadDate)}</span>
                      <span>•</span>
                      <span className="capitalize">{categoryLabels[category] || category}</span>
                      {file.dbId && (
                        <>
                          <span>•</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">数据库</span>
                        </>
                      )}
                    </div>
                    
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">上传中...</span>
                          <span className="text-xs text-gray-500">{file.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {file.status === 'uploading' && (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  )}
                  {file.status === 'completed' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <button
                        onClick={() => {
                          if (onDownloadFile) {
                            onDownloadFile(file.id, file.name);
                          } else {
                            console.log('下载功能不可用:', file.name);
                          }
                        }}
                        disabled={!onDownloadFile}
                        className={`p-2 transition-colors rounded-lg hover:bg-gray-100 ${
                          onDownloadFile 
                            ? 'text-gray-400 hover:text-blue-500 cursor-pointer' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={onDownloadFile 
                          ? (isServerMode() ? '下载文件' : '下载文件 (本地模式限制)')
                          : '下载功能不可用'
                        }
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100"
                    title="删除文件"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 文件统计信息 */}
      {filteredAndSortedFiles.length > 0 && (
        <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-200">
          显示 {filteredAndSortedFiles.length} / {files.length} 个文件
          {searchTerm && (
            <span> • 搜索: "{searchTerm}"</span>
          )}
          {selectedCategory !== 'all' && (
            <span> • 分类: {categoryLabels[selectedCategory]}</span>
          )}
        </div>
      )}
    </div>
  );
}