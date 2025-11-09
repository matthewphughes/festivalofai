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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  product_name?: string;
  is_bundle: boolean;
  is_admin_grant: boolean;
  stripe_payment_intent?: string;
  order_type?: string | null;
}

const MyAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [replayAccess, setReplayAccess] = useState<ReplayAccess[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [newCountry, setNewCountry] = useState("");
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
      .select("full_name, phone, address_line1, address_line2, city, postal_code, country")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddressLine1(profile.address_line1 || "");
      setAddressLine2(profile.address_line2 || "");
      setCity(profile.city || "");
      setPostalCode(profile.postal_code || "");
      setCountry(profile.country || "");
      setNewName(profile.full_name || "");
      setNewPhone(profile.phone || "");
      setNewAddressLine1(profile.address_line1 || "");
      setNewAddressLine2(profile.address_line2 || "");
      setNewCity(profile.city || "");
      setNewPostalCode(profile.postal_code || "");
      setNewCountry(profile.country || "");
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
      .select(`
        id, 
        purchased_at, 
        event_year, 
        replay_id, 
        product_id,
        is_admin_grant, 
        stripe_payment_intent,
        order_type
      `)
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

    // Get product names for manual orders
    const productIds = purchases
      .filter(p => p.product_id !== null)
      .map(p => p.product_id);

    let productNames: { [key: string]: string } = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("stripe_products")
        .select("id, product_name")
        .in("id", productIds);

      products?.forEach(p => {
        productNames[p.id] = p.product_name;
      });
    }

    const history = purchases.map(p => ({
      id: p.id,
      purchased_at: p.purchased_at,
      event_year: p.event_year,
      replay_title: p.replay_id ? replayTitles[p.replay_id] : undefined,
      product_name: p.product_id ? productNames[p.product_id] : undefined,
      is_bundle: p.replay_id === null && p.product_id === null,
      is_admin_grant: p.is_admin_grant,
      stripe_payment_intent: p.stripe_payment_intent,
      order_type: p.order_type
    }));

    setPurchaseHistory(history);
  };

  const handleUpdateProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: newName,
        phone: newPhone,
        address_line1: newAddressLine1,
        address_line2: newAddressLine2,
        city: newCity,
        postal_code: newPostalCode,
        country: newCountry
      })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    setFullName(newName);
    setPhone(newPhone);
    setAddressLine1(newAddressLine1);
    setAddressLine2(newAddressLine2);
    setCity(newCity);
    setPostalCode(newPostalCode);
    setCountry(newCountry);
    setEditingProfile(false);
    toast.success("Profile updated successfully");
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

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile & Security</TabsTrigger>
              <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            </TabsList>

            {/* Profile & Security Tab */}
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={userEmail} disabled />
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

                  {editingProfile ? (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                          id="edit-name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                          id="edit-phone"
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+44 1234 567890"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-address1">Address Line 1</Label>
                        <Input
                          id="edit-address1"
                          value={newAddressLine1}
                          onChange={(e) => setNewAddressLine1(e.target.value)}
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-address2">Address Line 2</Label>
                        <Input
                          id="edit-address2"
                          value={newAddressLine2}
                          onChange={(e) => setNewAddressLine2(e.target.value)}
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-city">City</Label>
                          <Input
                            id="edit-city"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="City"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-postal">Postal Code</Label>
                          <Input
                            id="edit-postal"
                            value={newPostalCode}
                            onChange={(e) => setNewPostalCode(e.target.value)}
                            placeholder="Postal code"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-country">Country</Label>
                        <Input
                          id="edit-country"
                          value={newCountry}
                          onChange={(e) => setNewCountry(e.target.value)}
                          placeholder="Country"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile} size="sm">Save Changes</Button>
                        <Button onClick={() => {
                          setEditingProfile(false);
                          setNewName(fullName);
                          setNewPhone(phone);
                          setNewAddressLine1(addressLine1);
                          setNewAddressLine2(addressLine2);
                          setNewCity(city);
                          setNewPostalCode(postalCode);
                          setNewCountry(country);
                        }} variant="outline" size="sm">Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input value={fullName || "Not set"} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label>Phone Number</Label>
                        <Input value={phone || "Not set"} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label>Address Line 1</Label>
                        <Input value={addressLine1 || "Not set"} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label>Address Line 2</Label>
                        <Input value={addressLine2 || "Not set"} disabled />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>City</Label>
                          <Input value={city || "Not set"} disabled />
                        </div>

                        <div className="grid gap-2">
                          <Label>Postal Code</Label>
                          <Input value={postalCode || "Not set"} disabled />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Country</Label>
                        <Input value={country || "Not set"} disabled />
                      </div>

                      <Button onClick={() => setEditingProfile(true)} variant="outline">
                        Edit Profile
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
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
            </TabsContent>

            {/* Purchase History Tab */}
            <TabsContent value="purchases" className="space-y-6">
              {/* Purchase History */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Purchase History
                      </CardTitle>
                      <CardDescription>Your transaction history and access grants</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/order-history")} variant="outline">
                      View Full History
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {purchaseHistory.length > 0 ? (
                    <div className="space-y-3">
                      {purchaseHistory.slice(0, 5).map(purchase => (
                        <div key={purchase.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">
                                  {purchase.product_name 
                                    ? purchase.product_name
                                    : purchase.is_bundle 
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
              <Card>
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
                            <Video className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{replay.title}</p>
                              <p className="text-sm text-muted-foreground">{replay.event_year}</p>
                            </div>
                          </div>
                          <Button onClick={() => navigate("/replays")} size="sm" variant="outline">
                            <Play className="mr-2 h-3 w-3" />
                            Watch
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
                  <CardDescription>Navigate to other sections</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate("/buy-replays")} variant="outline">
                    <Video className="mr-2 h-4 w-4" />
                    Buy Replays
                  </Button>
                  <Button onClick={() => navigate("/replays")} variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Replays
                  </Button>
                  <Button onClick={() => navigate("/agenda")} variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Agenda
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyAccount;
