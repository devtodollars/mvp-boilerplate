"use client"

import { useEffect, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export function useAuthRefresh() {
  const router = useRouter()
  
  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
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
  }, [router, supabase])
}

// DEPRECATED: This hook is no longer needed as AuthProvider handles auth state changes
// Keeping for backward compatibility but it's not being used
export function useAuthRefreshDeprecated() {
  // This function is deprecated and does nothing
  console.warn('useAuthRefresh is deprecated. AuthProvider handles auth state changes.');
} 