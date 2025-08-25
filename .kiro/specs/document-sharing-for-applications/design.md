# Document Sharing for Property Applications - Design

## Overview

This design extends the existing encrypted document upload system to enable secure document sharing during property applications. The system maintains end-to-end encryption while allowing landlords to access tenant-selected documents through a secure sharing mechanism.

## Architecture

### High-Level Flow
1. **Document Selection**: User selects documents in application dialog
2. **Secure Sharing**: System creates encrypted sharing tokens
3. **Access Control**: Landlords access documents through secure links
4. **Audit Trail**: All access is logged for security

### Component Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │   Document       │    │   Landlord      │
│   Dialog        │───▶│   Sharing        │───▶│   Dashboard     │
│                 │    │   Service        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Document      │    │   Access         │    │   Document      │
│   Selection     │    │   Control        │    │   Viewer        │
│   Component     │    │   System         │    │   Component     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. DocumentSelectionDialog Component
**Location**: `components/applications/DocumentSelectionDialog.tsx`

**Props**:
```typescript
interface DocumentSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (selectedDocuments: string[], applicationData: any) => void
  listingId: string
  userDocuments: StoredDocument[]
  loading?: boolean
}
```

**Features**:
- Displays user's uploaded documents with checkboxes
- Shows document type, name, and encryption status
- Provides application form fields (notes, etc.)
- Handles document selection state
- Integrates with existing application submission

### 2. SharedDocumentViewer Component
**Location**: `components/applications/SharedDocumentViewer.tsx`

**Props**:
```typescript
interface SharedDocumentViewerProps {
  applicationId: string
  sharedDocuments: SharedDocument[]
  canAccess: boolean
  onDocumentAccess: (documentId: string) => void
}
```

**Features**:
- Displays shared documents for landlords
- Handles secure document decryption
- Provides download functionality
- Shows access permissions and expiry

### 3. DocumentSharingService
**Location**: `utils/documentSharing.ts`

**Functions**:
```typescript
class DocumentSharingService {
  static async shareDocuments(
    applicationId: string,
    documentIds: string[],
    landlordId: string
  ): Promise<SharedDocument[]>
  
  static async getSharedDocuments(
    applicationId: string,
    userId: string
  ): Promise<SharedDocument[]>
  
  static async accessSharedDocument(
    shareId: string,
    userId: string
  ): Promise<DecryptedDocument>
  
  static async revokeDocumentAccess(
    applicationId: string,
    documentIds?: string[]
  ): Promise<void>
}
```

## Data Models

### SharedDocument Schema
```typescript
interface SharedDocument {
  id: string
  application_id: string
  document_name: string // From user-documents storage
  document_type: DocumentType
  custom_name: string
  shared_by: string // User ID
  shared_with: string // Landlord ID
  access_token: string // Encrypted access token
  expires_at: string
  created_at: string
  accessed_at?: string
  access_count: number
}
```

### DocumentAccessLog Schema
```typescript
interface DocumentAccessLog {
  id: string
  shared_document_id: string
  accessed_by: string
  accessed_at: string
  ip_address?: string
  user_agent?: string
  action: 'view' | 'download' | 'preview'
}
```

### Database Tables

#### shared_documents
```sql
CREATE TABLE shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL, -- Storage filename
  document_type TEXT NOT NULL,
  custom_name TEXT NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_with UUID NOT NULL REFERENCES auth.users(id),
  access_token TEXT NOT NULL, -- Encrypted token for secure access
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(application_id, document_name)
);
```

#### document_access_logs
```sql
CREATE TABLE document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_document_id UUID NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'preview'))
);
```

## Error Handling

### Document Access Errors
- **Expired Access**: Show message with option to request renewed access
- **Insufficient Permissions**: Clear error message about access rights
- **Decryption Failures**: Graceful fallback with retry option
- **Network Issues**: Offline support with cached document metadata

### User Experience Errors
- **No Documents**: Guide user to upload documents first
- **Selection Validation**: Require at least one document or allow none
- **Large File Handling**: Progress indicators for large document operations

## Testing Strategy

### Unit Tests
- Document selection logic
- Encryption/decryption functions
- Access token generation and validation
- Permission checking functions

### Integration Tests
- End-to-end application flow with document sharing
- Document access from landlord perspective
- Access expiration and cleanup
- Audit log generation

### Security Tests
- Access token security
- Permission boundary testing
- Encryption key handling
- Cross-user access prevention

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load document metadata first, content on demand
- **Caching**: Cache decrypted documents temporarily in memory
- **Batch Operations**: Handle multiple document operations efficiently
- **Progressive Enhancement**: Core functionality works without JavaScript

### Scalability
- **Database Indexing**: Optimize queries for shared documents
- **Storage Efficiency**: Avoid duplicate document storage
- **Access Token Management**: Efficient token generation and validation
- **Cleanup Jobs**: Automated cleanup of expired access tokens

## Security Implementation

### Access Control
- **Time-based Expiration**: All shared access expires after 30 days
- **User-specific Tokens**: Each access token tied to specific user
- **Audit Trail**: Complete logging of all document access
- **Revocation**: Immediate access revocation when needed

### Encryption Maintenance
- **Key Preservation**: Original encryption keys remain with document owner
- **Secure Transmission**: All document data encrypted in transit
- **Client-side Decryption**: Documents decrypted in browser, not server
- **No Plaintext Storage**: No unencrypted document content stored

## Integration Points

### Existing Systems
- **Document Upload**: Extends existing DocumentUpload component
- **Application System**: Integrates with current application flow
- **User Authentication**: Uses existing auth system
- **Storage System**: Works with current Supabase storage setup

### API Extensions
- **Supabase API**: New functions for document sharing
- **Storage API**: Enhanced access control for shared documents
- **Notification System**: Alerts for document access events
- **Audit System**: Logging integration for compliance