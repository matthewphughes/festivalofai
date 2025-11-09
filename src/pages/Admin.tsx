import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Calendar, ArrowRight, Settings, Building2, Mail } from "lucide-react";
import { toast } from "sonner";

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Sessions</CardTitle>
                  <CardDescription>Manage event sessions and replays</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create, edit, and manage event sessions with dates, times, and replays.
                  </p>
                  <Button onClick={() => navigate("/admin/sessions")} className="w-full">
                    Manage Sessions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agenda Builder</CardTitle>
                  <CardDescription>Curate the public agenda</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which sessions appear on the public agenda and set their order.
                  </p>
                  <Button onClick={() => navigate("/admin/agenda-builder")} className="w-full">
                    Build Agenda
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage users</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View registered users and manage their access and roles.
                  </p>
                  <Button onClick={() => navigate("/admin/users")} className="w-full">
                    Manage Users
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Speaker Management</CardTitle>
                  <CardDescription>Manage event speakers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add, edit, and manage speaker profiles and their details.
                  </p>
                  <Button onClick={() => navigate("/admin/speakers")} className="w-full">
                    Manage Speakers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Submissions</CardTitle>
                  <CardDescription>View contact form messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage contact form submissions from the website.
                  </p>
                  <Button onClick={() => navigate("/admin/contacts")} className="w-full">
                    View Contacts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sponsor Requests</CardTitle>
                  <CardDescription>View sponsor pack requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage sponsor pack requests from potential sponsors.
                  </p>
                  <Button onClick={() => navigate("/admin/sponsor-requests")} className="w-full">
                    View Requests
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Settings</CardTitle>
                  <CardDescription>Manage site configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update site title, logo, description and share image.
                  </p>
                  <Button onClick={() => navigate("/admin/site-settings")} className="w-full">
                    Manage Settings
                    <ArrowRight className="ml-2 h-4 w-4" />
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
