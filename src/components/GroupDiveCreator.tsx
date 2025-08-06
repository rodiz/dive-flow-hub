import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, MapPin, Calendar, Clock, Save, Search, SortAsc } from "lucide-react";
import { useInstructorStudents } from "@/hooks/useInstructorStudents";

interface GroupDiveData {
  dive_site_id: string;
  dive_date: string;
  dive_time: string;
  dive_type: string;
  depth_achieved: string;
  bottom_time: string;
  general_notes: string;
}

interface GroupDiveCreatorProps {
  diveSites: any[];
  onSuccess: () => void;
}

export const GroupDiveCreator = ({ diveSites, onSuccess }: GroupDiveCreatorProps) => {
  const { user } = useAuth();
  const { data: instructorStudents = [] } = useInstructorStudents();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");
  
  const [groupDiveData, setGroupDiveData] = useState<GroupDiveData>({
    dive_site_id: '',
    dive_date: '',
    dive_time: '',
    dive_type: 'training',
    depth_achieved: '',
    bottom_time: '',
    general_notes: ''
  });

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = instructorStudents.filter(student => {
      const studentName = student.profile?.first_name && student.profile?.last_name
        ? `${student.profile.first_name} ${student.profile.last_name}`
        : student.student_name || student.student_email || '';
      
      return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             student.student_email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort students
    filtered.sort((a, b) => {
      if (sortBy === "alphabetical") {
        const nameA = a.profile?.first_name && a.profile?.last_name
          ? `${a.profile.first_name} ${a.profile.last_name}`
          : a.student_name || a.student_email || '';
        const nameB = b.profile?.first_name && b.profile?.last_name
          ? `${b.profile.first_name} ${b.profile.last_name}`
          : b.student_name || b.student_email || '';
        return nameA.localeCompare(nameB);
      } else {
        // Sort by most recent (invited_at)
        return new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime();
      }
    });

    // Show only first 6
    return filtered.slice(0, 6);
  }, [instructorStudents, searchTerm, sortBy]);

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSaveGroupDive = async () => {
    if (!user || selectedStudents.length === 0) {
      toast.error("Debes seleccionar al menos un estudiante");
      return;
    }

    if (!groupDiveData.dive_site_id || !groupDiveData.dive_date || !groupDiveData.depth_achieved || !groupDiveData.bottom_time) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    
    try {
      // 1. Crear UNA inmersión grupal
      const { data: dive, error: diveError } = await supabase
        .from('dives')
        .insert({
          instructor_id: user.id,
          dive_site_id: groupDiveData.dive_site_id,
          dive_date: groupDiveData.dive_date,
          dive_time: groupDiveData.dive_time || null,
          dive_type: groupDiveData.dive_type as "training" | "fun" | "certification" | "specialty",
          depth_achieved: parseInt(groupDiveData.depth_achieved),
          bottom_time: parseInt(groupDiveData.bottom_time),
          notes: groupDiveData.general_notes,
          max_participants: selectedStudents.length,
          actual_participants: selectedStudents.length
        })
        .select()
        .single();

      if (diveError) throw diveError;

      // 2. Crear participantes para cada estudiante seleccionado
      const participantsData = selectedStudents.map(studentId => ({
        dive_id: dive.id,
        student_id: studentId,
        instructor_id: user.id,
        depth_achieved: parseInt(groupDiveData.depth_achieved),
        bottom_time: parseInt(groupDiveData.bottom_time),
        equipment_check: false,
        medical_check: false,
        individual_notes: null,
        performance_rating: 5 // Rating por defecto
      }));

      const { error: participantsError } = await supabase
        .from('dive_participants')
        .insert(participantsData);

      if (participantsError) throw participantsError;

      toast.success(`¡Inmersión grupal creada exitosamente con ${selectedStudents.length} participantes!`);
      
      // Reset form
      setSelectedStudents([]);
      setGroupDiveData({
        dive_site_id: '',
        dive_date: '',
        dive_time: '',
        dive_type: 'training',
        depth_achieved: '',
        bottom_time: '',
        general_notes: ''
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving group dive:', error);
      toast.error("Error al crear la inmersión grupal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica de la inmersión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Datos de la Inmersión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dive_site">Sitio de Buceo *</Label>
              <Select
                value={groupDiveData.dive_site_id}
                onValueChange={(value) => setGroupDiveData(prev => ({ ...prev, dive_site_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sitio" />
                </SelectTrigger>
                <SelectContent>
                  {diveSites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} - {site.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dive_type">Tipo de Inmersión *</Label>
              <Select
                value={groupDiveData.dive_type}
                onValueChange={(value) => setGroupDiveData(prev => ({ ...prev, dive_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Entrenamiento</SelectItem>
                  <SelectItem value="certification">Certificación</SelectItem>
                  <SelectItem value="fun">Recreativo</SelectItem>
                  <SelectItem value="specialty">Especialidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dive_date">Fecha *</Label>
              <Input
                type="date"
                value={groupDiveData.dive_date}
                onChange={(e) => setGroupDiveData(prev => ({ ...prev, dive_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="dive_time">Hora</Label>
              <Input
                type="time"
                value={groupDiveData.dive_time}
                onChange={(e) => setGroupDiveData(prev => ({ ...prev, dive_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="depth_achieved">Profundidad Máxima (m) *</Label>
              <Input
                type="number"
                value={groupDiveData.depth_achieved}
                onChange={(e) => setGroupDiveData(prev => ({ ...prev, depth_achieved: e.target.value }))}
                placeholder="Ej: 18"
                required
              />
            </div>

            <div>
              <Label htmlFor="bottom_time">Tiempo de Fondo (min) *</Label>
              <Input
                type="number"
                value={groupDiveData.bottom_time}
                onChange={(e) => setGroupDiveData(prev => ({ ...prev, bottom_time: e.target.value }))}
                placeholder="Ej: 45"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="general_notes">Notas Generales de la Inmersión</Label>
            <Textarea
              value={groupDiveData.general_notes}
              onChange={(e) => setGroupDiveData(prev => ({ ...prev, general_notes: e.target.value }))}
              placeholder="Condiciones del mar, observaciones generales, etc..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selección de estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleccionar Participantes ({selectedStudents.length} seleccionados)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estudiante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: "recent" | "alphabetical") => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="alphabetical">Orden alfabético</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {instructorStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tienes estudiantes asignados
            </p>
          ) : filteredAndSortedStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No se encontraron estudiantes con esos criterios
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredAndSortedStudents.map((student) => (
                <Card key={student.student_id} className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={student.student_id}
                        checked={selectedStudents.includes(student.student_id)}
                        onCheckedChange={(checked) => 
                          handleStudentSelection(student.student_id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={student.student_id}
                          className="text-sm font-medium cursor-pointer block leading-tight"
                        >
                          {student.profile?.first_name && student.profile?.last_name
                            ? `${student.profile.first_name} ${student.profile.last_name}`
                            : student.student_name || 'Estudiante sin nombre'}
                        </label>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {student.student_email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(student.invited_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {filteredAndSortedStudents.length >= 6 && instructorStudents.length > 6 && (
            <p className="text-xs text-muted-foreground text-center">
              Mostrando los primeros 6 estudiantes. Usa los filtros para refinar la búsqueda.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSaveGroupDive} 
            disabled={saving || selectedStudents.length === 0}
            size="lg"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Creando inmersión..." : `Crear Inmersión Grupal (${selectedStudents.length} participantes)`}
          </Button>
          
          {selectedStudents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Selecciona al menos un estudiante para continuar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};