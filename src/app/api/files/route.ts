import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/api';
import { getFilesFromDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'uploadDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const files = await getFilesFromDatabase({
      category: category || undefined,
      search: search || undefined,
      sortBy: sortBy as 'name' | 'uploadDate' | 'size',
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    return createSuccessResponse({
      files,
      total: files.length
    }, 'Files retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}