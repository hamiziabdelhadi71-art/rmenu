"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ImageIcon,
  X,
  SlidersHorizontal,
  Settings2,
  UtensilsCrossed,
  Check,
  Package,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type ModifierGroup = Tables<"modifier_groups">;
type Modifier = Tables<"modifiers">;
type MenuItemModifierGroup = Tables<"menu_item_modifier_groups">;

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<"products" | "options">("products");
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [itemModifierLinks, setItemModifierLinks] = useState<MenuItemModifierGroup[]>([]);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedModifierGroups, setSelectedModifierGroups] = useState<string[]>([]);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    base_price: "",
    image_url: "",
  });
  const [itemSizes, setItemSizes] = useState<{ name: string; price: string }[]>([]);
  const [savingItem, setSavingItem] = useState(false);

  // Group form state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    selection_type: "single" as "single" | "multiple",
    is_required: false,
    min_select: 0,
    max_select: 1,
  });
  const [savingGroup, setSavingGroup] = useState(false);

  // Modifier form state
  const [showModifierForm, setShowModifierForm] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [modifierForm, setModifierForm] = useState({
    name: "",
    price_adjustment: "",
  });
  const [savingModifier, setSavingModifier] = useState(false);

  // Enhanced UI state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [inlineEditingModifier, setInlineEditingModifier] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState("");

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

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

    if (!restaurantData) {
      router.push("/dashboard/profile");
      return;
    }

    setRestaurant(restaurantData);

    // Load categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .order("display_order", { ascending: true });

    setCategories(categoriesData || []);

    // Load menu items
    const { data: itemsData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .order("display_order", { ascending: true });

    setMenuItems(itemsData || []);

    // Load modifier groups
    const { data: groupsData } = await supabase
      .from("modifier_groups")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .order("created_at", { ascending: true });

    setModifierGroups(groupsData || []);

    // Load modifiers
    if (groupsData && groupsData.length > 0) {
      const groupIds = groupsData.map((g) => g.id);
      const { data: modifiersData } = await supabase
        .from("modifiers")
        .select("*")
        .in("group_id", groupIds)
        .order("display_order", { ascending: true });

      setModifiers(modifiersData || []);
    }

    // Load item-modifier links
    if (itemsData && itemsData.length > 0) {
      const itemIds = itemsData.map((i) => i.id);
      const { data: linksData } = await supabase
        .from("menu_item_modifier_groups")
        .select("*")
        .in("menu_item_id", itemIds);

      setItemModifierLinks(linksData || []);
    }

    setIsLoading(false);
  }

  // Category functions
  const handleSaveCategory = async () => {
    if (!categoryName.trim() || !restaurant) return;

    setSavingCategory(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({ name: categoryName })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({ title: "Catégorie modifiée" });
      } else {
        const { error } = await supabase.from("categories").insert({
          restaurant_id: restaurant.id,
          name: categoryName,
          display_order: categories.length,
        });

        if (error) throw error;
        toast({ title: "Catégorie créée" });
      }

      setCategoryName("");
      setShowCategoryForm(false);
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Supprimer cette catégorie? Tous les produits seront aussi supprimés.")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
      toast({ title: "Catégorie supprimée" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  // Item functions
  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !selectedCategoryId || !restaurant) return;

    setSavingItem(true);

    try {
      // Convert sizes to proper format
      const sizesData = itemSizes
        .filter((s) => s.name.trim() && s.price.trim())
        .map((s) => ({
          name: s.name.trim(),
          price: parseFloat(s.price) || 0,
        }));

      const itemData = {
        category_id: selectedCategoryId,
        restaurant_id: restaurant.id,
        name: itemForm.name,
        description: itemForm.description || null,
        base_price: parseFloat(itemForm.base_price) || 0,
        image_url: itemForm.image_url || null,
        sizes: sizesData,
      };

      let itemId: string;

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        itemId = editingItem.id;

        // Delete existing modifier links
        await supabase
          .from("menu_item_modifier_groups")
          .delete()
          .eq("menu_item_id", editingItem.id);

        toast({ title: "Produit modifié" });
      } else {
        const { data: newItem, error } = await supabase
          .from("menu_items")
          .insert({
            ...itemData,
            display_order: menuItems.filter((i) => i.category_id === selectedCategoryId)
              .length,
          })
          .select()
          .single();

        if (error) throw error;
        itemId = newItem.id;
        toast({ title: "Produit créé" });
      }

      // Save modifier group links
      if (selectedModifierGroups.length > 0) {
        const links = selectedModifierGroups.map((groupId, index) => ({
          menu_item_id: itemId,
          modifier_group_id: groupId,
          display_order: index,
        }));

        const { error: linkError } = await supabase
          .from("menu_item_modifier_groups")
          .insert(links);

        if (linkError) throw linkError;
      }

      resetItemForm();
      loadData();
    } catch (error: unknown) {
      console.error("Save item error:", error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || "Échec de l'enregistrement";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Supprimer ce produit?")) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast({ title: "Produit supprimé" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !item.is_available })
        .eq("id", item.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setSelectedCategoryId(item.category_id);
    setItemForm({
      name: item.name,
      description: item.description || "",
      base_price: item.base_price.toString(),
      image_url: item.image_url || "",
    });
    // Load existing sizes
    const existingSizes = (item.sizes || []).map((s) => ({
      name: s.name,
      price: s.price.toString(),
    }));
    setItemSizes(existingSizes);
    const existingLinks = itemModifierLinks
      .filter((link) => link.menu_item_id === item.id)
      .map((link) => link.modifier_group_id);
    setSelectedModifierGroups(existingLinks);
    setShowItemForm(true);
  };

  const toggleModifierGroup = (groupId: string) => {
    setSelectedModifierGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getItemModifierCount = (itemId: string) => {
    return itemModifierLinks.filter((link) => link.menu_item_id === itemId).length;
  };

  // Size helper functions
  const addSize = () => {
    setItemSizes((prev) => [...prev, { name: "", price: "" }]);
  };

  const updateSize = (index: number, field: "name" | "price", value: string) => {
    setItemSizes((prev) =>
      prev.map((size, i) => (i === index ? { ...size, [field]: value } : size))
    );
  };

  const removeSize = (index: number) => {
    setItemSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const resetItemForm = () => {
    setShowItemForm(false);
    setEditingItem(null);
    setSelectedCategoryId(null);
    setSelectedModifierGroups([]);
    setItemSizes([]);
    setItemForm({
      name: "",
      description: "",
      base_price: "",
      image_url: "",
    });
  };

  // Group functions
  const handleSaveGroup = async () => {
    if (!groupForm.name.trim() || !restaurant) return;

    setSavingGroup(true);

    try {
      const data = {
        restaurant_id: restaurant.id,
        name: groupForm.name,
        selection_type: groupForm.selection_type,
        is_required: groupForm.is_required,
        min_select: groupForm.min_select,
        max_select: groupForm.max_select,
      };

      if (editingGroup) {
        const { error } = await supabase
          .from("modifier_groups")
          .update(data)
          .eq("id", editingGroup.id);

        if (error) throw error;
        toast({ title: "Groupe modifié" });
      } else {
        const { error } = await supabase.from("modifier_groups").insert(data);

        if (error) throw error;
        toast({ title: "Groupe créé" });
      }

      resetGroupForm();
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Supprimer ce groupe et toutes ses options?")) return;

    try {
      const { error } = await supabase
        .from("modifier_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
      toast({ title: "Groupe supprimé" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  const resetGroupForm = () => {
    setShowGroupForm(false);
    setEditingGroup(null);
    setGroupForm({
      name: "",
      selection_type: "single",
      is_required: false,
      min_select: 0,
      max_select: 1,
    });
  };

  const openEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      selection_type: group.selection_type,
      is_required: group.is_required,
      min_select: group.min_select,
      max_select: group.max_select,
    });
    setShowGroupForm(true);
  };

  // Modifier functions
  const handleSaveModifier = async () => {
    if (!modifierForm.name.trim() || !selectedGroupId) return;

    setSavingModifier(true);

    try {
      const data = {
        group_id: selectedGroupId,
        name: modifierForm.name,
        price_adjustment: parseFloat(modifierForm.price_adjustment) || 0,
        display_order: modifiers.filter((m) => m.group_id === selectedGroupId).length,
      };

      if (editingModifier) {
        const { error } = await supabase
          .from("modifiers")
          .update({
            name: modifierForm.name,
            price_adjustment: parseFloat(modifierForm.price_adjustment) || 0,
          })
          .eq("id", editingModifier.id);

        if (error) throw error;
        toast({ title: "Option modifiée" });
      } else {
        const { error } = await supabase.from("modifiers").insert(data);

        if (error) throw error;
        toast({ title: "Option créée" });
      }

      resetModifierForm();
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setSavingModifier(false);
    }
  };

  const handleDeleteModifier = async (modifierId: string) => {
    if (!confirm("Supprimer cette option?")) return;

    try {
      const { error } = await supabase
        .from("modifiers")
        .delete()
        .eq("id", modifierId);

      if (error) throw error;
      toast({ title: "Option supprimée" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  const resetModifierForm = () => {
    setShowModifierForm(false);
    setEditingModifier(null);
    setSelectedGroupId(null);
    setModifierForm({ name: "", price_adjustment: "" });
  };

  const openEditModifier = (modifier: Modifier) => {
    setEditingModifier(modifier);
    setSelectedGroupId(modifier.group_id);
    setModifierForm({
      name: modifier.name,
      price_adjustment: modifier.price_adjustment.toString(),
    });
    setShowModifierForm(true);
  };

  // Enhanced UI helper functions
  const getGroupProductCount = (groupId: string) => {
    return itemModifierLinks.filter((link) => link.modifier_group_id === groupId).length;
  };

  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleModifierAvailability = async (modifier: Modifier) => {
    try {
      const { error } = await supabase
        .from("modifiers")
        .update({ is_available: !modifier.is_available })
        .eq("id", modifier.id);

      if (error) throw error;
      toast({
        title: modifier.is_available ? "Option désactivée" : "Option activée",
      });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const duplicateModifier = async (modifier: Modifier) => {
    try {
      const { error } = await supabase.from("modifiers").insert({
        group_id: modifier.group_id,
        name: `${modifier.name} (copie)`,
        price_adjustment: modifier.price_adjustment,
        display_order: modifiers.filter((m) => m.group_id === modifier.group_id).length,
      });

      if (error) throw error;
      toast({ title: "Option dupliquée" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la duplication",
        variant: "destructive",
      });
    }
  };

  const handleInlinePriceSave = async (modifierId: string) => {
    try {
      const { error } = await supabase
        .from("modifiers")
        .update({ price_adjustment: parseFloat(inlinePrice) || 0 })
        .eq("id", modifierId);

      if (error) throw error;
      toast({ title: "Prix mis à jour" });
      setInlineEditingModifier(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const startInlineEdit = (modifier: Modifier) => {
    setInlineEditingModifier(modifier.id);
    setInlinePrice(modifier.price_adjustment.toString());
  };

  // Price badge component for consistent styling
  const PriceBadge = ({ price }: { price: number }) => {
    if (price === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          <Check className="h-3 w-3" />
          Inclus
        </span>
      );
    }
    if (price > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          +${price.toFixed(2)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        -${Math.abs(price).toFixed(2)}
      </span>
    );
  };

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestion du Menu</h1>
        <p className="text-muted-foreground">Gérez vos produits, catégories et options</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "products"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Produits
        </button>
        <button
          onClick={() => setActiveTab("options")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "options"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Options & Tailles
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Add Category Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowCategoryForm(true);
                setEditingCategory(null);
                setCategoryName("");
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter catégorie
            </Button>
          </div>

          {/* Category Form Modal */}
          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Nom de la catégorie</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="ex: Pizzas, Burgers, Boissons"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveCategory}
                    disabled={savingCategory || !categoryName.trim()}
                  >
                    {savingCategory && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Enregistrer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      setCategoryName("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Item Form Modal */}
          {showItemForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingItem ? "Modifier le produit" : "Nouveau produit"}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={resetItemForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Nom du produit *</Label>
                    <Input
                      id="itemName"
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="ex: Pizza Margherita"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemPrice">Prix *</Label>
                    <Input
                      id="itemPrice"
                      type="number"
                      step="0.01"
                      value={itemForm.base_price}
                      onChange={(e) =>
                        setItemForm((prev) => ({
                          ...prev,
                          base_price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemDescription">Description</Label>
                  <textarea
                    id="itemDescription"
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Décrivez votre produit..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image du produit</Label>
                  <ImageUpload
                    value={itemForm.image_url}
                    onChange={(url) =>
                      setItemForm((prev) => ({
                        ...prev,
                        image_url: url || "",
                      }))
                    }
                    folder="products"
                    aspectRatio="video"
                  />
                </div>

                {/* Sizes Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tailles & Prix</Label>
                      <p className="text-xs text-muted-foreground">
                        Ajoutez des tailles avec leurs prix (XL, XXL, etc.)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSize}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter taille
                    </Button>
                  </div>

                  {itemSizes.length > 0 && (
                    <div className="space-y-2">
                      {itemSizes.map((size, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg border p-3"
                        >
                          <Input
                            value={size.name}
                            onChange={(e) => updateSize(index, "name", e.target.value)}
                            placeholder="Nom (ex: XL, XXL)"
                            className="flex-1"
                          />
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={size.price}
                              onChange={(e) => updateSize(index, "price", e.target.value)}
                              placeholder="0.00"
                              className="pl-7"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSize(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {itemSizes.length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Pas de tailles. Le prix de base sera utilisé.
                    </div>
                  )}
                </div>

                {/* Modifier Groups Selection (Extras/Toppings) */}
                {modifierGroups.length > 0 && (
                  <div className="space-y-3">
                    <Label>Options & Suppléments</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {modifierGroups.map((group) => (
                        <label
                          key={group.id}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            selectedModifierGroups.includes(group.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedModifierGroups.includes(group.id)}
                            onChange={() => toggleModifierGroup(group.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{group.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {group.selection_type === "single" ? "Un choix" : "Plusieurs choix"}
                              {group.is_required && " • Obligatoire"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {modifierGroups.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <SlidersHorizontal className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Aucune option créée.{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("options")}
                        className="text-primary hover:underline"
                      >
                        Créer des options
                      </button>{" "}
                      (tailles, suppléments...)
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveItem}
                    disabled={savingItem || !itemForm.name.trim()}
                  >
                    {savingItem && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={resetItemForm}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories and Items */}
          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Aucune catégorie</h3>
                <p className="text-muted-foreground">
                  Créez votre première catégorie pour commencer à ajouter des produits.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryItems = menuItems.filter(
                  (item) => item.category_id === category.id
                );

                return (
                  <Card key={category.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>{category.name}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          ({categoryItems.length} produits)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setShowItemForm(true);
                            setEditingItem(null);
                            setSelectedModifierGroups([]);
                            setItemForm({
                              name: "",
                              description: "",
                              base_price: "",
                              image_url: "",
                            });
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Ajouter produit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryName(category.name);
                            setShowCategoryForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {categoryItems.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Aucun produit dans cette catégorie.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-4 rounded-lg border p-4 ${
                                !item.is_available ? "opacity-50" : ""
                              }`}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-16 w-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{item.name}</h4>
                                  {getItemModifierCount(item.id) > 0 && (
                                    <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                      <SlidersHorizontal className="h-3 w-3" />
                                      {getItemModifierCount(item.id)} options
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ${Number(item.base_price).toFixed(2)}
                                </p>
                                <button
                                  onClick={() => toggleItemAvailability(item)}
                                  className={`text-xs ${
                                    item.is_available
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {item.is_available ? "Disponible" : "Indisponible"}
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditItem(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Options Tab - Enhanced UI */}
      {activeTab === "options" && (
        <div className="space-y-6">
          {/* Header with stats and button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <SlidersHorizontal className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Options & Suppléments</h2>
                <p className="text-sm text-muted-foreground">
                  {modifierGroups.length} groupe(s) • {modifiers.length} option(s) au total
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetGroupForm();
                setShowGroupForm(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau groupe
            </Button>
          </div>

          {/* Group Form Modal - Enhanced */}
          {showGroupForm && (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Settings2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>
                    {editingGroup ? "Modifier le groupe" : "Nouveau groupe d'options"}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={resetGroupForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Nom du groupe *</Label>
                  <Input
                    id="groupName"
                    value={groupForm.name}
                    onChange={(e) =>
                      setGroupForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="ex: Taille, Suppléments, Sauce, Cuisson..."
                    className="text-base"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label>Type de sélection</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setGroupForm((prev) => ({
                            ...prev,
                            selection_type: "single",
                            max_select: 1,
                          }))
                        }
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                          groupForm.selection_type === "single"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 ${groupForm.selection_type === "single" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                          {groupForm.selection_type === "single" && (
                            <div className="flex h-full items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium">Un seul choix</span>
                        <span className="text-xs text-muted-foreground">Radio boutons</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setGroupForm((prev) => ({
                            ...prev,
                            selection_type: "multiple",
                            max_select: 5,
                          }))
                        }
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                          groupForm.selection_type === "multiple"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`flex h-4 w-4 items-center justify-center rounded border-2 ${groupForm.selection_type === "multiple" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                          {groupForm.selection_type === "multiple" && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">Plusieurs choix</span>
                        <span className="text-xs text-muted-foreground">Cases à cocher</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Obligatoire?</Label>
                    <button
                      type="button"
                      onClick={() =>
                        setGroupForm((prev) => ({
                          ...prev,
                          is_required: !prev.is_required,
                          min_select: !prev.is_required ? 1 : 0,
                        }))
                      }
                      className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                        groupForm.is_required
                          ? "border-orange-300 bg-orange-50"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {groupForm.is_required ? (
                        <ToggleRight className="h-6 w-6 text-orange-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <span className="text-sm font-medium">
                          {groupForm.is_required ? "Obligatoire" : "Optionnel"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {groupForm.is_required
                            ? "Le client doit faire un choix"
                            : "Le client peut ignorer"}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {groupForm.selection_type === "multiple" && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <Label className="mb-3 block">Limites de sélection</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="minSelect" className="text-xs text-muted-foreground">Minimum</Label>
                        <Input
                          id="minSelect"
                          type="number"
                          min="0"
                          value={groupForm.min_select}
                          onChange={(e) =>
                            setGroupForm((prev) => ({
                              ...prev,
                              min_select: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxSelect" className="text-xs text-muted-foreground">Maximum</Label>
                        <Input
                          id="maxSelect"
                          type="number"
                          min="1"
                          value={groupForm.max_select}
                          onChange={(e) =>
                            setGroupForm((prev) => ({
                              ...prev,
                              max_select: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveGroup}
                    disabled={savingGroup || !groupForm.name.trim()}
                    className="gap-2"
                  >
                    {savingGroup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={resetGroupForm}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modifier Form Modal - Enhanced */}
          {showModifierForm && (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>
                      {editingModifier ? "Modifier l'option" : "Nouvelle option"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {modifierGroups.find(g => g.id === selectedGroupId)?.name}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetModifierForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="modifierName">Nom de l'option *</Label>
                  <Input
                    id="modifierName"
                    value={modifierForm.name}
                    onChange={(e) =>
                      setModifierForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="ex: Petit, Moyen, Grand, Extra fromage..."
                    className="text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Prix supplémentaire</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="priceAdjustment"
                        type="number"
                        step="0.01"
                        value={modifierForm.price_adjustment}
                        onChange={(e) =>
                          setModifierForm((prev) => ({
                            ...prev,
                            price_adjustment: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className="pl-7 text-base"
                      />
                    </div>
                  </div>

                  {/* Quick price buttons */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground mr-1 self-center">Raccourcis:</span>
                    {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() =>
                          setModifierForm((prev) => ({
                            ...prev,
                            price_adjustment: price.toString(),
                          }))
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          modifierForm.price_adjustment === price.toString()
                            ? "bg-primary text-white"
                            : price === 0
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {price === 0 ? "Inclus" : `+$${price.toFixed(2)}`}
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-2">Aperçu client:</p>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{modifierForm.name || "Nom de l'option"}</span>
                      <PriceBadge price={parseFloat(modifierForm.price_adjustment) || 0} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveModifier}
                    disabled={savingModifier || !modifierForm.name.trim()}
                    className="gap-2"
                  >
                    {savingModifier ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={resetModifierForm}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Groups List - Enhanced */}
          {modifierGroups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Settings2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Aucun groupe d'options</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  Créez des groupes comme "Taille", "Suppléments" ou "Sauce" pour permettre aux clients de personnaliser leurs commandes.
                </p>
                <Button
                  onClick={() => {
                    resetGroupForm();
                    setShowGroupForm(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer mon premier groupe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {modifierGroups.map((group) => {
                const groupModifiers = modifiers.filter(
                  (m) => m.group_id === group.id
                );
                const productCount = getGroupProductCount(group.id);
                const isCollapsed = collapsedGroups.has(group.id);
                const availableCount = groupModifiers.filter(m => m.is_available).length;

                return (
                  <Card key={group.id} className="overflow-hidden">
                    {/* Group Header - Enhanced */}
                    <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-muted/50 to-transparent pb-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleGroupCollapsed(group.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            {group.is_required && (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                Obligatoire
                              </span>
                            )}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              group.selection_type === "single"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}>
                              {group.selection_type === "single"
                                ? "1 choix"
                                : `${group.min_select}-${group.max_select} choix`}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              {groupModifiers.length} option{groupModifiers.length > 1 ? "s" : ""}
                              {groupModifiers.length > 0 && availableCount < groupModifiers.length && (
                                <span className="text-orange-600">
                                  ({availableCount} active{availableCount > 1 ? "s" : ""})
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {productCount} produit{productCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setShowModifierForm(true);
                            setEditingModifier(null);
                            setModifierForm({ name: "", price_adjustment: "" });
                          }}
                          className="gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Option</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditGroup(group)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Modifiers List - Collapsible */}
                    {!isCollapsed && (
                      <CardContent className="pt-0">
                        {groupModifiers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
                            <SlidersHorizontal className="mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              Aucune option dans ce groupe
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setSelectedGroupId(group.id);
                                setShowModifierForm(true);
                                setEditingModifier(null);
                                setModifierForm({ name: "", price_adjustment: "" });
                              }}
                            >
                              Ajouter une option
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y rounded-lg border">
                            {groupModifiers.map((modifier) => (
                              <div
                                key={modifier.id}
                                className={`flex items-center justify-between p-3 transition-colors hover:bg-muted/30 ${
                                  !modifier.is_available ? "bg-muted/50 opacity-60" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${!modifier.is_available ? "line-through" : ""}`}>
                                      {modifier.name}
                                    </span>
                                    {!modifier.is_available && (
                                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                                        Désactivé
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Inline price edit or display */}
                                  {inlineEditingModifier === modifier.id ? (
                                    <div className="flex items-center gap-1">
                                      <div className="relative w-20">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={inlinePrice}
                                          onChange={(e) => setInlinePrice(e.target.value)}
                                          className="h-7 pl-5 text-xs"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleInlinePriceSave(modifier.id);
                                            if (e.key === "Escape") setInlineEditingModifier(null);
                                          }}
                                        />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleInlinePriceSave(modifier.id)}
                                      >
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setInlineEditingModifier(null)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startInlineEdit(modifier)}
                                      className="transition-transform hover:scale-105"
                                      title="Cliquez pour modifier le prix"
                                    >
                                      <PriceBadge price={modifier.price_adjustment} />
                                    </button>
                                  )}

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-0.5 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => toggleModifierAvailability(modifier)}
                                      title={modifier.is_available ? "Désactiver" : "Activer"}
                                    >
                                      {modifier.is_available ? (
                                        <ToggleRight className="h-4 w-4 text-emerald-600" />
                                      ) : (
                                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => duplicateModifier(modifier)}
                                      title="Dupliquer"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditModifier(modifier)}
                                      title="Modifier"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleDeleteModifier(modifier.id)}
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
