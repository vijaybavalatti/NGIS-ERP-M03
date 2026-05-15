import { useEffect, useState } from "react";
import api from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Reports() {
  const today = new Date();
  const [feesReport, setFeesReport] = useState(null);
  const [year, setYear] = useState(today.getFullYear());
  const [classes, setClasses] = useState([]);
  const [attClass, setAttClass] = useState("all");
  const startDefault = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(today.toISOString().slice(0, 10));
  const [attReport, setAttReport] = useState([]);

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
  }, []);

  useEffect(() => {
    api.get("/fees/report", { params: { year } }).then((r) => setFeesReport(r.data));
  }, [year]);

  useEffect(() => {
    const params = { type: "student", start, end };
    if (attClass !== "all") params.class_id = attClass;
    api.get("/attendance/report", { params }).then((r) => setAttReport(r.data));
  }, [attClass, start, end]);

  return (
    <div data-testid="reports-page">
      <PageHeader title="Reports" description="Insights across fees and attendance." />

      <Tabs defaultValue="fees">
        <TabsList>
          <TabsTrigger value="fees" data-testid="rep-tab-fees">Fees</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="rep-tab-attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="mt-5 space-y-4">
          <div className="flex gap-3">
            <div>
              <Label className="text-xs">Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32" data-testid="rep-year-select"><SelectValue /></SelectTrigger>
                <SelectContent>{[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi label="Total billed" value={`$${(feesReport?.total_billed || 0).toLocaleString()}`} accent="text-slate-900" />
            <Kpi label="Collected" value={`$${(feesReport?.total_collected || 0).toLocaleString()}`} accent="text-emerald-600" />
            <Kpi label="Pending" value={`$${(feesReport?.total_pending || 0).toLocaleString()}`} accent="text-amber-600" />
          </div>
          <div className="surface overflow-hidden">
            <table className="w-full">
              <thead><tr><th className="data-table-th">Month</th><th className="data-table-th">Billed</th><th className="data-table-th">Collected</th><th className="data-table-th">Outstanding</th></tr></thead>
              <tbody>
                {(feesReport?.by_month || []).map((m) => (
                  <tr key={m.month} data-testid={`fees-month-${m.month}`}>
                    <td className="data-table-td font-medium text-slate-900">{m.month}</td>
                    <td className="data-table-td">${m.billed.toLocaleString()}</td>
                    <td className="data-table-td text-emerald-700">${m.collected.toLocaleString()}</td>
                    <td className="data-table-td text-amber-700">${(m.billed - m.collected).toLocaleString()}</td>
                  </tr>
                ))}
                {(feesReport?.by_month || []).length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">No fee data for this year.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label className="text-xs">Class</Label>
              <Select value={attClass} onValueChange={setAttClass}>
                <SelectTrigger className="w-44" data-testid="rep-class-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" /></div>
            <div><Label className="text-xs">End</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" /></div>
          </div>
          <div className="surface overflow-hidden">
            <table className="w-full">
              <thead><tr>
                <th className="data-table-th">Student</th>
                <th className="data-table-th">Reg #</th>
                <th className="data-table-th">Present</th>
                <th className="data-table-th">Absent</th>
                <th className="data-table-th">Late</th>
                <th className="data-table-th">Leave</th>
                <th className="data-table-th">%</th>
              </tr></thead>
              <tbody>
                {attReport.map((r) => {
                  const pct = r.total ? Math.round((r.present / r.total) * 100) : 0;
                  return (
                    <tr key={r.entity_id} data-testid={`att-rep-${r.entity_id}`}>
                      <td className="data-table-td font-medium text-slate-900">{r.name}</td>
                      <td className="data-table-td font-mono text-xs">{r.registration_number}</td>
                      <td className="data-table-td text-emerald-700">{r.present}</td>
                      <td className="data-table-td text-red-700">{r.absent}</td>
                      <td className="data-table-td text-amber-700">{r.late}</td>
                      <td className="data-table-td text-sky-700">{r.leave}</td>
                      <td className="data-table-td font-semibold">{pct}%</td>
                    </tr>
                  );
                })}
                {attReport.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">No attendance records in range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div className="kpi-card">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-2 font-display text-2xl font-bold tracking-tight ${accent}`}>{value}</div>
    </div>
  );
}
