import { useEffect, useState } from "react";
import api, { API_BASE, formatApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ArrowUpRight, FileDown } from "lucide-react";

const EMPTY = {
  name: "", registration_number: "", class_id: "", picture_url: "",
  admission_date: "", fee_discount: 0, mobile: "", dob: "", gender: "",
  cast: "", identification_marks: "", previous_school: "", religion: "",
  blood_group: "", address: "", additional_note: "",
  father_name: "", father_contact: "", mother_name: "", mother_contact: "",
};

export default function Students() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteFrom, setPromoteFrom] = useState("");
  const [promoteTo, setPromoteTo] = useState("");

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (classFilter && classFilter !== "all") params.class_id = classFilter;
    const [s, c] = await Promise.all([api.get("/students", { params }), api.get("/classes")]);
    setItems(s.data);
    setClasses(c.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, classFilter]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...EMPTY, ...s }); setOpen(true); };

  const save = async () => {
    try {
      const payload = { ...form, fee_discount: Number(form.fee_discount || 0), class_id: form.class_id || null };
      if (editing) await api.put(`/students/${editing.id}`, payload);
      else await api.post("/students", payload);
      toast.success("Saved");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete student "${s.name}"?`)) return;
    await api.delete(`/students/${s.id}`);
    toast.success("Deleted");
    load();
  };

  const submitPromote = async () => {
    if (!promoteFrom || !promoteTo) return toast.error("Pick both classes");
    if (promoteFrom === promoteTo) return toast.error("Choose a different target class");
    try {
      const { data } = await api.post("/students/promote", { from_class_id: promoteFrom, to_class_id: promoteTo });
      toast.success(`Promoted ${data.promoted} students`);
      setPromoteOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div data-testid="students-page">
      <PageHeader
        title="Students"
        description={`${items.length} student${items.length === 1 ? "" : "s"} enrolled`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setPromoteOpen(true)} variant="outline" data-testid="promote-students-button">
              <ArrowUpRight className="mr-1.5 h-4 w-4" /> Promote class
            </Button>
            <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700" data-testid="new-student-button">
              <Plus className="mr-1.5 h-4 w-4" /> Add student
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, registration #, parent…" className="pl-9" data-testid="students-search-input" />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-56" data-testid="students-class-filter"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="data-table-th">Student</th>
              <th className="data-table-th">Reg #</th>
              <th className="data-table-th">Class</th>
              <th className="data-table-th">Father</th>
              <th className="data-table-th">Contact</th>
              <th className="data-table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50" data-testid={`student-row-${s.id}`}>
                <td className="data-table-td">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {s.name?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.gender || "—"} · {s.blood_group || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="data-table-td font-mono text-xs">{s.registration_number}</td>
                <td className="data-table-td">{s.class_name || "—"}</td>
                <td className="data-table-td">{s.father_name || "—"}</td>
                <td className="data-table-td">{s.father_contact || s.mobile || "—"}</td>
                <td className="data-table-td text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid={`student-docs-${s.id}`} title="Documents"><FileDown className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(`${API_BASE}/students/${s.id}/admission-letter.pdf`, "_blank")} data-testid={`doc-admission-${s.id}`}>Admission letter</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`${API_BASE}/students/${s.id}/id-card.pdf`, "_blank")} data-testid={`doc-idcard-${s.id}`}>ID card</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`${API_BASE}/students/${s.id}/certificate.pdf?type=character`, "_blank")}>Character certificate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`${API_BASE}/students/${s.id}/certificate.pdf?type=transfer`, "_blank")}>Transfer certificate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`${API_BASE}/students/${s.id}/certificate.pdf?type=completion`, "_blank")}>Completion certificate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)} data-testid={`edit-student-${s.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)} data-testid={`delete-student-${s.id}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">No students match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <StudentDialog open={open} setOpen={setOpen} editing={editing} form={form} setForm={setForm} classes={classes} save={save} />

      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent data-testid="promote-dialog">
          <DialogHeader><DialogTitle>Promote students to next class</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">All students of the source class will move to the target class.</p>
          <div className="mt-3 space-y-3">
            <div>
              <Label>From class</Label>
              <Select value={promoteFrom} onValueChange={setPromoteFrom}>
                <SelectTrigger data-testid="promote-from-select"><SelectValue placeholder="Select source class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>To class</Label>
              <Select value={promoteTo} onValueChange={setPromoteTo}>
                <SelectTrigger data-testid="promote-to-select"><SelectValue placeholder="Select target class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button onClick={submitPromote} className="bg-indigo-600 hover:bg-indigo-700" data-testid="confirm-promote-button">Promote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StudentDialog({ open, setOpen, editing, form, setForm, classes, save }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto" data-testid="student-dialog">
        <DialogHeader><DialogTitle>{editing ? "Edit student" : "Admit new student"}</DialogTitle></DialogHeader>

        <div className="space-y-5">
          <Section title="Personal">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Field label="Full name"><Input value={form.name} onChange={set("name")} data-testid="student-name-input" /></Field>
              <Field label="Registration #"><Input value={form.registration_number} onChange={set("registration_number")} data-testid="student-reg-input" /></Field>
              <Field label="Class">
                <Select value={form.class_id || "none"} onValueChange={(v) => setForm({ ...form, class_id: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="student-class-select"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Admission date"><Input type="date" value={form.admission_date || ""} onChange={set("admission_date")} /></Field>
              <Field label="DOB"><Input type="date" value={form.dob || ""} onChange={set("dob")} /></Field>
              <Field label="Gender">
                <Select value={form.gender || ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Religion"><Input value={form.religion || ""} onChange={set("religion")} /></Field>
              <Field label="Cast"><Input value={form.cast || ""} onChange={set("cast")} /></Field>
              <Field label="Blood group"><Input value={form.blood_group || ""} onChange={set("blood_group")} /></Field>
              <Field label="Mobile"><Input value={form.mobile || ""} onChange={set("mobile")} /></Field>
              <Field label="Fee discount"><Input type="number" value={form.fee_discount || 0} onChange={set("fee_discount")} /></Field>
              <Field label="Picture URL"><Input value={form.picture_url || ""} onChange={set("picture_url")} /></Field>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Address"><Textarea rows={2} value={form.address || ""} onChange={set("address")} /></Field>
              <Field label="Identification marks"><Textarea rows={2} value={form.identification_marks || ""} onChange={set("identification_marks")} /></Field>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Previous school"><Input value={form.previous_school || ""} onChange={set("previous_school")} /></Field>
              <Field label="Additional note"><Input value={form.additional_note || ""} onChange={set("additional_note")} /></Field>
            </div>
          </Section>

          <Section title="Parents">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="Father's name"><Input value={form.father_name || ""} onChange={set("father_name")} /></Field>
              <Field label="Father's contact"><Input value={form.father_contact || ""} onChange={set("father_contact")} /></Field>
              <Field label="Mother's name"><Input value={form.mother_name || ""} onChange={set("mother_name")} /></Field>
              <Field label="Mother's contact"><Input value={form.mother_contact || ""} onChange={set("mother_contact")} /></Field>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-student-button">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</div>
      {children}
    </div>
  );
}
