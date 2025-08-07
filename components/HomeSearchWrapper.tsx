"use client"

import { useRouter } from 'next/navigation'
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar'
import { SearchFilters } from '@/components/search/AdvancedSearchFilters'

export default function HomeSearchWrapper() {
  const router = useRouter()

  const handleSearch = (query: string, filters: Partial<SearchFilters>) => {
    // Build the search URL with query parameters
    const params = new URLSearchParams()
    
    if (query) {
      params.set('q', query)
    }
    
    // Add filter parameters
    if (filters.county) params.set('county', filters.county)
    if (filters.propertyType) params.set('propertyType', filters.propertyType)
    if (filters.roomType) params.set('roomType', filters.roomType)
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.pets) params.set('pets', 'true')
    if (filters.ensuite) params.set('ensuite', 'true')
    if (filters.verifiedOnly) params.set('verifiedOnly', 'true')
    
    // Navigate to search page with parameters
    const searchUrl = `/search?${params.toString()}`
    router.push(searchUrl)
  }

  return (
    <EnhancedSearchBar
      onSearch={handleSearch}
      placeholder="e.g., 'cheap apartment in Dublin' or 'pet friendly under €1000'"
      className="w-full"
    />
  )
} 