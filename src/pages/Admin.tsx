import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Video, Calendar, ChevronRight, BarChart3, Settings, Mail, ShoppingBag, Tag, Receipt, UserCircle, Mic, MessageSquare, Gift, ChevronDown, DollarSign, TrendingUp, Ticket, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIncome: 0,
    monthToDateIncome: 0,
    totalTicketSales: 0,
    totalReplaySales: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isAdmin = roles?.some(r => r.role === "admin") || false;
    
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/replays");
      return;
    }

    await fetchStats();
  };

  const fetchStats = async () => {
    setLoading(true);
    
    // Fetch user count
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });

    // Fetch purchases with product details
    const { data: purchases, error: purchasesError } = await supabase
      .from("replay_purchases")
      .select(`
        *,
        stripe_products:product_id (
          amount,
          product_type
        )
      `);

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError);
    }

    // Calculate financial stats
    const totalIncome = purchases?.reduce((sum, p) => {
      const amount = (p.stripe_products as any)?.amount || 0;
      const discount = p.discount_amount || 0;
      return sum + (amount - discount);
    }, 0) || 0;

    // Calculate month to date income
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthToDateIncome = purchases?.reduce((sum, p) => {
      const purchaseDate = new Date(p.purchased_at);
      if (purchaseDate >= firstDayOfMonth) {
        const amount = (p.stripe_products as any)?.amount || 0;
        const discount = p.discount_amount || 0;
        return sum + (amount - discount);
      }
      return sum;
    }, 0) || 0;

    // Count ticket sales vs replay sales
    const ticketSales = purchases?.filter(p => 
      (p.stripe_products as any)?.product_type === "ticket"
    ).length || 0;
    
    const replaySales = purchases?.filter(p => 
      (p.stripe_products as any)?.product_type === "replay"
    ).length || 0;

    setStats({
      totalUsers: userCount || 0,
      totalIncome: totalIncome / 100, // Convert from pence to pounds
      monthToDateIncome: monthToDateIncome / 100,
      totalTicketSales: ticketSales,
      totalReplaySales: replaySales,
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your event management</p>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{stats.totalIncome.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">All-time revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Month to Date</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{stats.monthToDateIncome.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Income this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTicketSales}</div>
                  <p className="text-xs text-muted-foreground">Tickets sold</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Replay Sales</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReplaySales}</div>
                  <p className="text-xs text-muted-foreground">Replays purchased</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Button
                    onClick={() => navigate("/admin/analytics")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Content Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Button
                    onClick={() => navigate("/admin/sessions")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Sessions
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/agenda-builder")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Agenda
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/speakers")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Speakers
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/testimonials")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Testimonials
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Sales & Commerce */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sales & Commerce</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Button
                    onClick={() => navigate("/admin/stripe-products")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Products
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/coupons")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Coupons
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/discount-campaigns")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Discount Campaigns
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/orders")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Orders
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Button
                    onClick={() => navigate("/admin/users")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/contacts")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Contacts
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/sponsor-requests")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Sponsors
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Button
                    onClick={() => navigate("/admin/email-settings")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/site-settings")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Site
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
