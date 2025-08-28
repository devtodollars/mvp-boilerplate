"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, ArrowLeft, Trash2, CheckCircle, Shield } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/AuthProvider"
import { createApiClient } from "@/utils/supabase/api"
import { useToast } from "@/components/ui/use-toast"
import { getListingImages } from "@/utils/supabase/storage"

export default function LikedListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unlikingListing, setUnlikingListing] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  // Get user from AuthProvider context at the top level
  const { user } = useAuth()

  useEffect(() => {
    const fetchLikedListings = async () => {
      try {
        const supabase = createClient()
        const api = createApiClient(supabase)
        
        // Check if user is available
        if (!user) {
          router.push('/auth/signin?redirect=/liked')
          return
        }

        const result = await api.getUserLikedListings(user)
        if (result.success) {
          setListings(result.listings)
        }
      } catch (error) {
        console.error('Error fetching liked listings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your favorite properties.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchLikedListings()
    }
  }, [user, router, toast])

  const handleUnlike = async (listingId: string) => {
    if (unlikingListing) return
    
    setUnlikingListing(listingId)
    
    try {
      const supabase = createClient()
      const api = createApiClient(supabase)
      
      const result = await api.toggleLikeListing(listingId, user)
      
      if (result.success) {
        setListings(prev => prev.filter(listing => listing.id !== listingId))
        toast({
          title: 'Removed from Favorites',
          description: 'This property has been removed from your favorites.',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove from favorites. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUnlikingListing(null)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Favorites</h1>
              <p className="text-muted-foreground">Loading your favorite properties...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Favorites</h1>
            <p className="text-muted-foreground">
              {listings.length === 0 
                ? "You haven't saved any properties yet" 
                : `${listings.length} favorite propert${listings.length === 1 ? 'y' : 'ies'}`
              }
            </p>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-6">
              Start exploring properties and save your favorites by clicking the heart icon.
            </p>
            <Button onClick={() => router.push('/search')}>
              Browse Properties
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((property) => {
              const mediaUrls = getMediaUrls(property)
              const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null

              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative w-full h-48">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={property.property_name}
                          width={400}
                          height={200}
                          className="object-cover w-full h-48"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}

                      {/* Unlike Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlike(property.id)}
                        disabled={unlikingListing === property.id}
                        className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-white h-10 w-10 shadow-lg text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>

                      {/* Price Badge */}
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                        <span className="text-lg font-bold text-gray-900">€{property.monthly_rent}</span>
                        <span className="text-sm text-gray-600"> / {property.rent_frequency || "month"}</span>
                      </div>

                      {/* Owner Verification Status - Small and clean */}
                      {property.owner?.verified ? (
                        <div className="absolute top-3 left-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute top-3 left-3">
                          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                            <Shield className="h-3 w-3 text-amber-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Property Type & Location */}
                      <div>
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

                      {/* View Details Button */}
                      <Button 
                        className="w-full" 
                        onClick={() => router.push(`/search?property=${property.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 