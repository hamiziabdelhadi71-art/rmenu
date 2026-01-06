"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  MapPin,
  Phone,
  Search,
  Plus,
  Minus,
  X,
  ImageIcon,
  Check,
  Star,
  Utensils,
} from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import type { Tables } from "@/types/database";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type ModifierGroup = Tables<"modifier_groups">;
type Modifier = Tables<"modifiers">;
type MenuItemModifierGroup = Tables<"menu_item_modifier_groups">;

interface AppetiteTemplateProps {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
  modifierGroups: ModifierGroup[];
  modifiers: Modifier[];
  itemModifierLinks: MenuItemModifierGroup[];
  slug: string;
}

interface SelectedModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  modifierName: string;
  priceAdjustment: number;
}

export default function AppetiteTemplate({
  restaurant,
  categories,
  menuItems,
  modifierGroups,
  modifiers,
  itemModifierLinks,
  slug,
}: AppetiteTemplateProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id || null);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const cartStore = useCartStore();
  const cartItems = cartStore.items;
  const cartItemCount = cartStore.getItemCount();
  const subtotal = cartStore.getSubtotal();

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemModifierGroups = (itemId: string) => {
    const linkedGroupIds = itemModifierLinks
      .filter((link) => link.menu_item_id === itemId)
      .map((link) => link.modifier_group_id);
    return modifierGroups.filter((group) => linkedGroupIds.includes(group.id));
  };

  const getGroupModifiers = (groupId: string) => {
    return modifiers.filter((mod) => mod.group_id === groupId);
  };

  const hasProductSizes = (item: MenuItem) => {
    return item.sizes && item.sizes.length > 0;
  };

  const calculateSizeBasedTotal = () => {
    if (!selectedItem || !selectedSize) return 0;
    const extrasTotal = selectedModifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
    return (selectedSize.price + extrasTotal) * itemQuantity;
  };

  const handleModifierSelect = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      if (group.selection_type === "single") {
        const filtered = prev.filter((m) => m.groupId !== group.id);
        return [
          ...filtered,
          {
            groupId: group.id,
            groupName: group.name,
            modifierId: modifier.id,
            modifierName: modifier.name,
            priceAdjustment: Number(modifier.price_adjustment) || 0,
          },
        ];
      }

      const exists = prev.find((m) => m.modifierId === modifier.id);
      if (exists) {
        return prev.filter((m) => m.modifierId !== modifier.id);
      }

      const currentGroupSelections = prev.filter((m) => m.groupId === group.id).length;
      if (group.max_select && currentGroupSelections >= group.max_select) {
        return prev;
      }

      return [
        ...prev,
        {
          groupId: group.id,
          groupName: group.name,
          modifierId: modifier.id,
          modifierName: modifier.name,
          priceAdjustment: Number(modifier.price_adjustment) || 0,
        },
      ];
    });
  };

  const calculateItemTotal = () => {
    if (!selectedItem) return 0;
    const basePrice = Number(selectedItem.base_price);
    const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
    return (basePrice + modifiersTotal) * itemQuantity;
  };

  const isModifierSelected = (modifierId: string) => {
    return selectedModifiers.some((m) => m.modifierId === modifierId);
  };

  const areRequiredModifiersFilled = () => {
    if (!selectedItem) return true;
    if (hasProductSizes(selectedItem) && !selectedSize) return false;

    const itemGroups = getItemModifierGroups(selectedItem.id);
    for (const group of itemGroups) {
      if (group.is_required) {
        const groupSelections = selectedModifiers.filter((m) => m.groupId === group.id);
        const minRequired = group.min_select || 1;
        if (groupSelections.length < minRequired) return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    if (hasProductSizes(selectedItem) && selectedSize) {
      const cartItem: Omit<CartItem, "id"> = {
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        price: selectedSize.price,
        quantity: itemQuantity,
        notes: itemNotes || undefined,
        selectedModifiers: [
          { groupName: "Size", modifierName: selectedSize.name, priceAdjustment: 0 },
          ...selectedModifiers.map((m) => ({
            groupName: m.groupName,
            modifierName: m.modifierName,
            priceAdjustment: m.priceAdjustment,
          })),
        ],
      };
      cartStore.addItem(cartItem);
    } else {
      const cartItem: Omit<CartItem, "id"> = {
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        price: Number(selectedItem.base_price),
        quantity: itemQuantity,
        notes: itemNotes || undefined,
        selectedModifiers: selectedModifiers.length > 0
          ? selectedModifiers.map((m) => ({
              groupName: m.groupName,
              modifierName: m.modifierName,
              priceAdjustment: m.priceAdjustment,
            }))
          : undefined,
      };
      cartStore.addItem(cartItem);
    }

    setSelectedItem(null);
    setItemQuantity(1);
    setItemNotes("");
    setSelectedModifiers([]);
    setSelectedSize(null);
  };

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const yOffset = -140;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const primaryColor = restaurant?.theme_primary_color || "#e85d04";

  // Add cache-busting timestamp to logo URL
  const logoUrl = restaurant.logo_url
    ? `${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`
    : null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .appetite-page {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8f8f8;
          min-height: 100vh;
          padding-bottom: 100px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }

        .category-nav::-webkit-scrollbar { display: none; }
        .category-nav { -ms-overflow-style: none; scrollbar-width: none; }

        .menu-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .menu-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15);
        }

        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover {
          transform: scale(1.02);
        }
        .btn-hover:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="appetite-page">
        {/* Hero Section */}
        <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 50%, ${primaryColor}99 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.3) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: 16,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowSearch(!showSearch)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <Search style={{ width: 20, height: 20 }} />
              </button>
              <button
                onClick={() => setShowCart(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <ShoppingCart style={{ width: 20, height: 20 }} />
                {cartItemCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: primaryColor,
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: "white",
                  padding: 4,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  flexShrink: 0,
                }}
              >
                {logoUrl && !logoError ? (
                  <img
                    src={logoUrl}
                    alt={restaurant.name}
                    style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 12,
                      background: primaryColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 28,
                      fontWeight: 800,
                    }}
                  >
                    {restaurant.name.charAt(0)}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.2 }}>
                  {restaurant.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star style={{ width: 16, height: 16, fill: "#fbbf24", color: "#fbbf24" }} />
                    <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>4.8</span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>(120+)</span>
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      background: restaurant.is_active ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {restaurant.is_active ? "Open" : "Closed"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSearch && (
          <div
            className="animate-scaleIn"
            style={{
              padding: "12px 16px",
              background: "white",
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#999" }} />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  height: 48,
                  paddingLeft: 44,
                  paddingRight: 44,
                  fontSize: 15,
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                  outline: "none",
                  background: "#f8f8f8",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#ddd",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 14, height: 14, color: "#666" }} />
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: "16px 16px 0", background: "white" }}>
          {restaurant.description && (
            <p style={{ fontSize: 14, color: "#666", margin: "0 0 12px", lineHeight: 1.5 }}>
              {restaurant.description}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#666" }}>
            {restaurant.address && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin style={{ width: 14, height: 14 }} />
                <span>{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "#666", textDecoration: "none" }}>
                <Phone style={{ width: 14, height: 14 }} />
                <span>{restaurant.phone}</span>
              </a>
            )}
          </div>
        </div>

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "white",
            borderBottom: "1px solid #eee",
            transition: "box-shadow 0.2s ease",
            boxShadow: scrolled ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <div
            className="category-nav"
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 16px",
              overflowX: "auto",
            }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className="btn-hover"
                style={{
                  padding: "8px 18px",
                  borderRadius: 100,
                  border: "none",
                  background: activeCategory === category.id ? primaryColor : "#f0f0f0",
                  color: activeCategory === category.id ? "white" : "#333",
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "8px 16px 24px" }}>
          {categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Utensils style={{ width: 36, height: 36, color: "#ccc" }} />
              </div>
              <p style={{ color: "#999", fontSize: 16, margin: 0 }}>No menu items available yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {categories.map((category) => {
                const categoryItems = filteredItems.filter((item) => item.category_id === category.id);
                if (categoryItems.length === 0 && searchQuery) return null;

                return (
                  <section
                    key={category.id}
                    ref={(el) => { categoryRefs.current[category.id] = el; }}
                  >
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 16px" }}>
                      {category.name}
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#999", marginLeft: 8 }}>
                        ({categoryItems.length})
                      </span>
                    </h2>

                    {categoryItems.length === 0 ? (
                      <p style={{ color: "#999", fontSize: 14 }}>No items found</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="menu-card"
                            onClick={() => setSelectedItem(item)}
                            style={{
                              background: "white",
                              borderRadius: 16,
                              overflow: "hidden",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                          >
                            <div style={{ position: "relative", paddingTop: "60%", background: "#f5f5f5" }}>
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ImageIcon style={{ width: 40, height: 40, color: "#ddd" }} />
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(item);
                                }}
                                style={{
                                  position: "absolute",
                                  bottom: 12,
                                  right: 12,
                                  width: 36,
                                  height: 36,
                                  borderRadius: "50%",
                                  background: primaryColor,
                                  border: "none",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Plus style={{ width: 20, height: 20, color: "white" }} />
                              </button>
                            </div>

                            <div style={{ padding: 14 }}>
                              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>
                                {item.name}
                              </h3>
                              {item.description && (
                                <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                  {item.description}
                                </p>
                              )}
                              <p style={{ fontSize: 16, fontWeight: 700, color: primaryColor, margin: "10px 0 0" }}>
                                {item.sizes && item.sizes.length > 0 ? (
                                  <>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "#888" }}>From </span>
                                    {restaurant.currency || "DZD"} {Math.min(...item.sizes.map((s) => s.price)).toFixed(2)}
                                  </>
                                ) : (
                                  `${restaurant.currency || "DZD"} ${Number(item.base_price).toFixed(2)}`
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Item Modal */}
        {selectedItem && (
          <div
            className="animate-fadeIn"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 50,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedItem(null);
                setItemQuantity(1);
                setItemNotes("");
                setSelectedModifiers([]);
                setSelectedSize(null);
              }
            }}
          >
            <div
              className="animate-slideUp"
              style={{
                width: "100%",
                maxWidth: 480,
                maxHeight: "90vh",
                background: "white",
                borderRadius: "24px 24px 0 0",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {selectedItem.image_url && (
                <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setItemQuantity(1);
                      setItemNotes("");
                      setSelectedModifiers([]);
                      setSelectedSize(null);
                    }}
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: 20, height: 20, color: "white" }} />
                  </button>
                </div>
              )}

              {!selectedItem.image_url && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setItemQuantity(1);
                      setItemNotes("");
                      setSelectedModifiers([]);
                      setSelectedSize(null);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#f0f0f0",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: 20, height: 20, color: "#666" }} />
                  </button>
                </div>
              )}

              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>
                  {selectedItem.name}
                </h2>
                <p style={{ fontSize: 18, fontWeight: 700, color: primaryColor, margin: "8px 0" }}>
                  {hasProductSizes(selectedItem) ? (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#888" }}>From </span>
                      {restaurant.currency || "DZD"} {Math.min(...selectedItem.sizes!.map((s) => s.price)).toFixed(2)}
                    </>
                  ) : (
                    `${restaurant.currency || "DZD"} ${Number(selectedItem.base_price).toFixed(2)}`
                  )}
                </p>
                {selectedItem.description && (
                  <p style={{ fontSize: 14, color: "#666", margin: "0 0 20px", lineHeight: 1.5 }}>
                    {selectedItem.description}
                  </p>
                )}

                {hasProductSizes(selectedItem) && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Size</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", background: "#fef2f2", padding: "2px 8px", borderRadius: 4 }}>Required</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedItem.sizes!.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 14,
                            background: selectedSize?.name === size.name ? `${primaryColor}15` : "#f8f8f8",
                            border: selectedSize?.name === size.name ? `2px solid ${primaryColor}` : "2px solid transparent",
                            borderRadius: 12,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: `2px solid ${selectedSize?.name === size.name ? primaryColor : "#ccc"}`,
                                background: selectedSize?.name === size.name ? primaryColor : "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {selectedSize?.name === size.name && (
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                              )}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{size.name}</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: primaryColor }}>{restaurant.currency || "DZD"} {size.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {getItemModifierGroups(selectedItem.id).map((group) => {
                  const groupModifiers = getGroupModifiers(group.id);
                  if (groupModifiers.length === 0) return null;

                  return (
                    <div key={group.id} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{group.name}</span>
                        {group.is_required && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", background: "#fef2f2", padding: "2px 8px", borderRadius: 4 }}>Required</span>
                        )}
                      </div>
                      {group.selection_type === "multiple" && (
                        <p style={{ fontSize: 12, color: "#888", margin: "-8px 0 12px" }}>
                          Select up to {group.max_select || "multiple"} {group.min_select ? `(min ${group.min_select})` : ""}
                        </p>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {groupModifiers.map((modifier) => {
                          const isSelected = isModifierSelected(modifier.id);
                          const price = Number(modifier.price_adjustment) || 0;

                          return (
                            <button
                              key={modifier.id}
                              onClick={() => handleModifierSelect(group, modifier)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: 14,
                                background: isSelected ? `${primaryColor}15` : "#f8f8f8",
                                border: isSelected ? `2px solid ${primaryColor}` : "2px solid transparent",
                                borderRadius: 12,
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: group.selection_type === "single" ? "50%" : 6,
                                    border: `2px solid ${isSelected ? primaryColor : "#ccc"}`,
                                    background: isSelected ? primaryColor : "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {isSelected && <Check style={{ width: 14, height: 14, color: "white" }} />}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{modifier.name}</span>
                              </div>
                              {price !== 0 && (
                                <span style={{ fontSize: 14, fontWeight: 500, color: price > 0 ? "#22c55e" : "#888" }}>
                                  {price > 0 ? "+" : ""}{restaurant.currency || "DZD"} {price.toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 15, fontWeight: 600, color: "#111", display: "block", marginBottom: 8 }}>
                    Special Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., No onions, extra sauce..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    style={{
                      width: "100%",
                      height: 48,
                      padding: "0 14px",
                      fontSize: 14,
                      border: "1px solid #e5e5e5",
                      borderRadius: 12,
                      outline: "none",
                      background: "#f8f8f8",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    background: "#f8f8f8",
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Quantity</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "1px solid #ddd",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Minus style={{ width: 16, height: 16, color: "#666" }} />
                    </button>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#111", width: 32, textAlign: "center" }}>
                      {itemQuantity}
                    </span>
                    <button
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "1px solid #ddd",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Plus style={{ width: 16, height: 16, color: "#666" }} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, borderTop: "1px solid #eee", background: "white" }}>
                <button
                  onClick={handleAddToCart}
                  disabled={!areRequiredModifiersFilled()}
                  className="btn-hover"
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "none",
                    background: areRequiredModifiersFilled() ? primaryColor : "#ccc",
                    color: "white",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: areRequiredModifiersFilled() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {areRequiredModifiersFilled() ? (
                    <>Add to Cart - {restaurant.currency || "DZD"} {(hasProductSizes(selectedItem) ? calculateSizeBasedTotal() : calculateItemTotal()).toFixed(2)}</>
                  ) : (
                    "Select required options"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Drawer */}
        {showCart && (
          <div
            className="animate-fadeIn"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 50,
              display: "flex",
              justifyContent: "flex-end",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCart(false);
            }}
          >
            <div
              className="animate-slideInRight"
              style={{
                width: "100%",
                maxWidth: 420,
                height: "100%",
                background: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #eee" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: 0 }}>Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#f0f0f0",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 20, height: 20, color: "#666" }} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                      <ShoppingCart style={{ width: 36, height: 36, color: "#ccc" }} />
                    </div>
                    <p style={{ color: "#999", fontSize: 16, margin: 0 }}>Your cart is empty</p>
                    <p style={{ color: "#bbb", fontSize: 14, margin: "8px 0 0" }}>Add items to get started</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 14,
                          background: "#f8f8f8",
                          borderRadius: 14,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: 0 }}>{item.name}</h4>
                          <button
                            onClick={() => cartStore.removeItem(item.id)}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            <X style={{ width: 18, height: 18, color: "#999" }} />
                          </button>
                        </div>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
                            {item.selectedModifiers.map((m) => m.modifierName).join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p style={{ fontSize: 12, fontStyle: "italic", color: "#999", margin: "0 0 8px" }}>
                            {item.notes}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: primaryColor }}>
                            {restaurant.currency || "DZD"} {((item.price + (item.selectedModifiers?.reduce((sum, m) => sum + m.priceAdjustment, 0) || 0)) * item.quantity).toFixed(2)}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              onClick={() => cartStore.updateQuantity(item.id, item.quantity - 1)}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                border: "1px solid #ddd",
                                background: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Minus style={{ width: 14, height: 14, color: "#666" }} />
                            </button>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{item.quantity}</span>
                            <button
                              onClick={() => cartStore.updateQuantity(item.id, item.quantity + 1)}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                border: "1px solid #ddd",
                                background: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Plus style={{ width: 14, height: 14, color: "#666" }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div style={{ padding: 16, borderTop: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 16, color: "#666" }}>Subtotal</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{restaurant.currency || "DZD"} {subtotal.toFixed(2)}</span>
                  </div>
                  <Link href={`/${slug}/checkout`} style={{ textDecoration: "none" }}>
                    <button
                      className="btn-hover"
                      style={{
                        width: "100%",
                        height: 54,
                        borderRadius: 14,
                        border: "none",
                        background: primaryColor,
                        color: "white",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Proceed to Checkout
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Cart Bar */}
        {cartItemCount > 0 && !showCart && !selectedItem && (
          <div
            className="animate-slideUp"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              background: "white",
              borderTop: "1px solid #eee",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              zIndex: 40,
            }}
          >
            <button
              onClick={() => setShowCart(true)}
              className="btn-hover"
              style={{
                width: "100%",
                height: 54,
                borderRadius: 14,
                border: "none",
                background: primaryColor,
                color: "white",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {cartItemCount}
                </div>
                <span>View Cart</span>
              </div>
              <span>{restaurant.currency || "DZD"} {subtotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
