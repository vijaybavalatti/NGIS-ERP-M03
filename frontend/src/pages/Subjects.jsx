import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Subjects() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", class_ids: [] });

  const load = async () => {
    const [s, c] = await Promise.all([api.get("/subjects"), api.get("/classes")]);
    setItems(s.data);
    setClasses(c.data);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", code: "", class_ids: [] });
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code || "", class_ids: s.class_ids || [] });
    setOpen(true);
  };

  const toggleClass = (id) => {
    setForm((f) => ({
      ...f,
      class_ids: f.class_ids.includes(id) ? f.class_ids.filter((x) => x !== id) : [...f.class_ids, id],
    }));
  };

  const save = async () => {
    try {
      if (editing) await api.put(`/subjects/${editing.id}`, form);
      else await api.post("/subjects", form);
      toast.success("Saved");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete subject "${s.name}"?`)) return;
    await api.delete(`/subjects/${s.id}`);
    toast.success("Deleted");
    load();
  };

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));

  return (
    <div data-testid="subjects-page">
      <PageHeader
        title="Subjects"
        description="Define subjects and assign them to classes."
        actions={
          <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700" data-testid="new-subject-button">
            <Plus className="mr-1.5 h-4 w-4" /> New subject
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.id} className="surface p-5" data-testid={`subject-card-${s.id}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{s.code || "—"}</div>
                <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-slate-900">{s.name}</h3>
              </div>
              <div className="flex">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)} data-testid={`edit-subject-${s.id}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s)} data-testid={`delete-subject-${s.id}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(s.class_ids || []).map((cid) => (
                <span key={cid} className="badge-soft bg-indigo-50 text-indigo-700">{classMap[cid] || "—"}</span>
              ))}
              {(s.class_ids || []).length === 0 && <span className="text-xs text-slate-400">Not assigned to any class</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="surface col-span-full p-12 text-center text-sm text-slate-500">No subjects yet.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="subject-dialog">
          <DialogHeader><DialogTitle>{editing ? "Edit subject" : "New subject"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Subject name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="subject-name-input" />
              </div>
              <div className="col-span-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MATH" data-testid="subject-code-input" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Assign to classes</Label>
              <div className="grid grid-cols-2 gap-2">
                {classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                    <Checkbox
                      checked={form.class_ids.includes(c.id)}
                      onCheckedChange={() => toggleClass(c.id)}
                      data-testid={`subject-class-${c.id}`}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-subject-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
