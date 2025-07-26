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
import { Plus, Edit, User, Mail, Award, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Estudiantes() {
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    start_date: '',
    enrollment_status: 'active'
  });

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
    fetchAllStudents();
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
      toast.error("Error al cargar estudiantes");
    } finally {
      setLoading(false);
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

  const fetchAllStudents = async () => {
    if (!user) return;
    
    try {
      // Obtener estudiantes del instructor desde instructor_students
      const { data: studentRelations, error: relationsError } = await supabase
        .from('instructor_students')
        .select('student_id')
        .eq('instructor_id', user.id)
        .eq('status', 'active');

      if (relationsError) throw relationsError;

      if (studentRelations && studentRelations.length > 0) {
        const studentIds = studentRelations.map(rel => rel.student_id).filter(Boolean);
        
        // Luego obtener los perfiles de esos estudiantes
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', studentIds)
          .order('first_name');

        if (profilesError) throw profilesError;
        setAllStudents(profiles || []);
      } else {
        setAllStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
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
                      {allStudents.map((student) => (
                        <SelectItem key={student.user_id} value={student.user_id}>
                          {student.first_name} {student.last_name}
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
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay estudiantes inscritos</p>
              </CardContent>
            </Card>
          ) : (
            enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {enrollment.profiles?.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={
                          enrollment.enrollment_status === 'completed' ? 'default' : 
                          enrollment.enrollment_status === 'active' ? 'secondary' : 'destructive'
                        }
                      >
                        {enrollment.enrollment_status === 'active' ? 'Activo' : 
                         enrollment.enrollment_status === 'completed' ? 'Completado' : 'Suspendido'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(enrollment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{enrollment.courses?.name}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.courses?.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">
                          {enrollment.profiles?.certification_level || 'Sin certificación'}
                        </p>
                        <p className="text-xs text-muted-foreground">Nivel actual</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm">
                        Inicio: {new Date(enrollment.start_date).toLocaleDateString()}
                      </p>
                      {enrollment.completion_date && (
                        <p className="text-xs text-muted-foreground">
                          Completado: {new Date(enrollment.completion_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {enrollment.enrollment_status === 'active' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEnrollmentStatus(enrollment.id, 'completed')}
                      >
                        Marcar como Completado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEnrollmentStatus(enrollment.id, 'suspended')}
                      >
                        Suspender
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}