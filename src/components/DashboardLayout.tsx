import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Home,
  CameraIcon,
  QrCode,
  Building,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "student" | "teacher" | "admin";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const DashboardLayout = ({ children, userRole, activeTab, onTabChange, onLogout }: DashboardLayoutProps) => {
  const getNavItems = () => {
    const commonItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "attendance", label: "Attendance", icon: CameraIcon },
      { id: "qr-attendance", label: "QR Attendance", icon: QrCode },
      { id: "statistics", label: "Statistics", icon: BarChart3 },
      { id: "tutorials", label: "Video Tutorials", icon: PlayCircle },
    ];

    const roleSpecificItems = {
      student: [],
      teacher: [
        { id: "students", label: "Students", icon: Users },
      ],
      admin: [
        { id: "users", label: "Manage Users", icon: Users },
        { id: "schedule", label: "Schedule", icon: Calendar },
        { id: "hostel", label: "Hostel", icon: Building },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    };

    return [...commonItems, ...roleSpecificItems[userRole]];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border shadow-custom-lg z-40">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AttendanceApp</h1>
              <p className="text-sm text-muted-foreground capitalize">{userRole} Portal</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-left",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground shadow-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive-light"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;