"use client";
/* eslint-disable react/prop-types */

import React from "react";
import AdminAuthGate from "@/components/admin/adminAuthGate";
import AdminSidebar from "@/components/admin/adminSidebar";
import { AdminDataProvider } from "@/context/adminDataContext";
import { Toaster } from "sonner";

export default function AdminLayout({ children }) {
  return (
    <AdminAuthGate>
      <AdminDataProvider>
        <div className="dark fixed inset-0 z-[100] bg-background text-foreground overflow-hidden">
          <div className="flex h-full">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
              <div className="p-6 lg:p-8">{children}</div>
            </main>
          </div>
          <Toaster position="top-right" richColors theme="dark" />
        </div>
      </AdminDataProvider>
    </AdminAuthGate>
  );
}
