"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createApiClient } from "@/utils/supabase/api"
import { createClient } from "@/utils/supabase/client"
import { Mail, CheckCircle, Clock, RefreshCw, Key } from "lucide-react"

interface EmailConfirmationProps {
  email: string
  onConfirmed: () => void
}

export function EmailConfirmation({ email, onConfirmed }: EmailConfirmationProps) {
  const { toast } = useToast()
  const router = useRouter()
  const api = createApiClient(createClient())
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [verificationCode, setVerificationCode] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  // Generate and send verification code
  const sendVerificationCode = async () => {
    setLoading(true)
    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Store the code in localStorage temporarily (in production, you'd store this in the database)
      localStorage.setItem('emailVerificationCode', code)
      localStorage.setItem('emailVerificationEmail', email)
      
      // Send email with the code using Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/email_confirmation?code=${code}`
        }
      })

      if (error) {
        // If resend fails, try sending a custom email
        await sendCustomEmailWithCode(email, code)
      }

      setCodeSent(true)
      setCountdown(60) // 60 second cooldown
      toast({
        title: "Verification Code Sent!",
        description: `A 6-digit code has been sent to ${email}`,
      })
    } catch (error) {
      console.error('Error sending code:', error)
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  // Send custom email with code (fallback method)
  const sendCustomEmailWithCode = async (email: string, code: string) => {
    try {
      // You can implement a custom email sending function here
      // For now, we'll just show the code in a toast (for development)
      toast({
        title: "Development Mode",
        description: `Your verification code is: ${code}`,
      })
    } catch (error) {
      console.error('Error sending custom email:', error)
    }
  }

  // Verify the entered code
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const storedCode = localStorage.getItem('emailVerificationCode')
      const storedEmail = localStorage.getItem('emailVerificationEmail')

      if (storedCode === verificationCode && storedEmail === email) {
        // Code is correct - mark email as confirmed
        setIsConfirmed(true)
        
        // Clear stored code
        localStorage.removeItem('emailVerificationCode')
        localStorage.removeItem('emailVerificationEmail')
        
        toast({
          title: "Email Confirmed!",
          description: "Your email has been successfully verified.",
        })
        
        setTimeout(() => {
          onConfirmed()
        }, 2000)
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code you entered is incorrect.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Send code on component mount
  useEffect(() => {
    if (!codeSent) {
      sendVerificationCode()
    }
  }, [codeSent])

  const handleResendCode = async () => {
    setResendLoading(true)
    await sendVerificationCode()
    setResendLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              {isConfirmed ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <Key className="h-8 w-8 text-blue-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isConfirmed ? "Email Confirmed!" : "Verify Your Email"}
          </CardTitle>
          <CardDescription className="text-base">
            {isConfirmed 
              ? "Your email has been successfully verified. Redirecting you to complete your profile..."
              : `Enter the 6-digit code sent to ${email}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isConfirmed && (
            <>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest"
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendCode}
                  disabled={resendLoading || countdown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Didn't receive the code?</p>
                <p className="mt-1">
                  Check your spam folder or{" "}
                  <button
                    onClick={handleResendCode}
                    disabled={countdown > 0}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    try a different email address
                  </button>
                </p>
              </div>
            </>
          )}

          {isConfirmed && (
            <div className="text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  Your email has been confirmed successfully!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 