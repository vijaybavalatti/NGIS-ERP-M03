import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Settings as SettingsIcon } from "lucide-react";

export default function Timetable() {
  const [config, setConfig] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classId, setClassId] = useState("");
  const [slots, setSlots] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ weekday: "", period_index: 0, subject_id: "", teacher_id: "", classroom: "" });
  const [configOpen, setConfigOpen] = useState(false);
  const [cfgForm, setCfgForm] = useState({ weekdays: "", periods: [], classrooms: "" });

  const loadAll = async () => {
    const [c, cls, sub, emp] = await Promise.all([
      api.get("/timetable/config"),
      api.get("/classes"),
      api.get("/subjects"),
      api.get("/employees", { params: { role: "teacher" } }),
    ]);
    setConfig(c.data);
    setClasses(cls.data);
    setSubjects(sub.data);
    setTeachers(emp.data);
    if (!classId && cls.data[0]) setClassId(cls.data[0].id);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!classId) return;
    api.get("/timetable", { params: { class_id: classId } }).then((r) => setSlots(r.data));
  }, [classId]);

  const slotFor = (day, p) => slots.find((s) => s.weekday === day && s.period_index === p);

  const openSlot = (day, p) => {
    const existing = slotFor(day, p);
    setEdit({
      weekday: day, period_index: p,
      subject_id: existing?.subject_id || "",
      teacher_id: existing?.teacher_id || "",
      classroom: existing?.classroom || "",
    });
    setEditOpen(true);
  };

  const saveSlot = async () => {
    try {
      const payload = { class_id: classId, ...edit, subject_id: edit.subject_id || null, teacher_id: edit.teacher_id || null, classroom: edit.classroom || null };
      await api.post("/timetable/slot", payload);
      const r = await api.get("/timetable", { params: { class_id: classId } });
      setSlots(r.data);
      setEditOpen(false);
      toast.success("Slot saved");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const clearSlot = async () => {
    const existing = slotFor(edit.weekday, edit.period_index);
    if (!existing) return setEditOpen(false);
    await api.delete(`/timetable/slot/${existing.id}`);
    const r = await api.get("/timetable", { params: { class_id: classId } });
    setSlots(r.data);
    setEditOpen(false);
    toast.success("Cleared");
  };

  const openConfig = () => {
    setCfgForm({
      weekdays: (config?.weekdays || []).join(", "),
      periods: config?.periods || [],
      classrooms: (config?.classrooms || []).join(", "),
    });
    setConfigOpen(true);
  };

  const saveConfig = async () => {
    try {
      const payload = {
        weekdays: cfgForm.weekdays.split(",").map((s) => s.trim()).filter(Boolean),
        periods: cfgForm.periods,
        classrooms: cfgForm.classrooms.split(",").map((s) => s.trim()).filter(Boolean),
      };
      await api.put("/timetable/config", payload);
      toast.success("Config saved");
      setConfigOpen(false);
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const updPeriod = (i, k, v) => {
    const arr = [...cfgForm.periods];
    arr[i] = { ...arr[i], [k]: v };
    setCfgForm({ ...cfgForm, periods: arr });
  };
  const removePeriod = (i) => setCfgForm({ ...cfgForm, periods: cfgForm.periods.filter((_, k) => k !== i) });
  const addPeriod = () => setCfgForm({ ...cfgForm, periods: [...cfgForm.periods, { name: `P${cfgForm.periods.length + 1}`, start: "", end: "" }] });

  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t.name]));

  return (
    <div data-testid="timetable-page">
      <PageHeader
        title="Timetable"
        description="Configure weekdays, periods, classrooms and build per-class timetables."
        actions={
          <Button onClick={openConfig} variant="outline" data-testid="timetable-config-button">
            <SettingsIcon className="mr-1.5 h-4 w-4" /> Configure
          </Button>
        }
      />

      <div className="mb-4">
        <Label className="text-xs">Class</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-56" data-testid="timetable-class-select"><SelectValue /></SelectTrigger>
          <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="surface overflow-x-auto p-4">
        <table className="w-full min-w-[700px] border-separate" style={{ borderSpacing: "6px" }}>
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500">Period</th>
              {(config?.weekdays || []).map((d) => (
                <th key={d} className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(config?.periods || []).map((p, i) => (
              <tr key={i}>
                <td className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                  <div className="font-display text-sm font-bold">{p.name}</div>
                  <div className="text-slate-500">{p.start}–{p.end}</div>
                </td>
                {(config?.weekdays || []).map((day) => {
                  const slot = slotFor(day, i);
                  return (
                    <td key={day} className="p-0">
                      <button
                        onClick={() => openSlot(day, i)}
                        data-testid={`slot-${day}-${i}`}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition-all hover:shadow-sm ${
                          slot ? "border-indigo-200 bg-indigo-50" : "border-dashed border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        {slot ? (
                          <>
                            <div className="text-sm font-semibold text-slate-900">{subMap[slot.subject_id] || "—"}</div>
                            <div className="text-xs text-slate-600">{teacherMap[slot.teacher_id] || "—"}</div>
                            <div className="text-[11px] text-slate-400">{slot.classroom || ""}</div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">+ Add</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-testid="slot-dialog">
          <DialogHeader><DialogTitle>{edit.weekday} · {config?.periods?.[edit.period_index]?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Subject</Label>
              <Select value={edit.subject_id || "none"} onValueChange={(v) => setEdit({ ...edit, subject_id: v === "none" ? "" : v })}>
                <SelectTrigger data-testid="slot-subject-select"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={edit.teacher_id || "none"} onValueChange={(v) => setEdit({ ...edit, teacher_id: v === "none" ? "" : v })}>
                <SelectTrigger data-testid="slot-teacher-select"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Classroom</Label>
              <Select value={edit.classroom || "none"} onValueChange={(v) => setEdit({ ...edit, classroom: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {(config?.classrooms || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearSlot} className="text-red-600">Clear</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveSlot} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-slot-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-2xl" data-testid="timetable-config-dialog">
          <DialogHeader><DialogTitle>Timetable configuration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Weekdays (comma separated)</Label><Input value={cfgForm.weekdays} onChange={(e) => setCfgForm({ ...cfgForm, weekdays: e.target.value })} /></div>
            <div>
              <Label className="mb-2 block">Periods</Label>
              <div className="space-y-2">
                {cfgForm.periods.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input className="w-24" placeholder="Name" value={p.name} onChange={(e) => updPeriod(i, "name", e.target.value)} />
                    <Input className="w-28" placeholder="Start (HH:MM)" value={p.start} onChange={(e) => updPeriod(i, "start", e.target.value)} />
                    <Input className="w-28" placeholder="End (HH:MM)" value={p.end} onChange={(e) => updPeriod(i, "end", e.target.value)} />
                    <Button size="sm" variant="outline" onClick={() => removePeriod(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addPeriod}>+ Add period</Button>
              </div>
            </div>
            <div><Label>Classrooms (comma separated)</Label><Input value={cfgForm.classrooms} onChange={(e) => setCfgForm({ ...cfgForm, classrooms: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button onClick={saveConfig} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-tt-config-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
