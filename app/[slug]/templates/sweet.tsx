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
  Check,
  Star,
  Cake,
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

interface SweetTemplateProps {
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

export default function SweetTemplate({
  restaurant,
  categories,
  menuItems,
  modifierGroups,
  modifiers,
  itemModifierLinks,
  slug,
}: SweetTemplateProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id || null);
  const [showSearch, setShowSearch] = useState(false);

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
      const yOffset = -160;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Sweet color palette
  const colors = {
    cream: "#FDF8F3",
    pink: "#FECDD3",
    pinkDark: "#F9A8B8",
    brown: "#8B6F47",
    brownLight: "#A68B5B",
    gold: "#D4A574",
    warmWhite: "#FFFBF7",
    text: "#5D4E37",
    textLight: "#8B7355",
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .sweet-page {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
          background: ${colors.cream};
          min-height: 100vh;
          padding-bottom: 100px;
          position: relative;
        }

        .sweet-heading {
          font-family: 'Playfair Display', Georgia, serif;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
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

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes sprinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }

        .sweet-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .sweet-card:hover {
          transform: translateY(-8px) rotate(1deg);
          box-shadow: 0 20px 40px -12px rgba(139, 111, 71, 0.2);
        }

        .sweet-btn {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .sweet-btn:hover {
          transform: scale(1.05);
        }
        .sweet-btn:active {
          transform: scale(0.95);
        }

        .category-scroll::-webkit-scrollbar { display: none; }
        .category-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* Sprinkles decoration */
        .sprinkle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: sprinkle 3s ease-in-out infinite;
        }
      `}</style>

      <div className="sweet-page">
        {/* Decorative Sprinkles Background */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="sprinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: [colors.pink, colors.gold, colors.pinkDark][i % 3],
                animationDelay: `${i * 0.2}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <div
          style={{
            position: "relative",
            background: `linear-gradient(180deg, ${colors.pink}40 0%, ${colors.cream} 100%)`,
            paddingBottom: 24,
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.pink}30 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.gold}20 0%, transparent 70%)`,
            }}
          />

          {/* Header Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "16px 20px",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="sweet-btn"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: colors.warmWhite,
                  boxShadow: "0 4px 12px rgba(139, 111, 71, 0.1)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.brown,
                  cursor: "pointer",
                }}
              >
                <Search style={{ width: 20, height: 20 }} />
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="sweet-btn"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: colors.warmWhite,
                  boxShadow: "0 4px 12px rgba(139, 111, 71, 0.1)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.brown,
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
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.pinkDark} 0%, ${colors.pink} 100%)`,
                      color: colors.text,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(249, 168, 184, 0.4)",
                    }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Restaurant Info */}
          <div style={{ padding: "20px 20px 0", textAlign: "center", position: "relative", zIndex: 10 }}>
            {/* Logo */}
            <div
              style={{
                width: 100,
                height: 100,
                margin: "0 auto 16px",
                borderRadius: 30,
                background: colors.warmWhite,
                padding: 6,
                boxShadow: "0 8px 24px rgba(139, 111, 71, 0.15)",
              }}
            >
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  style={{ width: "100%", height: "100%", borderRadius: 24, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${colors.pink} 0%, ${colors.pinkDark} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Cake style={{ width: 40, height: 40, color: colors.text }} />
                </div>
              )}
            </div>

            <h1
              className="sweet-heading"
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: colors.text,
                margin: "0 0 8px",
                fontStyle: "italic",
              }}
            >
              {restaurant.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star style={{ width: 16, height: 16, fill: colors.gold, color: colors.gold }} />
                <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>4.9</span>
                <span style={{ color: colors.textLight, fontSize: 14 }}>(200+)</span>
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 100,
                  background: restaurant.is_active
                    ? `linear-gradient(135deg, #C1E1C1 0%, #A8D5A8 100%)`
                    : `linear-gradient(135deg, ${colors.pink} 0%, ${colors.pinkDark} 100%)`,
                  color: restaurant.is_active ? "#2D5A2D" : colors.text,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {restaurant.is_active ? "Open" : "Closed"}
              </div>
            </div>

            {restaurant.description && (
              <p style={{ fontSize: 14, color: colors.textLight, margin: "0 0 12px", lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                {restaurant.description}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13, color: colors.textLight }}>
              {restaurant.address && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 14, height: 14 }} />
                  <span>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, color: colors.textLight, textDecoration: "none" }}>
                  <Phone style={{ width: 14, height: 14 }} />
                  <span>{restaurant.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div
            className="animate-fadeIn"
            style={{
              padding: "16px 20px",
              background: colors.warmWhite,
              borderBottom: `1px solid ${colors.pink}40`,
            }}
          >
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: colors.textLight }} />
              <input
                type="text"
                placeholder="Search sweet treats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  height: 52,
                  paddingLeft: 48,
                  paddingRight: 48,
                  fontSize: 15,
                  border: "none",
                  borderRadius: 26,
                  outline: "none",
                  background: colors.cream,
                  color: colors.text,
                  boxShadow: "inset 0 2px 8px rgba(139, 111, 71, 0.06)",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: colors.pink,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 14, height: 14, color: colors.text }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sticky Category Navigation */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: colors.warmWhite,
            borderBottom: `1px solid ${colors.pink}30`,
            boxShadow: "0 4px 16px rgba(139, 111, 71, 0.06)",
          }}
        >
          <div
            className="category-scroll"
            style={{
              display: "flex",
              gap: 10,
              padding: "14px 20px",
              overflowX: "auto",
            }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className="sweet-btn"
                style={{
                  padding: "10px 22px",
                  borderRadius: 100,
                  border: "none",
                  background: activeCategory === category.id
                    ? `linear-gradient(135deg, ${colors.pinkDark} 0%, ${colors.pink} 100%)`
                    : colors.cream,
                  color: activeCategory === category.id ? colors.text : colors.textLight,
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: activeCategory === category.id
                    ? "0 4px 12px rgba(249, 168, 184, 0.3)"
                    : "0 2px 8px rgba(139, 111, 71, 0.06)",
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Content */}
        <div style={{ padding: "20px", position: "relative", zIndex: 1 }}>
          {categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  background: colors.pink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Cake style={{ width: 48, height: 48, color: colors.text }} />
              </div>
              <p className="sweet-heading" style={{ color: colors.textLight, fontSize: 18, fontStyle: "italic", margin: 0 }}>
                No treats available yet
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {categories.map((category) => {
                const categoryItems = filteredItems.filter((item) => item.category_id === category.id);
                if (categoryItems.length === 0 && searchQuery) return null;

                return (
                  <section
                    key={category.id}
                    ref={(el) => { categoryRefs.current[category.id] = el; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                      <h2
                        className="sweet-heading"
                        style={{
                          fontSize: 26,
                          fontWeight: 600,
                          color: colors.text,
                          margin: 0,
                          fontStyle: "italic",
                        }}
                      >
                        {category.name}
                      </h2>
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          background: `linear-gradient(90deg, ${colors.pink} 0%, transparent 100%)`,
                          borderRadius: 1,
                        }}
                      />
                    </div>

                    {categoryItems.length === 0 ? (
                      <p style={{ color: colors.textLight, fontSize: 14 }}>No items found</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                        {categoryItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="sweet-card"
                            onClick={() => setSelectedItem(item)}
                            style={{
                              background: colors.warmWhite,
                              borderRadius: 24,
                              overflow: "hidden",
                              cursor: "pointer",
                              boxShadow: "0 4px 16px rgba(139, 111, 71, 0.08)",
                              transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)`,
                            }}
                          >
                            {/* Image */}
                            <div
                              style={{
                                position: "relative",
                                paddingTop: "70%",
                                background: `linear-gradient(135deg, ${colors.pink}30 0%, ${colors.cream} 100%)`,
                                overflow: "hidden",
                              }}
                            >
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    right: 8,
                                    bottom: 8,
                                    width: "calc(100% - 16px)",
                                    height: "calc(100% - 16px)",
                                    objectFit: "cover",
                                    borderRadius: 16,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    right: 8,
                                    bottom: 8,
                                    borderRadius: 16,
                                    background: colors.cream,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Cake style={{ width: 48, height: 48, color: colors.pink }} />
                                </div>
                              )}

                              {/* Add Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(item);
                                }}
                                className="sweet-btn"
                                style={{
                                  position: "absolute",
                                  bottom: 16,
                                  right: 16,
                                  width: 44,
                                  height: 44,
                                  borderRadius: 22,
                                  background: `linear-gradient(135deg, ${colors.brown} 0%, ${colors.brownLight} 100%)`,
                                  border: "none",
                                  boxShadow: "0 4px 12px rgba(139, 111, 71, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Plus style={{ width: 22, height: 22, color: "white" }} />
                              </button>
                            </div>

                            {/* Info */}
                            <div style={{ padding: 16 }}>
                              <h3
                                className="sweet-heading"
                                style={{
                                  fontSize: 18,
                                  fontWeight: 600,
                                  color: colors.text,
                                  margin: 0,
                                }}
                              >
                                {item.name}
                              </h3>
                              {item.description && (
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: colors.textLight,
                                    margin: "8px 0 0",
                                    lineHeight: 1.5,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {item.description}
                                </p>
                              )}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                                <p
                                  className="sweet-heading"
                                  style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: colors.brown,
                                    margin: 0,
                                  }}
                                >
                                  {item.sizes && item.sizes.length > 0 ? (
                                    <>
                                      <span style={{ fontSize: 12, fontWeight: 500, color: colors.textLight, fontFamily: "Nunito" }}>From </span>
                                      ${Math.min(...item.sizes.map((s) => s.price)).toFixed(2)}
                                    </>
                                  ) : (
                                    `$${Number(item.base_price).toFixed(2)}`
                                  )}
                                </p>
                                <Heart style={{ width: 18, height: 18, color: colors.pink }} />
                              </div>
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
              background: "rgba(93, 78, 55, 0.4)",
              backdropFilter: "blur(4px)",
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
                background: colors.cream,
                borderRadius: "32px 32px 0 0",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Item Image */}
              {selectedItem.image_url && (
                <div
                  style={{
                    position: "relative",
                    height: 220,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${colors.pink}40 0%, ${colors.cream} 100%)`,
                    padding: 12,
                  }}
                >
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 24,
                    }}
                  />
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setItemQuantity(1);
                      setItemNotes("");
                      setSelectedModifiers([]);
                      setSelectedSize(null);
                    }}
                    className="sweet-btn"
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 20,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: colors.warmWhite,
                      border: "none",
                      boxShadow: "0 4px 12px rgba(139, 111, 71, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: 20, height: 20, color: colors.text }} />
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
                    className="sweet-btn"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: colors.pink,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: 20, height: 20, color: colors.text }} />
                  </button>
                </div>
              )}

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <h2
                  className="sweet-heading"
                  style={{ fontSize: 26, fontWeight: 600, color: colors.text, margin: 0, fontStyle: "italic" }}
                >
                  {selectedItem.name}
                </h2>
                <p
                  className="sweet-heading"
                  style={{ fontSize: 22, fontWeight: 700, color: colors.brown, margin: "8px 0" }}
                >
                  {hasProductSizes(selectedItem) ? (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 500, color: colors.textLight, fontFamily: "Nunito" }}>From </span>
                      ${Math.min(...selectedItem.sizes!.map((s) => s.price)).toFixed(2)}
                    </>
                  ) : (
                    `$${Number(selectedItem.base_price).toFixed(2)}`
                  )}
                </p>
                {selectedItem.description && (
                  <p style={{ fontSize: 14, color: colors.textLight, margin: "0 0 24px", lineHeight: 1.6 }}>
                    {selectedItem.description}
                  </p>
                )}

                {/* Sizes */}
                {hasProductSizes(selectedItem) && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>Size</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: colors.pinkDark,
                          background: `${colors.pink}50`,
                          padding: "4px 10px",
                          borderRadius: 20,
                        }}
                      >
                        Required
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {selectedItem.sizes!.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size)}
                          className="sweet-btn"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 16,
                            background: selectedSize?.name === size.name ? colors.pink : colors.warmWhite,
                            border: "none",
                            borderRadius: 16,
                            cursor: "pointer",
                            boxShadow: selectedSize?.name === size.name
                              ? "0 4px 12px rgba(249, 168, 184, 0.3)"
                              : "0 2px 8px rgba(139, 111, 71, 0.06)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                border: `2px solid ${selectedSize?.name === size.name ? colors.brown : colors.textLight}`,
                                background: selectedSize?.name === size.name ? colors.brown : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {selectedSize?.name === size.name && (
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                              )}
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{size.name}</span>
                          </div>
                          <span className="sweet-heading" style={{ fontSize: 15, fontWeight: 700, color: colors.brown }}>
                            ${size.price.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modifier Groups */}
                {getItemModifierGroups(selectedItem.id).map((group) => {
                  const groupModifiers = getGroupModifiers(group.id);
                  if (groupModifiers.length === 0) return null;

                  return (
                    <div key={group.id} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{group.name}</span>
                        {group.is_required && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: colors.pinkDark,
                              background: `${colors.pink}50`,
                              padding: "4px 10px",
                              borderRadius: 20,
                            }}
                          >
                            Required
                          </span>
                        )}
                      </div>
                      {group.selection_type === "multiple" && (
                        <p style={{ fontSize: 12, color: colors.textLight, margin: "-10px 0 14px" }}>
                          Select up to {group.max_select || "multiple"} {group.min_select ? `(min ${group.min_select})` : ""}
                        </p>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {groupModifiers.map((modifier) => {
                          const isSelected = isModifierSelected(modifier.id);
                          const price = Number(modifier.price_adjustment) || 0;

                          return (
                            <button
                              key={modifier.id}
                              onClick={() => handleModifierSelect(group, modifier)}
                              className="sweet-btn"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: 16,
                                background: isSelected ? colors.pink : colors.warmWhite,
                                border: "none",
                                borderRadius: 16,
                                cursor: "pointer",
                                boxShadow: isSelected
                                  ? "0 4px 12px rgba(249, 168, 184, 0.3)"
                                  : "0 2px 8px rgba(139, 111, 71, 0.06)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: group.selection_type === "single" ? "50%" : 8,
                                    border: `2px solid ${isSelected ? colors.brown : colors.textLight}`,
                                    background: isSelected ? colors.brown : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {isSelected && <Check style={{ width: 14, height: 14, color: "white" }} />}
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 500, color: colors.text }}>{modifier.name}</span>
                              </div>
                              {price !== 0 && (
                                <span style={{ fontSize: 14, fontWeight: 600, color: price > 0 ? "#4CAF50" : colors.textLight }}>
                                  {price > 0 ? "+" : ""}${price.toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 16, fontWeight: 600, color: colors.text, display: "block", marginBottom: 10 }}>
                    Special Requests
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Extra frosting, no nuts..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    style={{
                      width: "100%",
                      height: 52,
                      padding: "0 18px",
                      fontSize: 14,
                      border: "none",
                      borderRadius: 16,
                      outline: "none",
                      background: colors.warmWhite,
                      color: colors.text,
                      boxShadow: "inset 0 2px 8px rgba(139, 111, 71, 0.06)",
                    }}
                  />
                </div>

                {/* Quantity */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    background: colors.warmWhite,
                    borderRadius: 16,
                    boxShadow: "0 2px 8px rgba(139, 111, 71, 0.06)",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>Quantity</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <button
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="sweet-btn"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        border: "none",
                        background: colors.pink,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Minus style={{ width: 18, height: 18, color: colors.text }} />
                    </button>
                    <span style={{ fontSize: 20, fontWeight: 700, color: colors.text, width: 36, textAlign: "center" }}>
                      {itemQuantity}
                    </span>
                    <button
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="sweet-btn"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        border: "none",
                        background: colors.pink,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Plus style={{ width: 18, height: 18, color: colors.text }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div style={{ padding: 20, background: colors.warmWhite, borderTop: `1px solid ${colors.pink}30` }}>
                <button
                  onClick={handleAddToCart}
                  disabled={!areRequiredModifiersFilled()}
                  className="sweet-btn"
                  style={{
                    width: "100%",
                    height: 58,
                    borderRadius: 29,
                    border: "none",
                    background: areRequiredModifiersFilled()
                      ? `linear-gradient(135deg, ${colors.brown} 0%, ${colors.brownLight} 100%)`
                      : colors.textLight,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: areRequiredModifiersFilled() ? "pointer" : "not-allowed",
                    boxShadow: areRequiredModifiersFilled()
                      ? "0 8px 20px rgba(139, 111, 71, 0.3)"
                      : "none",
                  }}
                >
                  {areRequiredModifiersFilled() ? (
                    <>Add to Basket - ${(hasProductSizes(selectedItem) ? calculateSizeBasedTotal() : calculateItemTotal()).toFixed(2)}</>
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
              background: "rgba(93, 78, 55, 0.4)",
              backdropFilter: "blur(4px)",
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
                background: colors.cream,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                  background: `linear-gradient(180deg, ${colors.pink}40 0%, ${colors.cream} 100%)`,
                }}
              >
                <h2 className="sweet-heading" style={{ fontSize: 24, fontWeight: 600, color: colors.text, margin: 0, fontStyle: "italic" }}>
                  Your Basket
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="sweet-btn"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: colors.warmWhite,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(139, 111, 71, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 20, height: 20, color: colors.text }} />
                </button>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        background: colors.pink,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                      }}
                    >
                      <ShoppingCart style={{ width: 44, height: 44, color: colors.text }} />
                    </div>
                    <p className="sweet-heading" style={{ color: colors.text, fontSize: 18, margin: 0, fontStyle: "italic" }}>
                      Your basket is empty
                    </p>
                    <p style={{ color: colors.textLight, fontSize: 14, margin: "8px 0 0" }}>
                      Add some sweet treats!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 16,
                          background: colors.warmWhite,
                          borderRadius: 20,
                          boxShadow: "0 2px 8px rgba(139, 111, 71, 0.06)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 className="sweet-heading" style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>
                            {item.name}
                          </h4>
                          <button
                            onClick={() => cartStore.removeItem(item.id)}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            <X style={{ width: 18, height: 18, color: colors.textLight }} />
                          </button>
                        </div>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <p style={{ fontSize: 12, color: colors.textLight, margin: "0 0 8px" }}>
                            {item.selectedModifiers.map((m) => m.modifierName).join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p style={{ fontSize: 12, fontStyle: "italic", color: colors.textLight, margin: "0 0 8px" }}>
                            {item.notes}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="sweet-heading" style={{ fontSize: 16, fontWeight: 700, color: colors.brown }}>
                            ${((item.price + (item.selectedModifiers?.reduce((sum, m) => sum + m.priceAdjustment, 0) || 0)) * item.quantity).toFixed(2)}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button
                              onClick={() => cartStore.updateQuantity(item.id, item.quantity - 1)}
                              className="sweet-btn"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                border: "none",
                                background: colors.pink,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Minus style={{ width: 14, height: 14, color: colors.text }} />
                            </button>
                            <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{item.quantity}</span>
                            <button
                              onClick={() => cartStore.updateQuantity(item.id, item.quantity + 1)}
                              className="sweet-btn"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                border: "none",
                                background: colors.pink,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Plus style={{ width: 14, height: 14, color: colors.text }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div style={{ padding: 20, background: colors.warmWhite, borderTop: `1px solid ${colors.pink}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <span style={{ fontSize: 16, color: colors.textLight }}>Subtotal</span>
                    <span className="sweet-heading" style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <Link href={`/${slug}/checkout`} style={{ textDecoration: "none" }}>
                    <button
                      className="sweet-btn"
                      style={{
                        width: "100%",
                        height: 58,
                        borderRadius: 29,
                        border: "none",
                        background: `linear-gradient(135deg, ${colors.brown} 0%, ${colors.brownLight} 100%)`,
                        color: "white",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 8px 20px rgba(139, 111, 71, 0.3)",
                      }}
                    >
                      Checkout
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
              background: colors.warmWhite,
              borderTop: `1px solid ${colors.pink}30`,
              boxShadow: "0 -8px 24px rgba(139, 111, 71, 0.1)",
              zIndex: 40,
            }}
          >
            <button
              onClick={() => setShowCart(true)}
              className="sweet-btn"
              style={{
                width: "100%",
                height: 58,
                borderRadius: 29,
                border: "none",
                background: `linear-gradient(135deg, ${colors.brown} 0%, ${colors.brownLight} 100%)`,
                color: "white",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                boxShadow: "0 8px 20px rgba(139, 111, 71, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
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
                <span>View Basket</span>
              </div>
              <span className="sweet-heading" style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
