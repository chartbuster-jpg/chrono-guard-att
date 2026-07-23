import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Check, X, UserPlus, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getAllStudents, type Profile } from "@/lib/supabase";
import { loadFaceModels, detectDescriptor } from "@/lib/faceApi";
import { useAuth } from "@/contexts/AuthContext";

interface AdminFaceRegistrationProps {
  onSuccess: (studentId: string, studentName: string) => void;
  onError: (error: string) => void;
}

interface StudentRow extends Profile {
  registered: boolean;
}

const AdminFaceRegistration = ({ onSuccess, onError }: AdminFaceRegistrationProps) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordResult, setRecordResult] = useState<"success" | "failed" | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshStudents = async () => {
    setLoadingStudents(true);
    const profiles = await getAllStudents();
    const { data: faceRows } = await supabase.from("face_data").select("student_id");
    const registeredIds = new Set((faceRows || []).map((r: any) => r.student_id));
    setStudents(profiles.map((p) => ({ ...p, registered: registeredIds.has(p.id) })));
    setLoadingStudents(false);
  };

  useEffect(() => {
    refreshStudents();
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

  const handleStartRecording = async () => {
    if (!selectedStudent) return onError("Please select a student first");
    if (!modelsReady) return onError("Face models still loading — please wait a moment.");
    if (!isCameraActive) await startCamera();

    setIsRecording(true);
    setRecordResult(null);

    // Give the camera a beat to stabilize, then try to detect a face.
    await new Promise((r) => setTimeout(r, 800));

    try {
      let descriptor: Float32Array | null = null;
      // Try a few times in case the first frame is dark/blurry.
      for (let attempt = 0; attempt < 5 && !descriptor; attempt++) {
        if (videoRef.current) descriptor = await detectDescriptor(videoRef.current);
        if (!descriptor) await new Promise((r) => setTimeout(r, 500));
      }

      if (!descriptor) {
        setRecordResult("failed");
        onError("No face detected. Ensure good lighting and face the camera.");
      } else {
        const { error } = await supabase
          .from("face_data")
          .upsert(
            {
              student_id: selectedStudent.id,
              face_descriptor: Array.from(descriptor),
              registered_by: user?.id ?? null,
            },
            { onConflict: "student_id" },
          );
        if (error) {
          setRecordResult("failed");
          onError(`Failed to save face data: ${error.message}`);
        } else {
          setRecordResult("success");
          onSuccess(selectedStudent.id, selectedStudent.full_name);
          stopCamera();
          refreshStudents();
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setRecordResult("failed");
      onError(`Recording error: ${msg}`);
    } finally {
      setIsRecording(false);
      setTimeout(() => setRecordResult(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Select Student for Face Registration</h3>
          {!modelsReady && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> loading models…
            </span>
          )}
        </div>

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
            {loadingStudents ? (
              <p className="text-center text-muted-foreground py-4">Loading students…</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {students.length === 0 ? "No student accounts yet. Approve students first." : "No students found."}
              </p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                    selectedStudent?.id === student.id
                      ? "bg-primary-light border-primary"
                      : "bg-background border-border hover:bg-secondary",
                  )}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div>
                    <p className="font-medium text-foreground">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.student_id ? `ID: ${student.student_id} • ` : ""}
                      {student.class_section || "—"}
                      {student.registered && " • Already Registered (will overwrite)"}
                    </p>
                  </div>
                  {selectedStudent?.id === student.id && <Check className="w-5 h-5 text-primary" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Face ID Recording</h3>

        {selectedStudent && (
          <div className="mb-4 p-3 rounded-lg bg-primary-light border border-primary/20">
            <p className="text-sm text-primary">
              Recording face for: <span className="font-medium">{selectedStudent.full_name}</span>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div
            className={cn(
              "w-full h-64 rounded-lg border-2 overflow-hidden relative transition-all duration-300",
              isRecording ? "border-primary" : "border-border",
              recordResult === "success" ? "border-success" : "",
              recordResult === "failed" ? "border-destructive" : "",
            )}
          >
            {recordResult === "success" && (
              <div className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Check className="w-16 h-16 text-success mx-auto mb-2" />
                  <p className="text-success font-medium">Face Recorded Successfully!</p>
                </div>
              </div>
            )}
            {recordResult === "failed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm z-10">
                <div className="text-center">
                  <X className="w-16 h-16 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium">Recording Failed</p>
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
                  <p className="text-muted-foreground">
                    {selectedStudent ? "Click below to start camera" : "Select a student first"}
                  </p>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute inset-0 border-4 border-primary animate-pulse pointer-events-none" />
            )}
          </div>

          <Button
            onClick={handleStartRecording}
            disabled={isRecording || !selectedStudent || !modelsReady}
            className="w-full"
            variant="hero"
            size="lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isRecording ? "Analyzing face…" : "Start Face Recording"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminFaceRegistration;
