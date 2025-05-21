
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
  DropdownMenuGroup,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { cn } from "@/lib/utils";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import type { UserNavItem as UserNavType } from './user-nav-items'; // Renamed import to avoid conflict
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation'; // Import useRouter

type Theme = "light" | "dark" | "system";

interface AppLayoutTextsType {
  searchPlaceholder: string;
  languageChanged: string;
  languageChangedDesc: (lang: string) => string;
  languageSaveError: string;
  searchSubmitted: string;
  searchSubmittedDesc: (query: string) => string;
  mainNavigation: string;
  userNavigation: string; // For mobile sheet
  mobileMenuTitle: string;
  navPanel: string;
  navForums: string;
  navRecovery: string;
  navMaterials: string;
  navSettings: string;
  navMyForums: string;
  navFavorites: string;
  navLogout: string;
  loggedInAs: (name: string) => string;
  loadingUser: string;
}

const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en la plataforma...",
    languageChanged: "Idioma Cambiado",
    languageChangedDesc: (lang: string) => `El idioma de la interfaz ahora es ${lang}.`,
    languageSaveError: "Error al guardar el idioma en la nube.",
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
    loadingUser: "Cargando...",
  },
  en: {
    searchPlaceholder: "Search platform...",
    languageChanged: "Language Changed",
    languageChangedDesc: (lang: string) => `Interface language is now ${lang}.`,
    languageSaveError: "Error saving language preference to the cloud.",
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
    loadingUser: "Loading...",
  }
};


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
  const { user, loading, userProfile, setUserProfileState } = useFirebaseAuth(); 
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const T = appLayoutTexts[currentLanguage];

  const applyTheme = React.useCallback((themeToApply: Theme) => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.remove("light", "dark");
    if (themeToApply === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeToApply === "light") {
      document.documentElement.classList.add("light");
    } else { 
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
  
    let themeToApply: Theme = 'system';
    let langToApply: 'es' | 'en' = 'es';
  
    if (loading) {
      // While Firestore data is loading, apply from localStorage to reduce FOUC
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) applyTheme(storedTheme);
  
      const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
      if (storedLang) setCurrentLanguage(storedLang);
      // Don't return; allow the effect to continue if userProfile becomes available
      // or if loading finishes and userProfile is still null.
    }
  
    // Once loading is false, Firestore data (or lack thereof) is definitive
    if (!loading) {
      if (userProfile) {
        // Firestore is the source of truth
        themeToApply = userProfile.tema || 'system';
        langToApply = userProfile.idioma || 'es';
        localStorage.setItem("theme", themeToApply); // Keep localStorage in sync
        localStorage.setItem("language", langToApply); // Keep localStorage in sync
      } else {
        // No profile from Firestore (e.g., error, or new user before profile creation is fully synced)
        // Fallback to localStorage as the best guess, or set default if nothing in LS
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) {
          themeToApply = storedTheme;
        } else {
          localStorage.setItem("theme", themeToApply); // Store default 'system'
        }
  
        const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
        if (storedLang) {
          langToApply = storedLang;
        } else {
          localStorage.setItem("language", langToApply); // Store default 'es'
        }
      }
    }
    
    applyTheme(themeToApply);
    setCurrentLanguage(langToApply);
  
  }, [userProfile, loading, applyTheme]);


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

    if (user && user.uid && userProfile) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { idioma: lang });
        setUserProfileState({...userProfile, idioma: lang});
      } catch (error) {
        console.error("Error updating language in Firestore:", error);
        toast({ title: "Error", description: T.languageSaveError, variant: "destructive" });
      }
    } else if (user && user.uid) { // User exists, but profile might not be loaded yet or doesn't exist
        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { idioma: lang });
            // If userProfile becomes available later, it will reflect this change
        } catch (error) {
            console.error("Error updating language in Firestore (no profile):", error);
            toast({ title: "Error", description: T.languageSaveError, variant: "destructive" });
        }
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado tu sesión exitosamente." });
      router.push('/home'); // Redirect to home or a login page if you had one
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };
  
  const userNavItemsList: UserNavType[] = [
    { title: T.navSettings, href: '/settings', icon: Settings },
    { title: T.navMyForums, href: '/my-forums', icon: LayoutList, disabled: false }, 
    { title: T.navFavorites, href: '/favorites', icon: Star, disabled: false }, 
    { 
      title: T.navLogout, 
      icon: LogOut, 
      action: handleLogout
    },
  ];


  const getNavItemTitle = (item: NavItem | UserNavType, langT: AppLayoutTextsType) => {
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
    // For items without href (like Logout), check title directly
    const logoutTitleEs = appLayoutTexts.es.navLogout;
    const logoutTitleEn = appLayoutTexts.en.navLogout;
    if (item.title === logoutTitleEs || item.title === logoutTitleEn) {
        return langT.navLogout;
    }

    return item.title;
  };
  
  if (loading && !user) { 
    return (
      <div className="flex min-h-screen w-full animate-pulse">
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/50 px-4 sm:px-6 shadow-sm backdrop-blur-sm">
            <div className="h-8 w-8 bg-muted rounded-md md:hidden"></div> 
            <div className="h-8 w-8 bg-muted rounded-full"></div> 
            <div className="h-6 w-32 bg-muted rounded-md ml-2"></div> 
            <div className="hidden md:flex flex-1 justify-center gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-muted rounded-md"></div>)}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden sm:block h-9 w-48 bg-muted rounded-md"></div> 
              <div className="h-9 w-9 bg-muted rounded-md"></div> 
              <div className="h-9 w-9 bg-muted rounded-md"></div> 
              <div className="h-9 w-9 bg-muted rounded-full"></div> 
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40">
             <div className="h-10 w-1/2 bg-muted rounded-lg mb-4"></div>
             <div className="h-64 w-full bg-muted rounded-lg"></div> 
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
                    <Separator className="my-3"/>
                     <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.userNavigation}</h3>
                    {userNavItemsList.map((item) => ( item.href ?
                      (<SheetClose asChild key={item.title}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                            item.disabled && "opacity-50 cursor-not-allowed",
                            pathname === item.href && !item.disabled && "bg-accent text-primary font-medium"
                          )}
                          onClick={(e) => {
                            if (item.disabled) e.preventDefault();
                            // Close sheet on nav even if disabled, action handles actual prevention
                          }}
                        >
                          <item.icon className="h-4 w-4" />
                          {getNavItemTitle(item, T)}
                        </Link>
                      </SheetClose>) : (
                         <SheetClose asChild key={item.title}>
                          <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                                item.disabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={(e) => {
                                if(item.disabled) {
                                  e.preventDefault();
                                } else if (item.action) {
                                  item.action();
                                }
                            }}
                            disabled={item.disabled}
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
                        <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || "ET"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.displayName || T.loadingUser}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            
            <Link href="/home" className="flex items-center gap-2 md:mr-auto">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                  <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">EC</text>
              </svg>
              <span className="font-bold text-xl text-foreground">EduConnect</span>
            </Link>
            
            <div className="hidden md:flex flex-1 justify-center">
              <DesktopNav currentLanguage={currentLanguage} T={T} pathname={pathname} />
            </div>

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

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuario"} data-ai-hint="user avatar"/>
                        <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || "ET"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{user.displayName || T.loadingUser}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {userNavItemsList.filter(item => item.href).map(item => (
                        <DropdownMenuItem key={item.title} asChild disabled={item.disabled}>
                          <Link href={item.href!} className={cn("flex items-center", item.disabled && "opacity-50 cursor-not-allowed")}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{getNavItemTitle(item, T)}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {userNavItemsList.find(item => item.action) && (
                       <DropdownMenuItem 
                         onClick={!userNavItemsList.find(item => item.action)?.disabled ? userNavItemsList.find(item => item.action)?.action : undefined} 
                         className={cn("cursor-pointer flex items-center", userNavItemsList.find(item => item.action)?.disabled && "opacity-50 cursor-not-allowed")}
                         disabled={userNavItemsList.find(item => item.action)?.disabled}
                        >
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>{getNavItemTitle(userNavItemsList.find(item => item.action)!, T)}</span>
                       </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

    