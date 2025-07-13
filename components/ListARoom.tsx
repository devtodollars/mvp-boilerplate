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
import { MapPin, Euro, Home, Upload, X } from "lucide-react"
import { useState } from "react"

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

const BER_RATINGS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2", "E1", "E2", "F", "G"]

const AMENITIES = [
    "Wi-Fi",
    "Parking",
    "Garden Access",
    "Balcony/Terrace",
    "Washing Machine",
    "Dryer",
    "Dishwasher",
    "Microwave",
    "TV",
    "Central Heating",
    "Fireplace",
    "Air Conditioning",
    "Gym Access",
    "Swimming Pool",
    "Storage Space",
    "Bike Storage",
    "Furnished",
    "Unfurnished",
    "Pet Friendly",
    "Smoking Allowed",
]

const NEARBY_FACILITIES = [
    "Bus Stop",
    "Train Station",
    "DART Station",
    "Luas Stop",
    "Shopping Centre",
    "Supermarket",
    "Pharmacy",
    "Hospital",
    "GP Clinic",
    "Primary School",
    "Secondary School",
    "University/College",
    "Library",
    "Post Office",
    "Bank",
    "Restaurant/Café",
    "Pub",
    "Gym/Fitness Centre",
    "Park",
    "Beach",
]

export default function PostRoomPage() {
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
    const [uploadedImages, setUploadedImages] = useState<File[]>([])
    const [uploadedVideos, setUploadedVideos] = useState<File[]>([])

    const handleAmenityToggle = (amenity: string) => {
        setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))
    }

    const handleFacilityToggle = (facility: string) => {
        setSelectedFacilities((prev) =>
            prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility],
        )
    }

    const removeImage = (index: number) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    }

    const removeVideo = (index: number) => {
        setUploadedVideos((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Room</h1>
                    <p className="text-gray-600">Create a detailed listing for your room rental</p>
                </div>

                <form className="space-y-8">
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
                                    <Label htmlFor="street">Street Address *</Label>
                                    <Input id="street" placeholder="123 Main Street" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">Area</Label>
                                    <Input id="area" placeholder="e.g., Dublin 1, City Centre" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City/Town *</Label>
                                    <Input id="city" placeholder="Dublin" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="county">County *</Label>
                                    <Select required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {IRISH_COUNTIES.map((county) => (
                                                <SelectItem key={county} value={county.toLowerCase()}>
                                                    {county}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eircode">Eircode</Label>
                                    <Input id="eircode" placeholder="D01 A1B2" />
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
                                    <Input id="rent" type="number" placeholder="800" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Rent Collection Frequency *</Label>
                                    <Select required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deposit">Security Deposit (€) *</Label>
                                    <Input id="deposit" type="number" placeholder="800" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease">Lease Duration *</Label>
                                    <Select required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3-months">3 Months</SelectItem>
                                            <SelectItem value="6-months">6 Months</SelectItem>
                                            <SelectItem value="1-year">1 Year</SelectItem>
                                            <SelectItem value="2-years">2 Years</SelectItem>
                                            <SelectItem value="open-ended">Open-ended</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                    <Label htmlFor="room-type">Room Type *</Label>
                                    <Select required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select room type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single Room</SelectItem>
                                            <SelectItem value="double">Double Room</SelectItem>
                                            <SelectItem value="ensuite">Ensuite Room</SelectItem>
                                            <SelectItem value="studio">Studio</SelectItem>
                                            <SelectItem value="bedsit">Bedsit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tenants">Number of Tenants Sharing *</Label>
                                    <Input id="tenants" type="number" placeholder="2" min="0" required />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Owner Occupancy *</Label>
                                <RadioGroup defaultValue="" className="flex gap-6">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="owner-yes" />
                                        <Label htmlFor="owner-yes">Yes, owner lives on property</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="owner-no" />
                                        <Label htmlFor="owner-no">No, owner does not live on property</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ber-rating">BER Rating</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select BER rating" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BER_RATINGS.map((rating) => (
                                                <SelectItem key={rating} value={rating}>
                                                    {rating}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ber-number">BER Certificate Number</Label>
                                    <Input id="ber-number" placeholder="123456789" />
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
                                    {AMENITIES.map((amenity) => (
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
                                    {NEARBY_FACILITIES.map((facility) => (
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
                                        // onChange={handleImageUpload}
                                        />
                                        <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                                    </div>
                                </div>
                                {uploadedImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {uploadedImages.map((file, index) => (
                                            <div key={index} className="relative">
                                                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-sm text-gray-600 text-center p-2">{file.name}</span>
                                                </div>
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
                                        // onChange={handleVideoUpload}
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="house-rules">House Rules & Preferences</Label>
                                <Textarea
                                    id="house-rules"
                                    placeholder="Specify any house rules, pet policy, smoking policy, preferred tenant type, etc..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" size="lg">
                            Save as Draft
                        </Button>
                        <Button type="submit" size="lg" className="px-8">
                            Publish Listing
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
