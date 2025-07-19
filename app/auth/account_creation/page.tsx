"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { AccountCreationForm } from "@/components/misc/accountCreationForm"

export default function AccountCreationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userEmail, setUserEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to continue.",
            variant: "destructive",
          })
          router.push('/auth/signin')
          return
        }

        // Check if user already has a complete profile
        const { data: userProfile } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        if (userProfile && userProfile.first_name) {
          // User already has a complete profile, redirect to home
          router.push('/')
          return
        }

        setUserEmail(user.email || "")
        setLoading(false)
      } catch (error) {
        console.error('Error checking user:', error)
        toast({
          title: "Error",
          description: "Failed to load user data.",
          variant: "destructive",
        })
        router.push('/auth/signin')
      }
    }

    checkUser()
  }, [router, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <AccountCreationForm
        userEmail={userEmail}
        onComplete={() => {
          toast({
            title: "Profile Created!",
            description: "Welcome to our platform. You can now start browsing properties.",
          })
          router.push('/')
        }}
      />
    </div>
  )
} 