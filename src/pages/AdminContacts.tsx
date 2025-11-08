import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

const AdminContacts = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAndFetchSubmissions();
    fetchEmailSettings();
  }, []);

  const checkAdminAndFetchSubmissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roleData?.some(r => r.role === "admin") || false;

      if (!isAdmin) {
        toast.error("Unauthorized access");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["contact_primary_email", "contact_cc_email"]);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.setting_key === "contact_primary_email") {
          setPrimaryEmail(setting.setting_value);
        } else if (setting.setting_key === "contact_cc_email") {
          setCcEmail(setting.setting_value);
        }
      });
    } catch (error) {
      console.error("Error fetching email settings:", error);
    }
  };

  const saveEmailSettings = async () => {
    setSaving(true);
    try {
      const { error: primaryError } = await supabase
        .from("email_settings")
        .update({ setting_value: primaryEmail })
        .eq("setting_key", "contact_primary_email");

      if (primaryError) throw primaryError;

      const { error: ccError } = await supabase
        .from("email_settings")
        .update({ setting_value: ccEmail })
        .eq("setting_key", "contact_cc_email");

      if (ccError) throw ccError;

      toast.success("Email settings updated successfully");
    } catch (error) {
      console.error("Error saving email settings:", error);
      toast.error("Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Submissions - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">Contact Form Submissions</h1>
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Back to Admin
              </Button>
            </div>

            {/* Email Settings */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Email Settings</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_email">Primary Email (To:)</Label>
                  <Input
                    id="primary_email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    placeholder="team@festivalof.ai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc_email">CC Email</Label>
                  <Input
                    id="cc_email"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="team@creatorcompany.co.uk"
                  />
                </div>
              </div>
              <Button onClick={saveEmailSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Email Settings"}
              </Button>
            </Card>

              <Card className="p-6">
                {loading ? (
                  <p className="text-center py-8">Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No submissions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(submission.created_at), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>{submission.name}</TableCell>
                            <TableCell>
                              <a href={`mailto:${submission.email}`} className="text-primary hover:underline">
                                {submission.email}
                              </a>
                            </TableCell>
                            <TableCell>
                              {submission.phone ? (
                                <a href={`tel:${submission.phone}`} className="text-primary hover:underline">
                                  {submission.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="whitespace-pre-wrap">{submission.message}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminContacts;
