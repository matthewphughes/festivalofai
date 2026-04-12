import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Save, ChevronDown, ExternalLink, Globe, Youtube, Linkedin, Instagram } from "lucide-react";
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

const CollapsibleSection = ({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const SocialLinkField = ({ label, icon: Icon, value, onChange }: { label: string; icon: any; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-end gap-2">
    <div className="flex-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={`https://...`} />
    </div>
    {value && (
      <Button variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0" asChild>
        <a href={value} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    )}
  </div>
);

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
          <div className="flex items-start gap-4">
            {form.profile_picture_url ? (
              <img
                src={form.profile_picture_url}
                alt={`${form.first_name} ${form.last_name}`}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                {(form.first_name?.[0] || "") + (form.last_name?.[0] || "")}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{form.first_name} {form.last_name}</SheetTitle>
              {form.email && <p className="text-sm text-muted-foreground mt-0.5">{form.email}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[form.status] || ""} variant="secondary">{form.status}</Badge>
                {form.status === "accepted" && (
                  <Button size="sm" variant="outline" onClick={() => convertToSpeakerMutation.mutate()} disabled={convertToSpeakerMutation.isPending}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {convertToSpeakerMutation.isPending ? "Converting..." : "Convert to Speaker"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-1 pb-8">
          {/* Personal Details */}
          <CollapsibleSection title="Personal Details">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">First Name</Label><Input value={form.first_name || ""} onChange={e => updateField("first_name", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Last Name</Label><Input value={form.last_name || ""} onChange={e => updateField("last_name", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Email</Label><Input type="email" value={form.email || ""} onChange={e => updateField("email", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Phone</Label><Input value={form.phone || ""} onChange={e => updateField("phone", e.target.value)} /></div>
            </div>
          </CollapsibleSection>

          <div className="border-t border-border" />

          {/* Address */}
          <CollapsibleSection title="Address" defaultOpen={false}>
            <div><Label className="text-xs text-muted-foreground">Address Line 1</Label><Input value={form.address_line1 || ""} onChange={e => updateField("address_line1", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Address Line 2</Label><Input value={form.address_line2 || ""} onChange={e => updateField("address_line2", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">City</Label><Input value={form.city || ""} onChange={e => updateField("city", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Postal Code</Label><Input value={form.postal_code || ""} onChange={e => updateField("postal_code", e.target.value)} /></div>
            </div>
          </CollapsibleSection>

          <div className="border-t border-border" />

          {/* Session */}
          <CollapsibleSection title="Session Details">
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
          </CollapsibleSection>

          <div className="border-t border-border" />

          {/* Bio */}
          <CollapsibleSection title="Bio">
            <div><Textarea rows={4} value={form.bio || ""} onChange={e => updateField("bio", e.target.value)} placeholder="Speaker biography..." /></div>
          </CollapsibleSection>

          <div className="border-t border-border" />

          {/* Social Links */}
          <CollapsibleSection title="Social Links" defaultOpen={false}>
            <div className="space-y-3">
              <SocialLinkField label="Website" icon={Globe} value={form.website_url || ""} onChange={v => updateField("website_url", v)} />
              <SocialLinkField label="YouTube" icon={Youtube} value={form.youtube_url || ""} onChange={v => updateField("youtube_url", v)} />
              <SocialLinkField label="LinkedIn" icon={Linkedin} value={form.linkedin_url || ""} onChange={v => updateField("linkedin_url", v)} />
              <SocialLinkField label="TikTok" icon={Globe} value={form.tiktok_url || ""} onChange={v => updateField("tiktok_url", v)} />
              <SocialLinkField label="Instagram" icon={Instagram} value={form.instagram_url || ""} onChange={v => updateField("instagram_url", v)} />
            </div>
          </CollapsibleSection>

          <div className="border-t border-border" />

          {/* Additional */}
          <CollapsibleSection title="Additional Information" defaultOpen={false}>
            <div><Label className="text-xs text-muted-foreground">Supporting Materials</Label><Textarea rows={3} value={form.supporting_materials || ""} onChange={e => updateField("supporting_materials", e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Additional Comments</Label><Textarea rows={3} value={form.additional_comments || ""} onChange={e => updateField("additional_comments", e.target.value)} /></div>
          </CollapsibleSection>

          <div className="border-t border-border" />

          {/* Admin Notes */}
          <CollapsibleSection title="Admin Notes">
            <Textarea rows={4} value={form.admin_notes || ""} onChange={e => updateField("admin_notes", e.target.value)} placeholder="Internal notes..." />
          </CollapsibleSection>

          {/* Save Button */}
          <div className="sticky bottom-0 pt-4 bg-background border-t border-border mt-4">
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
