import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Video, Calendar, ChevronRight, BarChart3, Settings, Mail, ShoppingBag, Tag, Receipt, UserCircle, Mic, MessageSquare, Gift, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReplays: 0,
    publishedReplays: 0,
    draftReplays: 0,
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

    // Fetch session stats
    const { data: sessions } = await supabase
      .from("sessions")
      .select("published");

    const publishedCount = sessions?.filter(s => s.published).length || 0;
    const totalCount = sessions?.length || 0;

    setStats({
      totalUsers: userCount || 0,
      totalReplays: totalCount,
      publishedReplays: publishedCount,
      draftReplays: totalCount - publishedCount,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <CardTitle className="text-sm font-medium">Total Replays</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReplays}</div>
                  <p className="text-xs text-muted-foreground">Event replay videos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.publishedReplays}</div>
                  <p className="text-xs text-muted-foreground">Live on the platform</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.draftReplays}</div>
                  <p className="text-xs text-muted-foreground">Unpublished replays</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>Manage all aspects of the Festival of AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Analytics - Always visible at top */}
                  <Button
                    onClick={() => navigate("/admin/analytics")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Analytics Dashboard
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Content Management */}
                  <Collapsible defaultOpen className="border rounded-lg p-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
                      <span className="font-semibold text-sm">Content Management</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-1">
                      <Button
                        onClick={() => navigate("/admin/sessions")}
                        variant="ghost"
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Session Management
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
                          Agenda Builder
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
                          Speaker Management
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Sales & Commerce */}
                  <Collapsible defaultOpen className="border rounded-lg p-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
                      <span className="font-semibold text-sm">Sales & Commerce</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-1">
                      <Button
                        onClick={() => navigate("/admin/stripe-products")}
                        variant="ghost"
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Products & Tickets
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
                          Coupon Management
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
                          Order History
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* User Management */}
                  <Collapsible defaultOpen className="border rounded-lg p-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
                      <span className="font-semibold text-sm">User Management</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-1">
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
                          Contact Submissions
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
                          Sponsor Requests
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Settings */}
                  <Collapsible defaultOpen className="border rounded-lg p-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
                      <span className="font-semibold text-sm">Settings</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-1">
                      <Button
                        onClick={() => navigate("/admin/email-settings")}
                        variant="ghost"
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Settings
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
                          Site Settings
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
