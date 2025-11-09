import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Clock, Edit } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  session_date: z.string().optional(),
  session_time: z.string().optional(),
  video_url: z.union([z.string().url("Invalid URL").refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: "Must be a YouTube URL" }
  ), z.literal("")]).optional(),
  thumbnail_url: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  event_year: z.number().int().min(2020, "Year must be 2020 or later").max(2030, "Year must be 2030 or earlier"),
  speaker_id: z.string().uuid().optional(),
  duration_minutes: z.number().int().positive("Duration must be a positive number").max(600, "Duration must be less than 600 minutes").nullable().optional(),
  published: z.boolean(),
  on_agenda: z.boolean(),
  session_type: z.enum(["keynote", "workshop", "break", "closing", "session"]).optional(),
  track: z.string().optional(),
  price_id: z.string().optional(),
});


interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  speaker_id: string | null;
  speaker_name: string | null;
  speaker_slug: string | null;
  duration_minutes: number | null;
}

const PublicReplays = () => {
  const navigate = useNavigate();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [speakers, setSpeakers] = useState<Array<{ id: string; name: string }>>([]);
  const [stripePrices, setStripePrices] = useState<Array<{ id: string; product_name: string; amount: number; currency: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Replay | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    event_year: new Date().getFullYear(),
    speaker_id: "",
    duration_minutes: "",
    published: false,
    on_agenda: false,
    session_date: "",
    session_time: "",
    session_type: "",
    track: "",
    price_id: "",
  });

  useEffect(() => {
    fetchReplays();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      
      // Only fetch admin-specific data if user is admin
      if (adminStatus) {
        fetchSpeakers();
        fetchStripePrices();
      }
    }
  };

  const fetchStripePrices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch products and prices from Stripe via edge function
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke("fetch-stripe-prices");
      
      if (pricesError) {
        console.error("Failed to load Stripe prices", pricesError);
        toast.error("Failed to load Stripe products");
        return;
      }

      setStripePrices(pricesData?.prices || []);
    } catch (error) {
      console.error("Error fetching Stripe prices:", error);
    }
  };

  const fetchSpeakers = async () => {
    const { data, error } = await supabase
      .from("speakers")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Failed to load speakers", error);
    } else {
      setSpeakers(data || []);
    }
  };

  useEffect(() => {
    if (selectedReplay) {
      setPurchaseDialogOpen(true);
    }
  }, [selectedReplay]);

  const fetchReplays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        speaker:speakers(name, slug)
      `)
      .eq("published", true)
      .not("video_url", "is", null)
      .order("event_year", { ascending: false });

    if (error) {
      toast.error("Failed to load replays");
      console.error(error);
    } else {
      const formattedReplays = (data || []).map((session: any) => ({
        ...session,
        speaker_name: session.speaker?.name || null,
        speaker_slug: session.speaker?.slug || null,
      }));
      setReplays(formattedReplays);
    }
    setLoading(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `session-thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-assets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, thumbnail_url: publicUrl });
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        title: formData.title,
        description: formData.description || undefined,
        video_url: formData.video_url || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        event_year: formData.event_year,
        speaker_id: formData.speaker_id || undefined,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        published: formData.published,
        on_agenda: formData.on_agenda,
        session_date: formData.session_date || undefined,
        session_time: formData.session_time || undefined,
        session_type: formData.session_type || undefined,
        track: formData.track || undefined,
        price_id: formData.price_id || undefined,
      };

      const validated = sessionSchema.parse(sessionData);

      const dataToSave = {
        title: validated.title,
        description: validated.description || null,
        video_url: validated.video_url || null,
        thumbnail_url: validated.thumbnail_url || null,
        event_year: validated.event_year,
        speaker_id: validated.speaker_id || null,
        duration_minutes: validated.duration_minutes ?? null,
        published: validated.published,
        on_agenda: validated.on_agenda,
        session_date: validated.session_date || null,
        session_time: validated.session_time || null,
        session_type: validated.session_type || null,
        track: validated.track || null,
        price_id: validated.price_id || null,
      };

      if (editingSession) {
        const { error } = await supabase
          .from("sessions")
          .update(dataToSave)
          .eq("id", editingSession.id);

        if (error) {
          toast.error("Failed to update session");
        } else {
          toast.success("Session updated successfully");
          setEditDialogOpen(false);
          resetEditForm();
          fetchReplays();
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Failed to save session");
      }
    }
  };

  const handleEdit = (replay: Replay) => {
    setEditingSession(replay);
    setFormData({
      title: replay.title,
      description: replay.description || "",
      video_url: replay.video_url || "",
      thumbnail_url: replay.thumbnail_url || "",
      event_year: replay.event_year,
      speaker_id: "", // We'll need to fetch this from speaker_name or use speaker_id if available
      duration_minutes: replay.duration_minutes?.toString() || "",
      published: true, // Since we're only showing published replays
      on_agenda: false,
      session_date: "",
      session_time: "",
      session_type: "",
      track: "",
      price_id: "",
    });
    setEditDialogOpen(true);
  };

  const resetEditForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      event_year: new Date().getFullYear(),
      speaker_id: "",
      duration_minutes: "",
      published: false,
      on_agenda: false,
      session_date: "",
      session_time: "",
      session_type: "",
      track: "",
      price_id: "",
    });
    setEditingSession(null);
  };

  const handlePurchase = async (eventYear: number, replayId?: string) => {
    try {
      setPurchaseLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to purchase replays");
        navigate("/auth");
        return;
      }

      let priceId: string;

      // Individual replay purchase
      if (replayId) {
        // Map replay IDs to price IDs for individual purchases
        const individualPriceIds: { [key: string]: string } = {
          "71069a53-fc6c-401b-a59b-e9bc0c190d20": "price_1SRGqVEFw97UKMysD1m7vbJz", // AI Agents
          "86b57135-c65d-4b75-830c-75c3406fb66a": "price_1SRGqWEFw97UKMysebRMJ0bs", // AI For Six Figure Success
          "3bb799b9-e878-4685-8939-2e31719e0f2f": "price_1SRGqYEFw97UKMysDoqfvnWh", // All Speaker Q & A
          "abbe186e-9f98-4a3f-b524-b6b09ccb7086": "price_1SRGqZEFw97UKMysehqDpL2D", // An AI Powered Super Day
          "a0a3ebe8-ecd5-4bc2-b954-53b381318231": "price_1SRGqaEFw97UKMysVTjSiNyA", // Building A Success Mindset
          "84600d95-d5bc-42e2-909d-cf17a8345ac1": "price_1SRGqbEFw97UKMysnCW9bw0e", // Digital Dominance with AI
          "d4710e51-8981-489f-ada9-58d97d4d069a": "price_1SRGqcEFw97UKMysqlyO5Gs5", // Smarter Design with Canva AI
          "42e8285c-7ad2-4942-ae97-acc40cd1eb06": "price_1SRGqdEFw97UKMyspQ18Ndq9", // The Empathy Engine
          "b7a6c74d-734b-4ea6-854b-278ca4748062": "price_1SRGqfEFw97UKMyse39YIzuV", // Why AI Replacing You Isn't A Bad Thing
        };

        priceId = individualPriceIds[replayId];
        if (!priceId) {
          toast.error("Invalid replay selection");
          return;
        }
      } else {
        // Year bundle purchase
        const bundlePriceIds: { [key: number]: string } = {
          2025: "price_1SRFvHEFw97UKMyskr6hX5xc", // 2025 Replays Bundle
          2026: "price_1SRFvaEFw97UKMysELPzJJDX", // 2026 Replays Bundle
        };

        priceId = bundlePriceIds[eventYear];
        if (!priceId) {
          toast.error("Invalid event year");
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          price_id: priceId,
          product_type: "replay",
          event_year: eventYear,
          replay_id: replayId
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to create checkout session");
    } finally {
      setPurchaseLoading(false);
      setPurchaseDialogOpen(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Event Replays - Festival of AI</title>
        <meta name="description" content="Watch sessions from previous Festival of AI events. Access expert talks on artificial intelligence, machine learning, and emerging AI technologies." />
        <meta property="og:title" content="Event Replays - Festival of AI" />
        <meta property="og:description" content="Watch sessions from previous Festival of AI events" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://festivalof.ai/buy-replays" />
      </Helmet>

      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Event <span className="text-accent">Replays</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Purchase access to expert sessions from Festival of AI. Choose individual replays or full year bundles.
          </p>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {replays.map((replay) => (
              <Card
                key={replay.id}
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="relative aspect-video bg-muted cursor-pointer" onClick={() => setSelectedReplay(replay)}>
                  {replay.thumbnail_url ? (
                    <img
                      src={replay.thumbnail_url}
                      alt={replay.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Play className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {replay.duration_minutes && (
                    <Badge className="absolute bottom-2 right-2 bg-black/70">
                      <Clock className="h-3 w-3 mr-1" />
                      {replay.duration_minutes} min
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedReplay(replay)}>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{replay.title}</h3>
                      {replay.speaker_name && (
                        <p 
                          className="text-sm text-primary mb-2 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (replay.speaker_slug) {
                              navigate(`/speakers/${replay.speaker_slug}`);
                            }
                          }}
                        >
                          {replay.speaker_name}
                        </p>
                      )}
                      {replay.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{replay.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(replay);
                        }}
                        className="shrink-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={(open) => {
        setPurchaseDialogOpen(open);
        if (!open) setSelectedReplay(null);
      }}>
        <DialogContent className="max-w-lg">
          {selectedReplay && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedReplay.title}</DialogTitle>
              </DialogHeader>
              <DialogDescription className="space-y-4">
                <div>
                  <p className="text-base mb-2">
                    <span className="font-semibold">{selectedReplay.speaker_name}</span>
                    {selectedReplay.duration_minutes && (
                      <span className="text-muted-foreground ml-2">
                        {selectedReplay.duration_minutes} minutes
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReplay.description || "Full session replay from Festival of AI"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-base">Single Replay</h4>
                        <p className="text-xs text-muted-foreground">This session only</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">£47</div>
                        <div className="text-xs text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePurchase(selectedReplay.event_year, selectedReplay.id)}
                      disabled={purchaseLoading}
                      className="w-full mt-2"
                      size="sm"
                    >
                      {purchaseLoading ? "Processing..." : "Buy This Replay"}
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-base">Full Year Bundle</h4>
                        <p className="text-xs text-muted-foreground">All {selectedReplay.event_year} replays</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">£99</div>
                        <div className="text-xs text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePurchase(selectedReplay.event_year)}
                      disabled={purchaseLoading}
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                    >
                      {purchaseLoading ? "Processing..." : "Buy Full Bundle"}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Already purchased? <button onClick={() => navigate("/auth")} className="underline hover:text-foreground">Sign in</button> to watch
                </p>
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) resetEditForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update session details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={2000}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="speaker">Speaker</Label>
                  <Select
                    value={formData.speaker_id}
                    onValueChange={(value) => setFormData({ ...formData, speaker_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker..." />
                    </SelectTrigger>
                    <SelectContent>
                      {speakers.map((speaker) => (
                        <SelectItem key={speaker.id} value={speaker.id}>
                          {speaker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Event Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.event_year}
                    onChange={(e) => setFormData({ ...formData, event_year: parseInt(e.target.value) })}
                    min={2020}
                    max={2030}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="video">Replay Video URL (YouTube)</Label>
                <Input
                  id="video"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                  />
                </div>
                {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-32 h-20 object-cover rounded" />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  min={1}
                  max={600}
                  placeholder="e.g., 45"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price_id">Stripe Product</Label>
                <Select
                  value={formData.price_id}
                  onValueChange={(value) => setFormData({ ...formData, price_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Stripe product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stripePrices
                      .filter(price => price.amount) // Only show prices with amounts
                      .map((price) => (
                        <SelectItem key={price.id} value={price.id}>
                          {price.product_name} - £{(price.amount / 100).toFixed(2)} {price.currency.toUpperCase()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the Stripe product/price for individual replay purchases
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicReplays;
