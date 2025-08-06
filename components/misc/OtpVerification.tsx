"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createApiClient } from "@/utils/supabase/api"
import { createClient } from "@/utils/supabase/client"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

interface OtpVerificationProps {
  email: string
  onComplete: () => void
  onBack: () => void
}

export function OtpVerification({ email, onComplete, onBack }: OtpVerificationProps) {
  const { toast } = useToast()
  const router = useRouter()
  const api = createApiClient(createClient())
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "")
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("")
      setOtp(newOtp)
      setError("")
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter the 6-digit verification code")
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.verifyOtp(email, otpString)
      
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      })

      // After OTP verification, call onComplete to handle next step
      // without redirecting - let the parent component decide
      onComplete()
    } catch (error) {
      console.error('OTP verification error:', error)
      setError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new user, just resend OTP
        }
      })
      
      toast({
        title: "Code Resent!",
        description: "A new verification code has been sent to your email.",
      })
      
      setCountdown(60) // 60 second cooldown
    } catch (error) {
      console.error('Resend error:', error)
      toast({
        title: "Error",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-4">
              <Label htmlFor="otp">Enter verification code</Label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    disabled={loading}
                  />
                ))}
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>

            {/* Verify Button */}
            <Button 
              onClick={handleVerify} 
              disabled={loading || otp.join("").length !== 6}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Email
                </>
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="link"
                onClick={handleResend}
                disabled={resendLoading || countdown > 0}
                className="text-sm"
              >
                {resendLoading ? "Sending..." : 
                 countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </Button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={loading}
                className="text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 