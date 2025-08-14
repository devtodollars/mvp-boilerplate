import { z } from "zod"

// Document types enum for rental applications
export const documentTypeEnum = z.enum([
  "proof_of_employment",
  "recent_payslip", 
  "bank_statement",
  "landlord_reference",
  "id_passport",
  "proof_of_income",
  "character_reference",
  "utility_bill",
  "tenancy_agreement",
  "other"
])

export type DocumentType = z.infer<typeof documentTypeEnum>

// Document schema
export const documentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  document_type: documentTypeEnum,
  custom_name: z.string().min(1, "Document name is required").max(100),
  file_name: z.string().min(1, "File name is required"),
  file_path: z.string().min(1, "File path is required"),
  file_size: z.number().positive("File size must be positive"),
  mime_type: z.string().min(1, "MIME type is required"),
  uploaded_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Document upload schema (for new uploads)
export const documentUploadSchema = z.object({
  document_type: documentTypeEnum,
  custom_name: z.string().min(1, "Document name is required").max(100),
  file: z.any(), // File object from browser
})

// Document update schema (for updating metadata)
export const documentUpdateSchema = z.object({
  document_type: documentTypeEnum.optional(),
  custom_name: z.string().min(1, "Document name is required").max(100).optional(),
})

// Export types
export type Document = z.infer<typeof documentSchema>
export type DocumentUpload = z.infer<typeof documentUploadSchema>
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>

// Helper functions
export const documentHelpers = {
  // Get display name for document type
  getDocumentTypeLabel: (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      proof_of_employment: "Proof of Employment",
      recent_payslip: "Recent Payslip",
      bank_statement: "Bank Statement", 
      landlord_reference: "Landlord Reference",
      id_passport: "ID/Passport",
      proof_of_income: "Proof of Income",
      character_reference: "Character Reference",
      utility_bill: "Utility Bill",
      tenancy_agreement: "Tenancy Agreement",
      other: "Other Document"
    }
    return labels[type]
  },

  // Get icon for document type
  getDocumentTypeIcon: (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
      proof_of_employment: "briefcase",
      recent_payslip: "receipt",
      bank_statement: "credit-card",
      landlord_reference: "home",
      id_passport: "user-check",
      proof_of_income: "pound-sterling",
      character_reference: "users",
      utility_bill: "zap",
      tenancy_agreement: "file-text",
      other: "file"
    }
    return icons[type]
  },

  // Validate file type
  isValidFileType: (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    return allowedTypes.includes(file.type)
  },

  // Validate file size (max 10MB)
  isValidFileSize: (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    return file.size <= maxSize
  },

  // Format file size for display
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Get file extension from filename
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || ''
  },

  // Check if file is an image
  isImageFile: (mimeType: string): boolean => {
    return mimeType.startsWith('image/')
  },

  // Check if file is a PDF
  isPdfFile: (mimeType: string): boolean => {
    return mimeType === 'application/pdf'
  }
}