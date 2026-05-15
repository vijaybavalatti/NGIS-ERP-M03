import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, KeyRound, Trash2, ShieldCheck } from "lucide-react";

const ROLES = ["admin", "teacher", "student", "parent"];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "teacher" });
  const [newPwd, setNewPwd] = useState("");

  const load = async () => {
    const params = {};
    if (roleFilter !== "all") params.role = roleFilter;
    const { data } = await api.get("/users", { params });
    setUsers(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [roleFilter]);

  const create = async () => {
    try {
      await api.post("/users", form);
      toast.success("User created");
      setCreateOpen(false);
      setForm({ email: "", password: "", name: "", role: "teacher" });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { active: u.active === false });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const setRole = async (u, role) => {
    try {
      await api.put(`/users/${u.id}`, { role });
      toast.success("Role updated");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const openReset = (u) => { setActive(u); setNewPwd(""); setResetOpen(true); };

  const submitReset = async () => {
    try {
      await api.post(`/users/${active.id}/reset-password`, { new_password: newPwd });
      toast.success("Password reset");
      setResetOpen(false);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete user "${u.email}"?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div data-testid="users-page">
      <PageHeader
        title="User management"
        description="Create accounts, change roles, reset passwords."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700" data-testid="new-user-button">
            <Plus className="mr-1.5 h-4 w-4" /> New user
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-56" data-testid="users-role-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="data-table-th">User</th>
              <th className="data-table-th">Role</th>
              <th className="data-table-th">Status</th>
              <th className="data-table-th">Created</th>
              <th className="data-table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50" data-testid={`user-row-${u.id}`}>
                <td className="data-table-td">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">{u.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="data-table-td">
                  <Select value={u.role} onValueChange={(v) => setRole(u, v)}>
                    <SelectTrigger className="w-36" data-testid={`user-role-select-${u.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="data-table-td">
                  <div className="flex items-center gap-2">
                    <Switch checked={u.active !== false} onCheckedChange={() => toggleActive(u)} data-testid={`user-active-${u.id}`} />
                    <span className={`text-xs ${u.active === false ? "text-slate-400" : "text-emerald-600"}`}>{u.active === false ? "Disabled" : "Active"}</span>
                  </div>
                </td>
                <td className="data-table-td text-xs text-slate-500">{(u.created_at || "").slice(0, 10)}</td>
                <td className="data-table-td text-right">
                  <Button size="sm" variant="ghost" onClick={() => openReset(u)} title="Reset password" data-testid={`reset-user-${u.id}`}><KeyRound className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(u)} title="Delete" data-testid={`delete-user-${u.id}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent data-testid="user-create-dialog">
          <DialogHeader><DialogTitle>New user</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name-input" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-email-input" /></div>
            <div><Label>Password (≥ 8 chars)</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="user-role-input"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create} className="bg-indigo-600 hover:bg-indigo-700" data-testid="create-user-button"><ShieldCheck className="mr-1.5 h-4 w-4" /> Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent data-testid="user-reset-dialog">
          <DialogHeader><DialogTitle>Reset password</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Setting a new password for <b>{active?.email}</b>.</div>
            <div><Label>New password (≥ 8 chars)</Label><Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} data-testid="reset-pwd-input" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={submitReset} className="bg-indigo-600 hover:bg-indigo-700" data-testid="confirm-reset-button">Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
