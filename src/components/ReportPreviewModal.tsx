import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { StudentReportPDF } from './StudentReportPDF';
import { Download, Eye, Loader2 } from 'lucide-react';

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
}

export function ReportPreviewModal({ 
  isOpen, 
  onClose, 
  student, 
  dives, 
  selectedDives,
  studentMediaFiles 
}: ReportPreviewModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  const fileName = `reporte_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;

  const reportDocument = (
    <StudentReportPDF
      student={student}
      dives={dives}
      selectedDives={selectedDives}
      studentMediaFiles={studentMediaFiles}
      stats={stats}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Previsualización del Reporte - {student.first_name} {student.last_name}
          </DialogTitle>
          <DialogDescription>
            Revisa el reporte antes de descargarlo. Incluye {selectedDives.length} inmersiones seleccionadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {!showPreview ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Resumen del Reporte</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p><span className="font-medium">Estudiante:</span> {student.first_name} {student.last_name}</p>
                    <p><span className="font-medium">Email:</span> {student.email}</p>
                    {student.certification_level && (
                      <p><span className="font-medium">Certificación:</span> {student.certification_level}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium">Inmersiones:</span> {stats.totalDives}</p>
                    <p><span className="font-medium">Tiempo total:</span> {stats.totalBottomTime} min</p>
                    <p><span className="font-medium">Profundidad máx:</span> {stats.maxDepth} m</p>
                    <p><span className="font-medium">Multimedia:</span> {studentMediaFiles.length} archivos ({studentMediaFiles.filter(f => f.type === 'image').length} imágenes, {studentMediaFiles.filter(f => f.type === 'video').length} videos)</p>
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
                  {loading ? 'Generando...' : 'Previsualizar PDF'}
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
                      {loading ? 'Generando...' : 'Descargar PDF'}
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
                      {loading ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
              
              <div className="flex-1 border rounded-lg overflow-hidden">
                {pdfBase64 ? (
                  <embed 
                    src={pdfBase64} 
                    type="application/pdf"
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
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