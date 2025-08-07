"use client"

import { useSearchParams } from 'next/navigation'
import SearchComponent from './searchComponent'
import { SearchFilters } from './AdvancedSearchFilters'

export default function SearchPageWrapper() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  
  // Extract all filter parameters from URL
  const filters: Partial<SearchFilters> = {}
  
  const county = searchParams.get('county')
  const propertyType = searchParams.get('propertyType')
  const roomType = searchParams.get('roomType')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const pets = searchParams.get('pets')
  const ensuite = searchParams.get('ensuite')
  const verifiedOnly = searchParams.get('verifiedOnly')
  
  if (county) filters.county = county
  if (propertyType) filters.propertyType = propertyType
  if (roomType) filters.roomType = roomType
  if (minPrice) filters.minPrice = parseInt(minPrice)
  if (maxPrice) filters.maxPrice = parseInt(maxPrice)
  if (pets === 'true') filters.pets = true
  if (ensuite === 'true') filters.ensuite = true
  if (verifiedOnly === 'true') filters.verifiedOnly = true

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <SearchComponent searchQuery={searchQuery} />
      </div>
    </div>
  )
} 