"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, MapPin, Package } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/hooks/use-toast";
import type { Tables, InsertTables } from "@/types/database";

type Restaurant = Tables<"restaurants">;
type Order = Tables<"orders">;
type OrderInsert = InsertTables<"orders">;
type OrderItemInsert = InsertTables<"order_items">;

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    deliveryNotes: "",
    notes: "",
  });

  const { items, restaurantId, getSubtotal, clearCart } = useCartStore();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function loadRestaurant() {
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        setRestaurant(data);
      }
      setIsLoading(false);
    }

    loadRestaurant();
  }, [slug, supabase]);

  const subtotal = getSubtotal();
  const taxAmount = restaurant ? subtotal * (Number(restaurant.tax_rate) / 100) : 0;
  const deliveryFee =
    orderType === "delivery" && restaurant
      ? Number(restaurant.delivery_fee)
      : 0;
  const total = subtotal + taxAmount + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurant || !restaurantId) {
      toast({
        title: "Error",
        description: "Restaurant information not available.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    if (
      orderType === "delivery" &&
      restaurant.minimum_order &&
      subtotal < Number(restaurant.minimum_order)
    ) {
      toast({
        title: "Minimum order not met",
        description: `Minimum order for delivery is $${Number(restaurant.minimum_order).toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const orderData: OrderInsert = {
        restaurant_id: restaurantId,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail || null,
        order_type: orderType,
        delivery_address:
          orderType === "delivery" ? formData.deliveryAddress : null,
        delivery_notes:
          orderType === "delivery" ? formData.deliveryNotes : null,
        status: "pending",
        subtotal: subtotal,
        tax_amount: taxAmount,
        delivery_fee: deliveryFee,
        total: total,
        notes: formData.notes || null,
      };

      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as never)
        .select()
        .single();

      if (orderError || !orderResult) throw orderError;

      const order = orderResult as unknown as Order;

      // Create order items
      const orderItems: OrderItemInsert[] = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price:
          (item.price +
            (item.selectedModifiers?.reduce(
              (sum, mod) => sum + mod.priceAdjustment,
              0
            ) || 0)) *
          item.quantity,
        selected_modifiers: item.selectedModifiers || [],
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems as never[]);

      if (itemsError) throw itemsError;

      // Clear cart and redirect to confirmation
      clearCart();
      router.push(`/${slug}/order/${order.id}`);
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Order failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
        <Link href={`/${slug}`}>
          <Button>Back to Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center gap-4">
          <Link href={`/${slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </header>

      <main className="container py-6">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle>Order Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setOrderType("delivery")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      orderType === "delivery"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        ${Number(restaurant.delivery_fee).toFixed(2)} fee
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("pickup")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      orderType === "pickup"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Pickup</p>
                      <p className="text-sm text-muted-foreground">No fee</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                      placeholder="Your phone number"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerEmail: e.target.value,
                      }))
                    }
                    placeholder="your@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {orderType === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryAddress: e.target.value,
                        }))
                      }
                      placeholder="Enter your delivery address"
                      required={orderType === "delivery"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryNotes">
                      Delivery Instructions (optional)
                    </Label>
                    <Input
                      id="deliveryNotes"
                      value={formData.deliveryNotes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryNotes: e.target.value,
                        }))
                      }
                      placeholder="e.g., Ring doorbell, leave at door..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any special requests for your order..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>
                        $
                        {(
                          (item.price +
                            (item.selectedModifiers?.reduce(
                              (sum, mod) => sum + mod.priceAdjustment,
                              0
                            ) || 0)) *
                          item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax ({restaurant.tax_rate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {orderType === "delivery" && deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-3 text-center text-sm">
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-muted-foreground">
                    Pay when your order arrives
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Place Order - ${total.toFixed(2)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
