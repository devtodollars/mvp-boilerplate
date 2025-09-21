"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { 
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
  File,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Upload
} from "lucide-react"
import { documentHelpers, DocumentType, documentTypeEnum } from "@/schemas/documents"
import { DocumentSharingService, SharedDocumentInfo } from "@/utils/documentSharing"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/AuthProvider"
import Link from "next/link"

// Interface for stored documents (from DocumentUpload component)
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
    encrypted?: string
    encryption_iv?: string
    encryption_key?: string
    original_mimetype?: string
    original_filename?: string
    original_size?: string
  }
}

interface DocumentSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (selectedDocuments: SharedDocumentInfo[], applicationData: ApplicationData) => void
  listingId: string
  landlordId: string
  propertyName: string
  loading?: boolean
}

interface ApplicationData {
  message: string
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

export function DocumentSelectionDialog({
  isOpen,
  onClose,
  onSubmit,
  listingId,
  landlordId,
  propertyName,
  loading = false
}: DocumentSelectionDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [userDocuments, setUserDocuments] = useState<StoredDocument[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    message: ""
  })

  // Load user's documents when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserDocuments()
    }
  }, [isOpen, user])

  const loadUserDocuments = async () => {
    if (!user) return
    
    setLoadingDocuments(true)
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

      setUserDocuments(documents)
    } catch (error) {
      console.error('Load documents error:', error)
      toast({
        title: "Failed to Load Documents",
        description: error instanceof Error ? error.message : "Please try refreshing the page.",
        variant: "destructive",
      })
      setUserDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  // Helper function to extract document info from filename
  const getDocumentInfo = (document: StoredDocument) => {
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
          mimeType: metadata.original_mimetype
        }
      } catch (error) {
        console.error('Failed to parse metadata from filename:', error)
      }
    }
    
    // Try to get from Supabase metadata (legacy)
    if (document.metadata?.document_type && document.metadata?.custom_name) {
      const size = document.metadata.encrypted === 'true' && document.metadata.original_size
        ? parseInt(document.metadata.original_size)
        : document.metadata.size

      return {
        type: document.metadata.document_type as DocumentType,
        name: document.metadata.custom_name,
        size: size || 0,
        encrypted: document.metadata.encrypted === 'true',
        originalFilename: document.metadata.original_filename,
        mimeType: document.metadata.original_mimetype || document.metadata.mimetype
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

  const handleDocumentToggle = (documentName: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments)
    if (checked) {
      newSelected.add(documentName)
    } else {
      newSelected.delete(documentName)
    }
    setSelectedDocuments(newSelected)
  }

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit an application.",
        variant: "destructive",
      })
      return
    }

    // Prepare selected documents for sharing
    const documentsToShare: SharedDocumentInfo[] = Array.from(selectedDocuments).map(documentName => {
      const document = userDocuments.find(doc => doc.name === documentName)
      if (!document) {
        throw new Error(`Document ${documentName} not found`)
      }
      
      const docInfo = getDocumentInfo(document)
      return {
        filename: document.name,
        documentType: docInfo.type,
        customName: docInfo.name,
        originalFilename: docInfo.originalFilename,
        mimeType: docInfo.mimeType,
        size: docInfo.size
      }
    })

    onSubmit(documentsToShare, applicationData)
  }

  const handleClose = () => {
    setSelectedDocuments(new Set())
    setApplicationData({ message: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Apply to {propertyName}
          </DialogTitle>
          <DialogDescription>
            Select documents to share with the landlord and add a personal message to strengthen your application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
              <CardDescription>
                Add a personal message for the landlord.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Application Message</Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain why you'd be a great tenant. Include any additional information you'd like to share..."
                  value={applicationData.message}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Select Documents to Share</CardTitle>
                  <CardDescription>
                    Choose which documents you want to share with the landlord. All documents remain encrypted and secure.
                  </CardDescription>
                </div>
                {selectedDocuments.size > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading your documents...</span>
                </div>
              ) : userDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Available</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      You haven't uploaded any documents yet. Please upload documents like proof of employment, 
                      payslips, or references in your profile to strengthen your application.
                    </p>
                    <Link href="/account/profile">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go to Profile & Upload Documents
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {userDocuments.map((document) => {
                    const docInfo = getDocumentInfo(document)
                    const IconComponent = getDocumentIcon(docInfo.type)
                    const isSelected = selectedDocuments.has(document.name)
                    
                    return (
                      <div
                        key={document.id}
                        className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                          isSelected 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          id={document.name}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleDocumentToggle(document.name, checked as boolean)}
                          disabled={loading}
                        />
                        
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={document.name} 
                              className="font-medium text-gray-900 cursor-pointer"
                            >
                              {docInfo.name}
                            </Label>
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
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Your Documents Stay Secure</h4>
                <p className="text-sm text-green-700 mt-1">
                  All shared documents remain encrypted and can only be accessed by the landlord for this specific application. 
                  Access automatically expires after 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !applicationData.message.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                Submit Application
                {selectedDocuments.size > 0 && (
                  <span className="ml-1">({selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''})</span>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}