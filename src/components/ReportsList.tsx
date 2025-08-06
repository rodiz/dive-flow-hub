import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  BookOpen,
  Clock,
  Gauge,
  ExternalLink
} from "lucide-react";

interface Report {
  id: string;
  generated_at: string;
  report_data: any;
  total_dives: number;
  total_bottom_time: number;
  max_depth_achieved: number;
  pdf_url?: string;
  certificate_url?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  courses?: {
    name: string;
    certification_agency: string;
  };
}

interface ReportsListProps {
  studentId: string;
  onViewReport?: (report: Report) => void;
}

export function ReportsList({ studentId, onViewReport }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (studentId) {
      fetchReports();
    }
  }, [studentId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_completion_reports')
        .select(`
          id,
          generated_at,
          report_data,
          total_dives,
          total_bottom_time,
          max_depth_achieved,
          pdf_url,
          certificate_url,
          instructor_id,
          course_id,
          profiles!course_completion_reports_instructor_id_fkey (
            first_name,
            last_name
          ),
          courses (
            name,
            certification_agency
          )
        `)
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our Report interface
      const mappedReports: Report[] = (data || []).map(item => ({
        id: item.id,
        generated_at: item.generated_at,
        report_data: item.report_data,
        total_dives: item.total_dives || 0,
        total_bottom_time: item.total_bottom_time || 0,
        max_depth_achieved: item.max_depth_achieved || 0,
        pdf_url: item.pdf_url,
        certificate_url: item.certificate_url,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        courses: Array.isArray(item.courses) ? item.courses[0] : item.courses,
      }));
      
      setReports(mappedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (report: Report) => {
    if (!report.pdf_url) {
      toast({
        title: "PDF no disponible",
        description: "Este reporte aún no tiene un PDF generado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = supabase.storage
        .from('pdf-reports')
        .getPublicUrl(report.pdf_url);
      
      // Open PDF in new tab
      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay reportes disponibles</h3>
          <p className="text-muted-foreground">
            Los reportes aparecerán aquí cuando sean generados por el instructor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="border hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {report.courses?.name || 'Reporte de Curso'}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(report.generated_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                  {report.profiles && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {report.profiles.first_name} {report.profiles.last_name}
                    </div>
                  )}
                  {report.courses?.certification_agency && (
                    <Badge variant="outline">
                      {report.courses.certification_agency}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {report.pdf_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPDF(report)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReport?.(report)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                )}
                {report.certificate_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(report.certificate_url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Certificado
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <BookOpen className="h-4 w-4" />
                  Inmersiones
                </div>
                <p className="text-lg font-semibold">{report.total_dives || 0}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Tiempo Total
                </div>
                <p className="text-lg font-semibold">{report.total_bottom_time || 0}min</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <Gauge className="h-4 w-4" />
                  Prof. Máxima
                </div>
                <p className="text-lg font-semibold">{report.max_depth_achieved || 0}m</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  Estado
                </div>
                <Badge variant={report.pdf_url ? "default" : "secondary"}>
                  {report.pdf_url ? "Completo" : "Procesando"}
                </Badge>
              </div>
            </div>
            
            {report.report_data?.course_summary && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Resumen del Curso</h4>
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                  {report.report_data.course_summary.start_date && (
                    <div>
                      <span className="font-medium">Inicio:</span> {format(new Date(report.report_data.course_summary.start_date), 'dd/MM/yyyy')}
                    </div>
                  )}
                  {report.report_data.course_summary.completion_date && (
                    <div>
                      <span className="font-medium">Finalización:</span> {format(new Date(report.report_data.course_summary.completion_date), 'dd/MM/yyyy')}
                    </div>
                  )}
                  {report.report_data.course_summary.final_score && (
                    <div>
                      <span className="font-medium">Puntuación:</span> {report.report_data.course_summary.final_score}/100
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}