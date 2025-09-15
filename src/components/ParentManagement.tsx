import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Phone, Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllStudents, addParent, getParentsByStudent, Profile, Parent } from "@/lib/supabase";

const ParentManagement = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [parentData, setParentData] = useState({
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    relationship: "parent"
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadParents(selectedStudent);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    const studentsData = await getAllStudents();
    setStudents(studentsData);
  };

  const loadParents = async (studentId: string) => {
    const parentsData = await getParentsByStudent(studentId);
    setParents(parentsData);
  };

  const handleAddParent = async () => {
    if (!selectedStudent || !parentData.parent_name || !parentData.parent_phone) {
      toast({
        title: "Missing Information",
        description: "Please select a student and fill in parent name and phone number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await addParent({
      student_id: selectedStudent,
      ...parentData
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add parent information.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Parent information added successfully."
      });
      setParentData({
        parent_name: "",
        parent_phone: "",
        parent_email: "",
        relationship: "parent"
      });
      loadParents(selectedStudent);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Parent Management</h1>
        <p className="text-muted-foreground">Add and manage parent contact information for SMS notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Parent Form */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Add Parent Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="student-select">Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.student_id}) - {student.class_section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parent-name">Parent Name</Label>
              <Input
                id="parent-name"
                value={parentData.parent_name}
                onChange={(e) => setParentData(prev => ({ ...prev, parent_name: e.target.value }))}
                placeholder="Enter parent's full name"
              />
            </div>

            <div>
              <Label htmlFor="parent-phone">Phone Number</Label>
              <Input
                id="parent-phone"
                type="tel"
                value={parentData.parent_phone}
                onChange={(e) => setParentData(prev => ({ ...prev, parent_phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>

            <div>
              <Label htmlFor="parent-email">Email (Optional)</Label>
              <Input
                id="parent-email"
                type="email"
                value={parentData.parent_email}
                onChange={(e) => setParentData(prev => ({ ...prev, parent_email: e.target.value }))}
                placeholder="parent@example.com"
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Select 
                value={parentData.relationship} 
                onValueChange={(value) => setParentData(prev => ({ ...prev, relationship: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAddParent} 
              disabled={loading}
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? "Adding..." : "Add Parent"}
            </Button>
          </div>
        </Card>

        {/* Parent List */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Parent Contacts
              {selectedStudent && students.find(s => s.id === selectedStudent) && 
                ` - ${students.find(s => s.id === selectedStudent)?.full_name}`
              }
            </h3>
          </div>

          {!selectedStudent ? (
            <p className="text-muted-foreground text-center py-8">
              Select a student to view their parent contacts
            </p>
          ) : parents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No parent contacts added yet
            </p>
          ) : (
            <div className="space-y-4">
              {parents.map((parent) => (
                <div key={parent.id} className="p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">{parent.parent_name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{parent.parent_phone}</span>
                        </div>
                        {parent.parent_email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{parent.parent_email}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {parent.relationship}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ParentManagement;