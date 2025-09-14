import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, MapPin, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onSuccess: (studentId: string) => void;
  onError: (error: string) => void;
}

const QRScanner = ({ onSuccess, onError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "failed" | "location_error" | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const checkGeofencing = () => {
    // Simulate getting user location
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setLocation({ lat: userLat, lng: userLng });
          
          // Simulate school location check (within 100m radius)
          const schoolLat = 40.7128; // Example coordinates
          const schoolLng = -74.0060;
          
          const distance = Math.sqrt(
            Math.pow(userLat - schoolLat, 2) + Math.pow(userLng - schoolLng, 2)
          ) * 111000; // Convert to meters (approximate)
          
          resolve(distance < 100); // Within 100 meters
        },
        () => {
          resolve(false);
        }
      );
    });
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Check geofencing first
    const isWithinGeofence = await checkGeofencing();
    
    if (!isWithinGeofence) {
      setScanResult("location_error");
      onError("You are not within the school premises.");
      setIsScanning(false);
      setTimeout(() => setScanResult(null), 3000);
      return;
    }
    
    // Simulate QR code scanning
    setTimeout(() => {
      const isSuccessful = Math.random() > 0.2; // 80% success rate for demo
      
      if (isSuccessful) {
        setScanResult("success");
        onSuccess("STUDENT001");
      } else {
        setScanResult("failed");
        onError("Invalid QR code. Please try again.");
      }
      
      setIsScanning(false);
      setTimeout(() => setScanResult(null), 3000);
    }, 2000);
  };

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
      <h3 className="text-lg font-semibold text-foreground mb-4">QR Code Attendance</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>Geofencing: {location ? "Location verified" : "Checking location..."}</span>
        </div>
        
        <div className={cn(
          "w-full h-64 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-300",
          isScanning ? "border-primary bg-primary-light animate-pulse" : "border-border bg-muted",
          scanResult === "success" ? "border-success bg-success-light" : "",
          scanResult === "failed" ? "border-destructive bg-destructive-light" : "",
          scanResult === "location_error" ? "border-warning bg-warning-light" : ""
        )}>
          {scanResult === "success" ? (
            <div className="text-center">
              <Check className="w-16 h-16 text-success mx-auto mb-2" />
              <p className="text-success font-medium">QR Code Scanned!</p>
              <p className="text-sm text-muted-foreground">Student ID: STUDENT001</p>
            </div>
          ) : scanResult === "failed" ? (
            <div className="text-center">
              <X className="w-16 h-16 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">Invalid QR Code</p>
              <p className="text-sm text-muted-foreground">Please scan a valid code</p>
            </div>
          ) : scanResult === "location_error" ? (
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-2" />
              <p className="text-warning font-medium">Location Check Failed</p>
              <p className="text-sm text-muted-foreground">Not within school premises</p>
            </div>
          ) : (
            <div className="text-center">
              <QrCode className={cn(
                "w-16 h-16 mx-auto mb-2",
                isScanning ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              <p className="text-muted-foreground">
                {isScanning ? "Scanning QR code..." : "Position QR code in camera view"}
              </p>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full"
          variant="outline"
          size="lg"
        >
          {isScanning ? "Scanning..." : "Scan QR Code"}
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;