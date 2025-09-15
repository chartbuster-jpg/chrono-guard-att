import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, UserCheck, UserX, AlertTriangle, Calendar, Phone } from "lucide-react";
import { getStudentsByStatus, markAttendance, Profile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StudentListProps {
  userRole: "teacher" | "admin";
}

const StudentList = ({ userRole }: StudentListProps) => {
  const [students, setStudents] = useState<{
    present: Profile[];
    absent: Profile[];
    risk: Profile[];
  }>({ present: [], absent: [], risk: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudentsData();
  }, []);

  const loadStudentsData = async () => {
    setLoading(true);
    const data = await getStudentsByStatus();
    setStudents(data);
    setLoading(false);
  };

  const handleManualAttendance = async (studentId: string, status: 'present' | 'absent') => {
    const { error } = await markAttendance(studentId, status, 'manual');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Attendance marked as ${status}.`
      });
      loadStudentsData();
    }
  };

  const filteredStudents = {
    present: students.present.filter(s => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    absent: students.absent.filter(s => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    risk: students.risk.filter((s: any) => 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  const StudentCard = ({ student, status, showActions = false }: { 
    student: Profile | any; 
    status: 'present' | 'absent' | 'risk';
    showActions?: boolean;
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            status === 'present' ? 'bg-success' : 
            status === 'absent' ? 'bg-destructive' : 'bg-warning'
          }`} />
          <div>
            <h4 className="font-medium text-foreground">{student.full_name}</h4>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>ID: {student.student_id}</span>
              <span>•</span>
              <span>Class: {student.class_section}</span>
              {status === 'risk' && student.attendance_percentage !== undefined && (
                <>
                  <span>•</span>
                  <span>Attendance: {student.attendance_percentage.toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={
            status === 'present' ? 'default' : 
            status === 'absent' ? 'destructive' : 'secondary'
          }>
            {status === 'present' ? 'Present' : 
             status === 'absent' ? 'Absent' : 'Risk Student'}
          </Badge>
          
          {showActions && userRole === 'teacher' && (
            <div className="flex space-x-1">
              {status === 'absent' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManualAttendance(student.id, 'present')}
                >
                  Mark Present
                </Button>
              )}
              {status === 'present' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManualAttendance(student.id, 'absent')}
                >
                  Mark Absent
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Attendance Status</h1>
          <p className="text-muted-foreground">View and manage student attendance for today.</p>
        </div>
        <Button onClick={loadStudentsData} variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for different student categories */}
      <Tabs defaultValue="present" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="present" className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Present ({filteredStudents.present.length})</span>
          </TabsTrigger>
          <TabsTrigger value="absent" className="flex items-center space-x-2">
            <UserX className="w-4 h-4" />
            <span>Absent ({filteredStudents.absent.length})</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Students ({filteredStudents.risk.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="present" className="space-y-4">
          {filteredStudents.present.length === 0 ? (
            <Card className="p-8 text-center">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No present students found.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStudents.present.map((student) => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  status="present" 
                  showActions={userRole === 'teacher'}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="absent" className="space-y-4">
          {filteredStudents.absent.length === 0 ? (
            <Card className="p-8 text-center">
              <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No absent students found.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStudents.absent.map((student) => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  status="absent" 
                  showActions={userRole === 'teacher'}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {filteredStudents.risk.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No risk students found.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStudents.risk.map((student) => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  status="risk"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentList;