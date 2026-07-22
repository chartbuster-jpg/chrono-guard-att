import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthLayout from "@/components/AuthLayout";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    student_id: "",
    class_section: "",
    requested_role: "student" as "student" | "teacher" | "admin",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate("/", { replace: true });
  }, [session, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(signInData);
    setSubmitting(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!" });
      navigate("/", { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signUpData.full_name,
          phone: signUpData.phone,
          student_id: signUpData.student_id || null,
          class_section: signUpData.class_section || null,
          requested_role: signUpData.requested_role,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created!",
        description: "The first account is admin. Others need admin approval before accessing role features.",
      });
    }
  };

  return (
    <AuthLayout title="AttendanceApp" subtitle="Sign in or create your account">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="si-email">Email</Label>
              <Input id="si-email" type="email" required value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="si-password">Password</Label>
              <Input id="si-password" type="password" required value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} />
            </div>
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <Label htmlFor="su-name">Full Name</Label>
              <Input id="su-name" required value={signUpData.full_name}
                onChange={(e) => setSignUpData({ ...signUpData, full_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" type="email" required value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="su-password">Password</Label>
              <Input id="su-password" type="password" required minLength={6} value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="su-phone">Phone</Label>
              <Input id="su-phone" type="tel" value={signUpData.phone}
                onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="su-role">I am a</Label>
              <Select value={signUpData.requested_role}
                onValueChange={(v: "student" | "teacher" | "admin") =>
                  setSignUpData({ ...signUpData, requested_role: v })}>
                <SelectTrigger id="su-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {signUpData.requested_role === "student" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="su-sid">Student ID</Label>
                  <Input id="su-sid" value={signUpData.student_id}
                    onChange={(e) => setSignUpData({ ...signUpData, student_id: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="su-cls">Class</Label>
                  <Input id="su-cls" value={signUpData.class_section}
                    onChange={(e) => setSignUpData({ ...signUpData, class_section: e.target.value })} />
                </div>
              </div>
            )}
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              First account becomes admin. Others start as pending and need admin approval.
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
};

export default Auth;
