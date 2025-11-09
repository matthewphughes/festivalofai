import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface Campaign {
  id: string;
  campaign_name: string;
  discount_code: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  currency: string;
  countdown_end_date: string;
  banner_message: string;
  email_subject: string;
  email_content: string;
  is_active: boolean;
  created_at: string;
}

const AdminDiscountCampaigns = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [countdownEndDate, setCountdownEndDate] = useState("");
  const [bannerMessage, setBannerMessage] = useState("Limited Time Offer!");
  const [emailSubject, setEmailSubject] = useState("Your Exclusive Discount Code");
  const [emailContent, setEmailContent] = useState(
    "Hi {name},\n\nThank you for your interest! Here's your exclusive discount code: {discount_code}\n\nUse this code at checkout to save on your Festival of AI tickets!\n\nBest regards,\nThe Festival of AI Team"
  );

  // Check admin access
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!roleData;
    },
  });

  // Fetch campaigns
  const { data: campaigns, refetch } = useQuery<Campaign[]>({
    queryKey: ["discount-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch claims for a campaign
  const { data: claims } = useQuery({
    queryKey: ["discount-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_claims")
        .select("*, discount_campaigns(campaign_name)")
        .order("claimed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  if (checkingAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Checking permissions...</div>;
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const resetForm = () => {
    setCampaignName("");
    setDiscountCode("");
    setDiscountPercentage("");
    setDiscountAmount("");
    setCountdownEndDate("");
    setBannerMessage("Limited Time Offer!");
    setEmailSubject("Your Exclusive Discount Code");
    setEmailContent(
      "Hi {name},\n\nThank you for your interest! Here's your exclusive discount code: {discount_code}\n\nUse this code at checkout to save on your Festival of AI tickets!\n\nBest regards,\nThe Festival of AI Team"
    );
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignName(campaign.campaign_name);
    setDiscountCode(campaign.discount_code);
    setDiscountPercentage(campaign.discount_percentage?.toString() || "");
    setDiscountAmount(campaign.discount_amount ? (campaign.discount_amount / 100).toString() : "");
    setCountdownEndDate(format(new Date(campaign.countdown_end_date), "yyyy-MM-dd'T'HH:mm"));
    setBannerMessage(campaign.banner_message);
    setEmailSubject(campaign.email_subject);
    setEmailContent(campaign.email_content);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!campaignName || !discountCode || !countdownEndDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const campaignData = {
        campaign_name: campaignName,
        discount_code: discountCode,
        discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
        discount_amount: discountAmount ? Math.round(parseFloat(discountAmount) * 100) : null,
        countdown_end_date: new Date(countdownEndDate).toISOString(),
        banner_message: bannerMessage,
        email_subject: emailSubject,
        email_content: emailContent,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from("discount_campaigns")
          .update(campaignData)
          .eq("id", editingCampaign.id);

        if (error) throw error;
        toast.success("Campaign updated successfully");
      } else {
        const { error } = await supabase
          .from("discount_campaigns")
          .insert(campaignData);

        if (error) throw error;
        toast.success("Campaign created successfully");
      }

      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error("Failed to save campaign");
    }
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      const { error } = await supabase
        .from("discount_campaigns")
        .update({ is_active: !campaign.is_active })
        .eq("id", campaign.id);

      if (error) throw error;
      toast.success(`Campaign ${!campaign.is_active ? "activated" : "deactivated"}`);
      refetch();
    } catch (error: any) {
      console.error("Error toggling campaign:", error);
      toast.error("Failed to update campaign");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const { error } = await supabase
        .from("discount_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Campaign deleted successfully");
      refetch();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  return (
    <>
      <Helmet>
        <title>Discount Campaigns - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1 container mx-auto px-4 py-8 mt-20">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discount Campaigns</CardTitle>
                  <CardDescription>Manage promotional discount campaigns with countdown timers</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
                      <DialogDescription>
                        Configure your discount campaign with countdown timer and email template
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Campaign Name *</Label>
                          <Input
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder="Early Bird Special"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Discount Code *</Label>
                          <Input
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            placeholder="EARLYBIRD25"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Discount Percentage</Label>
                          <Input
                            type="number"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(e.target.value)}
                            placeholder="25"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Discount Amount (£)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            placeholder="50.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Countdown End Date & Time *</Label>
                        <Input
                          type="datetime-local"
                          value={countdownEndDate}
                          onChange={(e) => setCountdownEndDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Banner Message *</Label>
                        <Input
                          value={bannerMessage}
                          onChange={(e) => setBannerMessage(e.target.value)}
                          placeholder="Limited Time Offer!"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email Subject *</Label>
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Your Exclusive Discount Code"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email Content *</Label>
                        <Textarea
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                          rows={8}
                          placeholder="Use {name}, {discount_code}, {discount_percentage}, {discount_amount}"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available placeholders: {"{name}"}, {"{discount_code}"}, {"{discount_percentage}"}, {"{discount_amount}"}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSave}>
                        {editingCampaign ? "Update Campaign" : "Create Campaign"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Ends</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns?.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded">{campaign.discount_code}</code>
                        </TableCell>
                        <TableCell>
                          {campaign.discount_percentage ? `${campaign.discount_percentage}%` : ""}
                          {campaign.discount_amount ? `£${(campaign.discount_amount / 100).toFixed(2)}` : ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(campaign.countdown_end_date), "MMM d, yyyy HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(campaign.countdown_end_date) > new Date() ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Expired</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={campaign.is_active}
                            onCheckedChange={() => handleToggleActive(campaign)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(campaign)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {claims && claims.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Recent Claims ({claims.length})</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Claimed At</TableHead>
                          <TableHead>Email Sent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claims.slice(0, 10).map((claim: any) => (
                          <TableRow key={claim.id}>
                            <TableCell>{claim.name}</TableCell>
                            <TableCell>{claim.email}</TableCell>
                            <TableCell>{claim.discount_campaigns?.campaign_name}</TableCell>
                            <TableCell>{format(new Date(claim.claimed_at), "MMM d, yyyy HH:mm")}</TableCell>
                            <TableCell>
                              {claim.email_sent ? (
                                <Badge variant="default">Sent</Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminDiscountCampaigns;
