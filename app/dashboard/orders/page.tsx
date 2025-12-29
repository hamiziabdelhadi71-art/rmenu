"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/types/database";

type Order = Tables<"orders"> & {
  order_items?: Tables<"order_items">[];
};

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    nextStatus: "confirmed" as const,
    nextLabel: "Confirm",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    nextStatus: "preparing" as const,
    nextLabel: "Start Preparing",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-100 text-purple-800",
    nextStatus: "ready" as const,
    nextLabel: "Mark Ready",
    icon: ChefHat,
  },
  ready: {
    label: "Ready",
    color: "bg-green-100 text-green-800",
    nextStatus: "out_for_delivery" as const,
    nextLabel: "Out for Delivery",
    icon: Package,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-indigo-100 text-indigo-800",
    nextStatus: "delivered" as const,
    nextLabel: "Mark Delivered",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-gray-100 text-gray-800",
    nextStatus: null,
    nextLabel: null,
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    nextStatus: null,
    nextLabel: null,
    icon: Clock,
  },
};

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Get restaurant
      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!restaurantData) {
        router.push("/dashboard/profile");
        return;
      }

      setRestaurant(restaurantData);

      // Get orders with items
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantData.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);
      setIsLoading(false);

      // Subscribe to real-time updates
      const channel = supabase
        .channel("orders-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${restaurantData.id}`,
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              // Fetch the complete order with items
              const { data: newOrder } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("id", payload.new.id)
                .single();

              if (newOrder) {
                setOrders((prev) => [newOrder, ...prev]);
                // Play notification sound
                playNotificationSound();
                toast({
                  title: "New Order!",
                  description: `Order from ${newOrder.customer_name}`,
                });
              }
            } else if (payload.eventType === "UPDATE") {
              setOrders((prev) =>
                prev.map((order) =>
                  order.id === payload.new.id
                    ? { ...order, ...payload.new }
                    : order
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    loadData();
  }, [supabase, router, toast]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch {
      // Ignore errors
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    setUpdatingOrderId(orderId);

    try {
      const updateData: Partial<Order> = { status: newStatus };

      // Add timestamp for specific statuses
      if (newStatus === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === "ready") {
        updateData.prepared_at = new Date().toISOString();
      } else if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order updated",
        description: `Order status changed to ${statusConfig[newStatus].label}`,
      });
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Update failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "active") {
      return !["delivered", "cancelled"].includes(order.status);
    }
    if (filter === "completed") {
      return order.status === "delivered";
    }
    if (filter === "cancelled") {
      return order.status === "cancelled";
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage your incoming orders in real-time</p>
      </div>
        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
          {["active", "completed", "cancelled", "all"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No orders found</h3>
              <p className="text-muted-foreground">
                {filter === "active"
                  ? "You don't have any active orders right now."
                  : "No orders match the selected filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {order.customer_name}
                      </CardTitle>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="hover:underline"
                        >
                          {order.customer_phone}
                        </a>
                      </div>
                      {order.delivery_address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="border-t pt-3">
                      <p className="mb-2 text-sm font-medium">Order Items:</p>
                      <ul className="space-y-1 text-sm">
                        {order.order_items?.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between text-muted-foreground"
                          >
                            <span>
                              {item.quantity}x {item.item_name}
                            </span>
                            <span>${Number(item.total_price).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Order Total */}
                    <div className="flex items-center justify-between border-t pt-3 font-semibold">
                      <span>Total</span>
                      <span>${Number(order.total).toFixed(2)}</span>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">Notes:</p>
                        <p className="text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    {config.nextStatus && (
                      <Button
                        className="w-full"
                        onClick={() =>
                          updateOrderStatus(order.id, config.nextStatus!)
                        }
                        disabled={updatingOrderId === order.id}
                      >
                        {updatingOrderId === order.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {config.nextLabel}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}
