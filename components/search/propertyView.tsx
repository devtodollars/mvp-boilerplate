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
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { createApiClient } from "@/utils/supabase/api"
import { useToast } from "@/components/ui/use-toast"
import ApplicationDialog from "@/components/misc/ApplicationDialog"
import WithdrawConfirmationDialog from "@/components/misc/WithdrawConfirmationDialog"

interface PropertyViewProps {
  selectedProperty: any
  onMediaClick?: (media: Array<{ url: string; type: "image" | "video" }>, index: number) => void
}

export default function PropertyView({ selectedProperty, onMediaClick }: PropertyViewProps) {
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [userApplication, setUserApplication] = useState<any>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [likedListings, setLikedListings] = useState<Set<string>>(new Set());
  const [likingListing, setLikingListing] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user is authenticated and has already applied to this property
  useEffect(() => {
    const checkUserAndApplication = async () => {
      if (!selectedProperty) return;
      
      setIsCheckingApplication(true);
      try {
        const supabase = createClient();
        
        // First check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        setUser(user);
        
        if (userError || !user) {
          // User is not authenticated, don't check for applications
          setIsCheckingApplication(false);
          return;
        }
        
        // User is authenticated, check for existing application
        const api = createApiClient(supabase);
        const { hasApplied, application } = await api.checkUserApplication(selectedProperty.id);
        setUserApplication(application);
      } catch (error) {
        console.error('Error checking user and application:', error);
      } finally {
        setIsCheckingApplication(false);
      }
    };

    checkUserAndApplication();
  }, [selectedProperty]);

  // Check liked listings on mount
  useEffect(() => {
    const checkLikedListings = async () => {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('liked_listings')
            .eq('id', user.id)
            .single();
          
          if (userData?.liked_listings) {
            setLikedListings(new Set(userData.liked_listings));
          }
        }
      } catch (error) {
        console.error('Error checking liked listings:', error);
      }
    };

    checkLikedListings();
  }, []);

  const handleLike = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (likingListing) return; // Prevent multiple clicks
    
    setLikingListing(listingId);
    
    try {
      const supabase = createClient();
      const api = createApiClient(supabase);
      
      const result = await api.toggleLikeListing(listingId);
      
      if (result.success) {
        setLikedListings(prev => {
          const newSet = new Set(prev);
          if (result.isLiked) {
            newSet.add(listingId);
          } else {
            newSet.delete(listingId);
          }
          return newSet;
        });
        
        toast({
          title: result.isLiked ? 'Added to Favorites!' : 'Removed from Favorites',
          description: result.isLiked 
            ? 'This property has been added to your favorites.'
            : 'This property has been removed from your favorites.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLikingListing(null);
    }
  };

  const handleApply = async (notes?: string) => {
    if (!selectedProperty || !user) return;
    
    setIsApplying(true);
    try {
      const supabase = createClient();
      const api = createApiClient(supabase);
      await api.applyToProperty(selectedProperty.id, notes);
      
      // Check if this was a re-application
      const isReapplication = userApplication && userApplication.status !== 'pending';
      
      toast({
        title: isReapplication ? 'Application Resubmitted!' : 'Application Submitted!',
        description: isReapplication 
          ? 'Your application has been resubmitted and added to the queue.'
          : 'Your application has been added to the queue. You will be notified of updates.',
        variant: 'default',
      });
      
      // Refresh application status
      const { hasApplied, application } = await api.checkUserApplication(selectedProperty.id);
      setUserApplication(application);
    } catch (error) {
      console.error('Error applying:', error);
      throw error;
    } finally {
      setIsApplying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userApplication || !user) return;
    
    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/applications/${userApplication.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'withdrawn' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw application');
      }

      // Update local state
      setUserApplication((prev: any) => prev ? { ...prev, status: 'withdrawn' } : null);
      
      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been withdrawn successfully.',
        variant: 'default',
      });
      
      // Close the confirmation dialog
      setShowWithdrawDialog(false);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error instanceof Error ? error.message : 'There was an error withdrawing your application.',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getApplicationStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'accepted':
        return 'Application Accepted';
      case 'rejected':
        return 'Application Rejected';
      case 'withdrawn':
        return 'Application Withdrawn';
      default:
        return 'Unknown Status';
    }
  };

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
    <div className="w-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Media Carousel */}
        {mediaUrls.length > 0 && (
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {mediaUrls.map((media, idx) => (
                  <CarouselItem key={idx}>
                    <div
                      className="relative h-48 cursor-pointer group rounded-lg overflow-hidden"
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
                            <Play className="h-8 w-8 text-white" />
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
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {mediaUrls.length} photos
              </div>
            )}
          </div>
        )}

        {/* Property Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{formatPropertyType(selectedProperty.property_type)}</Badge>
                <Badge variant="outline" className="text-xs">{formatRoomType(selectedProperty.room_type)}</Badge>
                {selectedProperty.ensuite && <Badge className="bg-blue-500 text-xs">Ensuite</Badge>}
                {selectedProperty.verified && (
                  <Badge className="bg-green-500 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <h1 className="text-xl font-bold text-gray-900">{selectedProperty.property_name}</h1>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {selectedProperty.apartment_number && `${selectedProperty.apartment_number}, `}
                    {selectedProperty.address}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {selectedProperty.area}, {selectedProperty.city}, {selectedProperty.county} {selectedProperty.eircode}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              className={`shrink-0 bg-transparent transition-colors ${
                likedListings.has(selectedProperty.id) ? 'text-red-500 border-red-200' : ''
              }`}
              onClick={(e) => handleLike(selectedProperty.id, e)}
              disabled={likingListing === selectedProperty.id}
            >
              <Heart 
                className={`h-4 w-4 ${likedListings.has(selectedProperty.id) ? 'fill-current' : ''}`} 
              />
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

        {/* Application Status or Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          {isCheckingApplication ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Checking application status...</span>
            </div>
          ) : !user ? (
            <div className="space-y-3">
              {/* Not signed in state */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Sign in to Apply</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  You need to be signed in to apply to this property.
                </p>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    const currentUrl = window.location.pathname + window.location.search;
                    window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentUrl)}`;
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In to Apply
                </Button>
              </div>
            </div>
          ) : userApplication ? (
            <div className="space-y-3">
              {/* Application Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getApplicationStatusIcon(userApplication.status)}
                  <span className="font-medium">{getApplicationStatusText(userApplication.status)}</span>
                </div>
                {userApplication.status === 'pending' && (
                  <div className="text-sm text-gray-600">
                    You are #{userApplication.position} in the queue
                  </div>
                )}
                {userApplication.applied_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Applied on {new Date(userApplication.applied_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {userApplication.status === 'pending' && (
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent" 
                  size="lg"
                  onClick={() => setShowWithdrawDialog(true)}
                  disabled={isWithdrawing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Withdraw Application
                </Button>
              )}
              
              {/* Re-apply button for withdrawn, rejected, or accepted applications */}
              {(userApplication.status === 'withdrawn' || userApplication.status === 'rejected' || userApplication.status === 'accepted') && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      const currentUrl = window.location.pathname + window.location.search;
                      window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentUrl)}`;
                    } else {
                      setShowApplicationDialog(true);
                    }
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  {userApplication.status === 'withdrawn' ? 'Apply Again' : 'Apply to Property'}
                </Button>
              )}
            </div>
          ) : (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                if (!user) {
                  const currentUrl = window.location.pathname + window.location.search;
                  window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentUrl)}`;
                } else {
                  setShowApplicationDialog(true);
                }
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Apply to Property
            </Button>
          )}
        </div>

        {/* Application Dialog */}
        <ApplicationDialog
          isOpen={showApplicationDialog}
          onClose={() => setShowApplicationDialog(false)}
          property={selectedProperty}
          onApply={handleApply}
          isApplying={isApplying}
          isAuthenticated={!!user}
          isReapplication={!!(userApplication && userApplication.status !== 'pending')}
        />

        {/* Withdraw Confirmation Dialog */}
        <WithdrawConfirmationDialog
          isOpen={showWithdrawDialog}
          onClose={() => setShowWithdrawDialog(false)}
          onConfirm={handleWithdraw}
          isWithdrawing={isWithdrawing}
          propertyName={selectedProperty.property_name}
        />
      </div>
    </div>
  )
}
