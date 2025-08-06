import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, User, Mail, Award, GraduationCap, Send, MessageSquare, Eye, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useInstructorStudents } from "@/hooks/useInstructorStudents";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InstructorManagementForCenter } from "@/components/InstructorManagementForCenter";
import { StudentDetailedReport } from "@/components/StudentDetailedReport";

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
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'certification' | 'city'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Use the unified students hook
  const { data: instructorStudents = [], refetch: refetchStudents } = useInstructorStudents();
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
      queryClient.invalidateQueries({ queryKey: ['instructor-students'] }); // Invalidate without parameters too
      
      // Force refetch manually
      setTimeout(() => {
        refetchStudents();
      }, 500);
      
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

        <Tabs defaultValue={userProfile?.role === 'diving_center' ? 'instructors' : 'students'} className="w-full">
          <TabsList className={`grid w-full ${userProfile?.role === 'diving_center' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {userProfile?.role === 'diving_center' && (
              <TabsTrigger value="instructors">Instructores</TabsTrigger>
            )}
            <TabsTrigger value="students">Estudiantes</TabsTrigger>
            <TabsTrigger value="courses">Cursos - Estudiantes</TabsTrigger>
          </TabsList>

          {userProfile?.role === 'diving_center' && (
            <TabsContent value="instructors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Instructores</CardTitle>
                  <CardDescription>
                    Administra los instructores asignados a tu centro de buceo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InstructorManagementForCenter />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="students" className="space-y-6">
            {/* Filtros y búsqueda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros y Búsqueda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={sortBy} onValueChange={(value: 'name' | 'email' | 'certification' | 'city') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="certification">Certificación</SelectItem>
                      <SelectItem value="city">Ciudad</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Orden..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tarjetas de estudiantes en 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(() => {
                // Filtrar estudiantes por término de búsqueda
                const filteredStudents = instructorStudents.filter(studentRel => {
                  const name = `${studentRel.profile?.first_name || ''} ${studentRel.profile?.last_name || ''} ${studentRel.student_name || ''}`.toLowerCase();
                  const email = (studentRel.profile?.email || studentRel.student_email || '').toLowerCase();
                  const searchLower = searchTerm.toLowerCase();
                  
                  return name.includes(searchLower) || email.includes(searchLower);
                });

                // Ordenar estudiantes
                const sortedStudents = [...filteredStudents].sort((a, b) => {
                  let aValue = '';
                  let bValue = '';
                  
                  switch (sortBy) {
                    case 'name':
                      aValue = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''} ${a.student_name || ''}`.toLowerCase();
                      bValue = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''} ${b.student_name || ''}`.toLowerCase();
                      break;
                    case 'email':
                      aValue = (a.profile?.email || a.student_email || '').toLowerCase();
                      bValue = (b.profile?.email || b.student_email || '').toLowerCase();
                      break;
                    case 'certification':
                      aValue = (a.profile?.certification_level || '').toLowerCase();
                      bValue = (b.profile?.certification_level || '').toLowerCase();
                      break;
                    case 'city':
                      aValue = (a.profile?.city || '').toLowerCase();
                      bValue = (b.profile?.city || '').toLowerCase();
                      break;
                  }
                  
                  if (sortOrder === 'asc') {
                    return aValue.localeCompare(bValue);
                  } else {
                    return bValue.localeCompare(aValue);
                  }
                });

                if (sortedStudents.length === 0) {
                  return (
                    <div className="col-span-2">
                      <Card>
                        <CardContent className="py-8 text-center">
                          <p className="text-muted-foreground">
                            {instructorStudents.length === 0 
                              ? 'No hay estudiantes registrados' 
                              : 'No se encontraron estudiantes con los filtros aplicados'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  );
                }

                return sortedStudents.map((studentRel) => (
                  <Card key={studentRel.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {studentRel.profile?.first_name && studentRel.profile?.last_name 
                              ? `${studentRel.profile.first_name} ${studentRel.profile.last_name}`
                              : studentRel.student_name || studentRel.student_email}
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
                      <div className="grid grid-cols-1 gap-4 mb-4">
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
                          <div className="grid grid-cols-1 gap-4">
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
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Find the matching profile for this student
                            const matchingProfile = instructorStudents.find(s => s.student_id === studentRel.student_id)?.profile;
                            
                            setSelectedStudent({
                              id: studentRel.student_id,
                              first_name: matchingProfile?.first_name || studentRel.student_name?.split(' ')[0] || '',
                              last_name: matchingProfile?.last_name || studentRel.student_name?.split(' ').slice(1).join(' ') || '',
                              email: matchingProfile?.email || studentRel.student_email,
                              certification_level: matchingProfile?.certification_level
                            });
                            setShowDetailedReport(true);
                          }}
                        >
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
                ));
              })()}
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inscripciones de Cursos</CardTitle>
                <CardDescription>
                  Gestiona las inscripciones de estudiantes a cursos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay inscripciones registradas</p>
                  ) : (
                    enrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <h3 className="font-medium">
                                  {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                                </h3>
                                <Badge 
                                  variant={
                                    enrollment.enrollment_status === 'completed' ? 'default' : 
                                    enrollment.enrollment_status === 'active' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {enrollment.enrollment_status === 'completed' ? 'Completado' : 
                                   enrollment.enrollment_status === 'active' ? 'Activo' : 'Suspendido'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <p><strong>Curso:</strong> {enrollment.courses?.name} ({enrollment.courses?.code})</p>
                                <p><strong>Email:</strong> {enrollment.profiles?.email}</p>
                                <p><strong>Inicio:</strong> {new Date(enrollment.start_date).toLocaleDateString()}</p>
                                {enrollment.completion_date && (
                                  <p><strong>Completado:</strong> {new Date(enrollment.completion_date).toLocaleDateString()}</p>
                                )}
                                <p><strong>Progreso:</strong> {enrollment.progress_percentage || 0}%</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(enrollment)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              
                              {enrollment.enrollment_status === 'active' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateEnrollmentStatus(enrollment.id, 'completed')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Completar
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Student Detailed Report Modal */}
        {selectedStudent && (
          <StudentDetailedReport
            isOpen={showDetailedReport}
            onClose={() => {
              setShowDetailedReport(false);
              setSelectedStudent(null);
            }}
            student={selectedStudent}
          />
        )}
      </div>
    </div>
  );
}