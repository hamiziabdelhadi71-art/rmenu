"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Store, Receipt, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/types/database";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [formData, setFormData] = useState({
    minimum_order: "0",
    tax_rate: "0",
    delivery_fee: "0",
    is_active: true,
  });

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

      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!data) {
        router.push("/dashboard/profile");
        return;
      }

      setRestaurant(data);
      setFormData({
        minimum_order: data.minimum_order?.toString() || "0",
        tax_rate: data.tax_rate?.toString() || "0",
        delivery_fee: data.delivery_fee?.toString() || "0",
        is_active: data.is_active,
      });
      setIsLoading(false);
    }

    loadData();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          minimum_order: parseFloat(formData.minimum_order) || 0,
          tax_rate: parseFloat(formData.tax_rate) || 0,
          delivery_fee: parseFloat(formData.delivery_fee) || 0,
          is_active: formData.is_active,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your store settings have been updated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginBottom: "16px",
    width: "100%",
    boxSizing: "border-box",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "12px 16px 0 16px",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const cardContentStyle: React.CSSProperties = {
    padding: "12px 16px 16px 16px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "36px",
    padding: "0 10px",
    fontSize: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px",
  };

  const helpTextStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "4px",
  };

  const primaryButtonStyle: React.CSSProperties = {
    height: "38px",
    padding: "0 20px",
    fontSize: "13px",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#7950f2",
    color: "white",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  const iconStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    color: "#7950f2",
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "#7950f2", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      minHeight: "100%",
      padding: "16px",
      boxSizing: "border-box",
      display: "flex",
      justifyContent: "center"
    }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* Page Title */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Paramètres</h1>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>Configurez les préférences de votre magasin</p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Store Status */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>
                <Store style={iconStyle} />
                Statut du magasin
              </h3>
            </div>
            <div style={cardContentStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "6px",
                  backgroundColor: formData.is_active ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${formData.is_active ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: 0 }}>Accepter les commandes</p>
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                    {formData.is_active
                      ? "Votre magasin accepte les commandes"
                      : "Votre magasin est fermé"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: !prev.is_active,
                    }))
                  }
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: formData.is_active ? "#7950f2" : "#d1d5db",
                    transition: "background-color 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: formData.is_active ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "10px",
                      backgroundColor: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Order Settings */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>
                <Receipt style={iconStyle} />
                Paramètres de commande
              </h3>
            </div>
            <div style={cardContentStyle}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Montant minimum de commande (DZD)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: "13px" }}>DZD</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimum_order}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          minimum_order: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      style={{ ...inputStyle, paddingLeft: "40px" }}
                    />
                  </div>
                  <p style={helpTextStyle}>
                    Les clients doivent commander au moins ce montant
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Frais de livraison (DZD)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: "13px" }}>DZD</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.delivery_fee}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          delivery_fee: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      style={{ ...inputStyle, paddingLeft: "40px" }}
                    />
                  </div>
                  <p style={helpTextStyle}>
                    Frais facturés pour les commandes de livraison
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>
                <Percent style={iconStyle} />
                Paramètres de taxe
              </h3>
            </div>
            <div style={cardContentStyle}>
              <div>
                <label style={labelStyle}>Taux de taxe (%)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tax_rate: e.target.value,
                      }))
                    }
                    placeholder="0"
                    style={{ ...inputStyle, paddingRight: "30px" }}
                  />
                  <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: "13px" }}>%</span>
                </div>
                <p style={helpTextStyle}>
                  Pourcentage de taxe appliqué aux commandes (ex: 10 pour 10%)
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{ ...primaryButtonStyle, opacity: isSaving ? 0.7 : 1, cursor: isSaving ? "not-allowed" : "pointer" }}
            >
              {isSaving && <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
