

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Star } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface Property {
  image?: string;
  propertyName: string;
  verified?: boolean;
  propertyType: string;
  active?: boolean;
  address: string;
  eircode?: string;
  size?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  availability?: string;
  occupantsIfShared?: string | null;
  applicants?: number;
  amenities: string[];
  viewingDatesAndTimes: string[];
  price: number;
  images?: string[]; // Added for carousel
  property_name?: string; // Added for carousel
  property_type?: string; // Added for carousel
  city?: string; // Added for address
  county?: string; // Added for address
  available_from?: string; // Added for availability
  occupants_if_shared?: string | null; // Added for occupants
  monthly_rent?: number; // Added for price
  viewing_dates_and_times?: string[]; // Added for viewing times
}

interface PropertyComponentProps {
  selectedProperty: Property;
}

import { getListingImages } from '@/utils/supabase/storage';

export default function PropertyComponent({ selectedProperty }: PropertyComponentProps) {
  // Support both camelCase and snake_case for viewing times
  const viewings =
    selectedProperty.viewingDatesAndTimes ||
    selectedProperty.viewing_dates_and_times ||
    [];
  // Use scalable image utility
  const images = getListingImages(selectedProperty.images);
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Property Image Carousel */}
        <div className="relative w-full h-64">
          <Carousel className="w-full h-64">
            <CarouselContent>
              {images.map((img, idx) => (
                <CarouselItem key={idx} className="w-full h-64">
                  <Image
                    src={img}
                    alt={selectedProperty.property_name || selectedProperty.propertyName || 'Property'}
                    width={500}
                    height={300}
                    className="rounded-lg object-cover w-full h-64"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white" />
              </>
            )}
          </Carousel>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          >
            <Heart className="h-4 w-4" />
          </Button>
          {selectedProperty.verified && (
            <Badge className="absolute bottom-2 left-2 bg-green-500">Verified</Badge>
          )}
        </div>
        {/* Property Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{selectedProperty.property_type || selectedProperty.propertyType}</Badge>
            {selectedProperty.active && <Badge className="bg-green-500">Active</Badge>}
          </div>
          <h2 className="text-2xl font-bold mb-2">{selectedProperty.property_name || selectedProperty.propertyName}</h2>
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <MapPin className="h-4 w-4" />
            <span>{selectedProperty.address}</span>
          </div>
          <p className="text-muted-foreground mb-3">
            {selectedProperty.city}, {selectedProperty.county} • {selectedProperty.eircode} • {selectedProperty.size ? `${selectedProperty.size} sq ft` : ''}
          </p>
          <div className="flex items-center gap-1 mb-4">
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            <span className="font-medium">{selectedProperty.rating}</span>
            <span className="text-muted-foreground">({selectedProperty.reviews} reviews)</span>
          </div>
        </div>
        {/* Description */}
        <div>
          <h4 className="font-semibold mb-2">Description</h4>
          <p className="text-muted-foreground">{selectedProperty.description}</p>
        </div>
        {/* Availability & Interest */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Availability</h4>
            <p className="text-green-600 font-medium">{selectedProperty.availability || selectedProperty.available_from}</p>
            {selectedProperty.occupants_if_shared && (
              <p className="text-sm text-muted-foreground mt-1">{selectedProperty.occupants_if_shared}</p>
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Interest</h4>
            <p className="text-muted-foreground">
              {selectedProperty.applicants} applicant{selectedProperty.applicants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {/* Amenities */}
        <div>
          <h4 className="font-semibold mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {(selectedProperty.amenities || []).map((amenity: string) => (
              <Badge key={amenity} variant="outline">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>
        {/* Viewing Times */}
        {Array.isArray(viewings) && viewings.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Available Viewings</h4>
            <div className="space-y-2">
              {viewings.map((viewing: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground mr-2 mb-2"
                >
                  {viewing}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {/* Price */}
        <div className="border-t pt-4">
          <div className="text-center">
            <span className="text-3xl font-bold">€{selectedProperty.price || selectedProperty.monthly_rent}</span>
            <span className="text-muted-foreground"> / month</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full">Book Viewing</Button>
          <Button variant="outline" className="w-full bg-transparent">
            Contact Owner
          </Button>
        </div>
      </div>
    </div>
  );
}