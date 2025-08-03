"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { About } from '@/components/landing/About'
import { Changelog } from '@/components/landing/Changelog'
import { Comparison } from '@/components/landing/Comparison'
import { Cta } from '@/components/landing/Cta'
import { FAQ } from '@/components/landing/FAQ'
import { Features } from '@/components/landing/Features'
import { Hero } from '@/components/landing/Hero'
import { Pricing } from '@/components/landing/Pricing'
import ProfileNotification from '@/components/misc/ProfileNotification'

interface HomePageWrapperProps {
  user: any
}

export function HomePageWrapper({ user }: HomePageWrapperProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle toast messages from URL params
    const title = searchParams.get('toast_title')
    const description = searchParams.get('toast_description')
    const variant = searchParams.get('toast_variant') as 'default' | 'destructive' | undefined

    if (title || description) {
      setTimeout(() => {
        toast({
          title: title || undefined,
          description: description || undefined,
          variant,
        })
      }, 100)
    }
  }, [searchParams, toast])

  return (
    <>
      <ProfileNotification />
      <Hero user={user} />
      <Features />
      <Pricing user={user} />
      <Comparison />
      {/* <Cta /> */}
      <About />
      <FAQ />
      <Changelog />
    </>
  )
} 