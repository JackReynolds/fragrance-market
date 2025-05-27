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
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
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

  // Fetch messages
  // useEffect(() => {
  //   const fetchMessages = async () => {
  //     try {
  //       const messagesRef = collection(
  //         db,
  //         "swap_requests",
  //         swapRequest.id,
  //         "messages"
  //       );
  //       const q = query(messagesRef, orderBy("createdAt", "asc"));
  //       const querySnapshot = await getDocs(q);

  //       const messagesList = [];
  //       querySnapshot.forEach((doc) => {
  //         messagesList.push({ id: doc.id, ...doc.data() });
  //       });

  //       setMessages(messagesList);
  //     } catch (error) {
  //       console.error("Error fetching messages:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchMessages();
  // }, [swapRequest.id]);

  useEffect(() => {
    if (swapRequest) {
      // Initial message load with pagination
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

        // Process all messages, identify new unread ones
        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          messagesData.push(data);

          // Check if this is a new message not from current user and not yet read
          if (
            data.senderUid !== authUser.uid &&
            (!data.readBy || !data.readBy.includes(authUser.uid)) &&
            data.createdAt
          ) {
            // Ensure it has a timestamp (not a local optimistic update)
            newUnreadMessages.push(doc.id);
          }
        });

        // Mark new messages as read immediately
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message (placeholder for now)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Placeholder for sending message
    const message = {
      text: newMessage.trim(),
      senderUid: authUser.uid,
      senderUsername: userDoc.username,
      createdAt: serverTimestamp(),
      readBy: [authUser.uid],
    };

    // Clear input
    setNewMessage("");

    // Optimistically add to UI
    const optimisticId = Math.random().toString(36).substring(2, 15);
    setMessages([
      ...messages,
      { ...message, id: optimisticId, createdAt: new Date() },
    ]);

    // Add logic to save to Firestore here
    await addDoc(
      collection(db, "swap_requests", swapRequest.id, "messages"),
      message
    );
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

  // marks messages as read
  useEffect(() => {
    if (!swapRequest?.id || !authUser?.uid) return;

    const markMessagesAsRead = async () => {
      try {
        // Get all messages in this conversation
        const messagesRef = collection(
          db,
          "swap_requests",
          swapRequest.id,
          "messages"
        );
        const messagesQuery = query(messagesRef);
        const querySnapshot = await getDocs(messagesQuery);

        // Filter messages not read by current user (excluding those sent by the user)
        const unreadMessages = querySnapshot.docs.filter((doc) => {
          const data = doc.data();
          return (
            data.senderUid !== authUser.uid &&
            (!data.readBy || !data.readBy.includes(authUser.uid))
          );
        });

        if (unreadMessages.length === 0) return;

        // Just mark messages as read, let the cloud function handle the unreadMessagesCount counter
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
        console.log(`Marked ${unreadMessages.length} messages as read`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
  }, [swapRequest?.id, authUser?.uid]);

  // Active presence tracker
  useEffect(() => {
    if (!swapRequest?.id || !authUser?.uid) return;

    // Create a presence indicator
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

    // Set up cleanup when leaving chat
    return () => {
      setDoc(presenceRef, {
        active: false,
        lastActive: serverTimestamp(),
      });
    };
  }, [swapRequest?.id, authUser?.uid]);

  const loadMoreMessages = async () => {
    if (!hasMoreMessages) return;

    try {
      let q = query(
        collection(db, "swap_requests", swapRequest.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(messagesPerPage)
      );

      if (lastVisibleMessage) {
        q = query(q, startAfter(lastVisibleMessage));
      }

      const querySnapshot = await getDocs(q);
      const newMessages = [];

      querySnapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });

      if (newMessages.length < messagesPerPage) {
        setHasMoreMessages(false);
      }

      if (querySnapshot.docs.length > 0) {
        setLastVisibleMessage(
          querySnapshot.docs[querySnapshot.docs.length - 1]
        );
      }

      // Add new messages to state (maintaining order)
      setMessages((prev) => [...prev, ...newMessages.reverse()]);
    } catch (error) {
      console.error("Error loading more messages:", error);
    }
  };

  const sortedMessages = [...messages].sort((a, b) => {
    const dateA =
      a.createdAt instanceof Date
        ? a.createdAt
        : a.createdAt?.toDate?.() || new Date(0);
    const dateB =
      b.createdAt instanceof Date
        ? b.createdAt
        : b.createdAt?.toDate?.() || new Date(0);
    return dateA - dateB; // Sort in ascending order (oldest first)
  });

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b flex items-center gap-3">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-1 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
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
          <p className="font-medium truncate">{otherParty.name}</p>
          <p className="text-xs text-muted-foreground truncate">{chatTitle}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
      <div className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 bg-muted/30 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary flex justify-center items-center text-white p-2 rounded-full disabled:opacity-50"
          >
            <ArrowUp className="h-5 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
