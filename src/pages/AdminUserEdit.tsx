import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, User, Mic, Users, Video, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { useAuditLog } from "@/hooks/useAuditLog";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  last_sign_in_at: string | null;
  created_at: string;
  email: string;
}

interface EventReplay {
  id: string;
  title: string;
  event_year: number;
}

interface ReplayAccess {
  id: string;
  replay_id: string | null;
  event_year: number;
  is_admin_grant: boolean;
  purchased_at: string;
  granted_at: string | null;
}

const AdminUserEdit = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { logAction } = useAuditLog();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [replays, setReplays] = useState<EventReplay[]>([]);
  const [userAccess, setUserAccess] = useState<ReplayAccess[]>([]);
  
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "",
  });

  useEffect(() => {
    checkAdminAndFetchUser();
  }, [userId]);

  const checkAdminAndFetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isAdmin = userRoles?.some(r => r.role === "admin") || false;
    
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/admin/users");
      return;
    }

    await fetchUserData();
  };

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);

    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setUser(profile);
      setEditForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address_line1: profile.address_line1 || "",
        address_line2: profile.address_line2 || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "",
      });

      // Fetch auth user data for last_sign_in_at
      const { data: { user: authUserData } } = await supabase.auth.admin.getUserById(userId);
      if (authUserData) {
        setAuthUser({
          last_sign_in_at: authUserData.last_sign_in_at,
          created_at: authUserData.created_at,
          email: authUserData.email || "",
        });
      }

      // Fetch roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      setRoles(userRoles?.map(r => r.role) || []);

      // Fetch sessions/replays
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, title, event_year")
        .order("event_year", { ascending: false });
      setReplays(sessionsData || []);

      // Fetch user's replay access
      const { data: accessData } = await supabase
        .from("replay_purchases")
        .select("*")
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false });
      setUserAccess(accessData || []);

    } catch (error: any) {
      toast.error(error.message || "Failed to load user data");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !user) return;
    
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          address_line1: editForm.address_line1,
          address_line2: editForm.address_line2,
          city: editForm.city,
          postal_code: editForm.postal_code,
          country: editForm.country,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update roles - delete all existing and insert new ones
      const { error: deleteRolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteRolesError) throw deleteRolesError;

      if (roles.length > 0) {
        const { error: insertRolesError } = await supabase
          .from("user_roles")
          .insert(roles.map(role => ({ 
            user_id: userId, 
            role: role as "admin" | "user" | "speaker" | "attendee"
          })));

        if (insertRolesError) throw insertRolesError;
      }

      await logAction("update_user", userId, {
        full_name: editForm.full_name,
        roles,
      });

      toast.success("User updated successfully");
      await fetchUserData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const hasYearBundleAccess = (year: number) => {
    return userAccess.some(a => a.event_year === year && a.replay_id === null);
  };

  const hasReplayAccess = (replayId: string) => {
    return userAccess.some(a => a.replay_id === replayId);
  };

  const handleGrantAccess = async (replayId: string | null, year: number) => {
    if (!userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const existingAccess = userAccess.find(
        a => a.replay_id === replayId && a.event_year === year
      );

      if (existingAccess) {
        // Revoke access
        const { error } = await supabase
          .from("replay_purchases")
          .delete()
          .eq("id", existingAccess.id);

        if (error) throw error;
        toast.success("Access revoked");
      } else {
        // Grant access
        const { error } = await supabase
          .from("replay_purchases")
          .insert({
            user_id: userId,
            event_year: year,
            replay_id: replayId,
            is_admin_grant: true,
            granted_by: session.user.id,
            granted_at: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success("Access granted");
      }

      await fetchUserData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update access");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p>User not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Edit User - {user.full_name || user.email} | Admin</title>
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/users")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{user.full_name || "Unnamed User"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Basic user details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editForm.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={editForm.address_line1}
                    onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={editForm.address_line2}
                    onChange={(e) => setEditForm({ ...editForm, address_line2: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={editForm.postal_code}
                      onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replay Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Replay Access
                </CardTitle>
                <CardDescription>Manage user's access to event replays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {Array.from(new Set(replays.map(r => r.event_year))).sort((a, b) => b - a).map(year => (
                    <div key={`year-${year}`} className="space-y-2 border rounded-lg p-4">
                      <div className="flex items-center space-x-2 font-medium">
                        <Checkbox
                          id={`year-${year}`}
                          checked={hasYearBundleAccess(year)}
                          onCheckedChange={() => handleGrantAccess(null, year)}
                        />
                        <Label htmlFor={`year-${year}`} className="cursor-pointer">
                          Full {year} Bundle
                        </Label>
                      </div>
                      
                      <div className="ml-6 space-y-1">
                        {replays.filter(r => r.event_year === year).map(replay => (
                          <div key={replay.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`replay-${replay.id}`}
                              checked={hasReplayAccess(replay.id)}
                              onCheckedChange={() => handleGrantAccess(replay.id, year)}
                            />
                            <Label htmlFor={`replay-${replay.id}`} className="text-sm font-normal cursor-pointer">
                              {replay.title}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs break-all">{user.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{new Date(user.created_at).toLocaleString()}</p>
                </div>
                {authUser?.last_sign_in_at && (
                  <div>
                    <p className="text-muted-foreground">Last Login</p>
                    <p>{new Date(authUser.last_sign_in_at).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p>{new Date(user.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>Assign user roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["admin", "user", "speaker", "attendee"].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer flex items-center gap-2">
                      {role === "admin" && <Shield className="h-4 w-4" />}
                      {role === "user" && <User className="h-4 w-4" />}
                      {role === "speaker" && <Mic className="h-4 w-4" />}
                      {role === "attendee" && <Users className="h-4 w-4" />}
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Access Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Access Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Access Grants</span>
                  <Badge variant="secondary">{userAccess.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin Grants</span>
                  <Badge variant="secondary">
                    {userAccess.filter(a => a.is_admin_grant).length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchases</span>
                  <Badge variant="secondary">
                    {userAccess.filter(a => !a.is_admin_grant).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUserEdit;
