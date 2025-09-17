"use client";

import { useContext } from "react";
import { ProfileDocContext } from "../context/profileDocContext";

export const useProfileDoc = () => {
  return useContext(ProfileDocContext);
};
