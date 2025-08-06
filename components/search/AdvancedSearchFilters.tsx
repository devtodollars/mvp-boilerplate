"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  Filter, 
  X, 
  MapPin, 
  Euro, 
  Users, 
  Home, 
  Wifi, 
  Car, 
  Utensils, 
  Dumbbell,
  PawPrint,
  Calendar,
  Star,
  SlidersHorizontal
} from "lucide-react"

export interface SearchFilters {
  // Location
  location: string
  county: string
  city: string
  
  // Price
  minPrice: number
  maxPrice: number
  
  // Property details
  propertyType: string
  roomType: string
  size: number
  
  // Occupancy
  currentOccupants: number
  maxOccupants: number
  
  // Amenities
  amenities: string[]
  
  // Special features
  ensuite: boolean
  pets: boolean
  ownerOccupied: boolean
  
  // Availability
  availableFrom: string
  
  // Verification
  verifiedOnly: boolean
  
  // Viewing times
  hasViewingTimes: boolean
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearFilters: () => void
  totalResults: number
}

const COUNTIES = [
  "Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny", 
  "Wicklow", "Wexford", "Carlow", "Kildare", "Laois", "Offaly",
  "Westmeath", "Longford", "Meath", "Louth", "Monaghan", "Cavan",
  "Leitrim", "Sligo", "Mayo", "Roscommon", "Clare", "Tipperary",
  "Kerry", "Donegal"
]

const PROPERTY_TYPES = [
  "Apartment", "House", "Studio", "Townhouse", "Duplex", "Penthouse"
]

const ROOM_TYPES = [
  "Single", "Double", "Twin", "Triple", "Quad"
]

const AMENITIES = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "kitchen", label: "Kitchen", icon: Utensils },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "pets", label: "Pet Friendly", icon: PawPrint },
  { id: "ensuite", label: "Ensuite", icon: Home },
  { id: "balcony", label: "Balcony", icon: Home },
  { id: "garden", label: "Garden", icon: Home },
  { id: "washing_machine", label: "Washing Machine", icon: Home },
  { id: "dishwasher", label: "Dishwasher", icon: Home },
  { id: "air_conditioning", label: "Air Conditioning", icon: Home },
  { id: "heating", label: "Heating", icon: Home }
]

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults
}: AdvancedSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onClearFilters()
    setIsOpen(false)
  }

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value !== ''
    if (typeof value === 'number') return value > 0
    if (typeof value === 'boolean') return value === true
    return false
  }).length

  return (
    <>
      {/* Mobile Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Search Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} active
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            <FilterContent 
              filters={filters} 
              onFiltersChange={onFiltersChange}
              onClearFilters={clearFilters}
              totalResults={totalResults}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </span>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FilterContent 
              filters={filters} 
              onFiltersChange={onFiltersChange}
              onClearFilters={clearFilters}
              totalResults={totalResults}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function FilterContent({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults
}: {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearFilters: () => void
  totalResults: number
}) {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value !== ''
    if (typeof value === 'number') return value > 0
    if (typeof value === 'boolean') return value === true
    return false
  }).length

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {totalResults} properties found
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <div className="space-y-2">
          <Input
            placeholder="Enter location..."
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
          />
          <Select value={filters.county} onValueChange={(value) => updateFilter('county', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {COUNTIES.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Euro className="h-4 w-4" />
          Price Range (€/month)
        </Label>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => updateFilter('minPrice', Number(e.target.value) || 0)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => updateFilter('maxPrice', Number(e.target.value) || 0)}
            />
          </div>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]: [number, number]) => {
              updateFilter('minPrice', min)
              updateFilter('maxPrice', max)
            }}
            max={5000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>€{filters.minPrice}</span>
            <span>€{filters.maxPrice}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Property Type
        </Label>
        <RadioGroup value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
          {PROPERTY_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem value={type} id={type} />
              <Label htmlFor={type}>{type}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Room Type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Room Type
        </Label>
        <RadioGroup value={filters.roomType} onValueChange={(value) => updateFilter('roomType', value)}>
          {ROOM_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem value={type} id={type} />
              <Label htmlFor={type}>{type}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="space-y-3">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {AMENITIES.map((amenity) => {
            const Icon = amenity.icon
            const isSelected = filters.amenities.includes(amenity.id)
            
            return (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilter('amenities', [...filters.amenities, amenity.id])
                    } else {
                      updateFilter('amenities', filters.amenities.filter(id => id !== amenity.id))
                    }
                  }}
                />
                <Label htmlFor={amenity.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Icon className="h-4 w-4" />
                  {amenity.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Special Features */}
      <div className="space-y-3">
        <Label>Special Features</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ensuite"
              checked={filters.ensuite}
              onCheckedChange={(checked) => updateFilter('ensuite', checked)}
            />
            <Label htmlFor="ensuite" className="cursor-pointer">Ensuite</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pets"
              checked={filters.pets}
              onCheckedChange={(checked) => updateFilter('pets', checked)}
            />
            <Label htmlFor="pets" className="cursor-pointer">Pet Friendly</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ownerOccupied"
              checked={filters.ownerOccupied}
              onCheckedChange={(checked) => updateFilter('ownerOccupied', checked)}
            />
            <Label htmlFor="ownerOccupied" className="cursor-pointer">Owner Occupied</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Available From
        </Label>
        <Input
          type="date"
          value={filters.availableFrom}
          onChange={(e) => updateFilter('availableFrom', e.target.value)}
        />
      </div>

      <Separator />

      {/* Verification */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Verification
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verifiedOnly"
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) => updateFilter('verifiedOnly', checked)}
          />
          <Label htmlFor="verifiedOnly" className="cursor-pointer">Verified properties only</Label>
        </div>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={onClearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  )
} 