"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Sparkles, X, MapPin, Euro, Home, Users } from "lucide-react"
import { parseNaturalLanguageQuery } from "./AISearchLogic"
import { SearchFilters } from "./AdvancedSearchFilters"

interface EnhancedSearchBarProps {
  onSearch: (query: string, filters: Partial<SearchFilters>) => void
  placeholder?: string
  className?: string
  initialValue?: string
}

export default function EnhancedSearchBar({ 
  onSearch, 
  placeholder = "Search for properties...",
  className = "",
  initialValue = ""
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [activeFilters, setActiveFilters] = useState<Partial<SearchFilters>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // Update query when initialValue changes
  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  const handleSearch = () => {
    if (query.trim()) {
      const parsedFilters = parseNaturalLanguageQuery(query)
      setActiveFilters(parsedFilters)
      onSearch(query, parsedFilters)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setQuery("")
    setActiveFilters({})
    onSearch("", {})
    inputRef.current?.focus()
  }

  const getActiveFiltersDisplay = () => {
    const filters: string[] = []
    
    if (activeFilters.county) filters.push(activeFilters.county)
    if (activeFilters.propertyType) filters.push(activeFilters.propertyType)
    if (activeFilters.roomType) filters.push(activeFilters.roomType)
    if (activeFilters.minPrice) filters.push(`€${activeFilters.minPrice}+`)
    if (activeFilters.maxPrice) filters.push(`€${activeFilters.maxPrice}-`)
    if (activeFilters.pets) filters.push("Pet Friendly")
    if (activeFilters.ensuite) filters.push("Ensuite")
    if (activeFilters.verifiedOnly) filters.push("Verified")
    
    return filters
  }

  const activeFiltersDisplay = getActiveFiltersDisplay()

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersDisplay.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {activeFiltersDisplay.map((filter, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {filter}
            </Badge>
          ))}
        </div>
      )}

      {/* Example Queries */}
      {!query && !activeFiltersDisplay.length && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="mb-1">Try: "cheap apartment in Dublin" or "pet friendly under €1000"</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => {
              const query = "cheap apartment in Dublin"
              setQuery(query)
              const parsedFilters = parseNaturalLanguageQuery(query)
              setActiveFilters(parsedFilters)
              onSearch(query, parsedFilters)
            }}>
              Cheap apartment in Dublin
            </Badge>
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => {
              const query = "pet friendly under €1000"
              setQuery(query)
              const parsedFilters = parseNaturalLanguageQuery(query)
              setActiveFilters(parsedFilters)
              onSearch(query, parsedFilters)
            }}>
              Pet friendly under €1000
            </Badge>
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => {
              const query = "ensuite room with parking"
              setQuery(query)
              const parsedFilters = parseNaturalLanguageQuery(query)
              setActiveFilters(parsedFilters)
              onSearch(query, parsedFilters)
            }}>
              Ensuite room with parking
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
} 