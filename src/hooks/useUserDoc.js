"use client";

import { useContext } from "react";
import { UserDocContext } from "../context/userDocContext";

export const useUserDoc = () => {
  return useContext(UserDocContext);
};
