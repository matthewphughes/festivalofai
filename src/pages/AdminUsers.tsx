import { useEffect, useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Pencil, Trash2, Shield, User, Mic, Users, Video, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserFilters } from "@/components/admin/UserFilters";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { useAuditLog } from "@/hooks/useAuditLog";

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
  const { logAction } = useAuditLog();
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
  
  // New states for search, filtering, and bulk actions
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Bulk import states
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkUserData, setBulkUserData] = useState("");
  const [parsedUsers, setParsedUsers] = useState<Array<{ firstName: string; lastName: string; email: string }>>([]);
  const [bulkDefaultRole, setBulkDefaultRole] = useState("user");
  const [importing, setImporting] = useState(false);

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

    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("id, title, event_year")
      .order("event_year", { ascending: false });
    setReplays(sessionsData || []);

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
      const oldName = selectedUser.full_name;
      const oldRoles = selectedUser.roles;

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

      // Log the action
      await logAction("update_user", selectedUser.id, {
        old_name: oldName,
        new_name: editForm.full_name,
        old_roles: oldRoles,
        new_roles: editForm.roles,
      });

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
        let query = supabase
          .from("replay_purchases")
          .delete()
          .eq("user_id", selectedUser.id)
          .eq("event_year", eventYear);

        // Handle NULL replay_id for year bundles
        if (replayId === null) {
          query = query.is("replay_id", null);
        } else {
          query = query.eq("replay_id", replayId);
        }

        const { error } = await query;

        if (error) throw error;

        setUserAccess(prev => prev.filter(
          a => !(a.replay_id === replayId && a.event_year === eventYear)
        ));

        // Log the action
        await logAction("revoke_replay_access", selectedUser.id, {
          replay_id: replayId,
          event_year: eventYear,
        });
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

        // Log the action
        await logAction("grant_replay_access", selectedUser.id, {
          replay_id: replayId,
          event_year: eventYear,
        });
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

      // Log the action
      await logAction("delete_user", selectedUser.id, {
        email: selectedUser.email,
        full_name: selectedUser.full_name,
      });

      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = 
        roleFilter === "all" || 
        user.roles.includes(roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Bulk selection handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Bulk role assignment
  const handleBulkRoleAssign = async (role: string) => {
    if (selectedUserIds.size === 0) return;

    try {
      const userIds = Array.from(selectedUserIds);
      
      // Add role to all selected users
      const { error } = await supabase
        .from("user_roles")
        .insert(
          userIds.map(userId => ({
            user_id: userId,
            role: role as "admin" | "user" | "speaker" | "attendee"
          }))
        );

      if (error) {
        // Ignore duplicate key errors (user already has role)
        if (!error.message.includes("duplicate key")) {
          throw error;
        }
      }

      // Log the action
      await logAction("bulk_assign_role", null, {
        role,
        user_count: userIds.length,
        user_ids: userIds,
      });

      toast.success(`${role} role assigned to ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`);
      clearSelection();
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign roles");
    }
  };

  // Parse bulk user data
  const handleParseBulkData = () => {
    try {
      const lines = bulkUserData.trim().split("\n");
      const parsed: Array<{ firstName: string; lastName: string; email: string }> = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Support both CSV and TSV
        const parts = trimmedLine.includes("\t") 
          ? trimmedLine.split("\t") 
          : trimmedLine.split(",");

        if (parts.length < 3) {
          errors.push(`Line ${index + 1}: Not enough fields`);
          return;
        }

        const firstName = parts[0].trim();
        const lastName = parts[1].trim();
        const email = parts[2].trim();

        // Basic email validation
        if (!email.includes("@")) {
          errors.push(`Line ${index + 1}: Invalid email format`);
          return;
        }

        if (!firstName || !lastName) {
          errors.push(`Line ${index + 1}: First name and last name required`);
          return;
        }

        parsed.push({ firstName, lastName, email: email.toLowerCase() });
      });

      if (errors.length > 0) {
        toast.error(`Parsing errors:\n${errors.join("\n")}`);
      }

      if (parsed.length === 0) {
        toast.error("No valid users found");
        return;
      }

      // Check for duplicate emails in input
      const emails = parsed.map(u => u.email);
      const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);
      if (duplicates.length > 0) {
        toast.error(`Duplicate emails found: ${[...new Set(duplicates)].join(", ")}`);
        return;
      }

      setParsedUsers(parsed);
      toast.success(`Parsed ${parsed.length} users successfully`);
    } catch (error: any) {
      toast.error("Failed to parse user data");
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (parsedUsers.length === 0) {
      toast.error("No users to import");
      return;
    }

    setImporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("bulk-create-users", {
        body: {
          users: parsedUsers,
          defaultRole: bulkDefaultRole,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { results, summary } = response.data;

      // Show detailed results
      const failed = results.filter((r: any) => !r.success);
      if (failed.length > 0) {
        const failedEmails = failed.map((r: any) => `${r.email}: ${r.error}`).join("\n");
        toast.error(`${summary.failed} failed:\n${failedEmails}`);
      }

      if (summary.successful > 0) {
        toast.success(`Successfully created ${summary.successful} user${summary.successful !== 1 ? 's' : ''}`);
        setBulkImportOpen(false);
        setBulkUserData("");
        setParsedUsers([]);
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import users");
    } finally {
      setImporting(false);
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
          <div className="flex gap-2">
            <Button onClick={() => setBulkImportOpen(true)} variant="default">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import Users
            </Button>
            <Button onClick={() => navigate("/admin")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Registered user accounts and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <UserFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
            />

            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {users.length === 0 ? "No users found" : "No users match your filters"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.size === filteredUsers.length}
                        onCheckedChange={toggleAllUsers}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
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

        <BulkActionsBar
          selectedCount={selectedUserIds.size}
          onClearSelection={clearSelection}
          onBulkRoleAssign={handleBulkRoleAssign}
        />
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

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Users</DialogTitle>
            <DialogDescription>
              Paste user data below. Each line should contain: FirstName, LastName, Email (comma or tab separated)
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-data">User Data</Label>
              <Textarea
                id="bulk-data"
                placeholder="John,Doe,john@example.com&#10;Jane,Smith,jane@example.com"
                className="min-h-[200px] font-mono text-sm"
                value={bulkUserData}
                onChange={(e) => setBulkUserData(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Supports CSV (comma-separated) or TSV (tab-separated). Headers will be auto-detected and skipped.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="default-role">Default Role</Label>
              <Select value={bulkDefaultRole} onValueChange={setBulkDefaultRole}>
                <SelectTrigger id="default-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="attendee">Attendee</SelectItem>
                  <SelectItem value="speaker">Speaker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleParseBulkData} 
              variant="outline"
              disabled={!bulkUserData.trim()}
            >
              Parse & Preview
            </Button>

            {parsedUsers.length > 0 && (
              <div className="grid gap-2">
                <Label>Preview ({parsedUsers.length} users)</Label>
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedUsers.map((user, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{user.firstName}</TableCell>
                          <TableCell>{user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Users will be created with auto-confirmed emails. They'll need to use "Forgot Password" to set their password.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBulkImportOpen(false);
                setBulkUserData("");
                setParsedUsers([]);
              }}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkImport}
              disabled={parsedUsers.length === 0 || importing}
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {parsedUsers.length} User{parsedUsers.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminUsers;
