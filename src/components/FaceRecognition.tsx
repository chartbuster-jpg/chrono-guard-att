import { useState, useRef, useEffect } from "react";
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      console.log("Camera access granted, stream:", stream);
      
      streamRef.current = stream;
      
      // Wait a tick to ensure video element is mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Stream assigned to video element");
        
        // Ensure video plays
        try {
          await videoRef.current.play();
          console.log("Video playback started");
        } catch (playErr) {
          console.error("Video play error:", playErr);
        }
      }
      setIsCameraActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Camera error:", errorMessage, err);
      onError(`Unable to access camera: ${errorMessage}. Please check permissions.`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
    
    // Simulate face recognition process
    setTimeout(() => {
      const isSuccessful = Math.random() > 0.3;
      
      if (isSuccessful) {
        setScanResult("success");
        onSuccess("STUDENT001");
        stopCamera();
      } else {
        setScanResult("failed");
        onError("Face not recognized. Please try again.");
      }
      
      setIsScanning(false);
      
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
          "w-full h-64 rounded-lg border-2 overflow-hidden relative transition-all duration-300",
          isScanning ? "border-primary" : "border-border",
          scanResult === "success" ? "border-success" : "",
          scanResult === "failed" ? "border-destructive" : ""
        )}>
          {scanResult === "success" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-sm">
              <div className="text-center">
                <Check className="w-16 h-16 text-success mx-auto mb-2" />
                <p className="text-success font-medium">Recognition Successful!</p>
                <p className="text-sm text-muted-foreground">Student ID: STUDENT001</p>
              </div>
            </div>
          ) : scanResult === "failed" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
              <div className="text-center">
                <X className="w-16 h-16 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium">Recognition Failed</p>
                <p className="text-sm text-muted-foreground">Please try again</p>
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