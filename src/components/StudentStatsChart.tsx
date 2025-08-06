import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstructorStudent } from "@/hooks/useInstructorStudents";
import { Users, BookOpen, Waves, User, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 12; // 2 rows x 6 columns
  
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="animate-pulse h-48">
            <CardContent className="p-4">
              <div className="h-40 bg-muted rounded"></div>
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

  // Calculate pagination
  const totalPages = Math.ceil(students.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Student cards grid - 2 rows x 6 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {currentStudents.map((student) => {
          const stats = studentStats?.find(s => s.student_id === student.student_id);
          const studentName = student.student_name || 
            (student.profile?.first_name && student.profile?.last_name 
              ? `${student.profile.first_name} ${student.profile.last_name}`
              : student.student_email);

          return (
            <Card key={student.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 h-72 flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
              
              {/* Header - Avatar and Status */}
              <CardHeader className="relative pb-2 p-3 flex-shrink-0">
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border-green-200">
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              
              {/* Content - Name and Stats */}
              <CardContent className="relative p-3 pt-0 flex-1 flex flex-col space-y-2">
                <CardTitle className="text-xs font-medium text-center line-clamp-2 leading-tight min-h-[2rem]">
                  {studentName}
                </CardTitle>
                
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="bg-card/50 rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center mb-0.5">
                        <Waves className="h-3 w-3 text-primary mr-1" />
                        <span className="text-xs text-muted-foreground">Inmersiones</span>
                      </div>
                      <div className="text-base font-bold text-primary">
                        {stats?.total_dives || 0}
                      </div>
                    </div>
                    
                    <div className="bg-card/50 rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center mb-0.5">
                        <BookOpen className="h-3 w-3 text-secondary mr-1" />
                        <span className="text-xs text-muted-foreground">Cursos</span>
                      </div>
                      <div className="text-base font-bold text-secondary">
                        {stats?.total_courses || 0}
                      </div>
                    </div>
                  </div>
                  
                  {stats?.active_courses ? (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                        {stats.active_courses} activo{stats.active_courses > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ) : null}
                </div>
                
                {/* Footer - Date */}
                <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border/50 mt-auto">
                  {new Date(student.invited_at).toLocaleDateString('es-ES', {
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, students.length)} de {students.length} estudiantes
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};