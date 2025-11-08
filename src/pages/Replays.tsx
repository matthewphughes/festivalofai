import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, LogOut, Shield, ArrowLeft, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import ReplayCard from "@/components/ReplayCard";


// Validation schema for replay editing
const replayEditSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(200, { message: "Title must be less than 200 characters" }),
  speaker_name: z.string().trim().max(100, { message: "Speaker name must be less than 100 characters" }).nullable(),
  description: z.string().trim().max(1000, { message: "Description must be less than 1000 characters" }).nullable(),
  duration_minutes: z.number().int().positive().max(999, { message: "Duration must be less than 999 minutes" }).nullable(),
});

interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  speaker_name: string | null;
  speaker_id: string | null;
  duration_minutes: number | null;
  published: boolean;
}

interface Speaker {
  id: string;
  name: string;
  bio: string | null;
  title: string | null;
  company: string | null;
  image_url: string | null;
}

const Replays = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Replay>>({});
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [purchasedYears, setPurchasedYears] = useState<number[]>([]);
  const [verifyingPurchase, setVerifyingPurchase] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      verifyPurchase(sessionId);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?redirect=/replays");
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

    // Fetch purchased years
    await checkPurchasedYears();

    // Fetch replays and speakers
    await Promise.all([fetchReplays(), fetchSpeakers()]);
  };

  const checkPurchasedYears = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("replay_purchases")
      .select("event_year")
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error fetching purchases:", error);
      return;
    }

    setPurchasedYears(data?.map(p => p.event_year) || []);
  };

  const verifyPurchase = async (sessionId: string) => {
    setVerifyingPurchase(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-purchase", {
        body: { session_id: sessionId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Purchase successful! You now have access to the replays.");
        await checkPurchasedYears();
        navigate("/replays", { replace: true });
      }
    } catch (error) {
      console.error("Error verifying purchase:", error);
      toast.error("Failed to verify purchase. Please contact support.");
    } finally {
      setVerifyingPurchase(false);
    }
  };

  const fetchSpeakers = async () => {
    const { data, error } = await supabase
      .from("speakers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Failed to load speakers", error);
    } else {
      setSpeakers(data || []);
    }
  };

  const fetchReplays = async () => {
    setLoading(true);
    
    // Admins see all, regular users only see published
    const query = supabase
      .from("event_replays")
      .select(`
        *,
        speaker:speakers(id, name, bio, title, company, image_url)
      `)
      .order("event_year", { ascending: false });

    // Non-admins only see published replays
    const { data: { session } } = await supabase.auth.getSession();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session?.user?.id || "");
    
    const isUserAdmin = roles?.some(r => r.role === "admin") || false;
    
    if (!isUserAdmin) {
      query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load replays");
      console.error(error);
    } else {
      // Flatten speaker data
      const formattedReplays = (data || []).map((replay: any) => ({
        ...replay,
        speaker_name: replay.speaker?.name || replay.speaker_name,
      }));
      setReplays(formattedReplays);
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

  const startEditing = (replay: Replay) => {
    setEditingId(replay.id);
    setEditForm({
      title: replay.title,
      speaker_id: replay.speaker_id,
      description: replay.description,
      duration_minutes: replay.duration_minutes,
      published: replay.published,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (replayId: string) => {
    try {
      // Validate inputs
      const validationResult = replayEditSchema.safeParse({
        title: editForm.title,
        speaker_name: editForm.speaker_name || null,
        description: editForm.description || null,
        duration_minutes: editForm.duration_minutes || null,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const { error } = await supabase
        .from("event_replays")
        .update({
          title: validationResult.data.title,
          speaker_id: editForm.speaker_id || null,
          description: validationResult.data.description,
          duration_minutes: validationResult.data.duration_minutes,
          published: editForm.published,
        })
        .eq("id", replayId);

      if (error) {
        toast.error("Failed to update replay");
        console.error(error);
        return;
      }

      toast.success("Replay updated successfully");
      setEditingId(null);
      setEditForm({});
      await fetchReplays();
    } catch (error) {
      toast.error("An error occurred while updating");
      console.error(error);
    }
  };

  const togglePublished = async (replayId: string, currentPublished: boolean) => {
    const { error } = await supabase
      .from("event_replays")
      .update({ published: !currentPublished })
      .eq("id", replayId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(currentPublished ? "Replay unpublished" : "Replay published");
    await fetchReplays();
  };


  const replays2025 = useMemo(() => {
    const yearReplays = replays.filter(r => r.event_year === 2025);
    // Filter based on purchase status for non-admins
    if (isAdmin) return yearReplays;
    return purchasedYears.includes(2025) ? yearReplays : [];
  }, [replays, isAdmin, purchasedYears]);
  
  const replays2026 = useMemo(() => {
    const yearReplays = replays.filter(r => r.event_year === 2026);
    // Filter based on purchase status for non-admins
    if (isAdmin) return yearReplays;
    return purchasedYears.includes(2026) ? yearReplays : [];
  }, [replays, isAdmin, purchasedYears]);

  const handleSpeakerClick = useCallback((speakerId: string | null) => {
    if (!speakerId) return;
    
    const speaker = speakers.find(s => s.id === speakerId);
    if (speaker) {
      setSelectedSpeaker(speaker);
    }
  }, [speakers]);

  const handleEditFormChange = useCallback((field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        {verifyingPurchase && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <p className="text-primary font-medium">Verifying your purchase...</p>
          </div>
        )}
        
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
              {!isAdmin && !purchasedYears.includes(2025) ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">Purchase access to 2025 replays</p>
                    <p className="text-muted-foreground">Get unlimited access to all 2025 event sessions</p>
                    <Button onClick={() => navigate("/watch-replays")} size="lg">
                      View & Purchase Replays
                    </Button>
                  </CardContent>
                </Card>
              ) : replays2025.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No 2025 replays available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays2025.map((replay) => (
                    <ReplayCard
                      key={replay.id}
                      replay={replay}
                      isEditing={editingId === replay.id}
                      isAdmin={isAdmin}
                      editForm={editForm}
                      speakers={speakers}
                      onStartEdit={startEditing}
                      onCancelEdit={cancelEditing}
                      onSaveEdit={saveEdit}
                      onTogglePublished={togglePublished}
                      onSpeakerClick={handleSpeakerClick}
                      onEditFormChange={handleEditFormChange}
                      getYouTubeEmbedUrl={getYouTubeEmbedUrl}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="2026" className="mt-6">
              {!isAdmin && !purchasedYears.includes(2026) ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">Purchase access to 2026 replays</p>
                    <p className="text-muted-foreground">Get unlimited access to all 2026 event sessions</p>
                    <Button onClick={() => navigate("/watch-replays")} size="lg">
                      View & Purchase Replays
                    </Button>
                  </CardContent>
                </Card>
              ) : replays2026.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No 2026 replays available yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {replays2026.map((replay) => (
                    <ReplayCard
                      key={replay.id}
                      replay={replay}
                      isEditing={editingId === replay.id}
                      isAdmin={isAdmin}
                      editForm={editForm}
                      speakers={speakers}
                      onStartEdit={startEditing}
                      onCancelEdit={cancelEditing}
                      onSaveEdit={saveEdit}
                      onTogglePublished={togglePublished}
                      onSpeakerClick={handleSpeakerClick}
                      onEditFormChange={handleEditFormChange}
                      getYouTubeEmbedUrl={getYouTubeEmbedUrl}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />

      {/* Speaker Profile Dialog */}
      <Dialog open={!!selectedSpeaker} onOpenChange={() => setSelectedSpeaker(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-4">
              {selectedSpeaker?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedSpeaker && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {selectedSpeaker.image_url && (
                  <img
                    src={selectedSpeaker.image_url}
                    alt={selectedSpeaker.name}
                    className="w-full md:w-48 h-48 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  {selectedSpeaker.title && (
                    <p className="text-accent font-semibold text-xl mb-2">
                      {selectedSpeaker.title}
                    </p>
                  )}
                  {selectedSpeaker.company && (
                    <p className="text-muted-foreground mb-4">
                      {selectedSpeaker.company}
                    </p>
                  )}
                  {selectedSpeaker.bio && (
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedSpeaker.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Replays;
