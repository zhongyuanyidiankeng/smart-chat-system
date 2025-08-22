import { NextRequest } from 'next/server';
import { createErrorResponse, handleApiError } from '@/lib/api';
import { getFileFromDatabase } from '@/lib/database';
import { getFileFromStorage } from '@/lib/serverStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;

    if (!fileId) {
      return createErrorResponse('File ID is required', 400);
    }

    // Get file info from database
    const fileInfo = await getFileFromDatabase(fileId);
    if (!fileInfo) {
      return createErrorResponse('File not found', 404);
    }

    // Get file from storage
    const fileBuffer = await getFileFromStorage(fileInfo.filePath);
    if (!fileBuffer) {
      return createErrorResponse('File not found in storage', 404);
    }

    // Return file with appropriate headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': fileInfo.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileInfo.name}"`,
        'Content-Length': fileInfo.size.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    });

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