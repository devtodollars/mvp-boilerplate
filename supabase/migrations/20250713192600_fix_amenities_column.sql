-- First, add a temporary column with the new type
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS amenities_new amenity_type[] DEFAULT '{}';

-- Copy the data from the old column to the new column, filtering out any invalid values
UPDATE public.listings 
SET amenities_new = (
    SELECT ARRAY_AGG(value::amenity_type)
    FROM jsonb_array_elements_text(amenities) AS value
    WHERE value IN (
        'Wi-Fi', 'Parking', 'Garden Access', 'Balcony/Terrace', 
        'Washing Machine', 'Dryer', 'Dishwasher', 'Microwave', 
        'TV', 'Central Heating', 'Fireplace', 'Air Conditioning', 
        'Gym Access', 'Swimming Pool', 'Storage Space', 'Bike Storage', 
        'Furnished', 'Unfurnished', 'Pet Friendly', 'Smoking Allowed'
    )
)
WHERE amenities IS NOT NULL AND amenities != '[]'::jsonb;

-- Drop the old column
ALTER TABLE public.listings 
DROP COLUMN amenities;

-- Rename the new column to the original name
ALTER TABLE public.listings 
RENAME COLUMN amenities_new TO amenities;

-- Set the default for the column
ALTER TABLE public.listings 
ALTER COLUMN amenities SET DEFAULT '{}';
