import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Pencil, Trash2, Shield, User, Mic, Users, Video } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

interface EventReplay {
  id: string;
  title: string;
  event_year: number;
}

interface ReplayAccess {
  replay_id: string | null;
  event_year: number;
  is_admin_grant: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    roles: [] as string[],
  });
  const [replays, setReplays] = useState<EventReplay[]>([]);
  const [userAccess, setUserAccess] = useState<ReplayAccess[]>([]);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isAdmin = roles?.some(r => r.role === "admin") || false;
    
    if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/admin");
      return;
    }

    await fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast.error("Failed to load user roles");
      setLoading(false);
      return;
    }

    // Combine profiles with their roles
    const usersWithRoles = profiles?.map(profile => ({
      ...profile,
      roles: userRoles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleEdit = async (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      roles: user.roles,
    });

    // Fetch replays
    const { data: replaysData } = await supabase
      .from("event_replays")
      .select("id, title, event_year")
      .order("event_year", { ascending: false });
    setReplays(replaysData || []);

    // Fetch user's replay access
    const { data: accessData } = await supabase
      .from("replay_purchases")
      .select("replay_id, event_year, is_admin_grant")
      .eq("user_id", user.id);
    setUserAccess(accessData || []);

    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Update profile name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editForm.full_name })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Update roles - first remove all existing roles
      const { error: deleteRolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteRolesError) throw deleteRolesError;

      // Add the new roles
      if (editForm.roles.length > 0) {
        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert(editForm.roles.map(role => ({ 
            user_id: selectedUser.id, 
            role: role as "admin" | "user" | "speaker" | "attendee"
          })));

        if (insertRoleError) throw insertRoleError;
      }

      toast.success("User updated successfully");
      setEditDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const toggleRole = (role: string) => {
    setEditForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleGrantAccess = async (replayId: string | null, eventYear: number) => {
    if (!selectedUser) return;

    try {
      // Check if access already exists
      const hasAccess = userAccess.some(
        a => a.replay_id === replayId && a.event_year === eventYear
      );

      if (hasAccess) {
        // Remove access
        const { error } = await supabase
          .from("replay_purchases")
          .delete()
          .eq("user_id", selectedUser.id)
          .eq("event_year", eventYear)
          .eq("replay_id", replayId);

        if (error) throw error;

        setUserAccess(prev => prev.filter(
          a => !(a.replay_id === replayId && a.event_year === eventYear)
        ));
      } else {
        // Grant access
        const { error } = await supabase
          .from("replay_purchases")
          .insert({
            user_id: selectedUser.id,
            replay_id: replayId,
            event_year: eventYear,
            is_admin_grant: true
          });

        if (error) throw error;

        setUserAccess(prev => [...prev, { replay_id: replayId, event_year: eventYear, is_admin_grant: true }]);
      }

      toast.success(hasAccess ? "Access revoked" : "Access granted");
    } catch (error: any) {
      toast.error(error.message || "Failed to update access");
    }
  };

  const hasReplayAccess = (replayId: string) => {
    return userAccess.some(a => a.replay_id === replayId);
  };

  const hasYearBundleAccess = (year: number) => {
    return userAccess.some(a => a.replay_id === null && a.event_year === year);
  };

  const handleDeleteClick = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedUser.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">View and manage registered users</p>
          </div>
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Registered user accounts and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No users found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "default" : "secondary"}
                            >
                              {role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                              {role === "user" && <User className="mr-1 h-3 w-3" />}
                              {role === "speaker" && <Mic className="mr-1 h-3 w-3" />}
                              {role === "attendee" && <Users className="mr-1 h-3 w-3" />}
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-3">
              <Label>Roles</Label>
              <div className="flex flex-col gap-2">
                {["admin", "user", "speaker", "attendee"].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={editForm.roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer">
                      {role === "admin" && <Shield className="inline mr-1 h-3 w-3" />}
                      {role === "user" && <User className="inline mr-1 h-3 w-3" />}
                      {role === "speaker" && <Mic className="inline mr-1 h-3 w-3" />}
                      {role === "attendee" && <Users className="inline mr-1 h-3 w-3" />}
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Replay Access</Label>
                <Button variant="outline" size="sm" type="button">
                  <Video className="mr-2 h-4 w-4" />
                  Manage Access
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-3">
                {/* Year bundles */}
                {Array.from(new Set(replays.map(r => r.event_year))).sort((a, b) => b - a).map(year => (
                  <div key={`year-${year}`} className="space-y-2">
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
                    
                    {/* Individual replays for this year */}
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              User: <strong>{selectedUser?.full_name || selectedUser?.email}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminUsers;
