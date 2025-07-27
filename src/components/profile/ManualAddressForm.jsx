"use client";

/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CountrySelect from "@/components/countrySelect";

export default function ManualAddressForm({ onSave, onCancel, initialValue }) {
  const [fields, setFields] = useState(
    initialValue || {
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      countryCode: "",
    }
  );

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (countryName, countryCode) => {
    setFields({
      ...fields,
      country: countryName,
      countryCode: countryCode,
    });
  };

  const handleSave = () => {
    // Create formatted address
    const formattedAddress = [
      fields.streetAddress,
      fields.city,
      fields.state,
      fields.postalCode,
      fields.country,
    ]
      .filter(Boolean)
      .join(", ");

    const addressComponents = { ...fields };

    console.log(addressComponents);
    console.log(formattedAddress);

    onSave({
      formattedAddress,
      addressComponents,
    });
  };

  return (
    <div className="space-y-2">
      <Input
        name="streetAddress"
        placeholder="Street Address"
        value={fields.streetAddress}
        onChange={handleChange}
      />

      <Input
        name="city"
        placeholder="City"
        value={fields.city}
        onChange={handleChange}
      />
      <Input
        name="state"
        placeholder="State/Province/Region"
        value={fields.state}
        onChange={handleChange}
      />
      <Input
        name="postalCode"
        placeholder="Postal Code"
        value={fields.postalCode}
        onChange={handleChange}
      />

      <CountrySelect
        value={fields.country}
        countryCode={fields.countryCode}
        onChange={handleCountryChange}
        placeholder="Select country..."
      />

      <div className="flex gap-2 mt-4">
        <Button
          className="hover:cursor-pointer hover:bg-primary/80"
          onClick={handleSave}
        >
          Save Changes
        </Button>
        <Button
          className="hover:cursor-pointer"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
