import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Box } from '@mui/material';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

const PlacesAutocompleteImpl: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
}) => {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {},
    debounce: 300,
  });

  useEffect(() => {
    if (value !== inputValue) {
      setValue(value, false);
    }
  }, [value, inputValue, setValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue, false);
    onChange(newValue);
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    onChange(address);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onChange(address, { lat, lng });
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, data: google.maps.places.AutocompletePrediction) => {
    const {
      place_id,
      description,
      structured_formatting: { main_text, secondary_text },
    } = data;

    return (
      <li {...props} key={place_id}>
        <Box component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 2, fontSize: 16, color: 'primary.main' }} />
          <div>
            <div style={{ fontWeight: 500, color: 'text.primary' }}>{main_text}</div>
            <div style={{ fontSize: 12, color: 'text.secondary' }}>{secondary_text}</div>
          </div>
        </Box>
      </li>
    );
  };

  // Create a default prediction object when value is not in options
  const currentPrediction = status === 'OK' && data.some(item => item.description === value) 
    ? data.find(item => item.description === value)!
    : {
        description: value,
        place_id: '',
        reference: '',
        id: '',
        matched_substrings: [],
        structured_formatting: { 
          main_text: value, 
          secondary_text: '', 
          main_text_matched_substrings: [] 
        },
        terms: [],
        types: []
      };

  return (
    <Autocomplete
      id="google-maps-place-autocomplete"
      sx={{ width: '100%', '& .MuiAutocomplete-inputRoot': { p: '2px 4px' }, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
      options={status === 'OK' ? data : []}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={currentPrediction}
      noOptionsText="No locations found"
      onChange={(event, newValue) => {
        if (newValue) {
          handleSelect(newValue.description);
        }
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        if (newInputValue !== value) {
          handleInputChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Location"
          placeholder={placeholder}
          fullWidth
          disabled={!ready}
          variant="outlined"
          size="small"
        />
      )}
      renderOption={renderOption}
      getOptionLabel={(option) => {
        // If option is a string, return it directly
        if (typeof option === 'string') {
          return option;
        }
        // If option is an AutocompletePrediction object, return its description
        return option.description || '';
      }}
    />
  );
};

export default PlacesAutocompleteImpl;