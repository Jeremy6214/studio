
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems } from './nav-items'; 
import type { NavItem } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Menu, X } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { cn } from "@/lib/utils";
// user-nav-items are not used as Firebase Auth was removed.
// import { userNavItems } from './user-nav-items';
// import type { UserNavItem } from './user-nav-items';

// Simplified texts, as Firebase Auth and user-specific items were removed.
interface AppLayoutTextsType {
  searchPlaceholder: string;
  languageChanged: string;
  languageChangedDesc: (lang: string) => string;
  searchSubmitted: string;
  searchSubmittedDesc: (query: string) => string;
  mainNavigation: string;
  mobileMenuTitle: string;
  navPanel: string;
  navForums: string;
  navRecovery: string;
  navMaterials: string;
  loginToSeeOptions?: string;
}

const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en la plataforma...",
    languageChanged: "Idioma Cambiado (Simulación)",
    languageChangedDesc: (lang: string) => `El idioma de los elementos clave se ha cambiado a ${lang}. Una traducción completa requiere i18n.`,
    searchSubmitted: "Búsqueda Enviada",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". Funcionalidad de búsqueda no implementada.`,
    mainNavigation: "Navegación Principal",
    mobileMenuTitle: "EduConnect Menú",
    navPanel: "Panel",
    navForums: "Foros",
    navRecovery: "Acceso de Recuperación",
    navMaterials: "Materiales de Estudio",
    loginToSeeOptions: "Funcionalidades de usuario desactivadas.",
  },
  en: {
    searchPlaceholder: "Search platform...",
    languageChanged: "Language Changed (Simulation)",
    languageChangedDesc: (lang: string) => `Key element language changed to ${lang}. Full translation requires i18n.`,
    searchSubmitted: "Search Submitted",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". Search functionality not implemented.`,
    mainNavigation: "Main Navigation",
    mobileMenuTitle: "EduConnect Menu",
    navPanel: "Dashboard",
    navForums: "Forums",
    navRecovery: "Recovery Access",
    navMaterials: "Study Materials",
    loginToSeeOptions: "User features disabled.",
  }
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const T = appLayoutTexts[currentLanguage];

  React.useEffect(() => {
    // Apply theme from localStorage on initial client load
    // This ensures consistency if ThemeToggleButton has stored a preference.
    if (typeof window !== 'undefined') {
      const themeFromStorage = localStorage.getItem("theme");
      if (themeFromStorage === "dark") {
          document.documentElement.classList.add("dark");
      } else if (themeFromStorage === "light") {
          document.documentElement.classList.remove("dark");
      } else { // No theme in localStorage, or it's 'system' (legacy if 'themeSetting' was used)
          // Default to system preference on first load if nothing is stored
          if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
              document.documentElement.classList.add("dark");
          } else {
              document.documentElement.classList.remove("dark");
          }
      }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem("language", lang); 
    }
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });
  };
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem("language") as 'es' | 'en' | null;
      if (storedLanguage) {
        setCurrentLanguage(storedLanguage);
      }
    }
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
      {/* UserDesktopSidebar was removed in a previous step. The hydration error indicates the server might be rendering it. */}
      <div className="flex flex-col flex-1"> {/* This is the structure the client expects */}
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
              </ScrollArea>
               <div className="mt-auto p-4 border-t">
                <p className="text-xs text-muted-foreground text-center">{T.loginToSeeOptions}</p>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/home" className="flex items-center gap-2 md:mr-auto">
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
                <Input
                  type="search"
                  name="search"
                  placeholder={T.searchPlaceholder}
                  className="pl-8 w-full sm:w-[200px] md:w-[250px] lg:w-[300px] bg-input border-input"
                />
                <span className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
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
                <DropdownMenuItem onClick={() => handleLanguageChange('es')}>
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

    