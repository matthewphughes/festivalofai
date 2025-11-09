import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


type User = {
  id: string;
  email: string;
  full_name: string | null;
};

type Product = {
  id: string;
  product_name: string;
  amount: number;
  currency: string;
};

type EnrichedOrder = {
  id: string;
  user_id: string;
  replay_id: string | null;
  product_id: string | null;
  event_year: number;
  purchased_at: string;
  stripe_payment_intent: string | null;
  order_type: string | null;
  is_admin_grant: boolean | null;
  granted_by: string | null;
  granted_at: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  product?: {
    id: string;
    product_name: string;
    amount: number;
    currency: string;
  } | null;
  session?: {
    id: string;
    title: string;
  } | null;
};

const ITEMS_PER_PAGE = 20;

const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [eventYear, setEventYear] = useState(new Date().getFullYear().toString());

  // Check admin access
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!roleData;
    },
  });

  // Fetch users for dropdown
  const { data: users } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("email");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch products for dropdown
  const { data: products } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stripe_products")
        .select("id, product_name, amount, currency")
        .eq("active", true)
        .order("product_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch all orders with related data
  const { data: ordersData, isLoading } = useQuery<EnrichedOrder[]>({
    queryKey: ["admin-orders", searchQuery, filterType],
    queryFn: async () => {
      let query = supabase
        .from("replay_purchases")
        .select("*")
        .order("purchased_at", { ascending: false });

      if (filterType !== "all") {
        if (filterType === "admin_grant") {
          query = query.eq("is_admin_grant", true);
        } else if (filterType === "paid") {
          query = query.eq("is_admin_grant", false);
        }
      }

      const { data: purchases, error } = await query;
      if (error) throw error;

      // Fetch all related data
      const userIds = [...new Set(purchases?.map(p => p.user_id) || [])];
      const productIds = [...new Set(purchases?.filter(p => p.product_id).map(p => p.product_id) || [])];
      const replayIds = [...new Set(purchases?.filter(p => p.replay_id).map(p => p.replay_id) || [])];

      const [profilesData, productsData, sessionsData] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("id, email, full_name").in("id", userIds)
          : Promise.resolve({ data: [] }),
        productIds.length > 0
          ? supabase.from("stripe_products").select("id, product_name, amount, currency").in("id", productIds)
          : Promise.resolve({ data: [] }),
        replayIds.length > 0
          ? supabase.from("sessions").select("id, title").in("id", replayIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profilesMap = new Map(
        profilesData.data?.map(p => [p.id, p] as [string, typeof p]) || []
      );
      const productsMap = new Map(
        productsData.data?.map(p => [p.id, p] as [string, typeof p]) || []
      );
      const sessionsMap = new Map(
        sessionsData.data?.map(s => [s.id, s] as [string, typeof s]) || []
      );

      // Join the data
      const enrichedPurchases: EnrichedOrder[] = purchases?.map(purchase => ({
        ...purchase,
        profile: profilesMap.get(purchase.user_id),
        product: purchase.product_id ? productsMap.get(purchase.product_id) : null,
        session: purchase.replay_id ? sessionsMap.get(purchase.replay_id) : null,
      })) || [];

      // Apply search filter
      if (searchQuery) {
        return enrichedPurchases.filter(order =>
          order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.stripe_payment_intent?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return enrichedPurchases;
    },
    enabled: isAdmin === true,
  });

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const totalPages = ordersData ? Math.ceil(ordersData.length / ITEMS_PER_PAGE) : 1;
  const paginatedOrders = ordersData?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCreateManualOrder = async () => {
    if (!selectedUserId || !selectedProductId) {
      toast.error("Please select both a user and a product");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const adminId = sessionData.session?.user.id;

      const { error } = await supabase
        .from("replay_purchases")
        .insert({
          user_id: selectedUserId,
          product_id: selectedProductId,
          event_year: parseInt(eventYear),
          order_type: "manual",
          is_admin_grant: true,
          granted_by: adminId,
          granted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Manual order created successfully");
      setDialogOpen(false);
      setSelectedUserId("");
      setSelectedProductId("");
      setEventYear(new Date().getFullYear().toString());
      
      // Refresh orders
      window.location.reload();
    } catch (error: any) {
      console.error("Error creating manual order:", error);
      toast.error("Failed to create manual order: " + error.message);
    }
  };

  const exportToCSV = () => {
    if (!ordersData || ordersData.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = ["Order ID", "Date", "Customer Email", "Customer Name", "Product", "Amount", "Currency", "Payment Intent", "Type", "Event Year"];
    const rows = ordersData.map(order => [
      order.id,
      format(new Date(order.purchased_at), "yyyy-MM-dd HH:mm:ss"),
      order.profile?.email || "N/A",
      order.profile?.full_name || "N/A",
      order.product?.product_name || order.session?.title || "N/A",
      order.product?.amount ? (order.product.amount / 100).toFixed(2) : "0.00",
      order.product?.currency?.toUpperCase() || "N/A",
      order.stripe_payment_intent || "N/A",
      order.order_type || (order.is_admin_grant ? "Admin Grant" : "Paid"),
      order.event_year,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Orders exported successfully");
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount) return "£0.00";
    const value = (amount / 100).toFixed(2);
    const symbol = currency?.toUpperCase() === "USD" ? "$" : "£";
    return `${symbol}${value}`;
  };

  return (
    <>
      <Helmet>
        <title>Order Management - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1 container mx-auto px-4 py-8 mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage all customer orders and admin grants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by email or payment intent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                    <SelectItem value="admin_grant">Admin Grants</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Manual Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Manual Order</DialogTitle>
                      <DialogDescription>
                        Manually assign a product to a user without payment processing
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name || user.email} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.product_name} - £{(product.amount / 100).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Event Year</Label>
                        <Input
                          type="number"
                          value={eventYear}
                          onChange={(e) => setEventYear(e.target.value)}
                          placeholder="2025"
                        />
                      </div>

                      <Button onClick={handleCreateManualOrder} className="w-full">
                        Create Manual Order
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : paginatedOrders && paginatedOrders.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Payment Intent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(order.purchased_at), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.profile?.full_name || "N/A"}</div>
                                <div className="text-sm text-muted-foreground">{order.profile?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.product?.product_name || order.session?.title || "N/A"}
                            </TableCell>
                            <TableCell>
                              {formatAmount(order.product?.amount || null, order.product?.currency || null)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.order_type === "manual"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : order.is_admin_grant 
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" 
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}>
                                {order.order_type === "manual" ? "Manual" : order.is_admin_grant ? "Admin Grant" : "Paid"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {order.stripe_payment_intent || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}

                  <div className="mt-4 text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, ordersData?.length || 0)} of {ordersData?.length || 0} orders
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminOrders;
