import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorStudent } from "@/hooks/useInstructorStudents";
import { Users, BookOpen, Waves, User } from "lucide-react";

interface StudentStatsChartProps {
  students: InstructorStudent[];
}

interface StudentStats {
  student_id: string;
  total_dives: number;
  total_courses: number;
  active_courses: number;
}

export const StudentStatsChart = ({ students }: StudentStatsChartProps) => {
  const { data: studentStats, isLoading } = useQuery({
    queryKey: ['student-stats', students.map(s => s.student_id)],
    queryFn: async () => {
      if (!students.length) return [];

      const studentIds = students.map(s => s.student_id).filter(Boolean);
      if (!studentIds.length) return [];

      // Get dive counts from participants table
      const { data: diveStats } = await supabase
        .from('dive_participants')
        .select('student_id')
        .in('student_id', studentIds);

      // Get course enrollment counts
      const { data: courseStats } = await supabase
        .from('course_enrollments')
        .select('student_id, enrollment_status')
        .in('student_id', studentIds);

      // Process the data
      const stats: StudentStats[] = studentIds.map(studentId => {
        const totalDives = diveStats?.filter(d => d.student_id === studentId).length || 0;
        const studentCourses = courseStats?.filter(c => c.student_id === studentId) || [];
        const totalCourses = studentCourses.length;
        const activeCourses = studentCourses.filter(c => c.enrollment_status === 'active').length;

        return {
          student_id: studentId,
          total_dives: totalDives,
          total_courses: totalCourses,
          active_courses: activeCourses
        };
      });

      return stats;
    },
    enabled: students.length > 0
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No tienes estudiantes agregados aún.</p>
        <p className="text-sm">Usa el botón "Agregar Estudiante" para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student) => {
        const stats = studentStats?.find(s => s.student_id === student.student_id);
        const studentName = student.student_name || 
          (student.profile?.first_name && student.profile?.last_name 
            ? `${student.profile.first_name} ${student.profile.last_name}`
            : student.student_email);

        return (
          <Card key={student.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium truncate">
                    {studentName}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                  Activo
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="relative pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Waves className="h-3 w-3 text-primary mr-1" />
                    <span className="text-xs text-muted-foreground">Inmersiones</span>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {stats?.total_dives || 0}
                  </div>
                </div>
                
                <div className="bg-card/50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BookOpen className="h-3 w-3 text-secondary mr-1" />
                    <span className="text-xs text-muted-foreground">Cursos</span>
                  </div>
                  <div className="text-lg font-bold text-secondary">
                    {stats?.total_courses || 0}
                  </div>
                </div>
              </div>
              
              {stats?.active_courses ? (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {stats.active_courses} curso{stats.active_courses > 1 ? 's' : ''} activo{stats.active_courses > 1 ? 's' : ''}
                  </Badge>
                </div>
              ) : null}
              
              <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border/50">
                Agregado: {new Date(student.invited_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};