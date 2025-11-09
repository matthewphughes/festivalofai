import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { ArrowLeft } from "lucide-react";

interface SponsorRequest {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

const AdminSponsorRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SponsorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAndFetchRequests();
    fetchEmailSettings();
  }, []);

  const checkAdminAndFetchRequests = async () => {
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
        .from("sponsor_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load sponsor requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["sponsor_primary_email", "sponsor_cc_email"]);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.setting_key === "sponsor_primary_email") {
          setPrimaryEmail(setting.setting_value);
        } else if (setting.setting_key === "sponsor_cc_email") {
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
        .eq("setting_key", "sponsor_primary_email");

      if (primaryError) throw primaryError;

      const { error: ccError } = await supabase
        .from("email_settings")
        .update({ setting_value: ccEmail })
        .eq("setting_key", "sponsor_cc_email");

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
        <title>Sponsor Requests - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">Sponsor Pack Requests</h1>
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
                  <p className="text-center py-8">Loading requests...</p>
                ) : requests.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No requests yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(request.created_at), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="font-medium">{request.company_name}</TableCell>
                            <TableCell>{request.contact_name}</TableCell>
                            <TableCell>
                              <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                                {request.email}
                              </a>
                            </TableCell>
                            <TableCell>
                              {request.phone ? (
                                <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                                  {request.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md">
                              {request.message ? (
                                <div className="whitespace-pre-wrap">{request.message}</div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
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

export default AdminSponsorRequests;
