import { useEffect, useState, useRef } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Pencil, Trash2, Plus, Upload, Linkedin, Twitter, Globe, Youtube, Instagram } from "lucide-react";
import { toast } from "sonner";

interface Speaker {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
}

const AdminSpeakers = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    company: "",
    bio: "",
    linkedin_url: "",
    twitter_url: "",
    youtube_url: "",
    tiktok_url: "",
    instagram_url: "",
    website_url: "",
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
      navigate("/admin");
      return;
    }

    await fetchSpeakers();
  };

  const fetchSpeakers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("speakers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load speakers");
    } else {
      setSpeakers(data || []);
    }
    setLoading(false);
  };

  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions (max 800x800, maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to optimize image'));
              return;
            }
            const optimizedFile = new File([blob], `${Date.now()}.webp`, {
              type: 'image/webp',
            });
            resolve(optimizedFile);
          },
          'image/webp',
          0.85 // Quality setting
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      try {
        toast.info("Optimizing image...");
        const optimizedFile = await optimizeImage(file);
        setImageFile(optimizedFile);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(optimizedFile);
        
        toast.success("Image optimized and ready to upload");
      } catch (error) {
        toast.error("Failed to optimize image");
        console.error(error);
      }
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.webp`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('speaker-images')
        .upload(filePath, imageFile, {
          contentType: 'image/webp',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('speaker-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedSpeaker(null);
    setFormData({
      name: "",
      title: "",
      company: "",
      bio: "",
      linkedin_url: "",
      twitter_url: "",
      youtube_url: "",
      tiktok_url: "",
      instagram_url: "",
      website_url: "",
    });
    setImagePreview(null);
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleEdit = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setFormData({
      name: speaker.name,
      title: speaker.title || "",
      company: speaker.company || "",
      bio: speaker.bio || "",
      linkedin_url: speaker.linkedin_url || "",
      twitter_url: speaker.twitter_url || "",
      youtube_url: speaker.youtube_url || "",
      tiktok_url: speaker.tiktok_url || "",
      instagram_url: speaker.instagram_url || "",
      website_url: speaker.website_url || "",
    });
    setImagePreview(speaker.image_url);
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      let imageUrl = selectedSpeaker?.image_url || null;

      // Upload new image if one was selected
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          
          // Delete old image if updating
          if (selectedSpeaker?.image_url) {
            const oldPath = selectedSpeaker.image_url.split('/speaker-images/')[1];
            if (oldPath) {
              await supabase.storage
                .from('speaker-images')
                .remove([oldPath]);
            }
          }
        }
      }

      const speakerData = {
        name: formData.name,
        title: formData.title || null,
        company: formData.company || null,
        bio: formData.bio || null,
        image_url: imageUrl,
        linkedin_url: formData.linkedin_url || null,
        twitter_url: formData.twitter_url || null,
        youtube_url: formData.youtube_url || null,
        tiktok_url: formData.tiktok_url || null,
        instagram_url: formData.instagram_url || null,
        website_url: formData.website_url || null,
      };

      if (selectedSpeaker) {
        const { error } = await supabase
          .from("speakers")
          .update(speakerData)
          .eq("id", selectedSpeaker.id);

        if (error) throw error;
        toast.success("Speaker updated successfully");
      } else {
        const { error } = await supabase
          .from("speakers")
          .insert([speakerData]);

        if (error) throw error;
        toast.success("Speaker added successfully");
      }

      setDialogOpen(false);
      await fetchSpeakers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save speaker");
    }
  };

  const handleDeleteClick = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSpeaker) return;

    try {
      // Delete image from storage if exists
      if (selectedSpeaker.image_url) {
        const imagePath = selectedSpeaker.image_url.split('/speaker-images/')[1];
        if (imagePath) {
          await supabase.storage
            .from('speaker-images')
            .remove([imagePath]);
        }
      }

      const { error } = await supabase
        .from("speakers")
        .delete()
        .eq("id", selectedSpeaker.id);

      if (error) throw error;

      toast.success("Speaker deleted successfully");
      setDeleteDialogOpen(false);
      await fetchSpeakers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete speaker");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Speaker Management</h1>
            <p className="text-muted-foreground">Manage event speakers and their details</p>
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
                <CardTitle>All Speakers</CardTitle>
                <CardDescription>Event speakers and their information</CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Speaker
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : speakers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No speakers found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Title & Company</TableHead>
                    <TableHead>Social Links</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speakers.map((speaker) => (
                    <TableRow key={speaker.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={speaker.image_url || undefined} />
                            <AvatarFallback>
                              {speaker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{speaker.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {speaker.title && <div>{speaker.title}</div>}
                          {speaker.company && <div className="text-muted-foreground">{speaker.company}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {speaker.linkedin_url && (
                            <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4 text-muted-foreground hover:text-accent" />
                            </a>
                          )}
                          {speaker.twitter_url && (
                            <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                              <Twitter className="h-4 w-4 text-muted-foreground hover:text-accent" />
                            </a>
                          )}
                          {speaker.youtube_url && (
                            <a href={speaker.youtube_url} target="_blank" rel="noopener noreferrer">
                              <Youtube className="h-4 w-4 text-muted-foreground hover:text-accent" />
                            </a>
                          )}
                          {speaker.instagram_url && (
                            <a href={speaker.instagram_url} target="_blank" rel="noopener noreferrer">
                              <Instagram className="h-4 w-4 text-muted-foreground hover:text-accent" />
                            </a>
                          )}
                          {speaker.tiktok_url && (
                            <a href={speaker.tiktok_url} target="_blank" rel="noopener noreferrer">
                              <svg className="h-4 w-4 text-muted-foreground hover:text-accent" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                              </svg>
                            </a>
                          )}
                          {speaker.website_url && (
                            <a href={speaker.website_url} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4 text-muted-foreground hover:text-accent" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(speaker)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(speaker)}
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

      {/* Edit/Add Speaker Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedSpeaker ? "Edit" : "Add"} Speaker</DialogTitle>
              <DialogDescription>
                {selectedSpeaker ? "Update" : "Add a new"} speaker profile
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Image Upload */}
              <div className="grid gap-2">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imagePreview || undefined} />
                    <AvatarFallback>
                      {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SP'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 10MB. Auto-optimized to WebP
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., CEO, CTO"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Acme Corp"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Speaker biography..."
                />
              </div>

              {/* Social Links */}
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="twitter">Twitter/X URL</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/@..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tiktok">TikTok URL</Label>
                <Input
                  id="tiktok"
                  type="url"
                  value={formData.tiktok_url}
                  onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {selectedSpeaker ? "Update" : "Add"} Speaker
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Speaker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this speaker? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Speaker: <strong>{selectedSpeaker?.name}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Speaker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminSpeakers;
