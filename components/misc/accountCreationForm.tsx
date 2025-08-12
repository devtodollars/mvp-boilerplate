"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createApiClient } from "@/utils/supabase/api"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/AuthProvider"
import { userFormSchema, type UserForm, genderEnum, maritalStatusEnum } from "@/schemas/user"
import { ChevronLeft, ChevronRight, User, Phone, Heart, Home, CalendarIcon, Search } from "lucide-react"
import { z } from "zod"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/utils/cn"
import { format } from "date-fns"

interface AccountCreationFormProps {
  userEmail?: string
  userPassword?: string
  onComplete: () => void
}

type FormStep = "personal" | "contact" | "preferences" | "complete"

const stepConfig = {
  personal: {
    title: "Personal Information",
    description: "Tell us a bit about yourself",
    icon: User,
    progress: 25,
  },
  contact: {
    title: "Contact & Professional",
    description: "How can we reach you?",
    icon: Phone,
    progress: 50,
  },
  preferences: {
    title: "Living Preferences",
    description: "Help us match you better",
    icon: Home,
    progress: 75,
  },
  complete: {
    title: "All Set!",
    description: "Your profile has been created",
    icon: Heart,
    progress: 100,
  },
}

export function AccountCreationForm({ userEmail, userPassword, onComplete }: AccountCreationFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const api = createApiClient(createClient())
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState<FormStep>("personal")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<UserForm>>({
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    date_of_birth: "",
    occupation: "",
    marital_status: undefined,
    gender: undefined,
    smoker: false,
    pets: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [actualUserEmail, setActualUserEmail] = useState(userEmail)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Get user email from session if not provided
  useEffect(() => {
    const getUserEmail = async () => {
      if (!userEmail) {
        const { user } = useAuth()
        if (user?.email) {
          setActualUserEmail(user.email)
        }
      }
    }
    getUserEmail()
  }, [userEmail, supabase.auth])

  const validateStep = (step: FormStep): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === "personal") {
      if (!formData.first_name?.trim()) {
        newErrors.first_name = "First name is required"
      } else if (formData.first_name.trim().length < 2) {
        newErrors.first_name = "First name must be at least 2 characters"
      } else if (formData.first_name.trim().length > 50) {
        newErrors.first_name = "First name must be less than 50 characters"
      }
      
      if (!formData.last_name?.trim()) {
        newErrors.last_name = "Last name is required"
      } else if (formData.last_name.trim().length < 2) {
        newErrors.last_name = "Last name must be at least 2 characters"
      } else if (formData.last_name.trim().length > 50) {
        newErrors.last_name = "Last name must be less than 50 characters"
      }
      
      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = "Bio must be less than 500 characters"
      }
    }

    if (step === "contact") {
      if (formData.phone && formData.phone.length > 0) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = "Please enter a valid phone number"
        }
      }
      if (formData.occupation && formData.occupation.length > 100) {
        newErrors.occupation = "Occupation must be less than 100 characters"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Additional validation before submission
  const validateFormData = (data: Partial<UserForm>): boolean => {
    if (!data.first_name?.trim()) {
      setErrors(prev => ({ ...prev, first_name: "First name is required" }))
      return false
    }
    if (!data.last_name?.trim()) {
      setErrors(prev => ({ ...prev, last_name: "Last name is required" }))
      return false
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return

    const steps: FormStep[] = ["personal", "contact", "preferences", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    const steps: FormStep[] = ["personal", "contact", "preferences", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    if (!validateStep("preferences")) return

    setLoading(true)
    try {
      // Debug: Log the form data
      console.log('Form data before validation:', formData)
      
      // Additional validation
      if (!validateFormData(formData)) {
        setLoading(false)
        return
      }
      
      // Clean the form data - trim strings and ensure proper values
      const cleanedData = {
        ...formData,
        first_name: formData.first_name?.trim() || '',
        last_name: formData.last_name?.trim() || '',
        phone: formData.phone?.trim() || '',
        bio: formData.bio?.trim() || '',
        occupation: formData.occupation?.trim() || '',
        smoker: formData.smoker || false,
        pets: formData.pets || false,
      }
      
      console.log('Cleaned form data:', cleanedData)
      
      // Validate the complete form data
      const validatedData = userFormSchema.parse(cleanedData)
      console.log('Validated data:', validatedData)

      // Auth account is already created and email is confirmed at this point
      // No need to sign in again as we should already have a session
      // For OAuth users, auth account already exists, so we just create the profile

      // Create user profile
      const profileData = {
        ...validatedData,
        email: actualUserEmail || userEmail || '',
      }
      console.log('Profile data being sent:', profileData)
      
      const profileResult = await api.createUserProfile(profileData)
      console.log('Profile creation result:', profileResult)

      toast({
        title: "Profile Created!",
        description: "Welcome to our platform. You can now start browsing properties.",
      })

      setCurrentStep("complete")

      // Call onComplete to handle next step (no redirect)
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        toast({
          title: "Error",
          description: `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      }
    }
    setLoading(false)
  }

  const updateFormData = (field: keyof UserForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Validate age
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      if (age < 18) {
        setErrors(prev => ({ ...prev, date_of_birth: "You must be at least 18 years old" }))
        return
      }
      if (age > 120) {
        setErrors(prev => ({ ...prev, date_of_birth: "Please enter a valid date of birth" }))
        return
      }
      
      // Format date as DD/MM/YYYY for European format
      const formattedDate = format(date, 'dd/MM/yyyy')
      updateFormData("date_of_birth", formattedDate)
      // Clear any previous date errors
      setErrors(prev => ({ ...prev, date_of_birth: "" }))
    }
    setDatePickerOpen(false)
  }

  const currentConfig = stepConfig[currentStep]
  const IconComponent = currentConfig.icon

  return (
    <Card className="w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">{currentConfig.title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">{currentConfig.description}</CardDescription>
          <div className="mt-4">
            <Progress value={currentConfig.progress} className="w-full" />
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Step {Object.keys(stepConfig).indexOf(currentStep) + 1} of {Object.keys(stepConfig).length}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === "personal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ""}
                    onChange={(e) => updateFormData("first_name", e.target.value)}
                    placeholder="John"
                    className={errors.first_name ? "border-red-500" : ""}
                  />
                  {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ""}
                    onChange={(e) => updateFormData("last_name", e.target.value)}
                    placeholder="Doe"
                    className={errors.last_name ? "border-red-500" : ""}
                  />
                  {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date_of_birth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date_of_birth ? formData.date_of_birth : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      selected={formData.date_of_birth ? new Date(formData.date_of_birth.split('/').reverse().join('-')) : undefined}
                      onSelect={handleDateSelect}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    />
                  </PopoverContent>
                </Popover>
                {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender || ""} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderEnum._def.values.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={(e) => updateFormData("bio", e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  className={errors.bio ? "border-red-500" : ""}
                />
                <p className="text-sm text-muted-foreground">{formData.bio?.length || 0}/500 characters</p>
                {errors.bio && <p className="text-sm text-red-500">{errors.bio}</p>}
              </div>
            </div>
          )}

          {currentStep === "contact" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+353 1 234 5678"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation || ""}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  placeholder="Software Developer"
                  className={errors.occupation ? "border-red-500" : ""}
                />
                {errors.occupation && <p className="text-sm text-red-500">{errors.occupation}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select
                  value={formData.marital_status || ""}
                  onValueChange={(value) => updateFormData("marital_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    {maritalStatusEnum._def.values.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === "preferences" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  These preferences help us match you with suitable properties and roommates.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="smoker"
                    checked={formData.smoker || false}
                    onCheckedChange={(checked) => updateFormData("smoker", checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="smoker" className="text-base font-medium">
                      I am a smoker
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      This helps us match you with compatible living situations
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="pets"
                    checked={formData.pets || false}
                    onCheckedChange={(checked) => updateFormData("pets", checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="pets" className="text-base font-medium">
                      I have pets
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      We'll show you pet-friendly properties and roommates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Welcome to our platform!</h3>
                <p className="text-green-700">
                  Your profile has been created successfully. You can now start browsing properties and connecting with
                  potential roommates.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/search')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Properties
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Go to Home
                </Button>
              </div>
            </div>
          )}

          {currentStep !== "complete" && (
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === "personal"}
                className="flex items-center gap-2 order-2 sm:order-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentStep === "preferences" ? (
                <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 order-1 sm:order-2">
                  {loading ? "Creating Profile..." : "Complete Setup"}
                  <Heart className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="flex items-center gap-2 order-1 sm:order-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  )
}

// Calendar Component (improved version)
function CalendarComponent({ selected, onSelect, disabled }: { selected?: Date, onSelect: (date: Date) => void, disabled?: (date: Date) => boolean }) {
  const [currentMonth, setCurrentMonth] = useState(() => selected ? new Date(selected) : new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  
  function isSelected(date: Date) {
    return selected && date.toDateString() === selected.toDateString();
  }
  
  function handleDayClick(date: Date) {
    if (!disabled || !disabled(date)) {
      onSelect(date);
    }
  }

  function handleYearChange(year: number) {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setShowYearPicker(false);
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  
  return (
    <div className="w-64 p-2 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 rounded hover:bg-gray-100">
          <CalendarIcon className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          <span className="font-semibold">
            {currentMonth.toLocaleString("default", { month: "long" })}
          </span>
          <button 
            type="button" 
            onClick={() => setShowYearPicker(!showYearPicker)}
            className="font-semibold hover:bg-gray-100 px-1 rounded"
          >
            {currentMonth.getFullYear()}
          </button>
        </div>
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 rounded hover:bg-gray-100">
          <CalendarIcon className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {showYearPicker && (
        <div className="mb-2 p-2 bg-gray-50 rounded">
          <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto">
            {years.map(year => (
              <button
                key={year}
                type="button"
                onClick={() => handleYearChange(year)}
                className={cn(
                  "p-1 text-xs rounded hover:bg-gray-200",
                  year === currentMonth.getFullYear() && "bg-primary text-white"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-0">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => (
          <button
            key={i}
            type="button"
            disabled={!date || (disabled && date && disabled(date))}
            onClick={() => date && handleDayClick(date)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              date && isSelected(date) ? "bg-primary text-white" : "hover:bg-gray-100",
              !date && "opacity-0 cursor-default",
              disabled && date && disabled(date) && "opacity-50 cursor-not-allowed"
            )}
          >
            {date ? date.getDate() : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
