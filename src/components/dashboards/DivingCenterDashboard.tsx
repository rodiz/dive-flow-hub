import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, BookOpen, Award, TrendingUp, Plus, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { InstructorManagementForCenter } from "@/components/InstructorManagementForCenter";

export const DivingCenterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Obtener instructores asignados
  const { data: instructors = [] } = useQuery({
    queryKey: ["center-instructors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_assignments")
        .select(`
          *,
          profiles!instructor_id(first_name, last_name, certification_level)
        `)
        .eq("diving_center_id", user?.id)
        .eq("assignment_status", "active");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Obtener enrollments del centro
  const { data: enrollments = [] } = useQuery({
    queryKey: ["center-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses!inner(name, code),
          profiles!student_id(first_name, last_name)
        `)
        .eq("diving_center_id", user?.id)
        .order("start_date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Obtener equipos
  const { data: equipment = [] } = useQuery({
    queryKey: ["center-equipment", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_inventory")
        .select(`
          *,
          equipment_types(name, category)
        `)
        .eq("diving_center_id", user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Estadísticas
  const activeEnrollments = enrollments.filter(e => e.enrollment_status === 'active').length;
  const completedEnrollments = enrollments.filter(e => e.enrollment_status === 'completed').length;
  const availableEquipment = equipment.filter(e => e.status === 'available').length;
  const totalEquipment = equipment.length;

  const stats = [
    {
      title: "Instructores Activos",
      value: instructors.length,
      icon: Users,
      description: "Instructores asignados"
    },
    {
      title: "Estudiantes Activos",
      value: activeEnrollments,
      icon: BookOpen,
      description: "En cursos activos"
    },
    {
      title: "Cursos Completados",
      value: completedEnrollments,
      icon: Award,
      description: "Este mes"
    },
    {
      title: "Equipos Disponibles",
      value: `${availableEquipment}/${totalEquipment}`,
      icon: Settings,
      description: "Equipos en buen estado"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Buceo</h1>
          <p className="text-muted-foreground">
            Panel de administración y gestión
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/perfil')}>
            <Plus className="mr-2 h-4 w-4" />
            Gestionar Instructores
          </Button>
          <Button variant="outline">
            <Building2 className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Instructores */}
        <Card>
          <CardHeader>
            <CardTitle>Instructores</CardTitle>
            <CardDescription>Instructores asignados al centro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {instructors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay instructores asignados
                </p>
              ) : (
                instructors.slice(0, 5).map((instructor) => (
                  <div key={instructor.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {instructor.profiles?.first_name} {instructor.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {instructor.profiles?.certification_level || 'Nivel no especificado'}
                      </p>
                    </div>
                    <Badge variant="default">Activo</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estudiantes Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes Recientes</CardTitle>
            <CardDescription>Últimas inscripciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay inscripciones recientes
                </p>
              ) : (
                enrollments.slice(0, 5).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.courses?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(enrollment.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={enrollment.enrollment_status === 'completed' ? 'default' : 'secondary'}
                    >
                      {enrollment.enrollment_status === 'completed' ? 'Completado' : 'Activo'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estado del Equipo */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Equipo</CardTitle>
            <CardDescription>Resumen del inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipment.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay equipos registrados
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{availableEquipment}</div>
                      <p className="text-xs text-muted-foreground">Disponibles</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {equipment.filter(e => e.status === 'maintenance').length}
                      </div>
                      <p className="text-xs text-muted-foreground">En mantenimiento</p>
                    </div>
                  </div>
                  <div className="text-center py-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/perfil')}>
                      Ver Inventario Completo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructor Management Section */}
      <InstructorManagementForCenter />
    </div>
  );
};