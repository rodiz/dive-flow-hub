import React, { useState } from 'react';
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
  Send,
  Eye,
  CheckCircle,
  Clock,
  User,
  BookOpen
} from 'lucide-react';

interface StudentEnrollment {
  id: string;
  enrollment_status: string;
  progress_percentage: number;
  completion_date: string | null;
  final_score: number | null;
  report_generated: boolean;
  report_sent_at: string | null;
  student_id: string;
  course_id: string;
  courses: {
    name: string;
    certification_agency: string;
    code: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CourseReport {
  id: string;
  enrollment_id: string;
  total_dives: number;
  total_bottom_time: number;
  max_depth_achieved: number;
  generated_at: string;
  report_data: any;
}

export const InstructorReportManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'completed' | 'in-progress'>('completed');

  // Fetch student enrollments
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['instructor-enrollments', user?.id, selectedTab],
    queryFn: async () => {
      const query = supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (name, certification_agency, code),
          profiles!course_enrollments_student_id_fkey (first_name, last_name, email)
        `)
        .eq('instructor_id', user?.id);

      if (selectedTab === 'completed') {
        query.eq('enrollment_status', 'completed');
      } else {
        query.neq('enrollment_status', 'completed');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudentEnrollment[];
    },
    enabled: !!user?.id
  });

  // Fetch existing reports
  const { data: reports } = useQuery({
    queryKey: ['instructor-reports', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_completion_reports')
        .select('*')
        .eq('instructor_id', user?.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as CourseReport[];
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
    onSuccess: (data, enrollmentId) => {
      const enrollment = enrollments?.find(e => e.id === enrollmentId);
      const studentName = enrollment ? `${enrollment.profiles.first_name} ${enrollment.profiles.last_name}` : 'el estudiante';
      
      toast({
        title: "Reporte generado",
        description: `Reporte de curso generado exitosamente para ${studentName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-reports'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al generar el reporte",
        variant: "destructive",
      });
    }
  });

  // Mark course as completed mutation
  const markCompletedMutation = useMutation({
    mutationFn: async ({ enrollmentId, finalScore }: { enrollmentId: string; finalScore: number }) => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({
          enrollment_status: 'completed',
          completion_date: new Date().toISOString().split('T')[0],
          final_score: finalScore,
          progress_percentage: 100
        })
        .eq('id', enrollmentId)
        .eq('instructor_id', user?.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Curso completado",
        description: "El curso ha sido marcado como completado.",
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al completar el curso",
        variant: "destructive",
      });
    }
  });

  const getReportForEnrollment = (enrollmentId: string) => {
    return reports?.find(report => report.enrollment_id === enrollmentId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Cargando inscripciones...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gestión de Reportes de Estudiantes
        </CardTitle>
        
        <div className="flex gap-2">
          <Button
            variant={selectedTab === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('completed')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completados
          </Button>
          <Button
            variant={selectedTab === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab('in-progress')}
          >
            <Clock className="h-4 w-4 mr-2" />
            En Progreso
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!enrollments?.length ? (
          <p className="text-muted-foreground text-center py-8">
            {selectedTab === 'completed' 
              ? 'No hay cursos completados aún.' 
              : 'No hay cursos en progreso.'}
          </p>
        ) : (
          enrollments.map((enrollment) => {
            const existingReport = getReportForEnrollment(enrollment.id);
            
            return (
              <div key={enrollment.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <h3 className="font-semibold">
                        {enrollment.profiles.first_name} {enrollment.profiles.last_name}
                      </h3>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(enrollment.enrollment_status)}`} />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{enrollment.courses.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{enrollment.courses.certification_agency}</Badge>
                      <Badge variant="secondary">{enrollment.courses.code}</Badge>
                      <Badge variant={enrollment.enrollment_status === 'completed' ? 'default' : 'secondary'}>
                        {enrollment.enrollment_status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {enrollment.profiles.email}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-2">
                    {enrollment.final_score && (
                      <div className="font-medium text-lg">
                        {enrollment.final_score}%
                      </div>
                    )}
                    <Progress value={enrollment.progress_percentage || 0} className="w-24" />
                    <div className="text-xs text-muted-foreground">
                      {enrollment.progress_percentage || 0}% completo
                    </div>
                  </div>
                </div>

                {/* Actions for in-progress courses */}
                {selectedTab === 'in-progress' && enrollment.enrollment_status === 'active' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markCompletedMutation.mutate({ 
                        enrollmentId: enrollment.id, 
                        finalScore: 85 
                      })}
                      disabled={markCompletedMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Completado
                    </Button>
                  </div>
                )}

                {/* Report section for completed courses */}
                {selectedTab === 'completed' && (
                  <div>
                    {existingReport ? (
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="font-medium">Reporte Disponible</span>
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
                            <Send className="h-4 w-4 mr-2" />
                            Reenviar
                          </Button>
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
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};