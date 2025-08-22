import { FileTypeFilter, FileCategory } from '@/types';

export const FILE_TYPE_FILTERS: FileTypeFilter[] = [
  {
    category: 'document',
    label: '类型1',
    icon: '📄',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  {
    category: 'image',
    label: '类型2',
    icon: '📊',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  {
    category: 'video',
    label: '类型3',
    icon: '📋',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  {
    category: 'audio',
    label: '类型4',
    icon: '📈',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  {
    category: 'code',
    label: '类型5',
    icon: '📝',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  {
    category: 'other',
    label: '其他',
    icon: '📎',
    extensions: ['*'],
    mimeTypes: ['*']
  }
];

export const getCategoryByMimeType = (mimeType: string): FileCategory => {
  for (const filter of FILE_TYPE_FILTERS) {
    if (filter.mimeTypes.includes(mimeType) || filter.mimeTypes.includes('*')) {
      return filter.category;
    }
  }
  return 'other';
};

export const getCategoryByExtension = (fileName: string): FileCategory => {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  for (const filter of FILE_TYPE_FILTERS) {
    if (filter.extensions.includes(extension) || filter.extensions.includes('*')) {
      return filter.category;
    }
  }
  return 'other';
};

export const getFilterByCategory = (category: FileCategory): FileTypeFilter | undefined => {
  return FILE_TYPE_FILTERS.find(filter => filter.category === category);
};

export const validateFileType = (file: File, allowedCategories: FileCategory[]): boolean => {
  if (allowedCategories.includes('other')) {
    return true;
  }
  
  const category = getCategoryByMimeType(file.type) || getCategoryByExtension(file.name);
  return allowedCategories.includes(category);
};