"use client"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import {
  MapPin,
  Heart,
  Star,
  Users,
  Home,
  Calendar,
  Shield,
  Play,
  Wifi,
  Car,
  TreePine,
  Waves,
  Dumbbell,
  PawPrint,
} from "lucide-react"

interface PropertyViewProps {
  selectedProperty: any
  onMediaClick?: (media: Array<{ url: string; type: "image" | "video" }>, index: number) => void
}

export default function PropertyView({ selectedProperty, onMediaClick }: PropertyViewProps) {
  if (!selectedProperty) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a property to view details</p>
      </div>
    )
  }

  // Helper to get media URLs
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

  const mediaUrls = getMediaUrls(selectedProperty)

  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatRoomType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: any } = {
      "Wi-Fi": Wifi,
      Parking: Car,
      "Garden Access": TreePine,
      "Swimming Pool": Waves,
      "Gym Access": Dumbbell,
      "Pet Friendly": PawPrint,
    }

    const IconComponent = iconMap[amenity]
    return IconComponent ? <IconComponent className="h-3 w-3" /> : null
  }

  // Helper to format viewing time
  function formatViewingTime(viewing: string) {
    const date = new Date(viewing);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
      });
    }
    return viewing;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Media Carousel */}
        {mediaUrls.length > 0 && (
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {mediaUrls.map((media, idx) => (
                  <CarouselItem key={idx}>
                    <div
                      className="relative aspect-video cursor-pointer group rounded-xl overflow-hidden"
                      onClick={() => onMediaClick?.(mediaUrls, idx)}
                    >
                      {media.type === "image" ? (
                        <Image
                          src={media.url || "/placeholder.svg"}
                          alt={selectedProperty.property_name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video src={media.url} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Play className="h-16 w-16 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {mediaUrls.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>

            {/* Media counter */}
            {mediaUrls.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                {mediaUrls.length} media files
              </div>
            )}
          </div>
        )}

        {/* Property Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{formatPropertyType(selectedProperty.property_type)}</Badge>
                <Badge variant="outline">{formatRoomType(selectedProperty.room_type)}</Badge>
                {selectedProperty.ensuite && <Badge className="bg-blue-500">Ensuite</Badge>}
                {selectedProperty.verified && (
                  <Badge className="bg-green-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900">{selectedProperty.property_name}</h1>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {selectedProperty.apartment_number && `${selectedProperty.apartment_number}, `}
                    {selectedProperty.address}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedProperty.area}, {selectedProperty.city}, {selectedProperty.county} {selectedProperty.eircode}
                </div>
              </div>
            </div>

            <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Price and Key Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">€{selectedProperty.monthly_rent}</div>
                <div className="text-sm text-gray-500">per {selectedProperty.rent_frequency || "month"}</div>
              </div>
              <div className="text-right">
                {selectedProperty.size && (
                  <div>
                    <div className="text-lg font-semibold">{selectedProperty.size} m²</div>
                    <div className="text-sm text-gray-500">Floor area</div>
                  </div>
                )}
              </div>
            </div>

            {selectedProperty.security_deposit > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium">€{selectedProperty.security_deposit}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <p className="text-gray-600 leading-relaxed">{selectedProperty.description}</p>
        </div>

        {/* Key Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Property Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Available From</div>
                  <div className="text-sm text-gray-600">{selectedProperty.available_from || "Now"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Lease Duration</div>
                  <div className="text-sm text-gray-600">{selectedProperty.lease_duration || "Flexible"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedProperty.current_males > 0 || selectedProperty.current_females > 0) && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Current Occupants</div>
                    <div className="text-sm text-gray-600">
                      {selectedProperty.current_males + selectedProperty.current_females} people
                    </div>
                  </div>
                </div>
              )}

              {selectedProperty.ber_rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">BER Rating</div>
                    <div className="text-sm text-gray-600">{selectedProperty.ber_rating}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amenities */}
        {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedProperty.amenities.map((amenity: string) => (
                <div key={amenity} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {getAmenityIcon(amenity)}
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Facilities */}
        {selectedProperty.nearby_facilities && selectedProperty.nearby_facilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Nearby Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {selectedProperty.nearby_facilities.map((facility: string) => (
                <Badge key={facility} variant="outline" className="text-xs">
                  {facility}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* House Rules */}
        {selectedProperty.house_rules && (
          <div>
            <h3 className="text-lg font-semibold mb-3">House Rules</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{selectedProperty.house_rules}</p>
          </div>
        )}

        {/* Viewing Times */}
        {selectedProperty.viewing_times && selectedProperty.viewing_times.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Viewing Times</h3>
            <div className="space-y-2">
              {selectedProperty.viewing_times.map((time: string, index: number) => (
                <Button key={index} variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatViewingTime(time)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          <Button className="w-full" size="lg">
            <Calendar className="h-4 w-4 mr-2" />
            Book Viewing
          </Button>
          <Button variant="outline" className="w-full bg-transparent" size="lg">
            Contact Owner
          </Button>
        </div>
      </div>
    </div>
  )
}
