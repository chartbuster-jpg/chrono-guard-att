import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, UserCheck, UserX, AlertTriangle, Calendar, Phone, Mail, MapPin, MessageSquare, User } from "lucide-react";
import { getAllStudents, markAttendance, Profile, getParentsByStudent, Parent } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StudentListProps {
  userRole: "teacher" | "admin";
}

const StudentList = ({ userRole }: StudentListProps) => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [parents, setParents] = useState<{[key: string]: Parent[]}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock attendance data for demo
  const mockAttendanceData = {
    "STU001": { status: "present", attendanceRate: 92, riskLevel: "low", lastAttendance: "2024-01-15 09:30 AM" },
    "STU002": { status: "absent", attendanceRate: 78, riskLevel: "medium", lastAttendance: "2024-01-14 09:15 AM" },
    "STU003": { status: "absent", attendanceRate: 65, riskLevel: "high", lastAttendance: "2024-01-10 09:45 AM" },
    "STU004": { status: "present", attendanceRate: 95, riskLevel: "low", lastAttendance: "2024-01-15 09:20 AM" },
  };

  useEffect(() => {
    loadStudentsData();
  }, []);

  const loadStudentsData = async () => {
    setLoading(true);
    const studentsData = await getAllStudents();
    setStudents(studentsData);
    
    // Load parent data for each student
    const parentData: {[key: string]: Parent[]} = {};
    await Promise.all(studentsData.map(async (student) => {
      const studentParents = await getParentsByStudent(student.id);
      parentData[student.id] = studentParents;
    }));
    setParents(parentData);
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

  const handleSendSMS = async (student: Profile) => {
    const studentParents = parents[student.id] || [];
    if (studentParents.length === 0) {
      toast({
        title: "No Parent Contact",
        description: "No parent contact information found for this student.",
        variant: "destructive"
      });
      return;
    }

    // In real app, this would call SMS API
    toast({
      title: "SMS Sent",
      description: `Absence notification sent to ${studentParents[0].parent_name} (${studentParents[0].parent_phone})`,
    });
  };

  const getStudentData = (student: Profile) => {
    return mockAttendanceData[student.student_id as keyof typeof mockAttendanceData] || {
      status: "present",
      attendanceRate: 85,
      riskLevel: "low",
      lastAttendance: "N/A"
    };
  };

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class_section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentStudents = filteredStudents.filter(s => getStudentData(s).status === "present");
  const absentStudents = filteredStudents.filter(s => getStudentData(s).status === "absent");
  const riskStudents = filteredStudents.filter(s => getStudentData(s).riskLevel === "high");

  const StudentCard = ({ student }: { student: Profile }) => {
    const studentData = getStudentData(student);
    const studentParents = parents[student.id] || [];
    
    return (
      <Card className="hover:shadow-custom-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{student.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <Badge variant={studentData.status === "present" ? "default" : "destructive"}>
                {studentData.status}
              </Badge>
              <Badge variant={
                studentData.riskLevel === "low" ? "default" : 
                studentData.riskLevel === "medium" ? "secondary" : "destructive"
              } className="text-xs">
                {studentData.riskLevel} risk
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Class</p>
              <p className="font-medium">{student.class_section}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Attendance</p>
              <p className="font-medium">{studentData.attendanceRate}%</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{student.email || "No email"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{student.phone || "No phone"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{student.class_section || "No class"}</span>
            </div>
          </div>

          {studentParents.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground mb-1">Parent Contact</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{studentParents[0].parent_name}</p>
                  <p className="text-xs text-muted-foreground">{studentParents[0].parent_phone}</p>
                </div>
                {studentData.status === "absent" && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSendSMS(student)}
                    className="ml-2 flex-shrink-0"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    SMS
                  </Button>
                )}
              </div>
            </div>
          )}

          {userRole === 'teacher' && (
            <div className="border-t pt-3 flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualAttendance(student.id, 'present')}
                className="flex-1"
              >
                Mark Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualAttendance(student.id, 'absent')}
                className="flex-1"
              >
                Mark Absent
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Last seen: {studentData.lastAttendance}
          </div>
        </CardContent>
      </Card>
    );
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">Monitor attendance and manage student information</p>
        </div>
        <Button onClick={loadStudentsData} variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-success rounded-full" />
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-success">{presentStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-destructive rounded-full" />
              <div>
                <p className="text-sm text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-destructive">{absentStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Risk Students</p>
                <p className="text-2xl font-bold text-warning">{riskStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for different student categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Students ({filteredStudents.length})</TabsTrigger>
          <TabsTrigger value="present" className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Present ({presentStudents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="absent" className="flex items-center space-x-2">
            <UserX className="w-4 h-4" />
            <span>Absent ({absentStudents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Risk ({riskStudents.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="present" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {presentStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="absent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {absentStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {riskStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No students found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default StudentList;