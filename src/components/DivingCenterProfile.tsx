import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Building2, MapPin, Globe, Clock, Award, Users, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface DivingCenterProfileProps {
  userProfile: any;
}

export const DivingCenterProfile = ({ userProfile }: DivingCenterProfileProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    business_name: userProfile.business_name || '',
    business_license: userProfile.business_license || '',
    address: userProfile.address || '',
    city: userProfile.city || '',
    country: userProfile.country || 'Colombia',
    website: userProfile.website || '',
    description: userProfile.description || '',
    max_students_per_instructor: userProfile.max_students_per_instructor || 8,
  });

  const [newSpecialty, setNewSpecialty] = useState({
    specialty_name: '',
    certification_agency: '',
  });

  // Obtener especialidades del centro
  const { data: specialties = [] } = useQuery({
    queryKey: ["diving-center-specialties", userProfile.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diving_center_specialties")
        .select("*")
        .eq("diving_center_id", userProfile.user_id)
        .eq("active", true);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener horarios del centro
  const { data: schedules = [] } = useQuery({
    queryKey: ["diving-center-schedules", userProfile.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diving_center_schedules")
        .select("*")
        .eq("diving_center_id", userProfile.user_id)
        .order("day_of_week");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("user_id", userProfile.user_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Los datos del centro de buceo han sido actualizados.",
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    },
  });

  // Mutation para agregar especialidad
  const addSpecialtyMutation = useMutation({
    mutationFn: async (specialty: any) => {
      const { error } = await supabase
        .from("diving_center_specialties")
        .insert([{
          diving_center_id: userProfile.user_id,
          ...specialty,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Especialidad agregada",
        description: "La especialidad ha sido agregada exitosamente.",
      });
      setNewSpecialty({ specialty_name: '', certification_agency: '' });
      queryClient.invalidateQueries({ queryKey: ["diving-center-specialties"] });
    },
  });

  // Mutation para eliminar especialidad
  const removeSpecialtyMutation = useMutation({
    mutationFn: async (specialtyId: string) => {
      const { error } = await supabase
        .from("diving_center_specialties")
        .update({ active: false })
        .eq("id", specialtyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Especialidad eliminada",
        description: "La especialidad ha sido eliminada.",
      });
      queryClient.invalidateQueries({ queryKey: ["diving-center-specialties"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.specialty_name && newSpecialty.certification_agency) {
      addSpecialtyMutation.mutate(newSpecialty);
    }
  };

  const dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  return (
    <Tabs defaultValue="info" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="info">Información</TabsTrigger>
        <TabsTrigger value="specialties">Especialidades</TabsTrigger>
        <TabsTrigger value="schedule">Horarios</TabsTrigger>
        <TabsTrigger value="instructors">Instructores</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del Centro de Buceo
            </CardTitle>
            <CardDescription>
              Configura la información básica de tu centro de buceo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre del Negocio *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Centro de Buceo Aqua..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_license">Licencia de Negocio</Label>
                  <Input
                    id="business_license"
                    value={formData.business_license}
                    onChange={(e) => setFormData({ ...formData, business_license: e.target.value })}
                    placeholder="Número de licencia..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cartagena, Santa Marta..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Colombia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa del centro..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.micentrodebuceo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu centro de buceo, servicios, experiencia..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_students">Máximo Estudiantes por Instructor</Label>
                <Input
                  id="max_students"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.max_students_per_instructor}
                  onChange={(e) => setFormData({ ...formData, max_students_per_instructor: parseInt(e.target.value) })}
                />
              </div>

              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Guardando..." : "Actualizar Perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="specialties" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Especialidades del Centro
            </CardTitle>
            <CardDescription>
              Agrega las especialidades que ofrece tu centro de buceo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agregar nueva especialidad */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">Agregar Nueva Especialidad</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Nombre de la especialidad"
                  value={newSpecialty.specialty_name}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, specialty_name: e.target.value })}
                />
                <Input
                  placeholder="Agencia certificadora"
                  value={newSpecialty.certification_agency}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, certification_agency: e.target.value })}
                />
                <Button onClick={handleAddSpecialty} disabled={addSpecialtyMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Lista de especialidades */}
            <div className="space-y-3">
              {specialties.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay especialidades registradas
                </p>
              ) : (
                specialties.map((specialty) => (
                  <div key={specialty.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{specialty.specialty_name}</h4>
                      <p className="text-sm text-muted-foreground">{specialty.certification_agency}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSpecialtyMutation.mutate(specialty.id)}
                      disabled={removeSpecialtyMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schedule" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Operación
            </CardTitle>
            <CardDescription>
              Configura los horarios de atención de tu centro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dayNames.map((day, index) => {
                const schedule = schedules.find(s => s.day_of_week === index);
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="font-medium w-24">{day}</div>
                    <div className="flex items-center gap-4 flex-1">
                      {schedule?.is_closed ? (
                        <Badge variant="secondary">Cerrado</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {schedule?.open_time || '08:00'} - {schedule?.close_time || '18:00'}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="instructors" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Instructores
            </CardTitle>
            <CardDescription>
              Administra los instructores asignados a tu centro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                La gestión de instructores se encuentra en la sección principal del perfil
              </p>
              <Button variant="outline">
                Ir a Gestión de Instructores
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};