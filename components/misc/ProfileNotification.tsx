"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, X } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function ProfileNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Show notification if no profile or incomplete profile
      if (error && error.code === 'PGRST116') {
        setShowNotification(true)
        return
      }

      if (profile) {
        const hasProfileData = profile.first_name && profile.last_name && 
          (profile.phone || profile.bio || profile.occupation || profile.date_of_birth)
        
        if (!hasProfileData) {
          setShowNotification(true)
        }
      }
    }

    checkProfile()
  }, [])

  if (!showNotification) {
    return null
  }

  return (
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
  )
} 