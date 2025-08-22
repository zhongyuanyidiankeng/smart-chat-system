import React from 'react';
import { CheckCircle, Clock, AlertCircle, Code, Globe } from 'lucide-react';
import { AgentProgress } from '@/types';

interface ProgressDisplayProps {
  progress: AgentProgress;
}

const getStepIcon = (stepType: 'python' | 'http') => {
  return stepType === 'python' ? Code : Globe;
};

const getStepTypeLabel = (stepType: 'python' | 'http') => {
  return stepType === 'python' ? 'Python 脚本' : 'HTTP 请求';
};

export function ProgressDisplay({ progress }: ProgressDisplayProps) {
  const StepIcon = getStepIcon(progress.stepType);
  
  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
      <div className="flex items-center mb-2">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">智能体执行</span>
              <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                <StepIcon className="w-3 h-3" />
                <span>{getStepTypeLabel(progress.stepType)}</span>
              </div>
            </div>
            <span className="text-xs text-blue-600">第 {progress.step} 步 / 共 {progress.totalSteps} 步</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.step / progress.totalSteps) * 100}%` }}
            />
          </div>
          <div className="text-sm font-medium text-blue-800 mb-1">{progress.currentTask}</div>
        </div>
        {progress.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
        {progress.status === 'running' && <Clock className="w-5 h-5 text-blue-500 ml-2 animate-spin" />}
        {progress.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 ml-2" />}
      </div>
      
      {/* 步骤进度显示 */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Array.from({ length: 4 }, (_, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < progress.step;
          const isCurrent = stepNum === progress.step;
          const stepType = stepNum <= 3 ? 'python' : 'http';
          const StepTypeIcon = getStepIcon(stepType);
          
          return (
            <div
              key={stepNum}
              className={`flex flex-col items-center p-2 rounded text-xs ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : isCurrent
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <StepTypeIcon className="w-4 h-4 mb-1" />
              <span>第{stepNum}步</span>
              <span className="text-xs">{stepType === 'python' ? 'Python' : 'HTTP'}</span>
            </div>
          );
        })}
      </div>
      
      {progress.details.length > 0 && (
        <div className="space-y-1">
          {progress.details.map((detail, index) => (
            <div key={index} className="text-sm text-blue-700 flex items-start">
              <span className="mr-2">•</span>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}