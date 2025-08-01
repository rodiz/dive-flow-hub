import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [formData, setFormData] = useState({
    depth_achieved: participant.depth_achieved?.toString() || '',
    bottom_time: participant.bottom_time?.toString() || '',
    equipment_check: participant.equipment_check,
    medical_check: participant.medical_check,
    individual_notes: participant.individual_notes || '',
    performance_rating: participant.performance_rating?.toString() || '5'
  });

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
          performance_rating: parseInt(formData.performance_rating)
        })
        .eq('id', participant.id);

      if (error) throw error;

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles del Participante: {participant.student_profile?.first_name} {participant.student_profile?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Profundidad Alcanzada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {participant.depth_achieved || '-'} m
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tiempo de Fondo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {participant.bottom_time || '-'} min
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Label>Chequeo de Equipo:</Label>
                  <Badge variant={participant.equipment_check ? "default" : "secondary"}>
                    {participant.equipment_check ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Chequeo Médico:</Label>
                  <Badge variant={participant.medical_check ? "default" : "secondary"}>
                    {participant.medical_check ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
              </div>

              {participant.performance_rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <Label>Evaluación:</Label>
                  <Badge variant={getPerformanceColor(participant.performance_rating)}>
                    {getPerformanceText(participant.performance_rating)} ({participant.performance_rating}/5)
                  </Badge>
                </div>
              )}

              {participant.individual_notes && (
                <div>
                  <Label className="text-sm font-medium">Notas Individuales:</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {participant.individual_notes}
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

              <div>
                <Label htmlFor="performance_rating">Evaluación de Desempeño (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.performance_rating}
                  onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
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
      </DialogContent>
    </Dialog>
  );
}