import React from 'react';
import { RagInfo } from '@/types';

interface RagInfoProps {
  ragInfo: RagInfo;
}

export function RagInfo({ ragInfo }: RagInfoProps) {
  return (
    <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
      <div className="text-sm font-medium text-green-800 mb-2">知识库检索信息</div>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-green-600">
            相关性评分: {(ragInfo.relevanceScore * 100).toFixed(1)}%
          </span>
          {ragInfo.totalResults && (
            <span className="text-xs text-green-600 ml-4">
              检索结果: {ragInfo.totalResults} 条
            </span>
          )}
        </div>
        <div>
          <span className="text-xs text-green-600 block mb-1">参考来源:</span>
          {ragInfo.sources.map((source, index) => (
            <div key={index} className="text-xs text-green-700 ml-2">• {source}</div>
          ))}
        </div>
      </div>
    </div>
  );
}