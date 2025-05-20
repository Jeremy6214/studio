
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems } from './nav-items'; 
// import { userNavItems } from './user-nav-items'; // User nav items no son relevantes sin login
import type { NavItem } from './nav-items';
// import type { UserNavItem } from './user-nav-items'; // No se usa UserNavItem
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Search, Globe, Menu, Settings, User, Home, MessageSquareText, LifeBuoy, Archive, LayoutList, Star, X, UserCircle } from 'lucide-react'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
// import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // Ya no se usa Firebase Auth
import { Skeleton } from '@/components/ui/skeleton';

// Helper to check if a UserNavItem is active - no longer needed as userNavItems are removed/simplified
// const isUserNavItemActive = (pathname: string, item: UserNavItem) => { ... }


function DesktopNav({ currentLanguage, T }: { currentLanguage: 'es' | 'en', T: AppLayoutTextsType}) {
  const pathname = usePathname();
  
  const getNavItemTitle = (item: NavItem) => {
    switch (item.href) {
      case '/home': return T.navPanel;
      case '/forums': return T.navForums;
      case '/recovery-access': return T.navRecovery;
      case '/study-materials': return T.navMaterials;
      default: return item.title;
    }
  };

  return (
    <nav className="hidden md:flex gap-1 items-center">
      {navItems.map((item: NavItem) => (
        <Button
          key={item.title}
          asChild
          variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home') ? "secondary" : "ghost"}
          className="text-sm font-medium"
        >
          <Link href={item.href} className="flex items-center gap-2 px-3 py-2">
            <item.icon className="h-4 w-4" />
            {getNavItemTitle(item)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

// UserDesktopSidebar removido ya que no hay sesión de usuario ni items de usuario.
// function UserDesktopSidebar({ currentLanguage, T }: { currentLanguage: 'es' | 'en', T: AppLayoutTextsType }) { ... }


interface AppLayoutTextsType {
  searchPlaceholder: string;
  logout: string; // Mantener por si se reutiliza, pero la funcionalidad cambia
  languageChanged: string;
  languageChangedDesc: (lang: string) => string;
  searchSubmitted: string;
  searchSubmittedDesc: (query: string) => string;
  logoutDesc: string; // Mantener por si se reutiliza
  userMenuLabel: string;
  userSettings: string;
  myForums: string;
  favorites: string;
  mainNavigation: string;
  userNavigation: string; // Ya no es tan relevante
  mobileMenuTitle: string;
  navPanel: string;
  navForums: string;
  navRecovery: string;
  navMaterials: string;
  loginToSeeOptions?: string;
  login?: string;
}


const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en la plataforma...",
    logout: "Cerrar Sesión", // Se podría cambiar a "Iniciar Sesión" si hay una página
    languageChanged: "Idioma Cambiado (Simulación)",
    languageChangedDesc: (lang: string) => `El idioma de los elementos clave se ha cambiado a ${lang}. Una traducción completa requiere i18n.`,
    searchSubmitted: "Búsqueda Enviada",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". Funcionalidad de búsqueda no implementada.`,
    logoutDesc: "Has cerrado sesión.", // Este mensaje ya no aplica directamente
    userMenuLabel: "Menú de usuario", // Ya no aplica
    userSettings: "Configuración", // Ya no aplica
    myForums: "Mis Foros", // Ya no aplica
    favorites: "Favoritos", // Ya no aplica
    mainNavigation: "Navegación Principal",
    userNavigation: "Navegación de Usuario", // Ya no aplica
    mobileMenuTitle: "EduConnect Menú",
    navPanel: "Panel",
    navForums: "Foros",
    navRecovery: "Acceso de Recuperación",
    navMaterials: "Materiales de Estudio",
    loginToSeeOptions: "Funcionalidades de usuario desactivadas.", // Cambiado
    login: "Iniciar Sesión", // Podría ser un link a una página de info
  },
  en: {
    searchPlaceholder: "Search platform...",
    logout: "Log Out", // Could change to "Log In"
    languageChanged: "Language Changed (Simulation)",
    languageChangedDesc: (lang: string) => `Key element language changed to ${lang}. Full translation requires i18n.`,
    searchSubmitted: "Search Submitted",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". Search functionality not implemented.`,
    logoutDesc: "You have been logged out.", // No longer directly applicable
    userMenuLabel: "User menu", // N/A
    userSettings: "Settings", // N/A
    myForums: "My Forums", // N/A
    favorites: "Favorites", // N/A
    mainNavigation: "Main Navigation",
    userNavigation: "User Navigation", // N/A
    mobileMenuTitle: "EduConnect Menu",
    navPanel: "Dashboard",
    navForums: "Forums",
    navRecovery: "Recovery Access",
    navMaterials: "Study Materials",
    loginToSeeOptions: "User features disabled.", // Changed
    login: "Log In", // Could link to an info page
  }
};


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const pathname = usePathname();
  // const { user, loading: authLoading } = useFirebaseAuth(); // No auth
  const authLoading = false; // Simular que la carga ha terminado
  const user = null; // Simular que no hay usuario

  const T = appLayoutTexts[currentLanguage];

  React.useEffect(() => {
    const themeSetting = localStorage.getItem("themeSetting") || "system";
    const theme = localStorage.getItem("theme"); 

    if (themeSetting === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
  
  React.useEffect(() => {
    setIsMobileSheetOpen(false);
  }, [pathname]);


  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if(searchQuery.trim()){
      toast({
        title: T.searchSubmitted,
        description: T.searchSubmittedDesc(searchQuery),
      });
    }
  };

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setCurrentLanguage(lang);
    localStorage.setItem("language", lang); 
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });
    // Disparar evento personalizado para que otros componentes (como SettingsForm) puedan reaccionar si es necesario
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
    }
  };
  
  React.useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as 'es' | 'en' | null;
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
    
    // Escuchar cambios de idioma desde SettingsForm (si aún se usa para esto)
    const languageUpdateHandler = (event: Event) => {
        const newLang = (event as CustomEvent).detail as 'es' | 'en';
        if (newLang && (newLang === 'es' || newLang === 'en')) {
            setCurrentLanguage(newLang);
        }
    };
    window.addEventListener('languageChange', languageUpdateHandler);
    return () => {
        window.removeEventListener('languageChange', languageUpdateHandler);
    };

  }, []);


  const getNavItemTitle = (item: NavItem) => {
    switch (item.href) {
      case '/home': return T.navPanel;
      case '/forums': return T.navForums;
      case '/recovery-access': return T.navRecovery;
      case '/study-materials': return T.navMaterials;
      default: return item.title;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* UserDesktopSidebar removido */}
      <div className="flex flex-col flex-1"> {/* md:ml-60 removido */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú de navegación</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 max-w-xs w-full sm:max-w-sm bg-card border-r">
              <div className="flex h-16 items-center justify-between px-4 border-b">
                 <Link href="/home" className="flex items-center gap-2" onClick={() => setIsMobileSheetOpen(false)}>
                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                      <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                        EC
                      </text>
                    </svg>
                    <span className="font-bold text-lg text-foreground">EduConnect</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Cerrar menú</span>
                    </Button>
                  </SheetClose>
              </div>

              <ScrollArea className="flex-1">
                <nav className="grid gap-2 p-4">
                  <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.mainNavigation}</h3>
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.title}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                          (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home')) && "bg-accent text-primary"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {getNavItemTitle(item)}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                {/* Sección de UserNavigation removida del sheet móvil */}
              </ScrollArea>
              {/* Footer del sheet móvil simplificado o removido (sin info de usuario) */}
               <div className="mt-auto p-4 border-t">
                <p className="text-xs text-muted-foreground text-center">{T.loginToSeeOptions}</p>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/home" className="flex items-center gap-2 md:mr-auto"> {/* md:hidden removido, md:mr-auto añadido */}
             <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                  EC
                </text>
              </svg>
            <span className="font-bold text-xl text-foreground">EduConnect</span>
          </Link>
          
          <div className="hidden md:flex flex-1 justify-center"> {/* Esto centra el DesktopNav */}
             <DesktopNav currentLanguage={currentLanguage} T={T} />
          </div>

          <div className="flex items-center gap-3 ml-auto"> {/* ml-auto para empujar a la derecha */}
            <form className="hidden sm:block" onSubmit={handleSearchSubmit}> 
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder={T.searchPlaceholder}
                  className="pl-8 w-full sm:w-[200px] md:w-[250px] lg:w-[300px] bg-input border-input"
                />
              </div>
            </form>
            <ThemeToggleButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Cambiar idioma" className="text-foreground hover:text-accent-foreground hover:bg-accent">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLanguageChange('es')}>
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sección de Avatar/Dropdown de Usuario removida del header de escritorio */}
            {/* Se podría poner un botón genérico "Iniciar Sesión" si se desea */}
            {/* <Button variant="outline">{currentLanguage === 'es' ? T.login : 'Log In'}</Button> */}
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
