import { NextResponse } from 'next/server';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Success response helper
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

// Error response helper
export function createErrorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

// Common error handlers
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }
  
  return createErrorResponse('Internal server error', 500);
}

// Validation helpers
export function validateRequired(data: Record<string, any>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// File upload validation
export function validateFileUpload(file: File): string | null {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'File size exceeds 10MB limit';
  }

  // Check file type (you can customize this based on requirements)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'audio/mp3',
    'audio/wav',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not supported`;
  }

  return null;
}

// CORS headers for API routes
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}