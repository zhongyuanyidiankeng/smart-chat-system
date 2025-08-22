import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, handleApiError, validateRequired } from '@/lib/api';
import { ChatMessage, ChatType } from '@/types';

// Temporary in-memory storage - replace with database in production
let chatSessions: any[] = [];

// Mock AI response generation
async function generateAIResponse(message: string, type: ChatType, sessionId: string): Promise<string> {
  // This is a mock implementation - replace with actual AI service calls
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
  
  switch (type) {
    case 'normal':
      return `Normal chat response to: "${message}"`;
    case 'rag':
      return `RAG-enhanced response with document context for: "${message}"`;
    case 'agent':
      return `Agent processing result for: "${message}"\n\nStep 1: Python script execution...\nStep 2: Data processing...\nStep 3: Analysis...\nStep 4: HTTP request to external service...`;
    default:
      return `Response to: "${message}"`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, type } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['sessionId', 'message', 'type']);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Find session (in production, this would be a database query)
    let session = chatSessions.find(s => s.id === sessionId);
    if (!session) {
      // Create session if it doesn't exist
      session = {
        id: sessionId,
        type,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      chatSessions.push(session);
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Add user message to session
    session.messages.push(userMessage);

    // Generate AI response
    const aiResponseContent = await generateAIResponse(message, type, sessionId);

    // Create AI response message
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: aiResponseContent,
      timestamp: new Date()
    };

    // Add AI message to session
    session.messages.push(aiMessage);
    session.updatedAt = new Date();

    return createSuccessResponse({
      userMessage,
      aiMessage,
      sessionId: session.id
    }, 'Message sent successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
    }

    // Find session messages
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) {
      return createSuccessResponse({
        messages: [],
        total: 0
      }, 'No messages found for session');
    }

    return createSuccessResponse({
      messages: session.messages,
      total: session.messages.length,
      sessionInfo: {
        id: session.id,
        type: session.type,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    }, 'Messages retrieved successfully');

  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}