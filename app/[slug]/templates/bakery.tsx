"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  ImageIcon,
  Check,
  Star,
  Heart,
} from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import type { Tables } from "@/types/database";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type ModifierGroup = Tables<"modifier_groups">;
type Modifier = Tables<"modifiers">;
type MenuItemModifierGroup = Tables<"menu_item_modifier_groups">;

interface BakeryTemplateProps {
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

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 236, g: 72, b: 153 }; // fallback pink
}

// Helper function to create light tint from color
function createTint(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Helper function to darken a color
function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const darken = (c: number) => Math.max(0, Math.floor(c * (1 - amount)));
  return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
}

export default function BakeryTemplate({
  restaurant,
  categories,
  menuItems,
  modifierGroups,
  modifiers,
  itemModifierLinks,
  slug,
}: BakeryTemplateProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [logoError, setLogoError] = useState(false);

  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const cartStore = useCartStore();
  const cartItems = cartStore.items;
  const cartItemCount = cartStore.getItemCount();
  const subtotal = cartStore.getSubtotal();

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

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

  // Use restaurant's theme color with fallback to pink
  const primaryColor = restaurant.theme_primary_color || "#EC4899";

  // Generate dynamic colors from primary
  const secondaryColor = darkenColor(primaryColor, 0.2); // Darker shade for gradients
  const lightBg = createTint(primaryColor, 0.05); // Very light background
  const lightBg2 = createTint(primaryColor, 0.08);
  const lightBg3 = createTint(primaryColor, 0.12);
  const accentLight = createTint(primaryColor, 0.15);

  // Dynamic card colors based on primary theme
  const cardColors = [
    createTint(primaryColor, 0.06),
    "#FFFBEB", // Light yellow (neutral)
    "#F8F8F8", // Light gray (neutral)
    createTint(primaryColor, 0.08),
    createTint(primaryColor, 0.1),
    "#FFFAF0", // Floral white (neutral)
  ];

  // Add cache-busting timestamp to logo URL
  const logoUrl = restaurant.logo_url
    ? `${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`
    : null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .bakery-page {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          padding-bottom: 100px;
          --primary-color: ${primaryColor};
          --primary-rgb: ${hexToRgb(primaryColor).r}, ${hexToRgb(primaryColor).g}, ${hexToRgb(primaryColor).b};
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
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-heart { animation: heartBeat 0.4s ease-in-out; }

        .category-nav::-webkit-scrollbar { display: none; }
        .category-nav { -ms-overflow-style: none; scrollbar-width: none; }

        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -12px rgba(var(--primary-rgb), 0.25);
        }

        .product-image {
          transition: transform 0.3s ease;
        }
        .product-card:hover .product-image {
          transform: scale(1.05);
        }

        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover {
          transform: scale(1.05);
        }
        .btn-hover:active {
          transform: scale(0.95);
        }

        .heart-btn {
          transition: all 0.2s ease;
        }
        .heart-btn:hover {
          transform: scale(1.15);
        }

        .add-btn {
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.4);
        }
        .add-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.5);
        }

        /* Premium Modal Animations */
        @keyframes modalSlideUp {
          0% { opacity: 0; transform: translateY(100%) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes floatImage {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3); }
          50% { box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.5); }
        }

        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes slideInStagger {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        .modal-premium {
          animation: modalSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .floating-image {
          animation: floatImage 4s ease-in-out infinite;
        }

        .shimmer-btn {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.2) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .option-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .option-card:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .option-card:active {
          transform: scale(0.98);
        }

        .size-card-selected {
          animation: bounceIn 0.3s ease-out;
        }

        .quantity-btn {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .quantity-btn:hover {
          transform: scale(1.15);
        }
        .quantity-btn:active {
          transform: scale(0.9);
        }

        .premium-input:focus {
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15);
        }

        .cart-btn-premium {
          position: relative;
          overflow: hidden;
        }
        .cart-btn-premium::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
          transform: translate(-50%, -50%) scale(0);
          transition: transform 0.5s ease;
        }
        .cart-btn-premium:hover::before {
          transform: translate(-50%, -50%) scale(1);
        }

        .stagger-1 { animation: slideInStagger 0.4s ease-out 0.1s both; }
        .stagger-2 { animation: slideInStagger 0.4s ease-out 0.2s both; }
        .stagger-3 { animation: slideInStagger 0.4s ease-out 0.3s both; }
        .stagger-4 { animation: slideInStagger 0.4s ease-out 0.4s both; }

        .modal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb), 0.3);
          border-radius: 10px;
        }
      `}</style>

      <div className="bakery-page">
        {/* Sticky Header */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}>
          {/* Restaurant Logo & Name */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
          }}>
            {/* Logo - Shopify style: clean, no container */}
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt={restaurant.name}
                style={{
                  height: 44,
                  maxWidth: 120,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "white",
                }}>
                  {restaurant.name?.charAt(0) || "R"}
                </span>
              </div>
            )}
            {/* Name & Description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#111",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p style={{
                  fontSize: 12,
                  color: "#6b7280",
                  margin: "2px 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {restaurant.description}
                </p>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="btn-hover"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: primaryColor,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <ShoppingCart style={{ width: 20, height: 20, color: "white" }} />
              {cartItemCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    minWidth: 20,
                    height: 20,
                    padding: "0 6px",
                    borderRadius: 10,
                    background: "#111",
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

        {/* Search & Categories Section */}
        <div style={{ padding: "16px 16px 0", background: "white" }}>

          {/* Search Bar */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <Search style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 20,
              height: 20,
              color: "#9ca3af"
            }} />
            <input
              type="text"
              placeholder="Search product"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: 48,
                paddingLeft: 48,
                paddingRight: 16,
                fontSize: 15,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                outline: "none",
                background: "#fafafa",
              }}
            />
          </div>

          {/* Section Title */}
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#374151",
            margin: "0 0 12px"
          }}>
            Our Menu
          </h2>

          {/* Category Pills */}
          <div
            className="category-nav"
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              className="btn-hover"
              style={{
                padding: "10px 20px",
                borderRadius: 100,
                border: "none",
                background: !activeCategory ? primaryColor : "#f3f4f6",
                color: !activeCategory ? "white" : "#374151",
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className="btn-hover"
                style={{
                  padding: "10px 20px",
                  borderRadius: 100,
                  border: "none",
                  background: activeCategory === category.id ? primaryColor : "#f3f4f6",
                  color: activeCategory === category.id ? "white" : "#374151",
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

        {/* Product Grid */}
        <div style={{ padding: "16px" }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#fdf2f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}>
                <Search style={{ width: 36, height: 36, color: primaryColor }} />
              </div>
              <p style={{ color: "#6b7280", fontSize: 16, margin: 0 }}>No products found</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16
            }}>
              {filteredItems.map((item, index) => {
                const cardBgColor = cardColors[index % cardColors.length];
                const isFavorite = favorites.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="product-card"
                    style={{
                      background: cardBgColor,
                      borderRadius: 24,
                      padding: 12,
                      cursor: "pointer",
                      position: "relative",
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Heart Button */}
                    <button
                      className="heart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "white",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Heart
                        style={{
                          width: 16,
                          height: 16,
                          color: isFavorite ? "#ef4444" : "#d1d5db",
                          fill: isFavorite ? "#ef4444" : "none",
                        }}
                        className={isFavorite ? "animate-heart" : ""}
                      />
                    </button>

                    {/* Product Image */}
                    <div style={{
                      aspectRatio: "1",
                      borderRadius: 20,
                      overflow: "hidden",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="product-image"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "rgba(255,255,255,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 20,
                          }}
                        >
                          <ImageIcon style={{ width: 40, height: 40, color: "#d1d5db" }} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <h3 style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111",
                      margin: "0 0 4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {item.name}
                    </h3>

                    {/* Price and Add Button */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}>
                      <div>
                        <span style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: primaryColor
                        }}>
                          ${item.sizes && item.sizes.length > 0
                            ? Math.min(...item.sizes.map((s) => s.price)).toFixed(2)
                            : Number(item.base_price).toFixed(2)}
                        </span>
                        {item.sizes && item.sizes.length > 0 && (
                          <span style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginLeft: 2
                          }}>
                            / pc
                          </span>
                        )}
                      </div>
                      <button
                        className="add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: primaryColor,
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Plus style={{ width: 20, height: 20, color: "white" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Detail Modal - Simple & Clean */}
        {selectedItem && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "white",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #eee",
              background: "white",
            }}>
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
                  borderRadius: 10,
                  background: "#f5f5f5",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: 20, height: 20, color: "#333" }} />
              </button>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>
                {selectedItem.name}
              </h2>
              <div style={{ width: 36 }} />
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: "auto", background: "white" }}>
              {/* Product Image & Info */}
              <div style={{ padding: 16, display: "flex", gap: 16, borderBottom: "1px solid #eee" }}>
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 12,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    background: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <ImageIcon style={{ width: 32, height: 32, color: "#ccc" }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: primaryColor, marginBottom: 4 }}>
                    ${hasProductSizes(selectedItem)
                      ? Math.min(...selectedItem.sizes!.map((s) => s.price)).toFixed(2)
                      : Number(selectedItem.base_price).toFixed(2)}
                  </div>
                  {selectedItem.description && (
                    <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>
                      {selectedItem.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              {hasProductSizes(selectedItem) && (
                <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Size</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: primaryColor }}>Required</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedItem.sizes!.map((size) => {
                      const isSelected = selectedSize?.name === size.name;
                      return (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size)}
                          style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: isSelected ? `2px solid ${primaryColor}` : "1px solid #ddd",
                            background: isSelected ? createTint(primaryColor, 0.08) : "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? primaryColor : "#333" }}>
                            {size.name}
                          </span>
                          <span style={{ fontSize: 13, color: isSelected ? primaryColor : "#666" }}>
                            ${size.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modifier Groups */}
              {getItemModifierGroups(selectedItem.id).map((group) => {
                const groupModifiers = getGroupModifiers(group.id);
                if (groupModifiers.length === 0) return null;

                return (
                  <div key={group.id} style={{ padding: 16, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{group.name}</span>
                      {group.is_required && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: primaryColor }}>Required</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {groupModifiers.map((modifier) => {
                        const isSelected = isModifierSelected(modifier.id);
                        const price = Number(modifier.price_adjustment) || 0;

                        return (
                          <button
                            key={modifier.id}
                            onClick={() => handleModifierSelect(group, modifier)}
                            style={{
                              padding: "10px 16px",
                              borderRadius: 8,
                              border: isSelected ? `2px solid ${primaryColor}` : "1px solid #ddd",
                              background: isSelected ? createTint(primaryColor, 0.08) : "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? primaryColor : "#333" }}>
                              {modifier.name}
                            </span>
                            {price !== 0 && (
                              <span style={{ fontSize: 12, color: price > 0 ? "#10b981" : "#666" }}>
                                {price > 0 ? "+" : ""}${Math.abs(price).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Special Instructions */}
              <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111", display: "block", marginBottom: 10 }}>
                  Special Instructions
                </span>
                <input
                  type="text"
                  placeholder="Add notes (optional)"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
                    fontSize: 14,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    outline: "none",
                    background: "white",
                  }}
                />
              </div>

              {/* Quantity */}
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Quantity</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Minus style={{ width: 18, height: 18, color: "#333" }} />
                    </button>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#111", minWidth: 30, textAlign: "center" }}>
                      {itemQuantity}
                    </span>
                    <button
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "none",
                        background: primaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Plus style={{ width: 18, height: 18, color: "white" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart Footer */}
            <div style={{
              padding: "12px 16px 20px",
              background: "white",
              borderTop: "1px solid #eee",
            }}>
              <button
                onClick={handleAddToCart}
                disabled={!areRequiredModifiersFilled()}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  border: "none",
                  background: areRequiredModifiersFilled() ? primaryColor : "#e5e7eb",
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
                <ShoppingCart style={{ width: 20, height: 20 }} />
                <span>Add to Cart</span>
                <span style={{ marginLeft: 4 }}>
                  ${(hasProductSizes(selectedItem) ? calculateSizeBasedTotal() : calculateItemTotal()).toFixed(2)}
                </span>
              </button>
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
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "#fdf2f8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px"
                    }}>
                      <ShoppingCart style={{ width: 36, height: 36, color: primaryColor }} />
                    </div>
                    <p style={{ color: "#666", fontSize: 16, margin: 0 }}>Your cart is empty</p>
                    <p style={{ color: "#999", fontSize: 14, margin: "8px 0 0" }}>Add some delicious items!</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 14,
                          background: "#fdf2f8",
                          borderRadius: 16,
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: primaryColor }}>
                            ${((item.price + (item.selectedModifiers?.reduce((sum, m) => sum + m.priceAdjustment, 0) || 0)) * item.quantity).toFixed(2)}
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
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <Link href={`/${slug}/checkout`} style={{ textDecoration: "none" }}>
                    <button
                      className="btn-hover"
                      style={{
                        width: "100%",
                        height: 54,
                        borderRadius: 100,
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
                borderRadius: 100,
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
                    borderRadius: "50%",
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
              <span>${subtotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
