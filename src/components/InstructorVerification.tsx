import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Verification {
  id: string;
  certification_agency: string;
  certification_level: string;
  certification_number?: string;
  expiration_date?: string;
  verification_status: string;
  certification_document_url?: string;
  notes?: string;
  verified_at?: string;
  instructor_id: string;
}

interface InstructorVerificationProps {
  viewMode?: 'instructor' | 'diving_center';
}

export default function InstructorVerification({ viewMode = 'instructor' }: InstructorVerificationProps) {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    certification_agency: '',
    certification_level: '',
    certification_number: '',
    expiration_date: '',
  });

  const certificationAgencies = [
    'PADI', 'SSI', 'NAUI', 'CMAS', 'TDI', 'IANTD', 'GUE', 'BSAC'
  ];

  const certificationLevels = [
    'Open Water Diver', 'Advanced Open Water', 'Rescue Diver', 'Divemaster',
    'Assistant Instructor', 'Open Water Scuba Instructor', 'Specialty Instructor',
    'Master Scuba Diver Trainer', 'Course Director'
  ];

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('instructor_verifications')
        .select('*');

      if (viewMode === 'instructor') {
        query = query.eq('instructor_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las verificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, verificationId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${verificationId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('instructor-certifications')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('instructor-certifications')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('instructor_verifications')
        .update({ certification_document_url: publicUrl })
        .eq('id', verificationId);

      if (updateError) throw updateError;

      toast({
        title: "Éxito",
        description: "Documento subido correctamente",
      });
      
      fetchVerifications();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Error al subir el documento",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('instructor_verifications')
        .insert([{
          instructor_id: user.id,
          ...formData,
          expiration_date: formData.expiration_date || null,
        }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Certificación agregada correctamente",
      });

      setFormData({
        certification_agency: '',
        certification_level: '',
        certification_number: '',
        expiration_date: '',
      });
      setIsDialogOpen(false);
      fetchVerifications();
    } catch (error) {
      console.error('Error creating verification:', error);
      toast({
        title: "Error",
        description: "Error al agregar la certificación",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Verificación de Certificaciones</h2>
          <p className="text-muted-foreground">
            Gestiona y verifica las certificaciones de instructor
          </p>
        </div>
        
        {viewMode === 'instructor' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Agregar Certificación</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nueva Certificación</DialogTitle>
                <DialogDescription>
                  Agrega una nueva certificación para verificación
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agency">Agencia Certificadora</Label>
                    <Select value={formData.certification_agency} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, certification_agency: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar agencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificationAgencies.map(agency => (
                          <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="level">Nivel de Certificación</Label>
                    <Select value={formData.certification_level} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, certification_level: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificationLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Número de Certificación</Label>
                    <Input
                      id="number"
                      value={formData.certification_number}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        certification_number: e.target.value 
                      }))}
                      placeholder="Número de certificación"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expiration">Fecha de Vencimiento</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        expiration_date: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Agregar Certificación</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {verifications.map((verification) => (
          <Card key={verification.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(verification.verification_status)}
                    {verification.certification_agency} - {verification.certification_level}
                  </CardTitle>
                  <CardDescription>
                    {verification.certification_number && (
                      <span>Número: {verification.certification_number}</span>
                    )}
                  </CardDescription>
                </div>
                {getStatusBadge(verification.verification_status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {verification.expiration_date && (
                  <div>
                    <span className="font-medium">Vencimiento:</span>
                    <p>{new Date(verification.expiration_date).toLocaleDateString()}</p>
                  </div>
                )}
                
                {verification.verified_at && (
                  <div>
                    <span className="font-medium">Verificado:</span>
                    <p>{new Date(verification.verified_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {verification.notes && (
                <div>
                  <span className="font-medium text-sm">Notas:</span>
                  <p className="text-sm text-muted-foreground mt-1">{verification.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                {verification.certification_document_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(verification.certification_document_url, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Documento
                  </Button>
                ) : viewMode === 'instructor' && (
                  <div>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, verification.id)}
                      disabled={uploading}
                      className="hidden"
                      id={`file-${verification.id}`}
                    />
                    <Label htmlFor={`file-${verification.id}`}>
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Subiendo...' : 'Subir Documento'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {verifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay certificaciones</h3>
              <p className="text-muted-foreground">
                {viewMode === 'instructor' 
                  ? 'Agrega tu primera certificación para comenzar el proceso de verificación'
                  : 'No hay certificaciones pendientes de verificación'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}