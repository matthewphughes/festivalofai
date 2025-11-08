import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const replaySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  video_url: z.string().url("Invalid URL").refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: "Must be a YouTube URL" }
  ),
  thumbnail_url: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  event_year: z.number().int().min(2020, "Year must be 2020 or later").max(2030, "Year must be 2030 or earlier"),
  speaker_name: z.string().trim().max(100, "Speaker name must be less than 100 characters").optional(),
  duration_minutes: z.number().int().positive("Duration must be a positive number").max(600, "Duration must be less than 600 minutes").nullable().optional(),
  published: z.boolean(),
});

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

const AdminReplays = () => {
  const navigate = useNavigate();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReplay, setEditingReplay] = useState<Replay | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    event_year: new Date().getFullYear(),
    speaker_name: "",
    duration_minutes: "",
    published: false,
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

    await fetchReplays();
  };

  const fetchReplays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_replays")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load replays");
    } else {
      setReplays(data || []);
    }
    setLoading(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `replay-thumbnails/${fileName}`;

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
      const replayData = {
        title: formData.title,
        description: formData.description || undefined,
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url || undefined,
        event_year: formData.event_year,
        speaker_name: formData.speaker_name || undefined,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        published: formData.published,
      };

      // Validate with Zod schema
      const validated = replaySchema.parse(replayData);

      const dataToSave = {
        title: validated.title,
        description: validated.description || null,
        video_url: validated.video_url,
        thumbnail_url: validated.thumbnail_url || null,
        event_year: validated.event_year,
        speaker_name: validated.speaker_name || null,
        duration_minutes: validated.duration_minutes ?? null,
        published: validated.published,
      };

      if (editingReplay) {
        const { error } = await supabase
          .from("event_replays")
          .update(dataToSave)
          .eq("id", editingReplay.id);

        if (error) {
          toast.error("Failed to update replay");
        } else {
          toast.success("Replay updated successfully");
          setDialogOpen(false);
          resetForm();
          fetchReplays();
        }
      } else {
        const { error } = await supabase
          .from("event_replays")
          .insert([dataToSave]);

        if (error) {
          toast.error("Failed to create replay");
        } else {
          toast.success("Replay created successfully");
          setDialogOpen(false);
          resetForm();
          fetchReplays();
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Failed to save replay");
      }
    }
  };

  const handleEdit = (replay: Replay) => {
    setEditingReplay(replay);
    setFormData({
      title: replay.title,
      description: replay.description || "",
      video_url: replay.video_url,
      thumbnail_url: replay.thumbnail_url || "",
      event_year: replay.event_year,
      speaker_name: replay.speaker_name || "",
      duration_minutes: replay.duration_minutes?.toString() || "",
      published: replay.published,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this replay?")) return;

    const { error } = await supabase
      .from("event_replays")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete replay");
    } else {
      toast.success("Replay deleted successfully");
      fetchReplays();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      event_year: new Date().getFullYear(),
      speaker_name: "",
      duration_minutes: "",
      published: false,
    });
    setEditingReplay(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Event Replays</h1>
            <p className="text-muted-foreground">Create and manage event replay videos</p>
          </div>
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Event Replays</CardTitle>
                <CardDescription>All event replay videos</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Replay
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>{editingReplay ? "Edit" : "Add"} Replay</DialogTitle>
                      <DialogDescription>
                        {editingReplay ? "Update" : "Create a new"} event replay video
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
                          <Label htmlFor="speaker">Speaker Name</Label>
                          <Input
                            id="speaker"
                            value={formData.speaker_name}
                            onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
                            maxLength={100}
                          />
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
                        <Label htmlFor="video">Video URL</Label>
                        <Input
                          id="video"
                          type="url"
                          value={formData.video_url}
                          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          placeholder="https://youtube.com/..."
                          required
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
                          id="published"
                          checked={formData.published}
                          onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                        />
                        <Label htmlFor="published">Published (visible to users)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        {editingReplay ? "Update" : "Create"} Replay
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
            ) : replays.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No replays yet. Create your first one!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {replays.map((replay) => (
                    <TableRow key={replay.id}>
                      <TableCell className="font-medium">{replay.title}</TableCell>
                      <TableCell>{replay.speaker_name || "-"}</TableCell>
                      <TableCell>{replay.event_year}</TableCell>
                      <TableCell>
                        <Badge variant={replay.published ? "default" : "secondary"}>
                          {replay.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(replay)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(replay.id)}
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

export default AdminReplays;
