import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, UserCheck, UserX, Eye, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface InstructorManagementProps {
  viewMode?: 'diving_center' | 'instructor';
}

export function InstructorManagement({ viewMode = 'diving_center' }: InstructorManagementProps) {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      if (viewMode === 'diving_center') {
        // Obtener instructores asignados al centro
        const { data: assignments, error: assignError } = await supabase
          .from('instructor_assignments')
          .select(`
            *,
            instructor:profiles!instructor_id(*)
          `)
          .eq('diving_center_id', user.id);

        if (assignError) throw assignError;

        // Obtener verificaciones de esos instructores
        const instructorIds = assignments?.map(a => a.instructor_id) || [];
        if (instructorIds.length > 0) {
          const { data: verificationsData, error: verError } = await supabase
            .from('instructor_verifications')
            .select(`
              *,
              instructor:profiles!instructor_id(first_name, last_name, email)
            `)
            .in('instructor_id', instructorIds);

          if (verError) throw verError;
          setVerifications(verificationsData || []);
        }

        setInstructors(assignments || []);
      } else {
        // Vista de instructor - solo sus verificaciones
        const { data: verificationsData, error } = await supabase
          .from('instructor_verifications')
          .select('*')
          .eq('instructor_id', user.id);

        if (error) throw error;
        setVerifications(verificationsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (verificationId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('instructor_verifications')
        .update({
          verification_status: status,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', verificationId);

      if (error) throw error;

      toast.success(`Verificación ${status === 'approved' ? 'aprobada' : 'rechazada'}`);
      fetchData();
      setSelectedVerification(null);
      setReviewNotes("");
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error("Error al actualizar verificación");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verificaciones de Certificación ({verifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {verifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay verificaciones disponibles
              </p>
            ) : (
              verifications.map((verification) => (
                <div key={verification.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      {viewMode === 'diving_center' && (
                        <h4 className="font-medium">
                          {verification.instructor.first_name} {verification.instructor.last_name}
                        </h4>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Agencia:</span>
                          <p>{verification.certification_agency}</p>
                        </div>
                        <div>
                          <span className="font-medium">Nivel:</span>
                          <p>{verification.certification_level}</p>
                        </div>
                        <div>
                          <span className="font-medium">Número:</span>
                          <p>{verification.certification_number}</p>
                        </div>
                        <div>
                          <span className="font-medium">Expira:</span>
                          <p>{verification.expiration_date ? new Date(verification.expiration_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      {verification.notes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Notas:</span> {verification.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(verification.verification_status)}
                      {viewMode === 'diving_center' && verification.verification_status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedVerification(verification)}
                            >
                              <Eye className="h-4 w-4" />
                              Revisar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Revisar Verificación</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Información del Instructor:</h4>
                                <p>{verification.instructor.first_name} {verification.instructor.last_name}</p>
                                <p className="text-sm text-muted-foreground">{verification.instructor.email}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Certificación:</h4>
                                <p><span className="font-medium">Agencia:</span> {verification.certification_agency}</p>
                                <p><span className="font-medium">Nivel:</span> {verification.certification_level}</p>
                                <p><span className="font-medium">Número:</span> {verification.certification_number}</p>
                              </div>

                              {verification.certification_document_url && (
                                <div>
                                  <Label>Documento:</Label>
                                  <Button 
                                    variant="outline" 
                                    className="w-full mt-2"
                                    onClick={() => window.open(verification.certification_document_url, '_blank')}
                                  >
                                    Ver Documento
                                  </Button>
                                </div>
                              )}

                              <div>
                                <Label htmlFor="review_notes">Notas de revisión</Label>
                                <Textarea
                                  id="review_notes"
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Agregar comentarios sobre la verificación..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1"
                                  onClick={() => updateVerificationStatus(verification.id, 'approved', reviewNotes)}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Aprobar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  className="flex-1"
                                  onClick={() => updateVerificationStatus(verification.id, 'rejected', reviewNotes)}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}