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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Download, Search, Mail, Trash2, Send } from "lucide-react";
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

  // Email compose modal state (for inline status change + mail icon)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<"status" | "reminder">("status");
  const [emailModalApp, setEmailModalApp] = useState<any>(null);
  const [emailPendingStatus, setEmailPendingStatus] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");

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
      toast.success("Application deleted");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ app, type, message, newStatus }: { app: any; type: "status" | "reminder"; message: string; newStatus?: string }) => {
      // Update status in DB if it's a status change
      if (type === "status" && newStatus) {
        const { error } = await supabase
          .from("speaker_applications" as any)
          .update({ status: newStatus } as any)
          .eq("id", app.id);
        if (error) throw error;
      }

      if (!app.email) {
        // No email - just update status silently
        return { success: true, noEmail: true };
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-speaker-reminder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            applicationId: app.id,
            email: app.email,
            firstName: app.first_name,
            sessionId: app.session_id,
            applicationLink: `https://festivalof.ai/call-for-speakers?resume=${app.session_id}`,
            customMessage: message || undefined,
            emailType: type,
            newStatus: newStatus || undefined,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email");
      }
      return res.json();
    },
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      setEmailModalOpen(false);
      setEmailCustomMessage("");
      if (result?.noEmail) {
        toast.success("Status updated");
      } else {
        toast.success(vars.type === "status" ? "Status updated & email sent" : "Reminder email sent!");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleStatusChange = (app: any, newStatus: string) => {
    setEmailModalApp(app);
    setEmailPendingStatus(newStatus);
    setEmailModalMode("status");
    setEmailCustomMessage("");
    setEmailModalOpen(true);
  };

  const handleSendReminder = (app: any) => {
    setEmailModalApp(app);
    setEmailModalMode("reminder");
    setEmailCustomMessage("");
    setEmailModalOpen(true);
  };

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
                          onValueChange={s => handleStatusChange(app, s)}
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
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleSendReminder(app)}>
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send email</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <AlertDialog>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete application?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {app.first_name} {app.last_name}'s application. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(app.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Email compose modal (shared for status change + reminder from table) */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {emailModalMode === "status"
                ? `Status change → ${emailPendingStatus}`
                : "Send reminder email"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {emailModalMode === "status"
                ? `${emailModalApp?.email ? `An email will be sent to ${emailModalApp.email} notifying them.` : "No email on this application — status will be updated without notification."} You can add a personal message below.`
                : `A reminder email will be sent to ${emailModalApp?.email} with a link to continue their application.`}
            </p>
            <div>
              <Label className="text-sm">Personal message (optional)</Label>
              <div className="mt-1.5 border border-border rounded-md overflow-hidden">
                <div className="flex gap-1 p-1.5 border-b border-border bg-muted/30">
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold"
                    onClick={() => setEmailCustomMessage(prev => prev + "<b></b>")}>B</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs italic"
                    onClick={() => setEmailCustomMessage(prev => prev + "<i></i>")}>I</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs underline"
                    onClick={() => setEmailCustomMessage(prev => prev + "<u></u>")}>U</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs"
                    onClick={() => setEmailCustomMessage(prev => prev + '<a href="">link</a>')}>🔗</Button>
                </div>
                <Textarea
                  rows={6}
                  value={emailCustomMessage}
                  onChange={e => setEmailCustomMessage(e.target.value)}
                  placeholder="Add a personal note to include in the email..."
                  className="border-0 rounded-none focus-visible:ring-0 resize-none"
                />
              </div>
              {emailCustomMessage && (
                <div className="mt-2 p-3 bg-muted/30 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: emailCustomMessage }} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {emailModalMode === "status" && (
              <Button variant="outline" onClick={() => {
                sendEmailMutation.mutate({ app: emailModalApp, type: "status", message: "", newStatus: emailPendingStatus });
              }}>
                Update without email
              </Button>
            )}
            {emailModalMode === "reminder" && (
              <Button variant="outline" onClick={() => setEmailModalOpen(false)}>Cancel</Button>
            )}
            <Button
              onClick={() => sendEmailMutation.mutate({
                app: emailModalApp,
                type: emailModalMode,
                message: emailCustomMessage,
                newStatus: emailModalMode === "status" ? emailPendingStatus : undefined,
              })}
              disabled={sendEmailMutation.isPending || (emailModalMode === "reminder" && !emailModalApp?.email)}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendEmailMutation.isPending ? "Sending..." : "Send & Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminSpeakerApplications;
