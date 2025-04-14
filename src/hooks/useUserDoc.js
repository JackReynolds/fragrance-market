"use client";

import { useContext } from "react";
import { UserDocContext } from "../context/UserDocContext";

export const useUserDoc = () => {
  return useContext(UserDocContext);
};
