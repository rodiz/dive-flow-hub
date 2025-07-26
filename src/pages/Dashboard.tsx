import { useAuth } from "@/contexts/AuthContext";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { InstructorDashboard } from "@/components/dashboards/InstructorDashboard";
import { DivingCenterDashboard } from "@/components/dashboards/DivingCenterDashboard";

const Dashboard = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Renderizar dashboard específico según el rol
  switch (userProfile.role) {
    case 'student':
      return (
        <div className="min-h-screen bg-gradient-surface">
          <div className="container py-8">
            <StudentDashboard />
          </div>
        </div>
      );
    case 'instructor':
      return (
        <div className="min-h-screen bg-gradient-surface">
          <div className="container py-8">
            <InstructorDashboard />
          </div>
        </div>
      );
    case 'diving_center':
      return (
        <div className="min-h-screen bg-gradient-surface">
          <div className="container py-8">
            <DivingCenterDashboard />
          </div>
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gradient-surface">
          <div className="container py-8">
            <StudentDashboard />
          </div>
        </div>
      );
  }
};

export default Dashboard;