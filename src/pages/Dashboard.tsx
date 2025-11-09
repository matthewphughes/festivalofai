import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Shield, LogOut, Video, Calendar } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [replayCount, setReplayCount] = useState(0);

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

    // Get session replay count
    const { count } = await supabase
      .from("sessions")
      .select("*", { count: 'exact', head: true })
      .eq("published", true)
      .not("video_url", "is", null);

    setReplayCount(count || 0);
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

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Event Replays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{replayCount}</p>
              <p className="text-sm text-muted-foreground mb-4">Videos available</p>
              <Button onClick={() => navigate("/replays")} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Watch Replays
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">2025</p>
              <p className="text-sm text-muted-foreground mb-4">Next festival year</p>
              <Button onClick={() => navigate("/schedule")} variant="outline" className="w-full">
                View Schedule
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Manage replays and content</p>
                <Button onClick={() => navigate("/admin")} variant="secondary" className="w-full">
                  <Shield className="mr-2 h-4 w-4" />
                  Go to Admin
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

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
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
