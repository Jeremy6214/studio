
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // useRouter import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems } from './nav-items'; 
import type { NavItem } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Menu, X, LogOut, Settings, LayoutList, Star, User as UserIcon } from 'lucide-react'; 
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
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'; // setDoc, getDoc
import { db } from '@/lib/firebase'; 
import type { UserNavItem as UserNavType } from './user-nav-items';
import { signOut as firebaseSignOut } from 'firebase/auth'; // Renamed to avoid conflict
import { auth } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { StudyAssistantDialog } from '@/components/ai/study-assistant-dialog'; // Import AI Assistant

type Theme = "light" | "dark" | "system";

interface AppLayoutTextsType {
  searchPlaceholder: string;
  languageChanged: string;
  languageChangedDesc: (lang: string) => string;
  languageSaveError: string;
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
  loggedInAs: (name: string) => string;
  loadingUser: string;
}

const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en la plataforma...",
    languageChanged: "Idioma Cambiado",
    languageChangedDesc: (lang: string) => `El idioma de la interfaz ahora es ${lang}.`,
    languageSaveError: "Error al guardar el idioma.",
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
    languageSaveError: "Error saving language preference.",
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

  const applyTheme = React.useCallback((themeToApply: Theme | undefined) => {
    if (typeof window === 'undefined' || !themeToApply) return;
    document.documentElement.classList.remove("light", "dark");
    if (themeToApply === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeToApply === "light") {
      document.documentElement.classList.add("light");
    } else { 
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  React.useEffect(() => {
    let themeToApply: Theme = 'system';
    let langToApply: 'es' | 'en' = 'es';
  
    if (loading) {
      // While Firestore data is loading, try to apply from localStorage to reduce FOUC
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) applyTheme(storedTheme);
  
      const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
      if (storedLang) setCurrentLanguage(storedLang);
    } else {
      // Once loading is false, userProfile (from Firestore or default) is available
      if (userProfile) {
        themeToApply = userProfile.tema || 'system';
        langToApply = userProfile.idioma || 'es';
        localStorage.setItem("theme", themeToApply);
        localStorage.setItem("language", langToApply);
      } else {
        // No profile from Firestore, fallback to localStorage or defaults
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) {
          themeToApply = storedTheme;
        } else {
          localStorage.setItem("theme", 'system'); 
        }
  
        const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
        if (storedLang) {
          langToApply = storedLang;
        } else {
          localStorage.setItem("language", 'es');
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

    if (user && user.uid) { // User is simulated, UID is "uid_test"
      try {
        const userDocRef = doc(db, "users", user.uid);
        // Ensure document exists before updating, or use setDoc with merge
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            await updateDoc(userDocRef, { idioma: lang });
        } else {
            await setDoc(userDocRef, { idioma: lang }, { merge: true });
        }
        // Update local profile state if available
        if (userProfile) {
            setUserProfileState({...userProfile, idioma: lang});
        } else {
            // If profile wasn't loaded yet but we're setting lang, create minimal profile
             setUserProfileState({ uid: user.uid, nombre: user.displayName || "", correo: user.email || "", idioma: lang, tema: (localStorage.getItem("theme") as Theme || "system")});
        }
      } catch (error) {
        console.error("Error updating language in Firestore:", error);
        toast({ title: "Error", description: T.languageSaveError, variant: "destructive" });
      }
    }
  };
  
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth); // Use renamed import
      toast({ title: "Sesión Cerrada", description: "Has cerrado tu sesión exitosamente." });
      router.push('/home'); // Or redirect to a login page: router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };
  
  const userNavItemsList: UserNavType[] = [
    { title: "Configuración", href: '/settings', icon: Settings }, // Will be translated by getNavItemTitle
    { title: "Mis Foros", href: '/my-forums', icon: LayoutList, disabled: !user }, 
    { title: "Favoritos", href: '/favorites', icon: Star, disabled: !user }, 
    { 
      title: "Cerrar Sesión", // Base title, will be translated
      icon: LogOut, 
      action: handleLogout,
      disabled: !user
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
    const logoutTitleEs = appLayoutTexts.es.navLogout;
    const logoutTitleEn = appLayoutTexts.en.navLogout;
    if (item.title === logoutTitleEs || item.title === logoutTitleEn || item.title === "Cerrar Sesión" || item.title === "Log Out") {
        return langT.navLogout;
    }

    return item.title;
  };
  
  if (loading && !userProfile) { // Show skeleton if loading and no profile yet (initial load)
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
             <Skeleton className="h-10 w-1/2 bg-muted rounded-lg mb-4" />
             <Skeleton className="h-64 w-full bg-muted rounded-lg" /> 
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
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-7 w-7">
                        <rect width="256" height="256" fill="none"></rect>
                        <path d="M41.4,104.6C22.8,123.1,16,144,16,160a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,104.6Z" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                        <path d="M113.4,104.6c18.6-18.5,25.4-39.4,25.4-55.4a64,64,0,0,0-128,0c0,16,6.8,36.9,25.4,55.4a71.8,71.8,0,0,0,50.2,22.1A71.8,71.8,0,0,0,113.4,104.6Z" transform="translate(256 48) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                        <path d="M41.4,151.4c-18.6,18.5-25.4,39.4-25.4,55.4a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,151.4Z" transform="translate(48 256) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                        <path d="M113.4,151.4c-18.6-18.5-25.4-39.4-25.4-55.4a64,64,0,0,1,128,0c0,16,6.8,36.9,25.4,55.4a71.8,71.8,0,0,1-50.2,22.1A71.8,71.8,0,0,1,113.4,151.4Z" transform="translate(256 208) rotate(180)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                    </svg>
                    <span className="font-bold text-lg text-foreground">DarkAISchool</span>
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
                          }}
                          aria-disabled={item.disabled}
                          tabIndex={item.disabled ? -1 : undefined}
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
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8">
                    <rect width="256" height="256" fill="none"></rect>
                    <path d="M41.4,104.6C22.8,123.1,16,144,16,160a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,104.6Z" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                    <path d="M113.4,104.6c18.6-18.5,25.4-39.4,25.4-55.4a64,64,0,0,0-128,0c0,16,6.8,36.9,25.4,55.4a71.8,71.8,0,0,0,50.2,22.1A71.8,71.8,0,0,0,113.4,104.6Z" transform="translate(256 48) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                    <path d="M41.4,151.4c-18.6,18.5-25.4,39.4-25.4,55.4a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,151.4Z" transform="translate(48 256) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                    <path d="M113.4,151.4c-18.6-18.5-25.4-39.4-25.4-55.4a64,64,0,0,1,128,0c0,16,6.8,36.9,25.4,55.4a71.8,71.8,0,0,1-50.2,22.1A71.8,71.8,0,0,1,113.4,151.4Z" transform="translate(256 208) rotate(180)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                </svg>
              <span className="font-bold text-xl text-foreground">DarkAISchool</span>
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

              {loading ? (
                 <Skeleton className="h-9 w-9 rounded-full" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuario"} data-ai-hint="user avatar"/>
                        <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || (user.email ? user.email.substring(0,2).toUpperCase() : "U")}</AvatarFallback>
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
              ) : (
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => router.push('/home')} aria-label={currentLanguage === 'es' ? "Iniciar sesión (Simulado)" : "Log In (Simulated)"}>
                           <UserIcon className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{currentLanguage === 'es' ? "Iniciar sesión (Simulado)" : "Log In (Simulated)"}</p>
                    </TooltipContent>
                 </Tooltip>
              )}
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40 overflow-auto">
            {children}
          </main>
          <StudyAssistantDialog currentLanguage={currentLanguage} />
        </div>
      </div>
    </TooltipProvider>
  );
}
