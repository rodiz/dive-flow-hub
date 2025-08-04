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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Estudiantes() {
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    course_id: '',
    start_date: '',
    enrollment_status: 'active'
  });

  // Use the unified students hook
  const { data: instructorStudents = [] } = useInstructorStudents();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
  }, [user]);


  const fetchEnrollments = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(name, code, certification_agency),
          profiles!course_enrollments_student_id_fkey(first_name, last_name, email, certification_level)
        `);

      if (userProfile?.role === 'diving_center') {
        // For diving centers, get enrollments from all their instructors
        const { data: instructorAssignments } = await supabase
          .from('instructor_assignments')
          .select('instructor_id')
          .eq('diving_center_id', user.id)
          .eq('assignment_status', 'active');

        const instructorIds = instructorAssignments?.map(ia => ia.instructor_id) || [];
        if (instructorIds.length > 0) {
          query = query.in('instructor_id', instructorIds);
        } else {
          setEnrollments([]);
          return;
        }
      } else {
        // For instructors, get only their enrollments
        query = query.eq('instructor_id', user.id);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

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

  // Create new student mutation - same for instructors and diving centers
  const createStudentMutation = useMutation({
    mutationFn: async () => {
      // For diving centers, we need to pick the first available instructor
      let instructorId = user?.id;
      
      if (userProfile?.role === 'diving_center') {
        const { data: instructorAssignments } = await supabase
          .from('instructor_assignments')
          .select('instructor_id')
          .eq('diving_center_id', user.id)
          .eq('assignment_status', 'active')
          .limit(1);
        
        if (instructorAssignments && instructorAssignments.length > 0) {
          instructorId = instructorAssignments[0].instructor_id;
        }
      }

      const { data, error } = await supabase.functions.invoke('create-student', {
        body: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          city: formData.city.trim() || null,
          instructorId: instructorId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast({
        title: "Estudiante creado",
        description: "El estudiante ha sido creado exitosamente",
      });
      
      // Si hay curso seleccionado, crear la inscripción
      if (formData.course_id) {
        try {
          const enrollmentData = {
            student_id: data.student.id, // Use student.id from edge function response
            course_id: formData.course_id,
            start_date: formData.start_date,
            enrollment_status: formData.enrollment_status,
            instructor_id: user?.id,
            diving_center_id: userProfile?.role === 'diving_center' ? user?.id : null
          };

          const { error } = await supabase
            .from('course_enrollments')
            .insert(enrollmentData);

          if (error) throw error;
          toast({
            title: "Inscripción creada",
            description: "El estudiante ha sido inscrito al curso",
          });
        } catch (error) {
          console.error('Error creating enrollment:', error);
          toast({
            title: "Advertencia",
            description: "Estudiante creado pero no pudo ser inscrito al curso",
            variant: "destructive",
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['instructor-students', user?.id, userProfile?.role] });
      setDialogOpen(false);
      setEditingEnrollment(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        course_id: '',
        start_date: '',
        enrollment_status: 'active'
      });
      fetchEnrollments();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear estudiante",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validar campos obligatorios solo para nuevos estudiantes
    if (!editingEnrollment && (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim())) {
      toast({
        title: "Error",
        description: "Por favor completa nombre, apellido y email",
        variant: "destructive",
      });
      return;
    }

    if (editingEnrollment) {
      // Update existing enrollment
      try {
        const enrollmentData = {
          course_id: formData.course_id,
          start_date: formData.start_date,
          enrollment_status: formData.enrollment_status
        };

        const { error } = await supabase
          .from('course_enrollments')
          .update(enrollmentData)
          .eq('id', editingEnrollment.id);

        if (error) throw error;
        toast({
          title: "Inscripción actualizada",
          description: "La inscripción ha sido actualizada exitosamente",
        });
        
        setDialogOpen(false);
        setEditingEnrollment(null);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          city: '',
          course_id: '',
          start_date: '',
          enrollment_status: 'active'
        });
        fetchEnrollments();
      } catch (error) {
        console.error('Error updating enrollment:', error);
        toast({
          title: "Error",
          description: "Error al actualizar inscripción",
          variant: "destructive",
        });
      }
    } else {
      // Create new student
      createStudentMutation.mutate();
    }
  };

  const openEditDialog = (enrollment: any) => {
    setEditingEnrollment(enrollment);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
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
      toast({
        title: "Estado actualizado",
        description: "El estado ha sido actualizado exitosamente",
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Error al actualizar estado",
        variant: "destructive",
      });
    }
  };

  // Remove the loading state since we're using the hook now
  // The hook handles its own loading state

  // Remove the diving center specific component - use same functionality for all
  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              {userProfile?.role === 'diving_center' ? 'Estudiantes - Instructores' : 'Estudiantes'}
            </h1>
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
                  {editingEnrollment ? 'Editar Inscripción' : 'Crear Nuevo Estudiante'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingEnrollment && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nombre *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Nombre"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellido *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@ejemplo.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Bogotá, Medellín, etc."
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="course_id">Curso (opcional)</Label>
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
                
                {formData.course_id && (
                  <>
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
                  </>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createStudentMutation.isPending}
                >
                  {createStudentMutation.isPending ? 'Creando...' : 
                   editingEnrollment ? 'Actualizar Inscripción' : 'Crear Estudiante'}
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