import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Settings() {
  const [data, setData] = useState({
    name: "", tagline: "", logo_url: "", phone: "", website: "", address: "",
    county: "", email: "", rules: "", grading_scale: [], discount_types: [], fee_particulars: [],
  });

  useEffect(() => {
    api.get("/institute").then((r) => setData({ ...data, ...r.data }));
    // eslint-disable-next-line
  }, []);

  const save = async () => {
    try {
      await api.put("/institute", data);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div data-testid="settings-page">
      <PageHeader
        title="General settings"
        description="Configure your institute identity, fees, grading and policies."
        actions={<Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-settings-button">Save changes</Button>}
      />

      <Tabs defaultValue="institute">
        <TabsList>
          <TabsTrigger value="institute" data-testid="settings-tab-institute">Institute profile</TabsTrigger>
          <TabsTrigger value="fees" data-testid="settings-tab-fees">Fees</TabsTrigger>
          <TabsTrigger value="grading" data-testid="settings-tab-grading">Grading</TabsTrigger>
          <TabsTrigger value="rules" data-testid="settings-tab-rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="institute" className="mt-5">
          <div className="surface p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Name of the institute"><Input value={data.name || ""} onChange={(e) => setData({ ...data, name: e.target.value })} data-testid="institute-name-input" /></Field>
              <Field label="Tagline"><Input value={data.tagline || ""} onChange={(e) => setData({ ...data, tagline: e.target.value })} /></Field>
              <Field label="Phone"><Input value={data.phone || ""} onChange={(e) => setData({ ...data, phone: e.target.value })} /></Field>
              <Field label="Email"><Input value={data.email || ""} onChange={(e) => setData({ ...data, email: e.target.value })} /></Field>
              <Field label="Website"><Input value={data.website || ""} onChange={(e) => setData({ ...data, website: e.target.value })} /></Field>
              <Field label="County"><Input value={data.county || ""} onChange={(e) => setData({ ...data, county: e.target.value })} /></Field>
              <Field label="Logo URL" full><Input value={data.logo_url || ""} onChange={(e) => setData({ ...data, logo_url: e.target.value })} /></Field>
              <Field label="Address" full><Textarea rows={2} value={data.address || ""} onChange={(e) => setData({ ...data, address: e.target.value })} /></Field>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="mt-5">
          <div className="surface p-6">
            <Field label="Fee particulars (comma separated)" full>
              <Input
                value={(data.fee_particulars || []).join(", ")}
                onChange={(e) => setData({ ...data, fee_particulars: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Tuition, Transport, Lab"
              />
            </Field>
            <Field label="Discount types (comma separated)" full>
              <Input
                value={(data.discount_types || []).join(", ")}
                onChange={(e) => setData({ ...data, discount_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Sibling, Merit, Staff Ward"
              />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="grading" className="mt-5">
          <div className="surface p-6">
            <Label className="text-xs font-medium text-slate-600">Grading scale</Label>
            <div className="mt-2 space-y-2">
              {(data.grading_scale || []).map((g, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="w-24" value={g.grade} onChange={(e) => {
                    const arr = [...data.grading_scale];
                    arr[i] = { ...arr[i], grade: e.target.value };
                    setData({ ...data, grading_scale: arr });
                  }} />
                  <Input className="w-32" type="number" value={g.min} onChange={(e) => {
                    const arr = [...data.grading_scale];
                    arr[i] = { ...arr[i], min: Number(e.target.value) };
                    setData({ ...data, grading_scale: arr });
                  }} />
                  <Button variant="outline" size="sm" onClick={() => setData({ ...data, grading_scale: data.grading_scale.filter((_, k) => k !== i) })}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setData({ ...data, grading_scale: [...(data.grading_scale || []), { grade: "A", min: 80 }] })}>
                + Add grade
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-5">
          <div className="surface p-6">
            <Field label="Rules and regulations" full>
              <Textarea rows={8} value={data.rules || ""} onChange={(e) => setData({ ...data, rules: e.target.value })} />
            </Field>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
