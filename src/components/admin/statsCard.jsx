"use client";

/* eslint-disable react/prop-types */
import React from "react";
import { cn } from "@/lib/utils";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-card-foreground font-mono">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend}% from last week
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
