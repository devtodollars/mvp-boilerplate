import { SearchFilters } from './AdvancedSearchFilters'

// Keywords that map to specific filters
const SEARCH_KEYWORDS = {
  // Location keywords
  location: {
    'dublin': { county: 'Dublin' },
    'cork': { county: 'Cork' },
    'galway': { county: 'Galway' },
    'limerick': { county: 'Limerick' },
    'waterford': { county: 'Waterford' },
    'kilkenny': { county: 'Kilkenny' },
    'wicklow': { county: 'Wicklow' },
    'wexford': { county: 'Wexford' },
    'carlow': { county: 'Carlow' },
    'kildare': { county: 'Kildare' },
    'laois': { county: 'Laois' },
    'offaly': { county: 'Offaly' },
    'westmeath': { county: 'Westmeath' },
    'longford': { county: 'Longford' },
    'meath': { county: 'Meath' },
    'louth': { county: 'Louth' },
    'monaghan': { county: 'Monaghan' },
    'cavan': { county: 'Cavan' },
    'leitrim': { county: 'Leitrim' },
    'sligo': { county: 'Sligo' },
    'mayo': { county: 'Mayo' },
    'roscommon': { county: 'Roscommon' },
    'clare': { county: 'Clare' },
    'tipperary': { county: 'Tipperary' },
    'kerry': { county: 'Kerry' },
    'donegal': { county: 'Donegal' }
  },
  
  // Property type keywords
  propertyType: {
    'apartment': { propertyType: 'Apartment' },
    'flat': { propertyType: 'Apartment' },
    'house': { propertyType: 'House' },
    'studio': { propertyType: 'Studio' },
    'townhouse': { propertyType: 'Townhouse' },
    'duplex': { propertyType: 'Duplex' },
    'penthouse': { propertyType: 'Penthouse' }
  },
  
  // Room type keywords
  roomType: {
    'single': { roomType: 'Single' },
    'double': { roomType: 'Double' },
    'twin': { roomType: 'Twin' },
    'triple': { roomType: 'Triple' },
    'quad': { roomType: 'Quad' },
    'shared': { roomType: 'Single' }, // Default to single for shared rooms
    'private': { roomType: 'Single' }
  },
  
  // Price keywords
  price: {
    'cheap': { maxPrice: 800 },
    'affordable': { maxPrice: 1200 },
    'budget': { maxPrice: 1000 },
    'expensive': { minPrice: 1500 },
    'luxury': { minPrice: 2000 },
    'premium': { minPrice: 1800 }
  },
  
  // Amenity keywords
  amenities: {
    'wifi': { amenities: ['wifi'] },
    'internet': { amenities: ['wifi'] },
    'parking': { amenities: ['parking'] },
    'car': { amenities: ['parking'] },
    'kitchen': { amenities: ['kitchen'] },
    'cooking': { amenities: ['kitchen'] },
    'gym': { amenities: ['gym'] },
    'fitness': { amenities: ['gym'] },
    'pets': { pets: true },
    'pet': { pets: true },
    'dog': { pets: true },
    'cat': { pets: true },
    'ensuite': { ensuite: true },
    'bathroom': { ensuite: true },
    'balcony': { amenities: ['balcony'] },
    'garden': { amenities: ['garden'] },
    'washing': { amenities: ['washing_machine'] },
    'laundry': { amenities: ['washing_machine'] },
    'dishwasher': { amenities: ['dishwasher'] },
    'air conditioning': { amenities: ['air_conditioning'] },
    'ac': { amenities: ['air_conditioning'] },
    'heating': { amenities: ['heating'] },
    'central heating': { amenities: ['heating'] }
  },
  
  // Special features
  features: {
    'owner occupied': { ownerOccupied: true },
    'owner-occupied': { ownerOccupied: true },
    'verified': { verifiedOnly: true },
    'trusted': { verifiedOnly: true },
    'available now': { availableFrom: new Date().toISOString().split('T')[0] },
    'immediate': { availableFrom: new Date().toISOString().split('T')[0] }
  }
}

// Natural language patterns
const NATURAL_LANGUAGE_PATTERNS = [
  // Price patterns
  { 
    pattern: /(?:under|less than|max|up to)\s*€?(\d+)/i, 
    action: (matches: RegExpMatchArray) => ({ maxPrice: parseInt(matches[1]) })
  },
  { 
    pattern: /(?:over|more than|min|from)\s*€?(\d+)/i, 
    action: (matches: RegExpMatchArray) => ({ minPrice: parseInt(matches[1]) })
  },
  { 
    pattern: /€?(\d+)\s*-\s*€?(\d+)/i, 
    action: (matches: RegExpMatchArray) => ({ 
      minPrice: parseInt(matches[1]), 
      maxPrice: parseInt(matches[2]) 
    })
  },
  
  // Size patterns
  { 
    pattern: /(\d+)\s*(?:sqm|m²|square meters?)/i, 
    action: (matches: RegExpMatchArray) => ({ size: parseInt(matches[1]) })
  },
  
  // Occupancy patterns
  { 
    pattern: /(\d+)\s*(?:people?|occupants?|tenants?)/i, 
    action: (matches: RegExpMatchArray) => ({ maxOccupants: parseInt(matches[1]) })
  }
]

export function parseNaturalLanguageQuery(query: string): Partial<SearchFilters> {
  const filters: Partial<SearchFilters> = {}
  const lowerQuery = query.toLowerCase()
  
  // Extract location from query
  const locationMatch = lowerQuery.match(/(?:in|at|near|around)\s+([a-zA-Z\s]+)/)
  if (locationMatch) {
    filters.location = locationMatch[1].trim()
  }
  
  // Process keyword matches
  Object.entries(SEARCH_KEYWORDS).forEach(([category, keywords]) => {
    Object.entries(keywords).forEach(([keyword, filterUpdate]) => {
      if (lowerQuery.includes(keyword)) {
        Object.assign(filters, filterUpdate)
      }
    })
  })
  
  // Process natural language patterns
  NATURAL_LANGUAGE_PATTERNS.forEach(({ pattern, action }) => {
    const matches = query.match(pattern)
    if (matches) {
      Object.assign(filters, action(matches))
    }
  })
  
  return filters
}

export function buildSupabaseQuery(filters: SearchFilters) {
  let query = ''
  const params: any[] = []
  let paramIndex = 1
  
  // Base query
  query += 'SELECT * FROM listings WHERE active = true'
  
  // Location filters
  if (filters.location) {
    query += ` AND (address ILIKE $${paramIndex} OR city ILIKE $${paramIndex} OR area ILIKE $${paramIndex})`
    params.push(`%${filters.location}%`)
    paramIndex++
  }
  
  if (filters.county) {
    query += ` AND county = $${paramIndex}`
    params.push(filters.county)
    paramIndex++
  }
  
  if (filters.city) {
    query += ` AND city = $${paramIndex}`
    params.push(filters.city)
    paramIndex++
  }
  
  // Price filters
  if (filters.minPrice > 0) {
    query += ` AND monthly_rent >= $${paramIndex}`
    params.push(filters.minPrice)
    paramIndex++
  }
  
  if (filters.maxPrice > 0) {
    query += ` AND monthly_rent <= $${paramIndex}`
    params.push(filters.maxPrice)
    paramIndex++
  }
  
  // Property type
  if (filters.propertyType) {
    query += ` AND property_type = $${paramIndex}`
    params.push(filters.propertyType)
    paramIndex++
  }
  
  // Room type
  if (filters.roomType) {
    query += ` AND room_type = $${paramIndex}`
    params.push(filters.roomType)
    paramIndex++
  }
  
  // Size
  if (filters.size > 0) {
    query += ` AND size >= $${paramIndex}`
    params.push(filters.size)
    paramIndex++
  }
  
  // Occupancy
  if (filters.currentOccupants > 0) {
    query += ` AND (current_males + current_females) <= $${paramIndex}`
    params.push(filters.currentOccupants)
    paramIndex++
  }
  
  // Special features
  if (filters.ensuite) {
    query += ` AND ensuite = true`
  }
  
  if (filters.pets) {
    query += ` AND pets = true`
  }
  
  if (filters.ownerOccupied) {
    query += ` AND owner_occupied = true`
  }
  
  // Verification
  if (filters.verifiedOnly) {
    query += ` AND verified = true`
  }
  
  // Availability
  if (filters.availableFrom) {
    query += ` AND available_from <= $${paramIndex}`
    params.push(filters.availableFrom)
    paramIndex++
  }
  
  // Viewing times
  if (filters.hasViewingTimes) {
    query += ` AND viewing_times IS NOT NULL AND array_length(viewing_times, 1) > 0`
  }
  
  // Amenities (JSONB array contains)
  if (filters.amenities.length > 0) {
    filters.amenities.forEach((amenity, index) => {
      query += ` AND amenities @> $${paramIndex}`
      params.push(JSON.stringify([amenity]))
      paramIndex++
    })
  }
  
  // Order by relevance (verified first, then by price)
  query += ' ORDER BY verified DESC, monthly_rent ASC'
  
  return { query, params }
}

export function getSearchSuggestions(query: string): string[] {
  const suggestions: string[] = []
  const lowerQuery = query.toLowerCase()
  
  // Location suggestions
  if (lowerQuery.includes('dublin') || lowerQuery.includes('cork') || lowerQuery.includes('galway')) {
    suggestions.push('Try searching for specific areas within these cities')
  }
  
  // Price suggestions
  if (lowerQuery.includes('cheap') || lowerQuery.includes('budget')) {
    suggestions.push('Consider properties under €800 for budget options')
  }
  
  if (lowerQuery.includes('expensive') || lowerQuery.includes('luxury')) {
    suggestions.push('Try properties over €1500 for premium options')
  }
  
  // Amenity suggestions
  if (lowerQuery.includes('pet')) {
    suggestions.push('Filter by "Pet Friendly" to see all pet-friendly properties')
  }
  
  if (lowerQuery.includes('parking')) {
    suggestions.push('Use the "Parking" filter to find properties with parking')
  }
  
  // General suggestions
  if (query.length < 3) {
    suggestions.push('Try searching for a city, area, or specific features')
  }
  
  return suggestions
} 