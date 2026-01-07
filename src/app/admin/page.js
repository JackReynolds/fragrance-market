"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import StatsCard from "@/components/admin/statsCard";
import {
  Users,
  Package,
  ArrowLeftRight,
  UserPlus,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { authUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!authUser) return;

      try {
        const token = await authUser.getIdToken();

        const [usersRes, listingsRes, swapsRes] = await Promise.all([
          fetch("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/listings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/swaps", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [usersData, listingsData, swapsData] = await Promise.all([
          usersRes.json(),
          listingsRes.json(),
          swapsRes.json(),
        ]);

        // Calculate stats
        const users = usersData.users || [];
        const listings = listingsData.listings || [];
        const swaps = swapsData.swaps || [];

        // New users this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const newUsersThisWeek = users.filter((u) => {
          const createdAt = u.createdAt?.seconds
            ? new Date(u.createdAt.seconds * 1000)
            : null;
          return createdAt && createdAt > oneWeekAgo;
        }).length;

        // Active listings (not disabled)
        const activeListings = listings.filter((l) => !l.disabled).length;

        // Pending swaps
        const pendingSwaps = swaps.filter(
          (s) => s.status === "pending" || s.status === "accepted"
        ).length;

        setStats({
          totalUsers: users.length,
          totalListings: listings.length,
          activeListings,
          totalSwaps: swaps.length,
          pendingSwaps,
          newUsersThisWeek,
        });

        // Get recent activity (last 5 users, last 5 listings)
        const recentUsers = users
          .filter((u) => u.createdAt)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 3)
          .map((u) => ({
            type: "user",
            label: `New user: ${u.username || u.email || "Unknown"}`,
            time: u.createdAt,
          }));

        const recentListings = listings
          .filter((l) => l.createdAt)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 3)
          .map((l) => ({
            type: "listing",
            label: `New listing: ${l.fragranceName || "Unknown"}`,
            time: l.createdAt,
          }));

        const combined = [...recentUsers, ...recentListings]
          .sort((a, b) => (b.time?.seconds || 0) - (a.time?.seconds || 0))
          .slice(0, 5);

        setRecentActivity(combined);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [authUser]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp?.seconds) return "Unknown";
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here&apos;s what&apos;s happening with The Fragrance Market.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={loading ? "—" : stats?.totalUsers?.toLocaleString() || "0"}
          icon={Users}
          subtitle="Registered accounts"
        />
        <StatsCard
          title="New This Week"
          value={loading ? "—" : stats?.newUsersThisWeek?.toLocaleString() || "0"}
          icon={UserPlus}
          subtitle="User signups"
        />
        <StatsCard
          title="Active Listings"
          value={loading ? "—" : stats?.activeListings?.toLocaleString() || "0"}
          icon={Package}
          subtitle={`${stats?.totalListings || 0} total`}
        />
        <StatsCard
          title="Pending Swaps"
          value={loading ? "—" : stats?.pendingSwaps?.toLocaleString() || "0"}
          icon={ArrowLeftRight}
          subtitle={`${stats?.totalSwaps || 0} total`}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View All Users
              </Button>
            </Link>
            <Link href="/admin/listings">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                View All Listings
              </Button>
            </Link>
            <Link href="/admin/swaps">
              <Button variant="outline" className="w-full justify-start">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                View Swap Requests
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.type === "user"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm">{activity.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTimeAgo(activity.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

