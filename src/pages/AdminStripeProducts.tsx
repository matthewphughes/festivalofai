import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface StripeProduct {
  id: string;
  stripe_product_id: string;
  stripe_price_id: string;
  product_name: string;
  product_type: "individual_replay" | "year_bundle" | "ticket" | "bundle";
  event_year: number;
  replay_id: string | null;
  amount: number;
  currency: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Replay {
  id: string;
  title: string;
  event_year: number;
}

const AdminStripeProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StripeProduct | null>(null);
  
  // Filters
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    product_name: "",
    product_type: "individual_replay" as "individual_replay" | "year_bundle" | "ticket" | "bundle",
    event_year: new Date().getFullYear(),
    replay_id: "",
    amount: 0,
    currency: "gbp",
  });

  useEffect(() => {
    checkAdminAccess();
    fetchProducts();
    fetchReplays();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast.error("Admin access required");
      navigate("/");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stripe_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products");
      console.error(error);
    } else {
      setProducts((data as StripeProduct[]) || []);
    }
    setLoading(false);
  };

  const fetchReplays = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, event_year")
      .eq("published", true)
      .order("event_year", { ascending: false });

    if (error) {
      console.error("Failed to fetch replays:", error);
    } else {
      setReplays(data || []);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-products");
      
      if (error) throw error;

      toast.success(`Synced ${data.synced} products, updated ${data.updated}`);
      if (data.orphaned.length > 0) {
        toast.warning(`${data.orphaned.length} orphaned products found`);
      }
      fetchProducts();
    } catch (error) {
      toast.error("Failed to sync products");
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkCreate = async () => {
    setBulkCreating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Create individual replay products - £37 each
      for (const replay of replays) {
        if (replay.event_year === 2025) {
          try {
            const { error } = await supabase.functions.invoke("manage-stripe-product", {
              body: {
                operation: "create",
                data: {
                  product_name: `FAI25 - ${replay.title}`,
                  product_type: "individual_replay",
                  event_year: replay.event_year,
                  replay_id: replay.id,
                  amount: 3700, // £37
                  currency: "gbp",
                },
              },
            });

            if (error) throw error;
            successCount++;
            toast.success(`Created: ${replay.title}`);
          } catch (error: any) {
            errorCount++;
            console.error(`Failed to create ${replay.title}:`, error);
            toast.error(`Failed: ${replay.title}`);
          }
        }
      }

      // Create 2025 bundle - £99
      try {
        const { error } = await supabase.functions.invoke("manage-stripe-product", {
          body: {
            operation: "create",
            data: {
              product_name: "FAI25 - 2025 Full Event Replays Bundle",
              product_type: "year_bundle",
              event_year: 2025,
              replay_id: null,
              amount: 9900, // £99
              currency: "gbp",
            },
          },
        });

        if (error) throw error;
        successCount++;
        toast.success("Created: 2025 Bundle");
      } catch (error: any) {
        errorCount++;
        console.error("Failed to create bundle:", error);
        toast.error("Failed: 2025 Bundle");
      }

      toast.success(`Bulk creation complete! ${successCount} created, ${errorCount} failed`);
      fetchProducts();
    } catch (error: any) {
      toast.error("Bulk creation failed");
      console.error(error);
    } finally {
      setBulkCreating(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-stripe-product", {
        body: {
          operation: "create",
          data: {
            ...formData,
            replay_id: formData.product_type === "individual_replay" ? formData.replay_id : null,
          },
        },
      });

      if (error) throw error;

      toast.success("Product created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;

    try {
      const { data, error } = await supabase.functions.invoke("manage-stripe-product", {
        body: {
          operation: "update",
          product_id: selectedProduct.id,
          data: {
            product_name: formData.product_name,
            amount: formData.amount,
            currency: formData.currency,
          },
        },
      });

      if (error) throw error;

      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
      console.error(error);
    }
  };

  const handleToggleActive = async (product: StripeProduct) => {
    try {
      const { error } = await supabase.functions.invoke("manage-stripe-product", {
        body: {
          operation: "toggle_active",
          product_id: product.id,
        },
      });

      if (error) throw error;

      toast.success(`Product ${product.active ? "deactivated" : "activated"}`);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle product status");
      console.error(error);
    }
  };

  const handleDelete = async (product: StripeProduct) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("manage-stripe-product", {
        body: {
          operation: "delete",
          product_id: product.id,
        },
      });

      if (error) throw error;

      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
      console.error(error);
    }
  };

  const openEditDialog = (product: StripeProduct) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      product_type: product.product_type,
      event_year: product.event_year,
      replay_id: product.replay_id || "",
      amount: product.amount,
      currency: product.currency,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      product_type: "individual_replay",
      event_year: new Date().getFullYear(),
      replay_id: "",
      amount: 0,
      currency: "gbp",
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const filteredProducts = products.filter((product) => {
    if (yearFilter !== "all" && product.event_year.toString() !== yearFilter) return false;
    if (typeFilter !== "all" && product.product_type !== typeFilter) return false;
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      if (product.active !== isActive) return false;
    }
    return true;
  });

  const availableYears = Array.from(new Set(products.map((p) => p.event_year))).sort((a, b) => b - a);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8 mt-24">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Stripe Product Management</h1>
            <p className="text-muted-foreground">Manage replay products and pricing</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleBulkCreate} 
              disabled={bulkCreating || replays.length === 0} 
              variant="secondary"
            >
              {bulkCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Bulk Create 2025 Products
            </Button>
            <Button onClick={handleSync} disabled={syncing} variant="outline">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync with Stripe
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Stripe Product</DialogTitle>
                  <DialogDescription>Create a new product in Stripe and link it to a replay</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Type</Label>
                    <Select
                      value={formData.product_type}
                      onValueChange={(value: "individual_replay" | "year_bundle" | "ticket" | "bundle") =>
                        setFormData({ ...formData, product_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual_replay">Individual Replay</SelectItem>
                        <SelectItem value="year_bundle">Year Bundle</SelectItem>
                        <SelectItem value="ticket">Ticket</SelectItem>
                        <SelectItem value="bundle">Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.product_type === "individual_replay" && (
                    <div>
                      <Label>Replay</Label>
                      <Select value={formData.replay_id} onValueChange={(value) => {
                        const replay = replays.find(r => r.id === value);
                        setFormData({ 
                          ...formData, 
                          replay_id: value,
                          event_year: replay?.event_year || formData.event_year,
                          product_name: replay?.title || formData.product_name,
                        })
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a replay" />
                        </SelectTrigger>
                        <SelectContent>
                          {replays
                            .filter(r => !products.some(p => p.replay_id === r.id))
                            .map((replay) => (
                              <SelectItem key={replay.id} value={replay.id}>
                                {replay.title} ({replay.event_year})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(formData.product_type === "year_bundle" || formData.product_type === "ticket" || formData.product_type === "bundle") && (
                    <div>
                      <Label>Event Year</Label>
                      <Input
                        type="number"
                        value={formData.event_year}
                        onChange={(e) => setFormData({ ...formData, event_year: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="e.g., Session Recording 2024"
                    />
                  </div>

                  <div>
                    <Label>Price (in pence/cents)</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                      placeholder="2500"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Preview: {formatPrice(formData.amount, formData.currency)}
                    </p>
                  </div>

                  <div>
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.product_name || formData.amount === 0}>
                    Create Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Year</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual_replay">Individual Replay</SelectItem>
                    <SelectItem value="year_bundle">Year Bundle</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => {
              const replayTitle = replays.find((r) => r.id === product.replay_id)?.title;
              return (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {product.product_name}
                          <Badge variant={product.active ? "default" : "secondary"}>
                            {product.active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {product.product_type === "individual_replay" ? "🎬 Individual" : 
                             product.product_type === "ticket" ? "🎟️ Ticket" :
                             product.product_type === "bundle" ? "📦 Bundle" : 
                             "📦 Year Bundle"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {product.product_type === "individual_replay" && replayTitle && (
                            <span>Replay: {replayTitle} • </span>
                          )}
                          Year: {product.event_year} • {formatPrice(product.amount, product.currency)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(product)}
                        >
                          {product.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update product name and pricing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Price (in pence/cents)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Preview: {formatPrice(formData.amount, formData.currency)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default AdminStripeProducts;
