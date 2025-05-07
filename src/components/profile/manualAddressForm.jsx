"use client";

/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ManualAddressForm({ onSave, onCancel, initialValue }) {
  const [fields, setFields] = useState(
    initialValue || {
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    }
  );

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
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
      <Input
        name="country"
        placeholder="Country"
        value={fields.country}
        onChange={handleChange}
      />
      <div className="flex gap-2 mt-4">
        <Button onClick={handleSave}>Save Changes</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
