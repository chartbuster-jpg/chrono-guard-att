import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Check, X, UserPlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminFaceRegistrationProps {
  onSuccess: (studentId: string, studentName: string) => void;
  onError: (error: string) => void;
}

const AdminFaceRegistration = ({ onSuccess, onError }: AdminFaceRegistrationProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordResult, setRecordResult] = useState<"success" | "failed" | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string, class: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock student database - in real app this would come from backend
  const students = [
    { id: "STU001", name: "John Doe", class: "10A", registered: true },
    { id: "STU002", name: "Jane Smith", class: "10A", registered: false },
    { id: "STU003", name: "Mike Johnson", class: "10B", registered: false },
    { id: "STU004", name: "Sarah Wilson", class: "10A", registered: true },
    { id: "STU005", name: "Alex Brown", class: "10B", registered: false },
  ];

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRecording = () => {
    if (!selectedStudent) {
      onError("Please select a student first");
      return;
    }

    setIsRecording(true);
    setRecordResult(null);
    
    // Simulate face recording process
    setTimeout(() => {
      const isSuccessful = Math.random() > 0.1; // 90% success rate for demo
      
      if (isSuccessful) {
        setRecordResult("success");
        onSuccess(selectedStudent.id, selectedStudent.name);
      } else {
        setRecordResult("failed");
        onError("Face recording failed. Please ensure good lighting and try again.");
      }
      
      setIsRecording(false);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setRecordResult(null);
      }, 3000);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Select Student for Face Registration</h3>
        
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
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                  selectedStudent?.id === student.id 
                    ? "bg-primary-light border-primary" 
                    : "bg-background border-border hover:bg-secondary",
                  student.registered && "opacity-50"
                )}
                onClick={() => !student.registered && setSelectedStudent(student)}
              >
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {student.id} • Class: {student.class}
                    {student.registered && " • Already Registered"}
                  </p>
                </div>
                {selectedStudent?.id === student.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            ))}
            {searchQuery && filteredStudents.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No students found</p>
            )}
          </div>
        </div>
      </div>

      {/* Face Recording */}
      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Face ID Recording</h3>
        
        {selectedStudent && (
          <div className="mb-4 p-3 rounded-lg bg-primary-light border border-primary/20">
            <p className="text-sm text-primary">
              Recording face for: <span className="font-medium">{selectedStudent.name}</span> ({selectedStudent.id})
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className={cn(
            "w-full h-64 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-300",
            isRecording ? "border-primary bg-primary-light animate-pulse" : "border-border bg-muted",
            recordResult === "success" ? "border-success bg-success-light" : "",
            recordResult === "failed" ? "border-destructive bg-destructive-light" : ""
          )}>
            {recordResult === "success" ? (
              <div className="text-center">
                <Check className="w-16 h-16 text-success mx-auto mb-2" />
                <p className="text-success font-medium">Face Recorded Successfully!</p>
                <p className="text-sm text-muted-foreground">Student can now use face recognition</p>
              </div>
            ) : recordResult === "failed" ? (
              <div className="text-center">
                <X className="w-16 h-16 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium">Recording Failed</p>
                <p className="text-sm text-muted-foreground">Please try again with better lighting</p>
              </div>
            ) : (
              <div className="text-center">
                <Camera className={cn(
                  "w-16 h-16 mx-auto mb-2",
                  isRecording ? "text-primary animate-pulse" : "text-muted-foreground"
                )} />
                <p className="text-muted-foreground">
                  {isRecording 
                    ? "Recording face data... Please hold still" 
                    : selectedStudent 
                      ? "Ask student to position face in camera view" 
                      : "Select a student first"
                  }
                </p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleStartRecording}
            disabled={isRecording || !selectedStudent}
            className="w-full"
            variant="hero"
            size="lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isRecording ? "Recording Face Data..." : "Start Face Recording"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminFaceRegistration;