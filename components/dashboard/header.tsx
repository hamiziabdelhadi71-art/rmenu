"use client";

import Link from "next/link";
import { Menu, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  title?: string;
  description?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({
  onMenuClick,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background px-4">
      {/* Mobile Header */}
      <div className="flex w-full items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex items-center">
          <span className="text-lg font-bold text-foreground">HakMenu</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden w-full items-center justify-between lg:flex">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onMenuClick}
            className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <span className="text-lg font-bold text-foreground">HakMenu</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-lg border-border bg-background pl-9 text-sm"
            />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
