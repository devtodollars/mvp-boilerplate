"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, SlidersHorizontal, Star, Heart, MapPin, List, Map } from "lucide-react"
import PropertyView from "./propertyView"

const properties = [
  {
    id: 1,
    propertyName: "Cozy Downtown Loft",
    propertyType: "Apartment",
    description:
      "Beautiful modern loft in the heart of downtown with stunning city views and premium amenities. This spacious apartment features floor-to-ceiling windows, hardwood floors, and a modern kitchen with stainless steel appliances. Perfect for professionals looking for a convenient downtown location.",
    availability: "Available Now",
    size: "850 sq ft",
    address: "123 Main Street, Manhattan",
    eircode: "D02 XY45",
    active: true,
    amenities: ["WiFi", "Kitchen", "Parking", "Gym", "Balcony", "Air Conditioning", "Dishwasher"],
    verified: true,
    occupantsIfShared: null,
    viewingDatesAndTimes: ["Dec 15, 2pm-4pm", "Dec 16, 10am-12pm", "Dec 17, 6pm-7pm"],
    applicants: 3,
    price: 1800,
    rating: 4.9,
    reviews: 127,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 2,
    propertyName: "Beachfront Villa",
    propertyType: "House",
    description:
      "Luxury beachfront villa with private beach access and panoramic ocean views. This stunning property offers direct beach access, a private pool, and expansive outdoor living spaces perfect for entertaining.",
    availability: "Available Jan 1st",
    size: "2400 sq ft",
    address: "456 Ocean Drive, Malibu",
    eircode: "CA1 234",
    active: true,
    amenities: ["Pool", "Beach access", "WiFi", "Hot tub", "Garden", "BBQ Area", "Parking"],
    verified: true,
    occupantsIfShared: null,
    viewingDatesAndTimes: ["Dec 18, 3pm-5pm", "Dec 20, 1pm-3pm"],
    applicants: 7,
    price: 4500,
    rating: 4.8,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 3,
    propertyName: "Mountain Cabin Retreat",
    propertyType: "Cabin",
    description:
      "Rustic mountain cabin perfect for weekend getaways with modern amenities. Nestled in the mountains with hiking trails nearby and cozy fireplace for winter evenings.",
    availability: "Available Now",
    size: "1200 sq ft",
    address: "789 Pine Ridge, Aspen",
    eircode: "CO5 678",
    active: true,
    amenities: ["Fireplace", "Hot tub", "Ski access", "WiFi", "Kitchen", "Mountain View"],
    verified: true,
    occupantsIfShared: null,
    viewingDatesAndTimes: ["Dec 17, 11am-1pm"],
    applicants: 2,
    price: 3200,
    rating: 4.7,
    reviews: 156,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 4,
    propertyName: "Historic Brownstone Room",
    propertyType: "Shared House",
    description:
      "Charming room in historic brownstone with shared common areas and garden access. Perfect for young professionals in a vibrant neighborhood with great transport links.",
    availability: "Available Dec 20th",
    size: "300 sq ft",
    address: "321 Brooklyn Heights, Brooklyn",
    eircode: "NY1 123",
    active: true,
    amenities: ["Garden", "WiFi", "Kitchen", "Laundry", "Study room", "Shared Living Room"],
    verified: true,
    occupantsIfShared: "2 current occupants (professionals)",
    viewingDatesAndTimes: ["Dec 16, 6pm-7pm", "Dec 19, 5pm-6pm"],
    applicants: 5,
    price: 1200,
    rating: 4.6,
    reviews: 203,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: 5,
    propertyName: "Modern Studio",
    propertyType: "Studio",
    description:
      "Contemporary studio apartment with high-end finishes and city views. Features a murphy bed, modern kitchen, and access to building amenities including gym and rooftop terrace.",
    availability: "Available Now",
    size: "500 sq ft",
    address: "654 Tech Boulevard, San Francisco",
    eircode: "SF2 456",
    active: true,
    amenities: ["Gym", "WiFi", "Workspace", "Rooftop terrace", "Concierge", "Murphy Bed"],
    verified: false,
    occupantsIfShared: null,
    viewingDatesAndTimes: ["Dec 21, 2pm-4pm"],
    applicants: 1,
    price: 2800,
    rating: 4.5,
    reviews: 94,
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function Component() {
  const [viewMode, setViewMode] = useState<"list" | "details">("list")
  const [selectedProperty, setSelectedProperty] = useState(properties[0])
  const [searchQuery, setSearchQuery] = useState("")

  const handlePropertySelect = (property: (typeof properties)[0]) => {
    setSelectedProperty(property)
    if (window.innerWidth < 1024) {
      setViewMode("details")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className=" top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem>Entire place</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Private room</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Shared room</DropdownMenuCheckboxItem>
                <Separator className="my-2" />
                <DropdownMenuCheckboxItem>WiFi</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Kitchen</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Parking</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Pool</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Listings Section - Always visible on desktop, toggleable on mobile */}
          <div className={`space-y-4 overflow-y-auto pr-2 pl-2 pb-2 ${viewMode === "details" ? "hidden lg:block" : ""}`}>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">{properties.length} properties found</h1>
              <div className="lg:hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(viewMode === "list" ? "details" : "list")}
                  className="gap-2"
                >
                  {viewMode === "list" ? (
                    <>
                      <Map className="h-4 w-4" />
                      Show Details
                    </>
                  ) : (
                    <>
                      <List className="h-4 w-4" />
                      Show List
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                    selectedProperty.id === property.id ? "ring-2 ring-primary shadow-lg" : ""
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={property.image || "/placeholder.svg"}
                          alt={property.propertyName}
                          width={200}
                          height={150}
                          className="rounded-lg object-cover w-48 h-36"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                        </Button>
                        {property.verified && <Badge className="absolute bottom-2 left-2 bg-green-500">Verified</Badge>}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              {property.propertyType}
                            </Badge>
                            <h3 className="font-semibold text-lg leading-tight">{property.propertyName}</h3>
                            <div className="flex items-center gap-1 text-muted-foreground mt-1">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{property.address}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {property.eircode} • {property.size}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                             
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {property.amenities.slice(0, 4).map((amenity) => (
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

                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">{property.availability}</div>
                            {property.occupantsIfShared && (
                              <div className="text-muted-foreground">{property.occupantsIfShared}</div>
                            )}
                            <div className="text-muted-foreground">
                              {property.applicants} applicant{property.applicants !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold">€{property.price}</span>
                            <span className="text-muted-foreground"> / month</span>
                          </div>
                        </div>

                        {property.viewingDatesAndTimes.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Next viewings:</p>
                            <div className="flex flex-wrap gap-1">
                              {property.viewingDatesAndTimes.slice(0, 2).map((viewing, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {viewing}
                                </Badge>
                              ))}
                              {property.viewingDatesAndTimes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.viewingDatesAndTimes.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Panel - Map or Property Details */}
          <div className={`${viewMode === "list" ? "hidden lg:block" : ""}`}>
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "details" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("details")}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    Details View
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="gap-2"
                  >
                    <Map className="h-4 w-4" />
                    Map View
                  </Button>
                </div>
              </div>

              <Card className="h-[calc(100vh-200px)]">
                <CardContent className="p-0 h-full">
                  {viewMode === "list" ? (
                    // Map View
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-gradient-to-br from-blue-200 via-green-200 to-blue-300"></div>
                      </div>

                      {/* Property Markers */}
                      <div className="absolute top-20 left-16">
                        <div className="bg-white rounded-full p-2 shadow-lg border-2 border-blue-500">
                          <span className="text-sm font-bold text-blue-600">€1800</span>
                        </div>
                      </div>
                      <div className="absolute top-32 right-20">
                        <div className="bg-white rounded-full p-2 shadow-lg border-2 border-green-500">
                          <span className="text-sm font-bold text-green-600">€4500</span>
                        </div>
                      </div>
                      <div className="absolute bottom-32 left-24">
                        <div className="bg-white rounded-full p-2 shadow-lg border-2 border-purple-500">
                          <span className="text-sm font-bold text-purple-600">€3200</span>
                        </div>
                      </div>
                      <div className="absolute bottom-20 right-16">
                        <div className="bg-white rounded-full p-2 shadow-lg border-2 border-orange-500">
                          <span className="text-sm font-bold text-orange-600">€1200</span>
                        </div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-white rounded-full p-2 shadow-lg border-2 border-red-500">
                          <span className="text-sm font-bold text-red-600">€2800</span>
                        </div>
                      </div>

                      <div className="text-center z-10">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Interactive Map View</p>
                        <p className="text-sm text-muted-foreground mt-1">Property locations and pricing</p>
                      </div>
                    </div>
                  ) : (
                    // Property Details View
                    <PropertyView selectedProperty={selectedProperty} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
