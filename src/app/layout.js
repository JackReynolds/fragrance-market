import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UserDocProvider } from "@/context/UserDocContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Fragrance Market",
  description:
    "Discover, swap, and sell exquisite fragrances on our premium marketplace for fragrance enthusiasts and collectors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UserDocProvider>
            {children}
            <Toaster position="top-right" richColors />
          </UserDocProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
