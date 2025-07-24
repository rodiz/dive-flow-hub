import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Edit, Settings, BookOpen, Award, Clock, MapPin, Phone, Mail, Calendar, Shield } from "lucide-react";

const Perfil = () => {
  const instructorData = {
    name: "Roberto Fernández",
    email: "roberto.fernandez@divelogpro.com",
    phone: "+34 612 345 678",
    role: "Instructor Principal",
    certifications: ["PADI Master Instructor", "TDI Technical Instructor", "DAN Oxygen Provider"],
    licenseNumber: "PADI-MI-12345",
    experience: "15 años",
    totalStudents: 247,
    totalDives: 1250,
    specialties: ["Buceo Técnico", "Buceo en Cuevas", "Primeros Auxilios"],
    joinDate: "2009-03-15",
    lastLogin: "2024-01-20 14:30"
  };

  const recentActivity = [
    { type: "dive", description: "Inmersión registrada en Arrecife El Paraíso", date: "hace 2 horas" },
    { type: "student", description: "Nuevo estudiante María García registrado", date: "hace 1 día" },
    { type: "medical", description: "Chequeo médico aprobado para Carlos López", date: "hace 2 días" },
    { type: "certification", description: "Certificación Advanced Open Water otorgada", date: "hace 3 días" }
  ];

  const achievements = [
    { title: "Master Instructor", description: "500+ estudiantes certificados", icon: Award },
    { title: "Safety First", description: "0 incidentes en 2023", icon: Shield },
    { title: "Explorer", description: "50+ sitios de buceo visitados", icon: MapPin },
    { title: "Veteran", description: "15 años de experiencia", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Mi Perfil</h1>
            <p className="text-xl text-muted-foreground">
              Información personal y estadísticas profesionales
            </p>
          </div>
          <Button size="lg" className="bg-gradient-ocean shadow-depth">
            <Edit className="w-5 h-5 mr-2" />
            Editar Perfil
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="lg:col-span-1 shadow-depth">
            <CardHeader className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-ocean text-primary-foreground text-3xl">
                  RF
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl text-primary">{instructorData.name}</CardTitle>
              <CardDescription className="text-lg">{instructorData.role}</CardDescription>
              <Badge className="mx-auto mt-2 bg-accent text-accent-foreground">
                Licencia: {instructorData.licenseNumber}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{instructorData.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{instructorData.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Miembro desde {instructorData.joinDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Último acceso: {instructorData.lastLogin}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{instructorData.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{instructorData.totalDives}</p>
                  <p className="text-xs text-muted-foreground">Inmersiones</p>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Certifications */}
            <Card className="shadow-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Certificaciones y Especialidades
                </CardTitle>
                <CardDescription>
                  Credenciales profesionales y áreas de especialización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Certificaciones Principales:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {instructorData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cert}</p>
                          <p className="text-xs text-muted-foreground">Vigente</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Especialidades:</h4>
                  <div className="flex flex-wrap gap-2">
                    {instructorData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="shadow-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Logros y Reconocimientos
                </CardTitle>
                <CardDescription>
                  Hitos alcanzados en tu carrera profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium text-primary">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Últimas acciones realizadas en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver historial completo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;