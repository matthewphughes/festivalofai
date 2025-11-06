import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [replays, setReplays] = useState<Replay[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Replay>>({});
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

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

    // Fetch replays and speakers
    await Promise.all([fetchReplays(), fetchSpeakers()]);
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
    const { data, error } = await supabase
      .from("event_replays")
      .select(`
        *,
        speaker:speakers(id, name, bio, title, company, image_url)
      `)
      .order("event_year", { ascending: false });

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


  const replays2025 = replays.filter(r => r.event_year === 2025);
  const replays2026 = replays.filter(r => r.event_year === 2026);

  const handleSpeakerClick = async (speakerId: string | null) => {
    if (!speakerId) return;
    
    const speaker = speakers.find(s => s.id === speakerId);
    if (speaker) {
      setSelectedSpeaker(speaker);
    }
  };

  const ReplayCard = ({ replay }: { replay: Replay }) => {
    const isEditing = editingId === replay.id;

    return (
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
            {isEditing ? (
              <Input
                value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Title"
                className="flex-1"
              />
            ) : (
              <CardTitle className="text-lg">{replay.title}</CardTitle>
            )}
            <div className="flex gap-2">
              <Badge variant="outline">{replay.event_year}</Badge>
              {isAdmin && !isEditing && (
                <Button size="sm" variant="ghost" onClick={() => startEditing(replay)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {isEditing ? (
            <Select
              value={editForm.speaker_id || "none"}
              onValueChange={(value) => setEditForm({ ...editForm, speaker_id: value === "none" ? null : value })}
            >
              <SelectTrigger className="mb-2">
                <SelectValue placeholder="Select Speaker" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="none">No Speaker</SelectItem>
                {speakers.map((speaker) => (
                  <SelectItem key={speaker.id} value={speaker.id}>
                    {speaker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            replay.speaker_name && (
              <button
                onClick={() => handleSpeakerClick(replay.speaker_id)}
                className="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
              >
                by {replay.speaker_name}
              </button>
            )
          )}
          {isEditing ? (
            <Textarea
              value={editForm.description || ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Description"
              rows={3}
            />
          ) : (
            replay.description && (
              <CardDescription className="line-clamp-2">
                {replay.description}
              </CardDescription>
            )
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editForm.duration_minutes || ""}
                  onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) || null })}
                  placeholder="Duration (minutes)"
                  className="w-32"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.published || false}
                    onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                    className="rounded"
                  />
                  Published
                </label>
              </div>
            ) : (
              replay.duration_minutes && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {replay.duration_minutes} min
                </div>
              )
            )}
            {isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(replay.id)} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                {!replay.published && (
                  <Badge variant="secondary">Unpublished</Badge>
                )}
                {isAdmin && (
                  <Button 
                    size="sm" 
                    variant={replay.published ? "outline" : "default"}
                    onClick={() => togglePublished(replay.id, replay.published)}
                  >
                    {replay.published ? "Unpublish" : "Publish"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
