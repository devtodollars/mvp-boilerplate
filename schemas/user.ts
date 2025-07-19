import { z } from "zod"

// Gender enum
export const genderEnum = z.enum(["male", "female", "prefer_not_to_say"])
export type Gender = z.infer<typeof genderEnum>

// Marital status enum
export const maritalStatusEnum = z.enum([
  "single",
  "married", 
  "living with partner",
  "divorced",
  "widowed"
])
export type MaritalStatus = z.infer<typeof maritalStatusEnum>

// User profile schema
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  full_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar_id: z.string().optional(),
  avatar_url: z.string().url().optional(),
  verified: z.boolean().default(false),
  date_of_birth: z.string().optional(), // ISO date string
  occupation: z.string().max(100).optional(),
  marital_status: maritalStatusEnum.optional(),
  gender: genderEnum.optional(),
  smoker: z.boolean().optional(),
  pets: z.boolean().optional(),
  successful_applications: z.array(z.string().uuid()).default([]),
  rejected_applications: z.array(z.string().uuid()).default([]),
  pending_applications: z.array(z.string().uuid()).default([]),
  owned_listings: z.array(z.string().uuid()).default([]),
  liked_listings: z.array(z.string().uuid()).default([]),
  last_login: z.string().optional(), // ISO timestamp
  created_at: z.string().optional(), // ISO timestamp
  updated_at: z.string().optional(), // ISO timestamp
  uploaded_documents: z.array(z.string().url()).default([]),
  billing_address: z.any().optional(), // JSONB
  payment_method: z.any().optional(), // JSONB
})

// User profile update schema (for partial updates)
export const userProfileUpdateSchema = userProfileSchema.partial().omit({
  id: true,
  email: true, // Email should be updated through auth
  created_at: true,
})

// User profile creation schema (for new users)
export const userProfileCreateSchema = userProfileSchema.omit({
  id: true,
  verified: true,
  successful_applications: true,
  rejected_applications: true,
  pending_applications: true,
  owned_listings: true,
  liked_listings: true,
  last_login: true,
  created_at: true,
  updated_at: true,
  uploaded_documents: true,
})

// Simplified user schema for forms
export const userFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  occupation: z.string().max(100).optional(),
  marital_status: maritalStatusEnum.optional(),
  gender: genderEnum.optional(),
  smoker: z.boolean().optional(),
  pets: z.boolean().optional(),
})

// User preferences schema
export const userPreferencesSchema = z.object({
  smoker: z.boolean().optional(),
  pets: z.boolean().optional(),
  // Add more preferences as needed
})

// User application tracking schema
export const userApplicationsSchema = z.object({
  successful_applications: z.array(z.string().uuid()),
  rejected_applications: z.array(z.string().uuid()),
  pending_applications: z.array(z.string().uuid()),
})

// User listings schema
export const userListingsSchema = z.object({
  owned_listings: z.array(z.string().uuid()),
  liked_listings: z.array(z.string().uuid()),
})

// Export types
export type UserProfile = z.infer<typeof userProfileSchema>
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>
export type UserProfileCreate = z.infer<typeof userProfileCreateSchema>
export type UserForm = z.infer<typeof userFormSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type UserApplications = z.infer<typeof userApplicationsSchema>
export type UserListings = z.infer<typeof userListingsSchema>

// Helper functions for working with user data
export const userHelpers = {
  // Get full name from first and last name
  getFullName: (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`.trim()
  },

  // Get application counts
  getApplicationCounts: (user: UserProfile) => ({
    successful: user.successful_applications.length,
    rejected: user.rejected_applications.length,
    pending: user.pending_applications.length,
    total: user.successful_applications.length + user.rejected_applications.length + user.pending_applications.length
  }),

  // Check if user has liked a specific listing
  hasLikedListing: (user: UserProfile, listingId: string): boolean => {
    return user.liked_listings.includes(listingId)
  },

  // Check if user owns a specific listing
  ownsListing: (user: UserProfile, listingId: string): boolean => {
    return user.owned_listings.includes(listingId)
  },

  // Check if user has applied to a specific listing
  hasAppliedToListing: (user: UserProfile, listingId: string): boolean => {
    return user.pending_applications.includes(listingId) ||
           user.successful_applications.includes(listingId) ||
           user.rejected_applications.includes(listingId)
  },

  // Get application status for a specific listing
  getApplicationStatus: (user: UserProfile, listingId: string): 'pending' | 'successful' | 'rejected' | null => {
    if (user.pending_applications.includes(listingId)) return 'pending'
    if (user.successful_applications.includes(listingId)) return 'successful'
    if (user.rejected_applications.includes(listingId)) return 'rejected'
    return null
  }
} 