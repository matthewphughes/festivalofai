import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Edit2, Save, X, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import MinimalFooter from "@/components/MinimalFooter";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  year: string;
  thumbnail_url: string | null;
  video_url: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    quote: "",
    author: "",
    year: "",
    thumbnail_url: "",
    video_url: "",
    is_published: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const maxOrder = testimonials.length > 0 
        ? Math.max(...testimonials.map(t => t.display_order))
        : -1;

      const { error } = await supabase.from("testimonials").insert({
        ...formData,
        display_order: maxOrder + 1,
      });

      if (error) throw error;

      toast.success("Testimonial created successfully");
      setIsCreating(false);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error creating testimonial:", error);
      toast.error("Failed to create testimonial");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Testimonial updated successfully");
      setEditingId(null);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast.error("Failed to update testimonial");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Testimonial deleted successfully");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const startEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData({
      quote: testimonial.quote,
      author: testimonial.author,
      year: testimonial.year,
      thumbnail_url: testimonial.thumbnail_url || "",
      video_url: testimonial.video_url || "",
      is_published: testimonial.is_published,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      quote: "",
      author: "",
      year: "",
      thumbnail_url: "",
      video_url: "",
      is_published: true,
    });
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_published: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Testimonial ${!currentStatus ? "published" : "unpublished"}`);
      fetchTestimonials();
    } catch (error) {
      console.error("Error toggling published status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Manage Testimonials - Admin</title>
      </Helmet>
      
      <Navigation />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manage Testimonials</h1>
          <p className="text-muted-foreground">
            Add, edit, and organize video testimonials for the homepage
          </p>
        </div>

        <div className="mb-6">
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Testimonial
          </Button>
        </div>

        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Testimonial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-quote">Quote *</Label>
                <Textarea
                  id="new-quote"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="Enter testimonial quote..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-author">Author *</Label>
                  <Input
                    id="new-author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g., Sarah M., Tech Entrepreneur"
                  />
                </div>

                <div>
                  <Label htmlFor="new-year">Year *</Label>
                  <Input
                    id="new-year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-thumbnail">Thumbnail URL</Label>
                  <Input
                    id="new-thumbnail"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="new-video">Video URL</Label>
                  <Input
                    id="new-video"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://vimeo.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="new-published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="new-published">Published</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreate}>
                  <Save className="w-4 h-4 mr-2" />
                  Create
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No testimonials yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-6">
                  {editingId === testimonial.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`quote-${testimonial.id}`}>Quote *</Label>
                        <Textarea
                          id={`quote-${testimonial.id}`}
                          value={formData.quote}
                          onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`author-${testimonial.id}`}>Author *</Label>
                          <Input
                            id={`author-${testimonial.id}`}
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`year-${testimonial.id}`}>Year *</Label>
                          <Input
                            id={`year-${testimonial.id}`}
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`thumbnail-${testimonial.id}`}>Thumbnail URL</Label>
                          <Input
                            id={`thumbnail-${testimonial.id}`}
                            value={formData.thumbnail_url}
                            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`video-${testimonial.id}`}>Video URL</Label>
                          <Input
                            id={`video-${testimonial.id}`}
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`published-${testimonial.id}`}
                          checked={formData.is_published}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                        />
                        <Label htmlFor={`published-${testimonial.id}`}>Published</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdate(testimonial.id)}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="cursor-move">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="italic text-foreground/90 mb-2">"{testimonial.quote}"</p>
                            <p className="text-sm font-semibold text-accent">— {testimonial.author}</p>
                            <p className="text-xs text-muted-foreground mt-1">Year: {testimonial.year}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={testimonial.is_published ? "default" : "secondary"}>
                              {testimonial.is_published ? "Published" : "Unpublished"}
                            </Badge>
                          </div>
                        </div>

                        {(testimonial.thumbnail_url || testimonial.video_url) && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-3">
                            {testimonial.thumbnail_url && (
                              <p>Thumbnail: {testimonial.thumbnail_url.substring(0, 50)}...</p>
                            )}
                            {testimonial.video_url && (
                              <p>Video: {testimonial.video_url.substring(0, 50)}...</p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(testimonial)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePublished(testimonial.id, testimonial.is_published)}
                          >
                            {testimonial.is_published ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(testimonial.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MinimalFooter />
    </div>
  );
};

export default AdminTestimonials;
