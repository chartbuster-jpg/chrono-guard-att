import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Clock, Search, CheckCircle, XCircle } from "lucide-react";
import { getAllStudents, getHostelRecords, updateHostelStatus, Profile, HostelRecord } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "./StatsCard";

const HostelManagement = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [hostelRecords, setHostelRecords] = useState<HostelRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [studentsData, recordsData] = await Promise.all([
      getAllStudents(),
      getHostelRecords()
    ]);
    setStudents(studentsData);
    setHostelRecords(recordsData);
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!selectedStudent || !roomNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a student and enter room number.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await updateHostelStatus(selectedStudent, 'checked_in', roomNumber);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to check in student.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Student checked in successfully."
      });
      setSelectedStudent("");
      setRoomNumber("");
      loadData();
    }
  };

  const handleCheckOut = async (studentId: string) => {
    const { error } = await updateHostelStatus(studentId, 'checked_out');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to check out student.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Student checked out successfully."
      });
      loadData();
    }
  };

  const filteredRecords = hostelRecords.filter(record => {
    const student = students.find(s => s.id === record.student_id);
    if (!student) return false;
    
    return student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           record.room_number.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = {
    totalRooms: 120,
    occupied: hostelRecords.filter(r => r.status === 'checked_in').length,
    checkInsToday: hostelRecords.filter(r => 
      r.date === new Date().toISOString().split('T')[0] && r.check_in_time
    ).length,
    lateCheckIns: hostelRecords.filter(r => 
      r.date === new Date().toISOString().split('T')[0] && 
      r.check_in_time && 
      new Date(r.check_in_time).getHours() > 22
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hostel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Hostel Management</h1>
        <p className="text-muted-foreground">Monitor hostel check-in and check-out activities.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Rooms"
          value={stats.totalRooms.toString()}
          icon={<Building className="w-6 h-6" />}
        />
        <StatsCard
          title="Occupied"
          value={stats.occupied.toString()}
          icon={<Users className="w-6 h-6" />}
          variant="success"
        />
        <StatsCard
          title="Check-ins Today"
          value={stats.checkInsToday.toString()}
          icon={<CheckCircle className="w-6 h-6" />}
          variant="success"
        />
        <StatsCard
          title="Late Check-ins"
          value={stats.lateCheckIns.toString()}
          icon={<Clock className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      {/* Check-in Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Check-in Student</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="student-select">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="room-number">Room Number</Label>
            <Input
              id="room-number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Enter room number"
            />
          </div>
          
          <div className="flex items-end">
            <Button onClick={handleCheckIn} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, ID, or room number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Hostel Records */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Current Hostel Status</h3>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hostel records found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const student = students.find(s => s.id === record.student_id);
              if (!student) return null;

              return (
                <div key={record.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'checked_in' ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <div>
                      <h4 className="font-medium text-foreground">{student.full_name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>ID: {student.student_id}</span>
                        <span>Room: {record.room_number}</span>
                        {record.check_in_time && (
                          <span>Check-in: {new Date(record.check_in_time).toLocaleTimeString()}</span>
                        )}
                        {record.check_out_time && (
                          <span>Check-out: {new Date(record.check_out_time).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={record.status === 'checked_in' ? 'default' : 'secondary'}>
                      {record.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
                    </Badge>
                    
                    {record.status === 'checked_in' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckOut(record.student_id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Check Out
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HostelManagement;