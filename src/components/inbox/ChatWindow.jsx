"use client";

/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  doc,
  arrayUnion,
  setDoc,
  limit,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase.config";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronLeft } from "lucide-react";
import StandardMessage from "./standardMessage";
import SwapRequestMessageCard from "./swapRequestMessageCard";
import SwapAcceptedMessageCard from "./swapAcceptedMessageCard";
import PendingShipmentMessageCard from "./pendingShipmentMessageCard";
import SwapCompletedMessageCard from "./swapCompletedMessageCard";
import SwapTimeline from "./swapTimeline";

export default function ChatWindow({
  swapRequest,
  authUser,
  onBackClick,
  userDoc,
  isMobile = false,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [swapRequestExists, setSwapRequestExists] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // ✅ Add this
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const router = useRouter();

  // Get the other person in the conversation
  const otherParty =
    swapRequest.offeredBy.uid === authUser.uid
      ? {
          username: swapRequest.requestedFrom.username,
          uid: swapRequest.requestedFrom.uid,
          profilePic:
            swapRequest.requestedFrom.profilePictureURL ||
            "/profilePicturePlaceholder.png",
        }
      : {
          username: swapRequest.offeredBy.username,
          uid: swapRequest.offeredBy.uid,
          profilePic:
            swapRequest.offeredBy.profilePictureURL ||
            "/profilePicturePlaceholder.png",
        };

  // Get what to display as the chat title
  const chatTitle =
    swapRequest.offeredBy.uid === authUser.uid
      ? `Your ${swapRequest.offeredListing.title} for ${swapRequest.requestedListing.title}`
      : `${swapRequest.offeredListing.title} for your ${swapRequest.requestedListing.title}`;

  // Listen for swap request existence
  useEffect(() => {
    if (!swapRequest?.id) return;

    const swapRequestRef = doc(db, "swap_requests", swapRequest.id);
    const unsubscribe = onSnapshot(swapRequestRef, (docSnapshot) => {
      const exists = docSnapshot.exists();
      setSwapRequestExists(exists);

      // ✅ If document is deleted, stop presence tracking
      if (!exists) {
        setIsDeleting(true);
      }
    });

    return () => unsubscribe();
  }, [swapRequest?.id]);

  // Messages listener
  useEffect(() => {
    if (swapRequest && swapRequestExists) {
      const messagesRef = collection(
        db,
        "swap_requests",
        swapRequest.id,
        "messages"
      );
      const q = query(messagesRef, orderBy("createdAt", "desc"), limit(25));

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        if (!swapRequestExists) return;

        const messagesData = [];
        const newUnreadMessages = [];

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          messagesData.push(data);

          if (
            data.senderUid !== authUser.uid &&
            (!data.readBy || !data.readBy.includes(authUser.uid)) &&
            data.createdAt
          ) {
            newUnreadMessages.push(doc.id);
          }
        });

        if (newUnreadMessages.length > 0) {
          const batch = writeBatch(db);
          newUnreadMessages.forEach((msgId) => {
            const messageRef = doc(
              db,
              "swap_requests",
              swapRequest.id,
              "messages",
              msgId
            );
            batch.update(messageRef, {
              readBy: arrayUnion(authUser.uid),
            });
          });
          await batch.commit();
        }

        setMessages(messagesData);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [swapRequest, authUser?.uid, swapRequestExists]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !swapRequestExists) return;

    const message = {
      text: newMessage.trim(),
      senderUid: authUser.uid,
      senderUsername: userDoc.username,
      createdAt: serverTimestamp(),
      readBy: [authUser.uid],
    };

    setNewMessage("");

    try {
      await addDoc(
        collection(db, "swap_requests", swapRequest.id, "messages"),
        message
      );

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.code === "not-found") {
        setSwapRequestExists(false);
      }
    }
  };

  // Active presence tracker with existence check
  useEffect(() => {
    if (
      !swapRequest?.id ||
      !authUser?.uid ||
      !swapRequestExists ||
      isDeleting
    ) {
      return; // Don't start presence if deleting
    }

    const presenceRef = doc(
      db,
      "swap_requests",
      swapRequest.id,
      "presence",
      authUser.uid
    );

    const setPresence = async () => {
      try {
        await setDoc(presenceRef, {
          active: true,
          lastActive: serverTimestamp(),
        });
      } catch (error) {
        console.log("Error setting presence:", error);
        setSwapRequestExists(false);
      }
    };

    setPresence();

    return () => {
      // ✅ Actually delete the presence document
      deleteDoc(presenceRef).catch((error) => {
        console.log("Error deleting presence:", error);
      });
    };
  }, [swapRequest?.id, authUser?.uid, swapRequestExists, isDeleting]); // ✅ Add isDeleting dependency

  // Function to render message based upon message type
  const renderMessage = (message) => {
    switch (message.type) {
      case "swap_request":
        return (
          <SwapRequestMessageCard
            message={message}
            authUser={authUser}
            swapRequest={swapRequest}
          />
        );
      case "swap_accepted":
        return (
          <SwapAcceptedMessageCard
            message={message}
            authUser={authUser}
            swapRequest={swapRequest}
          />
        );
      case "pending_shipment":
        return (
          <PendingShipmentMessageCard
            message={message}
            authUser={authUser}
            swapRequest={swapRequest}
          />
        );
      case "swap_completed":
        return (
          <SwapCompletedMessageCard
            message={message}
            authUser={authUser}
            swapRequest={swapRequest}
          />
        );
      default:
        return <StandardMessage message={message} authUser={authUser} />;
    }
  };

  // Mark messages as read
  useEffect(() => {
    if (!swapRequest?.id || !authUser?.uid || !swapRequestExists) return;

    const markMessagesAsRead = async () => {
      try {
        const messagesRef = collection(
          db,
          "swap_requests",
          swapRequest.id,
          "messages"
        );
        const messagesQuery = query(messagesRef);
        const querySnapshot = await getDocs(messagesQuery);

        const unreadMessages = querySnapshot.docs.filter((doc) => {
          const data = doc.data();
          return (
            data.senderUid !== authUser.uid &&
            (!data.readBy || !data.readBy.includes(authUser.uid))
          );
        });

        if (unreadMessages.length === 0) return;

        const batch = writeBatch(db);
        unreadMessages.forEach((messageDoc) => {
          const messageRef = doc(
            db,
            "swap_requests",
            swapRequest.id,
            "messages",
            messageDoc.id
          );
          batch.update(messageRef, {
            readBy: arrayUnion(authUser.uid),
          });
        });

        await batch.commit();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
  }, [swapRequest?.id, authUser?.uid, swapRequestExists]);

  const sortedMessages = [...messages].sort((a, b) => {
    const dateA =
      a.createdAt instanceof Date
        ? a.createdAt
        : a.createdAt?.toDate?.() || new Date(0);
    const dateB =
      b.createdAt instanceof Date
        ? b.createdAt
        : b.createdAt?.toDate?.() || new Date(0);
    return dateA - dateB;
  });

  // Handle deleted swap request
  if (!swapRequestExists) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b flex items-center gap-3 p-4">
          {onBackClick && (
            <button
              onClick={onBackClick}
              className="p-1 rounded-full hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <p className="font-medium">Conversation Ended</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              This conversation is no longer available
            </p>
            <p className="text-sm text-muted-foreground">
              The swap request has been deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header - Fixed at top */}
      <div className="flex-shrink-0 border-b flex items-center gap-3 p-4 bg-white">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={otherParty.profilePic}
            alt={otherParty.username}
            fill
            className="object-cover hover:cursor-pointer"
            onClick={() => {
              router.push(`/users/${otherParty.uid}`);
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base font-medium truncate">
            {otherParty.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">{chatTitle}</p>
        </div>
      </div>

      {/* Timeline */}
      <SwapTimeline swapRequest={swapRequest} className="mx-2 mb-0" />

      {/* Messages Area - Flexible height, scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 min-h-0"
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No messages yet.
              <br />
              Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {sortedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderUid === authUser.uid ||
                  message.type === "pending_shipment" ||
                  message.type === "swap_completed" ||
                  message.type === "swap_request" ||
                  message.type === "swap_accepted"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {renderMessage(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              swapRequestExists ? "Type your message..." : "Conversation ended"
            }
            disabled={!swapRequestExists}
            className={`flex-1 min-w-0 bg-muted/30 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
              isMobile ? "text-base" : ""
            } ${!swapRequestExists ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <button
            type="submit"
            disabled={
              !newMessage.trim() ||
              !swapRequestExists ||
              swapRequest.status === "swap_completed"
            }
            className="bg-primary flex justify-center items-center text-white p-2 rounded-full disabled:opacity-50 flex-shrink-0"
          >
            <ArrowUp className="h-5 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
