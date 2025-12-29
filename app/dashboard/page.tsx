import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ShoppingBag,
  ArrowRight,
  Store,
  Eye,
  Plus,
  Calendar,
  Share2,
} from "lucide-react";
import "./dashboard.css";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has a restaurant
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  // If no restaurant, show onboarding
  if (!restaurant) {
    return (
      <div style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        minHeight: "100%"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "32px",
          maxWidth: "340px",
          textAlign: "center"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#f0fdf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <Store style={{ width: "24px", height: "24px", color: "#22c55e" }} />
          </div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
            Configurer votre restaurant
          </h2>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", lineHeight: 1.5 }}>
            Créez votre profil restaurant pour commencer à accepter les commandes en ligne.
          </p>
          <Link href="/dashboard/profile" style={{ textDecoration: "none" }}>
            <button style={{
              backgroundColor: "#111827",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              Commencer
              <ArrowRight style={{ width: "14px", height: "14px" }} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Prepare date filters
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all queries in PARALLEL for faster loading
  const [
    { count: todayOrdersCount },
    { data: todayOrders },
    { data: recentOrders },
    { count: totalOrders30Days },
    { data: orders30Days },
  ] = await Promise.all([
    // Today's orders count
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", today.toISOString()),
    // Today's revenue
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", today.toISOString())
      .in("status", ["confirmed", "preparing", "ready", "delivered"]),
    // Recent orders (last 5)
    supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // 30 days orders count
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    // 30 days revenue
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .in("status", ["confirmed", "preparing", "ready", "delivered"]),
  ]);

  const todayRevenue =
    todayOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const revenue30Days =
    orders30Days?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

  // Format dates for display
  const startDate = thirtyDaysAgo.toLocaleDateString("fr-FR", { month: "long", day: "numeric", year: "numeric" });
  const endDate = new Date().toLocaleDateString("fr-FR", { month: "long", day: "numeric", year: "numeric" });

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  };

  const cardContentStyle: React.CSSProperties = {
    padding: "16px",
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header with restaurant name and share button */}
        <div className="dashboard-header" style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>
            {restaurant.name}
          </h1>
          <Link href={`/${restaurant.slug}`} target="_blank" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}>
              <Share2 style={{ width: "14px", height: "14px" }} />
              Partager
            </button>
          </Link>
        </div>

        {/* Main Grid Layout - responsive */}
        <div className="dashboard-grid" style={{ display: "grid", gap: "16px" }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Date Range & Stats Card */}
            <div style={cardStyle}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#9ca3af",
                  fontSize: "13px"
                }}>
                  <Calendar style={{ width: "14px", height: "14px" }} />
                  <span>{startDate} – {endDate}</span>
                </div>
              </div>
              <div className="dashboard-stats" style={{ padding: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Points de vue</p>
                  <p style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>0</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Commandes</p>
                  <p style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>{totalOrders30Days || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>Vente</p>
                  <p style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>DZD {revenue30Days.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Orders Chart Card */}
            <div style={cardStyle}>
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Commandes</h3>
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>Derniers 30 jours</span>
                </div>
                <button style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}>
                  <Plus style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                </button>
              </div>
              <div style={{ padding: "16px" }}>
                {/* Simple chart placeholder - shows empty state or bars */}
                <div className="chart-bars" style={{
                  height: "80px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #f3f4f6"
                }}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: "#e5e7eb",
                        borderRadius: "2px",
                        height: "6px",
                        minHeight: "4px"
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Card */}
            <div style={cardStyle}>
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Commandes récentes</h3>
                <Link href="/dashboard/orders" style={{ textDecoration: "none" }}>
                  <button style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    backgroundColor: "transparent",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#6b7280",
                    cursor: "pointer"
                  }}>
                    Voir tout
                    <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </button>
                </Link>
              </div>
              <div style={{ padding: "0" }}>
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="order-item"
                      style={{
                        borderBottom: index < recentOrders.length - 1 ? "1px solid #f3f4f6" : "none"
                      }}
                    >
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: 0 }}>
                          {order.customer_name}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0" }}>
                          {new Date(order.created_at).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div className="order-item-right">
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                          DZD {Number(order.total).toFixed(2)}
                        </span>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 500,
                          backgroundColor:
                            order.status === "pending" ? "#fef3c7" :
                            order.status === "confirmed" ? "#dbeafe" :
                            order.status === "preparing" ? "#f3e8ff" :
                            order.status === "ready" ? "#dcfce7" :
                            order.status === "delivered" ? "#f3f4f6" : "#fee2e2",
                          color:
                            order.status === "pending" ? "#92400e" :
                            order.status === "confirmed" ? "#1e40af" :
                            order.status === "preparing" ? "#7c3aed" :
                            order.status === "ready" ? "#166534" :
                            order.status === "delivered" ? "#374151" : "#991b1b"
                        }}>
                          {order.status === "pending" ? "En attente" :
                           order.status === "confirmed" ? "Confirmée" :
                           order.status === "preparing" ? "En préparation" :
                           order.status === "ready" ? "Prête" :
                           order.status === "delivered" ? "Livrée" : "Annulée"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <ShoppingBag style={{ width: "36px", height: "36px", color: "#e5e7eb", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                      Aucune commande pour le moment
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Quick Actions Card */}
            <div style={cardStyle}>
              <div style={{ padding: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <Link href="/dashboard/profile" className="no-underline hover:bg-[#f9fafb] rounded-lg transition-colors">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          backgroundColor: "#f0fdf4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Store style={{ width: "10px", height: "10px", color: "#22c55e" }} />
                        </div>
                        <span style={{ fontSize: "13px", color: "#374151" }}>Changer le logo</span>
                      </div>
                      <ArrowRight style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
                    </div>
                  </Link>

                  <Link href="/dashboard/menu" className="no-underline hover:bg-[#f9fafb] rounded-lg transition-colors">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          backgroundColor: "#fef3c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <ShoppingBag style={{ width: "10px", height: "10px", color: "#f59e0b" }} />
                        </div>
                        <span style={{ fontSize: "13px", color: "#374151" }}>Ajouter des produits</span>
                      </div>
                      <ArrowRight style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
                    </div>
                  </Link>

                  <Link href="/dashboard/orders" className="no-underline hover:bg-[#f9fafb] rounded-lg transition-colors">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          backgroundColor: "#dbeafe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Eye style={{ width: "10px", height: "10px", color: "#3b82f6" }} />
                        </div>
                        <span style={{ fontSize: "13px", color: "#374151" }}>Voir les commandes</span>
                      </div>
                      <ArrowRight style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
                    </div>
                  </Link>

                  <Link href="/dashboard/settings" className="no-underline hover:bg-[#f9fafb] rounded-lg transition-colors">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          backgroundColor: "#f3e8ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Store style={{ width: "10px", height: "10px", color: "#8b5cf6" }} />
                        </div>
                        <span style={{ fontSize: "13px", color: "#374151" }}>Paramètres</span>
                      </div>
                      <ArrowRight style={{ width: "14px", height: "14px", color: "#9ca3af" }} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Promo Card */}
            <div style={{
              ...cardStyle,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0"
            }}>
              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "5px",
                    backgroundColor: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Store style={{ width: "12px", height: "12px", color: "white" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#166534", margin: "0 0 3px 0" }}>
                      Boostez vos ventes
                    </h4>
                    <p style={{ fontSize: "12px", color: "#15803d", margin: 0, lineHeight: 1.4 }}>
                      Partagez votre lien sur les réseaux sociaux pour attirer plus de clients.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/profile" style={{ textDecoration: "none" }}>
                  <button style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}>
                    Obtenir les liens marketing
                  </button>
                </Link>
              </div>
            </div>

            {/* Store Status Card */}
            <div style={cardStyle}>
              <div style={{ padding: "14px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280", margin: "0 0 6px 0" }}>
                  Statut du magasin
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: restaurant.is_active ? "#22c55e" : "#ef4444"
                  }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {restaurant.is_active ? "Ouvert" : "Fermé"}
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0" }}>
                  {restaurant.is_active ? "Accepte les commandes" : "N'accepte pas les commandes"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
