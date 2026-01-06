"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Copy, ExternalLink, Instagram, Facebook, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSlug } from "@/lib/utils";
import type { Tables } from "@/types/database";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+213");
  const [currency, setCurrency] = useState("DZD");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    logo_url: "",
  });

  // Currency list with Algeria first
  const currencies = [
    { code: "DZD", name: "Dinar Algérien", symbol: "د.ج", flag: "🇩🇿" },
    { code: "MAD", name: "Dirham Marocain", symbol: "د.م.", flag: "🇲🇦" },
    { code: "TND", name: "Dinar Tunisien", symbol: "د.ت", flag: "🇹🇳" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "USD", name: "Dollar US", symbol: "$", flag: "🇺🇸" },
    { code: "GBP", name: "Livre Sterling", symbol: "£", flag: "🇬🇧" },
    { code: "SAR", name: "Riyal Saoudien", symbol: "ر.س", flag: "🇸🇦" },
    { code: "AED", name: "Dirham Émirati", symbol: "د.إ", flag: "🇦🇪" },
    { code: "QAR", name: "Riyal Qatari", symbol: "ر.ق", flag: "🇶🇦" },
    { code: "EGP", name: "Livre Égyptienne", symbol: "ج.م", flag: "🇪🇬" },
    { code: "CHF", name: "Franc Suisse", symbol: "CHF", flag: "🇨🇭" },
    { code: "CAD", name: "Dollar Canadien", symbol: "C$", flag: "🇨🇦" },
  ];

  // Country codes list with Algeria first
  const countryCodes = [
    { code: "+213", country: "Algérie", flag: "🇩🇿" },
    { code: "+212", country: "Maroc", flag: "🇲🇦" },
    { code: "+216", country: "Tunisie", flag: "🇹🇳" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+49", country: "Allemagne", flag: "🇩🇪" },
    { code: "+34", country: "Espagne", flag: "🇪🇸" },
    { code: "+39", country: "Italie", flag: "🇮🇹" },
    { code: "+32", country: "Belgique", flag: "🇧🇪" },
    { code: "+41", country: "Suisse", flag: "🇨🇭" },
    { code: "+966", country: "Arabie Saoudite", flag: "🇸🇦" },
    { code: "+971", country: "Émirats", flag: "🇦🇪" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+20", country: "Égypte", flag: "🇪🇬" },
  ];

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function loadRestaurant() {
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

      if (data) {
        setRestaurant(data);

        // Parse phone to extract country code
        let phoneNumber = data.phone || "";
        let detectedCountryCode = "+213"; // Default to Algeria

        if (phoneNumber.startsWith("+")) {
          // Find matching country code
          const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
          for (const cc of sortedCodes) {
            if (phoneNumber.startsWith(cc.code)) {
              detectedCountryCode = cc.code;
              phoneNumber = phoneNumber.slice(cc.code.length).trim();
              break;
            }
          }
        }

        setCountryCode(detectedCountryCode);
        setCurrency(data.currency || "DZD");
        setFormData({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          phone: phoneNumber,
          logo_url: data.logo_url || "",
        });
      }
      setIsLoading(false);
    }

    loadRestaurant();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your restaurant name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Combine country code with phone number
      const fullPhone = formData.phone ? `${countryCode}${formData.phone.replace(/^\s+/, "")}` : "";

      if (restaurant) {
        const { error } = await supabase
          .from("restaurants")
          .update({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            phone: fullPhone,
            logo_url: formData.logo_url,
            currency: currency,
          })
          .eq("id", restaurant.id);

        if (error) throw error;

        toast({
          title: "Profile updated",
          description: "Your restaurant profile has been updated.",
        });
      } else {
        const slug = generateSlug(formData.name);

        const { error } = await supabase.from("restaurants").insert({
          owner_id: user.id,
          name: formData.name,
          slug,
          description: formData.description,
          address: formData.address,
          phone: fullPhone,
          logo_url: formData.logo_url,
          currency: currency,
          is_active: true,
        });

        if (error) throw error;

        toast({
          title: "Restaurant created",
          description: "Your restaurant has been set up successfully!",
        });

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyStoreUrl = () => {
    if (restaurant?.slug) {
      const url = `${window.location.origin}/${restaurant.slug}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "URL copied",
        description: "Store URL has been copied to clipboard.",
      });
    }
  };

  const copyMarketingLink = (source: string) => {
    if (restaurant?.slug) {
      const url = `${window.location.origin}/${restaurant.slug}?src=${source}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(source);
      toast({
        title: "Lien copié!",
        description: `Lien ${source} copié dans le presse-papiers.`,
      });
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const marketingLinks = [
    { id: "instagram", name: "Instagram", icon: Instagram, bgColor: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" },
    { id: "tiktok", name: "TikTok", icon: Link2, bgColor: "#000000" },
    { id: "facebook", name: "Facebook", icon: Facebook, bgColor: "#1877f2" },
  ];

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

  const buttonStyle: React.CSSProperties = {
    height: "36px",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "white",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#7950f2",
    color: "white",
    border: "none",
    padding: "0 20px",
    height: "38px",
    fontSize: "13px",
    fontWeight: 600,
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
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Profil du restaurant</h1>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>Gérez les informations de votre restaurant</p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Store URL */}
          {restaurant?.slug && (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>URL de votre magasin</h3>
              </div>
              <div style={cardContentStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="text"
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/${restaurant.slug}`}
                    readOnly
                    style={{ ...inputStyle, flex: 1, backgroundColor: "#f9fafb" }}
                  />
                  <button type="button" onClick={copyStoreUrl} style={{ ...buttonStyle, width: "36px", padding: 0 }}>
                    <Copy style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                  </button>
                  <a href={`/${restaurant.slug}`} target="_blank" rel="noopener noreferrer">
                    <button type="button" style={{ ...buttonStyle, width: "36px", padding: 0 }}>
                      <ExternalLink style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Marketing Links */}
          {restaurant?.slug && (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>Liens Marketing</h3>
                <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0 0" }}>
                  Utilisez ces liens dans vos réseaux sociaux pour suivre d&apos;où viennent vos commandes
                </p>
              </div>
              <div style={cardContentStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {marketingLinks.map((link) => {
                    const Icon = link.icon;
                    const isCopied = copiedLink === link.id;
                    const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${restaurant.slug}?src=${link.id}`;

                    return (
                      <div
                        key={link.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          backgroundColor: "white",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: link.bgColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon style={{ width: "16px", height: "16px", color: "white" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: 0 }}>{link.name}</p>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "11px", color: "#6b7280", margin: "1px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textDecoration: "none" }}
                          >
                            {fullUrl}
                          </a>
                        </div>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            ...buttonStyle,
                            flexShrink: 0,
                            height: "32px",
                            width: "32px",
                            padding: 0,
                            textDecoration: "none",
                          }}
                          title="Ouvrir le lien"
                        >
                          <ExternalLink style={{ width: "14px", height: "14px", color: "#6b7280" }} />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyMarketingLink(link.id)}
                          style={{
                            ...buttonStyle,
                            flexShrink: 0,
                            height: "32px",
                            padding: "0 10px",
                            fontSize: "12px",
                            backgroundColor: isCopied ? "#7950f2" : "white",
                            color: isCopied ? "white" : "#374151",
                            borderColor: isCopied ? "#7950f2" : "#d1d5db",
                          }}
                        >
                          {isCopied ? <Check style={{ width: "14px", height: "14px" }} /> : <Copy style={{ width: "14px", height: "14px" }} />}
                          {isCopied ? "Copié!" : "Copier"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "10px" }}>
                  Collez ces liens dans votre bio Instagram, TikTok ou Facebook pour suivre les performances.
                </p>
              </div>
            </div>
          )}

          {/* Logo Upload */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Logo du restaurant</h3>
            </div>
            <div style={cardContentStyle}>
              <ImageUpload
                value={formData.logo_url}
                onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url || "" }))}
                folder="logos"
                className="max-w-[160px]"
                aspectRatio="square"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Informations de base</h3>
            </div>
            <div style={cardContentStyle}>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Nom du restaurant *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Entrez le nom de votre restaurant"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre restaurant"
                  style={{
                    ...inputStyle,
                    height: "80px",
                    padding: "8px 10px",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Coordonnées</h3>
            </div>
            <div style={cardContentStyle}>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Entrez l'adresse de votre restaurant"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Numéro de téléphone</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{
                      ...inputStyle,
                      width: "140px",
                      flexShrink: 0,
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      paddingRight: "28px",
                    }}
                  >
                    {countryCodes.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/[^\d\s]/g, "") }))}
                    placeholder="555 123 456"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </div>
              <div style={{ marginTop: "12px" }}>
                <label style={labelStyle}>Devise</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: "100%",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    paddingRight: "28px",
                  }}
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={isSaving} style={{ ...primaryButtonStyle, opacity: isSaving ? 0.7 : 1 }}>
              {isSaving && <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />}
              {restaurant ? "Enregistrer" : "Créer le restaurant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
