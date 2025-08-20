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
  const { files, uploadFiles, deleteFile, isUploading } = useFileUpload();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <div className="flex-1 flex flex-col">
        {currentView === 'chat' ? (
          <ChatInterface />
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">文件管理</h1>
              
              <FileUpload 
                onFilesSelected={uploadFiles} 
                isUploading={isUploading}
              />
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">已上传文件</h2>
                <FileList 
                  files={files} 
                  onDeleteFile={deleteFile}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}