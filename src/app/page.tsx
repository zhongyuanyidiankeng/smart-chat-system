'use client';

import React, { useState } from 'react';
import { ViewType } from '@/types';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { FileUpload } from '@/components/file/FileUpload';
import { FileList } from '@/components/file/FileList';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const { files, uploadFiles, deleteFile, downloadFile, isUploading, isLoading, refreshFiles } = useFileUpload();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      {/* 主体区域 */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {currentView === 'chat' ? (
          <ChatInterface />
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* 文件管理头部 */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">文件管理</h1>
                  <p className="text-sm text-gray-500 mt-1">上传和管理您的文档资料</p>
                </div>
                <div className="text-sm text-gray-500">
                  共 {files.length} 个文件
                </div>
              </div>
            </div>
            
            {/* 文件管理内容 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <FileUpload 
                    onFilesSelected={(files, category) => uploadFiles(files, category)} 
                    isUploading={isUploading}
                  />
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      文件列表
                    </h2>
                    <FileList 
                      files={files} 
                      onDeleteFile={deleteFile}
                      onDownloadFile={downloadFile}
                      isLoading={isLoading}
                      onRefresh={refreshFiles}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}