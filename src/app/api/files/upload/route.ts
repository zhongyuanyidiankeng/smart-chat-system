import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError, validateFileUpload } from '@/lib/api';
import { saveFileToDatabase } from '@/lib/database';
import { saveFileToStorage } from '@/lib/serverStorage';
import { FileCategory } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as FileCategory;

    if (!files || files.length === 0) {
      return createErrorResponse('No files provided', 400);
    }

    if (!category) {
      return createErrorResponse('File category is required', 400);
    }

    const uploadResults = [];

    for (const file of files) {
      // Validate file
      const validationError = validateFileUpload(file);
      if (validationError) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: validationError
        });
        continue;
      }

      try {
        // Save file to storage
        const filePath = await saveFileToStorage(file);
        
        // Save file metadata to database
        const fileRecord = await saveFileToDatabase({
          name: file.name,
          size: file.size,
          type: file.type,
          category: category,
          filePath: filePath,
          uploadDate: new Date()
        });

        uploadResults.push({
          filename: file.name,
          success: true,
          fileId: fileRecord.id,
          dbId: fileRecord.dbId
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        uploadResults.push({
          filename: file.name,
          success: false,
          error: 'Failed to upload file'
        });
      }
    }

    return createSuccessResponse({
      results: uploadResults,
      totalFiles: files.length,
      successCount: uploadResults.filter(r => r.success).length
    }, 'File upload completed');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}