import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, History, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface DiveReport {
  id: string;
  student_id: string;
  instructor_id: string | null;
  report_type: 'single_dive' | 'historical';
  pdf_url: string | null;
  file_name: string;
  dive_ids: string[];
  metadata: {
    generated_at: string;
    dive_count: number;
    student_name: string;
    multimedia_count: number;
  };
  created_at: string;
  updated_at: string;
}

interface ReportsListProps {
  studentId: string;
}

export function ReportsList({ studentId }: ReportsListProps) {
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['dive-reports', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dive_reports')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DiveReport[];
    },
    enabled: !!studentId
  });

  const handleDownload = (report: DiveReport) => {
    if (report.pdf_url) {
      window.open(report.pdf_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes Generados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando reportes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes Generados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">Error al cargar los reportes</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Reportes Generados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay reportes generados aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              Los reportes aparecerán aquí una vez que los generes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {report.report_type === 'single_dive' ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <History className="h-4 w-4" />
                      )}
                      <h4 className="font-medium">
                        {report.report_type === 'single_dive' 
                          ? 'Reporte de Inmersión Individual'
                          : 'Reporte Histórico de Inmersiones'
                        }
                      </h4>
                      <Badge variant={report.report_type === 'single_dive' ? 'default' : 'secondary'}>
                        {report.report_type === 'single_dive' ? 'Individual' : 'Histórico'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {report.metadata.dive_count} inmersion{report.metadata.dive_count !== 1 ? 'es' : ''}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-medium">Estudiante:</span> {report.metadata.student_name}</p>
                      <p><span className="font-medium">Archivo:</span> {report.file_name}</p>
                      {report.metadata.multimedia_count > 0 && (
                        <p><span className="font-medium">Multimedia:</span> {report.metadata.multimedia_count} archivo{report.metadata.multimedia_count !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleDownload(report)}
                      size="sm"
                      disabled={!report.pdf_url}
                      className="bg-gradient-ocean"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar PDF
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}