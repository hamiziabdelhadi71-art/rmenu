"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Store Settings"
        description="Configure your store preferences"
      />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          {/* Store Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Accept Orders</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active
                      ? "Your store is currently accepting orders"
                      : "Your store is currently closed"}
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_order">Minimum Order Amount ($)</Label>
                <Input
                  id="minimum_order"
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
                />
                <p className="text-xs text-muted-foreground">
                  Customers must order at least this amount for delivery
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
                <Input
                  id="delivery_fee"
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
                />
                <p className="text-xs text-muted-foreground">
                  Fee charged for delivery orders
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
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
                />
                <p className="text-xs text-muted-foreground">
                  Tax percentage applied to orders (e.g., 10 for 10%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} size="lg">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
