import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Award, 
  Camera, 
  BarChart3, 
  Send,
  Download,
  Eye
} from 'lucide-react';

interface CourseEnrollment {
  id: string;
  enrollment_status: string;
  progress_percentage: number;
  completion_date: string | null;
  final_score: number | null;
  report_generated: boolean;
  course_id: string;
  student_id: string;
  instructor_id: string;
  courses: {
    name: string;
    certification_agency: string;
    code: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface CourseCompletionReport {
  id: string;
  enrollment_id: string;
  total_dives: number;
  total_bottom_time: number;
  max_depth_achieved: number;
  certificate_url: string | null;
  generated_at: string;
  report_data: any;
}

export const StudentReportGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch completed enrollments
  const { data: completedEnrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['completed-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (name, certification_agency, code),
          profiles!course_enrollments_instructor_id_fkey (first_name, last_name)
        `)
        .eq('student_id', user?.id)
        .eq('enrollment_status', 'completed')
        .order('completion_date', { ascending: false });

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!user?.id
  });

  // Fetch existing reports
  const { data: existingReports } = useQuery({
    queryKey: ['course-reports', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_completion_reports')
        .select('*')
        .eq('student_id', user?.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as CourseCompletionReport[];
    },
    enabled: !!user?.id
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-student-report', {
        body: { enrollmentId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Reporte generado",
        description: "Tu reporte de curso ha sido generado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['course-reports'] });
      queryClient.invalidateQueries({ queryKey: ['completed-enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al generar el reporte",
        variant: "destructive",
      });
    }
  });

  const getReportForEnrollment = (enrollmentId: string) => {
    return existingReports?.find(report => report.enrollment_id === enrollmentId);
  };

  if (loadingEnrollments) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Cargando cursos completados...</div>
        </CardContent>
      </Card>
    );
  }

  if (!completedEnrollments?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mis Reportes de Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No tienes cursos completados aún. Completa un curso para generar tu primer reporte.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Mis Reportes de Curso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {completedEnrollments.map((enrollment) => {
          const existingReport = getReportForEnrollment(enrollment.id);
          
          return (
            <div key={enrollment.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold">{enrollment.courses.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{enrollment.courses.certification_agency}</Badge>
                    <Badge variant="secondary">{enrollment.courses.code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Instructor: {enrollment.profiles.first_name} {enrollment.profiles.last_name}
                  </p>
                  {enrollment.completion_date && (
                    <p className="text-sm text-muted-foreground">
                      Completado: {new Date(enrollment.completion_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="text-right space-y-2">
                  {enrollment.final_score && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-medium">{enrollment.final_score}%</span>
                    </div>
                  )}
                  <Progress value={enrollment.progress_percentage || 0} className="w-24" />
                </div>
              </div>

              {existingReport ? (
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-medium">Reporte Generado</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(existingReport.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{existingReport.total_dives}</div>
                      <div className="text-muted-foreground">Inmersiones</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{existingReport.total_bottom_time}min</div>
                      <div className="text-muted-foreground">Tiempo Total</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{existingReport.max_depth_achieved}m</div>
                      <div className="text-muted-foreground">Profundidad Máx</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Reporte
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                    {existingReport.certificate_url && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Award className="h-4 w-4 mr-2" />
                        Certificado
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => generateReportMutation.mutate(enrollment.id)}
                  disabled={generateReportMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {generateReportMutation.isPending ? 'Generando...' : 'Generar Reporte Completo'}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};