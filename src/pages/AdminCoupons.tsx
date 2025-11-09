import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Power, PowerOff, Trash2, Pencil, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  currency: string;
  active: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  product_id: string | null;
}

interface Product {
  id: string;
  product_name: string;
  stripe_product_id: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    currency: "gbp",
    max_redemptions: "",
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: "",
    product_id: "all",
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("stripe_products")
        .select("id, product_name, stripe_product_id")
        .eq("active", true)
        .order("product_name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch products: " + error.message);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("stripe_coupons")
        .select("*, product_id")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch coupons: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-coupon", {
        body: {
          operation: "create",
          data: {
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: parseInt(formData.discount_value),
            currency: formData.currency,
            max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
            valid_from: formData.valid_from,
            valid_until: formData.valid_until || null,
            product_id: formData.product_id === "all" ? null : formData.product_id || null,
          },
        },
      });

      if (error) throw error;

      toast.success("Coupon created successfully");
      setDialogOpen(false);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        currency: "gbp",
        max_redemptions: "",
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: "",
        product_id: "all",
      });
      fetchCoupons();
    } catch (error: any) {
      toast.error("Failed to create coupon: " + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingCoupon) return;

    try {
      const { error } = await supabase.functions.invoke("manage-coupon", {
        body: {
          operation: "update",
          coupon_id: editingCoupon.id,
          data: {
            discount_value: parseInt(formData.discount_value),
            max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
            valid_until: formData.valid_until || null,
          },
        },
      });

      if (error) throw error;

      toast.success("Coupon updated successfully");
      setDialogOpen(false);
      setEditingCoupon(null);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        currency: "gbp",
        max_redemptions: "",
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: "",
        product_id: "all",
      });
      fetchCoupons();
    } catch (error: any) {
      toast.error("Failed to update coupon: " + error.message);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      currency: coupon.currency,
      max_redemptions: coupon.max_redemptions?.toString() || "",
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until?.split('T')[0] || "",
      product_id: coupon.product_id || "all",
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (couponId: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-coupon", {
        body: {
          operation: "toggle_active",
          coupon_id: couponId,
        },
      });

      if (error) throw error;

      toast.success("Coupon status updated");
      fetchCoupons();
    } catch (error: any) {
      toast.error("Failed to update coupon: " + error.message);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const { error } = await supabase.functions.invoke("manage-coupon", {
        body: {
          operation: "delete",
          coupon_id: couponId,
        },
      });

      if (error) throw error;

      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (error: any) {
      toast.error("Failed to delete coupon: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingCoupon(null);
              setFormData({
                code: "",
                discount_type: "percentage",
                discount_value: "",
                currency: "gbp",
                max_redemptions: "",
                valid_from: new Date().toISOString().split('T')[0],
                valid_until: "",
                product_id: "all",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                <DialogDescription>
                  {editingCoupon ? "Update coupon details" : "Create a discount coupon for customers"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {!editingCoupon && (
                  <>
                    <div className="space-y-2">
                      <Label>Coupon Code</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="SUMMER2025"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Discount Value ({formData.discount_type === "percentage" ? "%" : "Pence"})</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === "percentage" ? "20" : "1000"}
                  />
                </div>

                {!editingCoupon && (
                  <div className="space-y-2">
                    <Label>Product (Optional)</Label>
                    <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.product_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Max Redemptions (Optional)</Label>
                  <Input
                    type="number"
                    value={formData.max_redemptions}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!editingCoupon && (
                    <div className="space-y-2">
                      <Label>Valid From</Label>
                      <Input
                        type="date"
                        value={formData.valid_from}
                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      />
                    </div>
                  )}
                  <div className={`space-y-2 ${!editingCoupon ? '' : 'col-span-2'}`}>
                    <Label>Valid Until (Optional)</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={editingCoupon ? handleUpdate : handleCreate} className="w-full">
                  {editingCoupon ? "Update Coupon" : "Create Coupon"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
            <CardDescription>Manage discount coupons and track usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const product = products.find(p => p.id === coupon.product_id);
                  return (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                    <TableCell>
                      {product ? product.product_name : "All Products"}
                    </TableCell>
                    <TableCell>
                      {coupon.discount_type === "percentage" 
                        ? `${coupon.discount_value}%` 
                        : `£${(coupon.discount_value / 100).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {coupon.times_redeemed}
                      {coupon.max_redemptions && ` / ${coupon.max_redemptions}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(coupon.valid_from), "MMM d, yyyy")}
                      {coupon.valid_until && ` - ${format(new Date(coupon.valid_until), "MMM d, yyyy")}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.active ? "default" : "secondary"}>
                        {coupon.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                          title="Edit coupon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(coupon.id)}
                          title={coupon.active ? "Deactivate" : "Activate"}
                        >
                          {coupon.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminCoupons;
