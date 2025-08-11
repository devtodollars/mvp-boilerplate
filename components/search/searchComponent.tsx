"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, SlidersHorizontal, Heart, MapPin, List, Map, X, ChevronLeft, ChevronRight, Play, ArrowLeft, Filter } from "lucide-react"
import PropertyView from "./propertyView"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { fetchListings, debugListings, trackListingView } from "@/utils/supabase/listings"
import { getListingImages } from "@/utils/supabase/storage"
import { createClient } from "@/utils/supabase/client"
import { createApiClient } from "@/utils/supabase/api"
import { buildSupabaseQuery, parseNaturalLanguageQuery } from "./AISearchLogic"
import { SearchFilters } from "./AdvancedSearchFilters"
import AdvancedSearchFilters from "./AdvancedSearchFilters"
import EnhancedSearchBar from "./EnhancedSearchBar"
import dynamic from "next/dynamic";

const MapboxMap = dynamic(() => import("@/components/mapbox/MapboxMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
});

interface SearchComponentProps {
  searchQuery?: string
  filters?: SearchFilters
  onResultsUpdate?: (results: any[]) => void
}

export default function Component({ 
  searchQuery = "", 
  filters, 
  onResultsUpdate 
}: SearchComponentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState<string | undefined>(undefined)
  const [searchCleared, setSearchCleared] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [likedListings, setLikedListings] = useState<Set<string>>(new Set())
  const [likingListing, setLikingListing] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    location: '',
    county: '',
    city: '',
    minPrice: 0,
    maxPrice: 0,
    propertyType: '',
    roomType: '',
    size: 0,
    currentOccupants: 0,
    maxOccupants: 0,
    amenities: [],
    ensuite: false,
    pets: false,
    ownerOccupied: false,
    availableFrom: '',
    verifiedOnly: false,
    hasViewingTimes: false
  })
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean
    media: Array<{ url: string; type: "image" | "video" }>
    currentIndex: number
  }>({
    isOpen: false,
    media: [],
    currentIndex: 0,
  })

  // Use the searchQuery prop if provided, otherwise get from URL params, otherwise use local state
  const urlSearchQuery = searchParams.get('q') || ''
  const effectiveSearchQuery = useMemo(() => {
    // If localSearchQuery is explicitly set to empty string, ignore URL query
    if (localSearchQuery === "") {
      return ""
    }
    // If localSearchQuery is set (not undefined), use it (highest priority)
    if (localSearchQuery !== undefined) {
      return localSearchQuery
    }
    // Otherwise use searchQuery prop or URL query
    const query = searchQuery || urlSearchQuery
    return query
  }, [searchQuery, urlSearchQuery, localSearchQuery])

  // Read filter parameters from URL and memoize them
  const urlFilters = useMemo(() => {
    const filters: Partial<SearchFilters> = {}
    const urlCounty = searchParams.get('county')
    const urlPropertyType = searchParams.get('propertyType')
    const urlRoomType = searchParams.get('roomType')
    const urlMinPrice = searchParams.get('minPrice')
    const urlMaxPrice = searchParams.get('maxPrice')
    const urlPets = searchParams.get('pets')
    const urlEnsuite = searchParams.get('ensuite')
    const urlVerifiedOnly = searchParams.get('verifiedOnly')
    
    if (urlCounty) filters.county = urlCounty
    if (urlPropertyType) filters.propertyType = urlPropertyType
    if (urlRoomType) filters.roomType = urlRoomType
    if (urlMinPrice) filters.minPrice = parseInt(urlMinPrice)
    if (urlMaxPrice) filters.maxPrice = parseInt(urlMaxPrice)
    if (urlPets === 'true') filters.pets = true
    if (urlEnsuite === 'true') filters.ensuite = true
    if (urlVerifiedOnly === 'true') filters.verifiedOnly = true
    
    return filters
  }, [searchParams])

  // Use provided filters or URL filters
  const effectiveFilters = useMemo(() => {
    // If localSearchQuery is set (user is actively searching), ignore URL filters
    if (localSearchQuery !== undefined && localSearchQuery !== "") {
      return filters || {}
    }
    // If localSearchQuery is explicitly set to empty string, ignore URL filters
    if (localSearchQuery === "") {
      return filters || {}
    }
    return filters || urlFilters
  }, [filters, urlFilters, localSearchQuery])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check liked listings on mount
  useEffect(() => {
    const checkLikedListings = async () => {
      try {
        const supabase = createClient()
        const api = createApiClient(supabase)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check if liked_listings column exists, if not, skip
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (userData && (userData as any).liked_listings) {
            setLikedListings(new Set((userData as any).liked_listings))
          }
        }
      } catch (error) {
        console.error('Error checking liked listings:', error)
      }
    }

    checkLikedListings()
  }, [])

  // Fetch listings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        // Try the API route first (bypasses RLS)
        const response = await fetch('/api/listings')
        const result = await response.json()
        
        if (result.data && result.data.length > 0) {
          setListings(result.data)
          
          // Handle URL parameters for property selection and view mode
          const propertyId = searchParams.get('id')
          const viewModeParam = searchParams.get('view')
          
          if (propertyId) {
            const property = result.data.find((listing: any) => listing.id === propertyId)
            if (property) {
              setSelectedProperty(property)
              if (viewModeParam === 'detailed') {
                setViewMode('map')
              }
            } else {
              setSelectedProperty(result.data[0] || null)
            }
          } else {
            setSelectedProperty(result.data[0] || null)
          }
        } else {
          console.log('No listings found via API route, trying client-side...')
          
          // Fallback to client-side fetch
          const debugResult = await debugListings()
          console.log('Debug result:', debugResult)
          
          const { data, error } = await fetchListings()
          console.log('Client-side fetch result:', { data, error })
          
          if (!error && data) {
            setListings(data)
            
            // Handle URL parameters for property selection and view mode
            const propertyId = searchParams.get('id')
            const viewModeParam = searchParams.get('view')
            
            if (propertyId) {
              const property = data.find((listing: any) => listing.id === propertyId)
              if (property) {
                setSelectedProperty(property)
                if (viewModeParam === 'detailed') {
                  setViewMode('map')
                }
              } else {
                setSelectedProperty(data[0] || null)
              }
            } else {
              setSelectedProperty(data[0] || null)
            }
          } else {
            console.error('Error fetching listings:', error)
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error)
      }
      
      setLoading(false)
    }
    fetchData()
  }, [searchParams])

  // Apply filters and search
  useEffect(() => {
    if (!listings.length) {
      console.log('No listings available for filtering')
      return
    }

    let filtered = [...listings]
    
    // Apply search query - but don't apply text search if we parsed structured filters
    const parsedFilters = parseNaturalLanguageQuery(effectiveSearchQuery)
    const hasStructuredFilters = parsedFilters && (
      parsedFilters.roomType || 
      parsedFilters.propertyType || 
      parsedFilters.county || 
      parsedFilters.location ||
      parsedFilters.amenities?.length ||
      parsedFilters.pets ||
      parsedFilters.ensuite
    )
    
    // Always apply text search for location queries, even if they are parsed as structured filters
    const isLocationSearch = parsedFilters && (parsedFilters.location || parsedFilters.county)
    
    // If search was explicitly cleared, show all listings
    if (searchCleared) {
      console.log('Search was cleared, showing all listings')
      setFilteredListings(listings)
      if (onResultsUpdate) onResultsUpdate(listings)
      return
    }
    
    // Apply text search only if there's a search query
    if (effectiveSearchQuery && effectiveSearchQuery.trim() !== '') {
      if (effectiveSearchQuery && (!hasStructuredFilters || isLocationSearch)) {
        // Apply text search if we didn't extract structured filters, OR if it's a location search
        const query = effectiveSearchQuery.toLowerCase()
        const beforeCount = filtered.length
        console.log('Applying text search for:', query)
        filtered = filtered.filter(listing => 
          listing.property_name?.toLowerCase().includes(query) ||
          listing.address?.toLowerCase().includes(query) ||
          listing.city?.toLowerCase().includes(query) ||
          listing.area?.toLowerCase().includes(query) ||
          listing.description?.toLowerCase().includes(query)
        )
        console.log(`Text search results: ${beforeCount} -> ${filtered.length}`)
      } else if (hasStructuredFilters && !isLocationSearch) {
        console.log('Skipping text search because we have structured filters:', parsedFilters)
      }
    }
    
    console.log('Applying filters:', { effectiveSearchQuery, localSearchQuery, currentFilters, effectiveFilters, searchCleared })

    // Apply filters
    if (currentFilters || effectiveFilters) {
      const beforeCount = filtered.length
      const filtersToApply = { ...currentFilters, ...effectiveFilters }
      
      console.log('Applying filters:', filtersToApply)
      console.log('Current filters state:', currentFilters)
      console.log('Effective filters:', effectiveFilters)
      
      // Location filter
      if (filtersToApply.location) {
        const location = filtersToApply.location.toLowerCase()
        filtered = filtered.filter(listing =>
          listing.address?.toLowerCase().includes(location) ||
          listing.city?.toLowerCase().includes(location) ||
          listing.area?.toLowerCase().includes(location)
        )
      }

      // County filter
      if (filtersToApply.county) {
        console.log(`Applying county filter for: ${filtersToApply.county}`)
        const beforeCountyFilter = filtered.length
        filtered = filtered.filter(listing => {
          const matches = listing.county === filtersToApply.county
          console.log(`Listing ${listing.id}: county="${listing.county}", looking for "${filtersToApply.county}", matches: ${matches}`)
          return matches
        })
        console.log(`County filter results: ${beforeCountyFilter} -> ${filtered.length}`)
      }

      // Price filters
      if (filtersToApply.minPrice > 0) {
        filtered = filtered.filter(listing => 
          listing.monthly_rent >= filtersToApply.minPrice
        )
      }

      if (filtersToApply.maxPrice > 0) {
        filtered = filtered.filter(listing => 
          listing.monthly_rent <= filtersToApply.maxPrice
        )
      }

      // Property type filter
      if (filtersToApply.propertyType) {
        filtered = filtered.filter(listing => 
          listing.property_type === filtersToApply.propertyType
        )
      }

      // Room type filter
      if (filtersToApply.roomType) {
        filtered = filtered.filter(listing => {
          return listing.room_type === filtersToApply.roomType
        })
      }

      // Size filter
      if (filtersToApply.size > 0) {
        filtered = filtered.filter(listing => 
          listing.size >= filtersToApply.size
        )
      }

      // Special features
      if (filtersToApply.ensuite) {
        filtered = filtered.filter(listing => listing.ensuite === true)
      }

      if (filtersToApply.pets) {
        filtered = filtered.filter(listing => listing.pets === true)
      }

      if (filtersToApply.ownerOccupied) {
        filtered = filtered.filter(listing => listing.owner_occupied === true)
      }

      // Verification
      if (filtersToApply.verifiedOnly) {
        filtered = filtered.filter(listing => listing.verified === true)
      }

      // Availability
      if (filtersToApply.availableFrom) {
        filtered = filtered.filter(listing => {
          if (!listing.available_from) return false
          const availableDate = new Date(listing.available_from)
          const filterDate = new Date(filtersToApply.availableFrom)
          return availableDate <= filterDate
        })
      }

      // Viewing times
      if (filtersToApply.hasViewingTimes) {
        filtered = filtered.filter(listing => 
          listing.viewing_times && listing.viewing_times.length > 0
        )
      }

      // Amenities filter
      if (filtersToApply.amenities.length > 0) {
        filtered = filtered.filter(listing => {
          if (!listing.amenities || !Array.isArray(listing.amenities)) return false
          return filtersToApply.amenities.every(amenity => 
            listing.amenities.includes(amenity)
          )
        })
      }
      
    }

    setFilteredListings(filtered)
    
    // Update results count
    if (onResultsUpdate) {
      onResultsUpdate(filtered)
    }

  }, [listings, effectiveSearchQuery, currentFilters, onResultsUpdate])

  // Handle selected property updates separately to avoid infinite loops
  useEffect(() => {
    if (selectedProperty && !filteredListings.find(l => l.id === selectedProperty.id)) {
      setSelectedProperty(filteredListings[0] || null)
    }
  }, [filteredListings, selectedProperty])

  // Set initial search query when component mounts or searchQuery prop changes
  useEffect(() => {
    if (searchQuery && searchQuery !== localSearchQuery) {
      setLocalSearchQuery(searchQuery)
    }
  }, [searchQuery, localSearchQuery])

  // Initialize filters from URL parameters and parse search query
  useEffect(() => {
    if (filters) {
      setCurrentFilters(prev => ({
        ...prev,
        ...filters
      }))
    }
    
    // Parse search query to extract additional filters
    if (effectiveSearchQuery && effectiveSearchQuery.trim() !== '') {
      const parsedFilters = parseNaturalLanguageQuery(effectiveSearchQuery)
      
      setCurrentFilters(prev => ({
        ...prev,
        ...parsedFilters
      }))
    }
  }, [filters, effectiveSearchQuery])

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setCurrentFilters(newFilters)
  }

  const handleClearFilters = () => {
    setCurrentFilters({
      location: '',
      county: '',
      city: '',
      minPrice: 0,
      maxPrice: 0,
      propertyType: '',
      roomType: '',
      size: 0,
      currentOccupants: 0,
      maxOccupants: 0,
      amenities: [],
      ensuite: false,
      pets: false,
      ownerOccupied: false,
      availableFrom: '',
      verifiedOnly: false,
      hasViewingTimes: false
    })
    setLocalSearchQuery(undefined)
    setSearchCleared(true)
  }

  const handlePropertySelect = useCallback(async (property: any) => {
    setSelectedProperty(property)
    
    // Track view when property is selected
    if (property?.id) {
      try {
        await trackListingView(property.id);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }
    
    if (isClient && window.innerWidth < 1024) {
      setShowPropertyDetails(true)
    }
  }, [isClient])

  const handleMediaClick = (media: Array<{ url: string; type: "image" | "video" }>, index: number) => {
    setMediaModal({
      isOpen: true,
      media,
      currentIndex: index,
    })
  }

  const closeMediaModal = () => {
    setMediaModal({ isOpen: false, media: [], currentIndex: 0 })
  }

  const navigateMedia = (direction: "prev" | "next") => {
    setMediaModal((prev) => ({
      ...prev,
      currentIndex:
        direction === "next"
          ? (prev.currentIndex + 1) % prev.media.length
          : (prev.currentIndex - 1 + prev.media.length) % prev.media.length,
    }))
  }

  const handleLike = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (likingListing) return // Prevent multiple clicks
    
    setLikingListing(listingId)
    
    try {
      const supabase = createClient()
      const api = createApiClient(supabase)
      
      const result = await api.toggleLikeListing(listingId)
      
      if (result.success) {
        setLikedListings(prev => {
          const newSet = new Set(prev)
          if (result.isLiked) {
            newSet.add(listingId)
          } else {
            newSet.delete(listingId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLikingListing(null)
    }
  }

  // Helper to get image URLs (array of strings)
  const getImageUrls = (listing: any) => getListingImages(listing.images)

  // Helper to get all media URLs
  const getMediaUrls = (listing: any) => {
    const media: Array<{ url: string; type: "image" | "video" }> = []

    if (listing.images && Array.isArray(listing.images)) {
      listing.images.forEach((img: string) => {
        media.push({ url: img, type: "image" })
      })
    }

    if (listing.videos && Array.isArray(listing.videos)) {
      listing.videos.forEach((video: string) => {
        media.push({ url: video, type: "video" })
      })
    }

    return media
  }

  // Helper to format viewing time
  function formatViewingTime(viewing: string) {
    // Try to parse as ISO date/time
    const date = new Date(viewing);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
      });
    }
    // Fallback to raw string
    return viewing;
  }

  // Memoize the properties data for the map to prevent unnecessary re-renders
  const mapProperties = useMemo(() => 
    filteredListings
      .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        monthly_rent: p.monthly_rent,
      })), [filteredListings]
  );

  // Memoize the selected property for the map
  const mapSelectedProperty = useMemo(() => 
    selectedProperty && typeof selectedProperty.lat === "number" && typeof selectedProperty.lng === "number" ? {
      id: selectedProperty.id,
      lat: selectedProperty.lat,
      lng: selectedProperty.lng,
      monthly_rent: selectedProperty.monthly_rent,
    } : null, [selectedProperty]
  );

  const currentMedia = mediaModal.media[mediaModal.currentIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className={`sticky top-0 z-30 lg:hidden ${viewMode === "map" ? "bg-transparent" : "bg-white"}`}>
        <div className="px-4 py-4">
          {/* Search Bar - Full Width */}
          <div className="mb-4">
            <EnhancedSearchBar 
              onSearch={(query: string, filters: Partial<SearchFilters>) => {
                // Update the local search query for immediate filtering
                setLocalSearchQuery(query)
                // Apply parsed filters from the search query
                const parsedFilters = parseNaturalLanguageQuery(query)
                setCurrentFilters(prev => ({
                  ...prev,
                  ...parsedFilters,
                  ...filters // Explicit filters from the search bar take precedence
                }))
                
                // If query is empty, reset all filters
                if (!query.trim()) {
                  setCurrentFilters({
                    location: '',
                    county: '',
                    city: '',
                    minPrice: 0,
                    maxPrice: 0,
                    propertyType: '',
                    roomType: '',
                    size: 0,
                    currentOccupants: 0,
                    maxOccupants: 0,
                    amenities: [],
                    ensuite: false,
                    pets: false,
                    ownerOccupied: false,
                    availableFrom: '',
                    verifiedOnly: false,
                    hasViewingTimes: false
                  })
                  setLocalSearchQuery("")
                  setSearchCleared(true)
                } else {
                  setSearchCleared(false)
                }
              }}
              placeholder="Search properties..."
              initialValue={effectiveSearchQuery}
            />
          </div>
          
          {/* Filters Row - Better Layout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredListings.length} properties found
              </span>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(true)}
              className="h-11 px-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {/* Active Filters Display - Mobile */}
          {(() => {
            const activeFilters = []
            if (currentFilters.county) activeFilters.push({ label: currentFilters.county, type: 'county' })
            if (currentFilters.propertyType) activeFilters.push({ label: currentFilters.propertyType, type: 'propertyType' })
            if (currentFilters.roomType) activeFilters.push({ label: currentFilters.roomType, type: 'roomType' })
            if (currentFilters.minPrice) activeFilters.push({ label: `€${currentFilters.minPrice}+`, type: 'minPrice' })
            if (currentFilters.maxPrice) activeFilters.push({ label: `€${currentFilters.maxPrice}-`, type: 'maxPrice' })
            if (currentFilters.pets) activeFilters.push({ label: 'Pet Friendly', type: 'pets' })
            if (currentFilters.ensuite) activeFilters.push({ label: 'Ensuite', type: 'ensuite' })
            if (currentFilters.verifiedOnly) activeFilters.push({ label: 'Verified', type: 'verifiedOnly' })
            if (currentFilters.location && !currentFilters.county) activeFilters.push({ label: currentFilters.location, type: 'location' })
            
            return activeFilters.length > 0 ? (
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground">Filters:</span>
                {activeFilters.slice(0, 3).map((filter, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      const newFilters = { ...currentFilters }
                      delete newFilters[filter.type as keyof SearchFilters]
                      setCurrentFilters(newFilters)
                    }}
                  >
                    {filter.label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {activeFilters.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{activeFilters.length - 3} more
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
                >
                  Clear
                </Button>
              </div>
            ) : null
          })()}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="border-b bg-white sticky top-0 z-30 hidden lg:block">
        <div className="container mx-auto px-4 py-4">
          {/* Search and Filters Row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <EnhancedSearchBar 
                onSearch={(query: string, filters: Partial<SearchFilters>) => {
                  // Update the local search query for immediate filtering
                  setLocalSearchQuery(query)
                  // Apply parsed filters from the search query
                  const parsedFilters = parseNaturalLanguageQuery(query)
                  setCurrentFilters(prev => ({
                    ...prev,
                    ...parsedFilters,
                    ...filters // Explicit filters from the search bar take precedence
                  }))
                  
                  // If query is empty, reset all filters
                  if (!query.trim()) {
                    setCurrentFilters({
                      location: '',
                      county: '',
                      city: '',
                      minPrice: 0,
                      maxPrice: 0,
                      propertyType: '',
                      roomType: '',
                      size: 0,
                      currentOccupants: 0,
                      maxOccupants: 0,
                      amenities: [],
                      ensuite: false,
                      pets: false,
                      ownerOccupied: false,
                      availableFrom: '',
                      verifiedOnly: false,
                      hasViewingTimes: false
                    })
                    setLocalSearchQuery("")
                    setSearchCleared(true)
                  } else {
                    setSearchCleared(false)
                  }
                }}
                placeholder="Search for properties..."
                initialValue={effectiveSearchQuery}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                {filteredListings.length} properties
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Search Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pb-6">
                    <AdvancedSearchFilters
                      filters={currentFilters}
                      onFiltersChange={handleFiltersChange}
                      onClearFilters={handleClearFilters}
                      totalResults={filteredListings.length}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(() => {
            const activeFilters = []
            if (currentFilters.county) activeFilters.push({ label: currentFilters.county, type: 'county' })
            if (currentFilters.propertyType) activeFilters.push({ label: currentFilters.propertyType, type: 'propertyType' })
            if (currentFilters.roomType) activeFilters.push({ label: currentFilters.roomType, type: 'roomType' })
            if (currentFilters.minPrice) activeFilters.push({ label: `€${currentFilters.minPrice}+`, type: 'minPrice' })
            if (currentFilters.maxPrice) activeFilters.push({ label: `€${currentFilters.maxPrice}-`, type: 'maxPrice' })
            if (currentFilters.pets) activeFilters.push({ label: 'Pet Friendly', type: 'pets' })
            if (currentFilters.ensuite) activeFilters.push({ label: 'Ensuite', type: 'ensuite' })
            if (currentFilters.verifiedOnly) activeFilters.push({ label: 'Verified', type: 'verifiedOnly' })
            if (currentFilters.location && !currentFilters.county) activeFilters.push({ label: currentFilters.location, type: 'location' })
            
            return activeFilters.length > 0 ? (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      const newFilters = { ...currentFilters }
                      delete newFilters[filter.type as keyof SearchFilters]
                      setCurrentFilters(newFilters)
                    }}
                  >
                    {filter.label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              </div>
            ) : null
          })()}
        </div>
      </header>

      {/* Mobile View Toggle */}
      <div className="lg:hidden border-b bg-white">
        <div className="flex">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            className="flex-1 rounded-none h-12"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            className="flex-1 rounded-none h-12"
            onClick={() => setViewMode("map")}
          >
            <Map className="h-4 w-4 mr-2" />
            Map
          </Button>
        </div>
      </div>

      {/* Mobile Spacing */}
      <div className="lg:hidden h-4 bg-gray-50"></div>



      {/* Main Content */}
      <div className="lg:container lg:mx-auto lg:px-4 lg:py-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Listings Section */}
          <div className={`space-y-4 overflow-y-auto pr-2 ${viewMode === "map" ? "hidden lg:block" : ""}`}>
            <div className="space-y-3 lg:space-y-4 px-4 lg:px-0 pb-20 lg:pb-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading properties...</div>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-muted-foreground mb-2">No properties found</div>
                    <div className="text-sm text-muted-foreground">
                      Try adjusting your search criteria or filters
                    </div>
                  </div>
                </div>
              ) : (
                filteredListings.map((property) => {
                  const mediaUrls = getMediaUrls(property)

                  return (
                    <Card
                      key={property.id}
                      className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 ${
                        selectedProperty?.id === property.id ? "border-black shadow-lg" : "border-transparent"
                      }`}
                      onClick={() => handlePropertySelect(property)}
                    >
                      <CardContent className="p-0">
                        {/* Mobile Layout */}
                        <div className="lg:hidden">
                          {/* Image Section */}
                          <div className="relative w-full h-48">
                            {mediaUrls.length > 0 ? (
                              <Carousel className="w-full h-48">
                                <CarouselContent>
                                  {mediaUrls.map((media, idx) => (
                                    <CarouselItem key={idx} className="w-full h-48">
                                      <div
                                        className="relative w-full h-48 cursor-pointer group"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMediaClick(mediaUrls, idx)
                                        }}
                                      >
                                        {media.type === "image" ? (
                                          <Image
                                            src={media.url || "/placeholder.svg"}
                                            alt={property.property_name}
                                            width={400}
                                            height={200}
                                            className="rounded-t-lg object-cover w-full h-48 transition-transform group-hover:scale-105"
                                          />
                                        ) : (
                                          <div className="relative w-full h-48">
                                            <video
                                              src={media.url}
                                              className="rounded-t-lg object-cover w-full h-48"
                                              muted
                                            />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-t-lg">
                                              <Play className="h-12 w-12 text-white" />
                                            </div>
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg" />
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {mediaUrls.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2 h-8 w-8" />
                                    <CarouselNext className="right-2 h-8 w-8" />
                                  </>
                                )}
                              </Carousel>
                            ) : (
                              <Image
                                src="/bedroom.png"
                                alt={property.property_name}
                                width={400}
                                height={200}
                                className="rounded-t-lg object-cover w-full h-48"
                              />
                            )}

                            {/* Heart Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleLike(property.id, e)}
                              disabled={likingListing === property.id}
                              className={`absolute top-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-white h-10 w-10 shadow-lg transition-colors ${
                                likedListings.has(property.id) ? 'text-red-500' : 'text-gray-600'
                              }`}
                            >
                              <Heart 
                                className={`h-5 w-5 ${likedListings.has(property.id) ? 'fill-current' : ''}`} 
                              />
                            </Button>

                            {/* Price Badge */}
                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                              <span className="text-lg font-bold text-gray-900">€{property.monthly_rent}</span>
                              <span className="text-sm text-gray-600"> / {property.rent_frequency || "month"}</span>
                            </div>

                            {/* Verified Badge */}
                            {property.verified && (
                              <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                                Verified
                              </Badge>
                            )}

                            {/* Media Count */}
                            {mediaUrls.length > 1 && (
                              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full">
                                {mediaUrls.length} photos
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="p-4 space-y-3">
                            {/* Property Type & Location */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-sm">
                                    {property.room_type?.charAt(0).toUpperCase() + property.room_type?.slice(1)}
                                  </Badge>
                                  {property.ensuite && <Badge className="bg-blue-500 text-white text-sm">Ensuite</Badge>}
                                </div>
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2 break-words mb-2">
                                  {property.property_name}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm truncate">
                                    {property.apartment_number && `${property.apartment_number}, `}
                                    {property.address}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {property.area}, {property.city} {property.eircode}
                                  {property.size && ` • ${property.size} m²`}
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {property.description}
                            </p>

                            {/* Amenities */}
                            {property.amenities && property.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {property.amenities.slice(0, 4).map((amenity: string) => (
                                  <Badge key={amenity} variant="outline" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                                {property.amenities.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{property.amenities.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Availability & Details */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="text-green-600 font-medium text-sm">
                                    {property.available_from ? `Available ${property.available_from}` : "Available Now"}
                                  </div>
                                  {(property.current_males > 0 || property.current_females > 0) && (
                                    <div className="text-gray-500 text-sm">
                                      {property.current_males + property.current_females} current occupants
                                    </div>
                                  )}
                                  {property.applicants && (
                                    <div className="text-gray-500 text-sm">
                                      {property.applicants.count || 0} applicant{(property.applicants.count || 0) !== 1 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Viewing Times */}
                              {property.viewing_times && property.viewing_times.length > 0 && (
                                <div className="pt-2">
                                  <p className="text-xs text-gray-500 mb-2">Next viewings:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {property.viewing_times.slice(0, 2).map((viewing: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {formatViewingTime(viewing)}
                                      </Badge>
                                    ))}
                                    {property.viewing_times.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{property.viewing_times.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout (unchanged) */}
                        <div className="hidden lg:flex gap-4 p-4">
                          <div className="relative flex-shrink-0 w-48 h-36">
                            {mediaUrls.length > 0 ? (
                              <Carousel className="w-48 h-36">
                                <CarouselContent>
                                  {mediaUrls.map((media, idx) => (
                                    <CarouselItem key={idx} className="w-48 h-36">
                                      <div
                                        className="relative w-48 h-36 cursor-pointer group"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMediaClick(mediaUrls, idx)
                                        }}
                                      >
                                        {media.type === "image" ? (
                                          <Image
                                            src={media.url || "/placeholder.svg"}
                                            alt={property.property_name}
                                            width={200}
                                            height={150}
                                            className="rounded-lg object-cover w-48 h-36 transition-transform group-hover:scale-105"
                                          />
                                        ) : (
                                          <div className="relative w-48 h-36">
                                            <video
                                              src={media.url}
                                              className="rounded-lg object-cover w-48 h-36"
                                              muted
                                            />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                                              <Play className="h-8 w-8 text-white" />
                                            </div>
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {mediaUrls.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            ) : (
                              <Image
                                src="/bedroom.png"
                                alt={property.property_name}
                                width={200}
                                height={150}
                                className="rounded-lg object-cover w-48 h-36"
                              />
                            )}

                            {property.verified && (
                              <Badge className="absolute bottom-2 left-2 bg-green-500">Verified</Badge>
                            )}

                            {mediaUrls.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                {mediaUrls.length}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {property.room_type?.charAt(0).toUpperCase() + property.room_type?.slice(1)}
                                  </Badge>
                                  {property.ensuite && <Badge className="bg-blue-500">Ensuite</Badge>}
                                </div>
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2 break-words">
                                  {property.property_name}
                                </h3>
                                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-sm truncate">
                                    {property.apartment_number && `${property.apartment_number}, `}
                                    {property.address}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {property.area}, {property.city} {property.eircode}
                                  {property.size && ` • ${property.size} m²`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleLike(property.id, e)}
                                  disabled={likingListing === property.id}
                                  className={`hover:bg-red-50 transition-colors ${
                                    likedListings.has(property.id) ? 'text-red-500' : 'text-gray-600'
                                  }`}
                                >
                                  <Heart 
                                    className={`h-4 w-4 ${likedListings.has(property.id) ? 'fill-current' : ''}`} 
                                  />
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                              {property.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {property.amenities?.slice(0, 4).map((amenity: string) => (
                                <Badge key={amenity} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {property.amenities?.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.amenities.length - 4} more
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-sm gap-4">
                              <div className="space-y-1">
                                <div className="text-green-600 font-medium">
                                  {property.available_from ? `Available ${property.available_from}` : "Available Now"}
                                </div>
                                {(property.current_males > 0 || property.current_females > 0) && (
                                  <div className="text-muted-foreground">
                                    {property.current_males + property.current_females} current occupants
                                  </div>
                                )}
                                {property.applicants && (
                                  <div className="text-muted-foreground">
                                    {property.applicants.count || 0} applicant{(property.applicants.count || 0) !== 1 ? "s" : ""}
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-2xl font-bold">€{property.monthly_rent}</span>
                                <span className="text-muted-foreground"> / {property.rent_frequency || "month"}</span>
                              </div>
                            </div>

                            {property.viewing_times && property.viewing_times.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Next viewings:</p>
                                <div className="flex flex-wrap gap-1">
                                  {property.viewing_times.slice(0, 2).map((viewing: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {formatViewingTime(viewing)}
                                    </Badge>
                                  ))}
                                  {property.viewing_times.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{property.viewing_times.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Panel - Map or Property Details (Desktop) */}
          <div className={`${viewMode === "list" ? "hidden lg:block" : ""}`}>
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{viewMode === "list" ? "Map View" : "Property Details"}</h2>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="gap-2"
                  >
                    <Map className="h-2 w-4" />
                    Map View
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    Details View
                  </Button>
                </div>
              </div>

              <Card className="max-h-[600px] overflow-y-auto">
                <CardContent className="p-0">
                  {viewMode === "list" ? (
                    <div className="h-[500px]">
                      <MapboxMap
                        properties={mapProperties}
                        selectedProperty={mapSelectedProperty}
                        onSelect={handlePropertySelect}
                        onMapClick={() => {}}
                      />
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      <PropertyView selectedProperty={selectedProperty} onMediaClick={handleMediaClick} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Map View */}
      {viewMode === "map" && (
        <div className="lg:hidden fixed inset-0 top-32 z-30">
          <MapboxMap
            properties={mapProperties}
            selectedProperty={mapSelectedProperty}
            onSelect={handlePropertySelect}
            onMapClick={() => {}}
          />
          {/* Back Button */}
          <div className="absolute top-4 left-4 z-40">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode("list")}
              className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="left" className="w-[90vw] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search Filters
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pb-6">
            <div className="space-y-6">
             
              <AdvancedSearchFilters
                filters={currentFilters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                totalResults={filteredListings.length}
                hideMobileButton={true}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Property Details Sheet */}
      <Sheet open={showPropertyDetails} onOpenChange={setShowPropertyDetails}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-6 pb-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPropertyDetails(false)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold">Property Details</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {selectedProperty && (
                <PropertyView selectedProperty={selectedProperty} onMediaClick={handleMediaClick} />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Media Modal */}
      <Dialog open={mediaModal.isOpen} onOpenChange={closeMediaModal}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-transparent border-0 shadow-none rounded-lg overflow-hidden">
          <DialogTitle className="text-white bg-black/50 px-3 py-1 rounded absolute top-4 left-4 z-10">
            Property Media - {mediaModal.currentIndex + 1} of {mediaModal.media.length}
          </DialogTitle>
          
          <DialogDescription className="sr-only">
            View property images and videos
          </DialogDescription>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70"
            onClick={closeMediaModal}
          >
            <X className="h-4 w-4" />
          </Button>

          {mediaModal.media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/70"
                onClick={() => navigateMedia("prev")}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/70"
                onClick={() => navigateMedia("next")}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center bg-black">
            {currentMedia &&
              (currentMedia.type === "image" ? (
                <Image
                  src={currentMedia.url || "/placeholder.svg"}
                  alt="Property media"
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video src={currentMedia.url} controls className="max-w-full max-h-full" autoPlay />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
