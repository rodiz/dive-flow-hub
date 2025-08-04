import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, User, Mail, Award, Eye, Send, MessageSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DivingCenterStudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_email: '',
    student_name: '',
    instructor_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchInstructors();
  }, [user]);

  const fetchInstructors = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('instructor_assignments')
        .select(`
          instructor_id,
          profiles!instructor_id(
            user_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('diving_center_id', user.id)
        .eq('assignment_status', 'active');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchStudents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Obtener todos los instructores del centro
      const { data: instructorAssignments, error: instructorsError } = await supabase
        .from('instructor_assignments')
        .select('instructor_id')
        .eq('diving_center_id', user.id)
        .eq('assignment_status', 'active');

      if (instructorsError) throw instructorsError;

      const instructorIds = instructorAssignments.map(ia => ia.instructor_id);
      
      if (instructorIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Obtener estudiantes de todos los instructores
      const { data: studentRelations, error: studentsError } = await supabase
        .from('instructor_students')
        .select(`
          *,
          profiles!student_id(
            user_id,
            first_name,
            last_name,
            email,
            certification_level,
            phone,
            city,
            country,
            certification_agency,
            role
          ),
          instructor_profile:profiles!instructor_id(
            first_name,
            last_name
          )
        `)
        .in('instructor_id', instructorIds)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      setStudents(studentRelations || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error("Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Crear invitación para el estudiante
      const { data: invitation, error: inviteError } = await supabase
        .from('instructor_students')
        .insert({
          instructor_id: formData.instructor_id,
          student_email: formData.student_email,
          student_name: formData.student_name || null,
          notes: formData.notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Llamar edge function para enviar invitación
      const { error: functionError } = await supabase.functions.invoke('send-student-invitation', {
        body: {
          email: formData.student_email,
          instructor_name: user.email, // Esto debería ser el nombre del instructor
          invitation_id: invitation.id
        }
      });

      if (functionError) {
        console.error('Error sending invitation:', functionError);
        toast.error("Estudiante agregado pero no se pudo enviar la invitación");
      } else {
        toast.success("Invitación enviada exitosamente");
      }

      setDialogOpen(false);
      setFormData({
        student_email: '',
        student_name: '',
        instructor_id: '',
        notes: ''
      });
      fetchStudents();
    } catch (error) {
      console.error('Error inviting student:', error);
      toast.error("Error al invitar estudiante");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Estudiantes</h2>
          <p className="text-muted-foreground">
            Estudiantes de todos los instructores del centro
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-ocean">
              <Plus className="h-4 w-4 mr-2" />
              Invitar Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Estudiante</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="instructor_id">Asignar a Instructor</Label>
                <Select 
                  value={formData.instructor_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.instructor_id} value={instructor.instructor_id}>
                        {instructor.profiles?.first_name && instructor.profiles?.last_name 
                          ? `${instructor.profiles.first_name} ${instructor.profiles.last_name}`
                          : instructor.profiles?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="student_email">Email del Estudiante</Label>
                <Input
                  id="student_email"
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_email: e.target.value }))}
                  placeholder="estudiante@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="student_name">Nombre del Estudiante (opcional)</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_name: e.target.value }))}
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre el estudiante"
                />
              </div>
              
              <Button type="submit" className="w-full">
                Enviar Invitación
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {students.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay estudiantes registrados</p>
            </CardContent>
          </Card>
        ) : (
          students.map((studentRel) => (
            <Card key={studentRel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {studentRel.profiles?.first_name && studentRel.profiles?.last_name 
                        ? `${studentRel.profiles.first_name} ${studentRel.profiles.last_name}`
                        : studentRel.student_name || studentRel.student_email}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {studentRel.profiles?.email || studentRel.student_email}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      Instructor: {studentRel.instructor_profile?.first_name && studentRel.instructor_profile?.last_name
                        ? `${studentRel.instructor_profile.first_name} ${studentRel.instructor_profile.last_name}`
                        : 'No asignado'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={studentRel.status === 'active' ? 'default' : 
                                   studentRel.status === 'pending' ? 'secondary' : 'destructive'}>
                      {studentRel.status === 'active' ? 'Activo' : 
                       studentRel.status === 'pending' ? 'Pendiente' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">
                        {studentRel.profiles?.certification_level || 'Sin certificación'}
                      </p>
                      <p className="text-xs text-muted-foreground">Nivel actual</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm">
                      Rol: {studentRel.profiles?.role === 'student' ? 'Estudiante' : studentRel.profiles?.role || 'No registrado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {studentRel.profiles?.city ? `${studentRel.profiles.city}, ${studentRel.profiles.country}` : studentRel.profiles?.country || 'Ubicación no registrada'}
                    </p>
                  </div>
                </div>
                
                {/* Información adicional del estudiante */}
                {studentRel.profiles && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="text-sm">{studentRel.profiles.phone || 'No registrado'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Agencia de certificación</p>
                        <p className="text-sm">{studentRel.profiles.certification_agency || 'No especificada'}</p>
                      </div>
                    </div>
                    
                    {studentRel.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground">Notas del instructor</p>
                        <p className="text-sm">{studentRel.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Botones de acción */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="default" size="sm" className="bg-gradient-ocean">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Reporte
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};