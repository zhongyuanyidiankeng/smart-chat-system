import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// File storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

// Initialize upload directory
ensureUploadDir();

// File storage functions for server-side API
export async function saveFileToStorage(file: File): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await fs.writeFile(filePath, buffer);
  
  return fileName; // Return relative path for database storage
}

export async function getFileFromStorage(fileName: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (!existsSync(filePath)) {
      return null;
    }
    
    return await fs.readFile(filePath);
  } catch (error) {
    console.error('Error reading file from storage:', error);
    return null;
  }
}

export async function deleteFileFromStorage(fileName: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (!existsSync(filePath)) {
      return false;
    }
    
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    return false;
  }
}