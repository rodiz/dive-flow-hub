import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useInstructorStudents } from "@/hooks/useInstructorStudents";

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

  // Fetch instructor's students using the unified hook
  const { data: instructorStudents, isLoading } = useInstructorStudents();

  // Create new student
  const createStudentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-student', {
        body: {
          firstName: newStudent.firstName.trim(),
          lastName: newStudent.lastName.trim(),
          email: newStudent.email.trim(),
          phone: newStudent.phone.trim() || null,
          city: newStudent.city.trim() || null,
          instructorId: user?.id
        }
      });

      if (error) throw error;
      return data;
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
          <div className="grid gap-4">
            {instructorStudents.map((student) => (
              <div key={student.id} className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {student.student_name || 
                           (student.profile?.first_name && student.profile?.last_name 
                             ? `${student.profile.first_name} ${student.profile.last_name}`
                             : student.student_email)}
                        </h3>
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          ✓ Activo
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span>✉️</span> {student.student_email}
                        </span>
                        
                        {student.profile?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {student.profile.phone}
                          </span>
                        )}
                        
                        {student.profile?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {student.profile.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Agregado el
                    </div>
                    <div className="text-sm font-medium">
                      {new Date(student.invited_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
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