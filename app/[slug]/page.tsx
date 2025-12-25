"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  MapPin,
  Phone,
  Clock,
  Search,
  Plus,
  Minus,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import type { Tables } from "@/types/database";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;

export default function RestaurantPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [showCart, setShowCart] = useState(false);

  const {
    items: cartItems,
    setRestaurant: setCartRestaurant,
    addItem,
    updateQuantity,
    removeItem,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Get restaurant
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
      setCartRestaurant(slug, restaurantData.id);

      // Get categories
      const { data: categoriesResult } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      setCategories((categoriesResult as unknown as Category[]) || []);

      // Get menu items
      const { data: itemsResult } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_available", true)
        .order("display_order", { ascending: true });

      setMenuItems((itemsResult as unknown as MenuItem[]) || []);
      setIsLoading(false);
    }

    loadData();
  }, [slug, supabase, setCartRestaurant]);

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const cartItem: Omit<CartItem, "id"> = {
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      price: Number(selectedItem.base_price),
      quantity: itemQuantity,
      notes: itemNotes || undefined,
    };

    addItem(cartItem);
    setSelectedItem(null);
    setItemQuantity(1);
    setItemNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Restaurant Not Found</h1>
        <p className="text-muted-foreground">
          This restaurant doesn&apos;t exist or is currently closed.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const cartItemCount = getItemCount();
  const subtotal = getSubtotal();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
          </div>
          <Button
            variant="outline"
            className="relative"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Restaurant Info */}
      <section className="border-b bg-muted/30 py-6">
        <div className="container">
          <p className="mb-4 text-muted-foreground">{restaurant.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {restaurant.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {restaurant.address}
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {restaurant.is_active ? (
                <span className="text-green-600">Open now</span>
              ) : (
                <span className="text-red-600">Closed</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="container py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Menu */}
      <main className="container py-4">
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No menu items available yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryItems = filteredItems.filter(
                (item) => item.category_id === category.id
              );

              if (categoryItems.length === 0) return null;

              return (
                <section key={category.id}>
                  <h2 className="mb-4 text-xl font-semibold">{category.name}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryItems.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                        onClick={() => setSelectedItem(item)}
                      >
                        <CardContent className="p-0">
                          <div className="flex">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-24 w-24 object-cover"
                              />
                            ) : (
                              <div className="flex h-24 w-24 items-center justify-center bg-muted">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-1 flex-col justify-between p-3">
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold text-primary">
                                ${Number(item.base_price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-lg rounded-t-2xl bg-background p-6 sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedItem.name}</h3>
                <p className="text-lg font-bold text-primary">
                  ${Number(selectedItem.base_price).toFixed(2)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedItem(null);
                  setItemQuantity(1);
                  setItemNotes("");
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {selectedItem.description && (
              <p className="mb-4 text-muted-foreground">
                {selectedItem.description}
              </p>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Special instructions
              </label>
              <Input
                placeholder="e.g., No onions, extra sauce..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div className="mb-6 flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">
                  {itemQuantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button className="w-full" size="lg" onClick={handleAddToCart}>
              Add to Cart - $
              {(Number(selectedItem.base_price) * itemQuantity).toFixed(2)}
            </Button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex h-full w-full max-w-md flex-col bg-background">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t p-4">
                <div className="mb-4 flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <Link href={`/${slug}/checkout`}>
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Cart Button (Mobile) */}
      {cartItemCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 sm:hidden">
          <Button className="w-full" size="lg" onClick={() => setShowCart(true)}>
            View Cart ({cartItemCount}) - ${subtotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
}
