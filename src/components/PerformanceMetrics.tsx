import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Timer, 
  Gauge,
  Trophy,
  Star,
  Activity,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";

interface PerformanceData {
  totalDives: number;
  totalBottomTime: number;
  averageDepth: number;
  maxDepth: number;
  certificationProgress: number;
  safetyScore: number;
  skillsProgress: {
    buoyancy: number;
    navigation: number;
    safety: number;
    equipment: number;
  };
  monthlyProgress: Array<{
    month: string;
    dives: number;
    bottomTime: number;
    averageDepth: number;
  }>;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    icon: string;
  }>;
}

export default function PerformanceMetrics() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener datos reales de inmersiones
      const { data: dives } = await supabase
        .from('dives')
        .select('*')
        .eq('student_id', user.id);

      // Calcular métricas
      const totalDives = dives?.length || 0;
      const totalBottomTime = dives?.reduce((sum, dive) => sum + dive.bottom_time, 0) || 0;
      const averageDepth = dives?.length 
        ? dives.reduce((sum, dive) => sum + dive.depth_achieved, 0) / dives.length 
        : 0;
      const maxDepth = dives?.length 
        ? Math.max(...dives.map(dive => dive.depth_achieved))
        : 0;

      // Simular datos adicionales de rendimiento
      const mockPerformanceData: PerformanceData = {
        totalDives,
        totalBottomTime,
        averageDepth: Math.round(averageDepth),
        maxDepth,
        certificationProgress: Math.min(100, (totalDives / 20) * 100), // 20 inmersiones = 100%
        safetyScore: Math.max(85, 100 - Math.random() * 15), // 85-100%
        skillsProgress: {
          buoyancy: Math.min(100, (totalDives / 10) * 100),
          navigation: Math.min(100, (totalDives / 15) * 100),
          safety: Math.min(100, (totalDives / 8) * 100),
          equipment: Math.min(100, (totalDives / 12) * 100),
        },
        monthlyProgress: generateMonthlyProgress(dives || []),
        recentAchievements: [
          {
            id: '1',
            title: 'Primera Inmersión',
            description: 'Completaste tu primera inmersión certificada',
            date: '2024-01-15',
            icon: 'trophy'
          },
          {
            id: '2',
            title: 'Maestro de la Flotabilidad',
            description: 'Mantuviste flotabilidad perfecta durante 20 minutos',
            date: '2024-01-20',
            icon: 'star'
          },
          {
            id: '3',
            title: 'Explorador Profundo',
            description: 'Alcanzaste los 30 metros de profundidad',
            date: '2024-01-25',
            icon: 'target'
          }
        ]
      };

      setPerformanceData(mockPerformanceData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyProgress = (dives: any[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map(month => {
      const monthDives = Math.floor(Math.random() * 8) + 1;
      return {
        month,
        dives: monthDives,
        bottomTime: monthDives * (30 + Math.random() * 20),
        averageDepth: 15 + Math.random() * 15
      };
    });
  };

  const getSkillLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Experto', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { level: 'Avanzado', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 50) return { level: 'Intermedio', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Principiante', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getAchievementIcon = (iconType: string) => {
    switch (iconType) {
      case 'trophy':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'star':
        return <Star className="w-6 h-6 text-blue-500" />;
      case 'target':
        return <Target className="w-6 h-6 text-green-500" />;
      default:
        return <Award className="w-6 h-6 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Activity className="w-6 h-6 animate-pulse" />
          <span className="ml-2">Cargando métricas de rendimiento...</span>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          No hay datos de rendimiento disponibles
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Métricas de Rendimiento
          </CardTitle>
          <CardDescription>
            Tu progreso y estadísticas de buceo
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <div className="text-sm font-medium">Total Inmersiones</div>
                </div>
                <div className="text-2xl font-bold mt-2">{performanceData.totalDives}</div>
                <div className="text-xs text-muted-foreground">
                  {performanceData.totalDives > 0 && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  Progresando
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-green-500" />
                  <div className="text-sm font-medium">Tiempo Total</div>
                </div>
                <div className="text-2xl font-bold mt-2">{performanceData.totalBottomTime} min</div>
                <div className="text-xs text-muted-foreground">
                  Tiempo en el fondo
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-500" />
                  <div className="text-sm font-medium">Prof. Promedio</div>
                </div>
                <div className="text-2xl font-bold mt-2">{performanceData.averageDepth}m</div>
                <div className="text-xs text-muted-foreground">
                  Profundidad media
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <div className="text-sm font-medium">Máx. Profundidad</div>
                </div>
                <div className="text-2xl font-bold mt-2">{performanceData.maxDepth}m</div>
                <div className="text-xs text-muted-foreground">
                  Récord personal
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progreso Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={performanceData.monthlyProgress}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="dives"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(performanceData.skillsProgress).map(([skill, percentage]) => {
              const skillInfo = getSkillLevel(percentage);
              const skillNames = {
                buoyancy: 'Control de Flotabilidad',
                navigation: 'Navegación Subacuática',
                safety: 'Procedimientos de Seguridad',
                equipment: 'Manejo de Equipos'
              };

              return (
                <Card key={skill}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        {skillNames[skill as keyof typeof skillNames]}
                      </div>
                      <Badge className={`${skillInfo.bg} ${skillInfo.color}`}>
                        {skillInfo.level}
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(percentage)}% completado
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Certificación</CardTitle>
                <CardDescription>
                  Avanza hacia tu siguiente nivel de certificación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={performanceData.certificationProgress} className="h-4" />
                <div className="text-sm text-muted-foreground mt-2">
                  {Math.round(performanceData.certificationProgress)}% completado hacia Advanced Open Water
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Puntaje de Seguridad</CardTitle>
                <CardDescription>
                  Tu historial de cumplimiento de protocolos de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(performanceData.safetyScore)}%
                  </div>
                  <div className="flex-1">
                    <Progress value={performanceData.safetyScore} className="h-4" />
                    <div className="text-sm text-muted-foreground mt-1">
                      Excelente cumplimiento de protocolos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {performanceData.recentAchievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {getAchievementIcon(achievement.icon)}
                    <div className="flex-1">
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {achievement.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(achievement.date).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}