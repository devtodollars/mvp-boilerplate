import React, { useState, useRef } from 'react';
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
  const timeoutRef = useRef<any>();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchAddressSuggestions(val, country);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleInput}
        placeholder="Enter address"
        className="w-full border rounded px-3 py-2"
        autoComplete="off"
      />
      {loading && <div className="absolute left-0 mt-1 text-xs">Loading...</div>}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(s.place_name, s);
                setSuggestions([]);
              }}
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};