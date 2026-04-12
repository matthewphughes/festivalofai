import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, Mail, Save } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/20 text-blue-400",
  reviewed: "bg-yellow-500/20 text-yellow-400",
  shortlist: "bg-purple-500/20 text-purple-400",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const STATUSES = ["draft", "submitted", "reviewed", "shortlist", "accepted", "rejected"];

interface Props {
  app: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SpeakerApplicationDetailPane = ({ app, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (app) setForm({ ...app });
  }, [app]);

  const updateField = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, created_at, updated_at, ...fields } = form;
      const { error } = await supabase
        .from("speaker_applications" as any)
        .update(fields as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      toast.success("Application saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("speaker_applications" as any)
        .delete()
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      onOpenChange(false);
      toast.success("Application deleted");
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      if (!form.email) throw new Error("No email address on this application");
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
            applicationId: form.id,
            email: form.email,
            firstName: form.first_name,
            sessionId: form.session_id,
            applicationLink: `https://festivalofai.lovable.app/call-for-speakers?resume=${form.session_id}`,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send reminder");
      }
      return res.json();
    },
    onSuccess: () => toast.success("Reminder email sent!"),
    onError: (e: any) => toast.error(e.message),
  });

  const convertToSpeakerMutation = useMutation({
    mutationFn: async () => {
      const fullName = `${form.first_name || ""} ${form.last_name || ""}`.trim();
      if (!fullName) throw new Error("Speaker name is required");

      const { data: slug, error: slugError } = await supabase.rpc("generate_speaker_slug", { speaker_name: fullName });
      if (slugError) throw slugError;

      const { data: speakers } = await supabase.from("speakers").select("display_order").order("display_order", { ascending: false }).limit(1);
      const nextOrder = (speakers?.[0]?.display_order ?? 0) + 1;

      const { data: newSpeaker, error: speakerError } = await supabase
        .from("speakers")
        .insert({
          name: fullName, slug,
          bio: form.bio || null,
          image_url: form.profile_picture_url || null,
          website_url: form.website_url || null,
          youtube_url: form.youtube_url || null,
          linkedin_url: form.linkedin_url || null,
          instagram_url: form.instagram_url || null,
          tiktok_url: form.tiktok_url || null,
          years: [2026], display_order: nextOrder,
        })
        .select("id")
        .single();
      if (speakerError) throw speakerError;

      if (form.session_title) {
        const { error: sessionError } = await supabase
          .from("sessions")
          .insert({
            title: form.session_title,
            description: form.session_description || null,
            event_year: 2026, speaker_name: fullName,
            speaker_id: newSpeaker.id, video_url: "", published: false,
          });
        if (sessionError) throw sessionError;
      }
      return newSpeaker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakerApplications"] });
      queryClient.invalidateQueries({ queryKey: ["speakers"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      toast.success("Speaker profile and session created!");
    },
    onError: (e: any) => toast.error(`Failed to convert: ${e.message}`),
  });

  if (!app) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={form.profile_picture_url} />
              <AvatarFallback>{(form.first_name?.[0] || "") + (form.last_name?.[0] || "")}</AvatarFallback>
            </Avatar>
            <span>{form.first_name} {form.last_name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Actions bar */}
          <div className="flex flex-wrap items-center gap-2 bg-muted/50 rounded-lg p-3">
            <Badge className={statusColors[form.status] || ""} variant="secondary">{form.status}</Badge>
            <Select value={form.status} onValueChange={s => { updateField("status", s); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.status === "accepted" && (
              <Button size="sm" onClick={() => convertToSpeakerMutation.mutate()} disabled={convertToSpeakerMutation.isPending}>
                <UserPlus className="h-4 w-4 mr-1" />
                {convertToSpeakerMutation.isPending ? "Converting..." : "Convert to Speaker"}
              </Button>
            )}
            {form.status === "draft" && form.email && (
              <Button size="sm" variant="outline" onClick={() => sendReminderMutation.mutate()} disabled={sendReminderMutation.isPending}>
                <Mail className="h-4 w-4 mr-1" />
                {sendReminderMutation.isPending ? "Sending..." : "Send Reminder"}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete application?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate()}>Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Personal Details */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Personal Details</legend>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">First Name</Label><Input value={form.first_name || ""} onChange={e => updateField("first_name", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Last Name</Label><Input value={form.last_name || ""} onChange={e => updateField("last_name", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Email</Label><Input type="email" value={form.email || ""} onChange={e => updateField("email", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Phone</Label><Input value={form.phone || ""} onChange={e => updateField("phone", e.target.value)} /></div>
            </div>
          </fieldset>

          {/* Address */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Address</legend>
            <div><Label className="text-xs text-muted-foreground">Address Line 1</Label><Input value={form.address_line1 || ""} onChange={e => updateField("address_line1", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Address Line 2</Label><Input value={form.address_line2 || ""} onChange={e => updateField("address_line2", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">City</Label><Input value={form.city || ""} onChange={e => updateField("city", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Postal Code</Label><Input value={form.postal_code || ""} onChange={e => updateField("postal_code", e.target.value)} /></div>
            </div>
          </fieldset>

          {/* Session */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Session</legend>
            <div><Label className="text-xs text-muted-foreground">Session Title</Label><Input value={form.session_title || ""} onChange={e => updateField("session_title", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Session Description</Label><Textarea rows={4} value={form.session_description || ""} onChange={e => updateField("session_description", e.target.value)} /></div>
            <div>
              <Label className="text-xs text-muted-foreground">Preferred Track</Label>
              <Select value={form.preferred_track || ""} onValueChange={v => updateField("preferred_track", v)}>
                <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="workshops">Workshops</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          {/* Bio */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Bio & Profile</legend>
            <div><Label className="text-xs text-muted-foreground">Bio</Label><Textarea rows={4} value={form.bio || ""} onChange={e => updateField("bio", e.target.value)} /></div>
            {form.profile_picture_url && (
              <div>
                <Label className="text-xs text-muted-foreground">Profile Picture</Label>
                <img src={form.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover mt-1" />
              </div>
            )}
          </fieldset>

          {/* Social Links */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Social Links</legend>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Website</Label><Input value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">YouTube</Label><Input value={form.youtube_url || ""} onChange={e => updateField("youtube_url", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">LinkedIn</Label><Input value={form.linkedin_url || ""} onChange={e => updateField("linkedin_url", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">TikTok</Label><Input value={form.tiktok_url || ""} onChange={e => updateField("tiktok_url", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Instagram</Label><Input value={form.instagram_url || ""} onChange={e => updateField("instagram_url", e.target.value)} /></div>
            </div>
          </fieldset>

          {/* Additional */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Additional</legend>
            <div><Label className="text-xs text-muted-foreground">Supporting Materials</Label><Textarea rows={3} value={form.supporting_materials || ""} onChange={e => updateField("supporting_materials", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Additional Comments</Label><Textarea rows={3} value={form.additional_comments || ""} onChange={e => updateField("additional_comments", e.target.value)} /></div>
          </fieldset>

          {/* Admin Notes */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground mb-2">Admin Notes</legend>
            <Textarea rows={4} value={form.admin_notes || ""} onChange={e => updateField("admin_notes", e.target.value)} placeholder="Internal notes..." />
          </fieldset>

          {/* Save Button */}
          <div className="sticky bottom-0 pt-4 bg-background border-t border-border">
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SpeakerApplicationDetailPane;
