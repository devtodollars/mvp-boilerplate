"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { createApiClient } from "@/utils/supabase/api"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { User, X, ArrowRight } from "lucide-react"

export default function ProfileNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return

      try {
        const api = createApiClient(supabase)
        const { completed } = await api.checkProfileCompletion()
        
        if (!completed) {
          // Show dialog on listroom page, notification elsewhere
          if (pathname === '/listroom') {
            setShowDialog(true)
          } else {
            setShowNotification(true)
          }
        }
      } catch (profileError) {
        console.error('Error checking profile completion:', profileError)
        // Fallback to old method
        const { data: profile, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (dbError && dbError.code === 'PGRST116') {
          if (pathname === '/listroom') {
            setShowDialog(true)
          } else {
            setShowNotification(true)
          }
          return
        }

        if (profile) {
          const hasProfileData = profile.first_name && profile.last_name && 
            (profile.phone || profile.bio || profile.occupation || profile.date_of_birth)
          
          if (!hasProfileData) {
            if (pathname === '/listroom') {
              setShowDialog(true)
            } else {
              setShowNotification(true)
            }
          }
        }
      }
    }

    checkProfile()
  }, [user, pathname, supabase])

  const handleCompleteProfile = () => {
    setShowDialog(false)
    setShowNotification(false)
    router.push('/account/profile')
  }

  const handleClose = () => {
    setShowDialog(false)
    setShowNotification(false)
  }

  return (
    <>
      {/* Notification for non-listroom pages */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <Card className=" bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 text-sm">Profile Setup</h3>
                    <button
                      onClick={() => setShowNotification(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 mb-3">
                    Complete your profile to unlock all features
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/account/profile')}
                    className="w-full bg-primary hover:bg-blue-700 text-white text-xs h-8"
                  >
                    Complete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog for listroom page */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-base">
              Hi {user?.email?.split('@')[0] || 'there'}! 👋
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                To post a room listing, we need you to complete your profile first. This helps us:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Build trust with potential tenants</li>
                <li>• Verify your identity</li>
                <li>• Provide better matching</li>
                <li>• Ensure platform safety</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2 font-medium">Profile completion includes:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your full name and contact details</li>
                <li>• A brief bio about yourself</li>
                <li>• Your occupation and background</li>
                <li>• Date of birth for verification</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleCompleteProfile}
              className="flex items-center gap-2"
            >
              Complete Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 