"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { createApiClient } from "@/utils/supabase/api"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthState, type StateInfo } from "@/utils/types"
import SiGoogle from "@icons-pack/react-simple-icons/icons/SiGoogle"
import { AccountCreationForm } from "./accountCreationForm"
import { Eye, EyeOff, Mail, Lock, User, Github } from "lucide-react"
import { OtpVerification } from "./OtpVerification"

export function EnhancedAuthForm({ state }: { state: AuthState }) {
  const { toast } = useToast()
  const api = createApiClient(createClient())
  const searchParams = useSearchParams()
  const router = useRouter()

  const [authState, setAuthState] = useState<AuthState>(state)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showAccountCreation, setShowAccountCreation] = useState(false)
  const [userPassword, setUserPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Only validate email if the current state has an email field
    if (authState === AuthState.Signin || authState === AuthState.Signup || authState === AuthState.ForgotPassword) {
      if (!email) {
        newErrors.email = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if ((authState === AuthState.Signup || authState === AuthState.UpdatePassword) && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const stateInfo: Record<AuthState, StateInfo> = {
    signup: {
      title: "Create Account",
      submitText: "Create Account",
      hasEmailField: true,
      hasPasswordField: true,
      hasOAuth: true,
      onSubmit: async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
          console.log('Starting signup process for email:', email)

          const result = await api.passwordSignup({ email, password })

          console.log('Signup result:', result) // Debug log
          console.log('Signup result.user:', result?.user) // Debug log
          console.log('Signup result.session:', result?.session) // Debug log

          // Check if signup was successful or if there's an error
          if (result && 'error' in result && result.error) {
            // Handle API-level errors (like user already exists)
            console.log('Signup error from API:', result.error)
            toast({
              title: 'Signup Error',
              description: result.error.message,
              variant: 'destructive',
            })
          } else if (result && result.user) {
            // Successful signup
            console.log('Signup successful, proceeding to email verification')

            toast({
              title: 'Account Created Successfully! 🎉',
              description: 'Please check your email and enter the verification code to complete your registration.',
            })

            // Show email verification component
            setAuthState(AuthState.EmailVerification)
            console.log('Auth state changed to EmailVerification') // Debug log
          } else {
            // Unexpected result
            console.error('Unexpected signup result:', result)
            toast({
              title: 'Signup Error',
              description: 'An unexpected error occurred during signup. Please try again.',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Signup error:', error)

          toast({
            title: 'Signup Error',
            description: error instanceof Error ? error.message : 'An error occurred during signup',
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
        }
      },
    },
    signin: {
      title: "Welcome Back",
      submitText: "Sign In",
      hasEmailField: true,
      hasPasswordField: true,
      hasOAuth: true,
      onSubmit: async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
          await api.passwordSignin({ email, password })
          router.refresh()
        } catch (e) {
          if (e instanceof Error) {
            toast({
              title: "Sign In Error",
              description: e.message,
              variant: "destructive",
            })
          }
        }
        setLoading(false)
      },
    },
    forgot_password: {
      title: "Reset Password",
      submitText: "Send Reset Email",
      hasEmailField: true,
      hasPasswordField: false,
      hasOAuth: false,
      onSubmit: async () => {
        if (!email) {
          setErrors({ email: "Email is required" })
          return
        }

        setLoading(true)
        try {
          await api.passwordReset(email)
          toast({
            title: "Reset Email Sent! 📧",
            description: "We've sent you an email with a link to reset your password. Please check your inbox (and spam folder).",
          })
          // Clear the email field after successful send
          setEmail("")
          // Show additional info
          setTimeout(() => {
            toast({
              title: "Next Steps",
              description: "Click the link in your email to continue. The link will expire in 1 hour.",
            })
          }, 2000)
        } catch (e) {
          if (e instanceof Error) {
            toast({
              title: "Reset Error",
              description: e.message,
              variant: "destructive",
            })
          }
        }
        setLoading(false)
      },
    },
    update_password: {
      title: "Update Password",
      submitText: "Update Password",
      hasEmailField: false,
      hasPasswordField: true,
      hasOAuth: false,
      onSubmit: async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
          await api.passwordUpdate(password)
          toast({
            title: "Password Updated",
            description: "Your password has been updated successfully.",
          })
          // Redirect to dashboard after successful password update
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } catch (e) {
          if (e instanceof Error) {
            toast({
              title: "Update Error",
              description: e.message,
              variant: "destructive",
            })
          }
        }
        setLoading(false)
      },
    },
    profile_setup: {
      title: "Profile Setup",
      submitText: "Complete Profile",
      hasEmailField: false,
      hasPasswordField: false,
      hasOAuth: false,
      onSubmit: async () => {
        // This will be handled by the AccountCreationForm
      },
    },
    [AuthState.EmailVerification]: {
      title: "Email Verification",
      submitText: "Verify Email",
      hasEmailField: false,
      hasPasswordField: false,
      hasOAuth: false,
      onSubmit: async () => {
        // This will be handled by the EmailConfirmation component
      },
    },
  }

  // Handle toast messages from URL params
  useEffect(() => {
    type ToastVariant = "destructive" | "default" | undefined | null
    const title = searchParams.get("toast_title") || undefined
    const description = searchParams.get("toast_description") || undefined
    const variant = searchParams.get("toast_variant") as ToastVariant

    if (title || description) {
      setTimeout(
        () =>
          toast({
            title,
            description,
            variant,
          }),
        100,
      )
    }
  }, [searchParams, toast])

  const currState = stateInfo[authState]

  // Show account creation form after successful signup
  if (showAccountCreation) {
    return (
      <AccountCreationForm
        userEmail={email}
        userPassword={userPassword}
        onComplete={() => {
          setShowAccountCreation(false)
          // Redirect to home after successful profile creation
          router.push('/')
        }}
      />
    )
  }

  // Show email verification component
  if (authState === AuthState.EmailVerification) {
    return (
      <OtpVerification
        email={email}
        onComplete={() => {
          // After email verification, show profile setup
          setShowAccountCreation(true)
        }}
        onBack={() => {
          setAuthState(AuthState.Signup)
        }}
      />
    )
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={(e) => {
        e.preventDefault();
        currState.onSubmit();
      }}>
          <CardHeader className="text-center">
            <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{currState.title}</CardTitle>
            <CardDescription>
              {authState === AuthState.Signin && "Sign in to your account to continue"}
              {authState === AuthState.Signup && "Create your account to get started"}
              {authState === AuthState.ForgotPassword && "Enter your email to reset your password"}
              {authState === AuthState.UpdatePassword && "Enter your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {currState.hasEmailField && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                      }}
                      disabled={loading}
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              )}

              {currState.hasPasswordField && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {authState === AuthState.Signin && (
                        <Link
                          href="#"
                          onClick={() => setAuthState(AuthState.ForgotPassword)}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }))
                        }}
                        disabled={loading}
                        className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  {(authState === AuthState.Signup || authState === AuthState.UpdatePassword) && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                          }}
                          disabled={loading}
                          className={`pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                          required
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  )}
                </>
              )}

              {/* Show OAuth buttons if enabled for current state */}
              {currState.hasOAuth && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => api.oauthSignin("google")}
                      disabled={loading}
                      className="w-full"
                    >
                      <SiGoogle className="mr-2 h-4 w-4" />
                      Continue with Google
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : currState.submitText}
            </Button>
          </CardFooter>

          {/* Show state switching links */}
          <div className="px-6 pb-6 text-center space-y-2">

            {authState === AuthState.Signin && (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="#"
                  onClick={() => setAuthState(AuthState.Signup)}
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            )}

            {authState === AuthState.Signup && (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="#"
                  onClick={() => setAuthState(AuthState.Signin)}
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}

            {authState === AuthState.ForgotPassword && (
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="#"
                  onClick={() => setAuthState(AuthState.Signin)}
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </form>
      </Card>
  )
}
