import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowLeft, Video } from "lucide-react";
import { toast } from "sonner";

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

interface Session {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  event_year: number;
  speaker_id: string | null;
  speaker_name: string | null;
  duration_minutes: number | null;
  published: boolean;
  on_agenda: boolean;
  session_date: string | null;
  session_time: string | null;
  session_type: string | null;
  track: string | null;
  price_id: string | null;
}

const AdminSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [speakers, setSpeakers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
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

    await Promise.all([fetchSessions(), fetchSpeakers()]);
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

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        speaker:speakers(name)
      `)
      .order("session_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load sessions");
    } else {
      const formattedSessions = (data || []).map((session: any) => ({
        ...session,
        speaker_name: session.speaker?.name || null,
      }));
      setSessions(formattedSessions);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
          setDialogOpen(false);
          resetForm();
          fetchSessions();
        }
      } else {
        const { error } = await supabase
          .from("sessions")
          .insert([dataToSave]);

        if (error) {
          toast.error("Failed to create session");
        } else {
          toast.success("Session created successfully");
          setDialogOpen(false);
          resetForm();
          fetchSessions();
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

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || "",
      video_url: session.video_url || "",
      thumbnail_url: session.thumbnail_url || "",
      event_year: session.event_year,
      speaker_id: session.speaker_id || "",
      duration_minutes: session.duration_minutes?.toString() || "",
      published: session.published,
      on_agenda: session.on_agenda,
      session_date: session.session_date || "",
      session_time: session.session_time || "",
      session_type: session.session_type || "",
      track: session.track || "",
      price_id: session.price_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete session");
    } else {
      toast.success("Session deleted successfully");
      fetchSessions();
    }
  };

  const resetForm = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Event Sessions</h1>
            <p className="text-muted-foreground">Create and manage event sessions, agenda items, and replays</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Event Sessions</CardTitle>
                <CardDescription>All event sessions with scheduling and replay information</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>{editingSession ? "Edit" : "Add"} Session</DialogTitle>
                      <DialogDescription>
                        {editingSession ? "Update" : "Create a new"} event session
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="date">Session Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.session_date}
                            onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="time">Session Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={formData.session_time}
                            onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="session_type">Session Type</Label>
                          <Select
                            value={formData.session_type}
                            onValueChange={(value) => setFormData({ ...formData, session_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="keynote">Keynote</SelectItem>
                              <SelectItem value="workshop">Workshop</SelectItem>
                              <SelectItem value="session">Session</SelectItem>
                              <SelectItem value="break">Break</SelectItem>
                              <SelectItem value="closing">Closing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="track">Track</Label>
                          <Input
                            id="track"
                            value={formData.track}
                            onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                            placeholder="e.g., Beginner, Advanced"
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
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="price_id">Stripe Price ID (for replay purchases)</Label>
                        <Input
                          id="price_id"
                          value={formData.price_id}
                          onChange={(e) => setFormData({ ...formData, price_id: e.target.value })}
                          placeholder="price_..."
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="thumbnail">Thumbnail Image</Label>
                        <Input
                          id="thumbnail-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          disabled={uploadingThumbnail}
                        />
                        {uploadingThumbnail && (
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        )}
                        {formData.thumbnail_url && (
                          <div className="mt-2">
                            <img 
                              src={formData.thumbnail_url} 
                              alt="Thumbnail preview" 
                              className="w-full max-w-sm rounded-lg border"
                            />
                          </div>
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
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="on_agenda"
                          checked={formData.on_agenda}
                          onCheckedChange={(checked) => setFormData({ ...formData, on_agenda: checked })}
                        />
                        <Label htmlFor="on_agenda">Show on Agenda</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="published"
                          checked={formData.published}
                          onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                        />
                        <Label htmlFor="published">Published (visible to users)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        {editingSession ? "Update" : "Create"} Session
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No sessions yet. Create your first one!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Agenda</TableHead>
                    <TableHead>Replay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>{session.speaker_name || "-"}</TableCell>
                      <TableCell>{session.session_date || "-"}</TableCell>
                      <TableCell>{session.session_type || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={session.on_agenda ? "default" : "secondary"}>
                          {session.on_agenda ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.video_url ? (
                          <Video className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.published ? "default" : "secondary"}>
                          {session.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(session)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminSessions;