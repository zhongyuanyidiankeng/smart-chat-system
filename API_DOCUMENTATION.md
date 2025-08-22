# Smart Chat System API Documentation

This document describes the REST API endpoints for the Smart Chat System when deployed to a server.

## Configuration

### Environment Variables

```bash
# Enable API mode
NEXT_PUBLIC_USE_API=true

# API Base URL (optional, defaults to same origin)
NEXT_PUBLIC_API_URL=https://your-domain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_system
DB_USER=postgres
DB_PASSWORD=your_password

# File Upload Directory
UPLOAD_DIR=./uploads
```

## File Management API

### Upload Files
**POST** `/api/files/upload`

Upload one or more files with business category assignment.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `files`: File[] - Array of files to upload
  - `category`: FileCategory - Business category (document, image, video, audio, code, archive)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "filename": "document.pdf",
        "success": true,
        "fileId": "file_123456789",
        "dbId": 1
      }
    ],
    "totalFiles": 1,
    "successCount": 1
  },
  "message": "File upload completed"
}
```

### Get Files List
**GET** `/api/files`

Retrieve list of uploaded files with optional filtering.

**Query Parameters:**
- `category`: string (optional) - Filter by business category
- `search`: string (optional) - Search in file names
- `sortBy`: 'name' | 'uploadDate' | 'size' (optional, default: 'uploadDate')
- `sortOrder`: 'asc' | 'desc' (optional, default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_123456789",
        "dbId": 1,
        "name": "document.pdf",
        "size": 1024000,
        "type": "application/pdf",
        "category": "document",
        "uploadDate": "2024-01-01T12:00:00Z",
        "status": "completed"
      }
    ],
    "total": 1
  }
}
```

### Delete File
**DELETE** `/api/files/{fileId}`

Delete a file from both database and storage.

**Parameters:**
- `fileId`: string - File ID to delete

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123456789"
  },
  "message": "File deleted successfully"
}
```

### Download File
**GET** `/api/files/{fileId}/download`

Download a file by its ID.

**Parameters:**
- `fileId`: string - File ID to download

**Response:**
- Content-Type: File's MIME type
- Content-Disposition: attachment; filename="original_filename"
- Binary file data

## Chat Management API

### Get Chat Sessions
**GET** `/api/chat/sessions`

Retrieve all chat sessions.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_123",
        "name": "Chat 1",
        "type": "normal",
        "messages": [],
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### Create Chat Session
**POST** `/api/chat/sessions`

Create a new chat session.

**Request:**
```json
{
  "name": "Chat Session Name",
  "type": "normal" // "normal" | "rag" | "agent"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session_123",
    "name": "Chat Session Name",
    "type": "normal",
    "messages": [],
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### Update Chat Session
**PUT** `/api/chat/sessions`

Update an existing chat session.

**Request:**
```json
{
  "sessionId": "session_123",
  "name": "Updated Session Name"
}
```

### Delete Chat Session
**DELETE** `/api/chat/sessions?sessionId={sessionId}`

Delete a chat session.

**Parameters:**
- `sessionId`: string - Session ID to delete

### Send Message
**POST** `/api/chat/messages`

Send a message and get AI response.

**Request:**
```json
{
  "sessionId": "session_123",
  "message": "Hello, how are you?",
  "type": "normal" // "normal" | "rag" | "agent"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "msg_user_123",
      "role": "user",
      "content": "Hello, how are you?",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    "aiMessage": {
      "id": "msg_ai_123",
      "role": "assistant", 
      "content": "Hello! I'm doing well, thank you for asking.",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    "sessionId": "session_123"
  }
}
```

### Get Messages
**GET** `/api/chat/messages?sessionId={sessionId}`

Retrieve messages for a specific session.

**Parameters:**
- `sessionId`: string - Session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "role": "user",
        "content": "Hello",
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 1,
    "sessionInfo": {
      "id": "session_123",
      "type": "normal",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server-side error

## Client-Side Usage

The system automatically switches between local and API modes based on the `NEXT_PUBLIC_USE_API` environment variable:

```typescript
// Automatically uses API or local storage based on configuration
const { files, uploadFiles, deleteFile } = useFileUpload();
const { sendMessage, createSession } = useChat();
```

## Deployment Notes

1. **Database Setup**: Ensure PostgreSQL is configured and accessible
2. **File Storage**: Create upload directory with proper permissions
3. **Environment Variables**: Configure all required environment variables
4. **CORS**: API routes include CORS headers for cross-origin requests
5. **Error Handling**: All endpoints include comprehensive error handling and logging

## Development vs Production

**Development Mode** (`NEXT_PUBLIC_USE_API=false`):
- Uses local storage and mock database
- No actual file system operations
- Simulated API responses

**Production Mode** (`NEXT_PUBLIC_USE_API=true`):
- Uses actual API endpoints
- PostgreSQL database integration
- Real file upload/download operations
- Server-side processing