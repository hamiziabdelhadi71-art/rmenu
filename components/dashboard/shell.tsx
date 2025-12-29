"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Store,
  Settings,
  LogOut,
  X,
  Menu,
  Search,
  User,
  ChevronDown,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Commandes", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Produits", href: "/dashboard/menu", icon: UtensilsCrossed },
  { name: "Site web (Design)", href: "/dashboard/design", icon: Globe },
  { name: "Profile", href: "/dashboard/profile", icon: Store },
  { name: "Réglages", href: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header - Full Width */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-[#e9ecef] bg-white px-4">
        {/* Mobile Header */}
        <div className="flex w-full items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#868e96] transition-colors hover:bg-[#f8f9fa] hover:text-[#25262b]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center">
            <span className="text-lg font-semibold text-[#25262b]">FoodFlow</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#868e96] transition-colors hover:bg-[#f8f9fa] hover:text-[#25262b]"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f9fa] text-[#868e96] transition-colors hover:bg-[#e9ecef]"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden w-full items-center justify-between lg:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#868e96] transition-colors hover:bg-[#f8f9fa] hover:text-[#25262b]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#25262b]">FoodFlow</span>
            </Link>
            <div className="ml-2 flex items-center gap-1 rounded-md bg-[#f8f9fa] px-3 py-1.5">
              <span className="text-sm font-medium text-[#25262b]">mopizza</span>
              <ChevronDown className="h-4 w-4 text-[#868e96]" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#868e96]" />
              <Input
                type="text"
                placeholder="Recherche"
                className="h-9 w-56 rounded-md border-[#e9ecef] bg-white pl-9 text-sm placeholder:text-[#adb5bd]"
              />
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f9fa] text-[#868e96] transition-colors hover:bg-[#e9ecef]"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Body - Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-white transition-all duration-300 lg:static lg:border-r lg:border-[#e9ecef]",
            // Mobile: slide in/out
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop: show/hide with width transition
            "lg:translate-x-0",
            desktopSidebarOpen ? "w-56 lg:w-56" : "w-56 lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0"
          )}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-b border-[#e9ecef] px-4 lg:hidden">
            <span className="text-lg font-semibold text-[#25262b]">FoodFlow</span>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#868e96] transition-colors hover:bg-[#f8f9fa] hover:text-[#25262b]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#e7f5ff] text-[#25262b]"
                        : "text-[#495057] hover:bg-[#f8f9fa]"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-[#25262b]" : "text-[#868e96]")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sign Out */}
          <div className="border-t border-[#e9ecef] px-3 py-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#495057] transition-colors hover:bg-[#f8f9fa]"
            >
              <LogOut className="h-5 w-5 text-[#868e96]" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto bg-[#f8f9fa]">{children}</main>
      </div>
    </div>
  );
}
