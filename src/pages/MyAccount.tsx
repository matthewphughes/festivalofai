import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Shield, User, Mic, Users, Video, Calendar, Lock, Gift, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ReplayAccess {
  id: string;
  title: string;
  event_year: number;
  is_bundle: boolean;
}

interface PurchaseHistory {
  id: string;
  purchased_at: string;
  event_year: number;
  replay_title?: string;
  is_bundle: boolean;
  is_admin_grant: boolean;
  stripe_payment_intent?: string;
}

const MyAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [replayAccess, setReplayAccess] = useState<ReplayAccess[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setNewName(profile.full_name || "");
    }

    // Fetch roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    setRoles(userRoles?.map(r => r.role) || []);

    // Fetch replay access and purchase history
    await Promise.all([
      fetchReplayAccess(session.user.id),
      fetchPurchaseHistory(session.user.id)
    ]);
    setLoading(false);
  };

  const fetchReplayAccess = async (userId: string) => {
    const { data: purchases } = await supabase
      .from("replay_purchases")
      .select("replay_id, event_year")
      .eq("user_id", userId);

    if (!purchases) return;

    // Get bundle purchases (where replay_id is null)
    const bundles = purchases
      .filter(p => p.replay_id === null)
      .map(p => ({
        id: `bundle-${p.event_year}`,
        title: `${p.event_year} Full Year Bundle`,
        event_year: p.event_year,
        is_bundle: true
      }));

    // Get individual replay purchases
    const replayIds = purchases
      .filter(p => p.replay_id !== null)
      .map(p => p.replay_id);

    if (replayIds.length > 0) {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, title, event_year")
        .in("id", replayIds);

      const individualReplays = sessions?.map(s => ({
        id: s.id,
        title: s.title,
        event_year: s.event_year,
        is_bundle: false
      })) || [];

      setReplayAccess([...bundles, ...individualReplays]);
    } else {
      setReplayAccess(bundles);
    }
  };

  const fetchPurchaseHistory = async (userId: string) => {
    const { data: purchases } = await supabase
      .from("replay_purchases")
      .select("id, purchased_at, event_year, replay_id, is_admin_grant, stripe_payment_intent")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    if (!purchases) return;

    // Get replay titles for individual purchases
    const replayIds = purchases
      .filter(p => p.replay_id !== null)
      .map(p => p.replay_id);

    let replayTitles: { [key: string]: string } = {};
    if (replayIds.length > 0) {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, title")
        .in("id", replayIds);

      sessions?.forEach(s => {
        replayTitles[s.id] = s.title;
      });
    }

    const history = purchases.map(p => ({
      id: p.id,
      purchased_at: p.purchased_at,
      event_year: p.event_year,
      replay_title: p.replay_id ? replayTitles[p.replay_id] : undefined,
      is_bundle: p.replay_id === null,
      is_admin_grant: p.is_admin_grant,
      stripe_payment_intent: p.stripe_payment_intent
    }));

    setPurchaseHistory(history);
  };

  const handleUpdateName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: newName })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Failed to update name");
      return;
    }

    setFullName(newName);
    setEditingName(false);
    toast.success("Name updated successfully");
  };

  const handleChangePassword = async () => {
    try {
      const validationResult = passwordSchema.safeParse(passwordForm);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setChangingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-3 w-3" />;
      case "speaker": return <Mic className="h-3 w-3" />;
      case "attendee": return <Users className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Account</h1>

          {/* Profile Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={userEmail} disabled />
              </div>
              
              <div className="grid gap-2">
                <Label>Full Name</Label>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter your name"
                    />
                    <Button onClick={handleUpdateName} size="sm">Save</Button>
                    <Button onClick={() => {
                      setEditingName(false);
                      setNewName(fullName);
                    }} variant="outline" size="sm">Cancel</Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input value={fullName || "Not set"} disabled />
                    <Button onClick={() => setEditingName(true)} variant="outline" size="sm">Edit</Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
                        {getRoleIcon(role)}
                        <span className="ml-1">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password & Security
              </CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              {changingPassword ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleChangePassword}>Update Password</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Keep your account secure by using a strong password
                  </p>
                  <Button onClick={() => setChangingPassword(true)} variant="outline">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Purchase History
              </CardTitle>
              <CardDescription>Your transaction history and access grants</CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseHistory.length > 0 ? (
                <div className="space-y-3">
                  {purchaseHistory.map(purchase => (
                    <div key={purchase.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">
                              {purchase.is_bundle 
                                ? `${purchase.event_year} Full Year Bundle`
                                : purchase.replay_title || "Individual Replay"
                              }
                            </h4>
                            {purchase.is_admin_grant && (
                              <Badge variant="secondary" className="text-xs">
                                <Gift className="mr-1 h-3 w-3" />
                                Admin Grant
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(purchase.purchased_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                          {purchase.stripe_payment_intent && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Transaction ID: {purchase.stripe_payment_intent}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {purchase.event_year}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No purchase history yet</p>
                  <Button onClick={() => navigate("/buy-replays")} variant="outline">
                    Browse Replays
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replay Access */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>My Replays</CardTitle>
                  <CardDescription>Your purchased and granted replay access</CardDescription>
                </div>
                <Button onClick={() => navigate("/replays")} size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {replayAccess.length > 0 ? (
                <div className="space-y-2">
                  {replayAccess.map(replay => (
                    <div key={replay.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{replay.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {replay.event_year}
                            {replay.is_bundle && " • Full Year Access"}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => navigate("/replays")} variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No replay access yet</p>
                  <Button onClick={() => navigate("/buy-replays")} variant="outline">
                    Browse Replays
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button onClick={() => navigate("/replays")} variant="outline" className="h-auto py-4">
                  <Video className="mr-2 h-5 w-5" />
                  Watch Replays
                </Button>
                <Button onClick={() => navigate("/schedule")} variant="outline" className="h-auto py-4">
                  <Calendar className="mr-2 h-5 w-5" />
                  View Schedule
                </Button>
                <Button onClick={() => navigate("/speakers")} variant="outline" className="h-auto py-4">
                  <Users className="mr-2 h-5 w-5" />
                  Browse Speakers
                </Button>
                <Button onClick={() => navigate("/tickets")} variant="outline" className="h-auto py-4">
                  <Calendar className="mr-2 h-5 w-5" />
                  Get Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyAccount;
