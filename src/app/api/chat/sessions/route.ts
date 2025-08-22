import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError, validateRequired } from '@/lib/api';
import { ChatSession, ChatType } from '@/types';

// Temporary in-memory storage - replace with database in production
let chatSessions: ChatSession[] = [];
let nextSessionId = 1;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session
      const session = chatSessions.find(s => s.id === sessionId);
      if (!session) {
        return createErrorResponse('Session not found', 404);
      }
      return createSuccessResponse(session, 'Session retrieved successfully');
    } else {
      // Get all sessions
      return createSuccessResponse({
        sessions: chatSessions,
        total: chatSessions.length
      }, 'Sessions retrieved successfully');
    }

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'type']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Validate chat type
    const validTypes: ChatType[] = ['normal', 'rag', 'agent'];
    if (!validTypes.includes(type)) {
      return createErrorResponse('Invalid chat type', 400);
    }

    // Create new session
    const newSession: ChatSession = {
      id: `session_${nextSessionId++}`,
      title: name, // Use name as title for compatibility
      name, // Also include name for API compatibility
      type,
      mode: type, // Map type to mode for backward compatibility
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      updatedAt: new Date()
    };

    chatSessions.push(newSession);

    return createSuccessResponse(newSession, 'Session created successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, name } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['sessionId']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Find and update session
    const sessionIndex = chatSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return createErrorResponse('Session not found', 404);
    }

    if (name) {
      chatSessions[sessionIndex].title = name; // Update title for backward compatibility
      chatSessions[sessionIndex].name = name; // Update name for API compatibility
      chatSessions[sessionIndex].updatedAt = new Date();
    }

    return createSuccessResponse(
      chatSessions[sessionIndex],
      'Session updated successfully'
    );

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
    }

    // Find and delete session
    const sessionIndex = chatSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return createErrorResponse('Session not found', 404);
    }

    chatSessions.splice(sessionIndex, 1);

    return createSuccessResponse(
      { sessionId },
      'Session deleted successfully'
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}