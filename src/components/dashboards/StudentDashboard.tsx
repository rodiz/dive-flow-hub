import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Award, MapPin, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const StudentDashboard = () => {
  const { user } = useAuth();

  // Obtener inmersiones del estudiante
  const { data: dives = [] } = useQuery({
    queryKey: ["student-dives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dives")
        .select(`
          *,
          dive_sites!inner(name, location),
          profiles!instructor_id(first_name, last_name)
        `)
        .eq("student_id", user?.id)
        .order("dive_date", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Obtener enrollments del estudiante
  const { data: enrollments = [] } = useQuery({
    queryKey: ["student-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses!inner(name, code, certification_agency)
        `)
        .eq("student_id", user?.id)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalDives = dives.length;
  const completedCourses = enrollments.filter(e => e.enrollment_status === 'completed').length;
  const activeCourses = enrollments.filter(e => e.enrollment_status === 'active').length;
  const maxDepth = Math.max(...dives.map(d => d.depth_achieved || 0), 0);

  const stats = [
    {
      title: "Total de Inmersiones",
      value: totalDives,
      icon: BookOpen,
      description: "Inmersiones registradas"
    },
    {
      title: "Cursos Completados",
      value: completedCourses,
      icon: Award,
      description: "Certificaciones obtenidas"
    },
    {
      title: "Cursos Activos",
      value: activeCourses,
      icon: Calendar,
      description: "En progreso"
    },
    {
      title: "Profundidad Máxima",
      value: `${maxDepth}m`,
      icon: TrendingUp,
      description: "Récord personal"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Bitácora de Buceo</h1>
          <p className="text-muted-foreground">
            Explora tu progreso y mantén registro de tus aventuras submarinas
          </p>
        </div>
        <Button>
          <MapPin className="mr-2 h-4 w-4" />
          Explorar Sitios
        </Button>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inmersiones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Inmersiones Recientes</CardTitle>
            <CardDescription>Tus últimas aventuras submarinas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dives.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aún no tienes inmersiones registradas
                </p>
              ) : (
                dives.map((dive) => (
                  <div key={dive.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{dive.dive_sites?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dive.dive_sites?.location} • {dive.depth_achieved}m
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dive.dive_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{dive.dive_type}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cursos y Certificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Cursos</CardTitle>
            <CardDescription>Progreso en certificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No estás inscrito en ningún curso
                </p>
              ) : (
                enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{enrollment.courses?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.courses?.certification_agency} • {enrollment.courses?.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inicio: {new Date(enrollment.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={enrollment.enrollment_status === 'completed' ? 'default' : 'secondary'}
                    >
                      {enrollment.enrollment_status === 'completed' ? 'Completado' : 'En Progreso'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};