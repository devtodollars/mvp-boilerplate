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
import { MapPin, Euro, Home, Upload, X, CalendarIcon, Clock, Plus, Trash2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createListingSchema, CreateListing,
  PROPERTY_TYPE_ENUM_VALUES,
  ROOM_TYPE_ENUM_VALUES,
  AMENITY_TYPE_ENUM_VALUES,
  BER_RATING_ENUM_VALUES,
  LEASE_DURATION_ENUM_VALUES,
  RENT_FREQUENCY_ENUM_VALUES,
  NEARBY_FACILITY_ENUM_VALUES,
} from "@/schemas/listing"
import { createListing } from '@/utils/supabase/listings';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/utils/cn";
import { AddressAutocomplete } from "@/components/mapbox/AddressAutocomplete";

const IRISH_COUNTIES = [
  "Antrim",
  "Armagh",
  "Carlow",
  "Cavan",
  "Clare",
  "Cork",
  "Derry",
  "Donegal",
  "Down",
  "Dublin",
  "Fermanagh",
  "Galway",
  "Kerry",
  "Kildare",
  "Kilkenny",
  "Laois",
  "Leitrim",
  "Limerick",
  "Longford",
  "Louth",
  "Mayo",
  "Meath",
  "Monaghan",
  "Offaly",
  "Roscommon",
  "Sligo",
  "Tipperary",
  "Tyrone",
  "Waterford",
  "Westmeath",
  "Wexford",
  "Wicklow",
]

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

// Helper to geocode address or eircode with better Irish Eircode support
async function geocodeAddress(address: string, eircode: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.error('Mapbox token not found');
    return null;
  }

  console.log('Geocoding attempt:', { address, eircode });

  // Try multiple geocoding strategies for better accuracy
  const strategies = [];

  // Strategy 1: Eircode only (most precise for Irish addresses)
  if (eircode && eircode.trim()) {
    strategies.push({
      name: 'Eircode only',
      url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(eircode.trim())}.json?country=IE&types=postcode&access_token=${token}`
    });
  }

  // Strategy 2: Full address with Eircode
  if (address && address.trim()) {
    const fullAddress = [address, eircode].filter(Boolean).join(', ');
    strategies.push({
      name: 'Full address with Eircode',
      url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?country=IE&access_token=${token}`
    });
  }

  // Strategy 3: Address with "Ireland" suffix
  if (address && address.trim()) {
    const addressWithCountry = `${address.trim()}, Ireland`;
    strategies.push({
      name: 'Address with Ireland suffix',
      url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressWithCountry)}.json?country=IE&access_token=${token}`
    });
  }

  // Strategy 4: Eircode with "Ireland" suffix
  if (eircode && eircode.trim()) {
    const eircodeWithCountry = `${eircode.trim()}, Ireland`;
    strategies.push({
      name: 'Eircode with Ireland suffix',
      url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(eircodeWithCountry)}.json?country=IE&access_token=${token}`
    });
  }

  // Try each strategy in order
  for (const strategy of strategies) {
    try {
      console.log(`Trying strategy: ${strategy.name}`);
      const response = await fetch(strategy.url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const result = { lat, lng };

        console.log(`✅ Success with ${strategy.name}:`, {
          query: strategy.url.split('?')[0].split('/').pop(),
          result,
          place_name: data.features[0].place_name,
          relevance: data.features[0].relevance
        });

        return result;
      } else {
        console.log(`❌ No results for ${strategy.name}`);
      }
    } catch (error) {
      console.error(`Error with ${strategy.name}:`, error);
    }
  }

  console.error('❌ All geocoding strategies failed');
  return null;
}

export default function PostRoomPage() {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([])
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      property_type: PROPERTY_TYPE_ENUM_VALUES[0],
      room_type: ROOM_TYPE_ENUM_VALUES[0],
      rent_frequency: RENT_FREQUENCY_ENUM_VALUES[0],
      lease_duration: LEASE_DURATION_ENUM_VALUES[0],
      ber_rating: BER_RATING_ENUM_VALUES[0],
      ensuite: false,
      address: '',
      apartment_number: '',
      area: '',
      city: '',
      county: '',
      eircode: '',
      monthly_rent: undefined,
      security_deposit: undefined,
      available_from: '',
      size: null,
      description: '',
      current_males: 0,
      current_females: 0,
      owner_occupied: false,
      pets: false,
      ber_cert_number: '',
      amenities: [],
      nearby_facilities: [],
      house_rules: '',
      images: [],
      videos: [],
      active: false,
      viewing_times: [],
    },
  });

  // Local state for viewing times
  interface ViewingTime { date: string; time: string; id: string; }
  const [viewingDate, setViewingDate] = useState<Date | undefined>();
  const [viewingTime, setViewingTime] = useState("");
  const [viewingTimes, setViewingTimes] = useState<ViewingTime[]>([]);

  // Time slots for viewing times
  const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
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
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setUploadedVideos((prev) => prev.filter((_, i) => i !== index))
  }

  // Add onChange handlers for file inputs
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedImages(files);
      // For now, just store file names in form state (will upload later)
      setValue("images", files.map(f => f.name));
    }
  };
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedVideos(files);
      setValue("videos", files.map(f => f.name));
    }
  };

  // Submission handler for publish (full validation)
  const onSubmit = async (data: CreateListing) => {
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        toast({ title: 'Error', description: 'You must be signed in to post a listing.', variant: 'destructive' });
        return;
      }
      // Geocode address/eircode for lat/lng
      const coords = await geocodeAddress(data.address, data.eircode);
      if (!coords) {
        toast({
          title: 'Geocoding Error',
          description: `Could not determine location from address: "${data.address}" or eircode: "${data.eircode}". Please check the address and eircode are correct. You can also try adding "Ireland" to the address or check the console for debugging information.`,
          variant: 'destructive'
        });
        return;
      }
      // property_name is required by DB, use address for now
      const { size, ...dataWithoutSize } = data;
      const listingData = {
        ...dataWithoutSize,
        property_name: data.address,
        user_id: user.id,
        viewing_times: viewingTimes.map(vt => `${vt.date}T${vt.time}:00.000Z`),
        lat: coords.lat,
        lng: coords.lng,
      };

      // Only include size if it has a valid number value
      if (size && typeof size === 'number' && size > 0) {
        listingData.size = size;
      }

      const { data: listing, error } = await createListing(
        listingData,
        uploadedImages,
        uploadedVideos
      );
      if (error) {
        toast({
          title: 'Error',
          description:
            typeof error === 'object' && error !== null && 'message' in error
              ? (error.message as string)
              : String(error) || 'Failed to create listing',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Listing published successfully!' });
        // Optionally reset form or redirect
        reset();
        setUploadedImages([]);
        setUploadedVideos([]);
        setViewingTimes([]);
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : String(err) || 'Failed to create listing', variant: 'destructive' });
    }
  };
  // Save as Draft handler (skip validation, just save current values)
  const onSaveDraft = () => {
    const data = watch();
    // Mark as draft
    data.active = false;
    console.log("Save as Draft", data);
    // TODO: Add Supabase CRUD and media upload logic for draft
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Room</h1>
          <p className="text-gray-600">Create a detailed listing for your room rental</p>
        </div>
        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Details
              </CardTitle>
              <CardDescription>Provide the complete address and location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  {/* Replace Input with AddressAutocomplete */}
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <AddressAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        onSelect={(val, data) => {
                          // Helper to extract context values
                          const getContext = (type: string) =>
                            data.context?.find((c: any) => c.id.startsWith(type))?.text || '';

                          // Street address (first part of place_name or text)
                          const street = data.text || val.split(',')[0] || '';
                          // Area (neighborhood or locality)
                          const area =
                            getContext('neighborhood') ||
                            getContext('locality') ||
                            '';
                          // City (place)
                          const city =
                            data.place_type?.includes('place')
                              ? data.text
                              : getContext('place') || '';
                          // County (region)
                          const county = getContext('region');
                          // Eircode (postcode)
                          const eircode = getContext('postcode');

                          field.onChange(val);
                          setValue('address', street);
                          setValue('area', area);
                          setValue('city', city);
                          setValue('county', county);
                          setValue('eircode', eircode);
                        }}
                      />
                    )}
                  />
                  {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apartment_number">Apartment Number</Label>
                  <Input id="apartment_number" placeholder="e.g., Apt 4B, Unit 12" {...register("apartment_number")} />
                  {errors.apartment_number && <span className="text-red-500 text-xs">{errors.apartment_number.message}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Input id="area" placeholder="e.g., Dublin 1, City Centre" {...register("area")} />
                  {errors.area && <span className="text-red-500 text-xs">{errors.area.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type *</Label>
                  <Controller
                    name="property_type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPE_ENUM_VALUES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.property_type && <span className="text-red-500 text-xs">{errors.property_type.message}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City/Town *</Label>
                  <Input id="city" placeholder="Dublin" {...register("city")} />
                  {errors.city && <span className="text-red-500 text-xs">{errors.city.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County *</Label>
                  <Controller
                    name="county"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent>
                          {IRISH_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.county && <span className="text-red-500 text-xs">{errors.county.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eircode">Eircode</Label>
                  <Input id="eircode" placeholder="D01 A1B2" {...register("eircode")} />
                  {errors.eircode && <span className="text-red-500 text-xs">{errors.eircode.message}</span>}
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
              <CardDescription>Set your rental price and terms</CardDescription>
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
              <CardDescription>Describe your room and property</CardDescription>
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
                  <Label htmlFor="size">Room Size (m²)</Label>
                  <Input id="size" type="number" min="0" step="0.1" placeholder="e.g., 12.5" {...register("size", { valueAsNumber: true })} />
                  {errors.size && <span className="text-red-500 text-xs">{errors.size.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pets">Pets Allowed</Label>
                  <div className="flex flex-col items-start gap-1">
                    <Controller
                      name="pets"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="pets"
                        />
                      )}
                    />
                    <span className="text-sm text-gray-600">Allow pets in the property</span>
                  </div>
                  {errors.pets && <span className="text-red-500 text-xs">{errors.pets.message}</span>}
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
                    <RadioGroup value={field.value ? "yes" : "no"} onValueChange={val => field.onChange(val === "yes")} className="flex gap-6">
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
              <CardDescription>Select all available amenities and nearby facilities</CardDescription>
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
              <CardDescription>Upload photos and videos of your room and property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Photos *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="images" className="cursor-pointer text-blue-600 hover:text-blue-500">
                      Click to upload images
                    </Label>
                    <Input
                      id="images"
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
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Videos (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="videos" className="cursor-pointer text-blue-600 hover:text-blue-500">
                      Click to upload videos
                    </Label>
                    <Input
                      id="videos"
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
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeVideo(index)}>
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
              <CardDescription>Set when the room is available and add viewing times</CardDescription>
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
              <CardDescription>Provide any additional details, house rules, or preferences</CardDescription>
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
            <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={onSaveDraft}>
              Save as Draft
            </Button>
            <Button type="submit" size="lg" className="px-8" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Publishing...
                </>
              ) : (
                "Publish Listing"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
