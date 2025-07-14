

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Star } from "lucide-react"

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
}

interface PropertyComponentProps {
  selectedProperty: Property;
}

export default function PropertyComponent({ selectedProperty }: PropertyComponentProps) {
    return (
        <div className="p-6 h-full overflow-y-auto">
        <div className="space-y-6">
          {/* Property Image */}
          <div className="relative">
            <Image
              src={selectedProperty.image || "/placeholder.svg"}
              alt={selectedProperty.propertyName}
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-64"
            />
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
              <Badge variant="secondary">{selectedProperty.propertyType}</Badge>
              {selectedProperty.active && <Badge className="bg-green-500">Active</Badge>}
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedProperty.propertyName}</h2>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span>{selectedProperty.address}</span>
            </div>
            <p className="text-muted-foreground mb-3">
              {selectedProperty.eircode} • {selectedProperty.size}
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
              <p className="text-green-600 font-medium">{selectedProperty.availability}</p>
              {selectedProperty.occupantsIfShared && (
                <p className="text-sm text-muted-foreground mt-1">{selectedProperty.occupantsIfShared}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Interest</h4>
              <p className="text-muted-foreground">
                {selectedProperty.applicants} applicant{selectedProperty.applicants !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h4 className="font-semibold mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {selectedProperty.amenities.map((amenity: string) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Viewing Times */}
          {selectedProperty.viewingDatesAndTimes.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Available Viewings</h4>
              <div className="space-y-2">
                {selectedProperty.viewingDatesAndTimes.map((viewing: string, index: number) => (
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
              <span className="text-3xl font-bold">€{selectedProperty.price}</span>
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
    )
}