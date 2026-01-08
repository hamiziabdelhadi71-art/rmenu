"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Phone,
  MapPin,
  Package,
  ShoppingBag,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/types/database";

type Order = Tables<"orders"> & {
  order_items?: Tables<"order_items">[];
};

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [filter, setFilter] = useState<string>("today");

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

      // Subscribe to real-time updates for new orders
      const channel = supabase
        .channel("orders-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${restaurantData.id}`,
          },
          async (payload) => {
            // Fetch the complete order with items
            const { data: newOrder } = await supabase
              .from("orders")
              .select("*, order_items(*)")
              .eq("id", payload.new.id)
              .single();

            if (newOrder) {
              setOrders((prev) => [newOrder, ...prev]);
              playNotificationSound();
              toast({
                title: "Nouvelle commande!",
                description: `Commande de ${newOrder.customer_name}`,
              });
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
      audio.play().catch(() => {});
    } catch {
      // Ignore errors
    }
  };

  // Filter orders by date
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const now = new Date();

    if (filter === "today") {
      return orderDate.toDateString() === now.toDateString();
    }
    if (filter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= weekAgo;
    }
    if (filter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= monthAgo;
    }
    return true; // "all"
  });

  // Calculate stats for filtered orders
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#22c55e]" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#25262b]">Commandes</h1>
        <p className="text-sm text-[#868e96]">Historique de vos commandes WhatsApp</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-[#e9ecef]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f5ff]">
                <ShoppingBag className="h-5 w-5 text-[#228be6]" />
              </div>
              <div>
                <p className="text-sm text-[#868e96]">Commandes</p>
                <p className="text-xl font-bold text-[#25262b]">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e9ecef]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d3f9d8]">
                <TrendingUp className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div>
                <p className="text-sm text-[#868e96]">Revenus</p>
                <p className="text-xl font-bold text-[#25262b]">{totalRevenue.toFixed(0)} {restaurant?.currency || "DZD"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e9ecef]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff3bf]">
                <Calendar className="h-5 w-5 text-[#fab005]" />
              </div>
              <div>
                <p className="text-sm text-[#868e96]">Panier moyen</p>
                <p className="text-xl font-bold text-[#25262b]">{avgOrderValue.toFixed(0)} {restaurant?.currency || "DZD"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "today", label: "Aujourd'hui" },
          { key: "week", label: "Cette semaine" },
          { key: "month", label: "Ce mois" },
          { key: "all", label: "Tout" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? "bg-[#22c55e] hover:bg-[#16a34a]" : ""}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="border-[#e9ecef]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-[#adb5bd]" />
            <h3 className="text-lg font-semibold text-[#25262b]">Aucune commande</h3>
            <p className="text-[#868e96]">
              {filter === "today"
                ? "Pas de commandes aujourd'hui."
                : filter === "week"
                ? "Pas de commandes cette semaine."
                : filter === "month"
                ? "Pas de commandes ce mois."
                : "Vous n'avez pas encore de commandes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#e9ecef]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f8f9fa] border-b border-[#e9ecef]">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm text-[#495057]">Date</th>
                    <th className="text-left p-4 font-medium text-sm text-[#495057]">Client</th>
                    <th className="text-left p-4 font-medium text-sm text-[#495057] hidden sm:table-cell">Téléphone</th>
                    <th className="text-left p-4 font-medium text-sm text-[#495057] hidden md:table-cell">Articles</th>
                    <th className="text-left p-4 font-medium text-sm text-[#495057]">Type</th>
                    <th className="text-right p-4 font-medium text-sm text-[#495057]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#e9ecef] last:border-0 hover:bg-[#f8f9fa]">
                      <td className="p-4 text-sm">
                        <div className="text-[#25262b]">{new Date(order.created_at).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs text-[#868e96]">{new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm text-[#25262b]">{order.customer_name}</div>
                        <div className="text-xs text-[#868e96] sm:hidden">{order.customer_phone}</div>
                        {order.delivery_address && (
                          <div className="flex items-center gap-1 text-xs text-[#868e96] mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{order.delivery_address}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm hidden sm:table-cell">
                        <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-[#868e96] hover:text-[#228be6]">
                          <Phone className="h-3 w-3" />
                          {order.customer_phone}
                        </a>
                      </td>
                      <td className="p-4 text-sm hidden md:table-cell">
                        <div className="max-w-[200px] text-[#868e96]">
                          {order.order_items?.map((item, idx) => (
                            <span key={item.id}>
                              {item.quantity}x {item.item_name}
                              {idx < (order.order_items?.length || 0) - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${order.order_type === 'delivery' ? 'bg-[#e7f5ff] text-[#228be6]' : 'bg-[#fff4e6] text-[#fd7e14]'}`}>
                          {order.order_type === 'delivery' ? 'Livraison' : 'À emporter'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-right text-[#25262b]">
                        {Number(order.total).toFixed(0)} {restaurant?.currency || "DZD"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
