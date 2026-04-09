import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Save, Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const TOTAL_STEPS = 7;

const CallForSpeakers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [returnLinkCopied, setReturnLinkCopied] = useState(false);
  const [showReturnLink, setShowReturnLink] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [profilePictureOriginalUrl, setProfilePictureOriginalUrl] = useState("");

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address_line1: "", address_line2: "", city: "", postal_code: "",
    website_url: "", youtube_url: "", linkedin_url: "", tiktok_url: "", instagram_url: "",
    session_title: "", session_description: "", bio: "",
    preferred_track: "", supporting_materials: "", additional_comments: "",
  });

  const getSessionId = (): string => {
    let sid = localStorage.getItem("speaker_app_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("speaker_app_session_id", sid);
    }
    return sid;
  };

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const sessionId = getSessionId();
        const appIdFromUrl = searchParams.get("app");

        const { data: rpcData, error } = await supabase
          .rpc("get_my_speaker_application" as any, { client_session_id: sessionId });

        if (error) throw error;

        let data: any = null;
        if (appIdFromUrl) {
          data = (rpcData as any[])?.find((a: any) => a.id === appIdFromUrl && a.status === "draft");
        }
        if (!data) {
          data = (rpcData as any)?.[0] || null;
        }

        if (data) {
          setApplicationId(data.id);
          setFormData({
            first_name: data.first_name || "", last_name: data.last_name || "",
            email: data.email || "", phone: data.phone || "",
            address_line1: data.address_line1 || "", address_line2: data.address_line2 || "",
            city: data.city || "", postal_code: data.postal_code || "",
            website_url: data.website_url || "", youtube_url: data.youtube_url || "",
            linkedin_url: data.linkedin_url || "", tiktok_url: data.tiktok_url || "",
            instagram_url: data.instagram_url || "",
            session_title: data.session_title || "", session_description: data.session_description || "",
            bio: data.bio || "", preferred_track: data.preferred_track || "",
            supporting_materials: data.supporting_materials || "",
            additional_comments: data.additional_comments || "",
          });
          if (data.profile_picture_url) setProfilePictureUrl(data.profile_picture_url);
          if (data.profile_picture_original_url) setProfilePictureOriginalUrl(data.profile_picture_original_url);
        }
      } catch (err: any) {
        console.error("Error loading draft:", err);
      }
    };
    loadDraft();
  }, [searchParams]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const sessionId = getSessionId();
      const applicationData = {
        ...formData,
        profile_picture_url: profilePictureUrl || null,
        profile_picture_original_url: profilePictureOriginalUrl || null,
        status: "draft",
      };

      if (applicationId) {
        const { data: success, error } = await supabase
          .rpc("update_my_speaker_application" as any, {
            client_session_id: sessionId, app_id: applicationId, app_data: applicationData,
          });
        if (error) throw error;
        if (!success) throw new Error("Failed to update - session mismatch");
      } else {
        const { data: newId, error } = await supabase
          .rpc("create_speaker_application" as any, {
            client_session_id: sessionId, app_data: applicationData,
          });
        if (error) throw error;
        if (!newId) throw new Error("Failed to create application");
        setApplicationId(newId);
      }

      setShowReturnLink(true);
      toast({ title: "Draft saved", description: "Your progress has been saved." });
    } catch (err: any) {
      console.error("Error saving:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getReturnLink = () => applicationId ? `${window.location.origin}/call-for-speakers?app=${applicationId}` : "";

  const copyReturnLink = async () => {
    await navigator.clipboard.writeText(getReturnLink());
    setReturnLinkCopied(true);
    setTimeout(() => setReturnLinkCopied(false), 2000);
    toast({ title: "Link copied!", description: "Use this link to return to your application." });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 50MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    try {
      const fileId = Math.random().toString(36).substring(7);
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `speaker-profiles/${fileId}.${ext}`;

      const { error } = await supabase.storage.from("speaker-images").upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("speaker-images").getPublicUrl(fileName);
      setProfilePictureUrl(publicUrl);
      setProfilePictureOriginalUrl(publicUrl);
      toast({ title: "Headshot uploaded", description: "Your photo has been uploaded." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
          toast({ title: "Required fields missing", description: "Please complete all fields", variant: "destructive" });
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast({ title: "Invalid email", description: "Please enter a valid email", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (!formData.address_line1 || !formData.city || !formData.postal_code) {
          toast({ title: "Required fields missing", description: "Please complete Address, City, and Post Code", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        if (!profilePictureUrl || !formData.bio) {
          toast({ title: "Required fields missing", description: "Please upload a headshot and provide your bio", variant: "destructive" });
          return false;
        }
        return true;
      case 4:
        if (!formData.session_title || !formData.session_description || !formData.preferred_track) {
          toast({ title: "Required fields missing", description: "Please complete all session details", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      await handleSaveDraft();
      setShowReturnLink(false);
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setSubmitting(true);
    try {
      await handleSaveDraft();
      if (applicationId) {
        const sessionId = getSessionId();
        const { data: success, error } = await supabase
          .rpc("update_my_speaker_application" as any, {
            client_session_id: sessionId, app_id: applicationId, app_data: { status: "submitted" },
          });
        if (error) throw error;
        if (!success) throw new Error("Failed to submit");
        localStorage.removeItem("speaker_app_session_id");
        navigate("/speaker-thanks");
      }
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const progress = (currentStep / TOTAL_STEPS) * 100;
  const stepTitles = ["Contact Information", "Address", "Headshot & Bio", "Session Details", "Social Links", "Final Details", "Review & Submit"];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Call for Speakers | Festival of AI</title>
        <meta name="description" content="Apply to speak at the Festival of AI 2026. Submit your session proposal today." />
      </Helmet>
      <Navigation />

      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-foreground text-center mb-2">Speaker Application</h1>
          <p className="text-center text-muted-foreground mb-8">Festival of AI 2026 — October 16th, National Space Centre</p>

          {showReturnLink && applicationId ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Save className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Application Saved!</h2>
              <p className="text-muted-foreground mb-6">Copy the link below to return and continue anytime.</p>
              <div className="max-w-md mx-auto flex items-center gap-2 mb-6">
                <Input readOnly value={getReturnLink()} className="text-sm bg-background" />
                <Button variant="outline" size="sm" onClick={copyReturnLink} className="shrink-0">
                  {returnLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => setShowReturnLink(false)}>Continue Editing</Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8">
              <p className="text-foreground font-medium">{stepTitles[currentStep - 1]}</p>
              <p className="text-sm text-muted-foreground mb-6">Step {currentStep} of {TOTAL_STEPS}</p>
              <Progress value={progress} className="mb-8" />

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="first_name">First Name *</Label><Input id="first_name" value={formData.first_name} onChange={handleInputChange("first_name")} /></div>
                    <div><Label htmlFor="last_name">Last Name *</Label><Input id="last_name" value={formData.last_name} onChange={handleInputChange("last_name")} /></div>
                  </div>
                  <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange("email")} /></div>
                  <div><Label htmlFor="phone">Phone *</Label><Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange("phone")} /></div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground mb-6">We will never disclose your personal details.</p>
                  <div><Label htmlFor="address_line1">Address 1 *</Label><Input id="address_line1" value={formData.address_line1} onChange={handleInputChange("address_line1")} /></div>
                  <div><Label htmlFor="address_line2">Address 2</Label><Input id="address_line2" value={formData.address_line2} onChange={handleInputChange("address_line2")} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="city">City *</Label><Input id="city" value={formData.city} onChange={handleInputChange("city")} /></div>
                    <div><Label htmlFor="postal_code">Post Code *</Label><Input id="postal_code" value={formData.postal_code} onChange={handleInputChange("postal_code")} /></div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label>Headshot *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      {profilePictureUrl ? (
                        <div className="space-y-4">
                          <img src={profilePictureUrl} alt="Headshot" className="w-32 h-32 rounded-full mx-auto object-cover" />
                          <Button variant="outline" onClick={() => document.getElementById("profile_picture")?.click()}>Change Headshot</Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">Drop your headshot here or</p>
                          <Button onClick={() => document.getElementById("profile_picture")?.click()}>Select file</Button>
                        </>
                      )}
                      <input id="profile_picture" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      <p className="text-xs text-muted-foreground mt-4">Max 50MB</p>
                    </div>
                  </div>
                  <div><Label htmlFor="bio">Bio *</Label><Textarea id="bio" value={formData.bio} onChange={handleInputChange("bio")} rows={10} placeholder="Tell us about yourself..." /></div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div><Label htmlFor="session_title">Session Title *</Label><Input id="session_title" value={formData.session_title} onChange={handleInputChange("session_title")} /></div>
                  <div>
                    <Label htmlFor="session_description">Session Description *</Label>
                    <Textarea id="session_description" value={formData.session_description} onChange={handleInputChange("session_description")} rows={10} />
                    <p className="text-sm text-muted-foreground mt-2">This will be used on the website and helps us evaluate your session.</p>
                  </div>
                  <div>
                    <Label htmlFor="preferred_track">Preferred Track *</Label>
                    <Select value={formData.preferred_track} onValueChange={v => setFormData(prev => ({ ...prev, preferred_track: v }))}>
                      <SelectTrigger id="preferred_track" className="bg-background"><SelectValue placeholder="Select a track" /></SelectTrigger>
                      <SelectContent className="bg-background border-border z-50">
                        <SelectItem value="main">Main Stage</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="lightning">Lightning Talk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground mb-6">We'll link to your socials on the speaker page.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Website</Label><Input type="url" placeholder="https://yourwebsite.com" value={formData.website_url} onChange={handleInputChange("website_url")} /></div>
                    <div><Label>YouTube</Label><Input type="url" placeholder="https://youtube.com/@channel" value={formData.youtube_url} onChange={handleInputChange("youtube_url")} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>LinkedIn</Label><Input type="url" placeholder="https://linkedin.com/in/profile" value={formData.linkedin_url} onChange={handleInputChange("linkedin_url")} /></div>
                    <div><Label>TikTok</Label><Input type="url" placeholder="https://tiktok.com/@username" value={formData.tiktok_url} onChange={handleInputChange("tiktok_url")} /></div>
                  </div>
                  <div><Label>Instagram</Label><Input type="url" placeholder="https://instagram.com/username" value={formData.instagram_url} onChange={handleInputChange("instagram_url")} /></div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="supporting_materials">Supporting Materials</Label>
                    <Textarea id="supporting_materials" value={formData.supporting_materials} onChange={handleInputChange("supporting_materials")} rows={10} placeholder="Links to videos of you speaking..." />
                    <p className="text-sm text-muted-foreground mt-2">Please provide links to videos of you speaking. Full sessions preferred over reels.</p>
                  </div>
                  <div>
                    <Label htmlFor="additional_comments">Additional Comments</Label>
                    <Textarea id="additional_comments" value={formData.additional_comments} onChange={handleInputChange("additional_comments")} rows={10} placeholder="Anything else to support your application..." />
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground mb-4">Please review your application before submitting.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b border-border pb-2">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {formData.first_name} {formData.last_name}</p>
                        <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b border-border pb-2">Address</h3>
                      <div className="space-y-2 text-sm">
                        <p>{formData.address_line1}</p>
                        {formData.address_line2 && <p>{formData.address_line2}</p>}
                        <p>{formData.city}, {formData.postal_code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Headshot & Bio</h3>
                    <div className="flex gap-6">
                      {profilePictureUrl && <img src={profilePictureUrl} alt="Headshot" className="w-24 h-24 rounded-full object-cover" />}
                      <p className="text-sm text-muted-foreground line-clamp-4">{formData.bio || "No bio provided"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Session Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Title:</span> {formData.session_title}</p>
                      <p><span className="text-muted-foreground">Track:</span> <span className="capitalize">{formData.preferred_track}</span></p>
                      <p className="text-muted-foreground line-clamp-3">{formData.session_description}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b border-border pb-2">Social Links</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {formData.website_url && <p><span className="text-muted-foreground">Website:</span> {formData.website_url}</p>}
                      {formData.youtube_url && <p><span className="text-muted-foreground">YouTube:</span> {formData.youtube_url}</p>}
                      {formData.linkedin_url && <p><span className="text-muted-foreground">LinkedIn:</span> {formData.linkedin_url}</p>}
                      {formData.tiktok_url && <p><span className="text-muted-foreground">TikTok:</span> {formData.tiktok_url}</p>}
                      {formData.instagram_url && <p><span className="text-muted-foreground">Instagram:</span> {formData.instagram_url}</p>}
                    </div>
                  </div>
                  {(formData.supporting_materials || formData.additional_comments) && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b border-border pb-2">Additional Information</h3>
                      {formData.supporting_materials && <div className="text-sm"><p className="text-muted-foreground mb-1">Supporting Materials:</p><p className="line-clamp-3">{formData.supporting_materials}</p></div>}
                      {formData.additional_comments && <div className="text-sm"><p className="text-muted-foreground mb-1">Additional Comments:</p><p className="line-clamp-3">{formData.additional_comments}</p></div>}
                    </div>
                  )}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
                    <p className="text-sm text-foreground">By submitting, you confirm that all information provided is accurate and complete.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <div>{currentStep > 1 && <Button variant="outline" onClick={handlePrevious}>Previous</Button>}</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save & Return Later"}
                  </Button>
                  {currentStep < TOTAL_STEPS ? (
                    <Button onClick={handleNext}>Next</Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CallForSpeakers;
