import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedModifiers?: {
    groupName: string;
    modifierName: string;
    priceAdjustment: number;
  }[];
}

interface CartState {
  restaurantSlug: string | null;
  restaurantId: string | null;
  items: CartItem[];
  source: string;

  setRestaurant: (slug: string, id: string) => void;
  setSource: (source: string) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getItemCount: () => number;
  getSource: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantSlug: null,
      restaurantId: null,
      items: [],
      source: "direct",

      setRestaurant: (slug, id) => {
        const currentSlug = get().restaurantSlug;
        if (currentSlug && currentSlug !== slug) {
          // Clear cart if switching restaurants
          set({ restaurantSlug: slug, restaurantId: id, items: [], source: "direct" });
        } else {
          set({ restaurantSlug: slug, restaurantId: id });
        }
      },

      setSource: (source) => {
        // Only set source if it's not already set (first touch attribution)
        const currentSource = get().source;
        if (currentSource === "direct" && source !== "direct") {
          set({ source });
        }
      },

      addItem: (item) => {
        const id = `${item.menuItemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
          }));
        } else {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          }));
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        const items = get().items;
        return items.reduce((total, item) => {
          const modifiersTotal =
            item.selectedModifiers?.reduce(
              (sum, mod) => sum + mod.priceAdjustment,
              0
            ) || 0;
          return total + (item.price + modifiersTotal) * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getSource: () => {
        return get().source;
      },
    }),
    {
      name: "foodflow-cart",
    }
  )
);
