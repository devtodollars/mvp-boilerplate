"use client"

import { useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export function useAuthRefresh() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        // Only refresh on sign out to clear UI state
        // Don't refresh on sign in as it can interfere with ongoing flows
        if (event === 'SIGNED_OUT') {
          // Refresh the page to update UI
          router.refresh()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])
} 