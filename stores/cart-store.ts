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

  setRestaurant: (slug: string, id: string) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantSlug: null,
      restaurantId: null,
      items: [],

      setRestaurant: (slug, id) => {
        const currentSlug = get().restaurantSlug;
        if (currentSlug && currentSlug !== slug) {
          // Clear cart if switching restaurants
          set({ restaurantSlug: slug, restaurantId: id, items: [] });
        } else {
          set({ restaurantSlug: slug, restaurantId: id });
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
    }),
    {
      name: "foodflow-cart",
    }
  )
);
