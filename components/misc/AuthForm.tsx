"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { createApiClient } from "@/utils/supabase/api"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthState, type StateInfo } from "@/utils/types"
import SiGoogle from "@icons-pack/react-simple-icons/icons/SiGoogle"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react"
import { OtpVerification } from "./OtpVerification"
import { AccountCreationForm } from "./accountCreationForm"

export function AuthForm({ state }: { state: AuthState }) {
  const { toast } = useToast()
  const api = createApiClient(createClient())
  const searchParams = useSearchParams()
  const router = useRouter()

  const [authState, setAuthState] = useState(state)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (authState === "signup" && password !== confirmPassword) {
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
          await api.passwordSignup({ email, password })
          
          toast({
            title: 'Verification Code Sent!',
            description: 'Please check your email for the 6-digit verification code.',
          })
          
          // Show OTP verification component
          setShowOtpVerification(true)
        } catch (e) {
          if (e instanceof Error) {
            toast({
              title: "Signup Error",
              description: e.message,
              variant: "destructive",
            })
          }
        }
        setLoading(false)
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
          // Check if user has profile, if not show profile setup
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: userProfile } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', user.id)
              .single()
            
            if (!userProfile || !userProfile.first_name) {
              setShowProfileSetup(true)
            } else {
              router.refresh()
            }
          }
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
            title: "Email Sent!",
            description: "Check your email to reset your password",
          })
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
        // This will be handled by the ProfileSetup component
      },
    },
  };

  // add toast if error and check for profile setup
  useEffect(() => {
    type ToastVariant = 'destructive' | 'default' | undefined | null;
    const title = searchParams.get('toast_title') || undefined;
    const description = searchParams.get('toast_description') || undefined;
    const variant = searchParams.get('toast_variant') as ToastVariant;
    
    if (title || description) {
      setTimeout(
        () =>
          toast({
            title,
            description,
            variant
          }),
        100
      );
    }

    // Check if user needs profile setup (from OAuth flow)
    const checkProfileSetup = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // For OAuth users, always show profile setup
          // This ensures all OAuth users complete their profile
          console.log('OAuth user detected, showing profile setup')
          setShowProfileSetup(true)
        }
      } catch (error) {
        console.error('Profile check error:', error)
        // If profile check fails, assume user needs profile setup
        setShowProfileSetup(true)
      }
    }

    // Check if we have a user (from OAuth callback)
    if (searchParams.get('toast_title') === 'Welcome') {
      checkProfileSetup()
    }
  }, [searchParams, toast]);


  const currState = stateInfo[authState]

  // Show OTP verification component
  if (showOtpVerification) {
    return (
      <OtpVerification
        email={email}
        onComplete={() => {
          setShowOtpVerification(false)
          // For OAuth users, always show profile setup
          const checkProfileAndProceed = async () => {
            try {
              const supabase = createClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                // Always show profile setup for OAuth users
                console.log('OAuth user after OTP verification, showing profile setup')
                setShowProfileSetup(true)
              }
            } catch (error) {
              console.error('Profile check error:', error)
              // If profile check fails, assume user needs profile setup
              setShowProfileSetup(true)
            }
          }
          checkProfileAndProceed()
        }}
        onBack={() => {
          setShowOtpVerification(false)
          setAuthState(AuthState.Signup)
        }}
      />
    )
  }

  // Show profile setup component
  if (showProfileSetup || state === AuthState.ProfileSetup) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push('/')
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
                <h1 className="text-3xl font-bold">Complete Your Profile</h1>
              </div>
            </div>
            
            {/* Profile Setup Notification */}
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Profile Setup Required</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Please complete your profile to access all features. This information helps us match you with compatible roommates and properties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <AccountCreationForm
              userEmail={email}
              userPassword={password}
              onComplete={() => {
                if (state === AuthState.ProfileSetup) {
                  router.push('/')
                } else {
                  setShowProfileSetup(false)
                }
                toast({
                  title: "Profile Created!",
                  description: "Welcome to GoLet.ie! Your profile has been set up successfully.",
                })
                router.refresh()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{currState.title}</CardTitle>
          <CardDescription>
            {authState === "signin" && "Sign in to your account to continue"}
            {authState === "signup" && "Create your account to get started"}
            {authState === "forgot_password" && "Enter your email to reset your password"}
            {authState === "update_password" && "Enter your new password"}
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
                    {authState === "signin" && (
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

                {authState === "signup" && (
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

            <Button type="submit" className="w-full" onClick={currState.onSubmit} disabled={loading}>
              {loading ? "Please wait..." : currState.submitText}
            </Button>

            {currState.hasOAuth && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={async () => {
                    try {
                      await api.oauthSignin("google")
                      // OAuth will redirect to auth_callback, which will handle profile check
                    } catch (error) {
                      console.error("OAuth error:", error)
                    }
                  }}
                  disabled={loading}
                >
                  <SiGoogle className="h-4 w-4 mr-2" />
                  Google
                </Button>
              </>
            )}

            {/* Navigation Links */}
            <div className="text-center text-sm space-y-2">
              {authState === "signin" && (
                <p>
                  Don't have an account?{" "}
                  <Link
                    href="#"
                    className="text-primary hover:underline"
                    onClick={() => setAuthState(AuthState.Signup)}
                  >
                    Sign up
                  </Link>
                </p>
              )}

              {authState === "signup" && (
                <p>
                  Already have an account?{" "}
                  <Link
                    href="#"
                    className="text-primary hover:underline"
                    onClick={() => setAuthState(AuthState.Signin)}
                  >
                    Sign in
                  </Link>
                </p>
              )}

              {authState === "forgot_password" && (
                <p>
                  Remember your password?{" "}
                  <Link
                    href="#"
                    className="text-primary hover:underline"
                    onClick={() => setAuthState(AuthState.Signin)}
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




