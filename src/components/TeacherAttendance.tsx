import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherAttendanceProps {
  onSuccess: (studentId: string, studentName: string) => void;
  onError: (error: string) => void;
}

const TeacherAttendance = ({ onSuccess, onError }: TeacherAttendanceProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannedStudent, setScannedStudent] = useState<{id: string, name: string} | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock student database - in real app this would come from backend
  const students = [
    { id: "STU001", name: "John Doe", class: "10A" },
    { id: "STU002", name: "Jane Smith", class: "10A" },
    { id: "STU003", name: "Mike Johnson", class: "10B" },
    { id: "STU004", name: "Sarah Wilson", class: "10A" },
  ];

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log("[TeacherAttendance] Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      await new Promise(r => setTimeout(r, 100));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch (e) { console.error("[TeacherAttendance] play error", e); }
      }
      setIsCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[TeacherAttendance] Camera error:", msg, err);
      onError(`Unable to access camera: ${msg}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleStartScan = async () => {
    if (!isCameraActive) {
      await startCamera();
    }

    setIsScanning(true);
    setScanResult(null);
    setScannedStudent(null);
    
    // Simulate face recognition process
    setTimeout(() => {
      const isSuccessful = Math.random() > 0.2;
      
      if (isSuccessful) {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        setScanResult("success");
        setScannedStudent(randomStudent);
        onSuccess(randomStudent.id, randomStudent.name);
        stopCamera();
      } else {
        setScanResult("failed");
        onError("Face not recognized. Please try again or use manual search.");
      }
      
      setIsScanning(false);
      
      setTimeout(() => {
        setScanResult(null);
        setScannedStudent(null);
      }, 3000);
    }, 3000);
  };
  const handleManualAttendance = (student: {id: string, name: string}) => {
    onSuccess(student.id, student.name);
  };

  return (
    <div className="space-y-6">
      {/* Face Recognition Scanner */}
      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Face Recognition Scanner</h3>
        
        <div className="space-y-4">
          <div className={cn(
            "w-full h-64 rounded-lg border-2 overflow-hidden relative transition-all duration-300",
            isScanning ? "border-primary" : "border-border",
            scanResult === "success" ? "border-success" : "",
            scanResult === "failed" ? "border-destructive" : ""
          )}>
            {scanResult === "success" && scannedStudent ? (
              <div className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Check className="w-16 h-16 text-success mx-auto mb-2" />
                  <p className="text-success font-medium">Student Recognized!</p>
                  <p className="text-sm text-muted-foreground">{scannedStudent.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {scannedStudent.id}</p>
                </div>
              </div>
            ) : scanResult === "failed" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm z-10">
                <div className="text-center">
                  <X className="w-16 h-16 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium">Recognition Failed</p>
                  <p className="text-sm text-muted-foreground">Please try again or search manually</p>
                </div>
              </div>
            ) : null}

            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-black"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Click below to start camera
                  </p>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 border-4 border-primary animate-pulse pointer-events-none" />
            )}
          </div>
          
          <Button 
            onClick={handleStartScan}
            disabled={isScanning}
            className="w-full"
            variant="hero"
            size="lg"
          >
            {isScanning ? "Scanning..." : "Start Face Recognition"}
          </Button>
        </div>
      </div>

      {/* Manual Student Search */}
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
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-secondary transition-colors">
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {student.id} • Class: {student.class}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleManualAttendance(student)}
                  variant="outline"
                >
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