import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Check, X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getAllStudents, markAttendance, type Profile } from "@/lib/supabase";
import { loadFaceModels, detectDescriptor, findBestMatch } from "@/lib/faceApi";

interface TeacherAttendanceProps {
  onSuccess: (studentId: string, studentName: string) => void;
  onError: (error: string) => void;
}

const TeacherAttendance = ({ onSuccess, onError }: TeacherAttendanceProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannedStudent, setScannedStudent] = useState<{ id: string; name: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [students, setStudents] = useState<Profile[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    getAllStudents().then(setStudents);
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch((e) => onError(`Failed to load face-recognition models: ${e.message}`));
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student_id || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      await new Promise((r) => setTimeout(r, 100));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch (e) { console.error(e); }
      }
      setIsCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      onError(`Unable to access camera: ${msg}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleStartScan = async () => {
    if (!modelsReady) return onError("Face models still loading — please wait a moment.");
    if (!isCameraActive) await startCamera();

    setIsScanning(true);
    setScanResult(null);
    setScannedStudent(null);

    await new Promise((r) => setTimeout(r, 800));

    try {
      // Load all registered face descriptors.
      const { data: faceRows, error: faceErr } = await supabase
        .from("face_data")
        .select("student_id, face_descriptor");
      if (faceErr) throw faceErr;
      const known = (faceRows || []).map((r: any) => ({
        id: r.student_id as string,
        descriptor: r.face_descriptor as number[],
      }));

      if (known.length === 0) {
        setScanResult("failed");
        onError("No face data registered yet. Ask an admin to record students first.");
        setIsScanning(false);
        return;
      }

      let probe: Float32Array | null = null;
      for (let attempt = 0; attempt < 6 && !probe; attempt++) {
        if (videoRef.current) probe = await detectDescriptor(videoRef.current);
        if (!probe) await new Promise((r) => setTimeout(r, 500));
      }

      if (!probe) {
        setScanResult("failed");
        onError("No face detected. Ensure good lighting and face the camera.");
      } else {
        const match = findBestMatch(probe, known);
        if (!match) {
          setScanResult("failed");
          onError("Face not recognized. Try again or use manual search.");
        } else {
          const student = students.find((s) => s.id === match.id);
          const name = student?.full_name || "Unknown student";
          const { error: attErr } = await markAttendance(match.id, "present", "face");
          if (attErr) {
            setScanResult("failed");
            onError(`Recognized but failed to mark attendance: ${attErr.message}`);
          } else {
            setScanResult("success");
            setScannedStudent({ id: match.id, name });
            onSuccess(match.id, name);
            stopCamera();
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setScanResult("failed");
      onError(`Scan error: ${msg}`);
    } finally {
      setIsScanning(false);
      setTimeout(() => {
        setScanResult(null);
        setScannedStudent(null);
      }, 3000);
    }
  };

  const handleManualAttendance = async (student: Profile) => {
    const { error } = await markAttendance(student.id, "present", "manual");
    if (error) return onError(`Failed to mark attendance: ${error.message}`);
    onSuccess(student.id, student.full_name);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Face Recognition Scanner</h3>
          {!modelsReady && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> loading models…
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div
            className={cn(
              "w-full h-64 rounded-lg border-2 overflow-hidden relative transition-all duration-300",
              isScanning ? "border-primary" : "border-border",
              scanResult === "success" ? "border-success" : "",
              scanResult === "failed" ? "border-destructive" : "",
            )}
          >
            {scanResult === "success" && scannedStudent && (
              <div className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Check className="w-16 h-16 text-success mx-auto mb-2" />
                  <p className="text-success font-medium">Student Recognized!</p>
                  <p className="text-sm text-muted-foreground">{scannedStudent.name}</p>
                </div>
              </div>
            )}
            {scanResult === "failed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm z-10">
                <div className="text-center">
                  <X className="w-16 h-16 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium">Recognition Failed</p>
                </div>
              </div>
            )}

            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-black"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Click below to start camera</p>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 border-4 border-primary animate-pulse pointer-events-none" />
            )}
          </div>

          <Button
            onClick={handleStartScan}
            disabled={isScanning || !modelsReady}
            className="w-full"
            variant="hero"
            size="lg"
          >
            {isScanning ? "Analyzing…" : "Start Face Recognition"}
          </Button>
        </div>
      </div>

      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Manual Student Search</h3>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-secondary transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.student_id ? `ID: ${student.student_id} • ` : ""}
                    {student.class_section || "—"}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleManualAttendance(student)} variant="outline">
                  Mark Present
                </Button>
              </div>
            ))}
            {searchQuery && filteredStudents.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No students found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
