import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Waves, BookOpen, Users, MapPin, User, LogIn } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Inicio", icon: Waves },
    { href: "/dashboard", label: "Dashboard", icon: BookOpen },
    { href: "/inmersiones", label: "Inmersiones", icon: MapPin },
    { href: "/estudiantes", label: "Estudiantes", icon: Users },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
              ${mobile ? 'w-full justify-start' : 'justify-center'}
              ${
                isActive(item.href)
                  ? 'bg-gradient-ocean text-primary-foreground shadow-depth'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }
            `}
            onClick={() => mobile && setIsOpen(false)}
          >
            <Icon className="w-5 h-5" />
            <span className={mobile ? '' : 'hidden lg:inline'}>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
            <Waves className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            DiveLog Pro
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <NavLinks />
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <LogIn className="w-4 h-4 mr-2" />
            Iniciar Sesión
          </Button>
          <Button variant="default" size="sm" className="bg-gradient-ocean">
            Registrarse
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-4 border-b">
                <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
                  <Waves className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">DiveLog Pro</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <NavLinks mobile />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="ghost" className="justify-start">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button variant="default" className="bg-gradient-ocean justify-start">
                  Registrarse
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navigation;