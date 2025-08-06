"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Sparkles, X, MapPin, Euro, Home, Users } from "lucide-react"
import { parseNaturalLanguageQuery, getSearchSuggestions } from "./AISearchLogic"
import { SearchFilters } from "./AdvancedSearchFilters"

interface EnhancedSearchBarProps {
  onSearch: (query: string, filters: Partial<SearchFilters>) => void
  placeholder?: string
  className?: string
}

export default function EnhancedSearchBar({ 
  onSearch, 
  placeholder = "Search for properties...",
  className = ""
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Partial<SearchFilters>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        const newSuggestions = getSearchSuggestions(query)
        setSuggestions(newSuggestions)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = () => {
    if (query.trim()) {
      const parsedFilters = parseNaturalLanguageQuery(query)
      setActiveFilters(parsedFilters)
      onSearch(query, parsedFilters)
      setShowSuggestions(false)
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
    setSuggestions([])
    setShowSuggestions(false)
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
          onFocus={() => setShowSuggestions(true)}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearch}
            className="h-6 px-2 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Button>
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

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Search Tips:
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground p-1 rounded"
                  onClick={() => {
                    setQuery(suggestion)
                    setShowSuggestions(false)
                  }}
                >
                  💡 {suggestion}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Queries */}
      {!query && !activeFiltersDisplay.length && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="mb-1">Try: "cheap apartment in Dublin" or "pet friendly under €1000"</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => setQuery("cheap apartment in Dublin")}>
              Cheap apartment in Dublin
            </Badge>
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => setQuery("pet friendly under €1000")}>
              Pet friendly under €1000
            </Badge>
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => setQuery("ensuite room with parking")}>
              Ensuite room with parking
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
} 