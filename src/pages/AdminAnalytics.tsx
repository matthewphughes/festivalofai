import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, TrendingUp, DollarSign, Users, ShoppingCart, ArrowLeft, Eye, MousePointer, Activity } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { RealtimeVisitors } from "@/components/admin/RealtimeVisitors";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  avgOrderValue: number;
  revenueByProduct: Array<{ name: string; revenue: number }>;
  ordersByMonth: Array<{ month: string; orders: number }>;
  productSales: Array<{ name: string; sales: number }>;
}

interface GA4Data {
  pageViews: number;
  sessions: number;
  activeUsers: number;
  conversions: number;
  topPages: Array<{ page: string; views: number }>;
  trafficSources: Array<{ source: string; users: number }>;
  deviceCategories: Array<{ device: string; users: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [ga4Data, setGA4Data] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [ga4Loading, setGA4Loading] = useState(true);
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchGA4Data();
  }, [dateRange, daysBack]);

  const fetchAnalytics = async () => {
    try {
      // Fetch replay purchases with product info
      const { data: purchases, error: purchasesError } = await supabase
        .from("replay_purchases")
        .select(`
          *,
          stripe_products:product_id (
            product_name,
            amount
          )
        `);

      if (purchasesError) throw purchasesError;

      // Fetch total users
      const { count: userCount, error: userError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (userError) throw userError;

      // Calculate analytics
      const totalRevenue = purchases?.reduce((sum, p) => {
        const amount = (p.stripe_products as any)?.amount || 0;
        const discount = p.discount_amount || 0;
        return sum + (amount - discount);
      }, 0) || 0;

      const totalOrders = purchases?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by product
      const productRevenue: Record<string, number> = {};
      purchases?.forEach((p) => {
        const productName = (p.stripe_products as any)?.product_name || "Unknown";
        const amount = (p.stripe_products as any)?.amount || 0;
        const discount = p.discount_amount || 0;
        productRevenue[productName] = (productRevenue[productName] || 0) + (amount - discount);
      });

      const revenueByProduct = Object.entries(productRevenue).map(([name, revenue]) => ({
        name,
        revenue: revenue / 100, // Convert from pence to pounds
      }));

      // Orders by month
      const monthlyOrders: Record<string, number> = {};
      purchases?.forEach((p) => {
        const month = new Date(p.purchased_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
      });

      const ordersByMonth = Object.entries(monthlyOrders).map(([month, orders]) => ({
        month,
        orders,
      }));

      // Product sales count
      const productSales: Record<string, number> = {};
      purchases?.forEach((p) => {
        const productName = (p.stripe_products as any)?.product_name || "Unknown";
        productSales[productName] = (productSales[productName] || 0) + 1;
      });

      const productSalesData = Object.entries(productSales).map(([name, sales]) => ({
        name,
        sales,
      }));

      setAnalytics({
        totalRevenue: totalRevenue / 100, // Convert to pounds
        totalOrders,
        totalUsers: userCount || 0,
        avgOrderValue: avgOrderValue / 100,
        revenueByProduct,
        ordersByMonth,
        productSales: productSalesData,
      });
    } catch (error: any) {
      toast.error("Failed to fetch analytics: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGA4Data = async () => {
    try {
      setGA4Loading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const url = new URL("https://ppvgibvylsxdybsxufxm.supabase.co/functions/v1/fetch-ga4-data");
      
      if (dateRange) {
        url.searchParams.set("startDate", dateRange.startDate.toISOString().split('T')[0]);
        url.searchParams.set("endDate", dateRange.endDate.toISOString().split('T')[0]);
      } else {
        url.searchParams.set("daysBack", daysBack.toString());
      }

      console.log("Fetching GA4 data from:", url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GA4 fetch error:", errorText);
        throw new Error(`Failed to fetch GA4 data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("GA4 data received:", data);
      setGA4Data(data);
    } catch (error: any) {
      console.error("Failed to fetch GA4 data:", error);
      toast.error("Failed to fetch Google Analytics data: " + error.message);
    } finally {
      setGA4Loading(false);
    }
  };

  const handleDateRangeChange = (range: { startDate: Date; endDate: Date } | null) => {
    setDateRange(range);
  };

  const handlePresetChange = (days: number) => {
    setDaysBack(days);
  };

  if (loading && ga4Loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24">
          <p className="text-muted-foreground text-center">No analytics data available</p>
        </div>
        <Footer />
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Key metrics and insights about sales, revenue, and site traffic
          </p>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="traffic">Google Analytics</TabsTrigger>
            <TabsTrigger value="realtime">Real-time Visitors</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{analytics.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Completed purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{analytics.avgOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product</CardTitle>
              <CardDescription>Total revenue breakdown by product type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenueByProduct}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `£${Number(value).toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders Over Time</CardTitle>
              <CardDescription>Monthly order trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Product Sales Distribution</CardTitle>
              <CardDescription>Number of units sold per product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.productSales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="sales"
                    >
                      {analytics.productSales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-8">
            <DateRangeFilter
              onDateRangeChange={handleDateRangeChange}
              onPresetChange={handlePresetChange}
            />
            
            {ga4Loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : ga4Data ? (
              <>
                {/* GA4 Key Metrics */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ga4Data.pageViews.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ga4Data.sessions.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ga4Data.activeUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ga4Data.conversions.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>
                </div>

                {/* GA4 Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Pages</CardTitle>
                      <CardDescription>Most viewed pages in the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ga4Data.topPages}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="page" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="views" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Traffic Sources</CardTitle>
                      <CardDescription>User acquisition by source</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ga4Data.trafficSources}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="source" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="users" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Device Categories</CardTitle>
                      <CardDescription>User distribution by device type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={ga4Data.deviceCategories}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ device, percent }) => `${device} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="hsl(var(--primary))"
                              dataKey="users"
                            >
                              {ga4Data.deviceCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">No Google Analytics data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="realtime" className="space-y-8">
            <RealtimeVisitors />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminAnalytics;
