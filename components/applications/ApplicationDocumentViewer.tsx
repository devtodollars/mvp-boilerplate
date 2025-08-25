"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  FileText,
  CreditCard,
  Briefcase,
  Receipt,
  Home,
  UserCheck,
  PoundSterling,
  Users,
  Zap,
  File,
  Download,
  Loader2,
  ShieldCheck
} from "lucide-react"
import { documentHelpers, DocumentType } from "@/schemas/documents"
import { createClient } from "@/utils/supabase/client"
import { DocumentEncryption } from "@/utils/encryption"

interface SharedDocumentInfo {
  filename: string
  documentType: DocumentType
  customName: string
  originalFilename?: string
  mimeType?: string
  size?: number
}

interface ApplicationDocumentViewerProps {
  applicationId: string
  sharedDocuments: SharedDocumentInfo[]
  applicantUserId: string
  className?: string
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

export function ApplicationDocumentViewer({
  applicationId,
  sharedDocuments,
  applicantUserId,
  className = ""
}: ApplicationDocumentViewerProps) {
  const { toast } = useToast()
  const [loadingDocuments, setLoadingDocuments] = useState<Set<string>>(new Set())

  const handleDocumentDownload = async (document: SharedDocumentInfo) => {
    const documentKey = document.filename
    setLoadingDocuments(prev => new Set(prev).add(documentKey))

    try {
      const supabase = createClient()
      
      // Download the file from storage
      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(`${applicantUserId}/${document.filename}`)

      if (error) {
        throw new Error(`Failed to access document: ${error.message}`)
      }

      let finalBlob = data
      let finalFilename = document.originalFilename || document.customName
      let finalMimeType = document.mimeType || 'application/octet-stream'

      // Check if document is encrypted
      if (document.filename.endsWith('.enc')) {
        try {
          const decryption = new DocumentEncryption()
          const decryptedData = await decryption.decryptDocument(data)
          finalBlob = decryptedData.blob
          finalFilename = decryptedData.filename
          finalMimeType = decryptedData.mimeType
        } catch (decryptError) {
          console.error('Decryption failed:', decryptError)
          throw new Error('Failed to decrypt document')
        }
      }

      // Use a more robust download method that works in all contexts
      if (typeof window !== 'undefined' && window.document) {
        const url = URL.createObjectURL(finalBlob)
        const link = window.document.createElement('a')
        link.href = url
        link.download = finalFilename
        link.style.display = 'none'
        
        // Append to body, click, and remove
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
        
        // Clean up the URL
        setTimeout(() => URL.revokeObjectURL(url), 100)

        toast({
          title: "Download Started",
          description: `Downloading ${document.customName}`,
          variant: "default",
        })
      } else {
        throw new Error('Download not supported in this environment')
      }

    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      })
    } finally {
      setLoadingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentKey)
        return newSet
      })
    }
  }

  if (!sharedDocuments.length) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No documents shared with this application</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Shared Documents
            </CardTitle>
            <CardDescription>
              {sharedDocuments.length} document{sharedDocuments.length !== 1 ? 's' : ''} shared by the applicant
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {sharedDocuments.map((document, index) => {
            const IconComponent = getDocumentIcon(document.documentType)
            const isLoading = loadingDocuments.has(document.filename)
            
            return (
              <div
                key={`${document.filename}-${index}`}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {document.customName}
                      </h4>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {documentHelpers.getDocumentTypeLabel(document.documentType)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {document.size && (
                        <span>{documentHelpers.formatFileSize(document.size)}</span>
                      )}
                      {document.filename.endsWith('.enc') && (
                        <div className="flex items-center gap-1 text-green-600">
                          <ShieldCheck className="h-3 w-3" />
                          <span className="text-xs">Encrypted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDocumentDownload(document)}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}