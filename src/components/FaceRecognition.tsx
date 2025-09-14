import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaceRecognitionProps {
  onSuccess: (studentId: string) => void;
  onError: (error: string) => void;
}

const FaceRecognition = ({ onSuccess, onError }: FaceRecognitionProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate face recognition process
    setTimeout(() => {
      const isSuccessful = Math.random() > 0.3; // 70% success rate for demo
      
      if (isSuccessful) {
        setScanResult("success");
        onSuccess("STUDENT001");
      } else {
        setScanResult("failed");
        onError("Face not recognized. Please try again.");
      }
      
      setIsScanning(false);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    }, 3000);
  };

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
      <h3 className="text-lg font-semibold text-foreground mb-4">Face Recognition Attendance</h3>
      
      <div className="space-y-4">
        <div className={cn(
          "w-full h-64 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-300",
          isScanning ? "border-primary bg-primary-light animate-pulse" : "border-border bg-muted",
          scanResult === "success" ? "border-success bg-success-light" : "",
          scanResult === "failed" ? "border-destructive bg-destructive-light" : ""
        )}>
          {scanResult === "success" ? (
            <div className="text-center">
              <Check className="w-16 h-16 text-success mx-auto mb-2" />
              <p className="text-success font-medium">Recognition Successful!</p>
              <p className="text-sm text-muted-foreground">Student ID: STUDENT001</p>
            </div>
          ) : scanResult === "failed" ? (
            <div className="text-center">
              <X className="w-16 h-16 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">Recognition Failed</p>
              <p className="text-sm text-muted-foreground">Please try again</p>
            </div>
          ) : (
            <div className="text-center">
              <Camera className={cn(
                "w-16 h-16 mx-auto mb-2",
                isScanning ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              <p className="text-muted-foreground">
                {isScanning ? "Scanning face..." : "Position your face in the camera view"}
              </p>
            </div>
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
  );
};

export default FaceRecognition;