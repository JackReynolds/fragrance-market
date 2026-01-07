"use client";

/* eslint-disable react/prop-types */

import {
  React,
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const AdminDataContext = createContext({
  users: [],
  listings: [],
  swaps: [],
  usersLoading: false,
  listingsLoading: false,
  swapsLoading: false,
  usersLastFetch: null,
  listingsLastFetch: null,
  swapsLastFetch: null,
  fetchUsers: async () => {},
  fetchListings: async () => {},
  fetchSwaps: async () => {},
  refreshUsers: async () => {},
  refreshListings: async () => {},
  refreshSwaps: async () => {},
  invalidateAll: () => {},
});

export const useAdminData = () => useContext(AdminDataContext);

export const AdminDataProvider = ({ children }) => {
  const { authUser } = useAuth();

  // Data state
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [swaps, setSwaps] = useState([]);

  // Loading state
  const [usersLoading, setUsersLoading] = useState(false);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [swapsLoading, setSwapsLoading] = useState(false);

  // Last fetch timestamps
  const [usersLastFetch, setUsersLastFetch] = useState(null);
  const [listingsLastFetch, setListingsLastFetch] = useState(null);
  const [swapsLastFetch, setSwapsLastFetch] = useState(null);

  // Prevent duplicate fetches
  const fetchingRef = useRef({
    users: false,
    listings: false,
    swaps: false,
  });

  // Check if cache is stale
  const isCacheStale = (lastFetch) => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  // Generic fetch function
  const fetchData = useCallback(
    async (endpoint, setData, setLoading, setLastFetch, fetchingKey) => {
      if (!authUser || fetchingRef.current[fetchingKey]) return;

      fetchingRef.current[fetchingKey] = true;
      setLoading(true);

      try {
        const token = await authUser.getIdToken();
        const res = await fetch(`/api/admin/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setData(data[endpoint] || []);
          setLastFetch(Date.now());
        } else {
          toast.error(`Failed to fetch ${endpoint}`);
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        toast.error(`Failed to fetch ${endpoint}`);
      } finally {
        setLoading(false);
        fetchingRef.current[fetchingKey] = false;
      }
    },
    [authUser]
  );

  // Fetch functions (use cache if valid)
  const fetchUsers = useCallback(async () => {
    if (!isCacheStale(usersLastFetch) && users.length > 0) {
      return; // Use cached data
    }
    await fetchData(
      "users",
      setUsers,
      setUsersLoading,
      setUsersLastFetch,
      "users"
    );
  }, [fetchData, usersLastFetch, users.length]);

  const fetchListings = useCallback(async () => {
    if (!isCacheStale(listingsLastFetch) && listings.length > 0) {
      return; // Use cached data
    }
    await fetchData(
      "listings",
      setListings,
      setListingsLoading,
      setListingsLastFetch,
      "listings"
    );
  }, [fetchData, listingsLastFetch, listings.length]);

  const fetchSwaps = useCallback(async () => {
    if (!isCacheStale(swapsLastFetch) && swaps.length > 0) {
      return; // Use cached data
    }
    await fetchData(
      "swaps",
      setSwaps,
      setSwapsLoading,
      setSwapsLastFetch,
      "swaps"
    );
  }, [fetchData, swapsLastFetch, swaps.length]);

  // Force refresh functions (bypass cache)
  const refreshUsers = useCallback(async () => {
    setUsersLastFetch(null); // Invalidate cache
    await fetchData(
      "users",
      setUsers,
      setUsersLoading,
      setUsersLastFetch,
      "users"
    );
  }, [fetchData]);

  const refreshListings = useCallback(async () => {
    setListingsLastFetch(null); // Invalidate cache
    await fetchData(
      "listings",
      setListings,
      setListingsLoading,
      setListingsLastFetch,
      "listings"
    );
  }, [fetchData]);

  const refreshSwaps = useCallback(async () => {
    setSwapsLastFetch(null); // Invalidate cache
    await fetchData(
      "swaps",
      setSwaps,
      setSwapsLoading,
      setSwapsLastFetch,
      "swaps"
    );
  }, [fetchData]);

  // Invalidate all caches (call after actions that modify data)
  const invalidateAll = useCallback(() => {
    setUsersLastFetch(null);
    setListingsLastFetch(null);
    setSwapsLastFetch(null);
  }, []);

  return (
    <AdminDataContext.Provider
      value={{
        users,
        listings,
        swaps,
        usersLoading,
        listingsLoading,
        swapsLoading,
        usersLastFetch,
        listingsLastFetch,
        swapsLastFetch,
        fetchUsers,
        fetchListings,
        fetchSwaps,
        refreshUsers,
        refreshListings,
        refreshSwaps,
        invalidateAll,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};
