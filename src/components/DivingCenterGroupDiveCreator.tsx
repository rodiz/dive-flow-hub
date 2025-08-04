import { useState } from "react";
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
import { Users, MapPin, Calendar, Clock, Save, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GroupDiveData {
  dive_site_id: string;
  dive_date: string;
  dive_time: string;
  dive_type: string;
  depth_achieved: string;
  bottom_time: string;
  general_notes: string;
  instructor_id: string;
}

interface DivingCenterGroupDiveCreatorProps {
  diveSites: any[];
  onSuccess: () => void;
}

export const DivingCenterGroupDiveCreator = ({ diveSites, onSuccess }: DivingCenterGroupDiveCreatorProps) => {
  const { user } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [groupDiveData, setGroupDiveData] = useState<GroupDiveData>({
    dive_site_id: '',
    dive_date: '',
    dive_time: '',
    dive_type: 'training',
    depth_achieved: '',
    bottom_time: '',
    general_notes: '',
    instructor_id: ''
  });

  // Fetch instructors assigned to this diving center
  const { data: centerInstructors = [] } = useQuery({
    queryKey: ["center-instructors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_assignments")
        .select(`
          *,
          profiles!instructor_id(
            user_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("diving_center_id", user?.id)
        .eq("assignment_status", "active");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch all students from assigned instructors
  const { data: centerStudents = [] } = useQuery({
    queryKey: ["center-students", user?.id],
    queryFn: async () => {
      if (centerInstructors.length === 0) return [];
      
      const instructorIds = centerInstructors.map(inst => inst.instructor_id);
      
      const { data, error } = await supabase
        .from("instructor_students")
        .select("*")
        .in("instructor_id", instructorIds)
        .eq("status", "active");
      
      if (error) throw error;
      
      // Get student profiles separately
      const studentIds = data?.map(s => s.student_id).filter(Boolean) || [];
      if (studentIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", studentIds);
      
      if (profilesError) throw profilesError;
      
      // Combine data
      return data?.map(student => ({
        ...student,
        profiles: profiles?.find(p => p.user_id === student.student_id) || null
      })) || [];
    },
    enabled: centerInstructors.length > 0,
  });

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

    if (!groupDiveData.dive_site_id || !groupDiveData.dive_date || !groupDiveData.depth_achieved || !groupDiveData.bottom_time || !groupDiveData.instructor_id) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    
    try {
      // 1. Crear UNA inmersión grupal
      const { data: dive, error: diveError } = await supabase
        .from('dives')
        .insert({
          instructor_id: groupDiveData.instructor_id,
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
        instructor_id: groupDiveData.instructor_id,
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
        general_notes: '',
        instructor_id: ''
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
              <Label htmlFor="instructor_id">Instructor Asignado *</Label>
              <Select
                value={groupDiveData.instructor_id}
                onValueChange={(value) => setGroupDiveData(prev => ({ ...prev, instructor_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar instructor" />
                </SelectTrigger>
                <SelectContent>
                  {centerInstructors.map((instructor) => (
                    <SelectItem key={instructor.instructor_id} value={instructor.instructor_id}>
                      {instructor.profiles?.first_name} {instructor.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="dive_date">Fecha *</Label>
              <Input
                type="date"
                value={groupDiveData.dive_date}
                onChange={(e) => setGroupDiveData(prev => ({ ...prev, dive_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dive_time">Hora</Label>
              <Input
                type="time"
                value={groupDiveData.dive_time}
                onChange={(e) => setGroupDiveData(prev => ({ ...prev, dive_time: e.target.value }))}
              />
            </div>

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
        <CardContent>
          {centerStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay estudiantes disponibles en los instructores asignados
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {centerStudents.map((student) => (
                <div key={student.student_id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={student.student_id}
                    checked={selectedStudents.includes(student.student_id)}
                    onCheckedChange={(checked) => 
                      handleStudentSelection(student.student_id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={student.student_id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {student.profiles?.first_name && student.profiles?.last_name
                        ? `${student.profiles.first_name} ${student.profiles.last_name}`
                        : student.student_name || 'Estudiante sin nombre'}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {student.student_email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSaveGroupDive} 
            disabled={saving || selectedStudents.length === 0 || !groupDiveData.instructor_id}
            size="lg"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Creando inmersión..." : `Crear Inmersión Grupal (${selectedStudents.length} participantes)`}
          </Button>
          
          {(selectedStudents.length === 0 || !groupDiveData.instructor_id) && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {!groupDiveData.instructor_id ? "Selecciona un instructor y al menos un estudiante" : "Selecciona al menos un estudiante para continuar"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};