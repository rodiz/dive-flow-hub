import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Thermometer, Wind, Eye, Clock, Plus, Search, Filter } from "lucide-react";

const Inmersiones = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("todos");

  const dives = [
    {
      id: 1,
      location: "Arrecife El Paraíso",
      date: "2024-01-20",
      time: "09:30",
      duration: "45 min",
      maxDepth: "18m",
      avgDepth: "12m",
      temperature: "24°C",
      visibility: "Excelente",
      current: "Ligera",
      student: "María García",
      gasUsed: "Aire 21%",
      notes: "Inmersión perfecta, estudiante mostró excelente control de flotabilidad.",
      equipment: "BCD, Regulador Oceanic, Aletas Cressi"
    },
    {
      id: 2,
      location: "Cueva Azul",
      date: "2024-01-18",
      time: "14:15",
      duration: "38 min",
      maxDepth: "12m",
      avgDepth: "8m",
      temperature: "26°C",
      visibility: "Buena",
      current: "Nula",
      student: "Carlos López",
      gasUsed: "Aire 21%",
      notes: "Primera inmersión en cueva, estudiante nervioso pero manejó bien la situación.",
      equipment: "BCD, Regulador Aqualung, Aletas Scubapro"
    },
    {
      id: 3,
      location: "Jardín de Coral",
      date: "2024-01-15",
      time: "11:00",
      duration: "52 min",
      maxDepth: "25m",
      avgDepth: "18m",
      temperature: "22°C",
      visibility: "Excelente",
      current: "Moderada",
      student: "Ana Martín",
      gasUsed: "Nitrox 32%",
      notes: "Inmersión avanzada, estudiante dominó perfectamente la navegación submarina.",
      equipment: "BCD, Regulador Mares, Aletas Atomic"
    }
  ];

  const filteredDives = dives.filter(dive => {
    const matchesSearch = dive.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dive.student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === "todos" || dive.location === filterLocation;
    return matchesSearch && matchesLocation;
  });

  const locations = [...new Set(dives.map(dive => dive.location))];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Registro de Inmersiones</h1>
            <p className="text-xl text-muted-foreground">
              Gestiona y visualiza todos los registros de inmersiones
            </p>
          </div>
          <Button size="lg" className="bg-gradient-ocean shadow-depth">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Inmersión
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-accent" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por ubicación o estudiante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las ubicaciones</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dives Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDives.map((dive) => (
            <Card key={dive.id} className="shadow-surface hover:shadow-depth transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <MapPin className="w-5 h-5 text-accent" />
                      {dive.location}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Estudiante: <span className="font-medium">{dive.student}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dive.date}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{dive.time} • {dive.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{dive.temperature}</span>
                  </div>
                </div>

                {/* Depth and Conditions */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Profundidad máx/prom:</span>
                    <span className="text-sm font-medium">{dive.maxDepth} / {dive.avgDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Visibilidad:</span>
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      {dive.visibility}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Corriente:</span>
                    <Badge variant="outline" className="text-xs">
                      <Wind className="w-3 h-3 mr-1" />
                      {dive.current}
                    </Badge>
                  </div>
                </div>

                {/* Equipment and Gas */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Gas utilizado: </span>
                    <span className="font-medium">{dive.gasUsed}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Equipamiento: </span>
                    <span className="text-xs">{dive.equipment}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground italic">"{dive.notes}"</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Detalles
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDives.length === 0 && (
          <Card className="shadow-surface">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No se encontraron inmersiones
              </h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda o crear una nueva inmersión.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Inmersiones;