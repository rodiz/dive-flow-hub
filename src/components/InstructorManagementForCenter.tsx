import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Users, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InstructorManagement } from "@/components/InstructorManagement";

export const InstructorManagementForCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [instructorEmail, setInstructorEmail] = useState("");

  // Fetch center's instructors
  const { data: centerInstructors = [], isLoading } = useQuery({
    queryKey: ["center-instructors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_assignments")
        .select(`
          *,
          profiles!instructor_id(
            user_id,
            first_name,
            last_name,
            email,
            certification_level,
            experience_years,
            phone,
            city
          )
        `)
        .eq("diving_center_id", user?.id)
        .eq("assignment_status", "active");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Add instructor to center
  const addInstructorMutation = useMutation({
    mutationFn: async (email: string) => {
      // First, find the instructor by email
      const { data: instructorProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, role")
        .eq("email", email.trim())
        .eq("role", "instructor")
        .single();

      if (profileError || !instructorProfile) {
        throw new Error("Instructor no encontrado con ese email");
      }

      // Check if already assigned
      const { data: existingAssignment } = await supabase
        .from("instructor_assignments")
        .select("id")
        .eq("instructor_id", instructorProfile.user_id)
        .eq("diving_center_id", user?.id)
        .eq("assignment_status", "active")
        .single();

      if (existingAssignment) {
        throw new Error("El instructor ya está asignado a este centro");
      }

      // Create assignment
      const { data, error } = await supabase
        .from("instructor_assignments")
        .insert({
          instructor_id: instructorProfile.user_id,
          diving_center_id: user?.id,
          assigned_by: user?.id,
          assignment_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Instructor asignado",
        description: "El instructor ha sido asignado exitosamente al centro",
      });
      queryClient.invalidateQueries({ queryKey: ['center-instructors'] });
      setInstructorEmail("");
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al asignar instructor",
        variant: "destructive",
      });
    }
  });

  // Remove instructor assignment
  const removeInstructorMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("instructor_assignments")
        .update({ assignment_status: "inactive" })
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Instructor removido",
        description: "El instructor ha sido removido del centro",
      });
      queryClient.invalidateQueries({ queryKey: ['center-instructors'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Error al remover instructor",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorEmail.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el email del instructor",
        variant: "destructive",
      });
      return;
    }
    addInstructorMutation.mutate(instructorEmail);
  };

  const handleRemoveInstructor = (assignmentId: string) => {
    if (confirm("¿Estás seguro de que quieres remover este instructor del centro?")) {
      removeInstructorMutation.mutate(assignmentId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Cargando instructores...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Instructores del Centro
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar Instructor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Asignar Instructor al Centro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="instructorEmail">Email del Instructor *</Label>
                    <Input
                      id="instructorEmail"
                      type="email"
                      value={instructorEmail}
                      onChange={(e) => setInstructorEmail(e.target.value)}
                      placeholder="instructor@ejemplo.com"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      El instructor debe estar registrado como usuario con rol "instructor"
                    </p>
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={addInstructorMutation.isPending}
                    className="w-full"
                  >
                    {addInstructorMutation.isPending ? 'Asignando...' : 'Asignar Instructor'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {centerInstructors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay instructores asignados al centro</p>
                <p className="text-sm text-muted-foreground">
                  Usa el botón "Asignar Instructor" para agregar instructores
                </p>
              </div>
            ) : (
              centerInstructors.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">
                          {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {assignment.profiles?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {assignment.profiles?.certification_level || 'Nivel no especificado'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {assignment.profiles?.experience_years || 0} años de experiencia
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInstructor(assignment.profiles)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveInstructor(assignment.id)}
                      disabled={removeInstructorMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructor Verification Management */}
      <InstructorManagement viewMode="diving_center" />

      {/* Instructor Details Dialog */}
      {selectedInstructor && (
        <Dialog open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles del Instructor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <p className="text-sm">{selectedInstructor.first_name} {selectedInstructor.last_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{selectedInstructor.email}</p>
              </div>
              {selectedInstructor.phone && (
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedInstructor.phone}</p>
                </div>
              )}
              {selectedInstructor.city && (
                <div>
                  <Label>Ciudad</Label>
                  <p className="text-sm">{selectedInstructor.city}</p>
                </div>
              )}
              <div>
                <Label>Nivel de Certificación</Label>
                <p className="text-sm">{selectedInstructor.certification_level || 'No especificado'}</p>
              </div>
              <div>
                <Label>Años de Experiencia</Label>
                <p className="text-sm">{selectedInstructor.experience_years || 0} años</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};