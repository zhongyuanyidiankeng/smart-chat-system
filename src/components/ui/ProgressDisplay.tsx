import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AgentProgress } from '@/types';

interface ProgressDisplayProps {
  progress: AgentProgress;
}

export function ProgressDisplay({ progress }: ProgressDisplayProps) {
  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
      <div className="flex items-center mb-2">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-800">执行进度</span>
            <span className="text-xs text-blue-600">{progress.step}/{progress.totalSteps}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.step / progress.totalSteps) * 100}%` }}
            />
          </div>
        </div>
        {progress.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
        {progress.status === 'running' && <Clock className="w-5 h-5 text-blue-500 ml-2 animate-spin" />}
        {progress.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 ml-2" />}
      </div>
      <div className="space-y-1">
        {progress.details.map((detail, index) => (
          <div key={index} className="text-sm text-blue-700 flex items-start">
            <span className="mr-2">•</span>
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}