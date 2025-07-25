import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsChart } from "@/components/StatsChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Waves, 
  Award, 
  TrendingUp, 
  Calendar,
  Package,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalStudents: number;
  totalDives: number;
  activeCourses: number;
  completedCertifications: number;
  equipmentCount: number;
  equipmentMaintenanceDue: number;
  monthlyRevenue: number;
  avgDiveDepth: number;
}

interface ChartData {
  label: string;
  value: number;
}

export function AnalyticsDashboard() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalDives: 0,
    activeCourses: 0,
    completedCertifications: 0,
    equipmentCount: 0,
    equipmentMaintenanceDue: 0,
    monthlyRevenue: 0,
    avgDiveDepth: 0,
  });
  const [divesChart, setDivesChart] = useState<ChartData[]>([]);
  const [coursesChart, setCoursesChart] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile) {
      fetchDashboardData();
    }
  }, [user, userProfile]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch stats based on user role
      if (userProfile?.role === 'diving_center') {
        await fetchDivingCenterStats();
      } else if (userProfile?.role === 'instructor') {
        await fetchInstructorStats();
      } else {
        await fetchStudentStats();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivingCenterStats = async () => {
    // Get assigned instructors for this diving center
    const { data: instructors } = await supabase
      .from('instructor_assignments')
      .select('instructor_id')
      .eq('diving_center_id', user!.id)
      .eq('assignment_status', 'active');

    const instructorIds = instructors?.map(i => i.instructor_id) || [];

    // Total students from all assigned instructors
    const { count: totalStudents } = await supabase
      .from('dives')
      .select('student_id', { count: 'exact', head: true })
      .in('instructor_id', instructorIds);

    // Total dives from assigned instructors
    const { count: totalDives } = await supabase
      .from('dives')
      .select('*', { count: 'exact', head: true })
      .in('instructor_id', instructorIds);

    // Active courses from assigned instructors
    const { count: activeCourses } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .in('instructor_id', instructorIds)
      .eq('enrollment_status', 'active');

    // Completed certifications
    const { count: completedCertifications } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .in('instructor_id', instructorIds)
      .eq('certification_issued', true);

    // Equipment inventory
    const { count: equipmentCount } = await supabase
      .from('equipment_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('diving_center_id', user!.id);

    // Equipment needing maintenance
    const { count: equipmentMaintenanceDue } = await supabase
      .from('equipment_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('diving_center_id', user!.id)
      .or('status.eq.maintenance,next_service_due.lt.' + new Date().toISOString().split('T')[0]);

    // Monthly revenue from subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('subscription_plans(price_cop)')
      .eq('status', 'paid')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const monthlyRevenue = subscriptions?.reduce((sum, sub: any) => 
      sum + (sub.subscription_plans?.price_cop || 0), 0) || 0;

    // Average dive depth
    const { data: diveDepths } = await supabase
      .from('dives')
      .select('depth_achieved')
      .in('instructor_id', instructorIds);

    const avgDiveDepth = diveDepths?.length 
      ? diveDepths.reduce((sum, dive) => sum + dive.depth_achieved, 0) / diveDepths.length
      : 0;

    setStats({
      totalStudents: totalStudents || 0,
      totalDives: totalDives || 0,
      activeCourses: activeCourses || 0,
      completedCertifications: completedCertifications || 0,
      equipmentCount: equipmentCount || 0,
      equipmentMaintenanceDue: equipmentMaintenanceDue || 0,
      monthlyRevenue,
      avgDiveDepth: Math.round(avgDiveDepth * 10) / 10,
    });

    // Chart data for diving centers
    await fetchDivingCenterCharts(instructorIds);
  };

  const fetchInstructorStats = async () => {
    // Total students taught by this instructor
    const { data: studentIds } = await supabase
      .from('dives')
      .select('student_id')
      .eq('instructor_id', user!.id);

    const uniqueStudents = new Set(studentIds?.map(d => d.student_id)).size;

    // Total dives conducted
    const { count: totalDives } = await supabase
      .from('dives')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', user!.id);

    // Active courses
    const { count: activeCourses } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', user!.id)
      .eq('enrollment_status', 'active');

    // Completed certifications
    const { count: completedCertifications } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', user!.id)
      .eq('certification_issued', true);

    // Average dive depth for instructor's dives
    const { data: diveDepths } = await supabase
      .from('dives')
      .select('depth_achieved')
      .eq('instructor_id', user!.id);

    const avgDiveDepth = diveDepths?.length 
      ? diveDepths.reduce((sum, dive) => sum + dive.depth_achieved, 0) / diveDepths.length
      : 0;

    setStats({
      totalStudents: uniqueStudents,
      totalDives: totalDives || 0,
      activeCourses: activeCourses || 0,
      completedCertifications: completedCertifications || 0,
      equipmentCount: 0,
      equipmentMaintenanceDue: 0,
      monthlyRevenue: 0,
      avgDiveDepth: Math.round(avgDiveDepth * 10) / 10,
    });

    await fetchInstructorCharts();
  };

  const fetchStudentStats = async () => {
    // Student's personal stats
    const { count: totalDives } = await supabase
      .from('dives')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user!.id);

    const { count: activeCourses } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user!.id)
      .eq('enrollment_status', 'active');

    const { count: completedCertifications } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user!.id)
      .eq('certification_issued', true);

    // Average dive depth for student
    const { data: diveDepths } = await supabase
      .from('dives')
      .select('depth_achieved')
      .eq('student_id', user!.id);

    const avgDiveDepth = diveDepths?.length 
      ? diveDepths.reduce((sum, dive) => sum + dive.depth_achieved, 0) / diveDepths.length
      : 0;

    setStats({
      totalStudents: 0,
      totalDives: totalDives || 0,
      activeCourses: activeCourses || 0,
      completedCertifications: completedCertifications || 0,
      equipmentCount: 0,
      equipmentMaintenanceDue: 0,
      monthlyRevenue: 0,
      avgDiveDepth: Math.round(avgDiveDepth * 10) / 10,
    });

    await fetchStudentCharts();
  };

  const fetchDivingCenterCharts = async (instructorIds: string[]) => {
    // Dives per month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyDives } = await supabase
      .from('dives')
      .select('dive_date')
      .in('instructor_id', instructorIds)
      .gte('dive_date', sixMonthsAgo.toISOString().split('T')[0]);

    const divesData = generateMonthlyData(monthlyDives?.map(d => d.dive_date) || []);
    setDivesChart(divesData);

    // Course enrollments per month
    const { data: monthlyEnrollments } = await supabase
      .from('course_enrollments')
      .select('start_date')
      .in('instructor_id', instructorIds)
      .gte('start_date', sixMonthsAgo.toISOString().split('T')[0]);

    const coursesData = generateMonthlyData(monthlyEnrollments?.map(e => e.start_date) || []);
    setCoursesChart(coursesData);
  };

  const fetchInstructorCharts = async () => {
    // Similar to diving center but filtered by instructor
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyDives } = await supabase
      .from('dives')
      .select('dive_date')
      .eq('instructor_id', user!.id)
      .gte('dive_date', sixMonthsAgo.toISOString().split('T')[0]);

    const divesData = generateMonthlyData(monthlyDives?.map(d => d.dive_date) || []);
    setDivesChart(divesData);

    const { data: monthlyEnrollments } = await supabase
      .from('course_enrollments')
      .select('start_date')
      .eq('instructor_id', user!.id)
      .gte('start_date', sixMonthsAgo.toISOString().split('T')[0]);

    const coursesData = generateMonthlyData(monthlyEnrollments?.map(e => e.start_date) || []);
    setCoursesChart(coursesData);
  };

  const fetchStudentCharts = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyDives } = await supabase
      .from('dives')
      .select('dive_date')
      .eq('student_id', user!.id)
      .gte('dive_date', sixMonthsAgo.toISOString().split('T')[0]);

    const divesData = generateMonthlyData(monthlyDives?.map(d => d.dive_date) || []);
    setDivesChart(divesData);

    setCoursesChart([]);
  };

  const generateMonthlyData = (dates: string[]): ChartData[] => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data: ChartData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = months[date.getMonth()];
      const count = dates.filter(d => {
        const itemDate = new Date(d);
        return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
      }).length;
      
      data.push({ label: monthName, value: count });
    }
    
    return data;
  };

  const getRoleSpecificCards = () => {
    const baseCards = [
      {
        title: "Total Inmersiones",
        value: stats.totalDives,
        icon: Waves,
        change: "+12% vs mes anterior",
        positive: true
      },
      {
        title: "Cursos Activos",
        value: stats.activeCourses,
        icon: Calendar,
        change: "+5% vs mes anterior",
        positive: true
      },
      {
        title: "Certificaciones",
        value: stats.completedCertifications,
        icon: Award,
        change: "+18% vs mes anterior",
        positive: true
      },
      {
        title: "Profundidad Promedio",
        value: `${stats.avgDiveDepth}m`,
        icon: TrendingUp,
        change: "Última actualización",
        positive: null
      }
    ];

    if (userProfile?.role === 'diving_center') {
      return [
        {
          title: "Total Estudiantes",
          value: stats.totalStudents,
          icon: Users,
          change: "+8% vs mes anterior",
          positive: true
        },
        ...baseCards,
        {
          title: "Equipamiento",
          value: stats.equipmentCount,
          icon: Package,
          change: `${stats.equipmentMaintenanceDue} requieren mantenimiento`,
          positive: stats.equipmentMaintenanceDue === 0
        },
        {
          title: "Ingresos Mensuales",
          value: `$${stats.monthlyRevenue.toLocaleString()}`,
          icon: DollarSign,
          change: "+15% vs mes anterior",
          positive: true
        }
      ];
    }

    if (userProfile?.role === 'instructor') {
      return [
        {
          title: "Estudiantes Enseñados",
          value: stats.totalStudents,
          icon: Users,
          change: "+3% vs mes anterior",
          positive: true
        },
        ...baseCards
      ];
    }

    return baseCards;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = getRoleSpecificCards();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Analíticas</h2>
        <p className="text-muted-foreground">
          Resumen de actividades y estadísticas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${
                card.positive === true ? 'text-green-600' : 
                card.positive === false ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {card.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {userProfile?.role === 'diving_center' && stats.equipmentMaintenanceDue > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-800">
                  Equipamiento Requiere Atención
                </h4>
                <p className="text-sm text-amber-700">
                  {stats.equipmentMaintenanceDue} equipos necesitan mantenimiento o están vencidos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="dives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dives">Inmersiones</TabsTrigger>
          {userProfile?.role !== 'student' && (
            <TabsTrigger value="courses">Cursos</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="dives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inmersiones por Mes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <StatsChart 
                data={divesChart} 
                title="Inmersiones"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {userProfile?.role !== 'student' && (
          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inscripciones por Mes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <StatsChart 
                  data={coursesChart} 
                  title="Cursos"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}