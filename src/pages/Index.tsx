import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Waves, BookOpen, Users, MapPin, Shield, Star, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-diving.jpg";
import oceanPattern from "@/assets/ocean-pattern.jpg";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Registro de Inmersiones",
      description: "Documenta cada inmersión con detalles técnicos, condiciones ambientales y observaciones profesionales."
    },
    {
      icon: Users,
      title: "Gestión de Estudiantes",
      description: "Administra perfiles completos, certificaciones y registros médicos de forma segura y eficiente."
    },
    {
      icon: MapPin,
      title: "Mapas Interactivos",
      description: "Geolocalización precisa de sitios de buceo con integración de mapas y datos ambientales."
    },
    {
      icon: Shield,
      title: "Seguridad Médica",
      description: "Fichas médicas estandarizadas supervisadas por personal paramédico certificado."
    }
  ];

  const testimonials = [
    {
      name: "Captain Marina",
      role: "Centro de Buceo",
      comment: "Ha revolucionado nuestra gestión de estudiantes y registros médicos.",
      rating: 5
    },
    {
      name: "Carlos Instructor",
      role: "Instructor PADI",
      comment: "La plataforma más completa que he usado. Perfecta para profesionales.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
        </div>
        
        <div className="relative z-10 container text-center text-primary-foreground">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              DiveLog Pro
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
              La plataforma profesional para centros de buceo, instructores y estudiantes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 shadow-coral">
                Comenzar Ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-surface">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Todo lo que necesitas para gestionar tu centro de buceo
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Una solución completa que combina seguridad, eficiencia y tecnología de vanguardia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-surface hover:shadow-depth transition-all duration-300 hover:scale-105">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-ocean rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        className="py-20 relative"
        style={{
          backgroundImage: `url(${oceanPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative z-10 container text-primary-foreground">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Diseñado por profesionales, para profesionales
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-accent" />
                  <span className="text-lg">Autenticación segura basada en roles</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-accent" />
                  <span className="text-lg">Registros médicos estandarizados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-accent" />
                  <span className="text-lg">Integración con inteligencia artificial</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-accent" />
                  <span className="text-lg">Dashboard interactivo con gamificación</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-3xl font-bold mb-2">500+</h3>
                  <p className="text-sm">Inmersiones registradas</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-3xl font-bold mb-2">50+</h3>
                  <p className="text-sm">Instructores activos</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-3xl font-bold mb-2">1200+</h3>
                  <p className="text-sm">Estudiantes certificados</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-3xl font-bold mb-2">99.9%</h3>
                  <p className="text-sm">Tiempo de actividad</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-surface">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-surface">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.comment}"
                  </p>
                  <div>
                    <h4 className="font-bold text-primary">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-ocean text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para revolucionar tu centro de buceo?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Únete a cientos de profesionales que ya confían en DiveLog Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Prueba Gratuita
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Contactar Ventas
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
