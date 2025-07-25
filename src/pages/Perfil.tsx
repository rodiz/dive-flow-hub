import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Mail, Phone, Award, Building2, Save } from "lucide-react";
import { InstructorVerification } from "@/components/InstructorVerification";
import { InstructorManagement } from "@/components/InstructorManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Perfil() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [profile, setProfile] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    phone: userProfile?.phone || "",
    certification_level: userProfile?.certification_level || "",
    certification_agency: userProfile?.certification_agency || "",
    experience_years: userProfile?.experience_years || 0,
  });

  useEffect(() => {
    setProfile({
      first_name: userProfile?.first_name || "",
      last_name: userProfile?.last_name || "",
      phone: userProfile?.phone || "",
      certification_level: userProfile?.certification_level || "",
      certification_agency: userProfile?.certification_agency || "",
      experience_years: userProfile?.experience_years || 0,
    });

    if (userProfile?.role === 'instructor') {
      fetchVerification();
    }
  }, [userProfile]);

  const fetchVerification = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('instructor_verifications')
        .select('*')
        .eq('instructor_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setVerification(data);
    } catch (error) {
      console.error('Error fetching verification:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Perfil actualizado exitosamente");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'instructor':
        return 'Instructor';
      case 'student':
        return 'Estudiante';
      case 'diving_center':
        return 'Centro de Buceo';
      default:
        return 'Usuario';
    }
  };

  if (!user || !userProfile) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Mi Perfil</h1>
            <p className="text-xl text-muted-foreground">
              Información personal y configuración de cuenta
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              General
            </TabsTrigger>
            {userProfile.role === 'instructor' && (
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Verificación
              </TabsTrigger>
            )}
            {userProfile.role === 'diving_center' && (
              <TabsTrigger value="instructors" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Instructores
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <p className="text-muted-foreground">{getRoleLabel(userProfile.role)}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {userProfile.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.phone || 'No especificado'}
                      </span>
                    </div>
                    {userProfile.role === 'instructor' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.certification_level || 'No especificado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.certification_agency || 'No especificado'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Editar Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">Nombre</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Apellido</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Tu apellido"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Tu número de teléfono"
                      />
                    </div>

                    {userProfile.role === 'instructor' && (
                      <>
                        <div>
                          <Label htmlFor="certification_level">Nivel de Certificación</Label>
                          <Input
                            id="certification_level"
                            value={profile.certification_level}
                            onChange={(e) => setProfile(prev => ({ ...prev, certification_level: e.target.value }))}
                            placeholder="Ej: Open Water Instructor"
                          />
                        </div>

                        <div>
                          <Label htmlFor="certification_agency">Agencia de Certificación</Label>
                          <Select 
                            value={profile.certification_agency} 
                            onValueChange={(value) => setProfile(prev => ({ ...prev, certification_agency: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona agencia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PADI">PADI</SelectItem>
                              <SelectItem value="NAUI">NAUI</SelectItem>
                              <SelectItem value="SSI">SSI</SelectItem>
                              <SelectItem value="CMAS">CMAS</SelectItem>
                              <SelectItem value="ACUC">ACUC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="experience_years">Años de Experiencia</Label>
                          <Input
                            id="experience_years"
                            type="number"
                            value={profile.experience_years}
                            onChange={(e) => setProfile(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                            min="0"
                          />
                        </div>
                      </>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {userProfile.role === 'instructor' && (
            <TabsContent value="verification">
              <InstructorVerification 
                verification={verification} 
                onUpdate={fetchVerification}
              />
            </TabsContent>
          )}

          {userProfile.role === 'diving_center' && (
            <TabsContent value="instructors">
              <InstructorManagement viewMode="diving_center" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}