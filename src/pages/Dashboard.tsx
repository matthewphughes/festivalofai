import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name || "");
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isUserAdmin = roles?.some(r => r.role === "admin") || false;
    setIsAdmin(isUserAdmin);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome, {userName || userEmail}</h1>
            <p className="text-muted-foreground">Your Festival of AI Dashboard</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Panel
              </CardTitle>
              <CardDescription>Manage all aspects of the Festival of AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/admin/analytics")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Analytics Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/users")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>User Management</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/sessions")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Session Management</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/speakers")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Speaker Management</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/stripe-products")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Products & Tickets</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/coupons")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Coupon Management</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/orders")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Order History</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/contacts")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Contact Submissions</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/sponsor-requests")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Sponsor Requests</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/email-settings")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Email Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/site-settings")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Site Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/admin/agenda-builder")}
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span>Agenda Builder</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Navigate to important sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button onClick={() => navigate("/about")} variant="outline" className="h-auto py-4">
                  About the Festival
                </Button>
                <Button onClick={() => navigate("/speakers")} variant="outline" className="h-auto py-4">
                  Our Speakers
                </Button>
                <Button onClick={() => navigate("/venue")} variant="outline" className="h-auto py-4">
                  Venue Information
                </Button>
                <Button onClick={() => navigate("/tickets")} variant="outline" className="h-auto py-4">
                  Get Tickets
                </Button>
                <Button onClick={() => navigate("/replays")} variant="outline" className="h-auto py-4">
                  Event Replays
                </Button>
                <Button onClick={() => navigate("/agenda")} variant="outline" className="h-auto py-4">
                  Event Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
