'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Shield, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DiditVerificationProps {
  isOpen: boolean
  onVerificationComplete: (verified: boolean) => void
  onSkip?: () => void
  userId: string
  userEmail?: string
}

export default function DiditVerification({ isOpen, onVerificationComplete, onSkip, userId, userEmail }: DiditVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const { toast } = useToast()

  const handleStartVerification = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required for verification",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Call the Create Verification Session API to get verification_url
      const requestBody = {
        userId,
        redirectPath: '/account/profile',
        email: userEmail || 'user@example.com'
      }
      
      const response = await fetch('/api/didit/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create verification session (${response.status})`)
      }

      const data = await response.json()
      
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to get verification URL')
      }
      
    } catch (error) {
      console.error('Verification failed:', error)
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onVerificationComplete(isVerified)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Identity Verification
          </DialogTitle>
          <DialogDescription>
            Verify your identity using Didit's secure verification service. This process helps ensure the safety and trust of our community.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isVerified ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Get Verified</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete identity verification to unlock premium features and build trust with other users.
                </p>
              </div>
              
              <Button 
                onClick={handleStartVerification}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  'Start Verification'
                )}
              </Button>
              
              {onSkip && (
                <Button 
                  variant="outline"
                  onClick={onSkip}
                  disabled={isLoading}
                  className="w-full"
                >
                  Skip for Now
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verification Complete!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your identity has been verified successfully. You now have access to premium features.
                </p>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-center">
            Verification is powered by Didit, a secure identity verification service.
          </div>
        
        </div>
      </DialogContent>
    </Dialog>
  )
}
