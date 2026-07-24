import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllStudents, type Profile } from "@/lib/supabase";

const StudentQRBadges = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { getAllStudents().then(setStudents); }, []);

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q.toLowerCase()) ||
      (s.student_id || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students…" className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print All
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.id} className="p-4 flex flex-col items-center gap-2 text-center">
            <QRCodeSVG value={JSON.stringify({ student_id: s.id })} size={160} includeMargin />
            <p className="font-semibold">{s.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {s.student_id ? `ID: ${s.student_id}` : "—"} • {s.class_section || "no class"}
            </p>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">No students.</p>
        )}
      </div>
    </div>
  );
};

export default StudentQRBadges;
