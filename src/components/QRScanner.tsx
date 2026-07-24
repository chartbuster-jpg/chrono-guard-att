import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { MapPin, Check, X, AlertTriangle, QrCode, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSettings, distanceMeters, getCurrentPosition } from "@/lib/settings";
import { listSchedules, isClassInSession } from "@/lib/schedules";
import { getAllStudents, markAttendance, type Profile } from "@/lib/supabase";

interface QRScannerProps {
  onSuccess: (studentId: string, studentName: string) => void;
  onError: (error: string) => void;
}

/**
 * QR Attendance:
 * - Reads a QR that contains a student_id (or a JSON payload with student_id).
 * - Requires the scanning device (teacher's) to be within the configured geofence.
 * - Requires an active schedule for that student's class right now.
 */
const QRScanner = ({ onSuccess, onError }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"success" | "failed" | "location_error" | "schedule_error" | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [distance, setDistance] = useState<number | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-container";
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {}).finally(() => {
        scannerRef.current?.clear().catch(() => {});
      });
    };
  }, []);

  const extractStudentId = (text: string): string | null => {
    try {
      const obj = JSON.parse(text);
      if (obj && typeof obj.student_id === "string") return obj.student_id;
    } catch {
      // not JSON - treat as raw
    }
    return text.trim() || null;
  };

  const stop = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const start = async () => {
    setResult(null);
    setStatusMsg("Checking location…");
    setScanning(true);

    // 1. Geofence check
    const settings = await getSettings();
    if (!settings || settings.school_lat == null || settings.school_lng == null) {
      setScanning(false);
      setResult("location_error");
      onError("School location not configured. Ask admin to set it in Settings.");
      return;
    }
    try {
      const pos = await getCurrentPosition();
      const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, settings.school_lat, settings.school_lng);
      setDistance(d);
      if (d > settings.geofence_radius_m) {
        setScanning(false);
        setResult("location_error");
        onError(`Outside school premises (${Math.round(d)}m away, allowed ${settings.geofence_radius_m}m).`);
        return;
      }
    } catch (e) {
      setScanning(false);
      setResult("location_error");
      onError(`Location error: ${(e as Error).message}`);
      return;
    }

    // 2. Start camera
    setStatusMsg("Point the camera at the student's QR code…");
    try {
      scannerRef.current = new Html5Qrcode(containerId);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          if (busyRef.current) return;
          busyRef.current = true;
          await handleDecoded(decoded);
          setTimeout(() => { busyRef.current = false; }, 2000);
        },
        () => { /* per-frame decode errors are noisy — ignore */ },
      );
    } catch (e) {
      setScanning(false);
      onError(`Camera error: ${(e as Error).message}`);
    }
  };

  const handleDecoded = async (decoded: string) => {
    const studentId = extractStudentId(decoded);
    if (!studentId) {
      setResult("failed");
      onError("Unreadable QR code.");
      return;
    }

    // 3. Look up student, verify schedule
    const students = await getAllStudents();
    const student = students.find((s: Profile) => s.id === studentId || s.student_id === studentId);
    if (!student) {
      setResult("failed");
      onError(`No student found for QR: ${studentId}`);
      return;
    }
    if (!student.class_section) {
      setResult("failed");
      onError(`${student.full_name} has no class assigned.`);
      return;
    }
    const schedules = await listSchedules();
    const active = isClassInSession(schedules, student.class_section);
    if (!active) {
      setResult("schedule_error");
      onError(`No active class right now for ${student.class_section}.`);
      return;
    }

    // 4. Mark attendance
    const { error } = await markAttendance(student.id, "present", "qr");
    if (error) {
      setResult("failed");
      onError(`Failed to mark: ${error.message}`);
      return;
    }
    setResult("success");
    setStatusMsg(`${student.full_name} marked present`);
    onSuccess(student.id, student.full_name);
    await stop();
  };

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
      <h3 className="text-lg font-semibold text-foreground mb-4">QR Code Attendance</h3>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>
            Geofencing: {distance == null ? "not checked" : `${Math.round(distance)}m from school`}
          </span>
        </div>

        <div
          className={cn(
            "w-full min-h-64 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-300 overflow-hidden relative bg-black",
            scanning ? "border-primary" : "border-border",
            result === "success" ? "border-success" : "",
            result === "failed" ? "border-destructive" : "",
            result === "location_error" || result === "schedule_error" ? "border-warning" : "",
          )}
        >
          <div id={containerId} className="w-full" />

          {!scanning && result === null && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Tap start to scan</p>
              </div>
            </div>
          )}
          {result === "success" && (
            <div className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-sm">
              <div className="text-center">
                <Check className="w-16 h-16 text-success mx-auto mb-2" />
                <p className="text-success font-medium">{statusMsg}</p>
              </div>
            </div>
          )}
          {result === "failed" && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
              <div className="text-center">
                <X className="w-16 h-16 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium">Scan Failed</p>
              </div>
            </div>
          )}
          {(result === "location_error" || result === "schedule_error") && (
            <div className="absolute inset-0 flex items-center justify-center bg-warning/10 backdrop-blur-sm">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-2" />
                <p className="text-warning font-medium">
                  {result === "location_error" ? "Outside geofence" : "No active class"}
                </p>
              </div>
            </div>
          )}
        </div>

        {scanning && <p className="text-sm text-center text-muted-foreground">{statusMsg}</p>}

        {scanning ? (
          <Button onClick={stop} className="w-full" variant="outline" size="lg">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Stop Scanning
          </Button>
        ) : (
          <Button onClick={start} className="w-full" variant="hero" size="lg">
            Start QR Scan
          </Button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
