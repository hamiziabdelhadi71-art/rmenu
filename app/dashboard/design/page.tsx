"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  Smartphone,
  Monitor,
  Eye,
  Palette,
  Type,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
  Settings2,
  ArrowLeft,
  LayoutTemplate,
  Cake,
  Utensils,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/types/database";
import { cn } from "@/lib/utils";

type Restaurant = Tables<"restaurants">;

const colorPresets = [
  { name: "Purple", value: "#7950f2" },
  { name: "Blue", value: "#228be6" },
  { name: "Green", value: "#40c057" },
  { name: "Red", value: "#fa5252" },
  { name: "Orange", value: "#fd7e14" },
  { name: "Teal", value: "#20c997" },
  { name: "Pink", value: "#e64980" },
  { name: "Dark", value: "#25262b" },
];

const templates = [
  {
    id: "appetite",
    name: "Appetite",
    description: "Modern & sleek design for restaurants",
    icon: Utensils,
    colors: {
      primary: "#e85d04",
      bg: "#f8f8f8",
      card: "#ffffff",
      accent: "#111111",
    },
    features: ["Hero gradient", "Sticky navigation", "Modern cards"],
  },
  {
    id: "sweet",
    name: "Sweet",
    description: "Warm & cozy for bakeries & pastry shops",
    icon: Cake,
    colors: {
      primary: "#D4A574",
      bg: "#FDF8F3",
      card: "#FFFBF7",
      accent: "#8B6F47",
    },
    features: ["Soft colors", "Rounded shapes", "Playful animations"],
  },
];

export default function DesignPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileView, setMobileView] = useState<"settings" | "preview">("settings");

  const [design, setDesign] = useState({
    primaryColor: "#7950f2",
    logoUrl: "",
    name: "",
    description: "",
    address: "",
    phone: "",
    templateName: "appetite",
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
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

      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (restaurantData) {
        setRestaurant(restaurantData);
        setDesign({
          primaryColor: restaurantData.theme_primary_color || "#7950f2",
          logoUrl: restaurantData.logo_url || "",
          name: restaurantData.name || "",
          description: restaurantData.description || "",
          address: restaurantData.address || "",
          phone: restaurantData.phone || "",
          templateName: restaurantData.template_name || "appetite",
        });
      }
      setIsLoading(false);
    }

    loadData();
  }, [supabase, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("restaurant-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("restaurant-logos").getPublicUrl(fileName);

      setDesign((prev) => ({ ...prev, logoUrl: publicUrl }));

      toast({
        title: "Image uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurant) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          theme_primary_color: design.primaryColor,
          logo_url: design.logoUrl,
          name: design.name,
          description: design.description,
          address: design.address,
          phone: design.phone,
          template_name: design.templateName,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      toast({
        title: "Design saved",
        description: "Your storefront design has been updated.",
      });

      // Refresh the preview iframe
      setPreviewKey((prev) => prev + 1);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: "Failed to save design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please create a restaurant first.</p>
        <Button onClick={() => router.push("/dashboard/profile")}>Go to Profile</Button>
      </div>
    );
  }

  // Ensure we have a valid slug for the preview
  const previewUrl = restaurant.slug ? `/${restaurant.slug}` : null;

  // Design Panel Content (reused for both mobile and desktop)
  const DesignPanelContent = () => (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[#868e96]" />
          <Label className="text-sm font-medium text-[#25262b]">Logo</Label>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#e9ecef] bg-[#f8f9fa]">
            {design.logoUrl ? (
              <img
                src={design.logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: design.primaryColor }}
              >
                {design.name?.charAt(0) || "R"}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="logo" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#e9ecef] bg-white px-3 py-1.5 text-sm font-medium text-[#25262b] transition-colors hover:bg-[#f8f9fa]">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
              </div>
            </Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>

      {/* Store Name */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Type className="h-4 w-4 text-[#868e96]" />
          <Label className="text-sm font-medium text-[#25262b]">Nom du magasin</Label>
        </div>
        <Input
          value={design.name}
          onChange={(e) => setDesign((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Nom de votre restaurant"
          className="border-[#e9ecef]"
        />
      </div>

      {/* Description */}
      <div>
        <Label className="mb-2 block text-sm font-medium text-[#25262b]">Description</Label>
        <textarea
          value={design.description}
          onChange={(e) => setDesign((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez votre restaurant"
          className="flex min-h-[80px] w-full rounded-md border border-[#e9ecef] bg-white px-3 py-2 text-sm placeholder:text-[#adb5bd] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7950f2]"
        />
      </div>

      {/* Address */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#868e96]" />
          <Label className="text-sm font-medium text-[#25262b]">Adresse</Label>
        </div>
        <Input
          value={design.address}
          onChange={(e) => setDesign((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Adresse du restaurant"
          className="border-[#e9ecef]"
        />
      </div>

      {/* Phone */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#868e96]" />
          <Label className="text-sm font-medium text-[#25262b]">Téléphone</Label>
        </div>
        <Input
          value={design.phone}
          onChange={(e) => setDesign((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="Numéro de téléphone"
          className="border-[#e9ecef]"
        />
      </div>

      {/* Template Selection */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-[#868e96]" />
          <Label className="text-sm font-medium text-[#25262b]">Template</Label>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => {
            const isSelected = design.templateName === template.id;
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setDesign((prev) => ({ ...prev, templateName: template.id }))}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all",
                  isSelected
                    ? "border-[#25262b] bg-white shadow-md"
                    : "border-[#e9ecef] bg-white hover:border-[#ced4da] hover:shadow-sm"
                )}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#25262b]">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}

                {/* Template Preview */}
                <div
                  className="mb-3 h-20 rounded-lg overflow-hidden"
                  style={{ background: template.colors.bg }}
                >
                  {/* Mini preview of template */}
                  <div className="h-full flex flex-col">
                    {/* Header bar */}
                    <div
                      className="h-6 flex items-center px-2"
                      style={{ background: template.colors.primary }}
                    >
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      </div>
                    </div>
                    {/* Content preview */}
                    <div className="flex-1 p-1.5 flex gap-1">
                      <div
                        className="w-8 h-full rounded"
                        style={{ background: template.colors.card }}
                      />
                      <div
                        className="w-8 h-full rounded"
                        style={{ background: template.colors.card }}
                      />
                      <div
                        className="w-8 h-full rounded"
                        style={{ background: template.colors.card }}
                      />
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="flex items-start gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${template.colors.primary}20`, color: template.colors.primary }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#25262b] text-sm">{template.name}</span>
                    </div>
                    <p className="text-xs text-[#868e96] leading-tight mt-0.5">
                      {template.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Color */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-[#868e96]" />
          <Label className="text-sm font-medium text-[#25262b]">Couleur principale</Label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {colorPresets.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setDesign((prev) => ({ ...prev, primaryColor: color.value }))}
              className={cn(
                "h-10 w-full rounded-md border-2 transition-all",
                design.primaryColor === color.value
                  ? "border-[#25262b] scale-105"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="color"
            value={design.primaryColor}
            onChange={(e) => setDesign((prev) => ({ ...prev, primaryColor: e.target.value }))}
            className="h-10 w-14 cursor-pointer p-1"
          />
          <Input
            value={design.primaryColor}
            onChange={(e) => setDesign((prev) => ({ ...prev, primaryColor: e.target.value }))}
            placeholder="#7950f2"
            className="flex-1 border-[#e9ecef]"
          />
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
        style={{ backgroundColor: design.primaryColor }}
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>

      {/* Preview Link */}
      {restaurant.slug && (
        <a
          href={`/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[#e9ecef] px-4 py-2 text-sm font-medium text-[#495057] transition-colors hover:bg-[#f8f9fa]"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir dans un nouvel onglet
        </a>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Mobile Toggle Header */}
      <div className="flex items-center justify-between border-b border-[#e9ecef] bg-white p-4 lg:hidden">
        <h1 className="text-lg font-semibold text-[#25262b]">Site web (Design)</h1>
        <div className="flex items-center gap-1 rounded-lg bg-[#f8f9fa] p-1">
          <button
            type="button"
            onClick={() => setMobileView("settings")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              mobileView === "settings"
                ? "bg-white text-[#25262b] shadow-sm"
                : "text-[#868e96]"
            )}
          >
            <Settings2 className="h-4 w-4" />
            Paramètres
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              mobileView === "preview"
                ? "bg-white text-[#25262b] shadow-sm"
                : "text-[#868e96]"
            )}
          >
            <Eye className="h-4 w-4" />
            Aperçu
          </button>
        </div>
      </div>

      {/* Mobile Settings Panel */}
      <div className={cn(
        "flex-1 overflow-auto bg-white p-4 lg:hidden",
        mobileView === "settings" ? "block" : "hidden"
      )}>
        <DesignPanelContent />
      </div>

      {/* Mobile Preview Panel */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#f1f3f4] lg:hidden",
        mobileView === "preview" ? "flex" : "hidden"
      )}>
        {/* Preview Controls */}
        <div className="flex items-center justify-between border-b border-[#e9ecef] bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#868e96]" />
            <span className="text-sm font-medium text-[#25262b]">Aperçu</span>
          </div>
          <button
            type="button"
            onClick={refreshPreview}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#868e96] transition-colors hover:bg-[#f8f9fa] hover:text-[#25262b]"
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Full width iframe for mobile */}
        <div className="flex-1 overflow-hidden">
          {previewUrl ? (
            <iframe
              key={previewKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Storefront Preview"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#f8f9fa]">
              <p className="text-[#868e96]">Configurez votre slug pour voir l&apos;aperçu</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Design Panel */}
      <div className="hidden lg:block w-80 shrink-0 overflow-auto border-r border-[#e9ecef] bg-white p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#25262b]">Site web (Design)</h1>
          <p className="text-sm text-[#868e96]">Personnalisez votre vitrine</p>
        </div>
        <DesignPanelContent />
      </div>

      {/* Desktop Layout - Preview Panel */}
      <div className="hidden lg:flex flex-1 flex-col bg-[#f1f3f4]">
        {/* Preview Controls */}
        <div className="flex items-center justify-between border-b border-[#e9ecef] bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#868e96]" />
            <span className="text-sm font-medium text-[#25262b]">Aperçu en direct</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshPreview}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#868e96] transition-colors hover:bg-[#f8f9fa] hover:text-[#25262b]"
              title="Refresh preview"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 rounded-lg bg-[#f8f9fa] p-1">
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  previewMode === "mobile"
                    ? "bg-white text-[#25262b] shadow-sm"
                    : "text-[#868e96] hover:text-[#25262b]"
                )}
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  previewMode === "desktop"
                    ? "bg-white text-[#25262b] shadow-sm"
                    : "text-[#868e96] hover:text-[#25262b]"
                )}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content with iframe */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-8">
          <div
            className={cn(
              "overflow-hidden bg-white shadow-2xl transition-all duration-300",
              previewMode === "mobile"
                ? "w-[375px] rounded-[40px] border-[8px] border-[#1a1a1a]"
                : "w-full max-w-5xl rounded-lg border border-gray-200"
            )}
            style={
              previewMode === "mobile"
                ? { height: "750px" }
                : { height: "calc(100vh - 200px)", minHeight: "600px" }
            }
          >
            {/* Mobile notch */}
            {previewMode === "mobile" && (
              <div className="relative h-7 bg-[#1a1a1a]">
                <div className="absolute left-1/2 top-1 h-5 w-32 -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
              </div>
            )}

            {/* iframe or placeholder */}
            {previewUrl ? (
              <iframe
                ref={iframeRef}
                key={previewKey}
                src={previewUrl}
                className={cn(
                  "w-full bg-white",
                  previewMode === "mobile" ? "h-[calc(100%-28px)]" : "h-full"
                )}
                title="Storefront Preview"
              />
            ) : (
              <div className={cn(
                "w-full flex items-center justify-center bg-[#f8f9fa]",
                previewMode === "mobile" ? "h-[calc(100%-28px)]" : "h-full"
              )}>
                <p className="text-[#868e96] text-center px-4">Configurez votre slug dans le profil pour voir l&apos;aperçu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
