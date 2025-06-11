"use client";

/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries = ["places"];

const AddressLocationSearch = ({ defaultValue, onSelect }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState(defaultValue || "");

  const onLoad = (autocompleteInstance) =>
    setAutocomplete(autocompleteInstance);

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.address_components) return;

    // Use Google's formatted address for display/storage
    setInputValue(place.formatted_address);

    // Extract structured components for backend/shipping
    const getComponent = (type) =>
      (place.address_components.find((c) => c.types.includes(type)) || {})[
        type === "country" ? "short_name" : "long_name"
      ] || "";

    const locationData = {
      formattedAddress: place.formatted_address,
      addressComponents: {
        streetNumber: getComponent("street_number"),
        streetName: getComponent("route"),
        city: getComponent("locality"),
        state: getComponent("administrative_area_level_1"),
        country: getComponent("country"),
        postalCode: getComponent("postal_code"),
      },
    };

    onSelect?.(locationData);
  };

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        Error loading Google Maps. Please try again later.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading address search...
      </div>
    );
  }

  return (
    <div className="w-full">
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <input
          type="text"
          placeholder="Start typing your address or postal code..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-3 py-2 border rounded-md border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          autoComplete="off"
        />
      </Autocomplete>
      <p className="mt-1 text-xs text-muted-foreground">
        Please enter your complete street address for accurate shipping
      </p>
    </div>
  );
};

export default AddressLocationSearch;
