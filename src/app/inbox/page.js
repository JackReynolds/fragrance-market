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
import { useProfileDoc } from "@/hooks/useProfileDoc";

export default function InboxPage() {
  const { authUser } = useAuth();
  const [swapRequests, setSwapRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { profileDoc } = useProfileDoc();

  // Hide footer on this page
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }

    return () => {
      const footer = document.querySelector("footer");
      if (footer) {
        footer.style.display = "block";
      }
    };
  }, []);

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
    // Don't start query until auth is fully loaded
    if (!authUser?.uid) {
      setLoading(false);
      return;
    }

    // Add a small delay to ensure token is propagated
    const timer = setTimeout(() => {
      const requestsRef = collection(db, "swap_requests");
      const q = query(
        requestsRef,
        where("participants", "array-contains", authUser.uid),
        orderBy("updatedAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requests = [];
          querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
          });

          setSwapRequests(requests);

          if (selectedRequest) {
            const stillExists = requests.find(
              (r) => r.id === selectedRequest.id
            );
            if (!stillExists) {
              setSelectedRequest(null);
              if (isMobile) {
                setShowChat(false);
              }
              if (requests.length > 0) {
                setTimeout(() => {
                  setSelectedRequest(requests[0]);
                }, 100);
              }
            }
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching swap requests:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }, 100); // Small delay to ensure auth token is ready

    return () => clearTimeout(timer);
  }, [authUser?.uid, isMobile, selectedRequest]);

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedRequest(null);
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p>Please sign in to view your messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Main content - takes full remaining height */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Show either list or chat */}
        {isMobile ? (
          <>
            {!showChat ? (
              // Mobile: Show list (full height)
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 p-4 border-b bg-white">
                  <h1 className="text-xl font-bold">Messages</h1>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SwapRequestsList
                    requests={swapRequests}
                    selectedId={selectedRequest?.id}
                    onSelectRequest={handleSelectRequest}
                    currentUserId={authUser.uid}
                  />
                </div>
              </div>
            ) : (
              // Mobile: Show chat (full height)
              <div className="h-full">
                {selectedRequest && (
                  <ChatWindow
                    swapRequest={selectedRequest}
                    authUser={authUser}
                    onBackClick={handleBackToList}
                    profileDoc={profileDoc}
                    isMobile={true}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          // Desktop: Show both (full height)
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-white">
              <h1 className="text-2xl font-bold">Messages</h1>
            </div>
            <div className="flex-1 overflow-hidden px-4 pb-4">
              <div className="flex gap-4 h-full">
                {/* Swap Requests List */}
                <div className="w-1/3 max-w-[350px] border rounded-lg h-full overflow-hidden">
                  <SwapRequestsList
                    requests={swapRequests}
                    selectedId={selectedRequest?.id}
                    onSelectRequest={handleSelectRequest}
                    currentUserId={authUser.uid}
                  />
                </div>

                {/* Chat Window */}
                <div className="flex-1 border rounded-lg h-full overflow-hidden">
                  {selectedRequest ? (
                    <ChatWindow
                      swapRequest={selectedRequest}
                      authUser={authUser}
                      onBackClick={null}
                      profileDoc={profileDoc}
                      isMobile={false}
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
        )}
      </div>
    </div>
  );
}
