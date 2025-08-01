import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Calendar, Clock, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { GroupDiveCreator } from "@/components/GroupDiveCreator";
import { DiveParticipantDetails } from "@/components/DiveParticipantDetails";

export default function Inmersiones() {
  const { user, userProfile } = useAuth();
  const [dives, setDives] = useState<any[]>([]);
  const [diveSites, setDiveSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDive, setSelectedDive] = useState<any>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  useEffect(() => {
    fetchDives();
    fetchDiveSites();
  }, [user]);

  const fetchDives = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('dives')
        .select(`
          *,
          dive_sites(name, location),
          dive_participants(
            id,
            student_id,
            depth_achieved,
            bottom_time,
            equipment_check,
            medical_check,
            individual_notes,
            performance_rating,
            profiles!dive_participants_student_id_fkey(first_name, last_name)
          )
        `)
        .eq('instructor_id', user.id)
        .order('dive_date', { ascending: false });

      if (error) throw error;
      console.log('Dives data:', data);
      setDives(data || []);
    } catch (error) {
      console.error('Error fetching dives:', error);
      toast.error("Error al cargar inmersiones");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiveSites = async () => {
    try {
      const { data, error } = await supabase
        .from('dive_sites')
        .select('*')
        .order('name');

      if (error) throw error;
      setDiveSites(data || []);
    } catch (error) {
      console.error('Error fetching dive sites:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Inmersiones</h1>
            <p className="text-xl text-muted-foreground">
              Gestiona las inmersiones grupales de tus estudiantes
            </p>
          </div>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Crear Inmersión Grupal</TabsTrigger>
            <TabsTrigger value="registered">Inmersiones Registradas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nueva Inmersión Grupal</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Crea una inmersión y selecciona múltiples estudiantes para participar
                </p>
              </CardHeader>
              <CardContent>
                <GroupDiveCreator 
                  diveSites={diveSites}
                  onSuccess={() => {
                    fetchDives();
                    toast.success("Inmersión grupal creada exitosamente");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="registered" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inmersiones Registradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dives.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No hay inmersiones registradas</p>
                  ) : (
                    dives.map((dive) => (
                      <Card key={dive.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {dive.dive_sites?.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {dive.dive_sites?.location}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={dive.dive_type === 'certification' ? 'default' : 'secondary'}>
                                {dive.dive_type === 'training' ? 'Entrenamiento' : 
                                 dive.dive_type === 'certification' ? 'Certificación' : 
                                 dive.dive_type === 'fun' ? 'Recreativo' : 'Especialidad'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">
                                  {dive.actual_participants || dive.dive_participants?.length || 0} Participantes
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {dive.dive_participants?.slice(0, 2).map((p: any) => 
                                    p.profiles?.first_name && p.profiles?.last_name 
                                      ? `${p.profiles.first_name} ${p.profiles.last_name}`
                                      : 'Sin nombre'
                                  ).join(', ')}
                                  {dive.dive_participants && dive.dive_participants.length > 2 && 
                                    ` y ${dive.dive_participants.length - 2} más`
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">Fecha</span>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(dive.dive_date).toLocaleDateString()}
                                  {dive.dive_time && ` • ${dive.dive_time}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">Detalles</span>
                                <div className="text-xs text-muted-foreground">
                                  {dive.depth_achieved}m • {dive.bottom_time} min
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Participants List */}
                          {dive.dive_participants && dive.dive_participants.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Participantes:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {dive.dive_participants.map((participant: any) => (
                                  <div key={participant.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                    <span className="text-sm">
                                      {participant.profiles?.first_name && participant.profiles?.last_name 
                                        ? `${participant.profiles.first_name} ${participant.profiles.last_name}`
                                        : 'Participante sin nombre'}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedParticipant(participant)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Ver
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {dive.notes && (
                            <div className="mt-4 p-3 bg-muted rounded-md">
                              <p className="text-sm">
                                <strong>Notas de la inmersión:</strong> {dive.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Participant Details Dialog */}
        {selectedParticipant && (
          <DiveParticipantDetails
            participant={selectedParticipant}
            isOpen={!!selectedParticipant}
            onClose={() => setSelectedParticipant(null)}
            onUpdate={fetchDives}
          />
        )}
      </div>
    </div>
  );
}