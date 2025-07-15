"use client"

import { useEffect, useState } from "react"
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
import { createClient } from "@/utils/supabase/client"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { fetchListings } from '@/utils/supabase/listings';
import { getListingImages } from '@/utils/supabase/storage';

export default function Component() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "details">("list")
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await fetchListings()
      if (!error && data) {
        setListings(data)
        setSelectedProperty(data[0] || null)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property)
    if (window.innerWidth < 1024) {
      setViewMode("details")
    }
  }

  // Helper to get image URLs (array of strings)
  const getImageUrls = (listing: any) => getListingImages(listing.images);

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
              <h1 className="text-2xl font-semibold">{listings.length} properties found</h1>
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
              {loading ? (
                <div>Loading...</div>
              ) : (
                listings.map((property) => (
                  <Card
                    key={property.id}
                    className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${selectedProperty?.id === property.id ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => handlePropertySelect(property)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        <div className="relative flex-shrink-0 w-48 h-36">
                          <Carousel className="w-48 h-36">
                            <CarouselContent>
                              {getImageUrls(property).map((img: string, idx: number) => (
                                <CarouselItem key={idx} className="w-48 h-36">
                                  <Image
                                    src={img}
                                    alt={property.property_name}
                                    width={200}
                                    height={150}
                                    className="rounded-lg object-cover w-48 h-36"
                                  />
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                          {property.verified && <Badge className="absolute bottom-2 left-2 bg-green-500">Verified</Badge>}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="secondary" className="mb-2">
                                {property.property_type}
                              </Badge>
                              <h3 className="font-semibold text-lg leading-tight">{property.property_name}</h3>
                              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">{property.address}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {property.eircode} • {property.size} m²
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

                          <div className="flex items-center justify-between text-sm">
                            <div className="space-y-1">
                              <div className="text-green-600 font-medium">{property.availability}</div>
                              {property.occupants_if_shared && (
                                <div className="text-muted-foreground">{property.occupants_if_shared}</div>
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

                          {Array.isArray(property.viewing_dates_and_times) && property.viewing_dates_and_times.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-1">Next viewings:</p>
                              <div className="flex flex-wrap gap-1">
                                {property.viewing_dates_and_times.slice(0, 2).map((viewing: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {viewing}
                                  </Badge>
                                ))}
                                {property.viewing_dates_and_times.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{property.viewing_dates_and_times.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
