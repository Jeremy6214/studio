
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems } from './nav-items'; 
import type { NavItem } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Menu, X, LogOut, Settings, LayoutList, Star } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { cn } from "@/lib/utils";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // Importar hook
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; // serverTimestamp para Firestore
import { db } from '@/lib/firebase'; // Importar db


// Textos para internacionalización simulada
interface AppLayoutTextsType {
  searchPlaceholder: string;
  languageChanged: string;
  languageChangedDesc: (lang: string) => string;
  searchSubmitted: string;
  searchSubmittedDesc: (query: string) => string;
  mainNavigation: string;
  userNavigation: string;
  mobileMenuTitle: string;
  navPanel: string;
  navForums: string;
  navRecovery: string;
  navMaterials: string;
  navSettings: string;
  navMyForums: string;
  navFavorites: string;
  navLogout: string;
  loginToSeeOptions?: string;
  loggedInAs: (name: string) => string;
}

const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en la plataforma...",
    languageChanged: "Idioma Cambiado",
    languageChangedDesc: (lang: string) => `El idioma de la interfaz ahora es ${lang}.`,
    searchSubmitted: "Búsqueda Enviada (Simulada)",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". La funcionalidad completa de búsqueda no está implementada.`,
    mainNavigation: "Navegación Principal",
    userNavigation: "Navegación de Usuario",
    mobileMenuTitle: "EduConnect Menú",
    navPanel: "Panel",
    navForums: "Foros",
    navRecovery: "Acceso de Recuperación",
    navMaterials: "Materiales de Estudio",
    navSettings: "Configuración",
    navMyForums: "Mis Foros",
    navFavorites: "Favoritos",
    navLogout: "Cerrar Sesión",
    loggedInAs: (name: string) => `Sesión iniciada como ${name}`,
  },
  en: {
    searchPlaceholder: "Search platform...",
    languageChanged: "Language Changed",
    languageChangedDesc: (lang: string) => `Interface language is now ${lang}.`,
    searchSubmitted: "Search Submitted (Simulated)",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". Full search functionality not implemented.`,
    mainNavigation: "Main Navigation",
    userNavigation: "User Navigation",
    mobileMenuTitle: "EduConnect Menu",
    navPanel: "Dashboard",
    navForums: "Forums",
    navRecovery: "Recovery Access",
    navMaterials: "Study Materials",
    navSettings: "Settings",
    navMyForums: "My Forums",
    navFavorites: "Favorites",
    navLogout: "Log Out",
    loggedInAs: (name: string) => `Logged in as ${name}`,
  }
};

// Definición de UserNavItem para el menú de usuario
export interface UserNavItem {
  title: string;
  href?: string;
  icon: React.ElementType; // Usar React.ElementType para componentes de icono
  action?: () => void | Promise<void>;
  disabled?: boolean;
}


function DesktopNav({ currentLanguage, T, pathname }: { currentLanguage: 'es' | 'en', T: AppLayoutTextsType, pathname: string}) {
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, loading, userProfile, setUserProfileState } = useFirebaseAuth(); // Hook con perfil simulado
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const T = appLayoutTexts[currentLanguage];

  // Aplicar tema e idioma desde Firestore/localStorage al cargar
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      let themeToApply: 'light' | 'dark' | 'system' = 'system';
      let langToApply: 'es' | 'en' = 'es';

      if (userProfile) {
        themeToApply = userProfile.tema || 'system';
        langToApply = userProfile.idioma || 'es';
      } else {
        themeToApply = (localStorage.getItem("theme") as 'light' | 'dark' | 'system') || 'system';
        langToApply = (localStorage.getItem("language") as 'es' | 'en') || 'es';
      }
      
      document.documentElement.classList.remove("light", "dark");
      if (themeToApply === "dark") {
        document.documentElement.classList.add("dark");
      } else if (themeToApply === "light") {
        document.documentElement.classList.add("light");
      } else { // system
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
      setCurrentLanguage(langToApply);
    }
  }, [userProfile]); // Depende de userProfile para cargar preferencias de Firestore

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

  const handleLanguageChange = async (lang: 'es' | 'en') => {
    setCurrentLanguage(lang);
    localStorage.setItem("language", lang); 
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });

    if (user && user.uid) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { idioma: lang });
        if(userProfile) setUserProfileState({...userProfile, idioma: lang});
      } catch (error) {
        console.error("Error updating language in Firestore:", error);
        // No mostrar toast de error aquí para no ser intrusivo,
        // la preferencia local ya se guardó.
      }
    }
  };
  
  // Items del menú de usuario
  const userNavItemsList: UserNavItem[] = [
    { title: T.navSettings, href: '/settings', icon: Settings },
    { title: T.navMyForums, href: '/my-forums', icon: LayoutList },
    { title: T.navFavorites, href: '/favorites', icon: Star },
    { 
      title: T.navLogout, 
      icon: LogOut, 
      action: async () => {
        // En un sistema real: await firebaseSignOut(auth); router.push('/login');
        toast({ title: "Cierre de Sesión (Simulado)", description: "Has cerrado tu sesión."});
        // Aquí se podría limpiar el userProfile local si fuera necesario
      } 
    },
  ];


  const getNavItemTitle = (item: NavItem | UserNavItem, langT: AppLayoutTextsType) => {
    if ('href' in item && item.href) {
      switch (item.href) {
        case '/home': return langT.navPanel;
        case '/forums': return langT.navForums;
        case '/recovery-access': return langT.navRecovery;
        case '/study-materials': return langT.navMaterials;
        case '/settings': return langT.navSettings;
        case '/my-forums': return langT.navMyForums;
        case '/favorites': return langT.navFavorites;
        default: return item.title;
      }
    }
    // Para items sin href (como Cerrar Sesión)
    if (item.title === T.navLogout || item.title === appLayoutTexts.en.navLogout) return langT.navLogout;

    return item.title;
  };
  
  if (loading && !user) { // Mostrar un esqueleto o loader si está cargando el usuario inicial
    return (
      <div className="flex min-h-screen w-full animate-pulse">
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/50 px-4 sm:px-6 shadow-sm">
            <div className="h-8 w-8 bg-muted rounded-md md:hidden"></div> {/* Mobile menu icon placeholder */}
            <div className="h-8 w-8 bg-muted rounded-full"></div> {/* Logo placeholder */}
            <div className="h-6 w-32 bg-muted rounded-md ml-2"></div> {/* App name placeholder */}
            <div className="hidden md:flex flex-1 justify-center gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-muted rounded-md"></div>)}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden sm:block h-9 w-48 bg-muted rounded-md"></div> {/* Search placeholder */}
              <div className="h-9 w-9 bg-muted rounded-md"></div> {/* Theme toggle placeholder */}
              <div className="h-9 w-9 bg-muted rounded-md"></div> {/* Language toggle placeholder */}
              <div className="h-9 w-9 bg-muted rounded-full"></div> {/* User avatar placeholder */}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background/30">
             <div className="h-64 w-full bg-muted rounded-lg"></div> {/* Content placeholder */}
          </main>
        </div>
      </div>
    );
  }


  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
            {/* Mobile Sheet Trigger */}
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
                    <Button variant="ghost" size="icon"> <X className="h-5 w-5" /> <span className="sr-only">Cerrar menú</span></Button>
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
                            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home')) && "bg-accent text-primary font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {getNavItemTitle(item, T)}
                        </Link>
                      </SheetClose>
                    ))}
                    {/* User navigation in mobile sheet */}
                    <Separator className="my-3"/>
                     <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.userNavigation}</h3>
                    {userNavItemsList.map((item) => ( item.href ?
                      (<SheetClose asChild key={item.title}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                            pathname === item.href && "bg-accent text-primary font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {getNavItemTitle(item, T)}
                        </Link>
                      </SheetClose>) : (
                         <SheetClose asChild key={item.title}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent"
                            onClick={item.action}
                          >
                            <item.icon className="h-4 w-4" />
                            {getNavItemTitle(item, T)}
                          </Button>
                        </SheetClose>
                      )
                    ))}
                  </nav>
                </ScrollArea>
                {user && (
                  <div className="mt-auto p-4 border-t">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuario"} data-ai-hint="user avatar"/>
                        <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.displayName || "Usuario Anónimo"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            
            {/* Logo and App Name */}
            <Link href="/home" className="flex items-center gap-2 md:mr-auto">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                  <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">EC</text>
              </svg>
              <span className="font-bold text-xl text-foreground">EduConnect</span>
            </Link>
            
            {/* Desktop Main Navigation */}
            <div className="hidden md:flex flex-1 justify-center">
              <DesktopNav currentLanguage={currentLanguage} T={T} pathname={pathname} />
            </div>

            {/* Right side of Header */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <form className="hidden sm:block" onSubmit={handleSearchSubmit}> 
                <div className="relative">
                  <Input
                    type="search"
                    name="search"
                    placeholder={T.searchPlaceholder}
                    className="pl-8 w-full sm:w-[200px] md:w-[250px] lg:w-[300px] bg-input border-input h-9"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </span>
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
                  <DropdownMenuItem onClick={() => handleLanguageChange('es')}>Español</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('en')}>English</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar and Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuario"} data-ai-hint="user avatar"/>
                        <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{user.displayName || "Usuario Anónimo"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {userNavItemsList.filter(item => item.href).map(item => (
                        <DropdownMenuItem key={item.title} asChild>
                          <Link href={item.href!} className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{getNavItemTitle(item, T)}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {userNavItemsList.find(item => item.action) && (
                       <DropdownMenuItem onClick={userNavItemsList.find(item => item.action)?.action} className="cursor-pointer flex items-center">
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>{T.navLogout}</span>
                       </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
