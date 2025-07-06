import { z } from 'zod';

/**
 * Zod schema for a minimal property listing, inspired by Daft.ie/Airbnb.
 * Only core fields required for a basic listing are included.
 */
export const listingSchema = z.object({
    id: z.string().uuid(), // Unique identifier for the listing
    propertyName: z.string().min(1, 'Property name is required'), // The name/title of the property (e.g., "Sunny 2-bed Apartment")
    propertyType: z.enum(['apartment', 'house', 'studio', 'room', 'other']), // The type of property (e.g., 'apartment', 'house', 'studio', etc.)
    description: z.string().min(1, 'Description is required'), // Short description of the property
    size: z.number().positive('Size must be positive'), // Size in square meters (or feet)
    address: z.string().min(1, 'Address is required'), // Address (can be a single string for now)
    eircode: z.string().min(1, 'Eircode is required'), // Eircode (postal code in Ireland)
    active: z.boolean().default(true), // Is the listing currently active?
    amenities: z.array(z.string()).default([]), // List of amenities (e.g., ["WiFi", "Parking", "Washer"])
    verified: z.boolean().default(false), // Has the property been verified by the platform?
    occupants: z.number().int().positive().nullable().default(null), // Number of occupants if shared, or null if not shared
    applicants: z.array(z.string()).default([]), // Array of applicant user IDs (can be empty)
});

// TypeScript type for convenience
export type Listing = z.infer<typeof listingSchema>;