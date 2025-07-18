import React, { useState, useRef, useEffect } from 'react';
import { fetchAddressSuggestions } from '@/utils/mapbox/mapbox';

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string, data: any) => void;
  country?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  country = 'IE',
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (val.trim().length > 2) {
        setLoading(true);
        try {
          const results = await fetchAddressSuggestions(val, country);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handleSuggestionClick = (suggestion: any) => {
    onSelect(suggestion.place_name, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={value}
        onChange={handleInput}
        placeholder="Enter address or eircode"
        className="w-full border rounded px-3 py-2"
        autoComplete="off"
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />
      {loading && <div className="absolute left-0 mt-1 text-xs text-gray-500">Loading...</div>}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSuggestionClick(s)}
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};