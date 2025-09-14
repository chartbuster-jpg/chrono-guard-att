import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AttendanceChart from "@/components/AttendanceChart";
import FaceRecognition from "@/components/FaceRecognition";
import QRScanner from "@/components/QRScanner";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  PlayCircle,
  Settings,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  userRole: "student" | "teacher" | "admin";
  onLogout: () => void;
}

const Dashboard = ({ userRole, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const attendanceData = [
    { name: "Present", value: 85, color: "hsl(142 76% 36%)" },
    { name: "Absent", value: 10, color: "hsl(0 84% 60%)" },
    { name: "Late", value: 5, color: "hsl(38 92% 50%)" },
  ];

  const handleAttendanceSuccess = (studentId: string) => {
    toast({
      title: "Attendance Marked",
      description: `Successfully marked attendance for ${studentId}`,
    });
  };

  const handleAttendanceError = (error: string) => {
    toast({
      title: "Attendance Failed",
      description: error,
      variant: "destructive",
    });
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Here's your attendance overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value="1,234"
          icon={<Users className="w-6 h-6" />}
          trend={{ value: "12%", isPositive: true }}
        />
        <StatsCard
          title="Present Today"
          value="1,048"
          icon={<CheckCircle className="w-6 h-6" />}
          variant="success"
          trend={{ value: "5%", isPositive: true }}
        />
        <StatsCard
          title="Absent Today"
          value="123"
          icon={<XCircle className="w-6 h-6" />}
          variant="danger"
          trend={{ value: "2%", isPositive: false }}
        />
        <StatsCard
          title="Risk Students"
          value="45"
          icon={<AlertTriangle className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart 
          data={attendanceData}
          title="Today's Attendance Distribution"
        />
        <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { time: "09:15 AM", action: "Face recognition attendance", student: "John Doe", status: "success" },
              { time: "09:12 AM", action: "QR code attendance", student: "Jane Smith", status: "success" },
              { time: "09:10 AM", action: "Face recognition failed", student: "Unknown", status: "failed" },
              { time: "09:08 AM", action: "QR code attendance", student: "Mike Johnson", status: "success" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === "success" ? "bg-success" : "bg-destructive"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.student}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Mark Attendance</h1>
        <p className="text-muted-foreground">Use face recognition or QR code to mark your attendance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FaceRecognition 
          onSuccess={handleAttendanceSuccess}
          onError={handleAttendanceError}
        />
        <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
          <h3 className="text-lg font-semibold text-foreground mb-4">Schedule</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary-light border border-primary/20">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Mathematics</p>
                  <p className="text-sm text-primary/70">Room 101</p>
                </div>
              </div>
              <span className="text-sm font-medium text-primary">9:00 - 10:00 AM</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Physics</p>
                  <p className="text-sm text-muted-foreground">Room 205</p>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">10:15 - 11:15 AM</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Chemistry</p>
                  <p className="text-sm text-muted-foreground">Lab 3</p>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">11:30 - 12:30 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQRAttendance = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">QR Code Attendance</h1>
        <p className="text-muted-foreground">Scan QR code for backup attendance marking with location verification.</p>
      </div>

      <div className="max-w-md mx-auto">
        <QRScanner 
          onSuccess={handleAttendanceSuccess}
          onError={handleAttendanceError}
        />
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Statistics</h1>
        <p className="text-muted-foreground">Detailed insights into attendance patterns and trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart 
          data={[
            { name: "This Month", value: 22, color: "hsl(142 76% 36%)" },
            { name: "Missed", value: 3, color: "hsl(0 84% 60%)" },
          ]}
          title="Monthly Attendance (Individual)"
        />
        <AttendanceChart 
          data={[
            { name: "Morning", value: 18, color: "hsl(217 91% 60%)" },
            { name: "Afternoon", value: 15, color: "hsl(142 76% 36%)" },
            { name: "Evening", value: 12, color: "hsl(38 92% 50%)" },
          ]}
          title="Attendance by Time"
        />
      </div>
    </div>
  );

  const renderTutorials = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Video Tutorials</h1>
        <p className="text-muted-foreground">Learn how to use the attendance system effectively.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Getting Started", duration: "5:30", thumbnail: "face-recognition" },
          { title: "Face Recognition Setup", duration: "3:45", thumbnail: "qr-code" },
          { title: "QR Code Attendance", duration: "2:20", thumbnail: "statistics" },
          { title: "Understanding Statistics", duration: "4:15", thumbnail: "admin" },
        ].map((video, index) => (
          <div key={index} className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
              <PlayCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{video.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">Duration: {video.duration}</p>
            <Button variant="outline" className="w-full">
              Watch Tutorial
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdminFeatures = () => {
    if (userRole !== "admin") return null;

    switch (activeTab) {
      case "users":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
                <p className="text-muted-foreground">Manage students, teachers, and administrators.</p>
              </div>
              <Button variant="hero">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
            <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
              <p className="text-center text-muted-foreground">User management interface will be implemented here.</p>
            </div>
          </div>
        );
      case "hostel":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Hostel Management</h1>
              <p className="text-muted-foreground">Monitor hostel check-in and check-out activities.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Rooms"
                value="120"
                icon={<Building className="w-6 h-6" />}
              />
              <StatsCard
                title="Occupied"
                value="95"
                icon={<Users className="w-6 h-6" />}
                variant="success"
              />
              <StatsCard
                title="Check-ins Today"
                value="87"
                icon={<CheckCircle className="w-6 h-6" />}
                variant="success"
              />
              <StatsCard
                title="Late Check-ins"
                value="8"
                icon={<AlertTriangle className="w-6 h-6" />}
                variant="warning"
              />
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
              <p className="text-muted-foreground">Configure attendance system parameters and notifications.</p>
            </div>
            <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
              <p className="text-center text-muted-foreground">System settings interface will be implemented here.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    const adminContent = renderAdminFeatures();
    if (adminContent) return adminContent;

    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "attendance":
        return renderAttendance();
      case "qr-attendance":
        return renderQRAttendance();
      case "statistics":
        return renderStatistics();
      case "tutorials":
        return renderTutorials();
      default:
        return renderDashboard();
    }
  };

  return (
    <DashboardLayout
      userRole={userRole}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;