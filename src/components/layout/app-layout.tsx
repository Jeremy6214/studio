
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
import { cn } from "@/lib/utils"; // Added missing import

// Helper to check if a UserNavItem is active
const isUserNavItemActive = (pathname: string, item: UserNavItem) => {
  if (!item.href) return false;
  return pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home'); // Adjusted for /home
};


function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex gap-1 items-center">
      {navItems.map((item: NavItem) => (
        <Button
          key={item.title}
          asChild
          variant={pathname === item.href || (pathname === '/home' && item.href === '/home') ? "secondary" : "ghost"}
          className="text-sm font-medium"
        >
          <Link href={item.href} className="flex items-center gap-2 px-3 py-2">
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

function UserDesktopSidebar({ currentLanguage }: { currentLanguage: 'es' | 'en' }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const T = appLayoutTexts[currentLanguage];

  const handleUserNavAction = (item: UserNavItem) => {
    if (item.action) {
      item.action();
      if (item.title === "Cerrar Sesión" || item.title === "Log Out") {
         toast({
            title: T.logout,
            description: T.logoutDesc,
          });
      }
    }
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
                {item.title === "Cerrar Sesión" ? T.logout : item.title === "Configuración" ? T.userSettings : item.title === "Mis Foros" ? T.myForums : item.title === "Favoritos" ? T.favorites : item.title}
              </Link>
            ) : (
              <Button
                key={item.title}
                variant="ghost"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent justify-start"
                onClick={() => handleUserNavAction(item)}
              >
                <item.icon className="h-4 w-4" />
                 {item.title === "Cerrar Sesión" ? T.logout : item.title}
              </Button>
            )
          )}
        </nav>
      </ScrollArea>
       <div className="mt-auto p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="Avatar de Usuario" data-ai-hint="user avatar dark"/>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">John Doe</span>
                  <span className="text-xs text-muted-foreground">johndoe@example.com</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56 mb-1"> {/* Changed align to start */}
               <DropdownMenuItem asChild>
                 <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    {T.userSettings}
                 </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                 toast({ title: T.logout, description: T.logoutDesc });
                 // Actual logout logic
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                {T.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </aside>
  );
}


const appLayoutTexts = {
  es: {
    searchPlaceholder: "Buscar en la plataforma...",
    logout: "Cerrar Sesión",
    languageChanged: "Idioma Cambiado (Simulación)",
    languageChangedDesc: (lang: string) => `El idioma de los elementos clave se ha cambiado a ${lang}. Una traducción completa requiere i18n.`,
    searchSubmitted: "Búsqueda Enviada",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". Funcionalidad de búsqueda no implementada.`,
    logoutDesc: "Funcionalidad de cerrar sesión no implementada.",
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
  },
  en: {
    searchPlaceholder: "Search platform...",
    logout: "Log Out",
    languageChanged: "Language Changed (Simulation)",
    languageChangedDesc: (lang: string) => `Key element language changed to ${lang}. Full translation requires i18n.`,
    searchSubmitted: "Search Submitted",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". Search functionality not implemented.`,
    logoutDesc: "Logout functionality not implemented.",
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
  }
};


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const pathname = usePathname();

  const T = appLayoutTexts[currentLanguage];

  React.useEffect(() => {
    // Apply theme from localStorage on initial load
    const themeSetting = localStorage.getItem("themeSetting") || "system";
    if (themeSetting === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else if (themeSetting === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else { // System
      localStorage.removeItem("theme"); 
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);
  
  React.useEffect(() => {
    // Close sheet on route change
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
    localStorage.setItem("language", lang); // Save language preference
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });
  };
  
  // Effect to load language preference from localStorage
  React.useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as 'es' | 'en' | null;
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
  }, []);

  const handleUserNavActionMobile = (item: UserNavItem) => {
    if (item.action) {
      item.action();
      if (item.title === "Cerrar Sesión" || item.title === "Log Out") {
         toast({
            title: T.logout,
            description: T.logoutDesc,
          });
      }
    }
    setIsMobileSheetOpen(false); // Close sheet after action
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
      <UserDesktopSidebar currentLanguage={currentLanguage} />
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
                          pathname === item.href && "bg-accent text-primary"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {getNavItemTitle(item)}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                
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
              </ScrollArea>
              <div className="mt-auto p-4 border-t">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="https://placehold.co/100x100.png" alt="Avatar de Usuario" data-ai-hint="user avatar"/>
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-foreground">John Doe</span>
                          <span className="text-xs text-muted-foreground">johndoe@example.com</span>
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
                        handleUserNavActionMobile({title: "Cerrar Sesión", icon: LogOut, action: () => {}});
                      }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {T.logout}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
             <DesktopNav />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="Avatar de Usuario" data-ai-hint="user avatar dark"/>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">{T.userMenuLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">John Doe</span>
                      <span className="text-xs text-muted-foreground">johndoe@example.com</span>
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
                      toast({ title: T.logout, description: T.logoutDesc });
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {T.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

