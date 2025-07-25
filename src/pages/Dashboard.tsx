import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MapPin, Users, TrendingUp, Calendar, Thermometer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import professionalDiver from "@/assets/professional-diver.jpg";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch recent dives
  const { data: recentDives = [] } = useQuery({
    queryKey: ['recent-dives', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('dives')
        .select(`
          id,
          dive_date,
          depth_achieved,
          dive_sites(name, location),
          student:profiles!dives_student_id_fkey(first_name, last_name)
        `)
        .eq('instructor_id', user.id)
        .order('dive_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch dashboard stats
  const { data: stats = [] } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get current month stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const [divesResult, studentsResult, sitesResult, avgDepthResult] = await Promise.all([
        // Dives this month
        supabase
          .from('dives')
          .select('id')
          .eq('instructor_id', user.id)
          .gte('dive_date', startOfMonthStr),
        
        // Active students (students with dives in last 3 months)
        supabase
          .from('dives')
          .select('student_id')
          .eq('instructor_id', user.id)
          .gte('dive_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Unique dive sites used
        supabase
          .from('dives')
          .select('dive_site_id')
          .eq('instructor_id', user.id),
        
        // Average depth
        supabase
          .from('dives')
          .select('depth_achieved')
          .eq('instructor_id', user.id)
      ]);

      const divesThisMonth = divesResult.data?.length || 0;
      const uniqueStudents = new Set(studentsResult.data?.map(d => d.student_id)).size;
      const uniqueSites = new Set(sitesResult.data?.map(d => d.dive_site_id)).size;
      const avgDepth = avgDepthResult.data?.length 
        ? (avgDepthResult.data.reduce((sum, d) => sum + d.depth_achieved, 0) / avgDepthResult.data.length).toFixed(1)
        : '0';

      return [
        { label: "Inmersiones este mes", value: divesThisMonth.toString(), icon: BookOpen, trend: `+${Math.round(divesThisMonth * 0.1)}` },
        { label: "Estudiantes activos", value: uniqueStudents.toString(), icon: Users, trend: `+${Math.round(uniqueStudents * 0.05)}` },
        { label: "Sitios visitados", value: uniqueSites.toString(), icon: MapPin, trend: `+${Math.round(uniqueSites * 0.1)}` },
        { label: "Profundidad promedio", value: `${avgDepth}m`, icon: TrendingUp, trend: `+${(parseFloat(avgDepth) * 0.1).toFixed(1)}m` },
      ];
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-ocean p-8 text-primary-foreground shadow-depth mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Panel de Instructor</h1>
            <p className="text-xl text-primary-foreground/90 mb-6">
              Gestiona tus inmersiones, estudiantes y registros médicos de forma eficiente
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="lg">
                <Calendar className="w-5 h-5 mr-2" />
                Nueva Inmersión
              </Button>
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                <Users className="w-5 h-5 mr-2" />
                Gestionar Estudiantes
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-20">
            <img src={professionalDiver} alt="Professional Diver" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="shadow-surface hover:shadow-depth transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.trend}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Dives */}
          <Card className="lg:col-span-2 shadow-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                Inmersiones Recientes
              </CardTitle>
              <CardDescription>
                Últimas inmersiones registradas con estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDives.map((dive) => (
                <div key={dive.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <h4 className="font-medium text-primary">{dive.dive_sites?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Estudiante: {dive.student?.first_name} {dive.student?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{dive.depth_achieved}m</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(dive.dive_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Ver todas las inmersiones
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-accent" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Tareas frecuentes y chequeos médicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Programar Inmersión
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Thermometer className="w-4 h-4 mr-2" />
                Registro Médico
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="w-4 h-4 mr-2" />
                Explorar Sitios
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Nuevo Estudiante
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;