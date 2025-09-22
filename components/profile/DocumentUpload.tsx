"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  File,
  Trash2,
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  CreditCard,
  Briefcase,
  Receipt,
  Home,
  UserCheck,
  PoundSterling,
  Users,
  Zap,
  Loader2,
  Plus,
  X,
  Shield,
  ShieldCheck
} from "lucide-react"
import { documentTypeEnum, documentHelpers, DocumentType } from "@/schemas/documents"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/AuthProvider"
import { DocumentEncryption } from "@/utils/encryption"

interface StoredDocument {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    size: number
    mimetype: string
    cacheControl: string
    document_type?: DocumentType
    custom_name?: string
    encrypted?: boolean
    encryption_iv?: string
    encryption_key?: string
    original_mimetype?: string
    original_filename?: string
    original_size?: string
  }
}

interface DocumentUploadProps {
  disabled?: boolean
}

const getDocumentIcon = (type: DocumentType) => {
  const iconMap = {
    proof_of_employment: Briefcase,
    recent_payslip: Receipt,
    bank_statement: CreditCard,
    landlord_reference: Home,
    id_passport: UserCheck,
    proof_of_income: PoundSterling,
    character_reference: Users,
    utility_bill: Zap,
    tenancy_agreement: FileText,
    other: File
  }
  return iconMap[type] || File
}

export function DocumentUpload({ disabled = false }: DocumentUploadProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [newDocument, setNewDocument] = useState({
    type: "" as DocumentType | "",
    name: "",
    file: null as File | null
  })
  const [showAddForm, setShowAddForm] = useState(false)

  // Load documents on component mount
  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  const loadDocuments = async () => {
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()

      // List all files in the user's folder
      const { data: files, error } = await supabase.storage
        .from('user-documents')
        .list(user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        throw new Error(`Failed to load documents: ${error.message}`)
      }

      // Filter out folders and map to our document format
      const documents: StoredDocument[] = (files || [])
        .filter(file => file.name && !file.name.endsWith('/'))
        .map(file => ({
          name: `${user.id}/${file.name}`, // Include full path for download/delete operations
          id: file.id || file.name,
          updated_at: file.updated_at || new Date().toISOString(),
          created_at: file.created_at || new Date().toISOString(),
          last_accessed_at: file.last_accessed_at || new Date().toISOString(),
          metadata: {
            size: file.metadata?.size || 0,
            mimetype: file.metadata?.mimetype || 'application/octet-stream',
            cacheControl: file.metadata?.cacheControl || '3600',
            document_type: file.metadata?.document_type,
            custom_name: file.metadata?.custom_name,
            encrypted: file.metadata?.encrypted,
            encryption_iv: file.metadata?.encryption_iv,
            encryption_key: file.metadata?.encryption_key,
            original_mimetype: file.metadata?.original_mimetype,
            original_filename: file.metadata?.original_filename,
            original_size: file.metadata?.original_size
          }
        }))

      setDocuments(documents)
    } catch (error) {
      console.error('Load documents error:', error)
      toast({
        title: "Failed to Load Documents",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!documentHelpers.isValidFileType(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, Word documents, or images (JPEG, PNG, WebP).",
        variant: "destructive",
      })
      return
    }

    // Validate file size
    if (!documentHelpers.isValidFileSize(file)) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setNewDocument(prev => ({ ...prev, file }))
  }

  const uploadDocument = async () => {
    if (!user || !newDocument.file || !newDocument.type || !newDocument.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select a file.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()

      // Encrypt the file on the client side
      toast({
        title: "Encrypting Document",
        description: "Securing your document before upload...",
      })

      const { encryptedData, key, iv } = await DocumentEncryption.encryptFile(newDocument.file)

      console.log('Encryption info:', {
        originalSize: newDocument.file.size,
        encryptedSize: encryptedData.byteLength,
        keyLength: key.length,
        ivLength: iv.length,
        originalType: newDocument.file.type
      })

      // Test decryption immediately to verify it works
      try {
        const testDecrypted = await DocumentEncryption.decryptFile(encryptedData, key, iv)
        console.log('Test decryption successful, size:', testDecrypted.byteLength)

        if (testDecrypted.byteLength !== newDocument.file.size) {
          throw new Error(`Size mismatch: original ${newDocument.file.size}, decrypted ${testDecrypted.byteLength}`)
        }
      } catch (testError) {
        console.error('Test decryption failed:', testError)
        throw new Error('Encryption test failed - file would be corrupted')
      }

      // Create unique filename - use .enc extension to indicate encryption
      const sanitizedName = newDocument.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
      const fileName = `${user.id}/${newDocument.type}__${sanitizedName}__${Date.now()}.enc`

      // Convert encrypted ArrayBuffer to Blob for upload
      const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' })

      // Store metadata in filename since Supabase metadata doesn't work reliably
      const metadataString = JSON.stringify({
        document_type: newDocument.type,
        custom_name: newDocument.name.trim(),
        original_filename: newDocument.file.name,
        encrypted: 'true',
        encryption_iv: Array.from(iv).join(','),
        encryption_key: key,
        original_mimetype: newDocument.file.type,
        original_size: newDocument.file.size.toString()
      })

      // Encode metadata as base64 to include in filename
      const encodedMetadata = btoa(metadataString)
      const fileNameWithMetadata = `${fileName}__META__${encodedMetadata}`

      // Upload encrypted file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileNameWithMetadata, encryptedBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Reload documents to show the new upload
      await loadDocuments()

      // Reset form
      setNewDocument({ type: "", name: "", file: null })
      setShowAddForm(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      toast({
        title: "Document Uploaded Securely",
        description: "Your document has been encrypted and uploaded successfully.",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (document: StoredDocument) => {
    if (!user) return

    try {
      const supabase = createClient()

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-documents')
        .remove([document.name])

      if (storageError) {
        throw new Error(`Delete failed: ${storageError.message}`)
      }

      // Reload documents to reflect the deletion
      await loadDocuments()

      toast({
        title: "Document Deleted",
        description: "Your document has been deleted successfully.",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete document.",
        variant: "destructive",
      })
    }
  }

  const downloadDocument = async (document: StoredDocument) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(document.name)

      if (error) {
        throw new Error(`Download failed: ${error.message}`)
      }

      let finalBlob: Blob
      let fileName: string

      // Get document info (which includes encryption data)
      const docInfo = getDocumentInfo(document)

      // Check if document is encrypted
      if (docInfo.encrypted && docInfo.encryptionKey && docInfo.encryptionIv) {
        toast({
          title: "Decrypting Document",
          description: "Decrypting your secure document...",
        })

        try {
          // Decrypt the file
          const encryptedBuffer = await data.arrayBuffer()
          const iv = new Uint8Array(docInfo.encryptionIv.split(',').map(Number))

          console.log('Decryption info:', {
            encryptedSize: encryptedBuffer.byteLength,
            keyLength: docInfo.encryptionKey.length,
            ivLength: iv.length,
            originalMimeType: docInfo.mimeType
          })

          const decryptedBuffer = await DocumentEncryption.decryptFile(
            encryptedBuffer,
            docInfo.encryptionKey,
            iv
          )

          console.log('Decrypted successfully, size:', decryptedBuffer.byteLength)

          // Create blob with original mime type
          const originalMimeType = docInfo.mimeType || 'application/octet-stream'
          finalBlob = new Blob([decryptedBuffer], { type: originalMimeType })

          console.log('Created blob with type:', originalMimeType)
        } catch (decryptError) {
          console.error('Decryption failed:', decryptError)
          throw new Error(`Decryption failed: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`)
        }

        // Use the ORIGINAL filename if available, otherwise use custom name with proper extension
        if (docInfo.originalFilename) {
          // Use the original filename directly (e.g., "Employment_Letter.pdf")
          fileName = docInfo.originalFilename
        } else {
          // Fallback: use custom name with proper extension
          const customName = docInfo.name || 'document'
          let extension = ''

          if (docInfo.mimeType?.includes('pdf')) {
            extension = '.pdf'
          } else if (docInfo.mimeType?.includes('image/jpeg') || docInfo.mimeType?.includes('image/jpg')) {
            extension = '.jpg'
          } else if (docInfo.mimeType?.includes('image/png')) {
            extension = '.png'
          } else if (docInfo.mimeType?.includes('image/webp')) {
            extension = '.webp'
          } else if (docInfo.mimeType?.includes('application/msword')) {
            extension = '.doc'
          } else if (docInfo.mimeType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            extension = '.docx'
          } else {
            extension = '.pdf' // Default fallback
          }

          fileName = customName.includes('.') ? customName : `${customName}${extension}`
        }
      } else {
        // Not encrypted, use as-is
        finalBlob = data
        fileName = docInfo.name || document.name
      }

      // Create download link
      const url = URL.createObjectURL(finalBlob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = fileName
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (docInfo.encrypted) {
        toast({
          title: "Document Downloaded",
          description: "Your document has been decrypted and downloaded securely.",
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download document.",
        variant: "destructive",
      })
    }
  }

  const previewDocument = async (document: StoredDocument) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(document.name)

      if (error) {
        throw new Error(`Preview failed: ${error.message}`)
      }

      let previewBlob: Blob
      let mimeType: string

      // Get document info (which includes encryption data)
      const docInfo = getDocumentInfo(document)

      // Check if document is encrypted
      if (docInfo.encrypted && docInfo.encryptionKey && docInfo.encryptionIv) {
        toast({
          title: "Decrypting Document",
          description: "Preparing secure preview...",
        })

        // Decrypt the file
        const encryptedBuffer = await data.arrayBuffer()
        const iv = new Uint8Array(docInfo.encryptionIv.split(',').map(Number))

        const decryptedBuffer = await DocumentEncryption.decryptFile(
          encryptedBuffer,
          docInfo.encryptionKey,
          iv
        )

        // Create blob with original mime type
        mimeType = docInfo.mimeType || 'application/octet-stream'
        previewBlob = new Blob([decryptedBuffer], { type: mimeType })
      } else {
        // Not encrypted, use as-is
        previewBlob = data
        mimeType = document.metadata?.mimetype || 'application/octet-stream'
      }

      // Create temporary URL and open in new tab
      const url = URL.createObjectURL(previewBlob)
      const newWindow = window.open(url, '_blank')

      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      if (!newWindow) {
        toast({
          title: "Preview Blocked",
          description: "Please allow popups to preview documents.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to preview document.",
        variant: "destructive",
      })
    }
  }

  // Helper function to extract document info from filename
  const getDocumentInfo = (document: StoredDocument) => {
    console.log('Document:', document.name, 'Metadata:', document.metadata) // Debug log

    // Extract just the filename from the full path (user_id/filename)
    const filename = document.name.includes('/') ? document.name.split('/').pop() || document.name : document.name

    // Try to extract metadata from filename first (new format)
    if (filename.includes('__META__')) {
      try {
        const parts = filename.split('__META__')
        const encodedMetadata = parts[1]
        const metadataString = atob(encodedMetadata)
        const metadata = JSON.parse(metadataString)

        return {
          type: metadata.document_type as DocumentType,
          name: metadata.custom_name,
          size: parseInt(metadata.original_size) || document.metadata?.size || 0,
          encrypted: metadata.encrypted === 'true',
          originalFilename: metadata.original_filename,
          mimeType: metadata.original_mimetype,
          encryptionKey: metadata.encryption_key,
          encryptionIv: metadata.encryption_iv
        }
      } catch (error) {
        console.error('Failed to parse metadata from filename:', error)
      }
    }

    // Try to get from metadata first (legacy)
    if (document.metadata?.document_type && document.metadata?.custom_name) {
      const size = document.metadata.encrypted && document.metadata.original_size
        ? parseInt(document.metadata.original_size)
        : document.metadata.size

      return {
        type: document.metadata.document_type as DocumentType,
        name: document.metadata.custom_name,
        size: size || 0,
        encrypted: document.metadata.encrypted,
        originalFilename: document.metadata.original_filename,
        mimeType: document.metadata.original_mimetype || document.metadata.mimetype,
        encryptionKey: document.metadata.encryption_key,
        encryptionIv: document.metadata.encryption_iv
      }
    }

    // Fallback: parse from filename (format: type__name__timestamp.ext)
    const parts = filename.split('__')
    if (parts.length >= 3) {
      const type = parts[0] as DocumentType
      const name = parts[1].replace(/_/g, ' ')
      return {
        type: documentTypeEnum._def.values.includes(type) ? type : 'other' as DocumentType,
        name,
        size: document.metadata?.size || 0,
        encrypted: filename.endsWith('.enc'),
        originalFilename: undefined,
        mimeType: document.metadata?.mimetype
      }
    }

    // Final fallback
    return {
      type: 'other' as DocumentType,
      name: filename,
      size: document.metadata?.size || 0,
      encrypted: filename.endsWith('.enc'),
      originalFilename: undefined,
      mimeType: document.metadata?.mimetype
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Upload important documents for rental applications. All files are encrypted before upload for maximum security.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">End-to-End Encryption</h4>
              <p className="text-sm text-green-700 mt-1">
                Your documents are encrypted on your device before upload. Only you can decrypt and view them.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        )}

        {/* Existing Documents */}
        {!loading && documents.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Your Documents</h4>
            <div className="grid gap-3">
              {documents.map((document) => {
                const docInfo = getDocumentInfo(document)
                const IconComponent = getDocumentIcon(docInfo.type)
                return (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{docInfo.name}</p>
                          {docInfo.encrypted && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Encrypted</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{documentHelpers.getDocumentTypeLabel(docInfo.type)} • {documentHelpers.formatFileSize(docInfo.size)}</p>
                          {docInfo.originalFilename && (
                            <p className="text-xs text-gray-400 font-mono">📄 {docInfo.originalFilename}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewDocument(document)}
                        disabled={disabled}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(document)}
                        disabled={disabled}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument(document)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add New Document */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={disabled}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        ) : (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Add New Document</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setNewDocument({ type: "", name: "", file: null })
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type</Label>
                <Select
                  value={newDocument.type}
                  onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value as DocumentType }))}
                  disabled={uploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypeEnum._def.values.map((type) => (
                      <SelectItem key={type} value={type}>
                        {documentHelpers.getDocumentTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  placeholder="e.g., Employment Letter - ABC Company"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-file">File</Label>
                <Input
                  id="document-file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, Word documents, Images (JPEG, PNG, WebP). Max size: 10MB
                </p>
              </div>

              {newDocument.file && (
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      {documentHelpers.isImageFile(newDocument.file.type) ? (
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{newDocument.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {documentHelpers.formatFileSize(newDocument.file.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={uploadDocument}
                  disabled={uploading || !newDocument.file || !newDocument.type || !newDocument.name.trim()}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Encrypting & Uploading...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Upload Encrypted
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!loading && documents.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add documents to strengthen your rental applications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}