// src/components/inbox/ChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase.config";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, Send } from "lucide-react";

export default function ChatWindow({
  swapRequest,
  currentUserId,
  onBackClick,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Get the other person in the conversation
  const otherParty =
    swapRequest.offeredBy.uid === currentUserId
      ? {
          name: swapRequest.requestedFrom.username,
          uid: swapRequest.requestedFrom.uid,
          profilePic: "/placeholder-user.jpg",
        }
      : {
          name: swapRequest.offeredBy.username,
          uid: swapRequest.offeredBy.uid,
          profilePic: "/placeholder-user.jpg",
        };

  // Get what to display as the chat title
  const chatTitle =
    swapRequest.offeredBy.uid === currentUserId
      ? `Your ${swapRequest.offeredListing.title} for ${swapRequest.requestedListing.title}`
      : `${swapRequest.offeredListing.title} for your ${swapRequest.requestedListing.title}`;

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messagesRef = collection(
          db,
          "swap-requests",
          swapRequest.id,
          "messages"
        );
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);

        const messagesList = [];
        querySnapshot.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() });
        });

        setMessages(messagesList);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [swapRequest.id]);

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
      sentBy: currentUserId,
      senderName: "You", // This would come from auth context
      createdAt: serverTimestamp(),
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
    console.log("Message would be sent:", message);
  };

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
            alt={otherParty.name}
            fill
            className="object-cover"
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sentBy === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sentBy === currentUserId
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  }`}
                >
                  <p>{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sentBy === currentUserId
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.createdAt
                      ? format(
                          message.createdAt instanceof Date
                            ? message.createdAt
                            : message.createdAt.toDate(),
                          "h:mm a"
                        )
                      : ""}
                  </p>
                </div>
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
            className="bg-primary text-white p-2 rounded-full disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
