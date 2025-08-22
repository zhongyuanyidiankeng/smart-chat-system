import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api';
import { deleteFileFromDatabase, getFileFromDatabase } from '@/lib/database';
import { deleteFileFromStorage } from '@/lib/serverStorage';

export async function DELETE(
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

    // Delete file from storage
    if (fileInfo.filePath) {
      try {
        await deleteFileFromStorage(fileInfo.filePath);
      } catch (error) {
        console.warn('Failed to delete file from storage:', error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete file record from database
    await deleteFileFromDatabase(fileId);

    return createSuccessResponse(
      { fileId },
      'File deleted successfully'
    );

  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}