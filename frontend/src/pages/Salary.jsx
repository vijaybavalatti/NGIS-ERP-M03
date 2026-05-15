import { useEffect, useState } from "react";
import api, { API_BASE, formatApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, Receipt, FileText, Download, Banknote, Mail } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Salary() {
  const [slips, setSlips] = useState([]);
  const [report, setReport] = useState(null);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [status, setStatus] = useState("all");
  const [payOpen, setPayOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [payMethod, setPayMethod] = useState("bank");
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSlip, setEmailSlip] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const load = async () => {
    const params = { month, year };
    if (status !== "all") params.status = status;
    const [s, r] = await Promise.all([
      api.get("/salary/slips", { params }),
      api.get("/salary/report", { params: { year } }),
    ]);
    setSlips(s.data);
    setReport(r.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year, status]);

  const generate = async () => {
    try {
      const { data } = await api.post("/salary/slips/bulk-generate", null, { params: { month, year } });
      toast.success(`Generated ${data.created} salary slips`);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const openPay = (slip) => { setActive(slip); setPayMethod("bank"); setPayOpen(true); };
  const submitPay = async () => {
    try {
      await api.post(`/salary/slips/${active.id}/pay`, { payment_method: payMethod });
      toast.success("Salary marked as paid");
      setPayOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const downloadSlip = (id) => window.open(`${API_BASE}/salary/slips/${id}/slip.pdf`, "_blank");

  const openEmail = (s) => {
    setEmailSlip(s);
    setEmailTo("");
    setEmailOpen(true);
  };

  const submitEmail = async () => {
    setEmailSending(true);
    try {
      const { data } = await api.post(`/salary/slips/${emailSlip.id}/email`, { recipient_email: emailTo });
      if (data.status === "sent") toast.success("Email sent");
      else if (data.status === "skipped") toast.message("Email skipped — RESEND_API_KEY not configured");
      else toast.error(data.error || "Email failed");
      setEmailOpen(false);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div data-testid="salary-page">
      <PageHeader
        title="Salary"
        description="Generate monthly salary slips, mark payments and download PDF slips."
        actions={
          <Button onClick={generate} className="bg-indigo-600 hover:bg-indigo-700" data-testid="generate-salary-button">
            <Receipt className="mr-1.5 h-4 w-4" /> Generate slips
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi icon={Banknote} label="Total payroll" value={`$${(report?.total_payroll || 0).toLocaleString()}`} color="bg-indigo-100 text-indigo-700" testid="kpi-payroll" />
        <Kpi icon={Wallet} label="Paid" value={`$${(report?.total_paid || 0).toLocaleString()}`} color="bg-emerald-100 text-emerald-700" testid="kpi-salary-paid" />
        <Kpi icon={FileText} label="Pending" value={`$${(report?.total_pending || 0).toLocaleString()}`} color="bg-amber-100 text-amber-700" testid="kpi-salary-pending" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-36" data-testid="salary-month-filter"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32" data-testid="salary-year-filter"><SelectValue /></SelectTrigger>
          <SelectContent>{[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" data-testid="salary-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="data-table-th">Employee</th>
              <th className="data-table-th">Role</th>
              <th className="data-table-th">Period</th>
              <th className="data-table-th">Net</th>
              <th className="data-table-th">Status</th>
              <th className="data-table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50" data-testid={`salary-row-${s.id}`}>
                <td className="data-table-td font-medium text-slate-900">{s.employee_name}</td>
                <td className="data-table-td capitalize text-slate-600">{(s.employee_role || "").replace(/_/g, " ")}</td>
                <td className="data-table-td">{MONTHS[s.month - 1]} {s.year}</td>
                <td className="data-table-td">${Number(s.net_amount).toLocaleString()}</td>
                <td className="data-table-td">
                  <span className={`badge-soft capitalize ${s.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{s.status}</span>
                </td>
                <td className="data-table-td text-right">
                  {s.status !== "paid" && (
                    <Button size="sm" onClick={() => openPay(s)} className="bg-indigo-600 hover:bg-indigo-700 mr-1" data-testid={`pay-salary-${s.id}`}>Mark paid</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => downloadSlip(s.id)} data-testid={`download-salary-${s.id}`}><Download className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEmail(s)} className="ml-1" data-testid={`email-salary-${s.id}`}><Mail className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {slips.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">No salary slips for this period. Generate them.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent data-testid="salary-pay-dialog">
          <DialogHeader><DialogTitle>Mark salary as paid</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-900">{active?.employee_name}</div>
              <div className="text-slate-500">{active && `${MONTHS[active.month - 1]} ${active.year} · Net $${Number(active.net_amount).toLocaleString()}`}</div>
            </div>
            <div>
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger data-testid="salary-method-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={submitPay} className="bg-indigo-600 hover:bg-indigo-700" data-testid="confirm-pay-salary-button">Mark paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent data-testid="email-salary-dialog">
          <DialogHeader><DialogTitle>Email salary slip</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-900">{emailSlip?.employee_name}</div>
              <div className="text-slate-500">{emailSlip && `${MONTHS[emailSlip.month - 1]} ${emailSlip.year} · Net $${Number(emailSlip.net_amount).toLocaleString()}`}</div>
            </div>
            <div>
              <Label>Recipient email</Label>
              <Input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="staff@example.com" data-testid="email-salary-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={submitEmail} disabled={emailSending || !emailTo} className="bg-indigo-600 hover:bg-indigo-700" data-testid="send-salary-email-button">
              <Mail className="mr-1.5 h-4 w-4" /> {emailSending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color, testid }) {
  return (
    <div className="kpi-card" data-testid={testid}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
