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
    'apartment': { propertyType: 'apartment' },
    'flat': { propertyType: 'flat' },
    'house': { propertyType: 'house' },
    'studio': { propertyType: 'studio' },
    'other': { propertyType: 'other' }
  },
  
  // Room type keywords
  roomType: {
    'single': { roomType: 'single' },
    'double': { roomType: 'double' },
    'twin': { roomType: 'twin' },
    'shared': { roomType: 'shared' },
    'digs': { roomType: 'digs' },
    'private': { roomType: 'single' }
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
    'wifi': { amenities: ['Wi-Fi'] },
    'internet': { amenities: ['Wi-Fi'] },
    'parking': { amenities: ['Parking'] },
    'car': { amenities: ['Parking'] },
    'garden': { amenities: ['Garden Access'] },
    'balcony': { amenities: ['Balcony/Terrace'] },
    'terrace': { amenities: ['Balcony/Terrace'] },
    'washing': { amenities: ['Washing Machine'] },
    'laundry': { amenities: ['Washing Machine'] },
    'dryer': { amenities: ['Dryer'] },
    'dishwasher': { amenities: ['Dishwasher'] },
    'microwave': { amenities: ['Microwave'] },
    'tv': { amenities: ['TV'] },
    'television': { amenities: ['TV'] },
    'heating': { amenities: ['Central Heating'] },
    'central heating': { amenities: ['Central Heating'] },
    'fireplace': { amenities: ['Fireplace'] },
    'air conditioning': { amenities: ['Air Conditioning'] },
    'ac': { amenities: ['Air Conditioning'] },
    'gym': { amenities: ['Gym Access'] },
    'fitness': { amenities: ['Gym Access'] },
    'swimming': { amenities: ['Swimming Pool'] },
    'pool': { amenities: ['Swimming Pool'] },
    'storage': { amenities: ['Storage Space'] },
    'bike': { amenities: ['Bike Storage'] },
    'furnished': { amenities: ['Furnished'] },
    'unfurnished': { amenities: ['Unfurnished'] },
    'pets': { pets: true },
    'pet': { pets: true },
    'dog': { pets: true },
    'cat': { pets: true },
    'pet friendly': { pets: true },
    'ensuite': { ensuite: true },
    'bathroom': { ensuite: true },
    'smoking': { amenities: ['Smoking Allowed'] }
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
  
  // Enhanced location extraction - try multiple patterns
  const locationMatch = lowerQuery.match(/(?:in|at|near|around)\s+([a-zA-Z]+)(?:\s|$)/)
  if (locationMatch) {
    const location = locationMatch[1].trim()
    
    // Check if it's a known county first
    const countyKeywords = Object.keys(SEARCH_KEYWORDS.location)
    const matchedCounty = countyKeywords.find(county => location.includes(county))
    if (matchedCounty) {
      filters.location = location
      filters.county = (SEARCH_KEYWORDS.location as any)[matchedCounty].county
    } else {
      // Only set location if it's not a room type word
      const roomTypeWords = ['room', 'single', 'double', 'twin', 'shared', 'digs']
      if (!roomTypeWords.includes(location)) {
        filters.location = location
      }
    }
  } else {
    // If no "in/at/near" pattern found, check if the entire query is a location
    const countyKeywords = Object.keys(SEARCH_KEYWORDS.location)
    const matchedCounty = countyKeywords.find(county => lowerQuery.includes(county))
    if (matchedCounty) {
      filters.location = lowerQuery.trim()
      filters.county = (SEARCH_KEYWORDS.location as any)[matchedCounty].county
    } else {
      // Check if it's a simple location search (not a room type or other keyword)
      const roomTypeWords = ['room', 'single', 'double', 'twin', 'shared', 'digs']
      const otherKeywords = [
        'cheap', 'expensive', 'budget', 'luxury', 'pet', 'ensuite', 'wifi', 'parking',
        'garden', 'balcony', 'terrace', 'washing', 'laundry', 'dryer', 'dishwasher',
        'microwave', 'tv', 'television', 'heating', 'fireplace', 'gym', 'fitness',
        'swimming', 'pool', 'storage', 'bike', 'furnished', 'unfurnished', 'smoking'
      ]
      
      const isLocationSearch = !roomTypeWords.some(word => lowerQuery.includes(word)) &&
                              !otherKeywords.some(word => lowerQuery.includes(word)) &&
                              lowerQuery.trim().length > 0
      
      if (isLocationSearch) {
        filters.location = lowerQuery.trim()
      }
    }
  }
  
  // Enhanced room type detection - prioritize full phrases
  if (lowerQuery.includes('single room')) {
    filters.roomType = 'single'
  } else if (lowerQuery.includes('double room')) {
    filters.roomType = 'double'
  } else if (lowerQuery.includes('twin room')) {
    filters.roomType = 'twin'
  } else if (lowerQuery.includes('shared room')) {
    filters.roomType = 'shared'
  } else {
    // Fallback to individual keyword matching
    Object.entries(SEARCH_KEYWORDS.roomType).forEach(([keyword, filterUpdate]) => {
      if (lowerQuery.includes(keyword) && !filters.roomType) {
        Object.assign(filters, filterUpdate)
      }
    })
  }
  
  // Process other keyword matches (excluding roomType which we handled above)
  Object.entries(SEARCH_KEYWORDS).forEach(([category, keywords]) => {
    if (category === 'roomType') return // Skip since we handled this above
    
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
    filters.amenities.forEach((amenity, _) => {
      query += ` AND amenities @> $${paramIndex}`
      params.push(JSON.stringify([amenity]))
      paramIndex++
    })
  }
  
  // Order by relevance (verified first, then by price)
  query += ' ORDER BY verified DESC, monthly_rent ASC'
  
  return { query, params }
} 