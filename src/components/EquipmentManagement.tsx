import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Camera, Wrench, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface EquipmentType {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Equipment {
  id: string;
  equipment_type_id: string;
  serial_number?: string;
  brand?: string;
  model?: string;
  purchase_date?: string;
  last_service_date?: string;
  next_service_due?: string;
  condition_rating: number;
  status: string;
  notes?: string;
  photo_url?: string;
  equipment_types?: EquipmentType | null;
}

export function EquipmentManagement() {
  const { user, userProfile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    equipment_type_id: "",
    serial_number: "",
    brand: "",
    model: "",
    purchase_date: "",
    last_service_date: "",
    next_service_due: "",
    condition_rating: 5,
    status: "available",
    notes: "",
  });

  useEffect(() => {
    if (userProfile?.role === 'diving_center') {
      fetchEquipment();
      fetchEquipmentTypes();
    }
  }, [userProfile]);

  const fetchEquipment = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('equipment_inventory')
        .select(`
          *,
          equipment_types (
            id,
            name,
            description,
            category
          )
        `)
        .eq('diving_center_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment((data as any) || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error("Error al cargar el equipamiento");
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_types')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setEquipmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      toast.error("Error al cargar tipos de equipamiento");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const equipmentData = {
        ...formData,
        diving_center_id: user.id,
        condition_rating: Number(formData.condition_rating)
      };

      if (editingEquipment) {
        const { error } = await supabase
          .from('equipment_inventory')
          .update(equipmentData)
          .eq('id', editingEquipment.id);

        if (error) throw error;
        toast.success("Equipamiento actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from('equipment_inventory')
          .insert(equipmentData);

        if (error) throw error;
        toast.success("Equipamiento agregado exitosamente");
      }

      resetForm();
      fetchEquipment();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error("Error al guardar el equipamiento");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      equipment_type_id: item.equipment_type_id,
      serial_number: item.serial_number || "",
      brand: item.brand || "",
      model: item.model || "",
      purchase_date: item.purchase_date || "",
      last_service_date: item.last_service_date || "",
      next_service_due: item.next_service_due || "",
      condition_rating: item.condition_rating,
      status: item.status,
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este equipamiento?')) return;

    try {
      const { error } = await supabase
        .from('equipment_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Equipamiento eliminado exitosamente");
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error("Error al eliminar el equipamiento");
    }
  };

  const resetForm = () => {
    setFormData({
      equipment_type_id: "",
      serial_number: "",
      brand: "",
      model: "",
      purchase_date: "",
      last_service_date: "",
      next_service_due: "",
      condition_rating: 5,
      status: "available",
      notes: "",
    });
    setEditingEquipment(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      available: "default",
      in_use: "secondary",
      maintenance: "destructive",
      retired: "outline"
    };

    const labels: Record<string, string> = {
      available: "Disponible",
      in_use: "En Uso",
      maintenance: "Mantenimiento",
      retired: "Retirado"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const groupedEquipment = equipmentTypes.reduce((acc, type) => {
    const typeEquipment = equipment.filter(eq => eq.equipment_type_id === type.id);
    if (typeEquipment.length > 0) {
      acc[type.category] = acc[type.category] || [];
      acc[type.category].push({ type, equipment: typeEquipment });
    }
    return acc;
  }, {} as Record<string, Array<{ type: EquipmentType; equipment: Equipment[] }>>);

  if (userProfile?.role !== 'diving_center') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Solo los centros de buceo pueden gestionar equipamiento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Equipamiento</h2>
          <p className="text-muted-foreground">
            Administra el inventario de equipos de buceo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Equipamiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Editar Equipamiento' : 'Agregar Equipamiento'}
              </DialogTitle>
              <DialogDescription>
                {editingEquipment 
                  ? 'Modifica la información del equipamiento'
                  : 'Agrega nuevo equipamiento al inventario'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment_type_id">Tipo de Equipamiento</Label>
                  <Select 
                    value={formData.equipment_type_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_type_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="in_use">En Uso</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="retired">Retirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Ej: Scubapro"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Ej: MK25 EVO"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serial_number">Número de Serie</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="Número de serie único"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchase_date">Fecha de Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="last_service_date">Último Servicio</Label>
                  <Input
                    id="last_service_date"
                    type="date"
                    value={formData.last_service_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_service_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="next_service_due">Próximo Servicio</Label>
                  <Input
                    id="next_service_due"
                    type="date"
                    value={formData.next_service_due}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_service_due: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="condition_rating">Condición (1-10)</Label>
                <Input
                  id="condition_rating"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.condition_rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition_rating: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : editingEquipment ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedEquipment).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay equipamiento registrado</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando equipamiento a tu inventario
            </p>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Equipamiento
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedEquipment).map(([category, typeGroups]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              {typeGroups.map(({ type, equipment: typeEquipment }) => (
                <div key={type.id} className="mb-6 last:mb-0">
                  <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    {type.name}
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {typeEquipment.map((item) => (
                      <Card key={item.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium">
                                {item.brand} {item.model}
                              </h5>
                              {item.serial_number && (
                                <p className="text-sm text-muted-foreground">
                                  SN: {item.serial_number}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Condición:</span>
                              <span className="font-medium">{item.condition_rating}/10</span>
                            </div>
                            {item.last_service_date && (
                              <div className="flex justify-between">
                                <span>Último servicio:</span>
                                <span>{new Date(item.last_service_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {item.next_service_due && (
                              <div className="flex justify-between">
                                <span>Próximo servicio:</span>
                                <span className={
                                  new Date(item.next_service_due) < new Date() 
                                    ? "text-destructive font-medium" 
                                    : ""
                                }>
                                  {new Date(item.next_service_due).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                              {item.notes}
                            </p>
                          )}

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Camera className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Wrench className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}