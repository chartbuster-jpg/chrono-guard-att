import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
  DAY_NAMES,
  type Schedule,
} from "@/lib/schedules";

const ScheduleManagement = () => {
  const [rows, setRows] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    class_section: "",
    day_of_week: "1",
    start_time: "09:00",
    end_time: "10:00",
    subject: "",
  });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setRows(await listSchedules());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.class_section || !form.start_time || !form.end_time) {
      toast({ title: "Missing fields", description: "Class, start and end time are required.", variant: "destructive" });
      return;
    }
    const { error } = await createSchedule({
      class_section: form.class_section.trim(),
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time + ":00",
      end_time: form.end_time + ":00",
      subject: form.subject.trim() || null,
      is_active: true,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Schedule added" });
      setForm({ ...form, subject: "" });
      load();
    }
  };

  const handleToggle = async (row: Schedule) => {
    const { error } = await updateSchedule(row.id, { is_active: !row.is_active });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteSchedule(id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Class Schedule</h1>
        <p className="text-muted-foreground">
          Attendance can only be marked during an active scheduled class window.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>Class / Section</Label>
            <Input
              placeholder="10-A"
              value={form.class_section}
              onChange={(e) => setForm({ ...form, class_section: e.target.value })}
            />
          </div>
          <div>
            <Label>Day</Label>
            <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start</Label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <div>
            <Label>Subject (optional)</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> All Schedules
        </h3>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No schedules yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div>
                  <p className="font-medium">
                    {r.class_section} • {DAY_NAMES[r.day_of_week]} • {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                    {r.subject ? ` • ${r.subject}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.is_active ? "Active" : "Disabled"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={r.is_active} onCheckedChange={() => handleToggle(r)} />
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ScheduleManagement;
