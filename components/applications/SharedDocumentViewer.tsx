"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Download,
  Eye,
  Loader2,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { documentHelpers, DocumentType } from "@/schemas/documents"
import { DocumentSharingService, SharedDocument } from "@/utils/documentSharing"
import { useAuth } from "@/components/providers/AuthProvider"
import { format } from "date-fns"

interface SharedDocumentViewerProps {
  applicationId: string
  sharedDocuments: SharedDocument[]
  canAccess: boolean
  onDocumentAccess?: (documentId: string) => void
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

export function SharedDocumentViewer({
  applicationId,
  sharedDocuments,
  canAccess,
  onDocumentAccess,
  className = ""
}: SharedDocumentViewerProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [loadingDocuments, setLoadingDocuments] = useState<Set<string>>(new Set())

  const handleDocumentAccess = async (sharedDocument: SharedDocument, action: 'view' | 'download' | 'preview') => {
    if (!user || !canAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this document.",
        variant: "destructive",
      })
      return
    }

    // Check if document access has expired
    if (new Date(sharedDocument.expires_at) < new Date()) {
      toast({
        title: "Access Expired",
        description: "This document access has expired.",
        variant: "destructive",
      })
      return
    }

    setLoadingDocuments(prev => new Set(prev).add(sharedDocument.id))

    try {
      const decryptedDocument = await DocumentSharingService.accessSharedDocument(
        user.id,
        sharedDocument.document_name
      )

      // Call the callback if provided
      onDocumentAccess?.(sharedDocument.id)

      if (action === 'download') {
        // Create download link
        const url = URL.createObjectURL(decryptedDocument.blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = decryptedDocument.filename
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Document Downloaded",
          description: `${decryptedDocument.filename} has been downloaded successfully.`,
        })
      } else if (action === 'preview' || action === 'view') {
        // Create temporary URL and open in new tab
        const url = URL.createObjectURL(decryptedDocument.blob)
        const newWindow = window.open(url, '_blank')
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)

        if (!newWindow) {
          toast({
            title: "Preview Blocked",
            description: "Please allow popups to preview documents.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Document Opened",
            description: `${decryptedDocument.filename} opened in a new tab.`,
          })
        }
      }

    } catch (error) {
      console.error('Document access error:', error)
      toast({
        title: "Access Failed",
        description: error instanceof Error ? error.message : "Failed to access document.",
        variant: "destructive",
      })
    } finally {
      setLoadingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(sharedDocument.id)
        return newSet
      })
    }
  }

  const getExpirationStatus = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt)
    
    // Check if the date is valid
    if (isNaN(expirationDate.getTime())) {
      return { status: 'unknown', text: 'No expiration', color: 'bg-gray-100 text-gray-700' }
    }
    
    const now = new Date()
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiration < 0) {
      return { status: 'expired', text: 'Expired', color: 'bg-red-100 text-red-700' }
    } else if (daysUntilExpiration <= 3) {
      return { status: 'expiring', text: `Expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`, color: 'bg-amber-100 text-amber-700' }
    } else {
      return { status: 'active', text: `Expires ${format(expirationDate, 'MMM d, yyyy')}`, color: 'bg-green-100 text-green-700' }
    }
  }

  if (!sharedDocuments.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-2">No Documents Shared</h3>
            <p className="text-sm text-gray-600">
              The applicant hasn't shared any documents with this application.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Shared Documents
            </CardTitle>
            <CardDescription>
              {sharedDocuments.length} document{sharedDocuments.length !== 1 ? 's' : ''} shared by the applicant
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            End-to-End Encrypted
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sharedDocuments.map((sharedDocument) => {
            const IconComponent = getDocumentIcon(sharedDocument.document_type)
            const isLoading = loadingDocuments.has(sharedDocument.id)
            const expirationStatus = getExpirationStatus(sharedDocument.expires_at)
            const isExpired = expirationStatus.status === 'expired'
            
            return (
              <div
                key={sharedDocument.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <IconComponent className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-gray-600'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${isExpired ? 'text-red-900' : 'text-gray-900'}`}>
                        {sharedDocument.custom_name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {documentHelpers.getDocumentTypeLabel(sharedDocument.document_type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Shared {format(new Date(sharedDocument.created_at), 'MMM d, yyyy')}</span>
                      {sharedDocument.access_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Viewed {sharedDocument.access_count} time{sharedDocument.access_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${expirationStatus.color}`}
                      >
                        {expirationStatus.status === 'expired' ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : expirationStatus.status === 'expiring' ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {expirationStatus.text}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isExpired && canAccess ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDocumentAccess(sharedDocument, 'preview')}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDocumentAccess(sharedDocument, 'download')}
                        disabled={isLoading}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 px-3">
                      {isExpired ? 'Expired' : 'No Access'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Secure Document Access</p>
              <p className="text-blue-700 mt-1">
                All documents are encrypted and access is logged for security. 
                Document access automatically expires after 30 days.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}