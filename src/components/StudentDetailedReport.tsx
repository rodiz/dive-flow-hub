import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportPreviewModal } from "./ReportPreviewModal";
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
  Send,
  Upload,
  Trash2,
  Heart,
  Activity,
  Thermometer,
  Wind,
  Eye,
  Wrench,
  Shield,
  BarChart3,
  History
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
    oxygen_amount?: number;
    ballast_weight?: number;
    tank_pressure_start?: number;
    tank_pressure_end?: number;
    wetsuit_thickness?: number;
    gas_mix?: string;
    visibility_conditions?: number;
    water_temperature?: number;
    current_strength?: number;
    safety_stop_time?: number;
    equipment_check: boolean;
    medical_check: boolean;
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

interface Certification {
  id: string;
  certification_level: string;
  certification_agency: string;
  certification_number?: string;
  certification_date?: string;
  expiration_date?: string;
}

interface MedicalRecord {
  id: string;
  dive_id?: string;
  recorded_at: string;
  cleared_to_dive: boolean;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  fitness_level?: number;
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
}

export function StudentDetailedReport({ isOpen, onClose, student }: StudentDetailedReportProps) {
  const [dives, setDives] = useState<DiveData[]>([]);
  const [selectedDives, setSelectedDives] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [studentMediaFiles, setStudentMediaFiles] = useState<{ url: string; name: string; type: 'image' | 'video' }[]>([]);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportType, setReportType] = useState<'single' | 'historical'>('historical');
  const [singleDiveId, setSingleDiveId] = useState<string>('');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && student.id) {
      fetchStudentDives();
      fetchStudentMediaFiles();
      fetchCertifications();
      fetchMedicalRecords();
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
          oxygen_amount,
          ballast_weight,
          tank_pressure_start,
          tank_pressure_end,
          wetsuit_thickness,
          gas_mix,
          visibility_conditions,
          water_temperature,
          current_strength,
          safety_stop_time,
          equipment_check,
          medical_check,
          skills_completed,
          dives!inner (
            id,
            dive_date,
            dive_time,
            depth_achieved,
            bottom_time,
            photos,
            videos,
            instructor_id,
            dive_sites (
              name,
              location
            ),
            profiles!instructor_id (
              first_name,
              last_name
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
          videos: participant.videos || [],
          oxygen_amount: participant.oxygen_amount,
          ballast_weight: participant.ballast_weight,
          tank_pressure_start: participant.tank_pressure_start,
          tank_pressure_end: participant.tank_pressure_end,
          wetsuit_thickness: participant.wetsuit_thickness,
          gas_mix: participant.gas_mix,
          visibility_conditions: participant.visibility_conditions,
          water_temperature: participant.water_temperature,
          current_strength: participant.current_strength,
          safety_stop_time: participant.safety_stop_time,
          equipment_check: participant.equipment_check,
          medical_check: participant.medical_check,
          skills_completed: participant.skills_completed
        }],
        photos: participant.dives.photos || [],
        videos: participant.dives.videos || [],
        instructor: participant.dives.profiles ? {
          first_name: participant.dives.profiles.first_name,
          last_name: participant.dives.profiles.last_name
        } : undefined
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

  const fetchStudentMediaFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('student-multimedia')
        .list(`${student.id}/`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const mediaUrls = data?.map(file => {
        const { data: urlData } = supabase.storage
          .from('student-multimedia')
          .getPublicUrl(`${student.id}/${file.name}`);
        
        const isVideo = file.name.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
        const isImage = file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
        
        return {
          url: urlData.publicUrl,
          name: file.name,
          type: isVideo ? 'video' as const : 'image' as const
        };
      }).filter(item => item.type) || [];

      setStudentMediaFiles(mediaUrls);
    } catch (error) {
      console.error('Error fetching student media:', error);
    }
  };

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor_verifications')
        .select('*')
        .eq('instructor_id', student.id)
        .eq('verification_status', 'verified');

      if (error) {
        console.error('Error fetching certifications:', error);
        return;
      }

      const formattedCerts = data?.map(cert => ({
        id: cert.id,
        certification_level: cert.certification_level,
        certification_agency: cert.certification_agency,
        certification_number: cert.certification_number,
        certification_date: cert.verified_at?.split('T')[0],
        expiration_date: cert.expiration_date
      })) || [];

      setCertifications(formattedCerts);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('student_id', student.id)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error fetching medical records:', error);
        return;
      }

      setMedicalRecords(data || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `${student.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('student-multimedia')
          .upload(filePath, file);

        if (error) throw error;
        return filePath;
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: "Multimedia subida",
        description: `${files.length} archivo(s) subido(s) exitosamente`,
      });

      fetchStudentMediaFiles();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir archivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${student.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('student-multimedia')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Archivo eliminado",
        description: "El archivo ha sido eliminado exitosamente",
      });

      fetchStudentMediaFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar archivo",
        variant: "destructive",
      });
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
    if (reportType === 'historical' && selectedDives.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una inmersión para el reporte histórico",
        variant: "destructive",
      });
      return;
    }
    
    if (reportType === 'single' && !singleDiveId) {
      toast({
        title: "Error", 
        description: "Selecciona una inmersión específica para el reporte individual",
        variant: "destructive",
      });
      return;
    }

    // Show the preview modal instead of directly generating
    setShowReportPreview(true);
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
            Selecciona el tipo de reporte y las inmersiones para generar un análisis completo.
          </DialogDescription>
        </DialogHeader>

        {/* Report Type Selection */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-sm font-medium">Tipo de Reporte:</h3>
            <div className="flex gap-2">
              <Button
                variant={reportType === 'historical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('historical');
                  setSingleDiveId('');
                }}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Reporte Histórico
              </Button>
              <Button
                variant={reportType === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('single');
                  setSelectedDives([]);
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Inmersión Individual
              </Button>
            </div>
          </div>
          
          {reportType === 'single' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium min-w-fit">Seleccionar inmersión:</label>
              <select 
                value={singleDiveId} 
                onChange={(e) => setSingleDiveId(e.target.value)}
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">-- Selecciona una inmersión --</option>
                {dives.map(dive => (
                  <option key={dive.id} value={dive.id}>
                    {dive.dive_sites?.name} - {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {reportType === 'historical' && (
            <div className="text-sm text-muted-foreground">
              Selecciona múltiples inmersiones en las pestañas para incluir en el reporte histórico.
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="dives">Inmersiones</TabsTrigger>
            <TabsTrigger value="equipment">Equipamiento</TabsTrigger>
            <TabsTrigger value="conditions">Condiciones</TabsTrigger>
            <TabsTrigger value="medical">Médico</TabsTrigger>
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
                        {reportType === 'historical' && (
                          <Checkbox 
                            checked={selectedDives.includes(dive.id)}
                            onCheckedChange={(checked) => handleDiveSelection(dive.id, checked as boolean)}
                          />
                        )}
                        {reportType === 'single' && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={dive.id}
                              name="singleDive"
                              checked={singleDiveId === dive.id}
                              onChange={() => setSingleDiveId(dive.id)}
                              className="h-4 w-4"
                            />
                          </div>
                        )}
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Multimedia del Estudiante</h3>
              <div className="flex gap-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="media-upload"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('media-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Subiendo...' : 'Subir Multimedia'}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {/* Student's own multimedia files */}
                {studentMediaFiles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Archivos Generales del Estudiante</span>
                        <Badge variant="secondary">{studentMediaFiles.length} archivos</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {studentMediaFiles.map((media, idx) => (
                          <div key={idx} className="relative group">
                            <div className="aspect-square bg-muted rounded overflow-hidden">
                              {media.type === 'video' ? (
                                <video 
                                  src={media.url} 
                                  className="w-full h-full object-cover"
                                  controls
                                />
                              ) : (
                                <img 
                                  src={media.url} 
                                  alt={media.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteMedia(media.url)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dive multimedia */}
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

                {studentMediaFiles.length === 0 && dives.filter(d => selectedDives.includes(d.id)).every(d => 
                  (d.photos?.length || 0) === 0 && 
                  (d.videos?.length || 0) === 0 && 
                  (d.dive_participants[0]?.images?.length || 0) === 0 && 
                  (d.dive_participants[0]?.videos?.length || 0) === 0
                ) && (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay multimedia disponible</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Sube archivos para comenzar a crear un portafolio multimedia del estudiante
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipamiento y Configuración
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {dives.filter(d => selectedDives.includes(d.id)).map((dive) => {
                      const participant = dive.dive_participants[0];
                      if (!participant) return null;

                      return (
                        <Card key={dive.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{dive.dive_sites?.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {participant.equipment_check && (
                                <Badge variant="outline" className="text-green-600">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Equipo OK
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Mezcla de Gas:</span>
                                <span className="font-medium">{participant.gas_mix || 'Air'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Presión Inicial:</span>
                                <span className="font-medium">{participant.tank_pressure_start ? `${participant.tank_pressure_start} bar` : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Presión Final:</span>
                                <span className="font-medium">{participant.tank_pressure_end ? `${participant.tank_pressure_end} bar` : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Peso del Lastre:</span>
                                <span className="font-medium">{participant.ballast_weight ? `${participant.ballast_weight} kg` : 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Grosor Traje:</span>
                                <span className="font-medium">{participant.wetsuit_thickness ? `${participant.wetsuit_thickness} mm` : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cantidad O2:</span>
                                <span className="font-medium">{participant.oxygen_amount ? `${participant.oxygen_amount}%` : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tiempo de Seguridad:</span>
                                <span className="font-medium">{participant.safety_stop_time ? `${participant.safety_stop_time} min` : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Condiciones de Buceo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {dives.filter(d => selectedDives.includes(d.id)).map((dive) => {
                      const participant = dive.dive_participants[0];
                      if (!participant) return null;

                      return (
                        <Card key={dive.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{dive.dive_sites?.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-muted rounded">
                              <Thermometer className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                              <p className="text-muted-foreground">Temperatura</p>
                              <p className="font-bold text-lg">
                                {participant.water_temperature ? `${participant.water_temperature}°C` : 'N/A'}
                              </p>
                            </div>
                            
                            <div className="text-center p-3 bg-muted rounded">
                              <Eye className="h-6 w-6 mx-auto mb-2 text-green-500" />
                              <p className="text-muted-foreground">Visibilidad</p>
                              <p className="font-bold text-lg">
                                {participant.visibility_conditions ? `${participant.visibility_conditions}m` : 'N/A'}
                              </p>
                            </div>
                            
                            <div className="text-center p-3 bg-muted rounded">
                              <Wind className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                              <p className="text-muted-foreground">Corriente</p>
                              <p className="font-bold text-lg">
                                {participant.current_strength ? `Nivel ${participant.current_strength}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Condiciones Generales:</span>
                              <div className="flex gap-2">
                                {participant.visibility_conditions && participant.visibility_conditions > 15 && (
                                  <Badge variant="outline" className="text-green-600">Excelente Visibilidad</Badge>
                                )}
                                {participant.current_strength === 0 && (
                                  <Badge variant="outline" className="text-blue-600">Sin Corriente</Badge>
                                )}
                                {participant.water_temperature && participant.water_temperature > 25 && (
                                  <Badge variant="outline" className="text-orange-600">Agua Cálida</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Información Médica y Aptitud
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {/* Resumen médico general */}
                    {medicalRecords.length > 0 && (
                      <Card className="p-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium text-green-800">Estado Médico General</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Último Chequeo:</p>
                            <p className="font-medium">
                              {format(new Date(medicalRecords[0].recorded_at), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Apto para Bucear:</p>
                            <Badge variant={medicalRecords[0].cleared_to_dive ? "default" : "destructive"}>
                              {medicalRecords[0].cleared_to_dive ? 'Sí' : 'No'}
                            </Badge>
                          </div>
                          {medicalRecords[0].fitness_level && (
                            <div>
                              <p className="text-muted-foreground">Nivel de Condición:</p>
                              <p className="font-medium">{medicalRecords[0].fitness_level}/10</p>
                            </div>
                          )}
                          {medicalRecords[0].heart_rate && (
                            <div>
                              <p className="text-muted-foreground">Frecuencia Cardíaca:</p>
                              <p className="font-medium">{medicalRecords[0].heart_rate} bpm</p>
                            </div>
                          )}
                        </div>
                        
                        {(medicalRecords[0].medical_conditions || medicalRecords[0].allergies || medicalRecords[0].medications) && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            {medicalRecords[0].medical_conditions && (
                              <div className="mb-2">
                                <p className="text-sm text-muted-foreground">Condiciones Médicas:</p>
                                <p className="text-sm">{medicalRecords[0].medical_conditions}</p>
                              </div>
                            )}
                            {medicalRecords[0].allergies && (
                              <div className="mb-2">
                                <p className="text-sm text-muted-foreground">Alergias:</p>
                                <p className="text-sm">{medicalRecords[0].allergies}</p>
                              </div>
                            )}
                            {medicalRecords[0].medications && (
                              <div>
                                <p className="text-sm text-muted-foreground">Medicamentos:</p>
                                <p className="text-sm">{medicalRecords[0].medications}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Chequeos médicos por inmersión */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Chequeos Pre-Inmersión</h4>
                      {dives.filter(d => selectedDives.includes(d.id)).map((dive) => {
                        const participant = dive.dive_participants[0];
                        if (!participant) return null;

                        return (
                          <Card key={dive.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{dive.dive_sites?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge 
                                  variant={participant.medical_check ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {participant.medical_check ? 'Chequeo OK' : 'No verificado'}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {medicalRecords.length === 0 && (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay registros médicos disponibles</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Los registros médicos aparecerán aquí cuando se realicen chequeos
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolución del Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {dives.filter(d => selectedDives.includes(d.id)).map((dive, index) => {
                      const participant = dive.dive_participants[0];
                      if (!participant) return null;

                      // Cálculo de tendencia de profundidad
                      const depthTrend = index > 0 ? 
                        (participant.depth_achieved - (dives.filter(d => selectedDives.includes(d.id))[index - 1]?.dive_participants[0]?.depth_achieved || 0)) : 0;

                      return (
                        <Card key={dive.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{dive.dive_sites?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(dive.dive_date), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm">
                                  {participant.depth_achieved || 0}m • {participant.bottom_time || 0}min
                                </p>
                                {depthTrend !== 0 && (
                                  <Badge variant="outline" className={depthTrend > 0 ? "text-green-600" : "text-orange-600"}>
                                    {depthTrend > 0 ? `+${depthTrend}m` : `${depthTrend}m`}
                                  </Badge>
                                )}
                              </div>
                              {participant.performance_rating && (
                                <Badge 
                                  variant="outline"
                                  className={getPerformanceColor(participant.performance_rating)}
                                >
                                  Rendimiento: {participant.performance_rating}/10
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {participant.skills_completed && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Habilidades Completadas:</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(participant.skills_completed).map(([skill, completed]) => (
                                  <Badge 
                                    key={skill} 
                                    variant={completed ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {participant.individual_notes && (
                            <div className="mt-2 p-2 bg-muted rounded">
                              <p className="text-xs text-muted-foreground">Notas:</p>
                              <p className="text-xs">{participant.individual_notes}</p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {reportType === 'historical' 
              ? `${selectedDives.length} inmersiones seleccionadas de ${dives.length}`
              : singleDiveId 
                ? `Inmersión seleccionada: ${dives.find(d => d.id === singleDiveId)?.dive_sites?.name || 'N/A'}`
                : 'Ninguna inmersión seleccionada'
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button 
              onClick={generateReport}
              disabled={
                (reportType === 'historical' && selectedDives.length === 0) ||
                (reportType === 'single' && !singleDiveId)
              }
              className="bg-gradient-ocean"
            >
              <Send className="h-4 w-4 mr-2" />
              Generar {reportType === 'single' ? 'Reporte Individual' : 'Reporte Histórico'}
            </Button>
          </div>
        </div>

        {/* Report Preview Modal */}
        <ReportPreviewModal
          isOpen={showReportPreview}
          onClose={() => setShowReportPreview(false)}
          student={student}
          dives={dives}
          selectedDives={selectedDives}
          studentMediaFiles={studentMediaFiles}
          reportType={reportType}
          singleDiveId={singleDiveId}
        />
      </DialogContent>
    </Dialog>
  );
}