"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  ChefHat,
  Package,
  Truck,
  MapPin,
  Phone,
  Loader2,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import type { Tables } from "@/types/database";

type Order = Tables<"orders"> & {
  order_items?: Tables<"order_items">[];
};

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "out_for_delivery", label: "On the Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadOrder() {
      // Get order
      const { data: orderResult } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();

      if (orderResult) {
        const orderData = orderResult as unknown as Order;
        setOrder(orderData);

        // Get restaurant
        const { data: restaurantData } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", orderData.restaurant_id)
          .single();

        setRestaurant(restaurantData as Tables<"restaurants"> | null);
      }
      setIsLoading(false);
    }

    loadOrder();

    // Subscribe to order updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <Link href={`/${slug}`}>
          <Button>Back to Menu</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.key === order.status
  );

  // For pickup orders, exclude delivery step
  const filteredSteps =
    order.order_type === "pickup"
      ? statusSteps.filter((step) => step.key !== "out_for_delivery")
      : statusSteps;

  // Generate WhatsApp URL for sending order to restaurant
  const getWhatsAppUrl = () => {
    if (!restaurant?.phone || !order) return null;

    const orderItemsList = order.order_items
      ?.map((item) => {
        let itemText = `• ${item.quantity}x ${item.item_name}`;
        if (item.notes) {
          itemText += ` - Note: ${item.notes}`;
        }
        return itemText;
      })
      .join("\n") || "";

    const whatsappMessage = `🆕 *New Order #${order.id.slice(-6).toUpperCase()}*

📋 *Order Details:*
${orderItemsList}

💰 *Payment:*
Subtotal: $${Number(order.subtotal).toFixed(2)}
${Number(order.tax_amount) > 0 ? `Tax: $${Number(order.tax_amount).toFixed(2)}\n` : ""}${Number(order.delivery_fee) > 0 ? `Delivery: $${Number(order.delivery_fee).toFixed(2)}\n` : ""}*Total: $${Number(order.total).toFixed(2)}*

👤 *Customer:*
Name: ${order.customer_name}
Phone: ${order.customer_phone}

📦 *Order Type:* ${order.order_type === "delivery" ? "Delivery" : "Pickup"}
${order.order_type === "delivery" && order.delivery_address ? `📍 *Address:* ${order.delivery_address}` : ""}`;

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = restaurant.phone.replace(/[\s\-\(\)]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
  };

  const whatsappUrl = getWhatsAppUrl();

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
          <h1 className="text-xl font-semibold">Order Tracking</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Success Message */}
        {order.status === "pending" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-green-800">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-green-700">
                    Thank you for your order. Please send it to the restaurant via WhatsApp.
                  </p>
                </div>
              </div>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Send Order via WhatsApp
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSteps.map((step, index) => {
                const stepIndex = statusSteps.findIndex(
                  (s) => s.key === step.key
                );
                const isCompleted = stepIndex <= currentStepIndex;
                const isCurrent = step.key === order.status;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-primary">Current status</p>
                      )}
                    </div>
                    {index < filteredSteps.length - 1 && (
                      <div
                        className={`absolute left-[19px] mt-10 h-[calc(100%-2.5rem)] w-0.5 ${
                          isCompleted ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {item.quantity}x {item.item_name}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">
                      ${Number(item.total_price).toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(order.tax_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${Number(order.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order.delivery_fee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>${Number(order.delivery_fee).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery/Pickup Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                {order.order_type === "delivery"
                  ? "Delivery Information"
                  : "Pickup Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {order.customer_phone}
                  </a>
                </div>
              </div>

              {order.order_type === "delivery" && order.delivery_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-muted-foreground">
                      {order.delivery_address}
                    </p>
                    {order.delivery_notes && (
                      <p className="text-sm italic text-muted-foreground">
                        {order.delivery_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {order.order_type === "pickup" && restaurant && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-muted-foreground">{restaurant.address}</p>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="font-medium">Payment Method</p>
                <p className="text-muted-foreground">Cash on Delivery</p>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Order placed: {new Date(order.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Menu */}
        <div className="text-center">
          <Link href={`/${slug}`}>
            <Button variant="outline" size="lg">
              Order Again
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
