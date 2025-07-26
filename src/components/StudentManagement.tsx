import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Users, Phone, MapPin } from "lucide-react";
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
  student_id: string;
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
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: ""
  });

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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for all students
      const studentsWithProfiles = await Promise.all(
        data.map(async (student) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, email, first_name, last_name, phone, city, role')
            .eq('user_id', student.student_id)
            .single();
          
          return { ...student, profiles: profile };
        })
      );
      
      return studentsWithProfiles as InstructorStudent[];
    },
    enabled: !!user?.id
  });

  // Create new student
  const createStudentMutation = useMutation({
    mutationFn: async () => {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStudent.email.trim(),
        password: tempPassword,
        user_metadata: {
          first_name: newStudent.firstName.trim(),
          last_name: newStudent.lastName.trim(),
          role: 'student'
        }
      });

      if (authError) throw authError;

      // Create profile (should be handled by trigger, but let's ensure it exists)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          email: newStudent.email.trim(),
          first_name: newStudent.firstName.trim(),
          last_name: newStudent.lastName.trim(),
          phone: newStudent.phone.trim() || null,
          city: newStudent.city.trim() || null,
          role: 'student'
        });

      if (profileError) throw profileError;

      // Add to instructor's students
      const { error: relationError } = await supabase
        .from('instructor_students')
        .insert({
          instructor_id: user?.id,
          student_id: authData.user.id,
          student_email: newStudent.email.trim(),
          status: 'active'
        });

      if (relationError) throw relationError;

      return { student: authData.user, tempPassword };
    },
    onSuccess: () => {
      toast({
        title: "Estudiante creado",
        description: "El estudiante ha sido creado exitosamente y está listo para inmersiones",
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-students'] });
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: ""
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear estudiante",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName.trim() || !newStudent.lastName.trim() || !newStudent.email.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    createStudentMutation.mutate();
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
                <DialogTitle>Crear Nuevo Estudiante</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nombre"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Apellido"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={newStudent.city}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Bogotá, Medellín, etc."
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={createStudentMutation.isPending}
                  className="w-full"
                >
                  {createStudentMutation.isPending ? 'Creando...' : 'Crear Estudiante'}
                </Button>
              </form>
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
                      <h3 className="font-medium">
                        {student.profiles?.first_name} {student.profiles?.last_name}
                      </h3>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>✉️</span> {student.student_email}
                    </p>
                    
                    {student.profiles?.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {student.profiles.phone}
                      </p>
                    )}
                    
                    {student.profiles?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {student.profiles.city}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    Agregado
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