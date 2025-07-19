"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { createApiClient } from "@/utils/supabase/api"
import { createClient } from "@/utils/supabase/client"
import { UserForm, userFormSchema, genderEnum, maritalStatusEnum } from "@/schemas/user"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { User, Phone, Briefcase, Heart, CalendarIcon, Edit, Save, X, ArrowLeft } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/utils/cn"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const api = createApiClient(createClient())
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const form = useForm<UserForm>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      bio: "",
      date_of_birth: "",
      occupation: "",
      marital_status: "single",
      gender: "prefer_not_to_say",
      smoker: false,
      pets: false
    }
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your profile.",
          variant: "destructive",
        })
        return
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If user doesn't have a profile, redirect to account creation
        if (error.code === 'PGRST116') { // No rows returned
          toast({
            title: "Profile Incomplete",
            description: "Please complete your profile setup first.",
          })
          router.push('/auth/account_creation')
          return
        }
        
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        })
        return
      }

      setUserProfile(profile)
      
      // Update form with current values
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        date_of_birth: profile.date_of_birth || "",
        occupation: profile.occupation || "",
        marital_status: profile.marital_status || "single",
        gender: profile.gender || "prefer_not_to_say",
        smoker: profile.smoker || false,
        pets: profile.pets || false
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: UserForm) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update your profile.",
          variant: "destructive",
        })
        return
      }

      // Convert date format if needed
      let formattedDateOfBirth = null;
      if (data.date_of_birth) {
        if (data.date_of_birth.includes('/')) {
          const [day, month, year] = data.date_of_birth.split('/');
          formattedDateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          formattedDateOfBirth = data.date_of_birth;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: `${data.first_name} ${data.last_name}`,
          phone: data.phone,
          bio: data.bio,
          date_of_birth: formattedDateOfBirth,
          occupation: data.occupation,
          marital_status: data.marital_status,
          gender: data.gender,
          smoker: data.smoker,
          pets: data.pets,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Profile Updated!",
        description: "Your profile has been updated successfully.",
      })

      setEditing(false)
      fetchUserProfile() // Refresh the data
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/account')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Account
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Edit Profile</h1>
                  <p className="text-muted-foreground mt-2">Update your personal information and preferences</p>
                </div>
              </div>
              <div className="flex gap-3">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false)
                        fetchUserProfile() // Reset form to original values
                      }}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Your basic personal details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        {...form.register("first_name", {
                          required: "First name is required",
                          minLength: { value: 2, message: "First name must be at least 2 characters" },
                          maxLength: { value: 50, message: "First name must be less than 50 characters" }
                        })}
                        disabled={!editing || loading}
                      />
                      {form.formState.errors.first_name && (
                        <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        {...form.register("last_name", {
                          required: "Last name is required",
                          minLength: { value: 2, message: "Last name must be at least 2 characters" },
                          maxLength: { value: 50, message: "Last name must be less than 50 characters" }
                        })}
                        disabled={!editing || loading}
                      />
                      {form.formState.errors.last_name && (
                        <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        {...form.register("phone", {
                          pattern: {
                            value: /^[\+]?[1-9][\d]{0,15}$/,
                            message: "Please enter a valid phone number"
                          }
                        })}
                        disabled={!editing || loading}
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.watch("date_of_birth") && "text-muted-foreground"
                            )}
                            disabled={!editing || loading}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("date_of_birth") ? format(new Date(form.watch("date_of_birth") || ""), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.watch("date_of_birth") ? new Date(form.watch("date_of_birth") || "") : undefined}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                const today = new Date()
                                const age = today.getFullYear() - date.getFullYear()
                                if (age < 18) {
                                  form.setError("date_of_birth", { message: "You must be at least 18 years old" })
                                  return
                                }
                                if (age > 120) {
                                  form.setError("date_of_birth", { message: "Please enter a valid date of birth" })
                                  return
                                }
                                form.setValue("date_of_birth", date.toISOString().split('T')[0])
                                form.clearErrors("date_of_birth")
                              }
                            }}
                            disabled={(date: Date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {form.formState.errors.date_of_birth && (
                        <p className="text-sm text-destructive">{form.formState.errors.date_of_birth.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={form.watch("gender")} 
                        onValueChange={(value) => form.setValue("gender", value as any)}
                        disabled={!editing || loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderEnum._def.values.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marital_status">Marital Status</Label>
                      <Select 
                        value={form.watch("marital_status")} 
                        onValueChange={(value) => form.setValue("marital_status", value as any)}
                        disabled={!editing || loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          {maritalStatusEnum._def.values.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>
                      Your work and background details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      {...form.register("occupation", {
                        maxLength: { value: 100, message: "Occupation must be less than 100 characters" }
                      })}
                      disabled={!editing || loading}
                    />
                    {form.formState.errors.occupation && (
                      <p className="text-sm text-destructive">{form.formState.errors.occupation.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...form.register("bio", {
                        maxLength: { value: 500, message: "Bio must be less than 500 characters" }
                      })}
                      rows={4}
                      disabled={!editing || loading}
                      placeholder="Tell us a bit about yourself..."
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {form.watch("bio")?.length || 0}/500 characters
                      </p>
                      {form.formState.errors.bio && (
                        <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Living Preferences Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Living Preferences</CardTitle>
                    <CardDescription>
                      Help us match you with compatible living situations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="smoker"
                      checked={form.watch("smoker")}
                      onCheckedChange={(checked: boolean) => form.setValue("smoker", checked)}
                      disabled={!editing || loading}
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
                      checked={form.watch("pets")}
                      onCheckedChange={(checked: boolean) => form.setValue("pets", checked)}
                      disabled={!editing || loading}
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
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
} 