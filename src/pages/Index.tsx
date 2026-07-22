import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";

const Index = () => {
  const { session, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate("/auth", { replace: true });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (role === "pending" || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Awaiting Approval</h1>
          <p className="text-muted-foreground">
            Your account has been created but hasn't been assigned a role yet.
            An administrator needs to approve your account before you can access the system.
          </p>
          <button
            onClick={signOut}
            className="text-primary underline text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Students, teachers, and admins get the dashboard
  return <Dashboard userRole={role as "student" | "teacher" | "admin"} onLogout={signOut} />;
};

export default Index;
