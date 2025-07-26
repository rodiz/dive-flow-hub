import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus, Mail, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  city?: string;
  role: string;
}

interface InstructorStudent {
  id: string;
  instructor_id: string;
  student_id?: string;
  student_email: string;
  status: string;
  invited_at: string;
  notes?: string;
  profiles?: StudentProfile;
}

export const StudentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch instructor's students
  const { data: instructorStudents, isLoading } = useQuery({
    queryKey: ['instructor-students', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_students')
        .select(`
          id,
          instructor_id,
          student_id,
          student_email,
          status,
          invited_at,
          notes,
          created_at,
          updated_at
        `)
        .eq('instructor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately for students that exist
      const studentsWithProfiles = await Promise.all(
        data.map(async (student) => {
          if (student.student_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, email, first_name, last_name, phone, city, role')
              .eq('user_id', student.student_id)
              .single();
            
            return { ...student, profiles: profile };
          }
          return { ...student, profiles: null };
        })
      );
      
      return studentsWithProfiles as InstructorStudent[];
    },
    enabled: !!user?.id
  });

  // Search for existing students
  const searchStudents = async () => {
    if (!searchEmail.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name, phone, city, role')
        .eq('role', 'student')
        .ilike('email', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;
      
      // Filter out students already added by this instructor
      const existingEmails = instructorStudents?.map(s => s.student_email) || [];
      const filteredResults = data.filter(student => 
        !existingEmails.includes(student.email)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "Error",
        description: "Error al buscar estudiantes",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add existing student
  const addExistingStudentMutation = useMutation({
    mutationFn: async (student: StudentProfile) => {
      const { data, error } = await supabase
        .from('instructor_students')
        .insert({
          instructor_id: user?.id,
          student_id: student.user_id,
          student_email: student.email,
          status: 'active'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Estudiante agregado",
        description: "El estudiante ha sido agregado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-students'] });
      setSearchEmail("");
      setSearchResults([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al agregar estudiante",
        variant: "destructive",
      });
    }
  });

  // Invite new student
  const inviteStudentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-student-invitation', {
        body: { 
          email: inviteEmail.trim(),
          notes: inviteNotes.trim(),
          instructorId: user?.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Invitación enviada",
        description: "Se ha enviado la invitación al estudiante",
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-students'] });
      setInviteEmail("");
      setInviteNotes("");
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al enviar invitación",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: 'default',
      pending: 'secondary',
      invited: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Cargando estudiantes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mis Estudiantes
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Estudiante</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Search existing students */}
                <div className="space-y-3">
                  <Label>Buscar Estudiante Existente</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email del estudiante..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
                    />
                    <Button 
                      onClick={searchStudents} 
                      disabled={isSearching}
                      variant="outline"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {searchResults.map((student) => (
                        <div key={student.user_id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => addExistingStudentMutation.mutate(student)}
                            disabled={addExistingStudentMutation.isPending}
                          >
                            Agregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Label>Invitar Nuevo Estudiante</Label>
                    <Input
                      placeholder="Email de invitación..."
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Textarea
                      placeholder="Mensaje personalizado (opcional)..."
                      value={inviteNotes}
                      onChange={(e) => setInviteNotes(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={() => inviteStudentMutation.mutate()}
                      disabled={!inviteEmail.trim() || inviteStudentMutation.isPending}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {inviteStudentMutation.isPending ? 'Enviando...' : 'Enviar Invitación'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!instructorStudents?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tienes estudiantes agregados aún.</p>
            <p className="text-sm">Usa el botón "Agregar Estudiante" para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {instructorStudents.map((student) => (
              <div key={student.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {student.profiles ? (
                        <h3 className="font-medium">
                          {student.profiles.first_name} {student.profiles.last_name}
                        </h3>
                      ) : (
                        <h3 className="font-medium text-muted-foreground">
                          {student.student_email}
                        </h3>
                      )}
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {student.student_email}
                    </p>
                    
                    {student.profiles?.phone && (
                      <p className="text-sm text-muted-foreground">
                        📱 {student.profiles.phone}
                      </p>
                    )}
                    
                    {student.profiles?.city && (
                      <p className="text-sm text-muted-foreground">
                        📍 {student.profiles.city}
                      </p>
                    )}
                    
                    {student.notes && (
                      <div className="flex items-start gap-2 mt-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm">{student.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    {student.status === 'active' ? 'Activo' : 
                     student.status === 'invited' ? 'Invitado' : 'Pendiente'}
                    <br />
                    <span className="text-xs">
                      {new Date(student.invited_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};