import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Calendar, Award, TrendingUp, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { InstructorReportManager } from "@/components/InstructorReportManager";
import { StudentManagement } from "@/components/StudentManagement";
import { useInstructorStudents } from "@/hooks/useInstructorStudents";

export const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Obtener inmersiones dirigidas por el instructor
  const { data: dives = [] } = useQuery({
    queryKey: ["instructor-dives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dives")
        .select(`
          *,
          dive_sites!inner(name, location),
          profiles!student_id(first_name, last_name)
        `)
        .eq("instructor_id", user?.id)
        .order("dive_date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Obtener estudiantes activos del instructor usando el hook unificado
  const { data: instructorStudents = [] } = useInstructorStudents();

  // Estadísticas del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthDives = dives.filter(dive => {
    const diveDate = new Date(dive.dive_date);
    return diveDate.getMonth() === currentMonth && diveDate.getFullYear() === currentYear;
  });

  const uniqueStudents = instructorStudents.length;
  const uniqueSites = new Set(dives.map(d => d.dive_site_id)).size;
  const avgDepth = dives.length > 0 ? Math.round(dives.reduce((sum, d) => sum + (d.depth_achieved || 0), 0) / dives.length) : 0;

  const stats = [
    {
      title: "Inmersiones del Mes",
      value: thisMonthDives.length,
      icon: BookOpen,
      description: "Inmersiones dirigidas"
    },
    {
      title: "Estudiantes Activos",
      value: instructorStudents.length,
      icon: Users,
      description: "Estudiantes bajo tu supervisión"
    },
    {
      title: "Estudiantes Únicos",
      value: uniqueStudents,
      icon: Award,
      description: "Total de estudiantes"
    },
    {
      title: "Profundidad Promedio",
      value: `${avgDepth}m`,
      icon: TrendingUp,
      description: "De todas las inmersiones"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Instructor</h1>
          <p className="text-muted-foreground">
            Gestiona tus estudiantes e inmersiones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/inmersiones')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Inmersión
          </Button>
          <Button variant="outline" onClick={() => navigate('/estudiantes')}>
            <Users className="mr-2 h-4 w-4" />
            Gestionar Estudiantes
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inmersiones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Inmersiones Recientes</CardTitle>
            <CardDescription>Últimas inmersiones dirigidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dives.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No has dirigido inmersiones aún
                </p>
              ) : (
                dives.slice(0, 5).map((dive) => (
                  <div key={dive.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{dive.dive_sites?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dive.profiles?.first_name} {dive.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dive.dive_date).toLocaleDateString()} • {dive.depth_achieved}m
                      </p>
                    </div>
                    <Badge variant="secondary">{dive.dive_type}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Escuelas de Buceo */}
        <Card>
          <CardHeader>
            <CardTitle>Escuelas de Buceo</CardTitle>
            <CardDescription>Centros de buceo donde estás afiliado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">MAR Diving and Rescue</p>
                  <p className="text-sm text-muted-foreground">
                    Cartagena, Colombia
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Centro especializado en formación y rescate submarino
                  </p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Afiliado
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructor Report Manager */}
          <StudentManagement />
          
          <InstructorReportManager />
    </div>
  );
};