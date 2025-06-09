"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  collection,
  query,
  where,
  or,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase.config";
import SwapRequestsList from "@/components/inbox/swapRequestsList";
import ChatWindow from "@/components/inbox/chatWindow";
import { Loader2 } from "lucide-react";
import { useUserDoc } from "@/hooks/useUserDoc";
import Navigation from "@/components/ui/navigation";

export default function InboxPage() {
  const { authUser } = useAuth();
  const [swapRequests, setSwapRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { userDoc } = useUserDoc();
  // Detect mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch swap requests
  useEffect(() => {
    if (!authUser?.uid) return;

    const requestsRef = collection(db, "swap_requests");
    const q = query(
      requestsRef,
      or(
        where("requestedFrom.uid", "==", authUser.uid),
        where("offeredBy.uid", "==", authUser.uid)
      ),
      orderBy("updatedAt", "desc")
    );

    // Replace getDocs with onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      setSwapRequests(requests);

      // Update selectedRequest if it was deleted
      if (
        selectedRequest &&
        !requests.find((r) => r.id === selectedRequest.id)
      ) {
        setSelectedRequest(requests.length > 0 ? requests[0] : null);
      }
    });

    setLoading(false);
    return () => unsubscribe();
  }, [authUser?.uid]);

  // Handle request selection
  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    // On mobile, this should switch the view
    if (isMobile) {
      document
        .getElementById("chat-window")
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  // Back to list on mobile
  const handleBackToList = () => {
    document
      .getElementById("requests-list")
      .scrollIntoView({ behavior: "smooth" });
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p>Please sign in to view your messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* <Navigation /> */}
      <div className="container px-4 py-6 mx-auto">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        <div className="flex flex-col md:flex-row gap-4 h-[70vh]">
          {/* Swap Requests List - Left Side */}
          <div
            id="requests-list"
            className={`w-full md:w-1/3 md:max-w-[350px] border rounded-lg md:h-full overflow-hidden ${
              isMobile && selectedRequest ? "hidden md:block" : "block"
            }`}
          >
            <SwapRequestsList
              requests={swapRequests}
              selectedId={selectedRequest?.id}
              onSelectRequest={handleSelectRequest}
              currentUserId={authUser.uid}
            />
          </div>

          {/* Chat Window - Right Side */}
          <div
            id="chat-window"
            className={`flex-1 border rounded-lg md:h-full ${
              isMobile && !selectedRequest ? "hidden md:block" : "block"
            }`}
          >
            {selectedRequest ? (
              <ChatWindow
                swapRequest={selectedRequest}
                authUser={authUser}
                onBackClick={isMobile ? handleBackToList : null}
                userDoc={userDoc}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
