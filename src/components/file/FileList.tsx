import React from 'react';
import { File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { UploadedFile } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';

interface FileListProps {
  files: UploadedFile[];
  onDeleteFile: (fileId: string) => void;
}

export function FileList({ files, onDeleteFile }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p>暂无上传文件</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map(file => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1">
            <File className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
              </p>
              {file.status === 'uploading' && file.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{file.progress}%</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {file.status === 'uploading' && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            {file.status === 'completed' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {file.status === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <button
              onClick={() => onDeleteFile(file.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="删除文件"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}