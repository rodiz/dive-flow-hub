import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, MapPin, Calendar, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useInstructorStudents } from "@/hooks/useInstructorStudents";
import { GroupDiveCreator } from "@/components/GroupDiveCreator";

export default function Inmersiones() {
  const { user, userProfile } = useAuth();
  const [dives, setDives] = useState<any[]>([]);
  const [diveSites, setDiveSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the unified students hook
  const { data: instructorStudents = [] } = useInstructorStudents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDive, setEditingDive] = useState<any>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    dive_site_id: '',
    dive_date: '',
    dive_time: '',
    depth_achieved: '',
    bottom_time: '',
    dive_type: 'training',
    notes: ''
  });

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
          profiles!dives_student_id_fkey(first_name, last_name)
        `)
        .eq('instructor_id', user.id)
        .order('dive_date', { ascending: false });

      if (error) throw error;
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.student_id || !formData.dive_site_id || !formData.dive_date || !formData.depth_achieved || !formData.bottom_time) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const diveData = {
        ...formData,
        instructor_id: user.id,
        student_id: formData.student_id || null, // Ensure proper UUID format
        depth_achieved: parseInt(formData.depth_achieved),
        bottom_time: parseInt(formData.bottom_time),
        dive_type: formData.dive_type as "training" | "fun" | "certification" | "specialty"
      };

      if (editingDive) {
        const { error } = await supabase
          .from('dives')
          .update(diveData)
          .eq('id', editingDive.id);

        if (error) throw error;
        toast.success("Inmersión actualizada exitosamente");
      } else {
        const { error } = await supabase
          .from('dives')
          .insert(diveData);

        if (error) throw error;
        toast.success("Inmersión creada exitosamente");
      }

      setDialogOpen(false);
      setEditingDive(null);
      setFormData({
        student_id: '',
        dive_site_id: '',
        dive_date: '',
        dive_time: '',
        depth_achieved: '',
        bottom_time: '',
        dive_type: 'training',
        notes: ''
      });
      fetchDives();
    } catch (error) {
      console.error('Error saving dive:', error);
      toast.error("Error al guardar inmersión");
    }
  };

  const openEditDialog = (dive: any) => {
    setEditingDive(dive);
    setFormData({
      student_id: dive.student_id,
      dive_site_id: dive.dive_site_id,
      dive_date: dive.dive_date,
      dive_time: dive.dive_time || '',
      depth_achieved: dive.depth_achieved.toString(),
      bottom_time: dive.bottom_time.toString(),
      dive_type: dive.dive_type,
      notes: dive.notes || ''
    });
    setDialogOpen(true);
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
              Gestiona las inmersiones de tus estudiantes
            </p>
          </div>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Crear Inmersión</TabsTrigger>
            <TabsTrigger value="registered">Inmersiones Registradas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nueva Inmersión</CardTitle>
              </CardHeader>
              <CardContent>
                <GroupDiveCreator 
                  diveSites={diveSites}
                  onSuccess={fetchDives}
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
                                 dive.dive_type === 'certification' ? 'Certificación' : 'Recreativo'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(dive)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {dive.profiles?.first_name && dive.profiles?.last_name 
                                  ? `${dive.profiles.first_name} ${dive.profiles.last_name}`
                                  : 'Estudiante sin nombre'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(dive.dive_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {dive.bottom_time} min / {dive.depth_achieved}m
                              </span>
                            </div>
                          </div>
                          {dive.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {dive.notes}
                            </p>
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
      </div>
    </div>
  );
}