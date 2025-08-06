import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { StudentReportPDF } from './StudentReportPDF';
import { SingleDiveReportPDF } from './SingleDiveReportPDF';
import { Download, Eye, Loader2, FileText, History, Save } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiveData {
  id: string;
  dive_date: string;
  dive_time: string;
  depth_achieved: number;
  bottom_time: number;
  dive_sites: {
    name: string;
    location: string;
  };
  dive_participants: Array<{
    depth_achieved: number;
    bottom_time: number;
    performance_rating: number;
    individual_notes: string;
    images: string[];
    videos: string[];
    wetsuit_thickness?: number;
    gas_mix?: string;
    visibility_conditions?: number;
    water_temperature?: number;
    current_strength?: number;
    safety_stop_time?: number;
    tank_pressure_start?: number;
    tank_pressure_end?: number;
    oxygen_amount?: number;
    ballast_weight?: number;
    equipment_check?: boolean;
    medical_check?: boolean;
    skills_completed?: any;
  }>;
  photos: string[];
  videos: string[];
  instructor?: {
    first_name: string;
    last_name: string;
  };
  diving_center?: {
    name: string;
  };
}

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    certification_level?: string;
  };
  dives: DiveData[];
  selectedDives: string[];
  studentMediaFiles: { url: string; name: string; type: 'image' | 'video' }[];
  reportType?: 'single' | 'historical';
  singleDiveId?: string;
}

export function ReportPreviewModal({ 
  isOpen, 
  onClose, 
  student, 
  dives, 
  selectedDives,
  studentMediaFiles,
  reportType = 'historical',
  singleDiveId 
}: ReportPreviewModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isHistoricalReport = reportType === 'historical';
  const isSingleDiveReport = reportType === 'single' && singleDiveId;

  const getTotalStats = () => {
    const selectedDiveData = dives.filter(d => selectedDives.includes(d.id));
    return {
      totalDives: selectedDiveData.length,
      totalBottomTime: selectedDiveData.reduce((sum, d) => sum + (d.dive_participants[0]?.bottom_time || 0), 0),
      maxDepth: Math.max(...selectedDiveData.map(d => d.dive_participants[0]?.depth_achieved || 0)),
      avgPerformance: selectedDiveData.length > 0 
        ? selectedDiveData.reduce((sum, d) => sum + (d.dive_participants[0]?.performance_rating || 0), 0) / selectedDiveData.length
        : 0
    };
  };

  const stats = getTotalStats();
  const singleDive = isSingleDiveReport ? dives.find(d => d.id === singleDiveId) : null;
  
  const getReportTitle = () => {
    if (isSingleDiveReport && singleDive) {
      return `Reporte de Inmersión - ${singleDive.dive_sites.name}`;
    }
    return `Reporte Histórico - ${selectedDives.length} inmersiones`;
  };

  const fileName = isSingleDiveReport && singleDive
    ? `inmersion_${student.first_name}_${student.last_name}_${singleDive.dive_sites.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    : `reporte_historico_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Get multimedia files for single dive report
  const getSingleDiveMediaFiles = () => {
    if (!isSingleDiveReport || !singleDive) return [];
    
    const participant = singleDive.dive_participants[0];
    const allUrls = [
      ...(participant?.images || []),
      ...(participant?.videos || []),
      ...(singleDive.photos || []),
      ...(singleDive.videos || [])
    ];
    
    return studentMediaFiles.filter(file => 
      allUrls.includes(file.url) || 
      allUrls.some(url => url.includes(file.name))
    );
  };

  const reportDocument = isSingleDiveReport && singleDive ? (
    <SingleDiveReportPDF
      student={student}
      dive={singleDive}
      studentMediaFiles={getSingleDiveMediaFiles()}
    />
  ) : (
    <StudentReportPDF
      student={student}
      dives={dives}
      selectedDives={selectedDives}
      studentMediaFiles={studentMediaFiles}
      stats={stats}
    />
  );

  const saveReportToDatabase = async () => {
    setSaving(true);
    try {
      // Generate PDF blob
      const pdfBlob = await pdf(reportDocument).toBlob();
      
      // Upload PDF to storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storageFileName = `${student.id}/${fileName.replace('.pdf', '')}_${timestamp}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-reports')
        .upload(storageFileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error uploading PDF: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-reports')
        .getPublicUrl(storageFileName);

      // Save report record to database
      const reportData = {
        student_id: student.id,
        report_type: isSingleDiveReport ? 'single_dive' : 'historical',
        pdf_url: publicUrl,
        file_name: fileName,
        dive_ids: isSingleDiveReport ? [singleDiveId!] : selectedDives,
        metadata: {
          generated_at: new Date().toISOString(),
          dive_count: isSingleDiveReport ? 1 : selectedDives.length,
          student_name: `${student.first_name} ${student.last_name}`,
          multimedia_count: isSingleDiveReport ? getSingleDiveMediaFiles().length : studentMediaFiles.length
        }
      };

      const { error: dbError } = await supabase
        .from('course_completion_reports')
        .insert(reportData);

      if (dbError) {
        throw new Error(`Error saving report record: ${dbError.message}`);
      }

      toast({
        title: "Reporte guardado",
        description: `El ${isSingleDiveReport ? 'reporte de inmersión' : 'reporte histórico'} se ha guardado exitosamente`,
      });

      // Close modal after successful save
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar el reporte",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSingleDiveReport ? <FileText className="h-5 w-5" /> : <History className="h-5 w-5" />}
            {getReportTitle()} - {student.first_name} {student.last_name}
            <Badge variant={isSingleDiveReport ? "default" : "secondary"} className="ml-2">
              {isSingleDiveReport ? "Inmersión Individual" : "Reporte Histórico"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isSingleDiveReport && singleDive 
              ? `Inmersión del ${new Date(singleDive.dive_date).toLocaleDateString('es-ES')} en ${singleDive.dive_sites.name}`
              : `Revisa el reporte antes de descargarlo. Incluye ${selectedDives.length} inmersiones seleccionadas.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {!showPreview ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {isSingleDiveReport ? "Resumen de la Inmersión" : "Resumen del Reporte Histórico"}
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p><span className="font-medium">Estudiante:</span> {student.first_name} {student.last_name}</p>
                    <p><span className="font-medium">Email:</span> {student.email}</p>
                    {student.certification_level && (
                      <p><span className="font-medium">Certificación:</span> {student.certification_level}</p>
                    )}
                    {isSingleDiveReport && singleDive && (
                      <>
                        <p><span className="font-medium">Sitio:</span> {singleDive.dive_sites.name}</p>
                        <p><span className="font-medium">Fecha:</span> {new Date(singleDive.dive_date).toLocaleDateString('es-ES')}</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    {isSingleDiveReport && singleDive ? (
                      <>
                        <p><span className="font-medium">Profundidad:</span> {singleDive.dive_participants[0]?.depth_achieved || singleDive.depth_achieved} m</p>
                        <p><span className="font-medium">Tiempo:</span> {singleDive.dive_participants[0]?.bottom_time || singleDive.bottom_time} min</p>
                        <p><span className="font-medium">Calificación:</span> {singleDive.dive_participants[0]?.performance_rating || 'N/A'}/5</p>
                        <p><span className="font-medium">Multimedia:</span> {getSingleDiveMediaFiles().length} archivos</p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">Inmersiones:</span> {stats.totalDives}</p>
                        <p><span className="font-medium">Tiempo total:</span> {stats.totalBottomTime} min</p>
                        <p><span className="font-medium">Profundidad máx:</span> {stats.maxDepth} m</p>
                        <p><span className="font-medium">Multimedia:</span> {studentMediaFiles.length} archivos ({studentMediaFiles.filter(f => f.type === 'image').length} imágenes, {studentMediaFiles.filter(f => f.type === 'video').length} videos)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const blob = await pdf(reportDocument).toBlob();
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64data = reader.result as string;
                        setPdfBase64(base64data);
                        setShowPreview(true);
                        setLoading(false);
                      };
                      reader.readAsDataURL(blob);
                    } catch (error) {
                      console.error('Error generating PDF preview:', error);
                      setLoading(false);
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  {loading ? 'Generando...' : `Previsualizar ${isSingleDiveReport ? 'Inmersión' : 'Reporte Histórico'}`}
                </Button>

                <Button 
                  onClick={saveReportToDatabase}
                  variant="secondary"
                  className="flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Guardando...' : 'Guardar Reporte'}
                </Button>
                
                <PDFDownloadLink
                  document={reportDocument}
                  fileName={fileName}
                >
                  {({ loading }) => (
                    <Button 
                      className="bg-gradient-ocean flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {loading ? 'Generando...' : `Descargar ${isSingleDiveReport ? 'Inmersión' : 'Reporte Histórico'}`}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                >
                  ← Volver al Resumen
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={saveReportToDatabase}
                    variant="secondary"
                    className="flex items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>

                  <PDFDownloadLink
                    document={reportDocument}
                    fileName={fileName}
                  >
                    {({ loading }) => (
                      <Button 
                        className="bg-gradient-ocean flex items-center gap-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {loading ? 'Generando...' : `Descargar ${isSingleDiveReport ? 'Inmersión' : 'Reporte Histórico'}`}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
              
              <div className="flex-1 border rounded-lg overflow-hidden">
                {pdfBase64 ? (
                  <iframe 
                    src={pdfBase64} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', minHeight: '600px' }}
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}