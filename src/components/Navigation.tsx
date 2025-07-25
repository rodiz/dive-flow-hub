import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Waves, BookOpen, Users, MapPin, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, loading, signOut } = useAuth();

  const navItems = [
    { href: "/", label: "Inicio", icon: Waves },
    { href: "/dashboard", label: "Dashboard", icon: BookOpen },
    { href: "/inmersiones", label: "Inmersiones", icon: MapPin },
    { href: "/estudiantes", label: "Estudiantes", icon: Users },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsOpen(false);
  };

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return userProfile.first_name.charAt(0).toUpperCase() + userProfile.last_name.charAt(0).toUpperCase();
    }
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'instructor':
        return 'Instructor';
      case 'student':
        return 'Estudiante';
      case 'diving_center':
        return 'Centro de Buceo';
      default:
        return 'Usuario';
    }
  };

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

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-ocean text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.role ? getRoleLabel(userProfile.role) : 'Usuario'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-gradient-ocean"
                onClick={() => navigate("/auth")}
              >
                Registrarse
              </Button>
            </>
          )}
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
                {loading ? (
                  <div className="w-full h-10 bg-muted rounded animate-pulse" />
                ) : user ? (
                  <>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-ocean text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {userProfile?.role ? getRoleLabel(userProfile.role) : 'Usuario'}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/perfil"); setIsOpen(false); }}>
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => { navigate("/auth"); setIsOpen(false); }}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                    <Button 
                      variant="default" 
                      className="bg-gradient-ocean justify-start"
                      onClick={() => { navigate("/auth"); setIsOpen(false); }}
                    >
                      Registrarse
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navigation;