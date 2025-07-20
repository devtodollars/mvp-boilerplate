"use client"

import { PropsWithChildren } from "react"
import { useAuthRefresh } from "@/hooks/use-auth-refresh"

export function AuthProvider({ children }: PropsWithChildren) {
  useAuthRefresh()
  
  return <>{children}</>
} 