"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Utensils } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { Tables } from "@/types/database";

// Import templates
import AppetiteTemplate from "./templates/appetite";
import SweetTemplate from "./templates/sweet";
import BakeryTemplate from "./templates/bakery";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type ModifierGroup = Tables<"modifier_groups">;
type Modifier = Tables<"modifiers">;
type MenuItemModifierGroup = Tables<"menu_item_modifier_groups">;

export default function RestaurantPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [itemModifierLinks, setItemModifierLinks] = useState<MenuItemModifierGroup[]>([]);

  const cartStore = useCartStore();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: restaurantResult } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!restaurantResult) {
        setIsLoading(false);
        return;
      }

      const restaurantData = restaurantResult as unknown as Restaurant;
      setRestaurant(restaurantData);
      cartStore.setRestaurant(slug, restaurantData.id);

      // Set source AFTER setRestaurant to avoid race condition
      // (setRestaurant can reset source when switching restaurants)
      const source = searchParams.get("src") || searchParams.get("utm_source");
      if (source) {
        useCartStore.getState().setSource(source.toLowerCase());
      }

      const { data: categoriesResult } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      setCategories((categoriesResult as unknown as Category[]) || []);

      const { data: itemsResult } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_available", true)
        .order("display_order", { ascending: true });

      setMenuItems((itemsResult as unknown as MenuItem[]) || []);

      const { data: groupsResult } = await supabase
        .from("modifier_groups")
        .select("*")
        .eq("restaurant_id", restaurantData.id);

      setModifierGroups((groupsResult as unknown as ModifierGroup[]) || []);

      if (groupsResult && groupsResult.length > 0) {
        const groupIds = groupsResult.map((g) => g.id);
        const { data: modifiersResult } = await supabase
          .from("modifiers")
          .select("*")
          .in("group_id", groupIds)
          .eq("is_available", true)
          .order("display_order", { ascending: true });

        setModifiers((modifiersResult as unknown as Modifier[]) || []);
      }

      if (itemsResult && itemsResult.length > 0) {
        const itemIds = itemsResult.map((i) => i.id);
        const { data: linksResult } = await supabase
          .from("menu_item_modifier_groups")
          .select("*")
          .in("menu_item_id", itemIds);

        setItemModifierLinks((linksResult as unknown as MenuItemModifierGroup[]) || []);
      }

      setIsLoading(false);
    }

    loadData();
  }, [slug, supabase, searchParams]);

  // Track page view
  useEffect(() => {
    if (!restaurant) return;

    // Get or create a session ID for this visitor
    let sessionId = sessionStorage.getItem("rmenu_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("rmenu_session_id", sessionId);
    }

    // Check if we've already tracked this restaurant in this session
    const viewedKey = `rmenu_viewed_${restaurant.id}`;
    const lastViewed = sessionStorage.getItem(viewedKey);
    const now = Date.now();

    // Only track once per hour per restaurant per session
    if (lastViewed && now - parseInt(lastViewed) < 3600000) {
      return;
    }

    // Track the view
    supabase
      .from("page_views")
      .insert({
        restaurant_id: restaurant.id,
        page_path: `/${slug}`,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        session_id: sessionId,
      })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to track page view:", error);
        } else {
          sessionStorage.setItem(viewedKey, now.toString());
        }
      });
  }, [restaurant, slug, supabase]);

  if (isLoading) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .loader-page {
            font-family: 'Plus Jakarta Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fafafa;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loader-page">
          <Loader2 style={{ width: 40, height: 40, animation: "spin 1s linear infinite", color: "#e85d04" }} />
        </div>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .notfound-page {
            font-family: 'Plus Jakarta Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fafafa;
            padding: 24px;
            text-align: center;
          }
        `}</style>
        <div className="notfound-page">
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Utensils style={{ width: 40, height: 40, color: "#ef4444" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>Restaurant Not Found</h1>
          <p style={{ fontSize: 16, color: "#666", margin: "0 0 24px" }}>This restaurant doesn&apos;t exist or is currently closed.</p>
          <Link href="/" style={{ padding: "12px 32px", background: "#111", color: "#fff", borderRadius: 100, fontWeight: 600, textDecoration: "none" }}>
            Go Home
          </Link>
        </div>
      </>
    );
  }

  // Get template name from restaurant settings
  // Default to 'appetite' if not set
  const templateName = restaurant.template_name || "appetite";

  // Render the appropriate template based on restaurant settings
  const templateProps = {
    restaurant,
    categories,
    menuItems,
    modifierGroups,
    modifiers,
    itemModifierLinks,
    slug,
  };

  switch (templateName) {
    case "sweet":
      return <SweetTemplate {...templateProps} />;
    case "bakery":
      return <BakeryTemplate {...templateProps} />;
    case "appetite":
    default:
      return <AppetiteTemplate {...templateProps} />;
  }
}
