import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Users, User } from "lucide-react";

interface DivingCenterGroupDiveCreatorProps {
  diveSites: any[];
  onSuccess: () => void;
}

export const DivingCenterGroupDiveCreator = ({ diveSites, onSuccess }: DivingCenterGroupDiveCreatorProps) => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    dive_site_id: '',
    dive_date: '',
    dive_time: '',
    depth_achieved: '',
    bottom_time: '',
    dive_type: 'training',
    certification_level: '',
    notes: '',
    max_participants: '12'
  });

  useEffect(() => {
    fetchInstructors();
    fetchStudents();
  }, [user]);

  const fetchInstructors = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('instructor_assignments')
        .select(`
          instructor_id,
          profiles!instructor_id(
            user_id,
            first_name,
            last_name,
            email,
            certification_level
          )
        `)
        .eq('diving_center_id', user.id)
        .eq('assignment_status', 'active');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error("Error al cargar instructores");
    }
  };

  const fetchStudents = async () => {
    if (!user) return;
    
    try {
      // Obtener todos los estudiantes de todos los instructores del centro
      const { data: instructorAssignments, error: instructorsError } = await supabase
        .from('instructor_assignments')
        .select('instructor_id')
        .eq('diving_center_id', user.id)
        .eq('assignment_status', 'active');

      if (instructorsError) throw instructorsError;

      const instructorIds = instructorAssignments.map(ia => ia.instructor_id);
      
      if (instructorIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: studentRelations, error: studentsError } = await supabase
        .from('instructor_students')
        .select(`
          student_id,
          instructor_id,
          profiles!student_id(
            user_id,
            first_name,
            last_name,
            email,
            certification_level
          )
        `)
        .in('instructor_id', instructorIds)
        .eq('status', 'active')
        .not('student_id', 'is', null);

      if (studentsError) throw studentsError;
      setStudents(studentRelations || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error("Error al cargar estudiantes");
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedInstructor || selectedStudents.length === 0) {
      toast.error("Por favor selecciona un instructor y al menos un estudiante");
      return;
    }

    try {
      // Crear la inmersión
      const diveInsert: any = {
        instructor_id: selectedInstructor,
        dive_site_id: formData.dive_site_id,
        dive_date: formData.dive_date,
        dive_time: formData.dive_time || null,
        depth_achieved: parseInt(formData.depth_achieved),
        bottom_time: parseInt(formData.bottom_time),
        dive_type: formData.dive_type,
        notes: formData.notes,
        max_participants: parseInt(formData.max_participants),
        actual_participants: selectedStudents.length
      };

      // Only add certification_level if it's not empty
      if (formData.certification_level && formData.certification_level.trim()) {
        diveInsert.certification_level = formData.certification_level;
      }

      const { data: diveData, error: diveError } = await supabase
        .from('dives')
        .insert(diveInsert)
        .select()
        .single();

      if (diveError) throw diveError;

      // Crear participantes
      const participants = selectedStudents.map(studentId => ({
        dive_id: diveData.id,
        student_id: studentId,
        instructor_id: selectedInstructor
      }));

      const { error: participantsError } = await supabase
        .from('dive_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Reset form
      setFormData({
        dive_site_id: '',
        dive_date: '',
        dive_time: '',
        depth_achieved: '',
        bottom_time: '',
        dive_type: 'training',
        certification_level: '',
        notes: '',
        max_participants: '12'
      });
      setSelectedInstructor("");
      setSelectedStudents([]);
      
      onSuccess();
    } catch (error) {
      console.error('Error creating dive:', error);
      toast.error("Error al crear inmersión");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instructor Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Instructor Asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedInstructor} onValueChange={setSelectedInstructor} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.instructor_id} value={instructor.instructor_id}>
                    {instructor.profiles?.first_name && instructor.profiles?.last_name 
                      ? `${instructor.profiles.first_name} ${instructor.profiles.last_name}`
                      : instructor.profiles?.email}
                    {instructor.profiles?.certification_level && 
                      ` - ${instructor.profiles.certification_level}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Dive Site */}
        <div>
          <Label htmlFor="dive_site_id">Sitio de Inmersión</Label>
          <Select value={formData.dive_site_id} onValueChange={(value) => setFormData(prev => ({ ...prev, dive_site_id: value }))} required>
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

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estudiantes Participantes ({selectedStudents.length} seleccionados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                No hay estudiantes disponibles
              </p>
            ) : (
              students.map((studentRel) => (
                <div key={studentRel.student_id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={studentRel.student_id}
                    checked={selectedStudents.includes(studentRel.student_id)}
                    onCheckedChange={() => handleStudentToggle(studentRel.student_id)}
                  />
                  <label htmlFor={studentRel.student_id} className="text-sm font-medium cursor-pointer flex-1">
                    {studentRel.profiles?.first_name && studentRel.profiles?.last_name 
                      ? `${studentRel.profiles.first_name} ${studentRel.profiles.last_name}`
                      : studentRel.profiles?.email}
                    {studentRel.profiles?.certification_level && 
                      <span className="text-xs text-muted-foreground block">
                        {studentRel.profiles.certification_level}
                      </span>}
                  </label>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dive Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="dive_date">Fecha</Label>
          <Input
            id="dive_date"
            type="date"
            value={formData.dive_date}
            onChange={(e) => setFormData(prev => ({ ...prev, dive_date: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="dive_time">Hora (opcional)</Label>
          <Input
            id="dive_time"
            type="time"
            value={formData.dive_time}
            onChange={(e) => setFormData(prev => ({ ...prev, dive_time: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="dive_type">Tipo de Inmersión</Label>
          <Select value={formData.dive_type} onValueChange={(value) => setFormData(prev => ({ ...prev, dive_type: value }))}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="depth_achieved">Profundidad Máxima (m)</Label>
          <Input
            id="depth_achieved"
            type="number"
            min="1"
            max="100"
            value={formData.depth_achieved}
            onChange={(e) => setFormData(prev => ({ ...prev, depth_achieved: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="bottom_time">Tiempo de Fondo (min)</Label>
          <Input
            id="bottom_time"
            type="number"
            min="1"
            max="200"
            value={formData.bottom_time}
            onChange={(e) => setFormData(prev => ({ ...prev, bottom_time: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="max_participants">Máximo Participantes</Label>
          <Input
            id="max_participants"
            type="number"
            min="1"
            max="20"
            value={formData.max_participants}
            onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="certification_level">Nivel de Certificación (opcional)</Label>
        <Input
          id="certification_level"
          placeholder="Ej: Open Water, Advanced Open Water..."
          value={formData.certification_level}
          onChange={(e) => setFormData(prev => ({ ...prev, certification_level: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas de la Inmersión</Label>
        <Textarea
          id="notes"
          placeholder="Descripción, objetivos, observaciones..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-ocean"
        disabled={!selectedInstructor || selectedStudents.length === 0}
      >
        <Save className="h-4 w-4 mr-2" />
        Crear Inmersión Grupal
      </Button>
    </form>
  );
};