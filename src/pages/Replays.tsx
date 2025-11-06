import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, LogOut, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  speaker_name: string | null;
  duration_minutes: number | null;
  published: boolean;
}

const Replays = () => {
  const navigate = useNavigate();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isUserAdmin = roles?.some(r => r.role === "admin") || false;
    setIsAdmin(isUserAdmin);

    // Fetch replays
    await fetchReplays();
  };

  const fetchReplays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_replays")
      .select("*")
      .order("event_year", { ascending: false });

    if (error) {
      toast.error("Failed to load replays");
      console.error(error);
    } else {
      setReplays(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const replays2025 = replays.filter(r => r.event_year === 2025);
  const replays2026 = replays.filter(r => r.event_year === 2026);

  const ReplayCard = ({ replay }: { replay: Replay }) => (
    <Card key={replay.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted">
        <iframe
          src={getYouTubeEmbedUrl(replay.video_url)}
          title={replay.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-lg">{replay.title}</CardTitle>
          <Badge variant="outline">{replay.event_year}</Badge>
        </div>
        {replay.speaker_name && (
          <p className="text-sm font-medium text-muted-foreground">by {replay.speaker_name}</p>
        )}
        {replay.description && (
          <CardDescription className="line-clamp-2">
            {replay.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {replay.duration_minutes && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {replay.duration_minutes} min
          </div>
        )}
        {!replay.published && (
          <Badge variant="secondary" className="mt-2">Unpublished</Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">Event Replays</h1>
            <p className="text-muted-foreground">
              Watch sessions from Festival of AI Events
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => navigate("/admin")} variant="secondary">
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Button>
            )}
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading replays...</p>
          </div>
        ) : replays.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No replays available yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="2025" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="2025">2025 Replays ({replays2025.length})</TabsTrigger>
              <TabsTrigger value="2026">2026 Replays ({replays2026.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="2025" className="mt-6">
              {replays2025.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No 2025 replays available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays2025.map((replay) => (
                    <ReplayCard key={replay.id} replay={replay} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="2026" className="mt-6">
              {replays2026.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No 2026 replays available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays2026.map((replay) => (
                    <ReplayCard key={replay.id} replay={replay} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Replays;
