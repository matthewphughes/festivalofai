import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const DEFAULT_DEADLINE = "2026-05-31T17:00";

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminCallForSpeakers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (!roles?.some((r) => r.role === "admin")) {
        toast.error("Access denied. Admin only.");
        navigate("/");
        return;
      }

      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "speaker_application_deadline")
        .maybeSingle();
      if (data?.setting_value) setDeadline(toLocalInput(data.setting_value));
      setLoading(false);
    })();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const iso = new Date(deadline).toISOString();
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { setting_key: "speaker_application_deadline", setting_value: iso },
          { onConflict: "setting_key" }
        );
      if (error) throw error;
      toast.success("Deadline updated");
    } catch (e: any) {
      toast.error("Failed to update: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24 max-w-3xl">
        <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
        </Link>
        <h1 className="text-4xl font-bold mb-2">Call for Speakers Settings</h1>
        <p className="text-muted-foreground mb-8">Manage the public Become a Speaker page.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Application Deadline</CardTitle>
              <CardDescription>
                Controls the countdown timer and date shown on /speak, plus the deadline in confirmation and reminder emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (date &amp; time)</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => window.open("/speak", "_blank")}>
                  Preview Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminCallForSpeakers;
