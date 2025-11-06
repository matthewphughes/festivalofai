import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Admin = () => {
  const navigate = useNavigate();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReplay, setEditingReplay] = useState<Replay | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const replayData = {
      title: formData.title,
      description: formData.description,
      video_url: formData.video_url,
      thumbnail_url: formData.thumbnail_url || null,
      event_year: formData.event_year,
      speaker_name: formData.speaker_name || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      published: formData.published,
    };

    if (editingReplay) {
      const { error } = await supabase
        .from("event_replays")
        .update(replayData)
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
        .insert([replayData]);

      if (error) {
        toast.error("Failed to create replay");
      } else {
        toast.success("Replay created successfully");
        setDialogOpen(false);
        resetForm();
        fetchReplays();
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
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage event replays</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/replays")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Replays
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Event Replays</CardTitle>
                <CardDescription>Create and manage event replay videos</CardDescription>
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
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="year">Event Year</Label>
                          <Input
                            id="year"
                            type="number"
                            value={formData.event_year}
                            onChange={(e) => setFormData({ ...formData, event_year: parseInt(e.target.value) })}
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
                        <Label htmlFor="thumbnail">Thumbnail URL</Label>
                        <Input
                          id="thumbnail"
                          type="url"
                          value={formData.thumbnail_url}
                          onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration_minutes}
                          onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
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

export default Admin;