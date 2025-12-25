"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ImageIcon,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;

export default function MenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    base_price: "",
    image_url: "",
  });
  const [savingItem, setSavingItem] = useState(false);

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
        toast({ title: "Category updated" });
      } else {
        const { error } = await supabase.from("categories").insert({
          restaurant_id: restaurant.id,
          name: categoryName,
          display_order: categories.length,
        });

        if (error) throw error;
        toast({ title: "Category created" });
      }

      setCategoryName("");
      setShowCategoryForm(false);
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Delete this category? All items in it will also be deleted.")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
      toast({ title: "Category deleted" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Item functions
  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !selectedCategoryId || !restaurant) return;

    setSavingItem(true);

    try {
      const itemData = {
        category_id: selectedCategoryId,
        restaurant_id: restaurant.id,
        name: itemForm.name,
        description: itemForm.description || null,
        base_price: parseFloat(itemForm.base_price) || 0,
        image_url: itemForm.image_url || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Item updated" });
      } else {
        const { error } = await supabase.from("menu_items").insert({
          ...itemData,
          display_order: menuItems.filter((i) => i.category_id === selectedCategoryId)
            .length,
        });

        if (error) throw error;
        toast({ title: "Item created" });
      }

      setItemForm({ name: "", description: "", base_price: "", image_url: "" });
      setShowItemForm(false);
      setEditingItem(null);
      setSelectedCategoryId(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast({ title: "Item deleted" });
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete item",
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
        title: "Error",
        description: "Failed to update item",
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
    setShowItemForm(true);
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
        title="Menu Management"
        description="Manage your categories and menu items"
      />
      <div className="flex-1 p-6">
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
              Add Category
            </Button>
          </div>

          {/* Category Form Modal */}
          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCategory ? "Edit Category" : "New Category"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Pizzas, Burgers, Drinks"
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
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      setCategoryName("");
                    }}
                  >
                    Cancel
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
                  {editingItem ? "Edit Item" : "New Item"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    setItemForm({
                      name: "",
                      description: "",
                      base_price: "",
                      image_url: "",
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input
                      id="itemName"
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemPrice">Price *</Label>
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
                    placeholder="Describe your item..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemImage">Image URL</Label>
                  <Input
                    id="itemImage"
                    value={itemForm.image_url}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        image_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveItem}
                    disabled={savingItem || !itemForm.name.trim()}
                  >
                    {savingItem && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowItemForm(false);
                      setEditingItem(null);
                      setItemForm({
                        name: "",
                        description: "",
                        base_price: "",
                        image_url: "",
                      });
                    }}
                  >
                    Cancel
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
                <h3 className="text-lg font-semibold">No categories yet</h3>
                <p className="text-muted-foreground">
                  Create your first category to start adding menu items.
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
                          ({categoryItems.length} items)
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
                            setItemForm({
                              name: "",
                              description: "",
                              base_price: "",
                              image_url: "",
                            });
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Item
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
                          No items in this category yet.
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
                                <h4 className="font-medium">{item.name}</h4>
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
                                  {item.is_available ? "Available" : "Unavailable"}
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
      </div>
    </div>
  );
}
