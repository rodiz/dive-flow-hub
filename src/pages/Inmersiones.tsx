import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiveCard } from "@/components/DiveCard";
import { StatsChart } from "@/components/StatsChart";
import { Plus, Search, Filter, MapPin, Calendar, Gauge, BarChart3, List, Grid } from "lucide-react";
import { useState } from "react";

const Inmersiones = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const dives = [
    {
      id: 1,
      location: "Arrecife El Paraíso",
      date: "2024-01-20",
      depth: "18m",
      maxDepth: "22m",
      duration: "45min",
      temperature: "24°C",
      visibility: "25m",
      current: "Moderada",
      student: "María García",
      conditions: "excellent" as const,
      equipment: ["BCD", "Regulador", "Máscara", "Aletas", "Traje 3mm"],
      notes: "Inmersión perfecta para practicar flotabilidad. La estudiante mostró gran progreso en control de profundidad y navegación subacuática."
    },
    {
      id: 2,
      location: "Cueva Azul",
      date: "2024-01-18",
      depth: "12m",
      maxDepth: "15m",
      duration: "38min",
      temperature: "26°C",
      visibility: "20m",
      current: "Ligera",
      student: "Carlos López",
      conditions: "good" as const,
      equipment: ["BCD", "Regulador", "Máscara", "Aletas", "Traje 5mm", "Linterna"],
      notes: "Primera inmersión en cueva para el estudiante. Excelente control y respeto por el entorno."
    },
    {
      id: 3,
      location: "Jardín de Coral",
      date: "2024-01-15",
      depth: "25m",
      maxDepth: "28m",
      duration: "52min",
      temperature: "23°C",
      visibility: "30m",
      current: "Fuerte",
      student: "Ana Martín",
      conditions: "fair" as const,
      equipment: ["BCD", "Regulador", "Máscara", "Aletas", "Traje 5mm", "Guantes"],
      notes: "Condiciones desafiantes por corriente. La estudiante manejó bien la situación y completó todos los ejercicios."
    },
    {
      id: 4,
      location: "Naufragio Santa María",
      date: "2024-01-12",
      depth: "30m",
      maxDepth: "35m",
      duration: "48min",
      temperature: "22°C",
      visibility: "15m",
      current: "Moderada",
      student: "Diego Ruiz",
      conditions: "good" as const,
      equipment: ["BCD", "Regulador", "Máscara", "Aletas", "Traje 7mm", "Linterna", "Cuchillo"],
      notes: "Exploración de naufragio. Excelente oportunidad para practicar penetración segura y navegación."
    }
  ];

  const monthlyStats = [
    { label: "Enero", value: 24, trend: 12, trendDirection: "up" as const },
    { label: "Febrero", value: 18, trend: -8, trendDirection: "down" as const },
    { label: "Marzo", value: 32, trend: 15, trendDirection: "up" as const },
    { label: "Abril", value: 28, trend: 5, trendDirection: "up" as const },
  ];

  const depthStats = [
    { label: "0-10m", value: 45, trend: 8, trendDirection: "up" as const },
    { label: "10-20m", value: 67, trend: -3, trendDirection: "down" as const },
    { label: "20-30m", value: 32, trend: 12, trendDirection: "up" as const },
    { label: "30m+", value: 18, trend: 25, trendDirection: "up" as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              Registro de Inmersiones
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y registra todas las inmersiones y expediciones
            </p>
          </div>
          <Button className="shadow-surface hover:shadow-depth" variant="ocean">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Inmersión
          </Button>
        </div>

        <Tabs defaultValue="inmersiones" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inmersiones">Inmersiones</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="mapas">Mapas & Sitios</TabsTrigger>
          </TabsList>

          <TabsContent value="inmersiones" className="space-y-6">
            {/* Filters */}
            <Card className="shadow-surface">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-accent" />
                    Filtros y Búsqueda
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar ubicación..." className="pl-9" />
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estudiantes</SelectItem>
                      <SelectItem value="maria">María García</SelectItem>
                      <SelectItem value="carlos">Carlos López</SelectItem>
                      <SelectItem value="ana">Ana Martín</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Profundidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las profundidades</SelectItem>
                      <SelectItem value="shallow">0-15m</SelectItem>
                      <SelectItem value="medium">15-25m</SelectItem>
                      <SelectItem value="deep">25m+</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mes</SelectItem>
                      <SelectItem value="quarter">Último trimestre</SelectItem>
                      <SelectItem value="year">Último año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dive Cards */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {dives.map((dive) => (
                <DiveCard 
                  key={dive.id} 
                  dive={dive} 
                  viewMode="instructor"
                  onViewDetails={(id) => console.log(`Ver detalles de inmersión ${id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatsChart 
                title="Inmersiones por Mes"
                description="Evolución mensual de la actividad de buceo"
                data={monthlyStats}
                type="bar"
              />
              <StatsChart 
                title="Distribución por Profundidad"
                description="Análisis de inmersiones según rangos de profundidad"
                data={depthStats}
                type="area"
              />
            </div>
            
            {/* Additional Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-surface">
                <CardHeader>
                  <CardTitle className="text-lg">Promedio Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">25.5</div>
                  <p className="text-sm text-muted-foreground">inmersiones por mes</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-surface">
                <CardHeader>
                  <CardTitle className="text-lg">Profundidad Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-2">22.3m</div>
                  <p className="text-sm text-muted-foreground">profundidad promedio</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-surface">
                <CardHeader>
                  <CardTitle className="text-lg">Tiempo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary-glow mb-2">42.5h</div>
                  <p className="text-sm text-muted-foreground">tiempo bajo el agua</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mapas" className="space-y-6">
            <Card className="shadow-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  Sitios de Buceo Populares
                </CardTitle>
                <CardDescription>
                  Ubicaciones más frecuentadas para inmersiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Arrecife El Paraíso", visits: 15, avgDepth: "18m" },
                    { name: "Jardín de Coral", visits: 12, avgDepth: "25m" },
                    { name: "Cueva Azul", visits: 8, avgDepth: "12m" },
                    { name: "Naufragio Santa María", visits: 6, avgDepth: "30m" },
                  ].map((site, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-medium">{site.name}</h4>
                        <p className="text-sm text-muted-foreground">Profundidad promedio: {site.avgDepth}</p>
                      </div>
                      <Badge variant="secondary">{site.visits} visitas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inmersiones;