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
  const [showChat, setShowChat] = useState(false); // For mobile navigation
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

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      setSwapRequests(requests);

      if (
        selectedRequest &&
        !requests.find((r) => r.id === selectedRequest.id)
      ) {
        setSelectedRequest(requests.length > 0 ? requests[0] : null);
        if (isMobile) {
          setShowChat(false);
        }
      }
    });

    setLoading(false);
    return () => unsubscribe();
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
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to view your messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Main content - takes remaining height */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Show either list or chat */}
        {isMobile ? (
          <>
            {!showChat ? (
              // Mobile: Show list
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0border-b">
                  {/* <h1 className="text-2xl font-bold">Messages</h1> */}
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
              // Mobile: Show chat (full screen)
              <div className="h-full">
                {selectedRequest && (
                  <ChatWindow
                    swapRequest={selectedRequest}
                    authUser={authUser}
                    onBackClick={handleBackToList}
                    userDoc={userDoc}
                    isMobile={true}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          // Desktop: Show both
          <div className="h-full px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>
            <div className="flex gap-4 h-[calc(100%-4rem)]">
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
                    userDoc={userDoc}
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
        )}
      </div>
    </div>
  );
}
