import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  Gauge, 
  Camera, 
  Video, 
  Download,
  TrendingUp,
  Award,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StudentDetailedReportProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    certification_level?: string;
  };
}

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
}

export function StudentDetailedReport({ isOpen, onClose, student }: StudentDetailedReportProps) {
  const [dives, setDives] = useState<DiveData[]>([]);
  const [selectedDives, setSelectedDives] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && student.id) {
      fetchStudentDives();
    }
  }, [isOpen, student.id]);

  const fetchStudentDives = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from('dive_participants')
        .select(`
          dive_id,
          depth_achieved,
          bottom_time,
          performance_rating,
          individual_notes,
          images,
          videos,
          dives!inner (
            id,
            dive_date,
            dive_time,
            depth_achieved,
            bottom_time,
            photos,
            videos,
            dive_sites (
              name,
              location
            )
          )
        `)
        .eq('student_id', student.id);

      const { data, error } = await query;

      if (error) throw error;

      const formattedDives = data?.map(participant => ({
        id: participant.dives.id,
        dive_date: participant.dives.dive_date,
        dive_time: participant.dives.dive_time,
        depth_achieved: participant.dives.depth_achieved,
        bottom_time: participant.dives.bottom_time,
        dive_sites: participant.dives.dive_sites,
        dive_participants: [{
          depth_achieved: participant.depth_achieved,
          bottom_time: participant.bottom_time,
          performance_rating: participant.performance_rating,
          individual_notes: participant.individual_notes,
          images: participant.images || [],
          videos: participant.videos || []
        }],
        photos: participant.dives.photos || [],
        videos: participant.dives.videos || []
      })) || [];

      // Sort by date descending
      formattedDives.sort((a, b) => new Date(b.dive_date).getTime() - new Date(a.dive_date).getTime());

      setDives(formattedDives);
      setSelectedDives(formattedDives.map(d => d.id));
    } catch (error) {
      console.error('Error fetching student dives:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las inmersiones del estudiante",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiveSelection = (diveId: string, checked: boolean) => {
    if (checked) {
      setSelectedDives(prev => [...prev, diveId]);
    } else {
      setSelectedDives(prev => prev.filter(id => id !== diveId));
    }
  };

  const generateReport = async () => {
    if (selectedDives.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una inmersión para el reporte",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Find the enrollment for this student
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('student_id', student.id)
        .single();

      if (!enrollment) {
        throw new Error('No se encontró inscripción para este estudiante');
      }

      const { data, error } = await supabase.functions.invoke('generate-student-report', {
        body: {
          enrollmentId: enrollment.id,
          selectedDiveIds: selectedDives
        }
      });

      if (error) throw error;

      toast({
        title: "Reporte generado",
        description: "El reporte ha sido generado exitosamente",
      });

      onClose();
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error.message || "Error al generar el reporte",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 8) return "text-green-600";
    if (rating >= 6) return "text-yellow-600";
    return "text-red-600";
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {student.first_name?.[0]?.toUpperCase()}{student.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Reporte Detallado - {student.first_name} {student.last_name}
          </DialogTitle>
          <DialogDescription>
            Visualiza y selecciona las inmersiones para generar un reporte completo del estudiante.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="dives">Inmersiones</TabsTrigger>
            <TabsTrigger value="multimedia">Multimedia</TabsTrigger>
            <TabsTrigger value="progress">Progreso</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Inmersiones</p>
                      <p className="text-2xl font-bold">{stats.totalDives}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tiempo Total</p>
                      <p className="text-2xl font-bold">{stats.totalBottomTime}min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Profundidad Máx</p>
                      <p className="text-2xl font-bold">{stats.maxDepth}m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rendimiento Prom</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(stats.avgPerformance)}`}>
                        {stats.avgPerformance.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Información del Estudiante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  {student.certification_level && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nivel de Certificación</p>
                      <Badge variant="secondary">{student.certification_level}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dives" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Seleccionar Inmersiones para el Reporte</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDives(dives.map(d => d.id))}
                >
                  Seleccionar Todas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDives([])}
                >
                  Limpiar Selección
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {loading ? (
                  <p className="text-center py-8">Cargando inmersiones...</p>
                ) : dives.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No hay inmersiones registradas</p>
                ) : (
                  dives.map((dive) => (
                    <Card key={dive.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedDives.includes(dive.id)}
                          onCheckedChange={(checked) => handleDiveSelection(dive.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{dive.dive_sites?.name}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {dive.dive_sites?.location}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                                {dive.dive_time && ` • ${dive.dive_time}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                <span className="font-medium">{dive.dive_participants[0]?.depth_achieved || 0}m</span>
                                <span className="text-muted-foreground"> • {dive.dive_participants[0]?.bottom_time || 0}min</span>
                              </p>
                              {dive.dive_participants[0]?.performance_rating && (
                                <Badge 
                                  variant="outline"
                                  className={getPerformanceColor(dive.dive_participants[0].performance_rating)}
                                >
                                  {dive.dive_participants[0].performance_rating}/10
                                </Badge>
                              )}
                            </div>
                          </div>
                          {dive.dive_participants[0]?.individual_notes && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                              {dive.dive_participants[0].individual_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="multimedia" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {dives.filter(d => selectedDives.includes(d.id)).map((dive) => {
                  const allImages = [...(dive.photos || []), ...(dive.dive_participants[0]?.images || [])];
                  const allVideos = [...(dive.videos || []), ...(dive.dive_participants[0]?.videos || [])];
                  
                  if (allImages.length === 0 && allVideos.length === 0) return null;

                  return (
                    <Card key={dive.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {dive.dive_sites?.name} - {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {allImages.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Camera className="h-4 w-4" />
                              <span className="text-sm font-medium">Fotos ({allImages.length})</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {allImages.slice(0, 8).map((image, idx) => (
                                <div key={idx} className="aspect-square bg-muted rounded overflow-hidden">
                                  <img 
                                    src={image} 
                                    alt={`Foto ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            {allImages.length > 8 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                +{allImages.length - 8} fotos más
                              </p>
                            )}
                          </div>
                        )}
                        
                        {allVideos.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Video className="h-4 w-4" />
                              <span className="text-sm font-medium">Videos ({allVideos.length})</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {allVideos.slice(0, 4).map((video, idx) => (
                                <div key={idx} className="aspect-video bg-muted rounded overflow-hidden">
                                  <video 
                                    src={video} 
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                </div>
                              ))}
                            </div>
                            {allVideos.length > 4 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                +{allVideos.length - 4} videos más
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dives.filter(d => selectedDives.includes(d.id)).map((dive, index) => (
                    <div key={dive.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{dive.dive_sites?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {dive.dive_participants[0]?.depth_achieved || 0}m • {dive.dive_participants[0]?.bottom_time || 0}min
                        </p>
                        {dive.dive_participants[0]?.performance_rating && (
                          <Badge 
                            variant="outline"
                            className={getPerformanceColor(dive.dive_participants[0].performance_rating)}
                          >
                            Rendimiento: {dive.dive_participants[0].performance_rating}/10
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedDives.length} inmersiones seleccionadas de {dives.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button 
              onClick={generateReport}
              disabled={generating || selectedDives.length === 0}
              className="bg-gradient-ocean"
            >
              {generating ? (
                <>Generando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}