import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Users, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DivingCenterStudentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    instructorId: ""
  });

  // Fetch instructors assigned to this diving center
  const { data: centerInstructors = [] } = useQuery({
    queryKey: ["center-instructors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_assignments")
        .select(`
          *,
          profiles!instructor_id(
            user_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("diving_center_id", user?.id)
        .eq("assignment_status", "active");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch all students from assigned instructors
  const { data: centerStudents = [], isLoading } = useQuery({
    queryKey: ["center-students", user?.id],
    queryFn: async () => {
      if (centerInstructors.length === 0) return [];
      
      const instructorIds = centerInstructors.map(inst => inst.instructor_id);
      
      const { data, error } = await supabase
        .from("instructor_students")
        .select("*")
        .in("instructor_id", instructorIds)
        .eq("status", "active");
      
      if (error) throw error;
      
      // Get student profiles separately
      const studentIds = data?.map(s => s.student_id).filter(Boolean) || [];
      if (studentIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone, city")
        .in("user_id", studentIds);
      
      if (profilesError) throw profilesError;
      
      // Combine data with instructor names
      const studentsWithInstructors = data?.map(student => {
        const instructor = centerInstructors.find(inst => inst.instructor_id === student.instructor_id);
        const profile = profiles?.find(p => p.user_id === student.student_id);
        return {
          ...student,
          profiles: profile || null,
          instructor_name: instructor?.profiles ? `${instructor.profiles.first_name} ${instructor.profiles.last_name}` : 'Instructor desconocido'
        };
      });
      
      return studentsWithInstructors || [];
    },
    enabled: centerInstructors.length > 0,
  });

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
          instructorId: newStudent.instructorId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Estudiante creado",
        description: "El estudiante ha sido creado exitosamente y asignado al instructor",
      });
      queryClient.invalidateQueries({ queryKey: ['center-students'] });
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        instructorId: ""
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

  // Remove student from instructor
  const removeStudentMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from("instructor_students")
        .update({ status: "inactive" })
        .eq("id", relationshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Estudiante removido",
        description: "El estudiante ha sido removido del instructor",
      });
      queryClient.invalidateQueries({ queryKey: ['center-students'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Error al remover estudiante",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName.trim() || !newStudent.lastName.trim() || !newStudent.email.trim() || !newStudent.instructorId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    createStudentMutation.mutate();
  };

  const handleRemoveStudent = (relationshipId: string) => {
    if (confirm("¿Estás seguro de que quieres remover este estudiante del instructor?")) {
      removeStudentMutation.mutate(relationshipId);
    }
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
            Estudiantes del Centro ({centerStudents.length})
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={centerInstructors.length === 0}>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Estudiante</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="instructorId">Asignar a Instructor *</Label>
                  <Select
                    value={newStudent.instructorId}
                    onValueChange={(value) => setNewStudent(prev => ({ ...prev, instructorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {centerInstructors.map((instructor) => (
                        <SelectItem key={instructor.instructor_id} value={instructor.instructor_id}>
                          {instructor.profiles?.first_name} {instructor.profiles?.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
        <div className="space-y-4">
          {centerInstructors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay instructores asignados al centro</p>
              <p className="text-sm text-muted-foreground">
                Primero asigna instructores para poder crear estudiantes
              </p>
            </div>
          ) : centerStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay estudiantes registrados</p>
              <p className="text-sm text-muted-foreground">
                Usa el botón "Crear Estudiante" para agregar estudiantes
              </p>
            </div>
          ) : (
            centerStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">
                        {student.profiles?.first_name && student.profiles?.last_name
                          ? `${student.profiles.first_name} ${student.profiles.last_name}`
                          : student.student_name || 'Estudiante sin nombre'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {student.student_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          Instructor: {student.instructor_name}
                        </Badge>
                        {student.profiles?.city && (
                          <span className="text-xs text-muted-foreground">
                            {student.profiles.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={removeStudentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Student Details Dialog */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles del Estudiante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <p className="text-sm">
                  {selectedStudent.profiles?.first_name && selectedStudent.profiles?.last_name
                    ? `${selectedStudent.profiles.first_name} ${selectedStudent.profiles.last_name}`
                    : selectedStudent.student_name || 'Sin nombre'}
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{selectedStudent.student_email}</p>
              </div>
              {selectedStudent.profiles?.phone && (
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedStudent.profiles.phone}</p>
                </div>
              )}
              {selectedStudent.profiles?.city && (
                <div>
                  <Label>Ciudad</Label>
                  <p className="text-sm">{selectedStudent.profiles.city}</p>
                </div>
              )}
              <div>
                <Label>Instructor Asignado</Label>
                <p className="text-sm">{selectedStudent.instructor_name}</p>
              </div>
              <div>
                <Label>Fecha de Registro</Label>
                <p className="text-sm">{new Date(selectedStudent.invited_at).toLocaleDateString()}</p>
              </div>
              {selectedStudent.notes && (
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm">{selectedStudent.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};