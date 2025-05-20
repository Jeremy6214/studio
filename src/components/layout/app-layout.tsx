
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems } from './nav-items'; 
import { userNavItems } from './user-nav-items'; 
import type { NavItem } from './nav-items';
import type { UserNavItem } from './user-nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Search, Globe, Menu, Settings, User, Home, MessageSquareText, LifeBuoy, Archive, LayoutList, Star, X } from 'lucide-react'; 
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
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // Import useFirebaseAuth
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton


// Helper to check if a UserNavItem is active
const isUserNavItemActive = (pathname: string, item: UserNavItem) => {
  if (!item.href) return false;
  // Exact match for /settings, prefix for others to cover potential sub-routes
  if (item.href === '/settings') return pathname === item.href;
  return pathname.startsWith(item.href) && item.href !== '/home';
};


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

function UserDesktopSidebar({ currentLanguage, T }: { currentLanguage: 'es' | 'en', T: AppLayoutTextsType }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, loading: authLoading, userId } = useFirebaseAuth(); // Get user state

  const handleUserNavAction = (item: UserNavItem) => {
    if (item.action) {
      item.action(); // This will call Firebase signOut
      toast({
        title: T.logout,
        description: T.logoutDesc,
      });
    }
  };

  const getUserNavItemTitle = (item: UserNavItem) => {
    if (item.title === "Cerrar Sesión") return T.logout;
    if (item.title === "Configuración") return T.userSettings;
    if (item.title === "Mis Foros") return T.myForums;
    if (item.title === "Favoritos") return T.favorites;
    return item.title;
  };
  
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col border-r bg-card">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/home" className="flex items-center gap-2">
           <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
              <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                EC
              </text>
            </svg>
          <span className="font-bold text-xl text-foreground">EduConnect</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        {authLoading ? (
          <div className="grid items-start px-4 text-sm font-medium gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
          </div>
        ) : user && userId ? (
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {userNavItems.map((item) =>
              item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                    isUserNavItemActive(pathname, item) && "bg-accent text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {getUserNavItemTitle(item)}
                </Link>
              ) : (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent justify-start"
                  onClick={() => handleUserNavAction(item)}
                >
                  <item.icon className="h-4 w-4" />
                  {getUserNavItemTitle(item)}
                </Button>
              )
            )}
          </nav>
        ) : (
           <div className="px-4 py-2 text-sm text-muted-foreground">
             {T.loginToSeeOptions || "Inicia sesión para ver más opciones."}
           </div>
        )}
      </ScrollArea>
       <div className="mt-auto p-4 border-t">
          {authLoading ? (
             <div className="flex items-center gap-2">
               <Skeleton className="h-10 w-10 rounded-full" />
               <div className="space-y-1">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-3 w-32" />
               </div>
             </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt="Avatar de Usuario" data-ai-hint="user avatar dark"/>
                    <AvatarFallback>{user.displayName?.substring(0,1) || user.email?.substring(0,1) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start truncate">
                    <span className="text-sm font-medium text-foreground truncate">{user.displayName || "Usuario"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email || "Sin correo"}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 mb-1">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      {T.userSettings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const logoutAction = userNavItems.find(item => item.title === "Cerrar Sesión")?.action;
                  if (logoutAction) logoutAction();
                  toast({ title: T.logout, description: T.logoutDesc });
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {T.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Link href="/login"> {/* Assume a /login route exists or will be created */}
                <Button variant="default" className="w-full">{T.login || "Iniciar Sesión"}</Button>
             </Link>
          )}
        </div>
    </aside>
  );
}

interface AppLayoutTextsType {
  searchPlaceholder: string;
  logout: string;
  languageChanged: string;
  languageChangedDesc: (lang: string) => string;
  searchSubmitted: string;
  searchSubmittedDesc: (query: string) => string;
  logoutDesc: string;
  userMenuLabel: string;
  userSettings: string;
  myForums: string;
  favorites: string;
  mainNavigation: string;
  userNavigation: string;
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
    logout: "Cerrar Sesión",
    languageChanged: "Idioma Cambiado (Simulación)",
    languageChangedDesc: (lang: string) => `El idioma de los elementos clave se ha cambiado a ${lang}. Una traducción completa requiere i18n.`,
    searchSubmitted: "Búsqueda Enviada",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". Funcionalidad de búsqueda no implementada.`,
    logoutDesc: "Has cerrado sesión.",
    userMenuLabel: "Menú de usuario",
    userSettings: "Configuración",
    myForums: "Mis Foros",
    favorites: "Favoritos",
    mainNavigation: "Navegación Principal",
    userNavigation: "Navegación de Usuario",
    mobileMenuTitle: "EduConnect Menú",
    navPanel: "Panel",
    navForums: "Foros",
    navRecovery: "Acceso de Recuperación",
    navMaterials: "Materiales de Estudio",
    loginToSeeOptions: "Inicia sesión para ver más opciones.",
    login: "Iniciar Sesión",
  },
  en: {
    searchPlaceholder: "Search platform...",
    logout: "Log Out",
    languageChanged: "Language Changed (Simulation)",
    languageChangedDesc: (lang: string) => `Key element language changed to ${lang}. Full translation requires i18n.`,
    searchSubmitted: "Search Submitted",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". Search functionality not implemented.`,
    logoutDesc: "You have been logged out.",
    userMenuLabel: "User menu",
    userSettings: "Settings",
    myForums: "My Forums",
    favorites: "Favorites",
    mainNavigation: "Main Navigation",
    userNavigation: "User Navigation",
    mobileMenuTitle: "EduConnect Menu",
    navPanel: "Dashboard",
    navForums: "Forums",
    navRecovery: "Recovery Access",
    navMaterials: "Study Materials",
    loginToSeeOptions: "Log in to see more options.",
    login: "Log In",
  }
};


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const { user, loading: authLoading } = useFirebaseAuth(); // Get user state

  const T = appLayoutTexts[currentLanguage];

  React.useEffect(() => {
    const themeSetting = localStorage.getItem("themeSetting") || "system";
    const theme = localStorage.getItem("theme"); // Actual theme applied (light/dark)

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
  };
  
  React.useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as 'es' | 'en' | null;
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
  }, []);

  const handleUserNavActionMobile = (item: UserNavItem) => {
    if (item.action) {
      item.action();
       toast({
            title: T.logout,
            description: T.logoutDesc,
          });
    }
    setIsMobileSheetOpen(false);
  };

  const getNavItemTitle = (item: NavItem) => {
    switch (item.href) {
      case '/home': return T.navPanel;
      case '/forums': return T.navForums;
      case '/recovery-access': return T.navRecovery;
      case '/study-materials': return T.navMaterials;
      default: return item.title;
    }
  };

  const getUserNavItemTitle = (item: UserNavItem) => {
    if (item.title === "Cerrar Sesión") return T.logout;
    if (item.title === "Configuración") return T.userSettings;
    if (item.title === "Mis Foros") return T.myForums;
    if (item.title === "Favoritos") return T.favorites;
    return item.title;
  };


  return (
    <div className="flex min-h-screen w-full">
      <UserDesktopSidebar currentLanguage={currentLanguage} T={T} />
      <div className="flex flex-col flex-1 md:ml-60"> 
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
                
                {user && (
                  <>
                    <Separator className="my-2" />
                    <nav className="grid gap-2 p-4">
                      <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.userNavigation}</h3>
                      {userNavItems.map((item) =>
                        item.href ? (
                          <SheetClose asChild key={item.title}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                                isUserNavItemActive(pathname, item) && "bg-accent text-primary"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                              {getUserNavItemTitle(item)}
                            </Link>
                          </SheetClose>
                        ) : (
                          <SheetClose asChild key={item.title}>
                              <Button
                                variant="ghost"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent justify-start w-full"
                                onClick={() => handleUserNavActionMobile(item)}
                              >
                                <item.icon className="h-4 w-4" />
                                {getUserNavItemTitle(item)}
                              </Button>
                            </SheetClose>
                        )
                      )}
                    </nav>
                  </>
                )}
              </ScrollArea>
              <div className="mt-auto p-4 border-t">
                {authLoading ? (
                  <Skeleton className="h-10 w-full rounded-lg" />
                ) : user ? (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt="Avatar de Usuario" data-ai-hint="user avatar"/>
                            <AvatarFallback>{user.displayName?.substring(0,1) || user.email?.substring(0,1) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start truncate">
                            <span className="text-sm font-medium text-foreground truncate">{user.displayName || "Usuario"}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email || "Sin correo"}</span>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="w-56 mb-1">
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center" onClick={() => setIsMobileSheetOpen(false)}>
                              <Settings className="mr-2 h-4 w-4" />
                              {T.userSettings}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          const logoutAction = userNavItems.find(item => item.title === "Cerrar Sesión")?.action;
                          if (logoutAction) handleUserNavActionMobile({title: "Cerrar Sesión", icon: LogOut, action: logoutAction});
                        }}>
                          <LogOut className="mr-2 h-4 w-4" />
                          {T.logout}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileSheetOpen(false)}>
                    <Button variant="default" className="w-full">{T.login}</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/home" className="flex items-center gap-2 md:hidden">
             <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                  EC
                </text>
              </svg>
            <span className="font-bold text-xl text-foreground">EduConnect</span>
          </Link>
          
          <div className="hidden md:flex flex-1 justify-center">
             <DesktopNav currentLanguage={currentLanguage} T={T} />
          </div>

          <div className="flex items-center gap-3 ml-auto">
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
            
            <div className="hidden md:block">
              {authLoading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt="Avatar de Usuario" data-ai-hint="user avatar dark"/>
                        <AvatarFallback>{user.displayName?.substring(0,1) || user.email?.substring(0,1) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="sr-only">{T.userMenuLabel}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate">{user.displayName || "Usuario"}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email || "Sin correo"}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          {T.userSettings}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                        const logoutAction = userNavItems.find(item => item.title === "Cerrar Sesión")?.action;
                        if (logoutAction) logoutAction();
                        toast({ title: T.logout, description: T.logoutDesc });
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {T.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
               ) : (
                 <Link href="/login"> {/* Assume a /login route exists or will be created */}
                    <Button variant="link">{T.login}</Button>
                 </Link>
               )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
