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
import { Plus, Edit, User, Mail, Award, GraduationCap, Send, MessageSquare, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useInstructorStudents } from "@/hooks/useInstructorStudents";
import { DivingCenterStudentManagement } from "@/components/DivingCenterStudentManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Estudiantes() {
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    start_date: '',
    enrollment_status: 'active'
  });

  // Use the unified students hook
  const { data: instructorStudents = [] } = useInstructorStudents();

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
  }, [user]);


  const fetchEnrollments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(name, code, certification_agency),
          profiles!course_enrollments_student_id_fkey(first_name, last_name, email, certification_level)
        `)
        .eq('instructor_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };


  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const enrollmentData = {
        ...formData,
        instructor_id: user.id,
        diving_center_id: userProfile?.role === 'diving_center' ? user.id : null
      };

      if (editingEnrollment) {
        const { error } = await supabase
          .from('course_enrollments')
          .update(enrollmentData)
          .eq('id', editingEnrollment.id);

        if (error) throw error;
        toast.success("Inscripción actualizada exitosamente");
      } else {
        const { error } = await supabase
          .from('course_enrollments')
          .insert(enrollmentData);

        if (error) throw error;
        toast.success("Estudiante inscrito exitosamente");
      }

      setDialogOpen(false);
      setEditingEnrollment(null);
      setFormData({
        student_id: '',
        course_id: '',
        start_date: '',
        enrollment_status: 'active'
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error saving enrollment:', error);
      toast.error("Error al guardar inscripción");
    }
  };

  const openEditDialog = (enrollment: any) => {
    setEditingEnrollment(enrollment);
    setFormData({
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      start_date: enrollment.start_date,
      enrollment_status: enrollment.enrollment_status
    });
    setDialogOpen(true);
  };

  const updateEnrollmentStatus = async (enrollmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ enrollment_status: status })
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success("Estado actualizado exitosamente");
      fetchEnrollments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Error al actualizar estado");
    }
  };

  // Remove the loading state since we're using the hook now
  // The hook handles its own loading state

  // Show diving center student management for diving centers
  if (userProfile?.role === 'diving_center') {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <div className="container py-8">
          <DivingCenterStudentManagement />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Estudiantes</h1>
            <p className="text-xl text-muted-foreground">
              Gestiona las inscripciones y progreso de tus estudiantes
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-ocean">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEnrollment ? 'Editar Inscripción' : 'Nueva Inscripción'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="student_id">Estudiante</Label>
                  <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estudiante" />
                    </SelectTrigger>
                     <SelectContent>
                       {instructorStudents.filter(s => s.student_id).map((studentRel) => (
                         <SelectItem key={studentRel.student_id} value={studentRel.student_id!}>
                           {studentRel.profile?.first_name && studentRel.profile?.last_name 
                             ? `${studentRel.profile.first_name} ${studentRel.profile.last_name}`
                             : studentRel.student_email}
                         </SelectItem>
                       ))}
                     </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="course_id">Curso</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="enrollment_status">Estado</Label>
                  <Select value={formData.enrollment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, enrollment_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full">
                  {editingEnrollment ? 'Actualizar' : 'Inscribir'} Estudiante
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {instructorStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay estudiantes registrados</p>
              </CardContent>
            </Card>
          ) : (
            instructorStudents.map((studentRel) => (
              <Card key={studentRel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {studentRel.profile?.first_name && studentRel.profile?.last_name 
                          ? `${studentRel.profile.first_name} ${studentRel.profile.last_name}`
                          : studentRel.student_email}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {studentRel.profile?.email || studentRel.student_email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        Activo
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
                          {studentRel.profile?.certification_level || 'Sin certificación'}
                        </p>
                        <p className="text-xs text-muted-foreground">Nivel actual</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm">
                        Rol: {studentRel.profile?.role === 'student' ? 'Estudiante' : studentRel.profile?.role}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {studentRel.profile?.city ? `${studentRel.profile.city}, ${studentRel.profile.country}` : studentRel.profile?.country}
                      </p>
                    </div>
                  </div>
                  
                  {/* Información adicional del estudiante */}
                  {studentRel.profile && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Teléfono</p>
                          <p className="text-sm">{studentRel.profile.phone || 'No registrado'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Agencia de certificación</p>
                          <p className="text-sm">{studentRel.profile.certification_agency || 'No especificada'}</p>
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
    </div>
  );
}