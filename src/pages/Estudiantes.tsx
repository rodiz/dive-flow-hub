import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Plus, BookOpen, Activity, Calendar, Phone, Mail, MapPin } from "lucide-react";

const Estudiantes = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    {
      id: 1,
      name: "María García",
      email: "maria.garcia@email.com",
      phone: "+34 612 345 678",
      level: "Open Water",
      totalDives: 12,
      lastDive: "2024-01-20",
      medicalStatus: "Aprobado",
      nextCheckup: "2024-06-20",
      certifications: ["Open Water", "Advanced Open Water"],
      emergencyContact: "Juan García - +34 678 901 234",
      avatar: ""
    },
    {
      id: 2,
      name: "Carlos López",
      email: "carlos.lopez@email.com",
      phone: "+34 623 456 789",
      level: "Advanced Open Water",
      totalDives: 28,
      lastDive: "2024-01-18",
      medicalStatus: "Pendiente",
      nextCheckup: "2024-02-15",
      certifications: ["Open Water", "Advanced Open Water", "Deep Diver"],
      emergencyContact: "Ana López - +34 689 012 345",
      avatar: ""
    },
    {
      id: 3,
      name: "Ana Martín",
      email: "ana.martin@email.com",
      phone: "+34 634 567 890",
      level: "Rescue Diver",
      totalDives: 45,
      lastDive: "2024-01-15",
      medicalStatus: "Aprobado",
      nextCheckup: "2024-08-15",
      certifications: ["Open Water", "Advanced Open Water", "Rescue Diver", "Deep Diver"],
      emergencyContact: "Pedro Martín - +34 690 123 456",
      avatar: ""
    },
    {
      id: 4,
      name: "David Rodríguez",
      email: "david.rodriguez@email.com",
      phone: "+34 645 678 901",
      level: "Open Water",
      totalDives: 6,
      lastDive: "2024-01-10",
      medicalStatus: "Vencido",
      nextCheckup: "2024-01-25",
      certifications: ["Open Water"],
      emergencyContact: "Laura Rodríguez - +34 601 234 567",
      avatar: ""
    }
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprobado":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Vencido":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Open Water":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Advanced Open Water":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Rescue Diver":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Gestión de Estudiantes</h1>
            <p className="text-xl text-muted-foreground">
              Administra perfiles, certificaciones y registros médicos
            </p>
          </div>
          <Button size="lg" className="bg-gradient-ocean shadow-depth">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Estudiante
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-8 shadow-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-accent" />
              Buscar Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre, email o nivel de certificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-surface">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total Estudiantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-surface">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {students.filter(s => s.medicalStatus === "Aprobado").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Médicos al día</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-surface">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {students.filter(s => s.medicalStatus === "Pendiente").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Exámenes Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-surface">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {students.reduce((sum, s) => sum + s.totalDives, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Inmersiones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="shadow-surface hover:shadow-depth transition-all duration-300">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback className="bg-gradient-ocean text-primary-foreground text-lg">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-primary">{student.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4" />
                        {student.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {student.phone}
                      </div>
                    </CardDescription>
                  </div>
                  <Badge className={getLevelColor(student.level)}>
                    {student.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status and Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estado Médico</p>
                    <Badge className={getStatusColor(student.medicalStatus)}>
                      {student.medicalStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Inmersiones</p>
                    <span className="font-semibold text-primary">{student.totalDives}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Última inmersión:</span>
                    <span className="text-sm font-medium">{student.lastDive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Próximo chequeo:</span>
                    <span className="text-sm font-medium">{student.nextCheckup}</span>
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Certificaciones:</p>
                  <div className="flex flex-wrap gap-1">
                    {student.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Contacto de emergencia: {student.emergencyContact}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Perfil
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    Ficha Médica
                  </Button>
                  <Button variant="default" size="sm" className="bg-gradient-ocean">
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="shadow-surface">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No se encontraron estudiantes
              </h3>
              <p className="text-muted-foreground">
                Intenta ajustar los criterios de búsqueda o registra un nuevo estudiante.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Estudiantes;