"use client";

/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.config";
import { AuthContext } from "./authContext";

/**
 * UserDocContext will provide the "extended user data" from Firestore,
 * which contains veriff info, phone number, address, etc.
 */
export const UserDocContext = createContext({
  userDoc: null, // The extended user document from Firestore
  userDocLoading: true,
});

export const UserDocProvider = ({ children }) => {
  const { authUser } = useContext(AuthContext); // minimal auth
  const [userDoc, setUserDoc] = useState(null);
  const [userDocLoading, setUserDocLoading] = useState(true);

  useEffect(() => {
    // If no authUser, then no userDoc
    if (!authUser) {
      setUserDoc(null);
      setUserDocLoading(false);
      return;
    }

    setUserDocLoading(true);

    const docRef = doc(db, "users", authUser.uid);
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserDoc({ id: docSnap.id, ...docSnap.data() });
        } else {
          setUserDoc(null);
        }
        setUserDocLoading(false);
      },
      (error) => {
        console.error("Error in onSnapshot for user doc:", error);
        setUserDocLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  return (
    <UserDocContext.Provider value={{ userDoc, userDocLoading }}>
      {children}
    </UserDocContext.Provider>
  );
};
