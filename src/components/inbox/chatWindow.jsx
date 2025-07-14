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
  startAfter,
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const router = useRouter();
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [lastVisibleMessage, setLastVisibleMessage] = useState(null);
  const messagesPerPage = 25;

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

  useEffect(() => {
    if (swapRequest) {
      const messagesRef = collection(
        db,
        "swap_requests",
        swapRequest.id,
        "messages"
      );
      const q = query(
        messagesRef,
        orderBy("createdAt", "desc"),
        limit(messagesPerPage)
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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
    }
  }, [swapRequest, authUser?.uid]);

  // Improved scroll to bottom function
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
    if (!newMessage.trim()) return;

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
    }
  };

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
    if (!swapRequest?.id || !authUser?.uid) return;

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
  }, [swapRequest?.id, authUser?.uid]);

  // Active presence tracker
  useEffect(() => {
    if (!swapRequest?.id || !authUser?.uid) return;

    const presenceRef = doc(
      db,
      "swap_requests",
      swapRequest.id,
      "presence",
      authUser.uid
    );
    setDoc(presenceRef, {
      active: true,
      lastActive: serverTimestamp(),
    });

    return () => {
      setDoc(presenceRef, {
        active: false,
        lastActive: serverTimestamp(),
      });
    };
  }, [swapRequest?.id, authUser?.uid]);

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

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-screen" : ""}`}>
      {/* Chat Header */}
      <div
        className={`flex-shrink-0 border-b flex items-center gap-3 ${
          isMobile ? "p-2 md:p-4 bg-white sticky top-0 z-10" : "p-3"
        }`}
      >
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="relative w-6 h-6 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0">
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
          <p
            className={`text-muted-foreground truncate ${
              isMobile ? "text-xs" : "text-xs"
            }`}
          >
            {chatTitle}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto flex flex-col gap-3 ${
          isMobile ? "p-3" : "p-4"
        }`}
        style={{
          height: isMobile ? "calc(100vh - 120px)" : "auto", // Account for header + input
        }}
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

      {/* Message Input */}
      <div
        className={`flex-shrink-0 border-t ${
          isMobile ? "p-3 bg-white sticky bottom-0" : "p-3"
        }`}
      >
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 min-w-0 bg-muted/30 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary ${
              isMobile ? "text-base" : "" // Prevent zoom on iOS
            }`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary flex justify-center items-center text-white p-2 rounded-full disabled:opacity-50 flex-shrink-0"
          >
            <ArrowUp className="h-5 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
