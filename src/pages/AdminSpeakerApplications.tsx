import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Download, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/20 text-blue-400",
  reviewed: "bg-yellow-500/20 text-yellow-400",
  shortlist: "bg-purple-500/20 text-purple-400",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const AdminSpeakerApplications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!data) { toast.error("Access denied"); navigate("/"); }
    };
    check();
  }, [navigate]);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["speakerApplications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speaker_applications" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("speaker_applications" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      toast.success("Status updated");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes: string }) => {
      const { error } = await supabase
        .from("speaker_applications" as any)
        .update({ admin_notes } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      toast.success("Notes saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("speaker_applications" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      setDialogOpen(false);
      toast.success("Application deleted");
    },
  });

  const convertToSpeakerMutation = useMutation({
    mutationFn: async (app: any) => {
      const fullName = `${app.first_name || ""} ${app.last_name || ""}`.trim();
      if (!fullName) throw new Error("Speaker name is required");

      // Generate slug using the DB function
      const { data: slug, error: slugError } = await supabase.rpc("generate_speaker_slug", { speaker_name: fullName });
      if (slugError) throw slugError;

      // Get max display_order
      const { data: speakers } = await supabase.from("speakers").select("display_order").order("display_order", { ascending: false }).limit(1);
      const nextOrder = (speakers?.[0]?.display_order ?? 0) + 1;

      // Insert speaker
      const { data: newSpeaker, error: speakerError } = await supabase
        .from("speakers")
        .insert({
          name: fullName,
          slug,
          bio: app.bio || null,
          image_url: app.profile_picture_url || null,
          website_url: app.website_url || null,
          youtube_url: app.youtube_url || null,
          linkedin_url: app.linkedin_url || null,
          instagram_url: app.instagram_url || null,
          tiktok_url: app.tiktok_url || null,
          years: [2026],
          display_order: nextOrder,
        })
        .select("id")
        .single();
      if (speakerError) throw speakerError;

      // Create session if session_title exists
      if (app.session_title) {
        const { error: sessionError } = await supabase
          .from("sessions")
          .insert({
            title: app.session_title,
            description: app.session_description || null,
            event_year: 2026,
            speaker_name: fullName,
            speaker_id: newSpeaker.id,
            video_url: "",
            published: false,
          });
        if (sessionError) throw sessionError;
      }

      return newSpeaker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      queryClient.invalidateQueries({ queryKey: ["speakers"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDialogOpen(false);
      toast.success("Speaker profile and session created successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to convert: ${error.message}`);
    },
  });

  const filtered = useMemo(() => {
    if (!applications) return [];
    return applications.filter((a: any) => {
      const matchesSearch = !searchQuery ||
        `${a.first_name} ${a.last_name} ${a.email} ${a.session_title}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["First Name", "Last Name", "Email", "Phone", "Session Title", "Track", "Status", "Submitted"];
    const rows = filtered.map((a: any) => [
      a.first_name, a.last_name, a.email, a.phone, a.session_title,
      a.preferred_track, a.status, a.submitted_at ? format(new Date(a.submitted_at), "yyyy-MM-dd") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: string) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "speaker-applications.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Speaker Applications</h1>
              <p className="text-muted-foreground">{applications?.length || 0} total applications</p>
            </div>
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or session..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {["draft", "submitted", "reviewed", "shortlist", "accepted", "rejected"].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={app.profile_picture_url} />
                            <AvatarFallback>{(app.first_name?.[0] || "") + (app.last_name?.[0] || "")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{app.first_name} {app.last_name}</p>
                            <p className="text-xs text-muted-foreground">{app.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{app.session_title || "—"}</TableCell>
                      <TableCell className="capitalize">{app.preferred_track || "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[app.status] || ""} variant="secondary">{app.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {app.submitted_at ? format(new Date(app.submitted_at), "dd MMM yyyy") : format(new Date(app.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedApp(app); setEditingNotes(app.admin_notes || ""); setDialogOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No applications found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar><AvatarImage src={selectedApp.profile_picture_url} /><AvatarFallback>{(selectedApp.first_name?.[0] || "") + (selectedApp.last_name?.[0] || "")}</AvatarFallback></Avatar>
                  {selectedApp.first_name} {selectedApp.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Select value={selectedApp.status} onValueChange={s => { updateStatusMutation.mutate({ id: selectedApp.id, status: s }); setSelectedApp({ ...selectedApp, status: s }); }}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["draft", "submitted", "reviewed", "shortlist", "accepted", "rejected"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete application?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(selectedApp.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Email</p><p className="text-foreground">{selectedApp.email}</p></div>
                  <div><p className="text-muted-foreground">Phone</p><p className="text-foreground">{selectedApp.phone}</p></div>
                  <div><p className="text-muted-foreground">Address</p><p className="text-foreground">{[selectedApp.address_line1, selectedApp.address_line2, selectedApp.city, selectedApp.postal_code].filter(Boolean).join(", ")}</p></div>
                  <div><p className="text-muted-foreground">Track</p><p className="text-foreground capitalize">{selectedApp.preferred_track || "—"}</p></div>
                </div>

                <div><p className="text-muted-foreground text-sm mb-1">Session Title</p><p className="text-foreground font-medium">{selectedApp.session_title || "—"}</p></div>
                <div><p className="text-muted-foreground text-sm mb-1">Session Description</p><p className="text-foreground text-sm whitespace-pre-wrap">{selectedApp.session_description || "—"}</p></div>
                <div><p className="text-muted-foreground text-sm mb-1">Bio</p><p className="text-foreground text-sm whitespace-pre-wrap">{selectedApp.bio || "—"}</p></div>

                {(selectedApp.website_url || selectedApp.youtube_url || selectedApp.linkedin_url || selectedApp.tiktok_url || selectedApp.instagram_url) && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Social Links</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.website_url && <a href={selectedApp.website_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">Website</a>}
                      {selectedApp.youtube_url && <a href={selectedApp.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">YouTube</a>}
                      {selectedApp.linkedin_url && <a href={selectedApp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">LinkedIn</a>}
                      {selectedApp.tiktok_url && <a href={selectedApp.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">TikTok</a>}
                      {selectedApp.instagram_url && <a href={selectedApp.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">Instagram</a>}
                    </div>
                  </div>
                )}

                {selectedApp.supporting_materials && <div><p className="text-muted-foreground text-sm mb-1">Supporting Materials</p><p className="text-foreground text-sm whitespace-pre-wrap">{selectedApp.supporting_materials}</p></div>}
                {selectedApp.additional_comments && <div><p className="text-muted-foreground text-sm mb-1">Additional Comments</p><p className="text-foreground text-sm whitespace-pre-wrap">{selectedApp.additional_comments}</p></div>}

                <div>
                  <p className="text-muted-foreground text-sm mb-2">Admin Notes</p>
                  <Textarea value={editingNotes} onChange={e => setEditingNotes(e.target.value)} rows={4} placeholder="Internal notes..." />
                  <Button size="sm" className="mt-2" onClick={() => updateNotesMutation.mutate({ id: selectedApp.id, admin_notes: editingNotes })}>
                    Save Notes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminSpeakerApplications;
