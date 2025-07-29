import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Users, MapPin, Calendar, Clock, Trash2, Save, Image, Video } from "lucide-react";
import { useInstructorStudents } from "@/hooks/useInstructorStudents";

interface DiveStudent {
  student_id: string;
  student_name: string;
  depth_achieved: number;
  bottom_time: number;
  notes?: string;
  photos?: string[];
  videos?: string[];
}

interface GroupDiveData {
  dive_site_id: string;
  dive_date: string;
  dive_time: string;
  dive_type: string;
  general_notes: string;
  students: DiveStudent[];
}

interface GroupDiveCreatorProps {
  diveSites: any[];
  onSuccess: () => void;
}

export const GroupDiveCreator = ({ diveSites, onSuccess }: GroupDiveCreatorProps) => {
  const { user } = useAuth();
  const { data: instructorStudents = [] } = useInstructorStudents();
  
  const [groupDive, setGroupDive] = useState<GroupDiveData>({
    dive_site_id: '',
    dive_date: '',
    dive_time: '',
    dive_type: 'training',
    general_notes: '',
    students: []
  });

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const availableStudents = instructorStudents.filter(s => s.student_id);

  const handleStudentToggle = (student: any, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    
    if (checked) {
      newSelected.add(student.student_id);
      setGroupDive(prev => ({
        ...prev,
        students: [...prev.students, {
          student_id: student.student_id,
          student_name: student.profile?.first_name && student.profile?.last_name 
            ? `${student.profile.first_name} ${student.profile.last_name}`
            : student.student_email,
          depth_achieved: 10,
          bottom_time: 30,
          notes: '',
          photos: [],
          videos: []
        }]
      }));
    } else {
      newSelected.delete(student.student_id);
      setGroupDive(prev => ({
        ...prev,
        students: prev.students.filter(s => s.student_id !== student.student_id)
      }));
    }
    
    setSelectedStudents(newSelected);
  };

  const updateStudentData = (studentId: string, field: keyof DiveStudent, value: any) => {
    setGroupDive(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.student_id === studentId ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleSaveGroupDive = async () => {
    if (!user || !groupDive.dive_site_id || !groupDive.dive_date || groupDive.students.length === 0) {
      toast.error("Por favor completa todos los campos obligatorios y selecciona al menos un estudiante");
      return;
    }

    setSaving(true);
    try {
      // Crear inmersiones individuales para cada estudiante
      const divePromises = groupDive.students.map(student => {
        const diveData = {
          instructor_id: user.id,
          student_id: student.student_id,
          dive_site_id: groupDive.dive_site_id,
          dive_date: groupDive.dive_date,
          dive_time: groupDive.dive_time || null,
          dive_type: groupDive.dive_type as "training" | "fun" | "certification" | "specialty",
          depth_achieved: student.depth_achieved,
          bottom_time: student.bottom_time,
          notes: [groupDive.general_notes, student.notes].filter(Boolean).join('\n---\n'),
          photos: student.photos || [],
          videos: student.videos || []
        };

        return supabase.from('dives').insert(diveData);
      });

      const results = await Promise.all(divePromises);
      
      // Verificar si hubo errores
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Error al guardar ${errors.length} inmersión(es)`);
      }

      toast.success(`${groupDive.students.length} inmersiones creadas exitosamente`);
      
      // Resetear formulario
      setGroupDive({
        dive_site_id: '',
        dive_date: '',
        dive_time: '',
        dive_type: 'training',
        general_notes: '',
        students: []
      });
      setSelectedStudents(new Set());
      onSuccess();
      
    } catch (error) {
      console.error('Error saving group dive:', error);
      toast.error("Error al guardar inmersiones grupales");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información General de la Inmersión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Información General de la Inmersión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dive_site">Sitio de Buceo *</Label>
              <Select 
                value={groupDive.dive_site_id} 
                onValueChange={(value) => setGroupDive(prev => ({ ...prev, dive_site_id: value }))}
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
              <Label htmlFor="dive_type">Tipo de Inmersión</Label>
              <Select 
                value={groupDive.dive_type} 
                onValueChange={(value) => setGroupDive(prev => ({ ...prev, dive_type: value }))}
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
                id="dive_date"
                type="date"
                value={groupDive.dive_date}
                onChange={(e) => setGroupDive(prev => ({ ...prev, dive_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="dive_time">Hora</Label>
              <Input
                id="dive_time"
                type="time"
                value={groupDive.dive_time}
                onChange={(e) => setGroupDive(prev => ({ ...prev, dive_time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="general_notes">Notas Generales</Label>
            <Textarea
              id="general_notes"
              value={groupDive.general_notes}
              onChange={(e) => setGroupDive(prev => ({ ...prev, general_notes: e.target.value }))}
              placeholder="Condiciones generales, observaciones del grupo..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Selección de Estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleccionar Estudiantes ({selectedStudents.size})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableStudents.map((student) => (
              <div key={student.student_id} className="flex items-center space-x-2 border rounded p-3">
                <Checkbox
                  id={student.student_id}
                  checked={selectedStudents.has(student.student_id)}
                  onCheckedChange={(checked) => handleStudentToggle(student, checked as boolean)}
                />
                <Label htmlFor={student.student_id} className="text-sm cursor-pointer">
                  {student.profile?.first_name && student.profile?.last_name 
                    ? `${student.profile.first_name} ${student.profile.last_name}`
                    : student.student_email}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Datos Individuales por Estudiante */}
      {groupDive.students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Datos Individuales por Estudiante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupDive.students.map((student) => (
                <div key={student.student_id} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{student.student_name}</h4>
                    <Badge variant="outline">ID: {student.student_id.slice(-6)}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Profundidad (m)</Label>
                      <Input
                        type="number"
                        value={student.depth_achieved}
                        onChange={(e) => updateStudentData(student.student_id, 'depth_achieved', parseInt(e.target.value))}
                        min="1"
                        placeholder="10"
                      />
                    </div>
                    
                    <div>
                      <Label>Tiempo de fondo (min)</Label>
                      <Input
                        type="number"
                        value={student.bottom_time}
                        onChange={(e) => updateStudentData(student.student_id, 'bottom_time', parseInt(e.target.value))}
                        min="1"
                        placeholder="30"
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <Label>Notas individuales</Label>
                      <Textarea
                        value={student.notes || ''}
                        onChange={(e) => updateStudentData(student.student_id, 'notes', e.target.value)}
                        placeholder="Observaciones específicas..."
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  {/* Sección de multimedia */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Fotos (URLs separadas por comas)
                      </Label>
                      <Textarea
                        value={student.photos?.join(', ') || ''}
                        onChange={(e) => updateStudentData(student.student_id, 'photos', e.target.value.split(',').map(url => url.trim()).filter(Boolean))}
                        placeholder="https://ejemplo.com/foto1.jpg, https://ejemplo.com/foto2.jpg"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Videos (URLs separadas por comas)
                      </Label>
                      <Textarea
                        value={student.videos?.join(', ') || ''}
                        onChange={(e) => updateStudentData(student.student_id, 'videos', e.target.value.split(',').map(url => url.trim()).filter(Boolean))}
                        placeholder="https://ejemplo.com/video1.mp4, https://ejemplo.com/video2.mp4"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de Guardado */}
      {groupDive.students.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveGroupDive}
            disabled={saving}
            className="bg-gradient-ocean"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : `Crear ${groupDive.students.length} Inmersión${groupDive.students.length > 1 ? 'es' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
};