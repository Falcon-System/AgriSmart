import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the component to avoid SSR issues
const DynamicPlacesAutocompleteImpl = dynamic(
  () => import('./PlacesAutocompleteImpl'),
  { ssr: false }
);

interface PlacesAutocompleteProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
}) => {
  return (
    <DynamicPlacesAutocompleteImpl
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export default PlacesAutocomplete;