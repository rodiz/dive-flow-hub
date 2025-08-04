import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, User, Star } from "lucide-react";

interface DiveParticipant {
  id: string;
  student_id: string;
  depth_achieved?: number;
  bottom_time?: number;
  equipment_check: boolean;
  medical_check: boolean;
  individual_notes?: string;
  performance_rating?: number;
  skills_completed: any;
  oxygen_amount?: number;
  ballast_weight?: number;
  images?: string[];
  videos?: string[];
  tank_pressure_start?: number;
  tank_pressure_end?: number;
  wetsuit_thickness?: number;
  gas_mix?: string;
  visibility_conditions?: number;
  water_temperature?: number;
  current_strength?: number;
  safety_stop_time?: number;
  student_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface DiveParticipantDetailsProps {
  participant: DiveParticipant;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function DiveParticipantDetails({ 
  participant, 
  isOpen, 
  onClose, 
  onUpdate 
}: DiveParticipantDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localParticipant, setLocalParticipant] = useState(participant);
  const [formData, setFormData] = useState({
    depth_achieved: participant.depth_achieved?.toString() || '',
    bottom_time: participant.bottom_time?.toString() || '',
    equipment_check: participant.equipment_check,
    medical_check: participant.medical_check,
    individual_notes: participant.individual_notes || '',
    performance_rating: participant.performance_rating?.toString() || '5',
    oxygen_amount: participant.oxygen_amount?.toString() || '',
    ballast_weight: participant.ballast_weight?.toString() || '',
    images: participant.images?.join(', ') || '',
    videos: participant.videos?.join(', ') || '',
    tank_pressure_start: participant.tank_pressure_start?.toString() || '',
    tank_pressure_end: participant.tank_pressure_end?.toString() || '',
    wetsuit_thickness: participant.wetsuit_thickness?.toString() || '',
    gas_mix: participant.gas_mix || 'Air',
    visibility_conditions: participant.visibility_conditions?.toString() || '',
    water_temperature: participant.water_temperature?.toString() || '',
    current_strength: participant.current_strength?.toString() || '',
    safety_stop_time: participant.safety_stop_time?.toString() || ''
  });

  // Actualizar datos locales cuando cambie el prop participant
  useEffect(() => {
    setLocalParticipant(participant);
  }, [participant]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('dive_participants')
        .update({
          depth_achieved: formData.depth_achieved ? parseInt(formData.depth_achieved) : null,
          bottom_time: formData.bottom_time ? parseInt(formData.bottom_time) : null,
          equipment_check: formData.equipment_check,
          medical_check: formData.medical_check,
          individual_notes: formData.individual_notes,
          performance_rating: parseInt(formData.performance_rating),
          oxygen_amount: formData.oxygen_amount ? parseInt(formData.oxygen_amount) : null,
          ballast_weight: formData.ballast_weight ? parseInt(formData.ballast_weight) : null,
          images: formData.images ? formData.images.split(',').map(url => url.trim()).filter(Boolean) : null,
          videos: formData.videos ? formData.videos.split(',').map(url => url.trim()).filter(Boolean) : null,
          tank_pressure_start: formData.tank_pressure_start ? parseInt(formData.tank_pressure_start) : null,
          tank_pressure_end: formData.tank_pressure_end ? parseInt(formData.tank_pressure_end) : null,
          wetsuit_thickness: formData.wetsuit_thickness ? parseInt(formData.wetsuit_thickness) : null,
          gas_mix: formData.gas_mix,
          visibility_conditions: formData.visibility_conditions ? parseInt(formData.visibility_conditions) : null,
          water_temperature: formData.water_temperature ? parseInt(formData.water_temperature) : null,
          current_strength: formData.current_strength ? parseInt(formData.current_strength) : null,
          safety_stop_time: formData.safety_stop_time ? parseInt(formData.safety_stop_time) : null
        })
        .eq('id', participant.id);

      if (error) throw error;

      // Actualizar el estado local con los nuevos datos
      const updatedParticipant = {
        ...localParticipant,
        depth_achieved: formData.depth_achieved ? parseInt(formData.depth_achieved) : null,
        bottom_time: formData.bottom_time ? parseInt(formData.bottom_time) : null,
        equipment_check: formData.equipment_check,
        medical_check: formData.medical_check,
        individual_notes: formData.individual_notes,
        performance_rating: parseInt(formData.performance_rating),
        oxygen_amount: formData.oxygen_amount ? parseInt(formData.oxygen_amount) : null,
        ballast_weight: formData.ballast_weight ? parseInt(formData.ballast_weight) : null,
        images: formData.images ? formData.images.split(',').map(url => url.trim()).filter(Boolean) : null,
        videos: formData.videos ? formData.videos.split(',').map(url => url.trim()).filter(Boolean) : null,
        tank_pressure_start: formData.tank_pressure_start ? parseInt(formData.tank_pressure_start) : null,
        tank_pressure_end: formData.tank_pressure_end ? parseInt(formData.tank_pressure_end) : null,
        wetsuit_thickness: formData.wetsuit_thickness ? parseInt(formData.wetsuit_thickness) : null,
        gas_mix: formData.gas_mix,
        visibility_conditions: formData.visibility_conditions ? parseInt(formData.visibility_conditions) : null,
        water_temperature: formData.water_temperature ? parseInt(formData.water_temperature) : null,
        current_strength: formData.current_strength ? parseInt(formData.current_strength) : null,
        safety_stop_time: formData.safety_stop_time ? parseInt(formData.safety_stop_time) : null
      };
      
      setLocalParticipant(updatedParticipant);
      toast.success("Detalles del participante actualizados");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error("Error al actualizar detalles");
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4) return "default";
    if (rating >= 3) return "secondary";
    return "destructive";
  };

  const getPerformanceText = (rating: number) => {
    if (rating === 5) return "Excelente";
    if (rating === 4) return "Muy Bien";
    if (rating === 3) return "Bien";
    if (rating === 2) return "Regular";
    return "Necesita Mejorar";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles del Participante: {participant.student_profile?.first_name} {participant.student_profile?.last_name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 pr-4">
          {!isEditing ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Profundidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {localParticipant.depth_achieved || '-'} m
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tiempo Fondo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {localParticipant.bottom_time || '-'} min
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Oxígeno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {localParticipant.oxygen_amount || '-'}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Lastre</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {localParticipant.ballast_weight || '-'} kg
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Presión Inicial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {localParticipant.tank_pressure_start || '-'} bar
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Presión Final</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {localParticipant.tank_pressure_end || '-'} bar
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Grosor Traje:</Label>
                  <div className="text-sm">{localParticipant.wetsuit_thickness || '-'} mm</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mezcla Gas:</Label>
                  <div className="text-sm">{localParticipant.gas_mix || 'Air'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Visibilidad:</Label>
                  <div className="text-sm">{localParticipant.visibility_conditions || '-'} m</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Parada Seguridad:</Label>
                  <div className="text-sm">{localParticipant.safety_stop_time || '-'} min</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Temperatura Agua:</Label>
                  <div className="text-sm">{localParticipant.water_temperature || '-'}°C</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fuerza Corriente:</Label>
                  <div className="text-sm">{localParticipant.current_strength || '-'}/10</div>
                </div>
              </div>

              {(localParticipant.images && localParticipant.images.length > 0) && (
                <div>
                  <Label className="text-sm font-medium">Imágenes:</Label>
                  <div className="text-sm text-muted-foreground">{localParticipant.images.length} imagen(es) adjuntada(s)</div>
                </div>
              )}

              {(localParticipant.videos && localParticipant.videos.length > 0) && (
                <div>
                  <Label className="text-sm font-medium">Videos:</Label>
                  <div className="text-sm text-muted-foreground">{localParticipant.videos.length} video(s) adjuntado(s)</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Label>Chequeo de Equipo:</Label>
                  <Badge variant={localParticipant.equipment_check ? "default" : "secondary"}>
                    {localParticipant.equipment_check ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Chequeo Médico:</Label>
                  <Badge variant={localParticipant.medical_check ? "default" : "secondary"}>
                    {localParticipant.medical_check ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
              </div>

              {localParticipant.performance_rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <Label>Evaluación:</Label>
                  <Badge variant={getPerformanceColor(localParticipant.performance_rating)}>
                    {getPerformanceText(localParticipant.performance_rating)} ({localParticipant.performance_rating}/5)
                  </Badge>
                </div>
              )}

              {localParticipant.individual_notes && (
                <div>
                  <Label className="text-sm font-medium">Notas Individuales:</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {localParticipant.individual_notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button onClick={onClose} variant="outline">
                  Cerrar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="depth_achieved">Profundidad Alcanzada (m)</Label>
                  <Input
                    type="number"
                    value={formData.depth_achieved}
                    onChange={(e) => setFormData({ ...formData, depth_achieved: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bottom_time">Tiempo de Fondo (min)</Label>
                  <Input
                    type="number"
                    value={formData.bottom_time}
                    onChange={(e) => setFormData({ ...formData, bottom_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="equipment_check"
                    checked={formData.equipment_check}
                    onChange={(e) => setFormData({ ...formData, equipment_check: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="equipment_check">Chequeo de Equipo Completado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="medical_check"
                    checked={formData.medical_check}
                    onChange={(e) => setFormData({ ...formData, medical_check: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="medical_check">Chequeo Médico Completado</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="oxygen_amount">Cantidad de Oxígeno (%)</Label>
                  <Input
                    type="number"
                    value={formData.oxygen_amount}
                    onChange={(e) => setFormData({ ...formData, oxygen_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ballast_weight">Lastre (kg)</Label>
                  <Input
                    type="number"
                    value={formData.ballast_weight}
                    onChange={(e) => setFormData({ ...formData, ballast_weight: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tank_pressure_start">Presión Inicial (bar)</Label>
                  <Input
                    type="number"
                    value={formData.tank_pressure_start}
                    onChange={(e) => setFormData({ ...formData, tank_pressure_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tank_pressure_end">Presión Final (bar)</Label>
                  <Input
                    type="number"
                    value={formData.tank_pressure_end}
                    onChange={(e) => setFormData({ ...formData, tank_pressure_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wetsuit_thickness">Grosor Traje (mm)</Label>
                  <Input
                    type="number"
                    value={formData.wetsuit_thickness}
                    onChange={(e) => setFormData({ ...formData, wetsuit_thickness: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gas_mix">Mezcla de Gas</Label>
                  <Input
                    value={formData.gas_mix}
                    onChange={(e) => setFormData({ ...formData, gas_mix: e.target.value })}
                    placeholder="Air, Nitrox, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="visibility_conditions">Visibilidad (m)</Label>
                  <Input
                    type="number"
                    value={formData.visibility_conditions}
                    onChange={(e) => setFormData({ ...formData, visibility_conditions: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="water_temperature">Temperatura Agua (°C)</Label>
                  <Input
                    type="number"
                    value={formData.water_temperature}
                    onChange={(e) => setFormData({ ...formData, water_temperature: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="current_strength">Fuerza Corriente (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.current_strength}
                    onChange={(e) => setFormData({ ...formData, current_strength: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="safety_stop_time">Parada Seguridad (min)</Label>
                  <Input
                    type="number"
                    value={formData.safety_stop_time}
                    onChange={(e) => setFormData({ ...formData, safety_stop_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="performance_rating">Evaluación (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.performance_rating}
                    onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="images">URLs de Imágenes (separadas por coma)</Label>
                <Textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="videos">URLs de Videos (separadas por coma)</Label>
                <Textarea
                  value={formData.videos}
                  onChange={(e) => setFormData({ ...formData, videos: e.target.value })}
                  placeholder="https://ejemplo.com/video1.mp4, https://ejemplo.com/video2.mp4"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="individual_notes">Notas Individuales</Label>
                <Textarea
                  value={formData.individual_notes}
                  onChange={(e) => setFormData({ ...formData, individual_notes: e.target.value })}
                  placeholder="Notas específicas sobre el desempeño de este estudiante..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Guardar Cambios
                </Button>
              </div>
            </>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}