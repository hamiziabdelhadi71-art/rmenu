"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, MapPin, Package, MessageCircle, User, Phone, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
  });

  const { items, restaurantId, getSubtotal, getSource, clearCart } = useCartStore();
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
  const deliveryFee = orderType === "delivery" && restaurant ? Number(restaurant.delivery_fee) : 0;
  const total = subtotal + taxAmount + deliveryFee;
  const primaryColor = restaurant?.theme_primary_color || "#e85d04";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurant || !restaurantId) {
      toast({ title: "Error", description: "Restaurant information not available.", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Cart is empty", description: "Please add items to your cart.", variant: "destructive" });
      return;
    }

    if (orderType === "delivery" && restaurant.minimum_order && subtotal < Number(restaurant.minimum_order)) {
      toast({ title: "Minimum order not met", description: `Minimum order is ${restaurant.currency || "DZD"} ${Number(restaurant.minimum_order).toFixed(2)}`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData: OrderInsert = {
        restaurant_id: restaurantId,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: null,
        order_type: orderType,
        delivery_address: orderType === "delivery" ? formData.deliveryAddress : null,
        delivery_notes: null,
        status: "pending",
        subtotal, tax_amount: taxAmount, delivery_fee: deliveryFee, total,
        notes: null,
        source: getSource(),
      };

      const { data: orderResult, error: orderError } = await supabase
        .from("orders").insert(orderData as never).select().single();

      if (orderError || !orderResult) throw orderError;

      const order = orderResult as unknown as Order;

      const orderItems: OrderItemInsert[] = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: (item.price + (item.selectedModifiers?.reduce((sum, mod) => sum + mod.priceAdjustment, 0) || 0)) * item.quantity,
        selected_modifiers: item.selectedModifiers || [],
        notes: item.notes || null,
      }));

      await supabase.from("order_items").insert(orderItems as never[]);

      if (restaurant.phone) {
        const orderItemsList = items.map((item) => {
          let itemText = `• ${item.quantity}x ${item.name}`;
          if (item.selectedModifiers?.length) itemText += ` (${item.selectedModifiers.map((m) => m.modifierName).join(", ")})`;
          if (item.notes) itemText += ` - Note: ${item.notes}`;
          return itemText;
        }).join("\n");

        const whatsappMessage = `🆕 *New Order #${order.id.slice(-6).toUpperCase()}*

📋 *Order Details:*
${orderItemsList}

💰 *Total: ${restaurant.currency || "DZD"} ${total.toFixed(2)}*

👤 *Customer:* ${formData.customerName}
📞 *Phone:* ${formData.customerPhone}
📦 *Type:* ${orderType === "delivery" ? "Delivery" : "Pickup"}${orderType === "delivery" && formData.deliveryAddress ? `\n📍 *Address:* ${formData.deliveryAddress}` : ""}`;

        const cleanPhone = restaurant.phone.replace(/[\s\-\(\)]/g, "");
        clearCart();
        window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
      } else {
        clearCart();
        router.push(`/${slug}/order/${order.id}`);
      }
    } catch (error) {
      console.error("Order error:", error);
      toast({ title: "Order failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: primaryColor }} />
      </div>
    );
  }

  if (!restaurant || items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#fff" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>{!restaurant ? "Restaurant Not Found" : "Your Cart is Empty"}</h1>
        <Link href={restaurant ? `/${slug}` : "/"} style={{ padding: "12px 24px", background: primaryColor, color: "white", borderRadius: 12, textDecoration: "none", fontWeight: 600 }}>
          {restaurant ? "Back to Menu" : "Go Home"}
        </Link>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input { font-family: inherit; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 100 }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/${slug}`} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#f5f5f5", color: "#333", textDecoration: "none" }}>
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Checkout</h1>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: "16px" }}>
          {/* Order Type Toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["delivery", "pickup"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type as "delivery" | "pickup")}
                style={{
                  flex: 1, padding: "14px 12px", border: `2px solid ${orderType === type ? primaryColor : "#e5e5e5"}`,
                  borderRadius: 12, background: orderType === type ? `${primaryColor}10` : "#fff",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s"
                }}
              >
                {type === "delivery" ? <MapPin style={{ width: 18, height: 18, color: orderType === type ? primaryColor : "#888" }} /> : <Package style={{ width: 18, height: 18, color: orderType === type ? primaryColor : "#888" }} />}
                <span style={{ fontSize: 14, fontWeight: 600, color: orderType === type ? primaryColor : "#333" }}>
                  {type === "delivery" ? `Delivery (${restaurant.currency || "DZD"} ${Number(restaurant.delivery_fee).toFixed(2)})` : "Pickup (Free)"}
                </span>
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Name */}
            <div style={{ position: "relative" }}>
              <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#aaa" }} />
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder="Your name"
                required
                style={{ width: "100%", height: 48, paddingLeft: 42, paddingRight: 12, fontSize: 15, border: "2px solid #e5e5e5", borderRadius: 12, background: "#fafafa", outline: "none" }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = "#e5e5e5"}
              />
            </div>

            {/* Phone */}
            <div style={{ position: "relative" }}>
              <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#aaa" }} />
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="Phone number"
                required
                style={{ width: "100%", height: 48, paddingLeft: 42, paddingRight: 12, fontSize: 15, border: "2px solid #e5e5e5", borderRadius: 12, background: "#fafafa", outline: "none" }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = "#e5e5e5"}
              />
            </div>

            {/* Address - only for delivery */}
            {orderType === "delivery" && (
              <div style={{ position: "relative" }}>
                <MapPin style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#aaa" }} />
                <input
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                  placeholder="Delivery address"
                  required
                  style={{ width: "100%", height: 48, paddingLeft: 42, paddingRight: 12, fontSize: 15, border: "2px solid #e5e5e5", borderRadius: 12, background: "#fafafa", outline: "none" }}
                  onFocus={(e) => e.target.style.borderColor = primaryColor}
                  onBlur={(e) => e.target.style.borderColor = "#e5e5e5"}
                />
              </div>
            )}
          </div>

          {/* Order Summary - Collapsible */}
          <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setShowOrderDetails(!showOrderDetails)}
              style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
                {items.length} item{items.length > 1 ? "s" : ""} • {restaurant?.currency || "DZD"} {subtotal.toFixed(2)}
              </span>
              {showOrderDetails ? <ChevronUp style={{ width: 18, height: 18, color: "#888" }} /> : <ChevronDown style={{ width: 18, height: 18, color: "#888" }} />}
            </button>

            {showOrderDetails && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #eee" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>{restaurant?.currency || "DZD"} {((item.price + (item.selectedModifiers?.reduce((sum, mod) => sum + mod.priceAdjustment, 0) || 0)) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {taxAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginTop: 8, paddingTop: 8, borderTop: "1px dashed #eee" }}>
                    <span>Tax</span><span>{restaurant?.currency || "DZD"} {taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {orderType === "delivery" && deliveryFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888" }}>
                    <span>Delivery</span><span>{restaurant?.currency || "DZD"} {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>💵</span>
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>Cash on Delivery</span>
          </div>
        </form>

        {/* Fixed Bottom Button */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 20px", background: "#fff", borderTop: "1px solid #eee", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <button
            type="submit"
            form="checkout-form"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              width: "100%", height: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: isSubmitting ? "#ccc" : "#25D366", color: "white", border: "none", borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)", transition: "all 0.2s"
            }}
          >
            {isSubmitting ? (
              <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
            ) : (
              <MessageCircle style={{ width: 22, height: 22 }} />
            )}
            {isSubmitting ? "Processing..." : `Place Order • ${restaurant?.currency || "DZD"} ${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </>
  );
}
