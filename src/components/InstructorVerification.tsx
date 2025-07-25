import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InstructorVerificationProps {
  verification?: any;
  onUpdate?: () => void;
}

export function InstructorVerification({ verification, onUpdate }: InstructorVerificationProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    certification_number: verification?.certification_number || "",
    certification_agency: verification?.certification_agency || "",
    certification_level: verification?.certification_level || "",
    expiration_date: verification?.expiration_date || "",
    notes: verification?.notes || ""
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/certification-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('instructor-certifications')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('instructor-certifications')
        .getPublicUrl(fileName);

      // Update or create verification record
      const verificationData = {
        instructor_id: user.id,
        certification_document_url: publicUrl,
        ...formData
      };

      if (verification) {
        const { error } = await supabase
          .from('instructor_verifications')
          .update(verificationData)
          .eq('id', verification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('instructor_verifications')
          .insert([verificationData]);
        if (error) throw error;
      }

      toast.success("Documento subido exitosamente");
      onUpdate?.();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const verificationData = {
        instructor_id: user.id,
        ...formData
      };

      if (verification) {
        const { error } = await supabase
          .from('instructor_verifications')
          .update(verificationData)
          .eq('id', verification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('instructor_verifications')
          .insert([verificationData]);
        if (error) throw error;
      }

      toast.success("Información actualizada exitosamente");
      onUpdate?.();
    } catch (error) {
      console.error('Error saving verification:', error);
      toast.error("Error al guardar la información");
    } finally {
      setLoading(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Verificación de Instructor
          {verification && getStatusBadge(verification.verification_status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="certification_number">Número de Certificación*</Label>
              <Input
                id="certification_number"
                value={formData.certification_number}
                onChange={(e) => setFormData(prev => ({ ...prev, certification_number: e.target.value }))}
                placeholder="Ej: 123456"
                required
              />
            </div>

            <div>
              <Label htmlFor="certification_agency">Agencia Certificadora*</Label>
              <Select 
                value={formData.certification_agency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, certification_agency: value }))}
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
                  <SelectItem value="Otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="certification_level">Nivel de Certificación*</Label>
              <Select 
                value={formData.certification_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, certification_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open Water Scuba Instructor">Open Water Scuba Instructor</SelectItem>
                  <SelectItem value="Advanced Open Water Instructor">Advanced Open Water Instructor</SelectItem>
                  <SelectItem value="Rescue Instructor">Rescue Instructor</SelectItem>
                  <SelectItem value="Master Scuba Diver Trainer">Master Scuba Diver Trainer</SelectItem>
                  <SelectItem value="IDC Staff Instructor">IDC Staff Instructor</SelectItem>
                  <SelectItem value="Master Instructor">Master Instructor</SelectItem>
                  <SelectItem value="Course Director">Course Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiration_date">Fecha de Expiración</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="document_upload">Carnet/Certificado (PDF, JPG, PNG)</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                id="document_upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <span className="text-sm text-muted-foreground">Subiendo...</span>}
              {verification?.certification_document_url && (
                <Badge variant="outline" className="gap-1">
                  <FileCheck className="h-3 w-3" />
                  Documento subido
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Información adicional sobre tu certificación..."
              rows={3}
            />
          </div>

          {verification?.verification_status === 'rejected' && verification?.notes && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Verificación rechazada</h4>
                  <p className="text-sm text-red-700 mt-1">{verification.notes}</p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || uploading} className="w-full">
            {loading ? "Guardando..." : verification ? "Actualizar Verificación" : "Crear Verificación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}