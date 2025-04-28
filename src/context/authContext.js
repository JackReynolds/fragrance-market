"use client";

import React, { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.config";

/**
 * The AuthContext holds minimal authentication state:
 *   - authUser: the raw Firebase Auth user object
 *   - authLoading: whether we're still initializing or checking the current user
 */
export const AuthContext = createContext({
  authUser: null, // Will store the raw Firebase user (uid, email, etc.)
  authLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Use the pre-initialized auth instance from firebase.config.js
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });

    return () => {
      // Cleanup subscription on unmount
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, authLoading }}>
      {/* Always render children, even when loading */}
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
