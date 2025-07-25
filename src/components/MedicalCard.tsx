import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecord {
  id: string;
  student_id: string;
  instructor_id: string;
  recorded_at: string;
  height?: number;
  weight?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  fitness_level?: number;
  medical_conditions?: string;
  medications?: string;
  allergies?: string;
  cleared_to_dive?: boolean;
  notes?: string;
  dive_id?: string;
}

interface MedicalCardProps {
  studentId?: string;
  viewMode?: 'instructor' | 'student';
}

export default function MedicalCard({ studentId, viewMode = 'student' }: MedicalCardProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    fitness_level: '5',
    medical_conditions: '',
    medications: '',
    allergies: '',
    cleared_to_dive: true,
    notes: '',
  });

  useEffect(() => {
    fetchMedicalRecords();
  }, [studentId]);

  const fetchMedicalRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('medical_records')
        .select('*');

      if (viewMode === 'student') {
        query = query.eq('student_id', user.id);
      } else if (studentId) {
        query = query.eq('student_id', studentId);
      } else {
        query = query.eq('instructor_id', user.id);
      }

      const { data, error } = await query.order('recorded_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros médicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const recordData = {
        instructor_id: user.id,
        student_id: studentId || user.id,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        fitness_level: parseInt(formData.fitness_level),
        medical_conditions: formData.medical_conditions || null,
        medications: formData.medications || null,
        allergies: formData.allergies || null,
        cleared_to_dive: formData.cleared_to_dive,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('medical_records')
        .insert([recordData]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Registro médico creado correctamente",
      });

      setFormData({
        height: '',
        weight: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        fitness_level: '5',
        medical_conditions: '',
        medications: '',
        allergies: '',
        cleared_to_dive: true,
        notes: '',
      });
      setIsDialogOpen(false);
      fetchMedicalRecords();
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast({
        title: "Error",
        description: "Error al crear el registro médico",
        variant: "destructive",
      });
    }
  };

  const getFitnessLevel = (level: number) => {
    const levels = {
      1: { text: 'Muy Bajo', color: 'bg-red-100 text-red-800' },
      2: { text: 'Bajo', color: 'bg-orange-100 text-orange-800' },
      3: { text: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
      4: { text: 'Bueno', color: 'bg-blue-100 text-blue-800' },
      5: { text: 'Excelente', color: 'bg-green-100 text-green-800' },
    };
    return levels[level as keyof typeof levels] || levels[5];
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  const latestRecord = records[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Registros Médicos</h2>
          <p className="text-muted-foreground">
            Información médica y de condición física para buceo
          </p>
        </div>
        
        {viewMode === 'instructor' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Nuevo Registro Médico</DialogTitle>
                <DialogDescription>
                  Registra la información médica y física del estudiante
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        height: e.target.value 
                      }))}
                      placeholder="170"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        weight: e.target.value 
                      }))}
                      placeholder="70.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="heart_rate">Pulso (bpm)</Label>
                    <Input
                      id="heart_rate"
                      type="number"
                      value={formData.heart_rate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        heart_rate: e.target.value 
                      }))}
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systolic">Presión Sistólica</Label>
                    <Input
                      id="systolic"
                      type="number"
                      value={formData.blood_pressure_systolic}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        blood_pressure_systolic: e.target.value 
                      }))}
                      placeholder="120"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="diastolic">Presión Diastólica</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      value={formData.blood_pressure_diastolic}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        blood_pressure_diastolic: e.target.value 
                      }))}
                      placeholder="80"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fitness">Nivel de Condición Física (1-5)</Label>
                  <Input
                    id="fitness"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.fitness_level}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      fitness_level: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="conditions">Condiciones Médicas</Label>
                  <Textarea
                    id="conditions"
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      medical_conditions: e.target.value 
                    }))}
                    placeholder="Describe cualquier condición médica relevante..."
                  />
                </div>

                <div>
                  <Label htmlFor="medications">Medicamentos</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      medications: e.target.value 
                    }))}
                    placeholder="Lista los medicamentos actuales..."
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      allergies: e.target.value 
                    }))}
                    placeholder="Describe alergias conocidas..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="cleared"
                    checked={formData.cleared_to_dive}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      cleared_to_dive: checked 
                    }))}
                  />
                  <Label htmlFor="cleared">Autorizado para bucear</Label>
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Registro</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {latestRecord && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Último Examen Médico
                </CardTitle>
                <CardDescription>
                  {new Date(latestRecord.recorded_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {latestRecord.cleared_to_dive ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Autorizado
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    No Autorizado
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestRecord.height && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestRecord.height}</div>
                  <div className="text-sm text-muted-foreground">cm</div>
                </div>
              )}
              
              {latestRecord.weight && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestRecord.weight}</div>
                  <div className="text-sm text-muted-foreground">kg</div>
                </div>
              )}
              
              {latestRecord.heart_rate && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestRecord.heart_rate}</div>
                  <div className="text-sm text-muted-foreground">bpm</div>
                </div>
              )}
              
              {latestRecord.fitness_level && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Badge className={getFitnessLevel(latestRecord.fitness_level).color}>
                    {getFitnessLevel(latestRecord.fitness_level).text}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Condición</div>
                </div>
              )}
            </div>

            {(latestRecord.blood_pressure_systolic || latestRecord.blood_pressure_diastolic) && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Presión Arterial</div>
                <div className="text-lg">
                  {latestRecord.blood_pressure_systolic || '---'} / {latestRecord.blood_pressure_diastolic || '---'} mmHg
                </div>
              </div>
            )}

            {latestRecord.medical_conditions && (
              <div>
                <div className="text-sm font-medium mb-1">Condiciones Médicas</div>
                <p className="text-sm text-muted-foreground">{latestRecord.medical_conditions}</p>
              </div>
            )}

            {latestRecord.medications && (
              <div>
                <div className="text-sm font-medium mb-1">Medicamentos</div>
                <p className="text-sm text-muted-foreground">{latestRecord.medications}</p>
              </div>
            )}

            {latestRecord.allergies && (
              <div>
                <div className="text-sm font-medium mb-1">Alergias</div>
                <p className="text-sm text-muted-foreground">{latestRecord.allergies}</p>
              </div>
            )}

            {latestRecord.notes && (
              <div>
                <div className="text-sm font-medium mb-1">Notas</div>
                <p className="text-sm text-muted-foreground">{latestRecord.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {records.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial Médico</CardTitle>
            <CardDescription>Registros médicos anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.slice(1).map((record) => (
                <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.height && `${record.height}cm`}
                      {record.weight && ` • ${record.weight}kg`}
                      {record.heart_rate && ` • ${record.heart_rate}bpm`}
                    </div>
                  </div>
                  <Badge className={record.cleared_to_dive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {record.cleared_to_dive ? 'Autorizado' : 'No Autorizado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {records.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay registros médicos</h3>
            <p className="text-muted-foreground">
              {viewMode === 'instructor' 
                ? 'Crea el primer registro médico para el estudiante'
                : 'No tienes registros médicos registrados'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}