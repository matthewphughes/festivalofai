import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Download, Search, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SpeakerApplicationDetailPane from "@/components/admin/SpeakerApplicationDetailPane";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/20 text-blue-400",
  reviewed: "bg-yellow-500/20 text-yellow-400",
  shortlist: "bg-purple-500/20 text-purple-400",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const STATUSES = ["draft", "submitted", "reviewed", "shortlist", "accepted", "rejected"];

const AdminSpeakerApplications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [paneOpen, setPaneOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const getCompletionPct = (a: any): number => {
    if (a.status === "submitted") return 100;
    const required = [a.first_name, a.last_name, a.email, a.phone, a.address_line1, a.city, a.postal_code, a.profile_picture_url, a.bio, a.session_title, a.session_description, a.preferred_track];
    const optional = [a.address_line2, a.website_url, a.youtube_url, a.linkedin_url, a.tiktok_url, a.instagram_url, a.supporting_materials, a.additional_comments];
    const rPct = (required.filter(Boolean).length / required.length) * 80;
    const oPct = (optional.filter(Boolean).length / optional.length) * 20;
    return Math.round(rPct + oPct);
  };

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
                {STATUSES.map(s => (
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
                    <TableHead>Completion</TableHead>
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
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={getCompletionPct(app)} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{getCompletionPct(app)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={app.status}
                          onValueChange={s => updateStatusMutation.mutate({ id: app.id, status: s })}
                        >
                          <SelectTrigger className={`w-32 h-7 text-xs border-none ${statusColors[app.status] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {app.submitted_at ? format(new Date(app.submitted_at), "dd MMM yyyy") : format(new Date(app.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setSelectedApp(app); setPaneOpen(true); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {app.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost" size="sm" className="h-8 w-8 p-0"
                                    onClick={() => { setSelectedApp(app); setPaneOpen(true); }}
                                  >
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send reminder</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No applications found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <SpeakerApplicationDetailPane
        app={selectedApp}
        open={paneOpen}
        onOpenChange={setPaneOpen}
      />

      <Footer />
    </div>
  );
};

export default AdminSpeakerApplications;
