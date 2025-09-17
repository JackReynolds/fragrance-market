"use client";

/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.config";
import { AuthContext } from "./authContext";

/**
 * ProfileDocContext will provide the "extended user data" from Firestore,
 * which contains veriff info, phone number, address, etc.
 */
export const ProfileDocContext = createContext({
  profileDoc: null, // The extended user document from Firestore
  profileDocLoading: true,
});

export const ProfileDocProvider = ({ children }) => {
  const { authUser } = useContext(AuthContext); // minimal auth
  const [profileDoc, setProfileDoc] = useState(null);
  const [profileDocLoading, setProfileDocLoading] = useState(true);

  useEffect(() => {
    // If no authUser, then no profileDoc
    if (!authUser) {
      setProfileDoc(null);
      setProfileDocLoading(false);
      return;
    }

    setProfileDocLoading(true);

    const docRef = doc(db, "profiles", authUser.uid);
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfileDoc({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProfileDoc(null);
        }
        setProfileDocLoading(false);
      },
      (error) => {
        console.error("Error in onSnapshot for user doc:", error);
        setProfileDocLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  return (
    <ProfileDocContext.Provider value={{ profileDoc, profileDocLoading }}>
      {children}
    </ProfileDocContext.Provider>
  );
};
