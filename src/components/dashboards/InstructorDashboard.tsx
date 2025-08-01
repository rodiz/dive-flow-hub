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

type DiveParticipantWithProfile = {
  id: string;
  student_id: string;
  depth_achieved: number;
  bottom_time: number;
  equipment_check: boolean;
  medical_check: boolean;
  individual_notes: string;
  performance_rating: number;
  profiles?: {
    user_id: string;
    first_name: string;
    last_name: string;
  } | null;
};

export const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Obtener las 3 inmersiones más recientes dirigidas por el instructor
  const { data: recentDives = [] } = useQuery({
    queryKey: ["instructor-recent-dives", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get dives with participants
      const { data: divesData, error } = await supabase
        .from('dives')
        .select(`
          *,
          dive_sites(name, location),
          dive_participants(
            id,
            student_id,
            depth_achieved,
            bottom_time,
            equipment_check,
            medical_check,
            individual_notes,
            performance_rating
          )
        `)
        .eq('instructor_id', user.id)
        .order('dive_date', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (!divesData || divesData.length === 0) {
        return [];
      }

      // Get all unique student IDs from all dives
      const allStudentIds = Array.from(new Set(
        divesData
          .flatMap(dive => dive.dive_participants || [])
          .map(participant => participant.student_id)
          .filter(Boolean)
      ));

      // If no students, return dives as-is
      if (allStudentIds.length === 0) {
        return divesData;
      }

      // Get profiles for all students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', allStudentIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const divesWithProfiles = divesData.map(dive => ({
        ...dive,
        dive_participants: dive.dive_participants?.map(participant => ({
          ...participant,
          profiles: profiles?.find(p => p.user_id === participant.student_id) || null
        }))
      }));

      return divesWithProfiles;
    },
    enabled: !!user?.id,
  });

  // Obtener inmersiones para estadísticas generales
  const { data: dives = [] } = useQuery({
    queryKey: ["instructor-dives", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dives")
        .select(`
          *,
          dive_sites!inner(name, location)
        `)
        .eq("instructor_id", user?.id)
        .order("dive_date", { ascending: false });
      
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
              {recentDives.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No has dirigido inmersiones aún
                </p>
              ) : (
                recentDives.map((dive) => (
                  <div key={dive.id} className="flex items-start justify-between border-b pb-3 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{dive.dive_sites?.name}</p>
                        <Badge variant="secondary">{dive.dive_type === 'training' ? 'Entrenamiento' : 
                          dive.dive_type === 'certification' ? 'Certificación' : 
                          dive.dive_type === 'fun' ? 'Recreativo' : 'Especialidad'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {dive.dive_sites?.location} • {dive.depth_achieved}m • {dive.bottom_time} min
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(dive.dive_date).toLocaleDateString()}</span>
                        {dive.dive_time && <span>• {dive.dive_time}</span>}
                      </div>
                      {dive.dive_participants && dive.dive_participants.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            Participantes ({dive.dive_participants.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {dive.dive_participants.slice(0, 3).map((participant: DiveParticipantWithProfile, idx) => (
                              <Badge key={participant.id} variant="outline" className="text-xs">
                                {participant.profiles?.first_name && participant.profiles?.last_name 
                                  ? `${participant.profiles.first_name} ${participant.profiles.last_name}`
                                  : 'Sin nombre'}
                              </Badge>
                            ))}
                            {dive.dive_participants.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{dive.dive_participants.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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