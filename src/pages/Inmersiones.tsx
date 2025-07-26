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
import { toast } from "sonner";
import { Plus, Edit, MapPin, Calendar, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Inmersiones() {
  const { user, userProfile } = useAuth();
  const [dives, setDives] = useState<any[]>([]);
  const [diveSites, setDiveSites] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchStudents();
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

  const fetchStudents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          profiles!course_enrollments_student_id_fkey(first_name, last_name, user_id)
        `)
        .eq('instructor_id', user.id);

      if (error) throw error;
      setStudents(data?.map(enrollment => enrollment.profiles) || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const diveData = {
        ...formData,
        instructor_id: user.id,
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
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-ocean">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Inmersión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDive ? 'Editar Inmersión' : 'Nueva Inmersión'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student_id">Estudiante</Label>
                    <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estudiante" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.user_id} value={student.user_id}>
                            {student.first_name} {student.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dive_site_id">Sitio de Buceo</Label>
                    <Select value={formData.dive_site_id} onValueChange={(value) => setFormData(prev => ({ ...prev, dive_site_id: value }))}>
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
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="dive_time">Hora</Label>
                    <Input
                      id="dive_time"
                      type="time"
                      value={formData.dive_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, dive_time: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="depth_achieved">Profundidad (m)</Label>
                    <Input
                      id="depth_achieved"
                      type="number"
                      value={formData.depth_achieved}
                      onChange={(e) => setFormData(prev => ({ ...prev, depth_achieved: e.target.value }))}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bottom_time">Tiempo de fondo (min)</Label>
                    <Input
                      id="bottom_time"
                      type="number"
                      value={formData.bottom_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, bottom_time: e.target.value }))}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dive_type">Tipo</Label>
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
                
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observaciones sobre la inmersión..."
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  {editingDive ? 'Actualizar' : 'Crear'} Inmersión
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {dives.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay inmersiones registradas</p>
              </CardContent>
            </Card>
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
                        {dive.profiles?.first_name} {dive.profiles?.last_name}
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
      </div>
    </div>
  );
}