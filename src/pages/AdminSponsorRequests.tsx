import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

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

  const [editingRequest, setEditingRequest] = useState<SponsorRequest | null>(null);
  const [editForm, setEditForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", message: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetchRequests();
    fetchEmailSettings();
  }, []);

  const checkAdminAndFetchRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const isAdmin = roleData?.some(r => r.role === "admin") || false;
      if (!isAdmin) { toast.error("Unauthorized access"); navigate("/"); return; }

      const { data, error } = await supabase.from("sponsor_requests").select("*").order("created_at", { ascending: false });
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
      const { data, error } = await supabase.from("email_settings").select("setting_key, setting_value").in("setting_key", ["sponsor_primary_email", "sponsor_cc_email"]);
      if (error) throw error;
      data?.forEach((setting) => {
        if (setting.setting_key === "sponsor_primary_email") setPrimaryEmail(setting.setting_value);
        else if (setting.setting_key === "sponsor_cc_email") setCcEmail(setting.setting_value);
      });
    } catch (error) {
      console.error("Error fetching email settings:", error);
    }
  };

  const saveEmailSettings = async () => {
    setSaving(true);
    try {
      const { error: primaryError } = await supabase.from("email_settings").update({ setting_value: primaryEmail }).eq("setting_key", "sponsor_primary_email");
      if (primaryError) throw primaryError;
      const { error: ccError } = await supabase.from("email_settings").update({ setting_value: ccEmail }).eq("setting_key", "sponsor_cc_email");
      if (ccError) throw ccError;
      toast.success("Email settings updated successfully");
    } catch (error) {
      console.error("Error saving email settings:", error);
      toast.error("Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (request: SponsorRequest) => {
    setEditingRequest(request);
    setEditForm({
      company_name: request.company_name,
      contact_name: request.contact_name,
      email: request.email,
      phone: request.phone || "",
      message: request.message || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingRequest) return;
    try {
      const { error } = await supabase.from("sponsor_requests").update({
        company_name: editForm.company_name,
        contact_name: editForm.contact_name,
        email: editForm.email,
        phone: editForm.phone || null,
        message: editForm.message || null,
      }).eq("id", editingRequest.id);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === editingRequest.id ? { ...r, ...editForm, phone: editForm.phone || null, message: editForm.message || null } : r));
      setEditingRequest(null);
      toast.success("Request updated");
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update request");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from("sponsor_requests").delete().eq("id", deletingId);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== deletingId));
      setDeletingId(null);
      toast.success("Request deleted");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete request");
    }
  };

  return (
    <>
      <Helmet><title>Sponsor Requests - Admin</title></Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-8">
                <Link to="/admin">
                  <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
                </Link>
              </div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Sponsor Pack Requests</h1>
              </div>

              <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Email Settings</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_email">Primary Email (To:)</Label>
                    <Input id="primary_email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} placeholder="team@festivalof.ai" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cc_email">CC Email</Label>
                    <Input id="cc_email" value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} placeholder="team@creatorcompany.co.uk" />
                  </div>
                </div>
                <Button onClick={saveEmailSettings} disabled={saving}>{saving ? "Saving..." : "Save Email Settings"}</Button>
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
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="whitespace-nowrap">{format(new Date(request.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                            <TableCell className="font-medium">{request.company_name}</TableCell>
                            <TableCell>{request.contact_name}</TableCell>
                            <TableCell>
                              <a href={`mailto:${request.email}`} className="text-primary hover:underline">{request.email}</a>
                            </TableCell>
                            <TableCell>
                              {request.phone ? (
                                <a href={`tel:${request.phone}`} className="text-primary hover:underline">{request.phone}</a>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="max-w-md">
                              {request.message ? <div className="whitespace-pre-wrap">{request.message}</div> : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(request)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeletingId(request.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Sponsor Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={editForm.company_name} onChange={(e) => setEditForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={editForm.contact_name} onChange={(e) => setEditForm(f => ({ ...f, contact_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={editForm.message} onChange={(e) => setEditForm(f => ({ ...f, message: e.target.value }))} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRequest(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sponsor request?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminSponsorRequests;
