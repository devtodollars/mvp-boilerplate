"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Euro, Home, Upload, X, CalendarIcon, Clock, Plus, Trash2, AlertCircle, Lock, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateListingSchema, UpdateListing,
  PROPERTY_TYPE_ENUM_VALUES,
  ROOM_TYPE_ENUM_VALUES,
  AMENITY_TYPE_ENUM_VALUES,
  BER_RATING_ENUM_VALUES,
  LEASE_DURATION_ENUM_VALUES,
  RENT_FREQUENCY_ENUM_VALUES,
  NEARBY_FACILITY_ENUM_VALUES,
} from "@/schemas/listing"
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/utils/cn";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/components/providers/AuthProvider";
import type { Database } from '@/types_db';

const IRISH_COUNTIES = [
    "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down", "Dublin",
    "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth",
    "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"
]

type Listing = Database['public']['Tables']['listings']['Row'];

interface EditListingProps {
  listing: Listing;
}

function CalendarComponent({ selected, onSelect, disabled }: { selected?: Date, onSelect: (date: Date) => void, disabled?: (date: Date) => boolean }) {
  const [currentMonth, setCurrentMonth] = useState(() => selected ? new Date(selected) : new Date());
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
  
  return (
    <div className="w-64 p-2 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 rounded hover:bg-gray-100">
          <CalendarIcon className="w-4 h-4" />
        </button>
        <span className="font-semibold">
          {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
        </span>
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 rounded hover:bg-gray-100">
          <CalendarIcon className="w-4 h-4 rotate-180" />
        </button>
      </div>
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

export default function EditListing({ listing }: EditListingProps) {
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
    const [uploadedImages, setUploadedImages] = useState<File[]>([])
    const [uploadedVideos, setUploadedVideos] = useState<File[]>([])
    const [existingImages, setExistingImages] = useState<string[]>([])
    const [existingVideos, setExistingVideos] = useState<string[]>([])
    const { toast } = useToast();
    const router = useRouter();
    
    // Get user from AuthProvider context at the top level
    const { user } = useAuth();

    // Initialize state from listing data
    useEffect(() => {
        if (Array.isArray(listing.amenities)) {
            setSelectedAmenities(listing.amenities.filter(item => typeof item === 'string') as string[]);
        }
        if (Array.isArray(listing.nearby_facilities)) {
            setSelectedFacilities(listing.nearby_facilities.filter(item => typeof item === 'string') as string[]);
        }
        if (Array.isArray(listing.images)) {
            setExistingImages(listing.images.filter(item => typeof item === 'string') as string[]);
        }
        if (Array.isArray(listing.videos)) {
            setExistingVideos(listing.videos.filter(item => typeof item === 'string') as string[]);
        }
    }, [listing]);

    // Parse viewing times from the listing
    const parseViewingTimes = (viewingTimes: string[] | null): ViewingTime[] => {
        if (!viewingTimes) return [];
        return viewingTimes.map((time, index) => {
            const date = new Date(time);
            return {
                date: format(date, "yyyy-MM-dd"),
                time: format(date, "HH:mm"),
                id: `${date.getTime()}-${format(date, "HH:mm")}`,
            };
        });
    };

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
        watch,
        reset
    } = useForm({
        resolver: zodResolver(updateListingSchema),
        defaultValues: {
            property_type: listing.property_type || PROPERTY_TYPE_ENUM_VALUES[0],
            room_type: listing.room_type || ROOM_TYPE_ENUM_VALUES[0],
            rent_frequency: listing.rent_frequency || RENT_FREQUENCY_ENUM_VALUES[0],
            lease_duration: listing.lease_duration || LEASE_DURATION_ENUM_VALUES[0],
            ber_rating: listing.ber_rating || BER_RATING_ENUM_VALUES[0],
            ensuite: listing.ensuite || false,
            address: listing.address || '',
            apartment_number: listing.apartment_number || '',
            area: listing.area || '',
            city: listing.city || '',
            county: listing.county || '',
            eircode: listing.eircode || '',
            monthly_rent: listing.monthly_rent || undefined,
            security_deposit: listing.security_deposit || undefined,
            available_from: listing.available_from || '',
            size: listing.size || undefined,
            description: listing.description || '',
            current_males: listing.current_males || 0,
            current_females: listing.current_females || 0,
            owner_occupied: listing.owner_occupied || false,
            pets: listing.pets || false,
            ber_cert_number: listing.ber_cert_number || '',
            amenities: listing.amenities || [],
            nearby_facilities: listing.nearby_facilities || [],
            house_rules: listing.house_rules || '',
            images: (listing.images as string[]) || [],
            videos: (listing.videos as string[]) || [],
            active: listing.active || false,
            viewing_times: listing.viewing_times || [],
        },
    });

    // Local state for viewing times
    interface ViewingTime { date: string; time: string; id: string; }
    const [viewingDate, setViewingDate] = useState<Date | undefined>();
    const [viewingTime, setViewingTime] = useState("");
    const [viewingTimes, setViewingTimes] = useState<ViewingTime[]>(parseViewingTimes(listing.viewing_times));

    // Time slots for viewing times
    const TIME_SLOTS = [
      "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"
    ];

    // Disable past dates for availability and viewing times
    const disablePastDates = (date: Date) => isBefore(date, startOfDay(new Date()));

    const addViewingTime = () => {
      if (viewingDate && viewingTime) {
        const newViewingTime: ViewingTime = {
          date: format(viewingDate, "yyyy-MM-dd"),
          time: viewingTime,
          id: `${viewingDate.getTime()}-${viewingTime}`,
        };
        // Prevent duplicates
        if (!viewingTimes.some(vt => vt.date === newViewingTime.date && vt.time === newViewingTime.time)) {
          setViewingTimes(prev => [...prev, newViewingTime]);
          setViewingTime("");
        }
      }
    };
    
    const removeViewingTime = (id: string) => {
      setViewingTimes(prev => prev.filter(vt => vt.id !== id));
    };

    // Sync amenities/facilities state with form
    const handleAmenityToggle = (amenity: string) => {
        setSelectedAmenities((prev) => {
            const updated = prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity];
            setValue("amenities", updated as any);
            return updated;
        });
    };
    
    const handleFacilityToggle = (facility: string) => {
        setSelectedFacilities((prev) => {
            const updated = prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility];
            setValue("nearby_facilities", updated as any);
            return updated;
        });
    };

    const removeImage = (index: number) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index))
    }

    const removeVideo = (index: number) => {
        setExistingVideos((prev) => prev.filter((_, i) => i !== index))
    }

    const removeNewImage = (index: number) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    }

    const removeNewVideo = (index: number) => {
        setUploadedVideos((prev) => prev.filter((_, i) => i !== index))
    }

    // Add onChange handlers for file inputs
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedImages(files);
        }
    };
    
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedVideos(files);
        }
    };

    // Update listing handler
    const onSubmit = async (data: UpdateListing) => {
        try {
            const supabase = createClient();
            if (!user) {
                toast({ title: 'Error', description: 'You must be signed in to edit a listing.', variant: 'destructive' });
                return;
            }

            // Upload new images and videos if any
            let newImageUrls: string[] = [];
            let newVideoUrls: string[] = [];
            
            if (uploadedImages.length > 0) {
                newImageUrls = await uploadListingMedia(uploadedImages, 'listing-images');
            }
            if (uploadedVideos.length > 0) {
                newVideoUrls = await uploadListingMedia(uploadedVideos, 'listing-videos');
            }

            // Combine existing and new media
            const allImages = [...existingImages, ...newImageUrls];
            const allVideos = [...existingVideos, ...newVideoUrls];

            // Update the listing
            const { data: updatedListing, error } = await supabase
                .from('listings')
                .update({
                    ...data,
                    images: allImages,
                    videos: allVideos,
                    viewing_times: viewingTimes.map(vt => `${vt.date}T${vt.time}:00.000Z`),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', listing.id)
                .select()
                .single();

            if (error) {
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to update listing',
                    variant: 'destructive',
                });
            } else {
                toast({ title: 'Success', description: 'Listing updated successfully!' });
                router.push('/dashboard');
            }
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : String(err) || 'Failed to update listing', variant: 'destructive' });
        }
    };

    // Helper function to upload media (copied from listings.ts)
    async function uploadListingMedia(files: File[], bucket: string): Promise<string[]> {
        const supabase = createClient();
        const urls: string[] = [];
        for (const file of files) {
            const filePath = `${Date.now()}-${file.name}`;
            const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });
            if (error) throw error;
            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            urls.push(data.publicUrl);
        }
        return urls;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Listing</h1>
                    <p className="text-gray-600">Update your room rental listing details</p>
                </div>

                {/* Address Change Warning */}
                <Card className="mb-8 border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <Lock className="h-5 w-5" />
                            Address Information Locked
                        </CardTitle>
                        <CardDescription className="text-amber-700">
                            Address details cannot be changed to prevent pricing abuse. If you need to change the address, please contact support.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-amber-700">
                            <Info className="h-4 w-4" />
                            <span>Contact support at support@golet.ie for address changes</span>
                        </div>
                    </CardContent>
                </Card>

                <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                    {/* Location Details - Read Only */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Location Details
                            </CardTitle>
                            <CardDescription>Address information is locked to prevent pricing abuse</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Input 
                                        id="address" 
                                        value={listing.address} 
                                        disabled 
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">Area</Label>
                                    <Input 
                                        id="area" 
                                        value={listing.area || ''} 
                                        disabled 
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City/Town</Label>
                                    <Input 
                                        id="city" 
                                        value={listing.city} 
                                        disabled 
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="county">County</Label>
                                    <Input 
                                        id="county" 
                                        value={listing.county} 
                                        disabled 
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eircode">Eircode</Label>
                                    <Input 
                                        id="eircode" 
                                        value={listing.eircode || ''} 
                                        disabled 
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing and Rental Terms */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Euro className="h-5 w-5" />
                                Pricing & Rental Terms
                            </CardTitle>
                            <CardDescription>Update your rental price and terms</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rent">Monthly Rent (€) *</Label>
                                    <Input id="rent" type="number" placeholder="800" {...register("monthly_rent", { valueAsNumber: true })} />
                                    {errors.monthly_rent && <span className="text-red-500 text-xs">{errors.monthly_rent.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Rent Collection Frequency *</Label>
                                    <Controller
                                        name="rent_frequency"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RENT_FREQUENCY_ENUM_VALUES.map((frequency) => (
                                                        <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.rent_frequency && <span className="text-red-500 text-xs">{errors.rent_frequency.message}</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deposit">Security Deposit (€) *</Label>
                                    <Input id="deposit" type="number" placeholder="800" {...register("security_deposit", { valueAsNumber: true })} />
                                    {errors.security_deposit && <span className="text-red-500 text-xs">{errors.security_deposit.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease">Lease Duration *</Label>
                                    <Controller
                                        name="lease_duration"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LEASE_DURATION_ENUM_VALUES.map((duration) => (
                                                        <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.lease_duration && <span className="text-red-500 text-xs">{errors.lease_duration.message}</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Room and Property Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Room & Property Details
                            </CardTitle>
                            <CardDescription>Update your room and property information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room_type">Room Type *</Label>
                                    <Controller
                                        name="room_type"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select room type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROOM_TYPE_ENUM_VALUES.map((type) => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.room_type && <span className="text-red-500 text-xs">{errors.room_type.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ensuite">Ensuite</Label>
                                    <div className="flex flex-col items-start gap-1">
                                        <Controller
                                            name="ensuite"
                                            control={control}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    id="ensuite"
                                                />
                                            )}
                                        />
                                        <span className="text-sm text-gray-600">Ensuite bathroom</span>
                                    </div>
                                    {errors.ensuite && <span className="text-red-500 text-xs">{errors.ensuite.message}</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_males">Current Males</Label>
                                    <Input id="current_males" type="number" min="0" {...register("current_males", { valueAsNumber: true })} />
                                    {errors.current_males && <span className="text-red-500 text-xs">{errors.current_males.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current_females">Current Females</Label>
                                    <Input id="current_females" type="number" min="0" {...register("current_females", { valueAsNumber: true })} />
                                    {errors.current_females && <span className="text-red-500 text-xs">{errors.current_females.message}</span>}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label>Owner Occupied *</Label>
                                <Controller
                                    name="owner_occupied"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup value={field.value ? "yes" : "no"} onValueChange={val => field.onChange(val === "yes") } className="flex gap-6">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id="owner-yes" />
                                                <Label htmlFor="owner-yes">Yes, owner lives on property</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id="owner-no" />
                                                <Label htmlFor="owner-no">No, owner does not live on property</Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                                {errors.owner_occupied && <span className="text-red-500 text-xs">{errors.owner_occupied.message}</span>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ber_rating">BER Rating</Label>
                                    <Controller
                                        name="ber_rating"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select BER rating" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BER_RATING_ENUM_VALUES.map((rating) => (
                                                        <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.ber_rating && <span className="text-red-500 text-xs">{errors.ber_rating.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ber_cert_number">BER Certificate Number</Label>
                                    <Input id="ber_cert_number" placeholder="123456789" {...register("ber_cert_number")} />
                                    {errors.ber_cert_number && <span className="text-red-500 text-xs">{errors.ber_cert_number.message}</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Facilities and Amenities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Facilities & Amenities</CardTitle>
                            <CardDescription>Update available amenities and nearby facilities</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-base font-medium mb-3 block">Available Amenities</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {AMENITY_TYPE_ENUM_VALUES.map((amenity) => (
                                        <div key={amenity} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`amenity-${amenity}`}
                                                checked={selectedAmenities.includes(amenity)}
                                                onCheckedChange={() => handleAmenityToggle(amenity)}
                                            />
                                            <Label htmlFor={`amenity-${amenity}`} className="text-sm">
                                                {amenity}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {selectedAmenities.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedAmenities.map((amenity) => (
                                            <Badge key={amenity} variant="secondary">
                                                {amenity}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-base font-medium mb-3 block">Nearby Facilities</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {NEARBY_FACILITY_ENUM_VALUES.map((facility) => (
                                        <div key={facility} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`facility-${facility}`}
                                                checked={selectedFacilities.includes(facility)}
                                                onCheckedChange={() => handleFacilityToggle(facility)}
                                            />
                                            <Label htmlFor={`facility-${facility}`} className="text-sm">
                                                {facility}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {selectedFacilities.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedFacilities.map((facility) => (
                                            <Badge key={facility} variant="outline">
                                                {facility}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                            <CardDescription>Manage existing and upload new photos and videos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div>
                                    <Label className="text-base font-medium mb-3 block">Existing Photos</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {existingImages.map((imageUrl, index) => (
                                            <div key={index} className="relative">
                                                <img src={imageUrl} alt={`Existing image ${index + 1}`} className="w-full h-32 object-cover rounded" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Images */}
                            <div>
                                <Label className="text-base font-medium mb-3 block">Add New Photos</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <div className="space-y-2">
                                        <Label htmlFor="new-images" className="cursor-pointer text-blue-600 hover:text-blue-500">
                                            Click to upload new images
                                        </Label>
                                        <Input
                                            id="new-images"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                        <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                                    </div>
                                </div>
                                {uploadedImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {uploadedImages.map((file, index) => (
                                            <div key={index} className="relative">
                                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-32 object-cover rounded" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                    onClick={() => removeNewImage(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Existing Videos */}
                            {existingVideos.length > 0 && (
                                <div>
                                    <Label className="text-base font-medium mb-3 block">Existing Videos</Label>
                                    <div className="space-y-2">
                                        {existingVideos.map((videoUrl, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Video {index + 1}</span>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => removeVideo(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Videos */}
                            <div>
                                <Label className="text-base font-medium mb-3 block">Add New Videos (Optional)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <div className="space-y-2">
                                        <Label htmlFor="new-videos" className="cursor-pointer text-blue-600 hover:text-blue-500">
                                            Click to upload new videos
                                        </Label>
                                        <Input
                                            id="new-videos"
                                            type="file"
                                            multiple
                                            accept="video/*"
                                            className="hidden"
                                            onChange={handleVideoUpload}
                                        />
                                        <p className="text-sm text-gray-500">MP4, MOV up to 50MB each</p>
                                    </div>
                                </div>
                                {uploadedVideos.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {uploadedVideos.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm text-gray-600">{file.name}</span>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => removeNewVideo(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Availability */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Availability</CardTitle>
                            <CardDescription>Update when the room is available and manage viewing times</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Available From *</Label>
                                <Controller
                                  name="available_from"
                                  control={control}
                                  render={({ field }) => (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value && "text-muted-foreground",
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <div className="p-2">
                                          <CalendarComponent
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={date => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                                            disabled={disablePastDates}
                                          />
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                />
                                {errors.available_from && (
                                  <span className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.available_from.message}
                                  </span>
                                )}
                            </div>
                            
                            {/* Viewing Times */}
                            <div className="space-y-4">
                              <Label className="text-sm font-medium">Viewing Times</Label>
                              <div className="p-4 border rounded-lg bg-slate-50/50">
                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                  <div className="flex-1">
                                    <Label className="text-xs text-slate-600 mb-1 block">Select Date</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !viewingDate && "text-muted-foreground",
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {viewingDate ? format(viewingDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <div className="p-2">
                                          <CalendarComponent
                                            selected={viewingDate}
                                            onSelect={setViewingDate}
                                            disabled={disablePastDates}
                                          />
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <div className="flex-1">
                                    <Label className="text-xs text-slate-600 mb-1 block">Select Time</Label>
                                    <Select value={viewingTime} onValueChange={setViewingTime}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select time">
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {viewingTime || "Select time"}
                                          </div>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TIME_SLOTS.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={addViewingTime}
                                    disabled={!viewingDate || !viewingTime}
                                    className="flex items-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                              {viewingTimes.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-slate-600">Scheduled Viewing Times</Label>
                                  <div className="grid gap-2">
                                    {viewingTimes.map((vt) => (
                                      <div key={vt.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <CalendarIcon className="h-4 w-4 text-slate-500" />
                                          <span className="text-sm font-medium">{format(new Date(vt.date), "EEE, MMM d, yyyy")}</span>
                                          <Clock className="h-4 w-4 text-slate-500" />
                                          <span className="text-sm">{vt.time}</span>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeViewingTime(vt.id)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                            <CardDescription>Update additional details, house rules, or preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Property Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your room and property in detail. Include any special features, nearby attractions, or other relevant information..."
                                    className="min-h-[120px]"
                                    {...register("description")}
                                />
                                {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="house-rules">House Rules & Preferences</Label>
                                <Textarea
                                    id="house-rules"
                                    placeholder="Specify any house rules, pet policy, smoking policy, preferred tenant type, etc..."
                                    className="min-h-[100px]"
                                    {...register("house_rules")}
                                />
                                {errors.house_rules && <span className="text-red-500 text-xs">{errors.house_rules.message}</span>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" size="lg" onClick={() => router.push('/dashboard')}>
                            Cancel
                        </Button>
                        <Button type="submit" size="lg" className="px-8" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Updating...
                              </>
                            ) : (
                              "Update Listing"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
} 