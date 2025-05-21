
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems as mainNavItemsData } from './nav-items';
import type { NavItem } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Menu, X, LogOutIcon, BrainCircuit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger, // Added missing import
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
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile as UserProfileType } from "@/types/firestore";
import type { UserNavItem } from './user-nav-items';
import { userNavItemsListDetails } from './user-nav-items';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

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
  navAiAssistant: string;
  navMyForums: string;
  navFavorites: string;
  navLogout: string;
  loggedInAs: (name: string) => string;
  loadingUser: string;
  loginSimulated: string;
}

const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en DarkAISchool...",
    languageChanged: "Idioma Cambiado",
    languageChangedDesc: (lang: string) => `La interfaz ahora está en ${lang}.`,
    languageSaveError: "Error al guardar el idioma.",
    searchSubmitted: "Búsqueda Enviada (Simulada)",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". Funcionalidad pendiente.`,
    mainNavigation: "Navegación Principal",
    userNavigation: "Portal del Piloto",
    mobileMenuTitle: "DarkAISchool Menú",
    navPanel: "Panel",
    navForums: "Foros",
    navRecovery: "Acceso Recuperación",
    navMaterials: "Materiales",
    navSettings: "Ajustes",
    navAiAssistant: "Nova IA",
    navMyForums: "Mis Holo-Foros",
    navFavorites: "Holo-Favoritos",
    navLogout: "Desconectar Portal",
    loggedInAs: (name: string) => `Piloto ${name} en línea`,
    loadingUser: "Sincronizando Piloto...",
    loginSimulated: "Acceder al Portal (Simulado)",
  },
  en: {
    searchPlaceholder: "Search DarkAISchool...",
    languageChanged: "Language Changed",
    languageChangedDesc: (lang: string) => `Interface language is now ${lang}.`,
    languageSaveError: "Error saving language preference.",
    searchSubmitted: "Search Submitted (Simulated)",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". Functionality pending.`,
    mainNavigation: "Main Navigation",
    userNavigation: "Pilot's Portal",
    mobileMenuTitle: "DarkAISchool Menu",
    navPanel: "Dashboard",
    navForums: "Forums",
    navRecovery: "Recovery Access",
    navMaterials: "Materials",
    navSettings: "Settings",
    navAiAssistant: "Nova AI",
    navMyForums: "My Holo-Forums",
    navFavorites: "Holo-Favorites",
    navLogout: "Disconnect Portal",
    loggedInAs: (name: string) => `Pilot ${name} online`,
    loadingUser: "Syncing Pilot...",
    loginSimulated: "Access Portal (Simulated)",
  }
};

type Theme = "light" | "dark" | "system";

export function AppLayout({ children }: { children: React.ReactNode; }) {
  const { toast } = useToast();
  const { user, loading: authLoading, userProfile, setUserProfileState, loading: userProfileLoading } = useFirebaseAuth();
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const T = appLayoutTexts[currentLanguage];

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const applyTheme = React.useCallback((themeToApply: Theme | undefined | null) => {
    if (typeof window === 'undefined' || !themeToApply) return;
    document.documentElement.classList.remove("light", "dark");
    if (themeToApply === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeToApply === "light") {
      // Light is default, no class needed unless you explicitly want .light
      // document.documentElement.classList.add("light"); 
    } else { // system
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
         document.documentElement.classList.remove('dark');
      }
    }
  }, []);
  
  React.useEffect(() => {
    if (!hasMounted) return;
  
    let themeApplied: Theme = 'system';
    let langApplied: 'es' | 'en' = 'es';
  
    if (authLoading) {
      // While auth is loading, use localStorage as primary source to avoid FOUC
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) themeApplied = storedTheme;
      
      const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
      if (storedLang) langApplied = storedLang;
    } else {
      // Auth has loaded, prioritize userProfile from Firebase
      if (userProfile) {
        themeApplied = userProfile.tema || 'system';
        langApplied = userProfile.idioma || 'es';
        // Sync localStorage with Firestore values
        localStorage.setItem("theme", themeApplied);
        localStorage.setItem("language", langApplied);
      } else {
        // No userProfile from Firebase, fallback to localStorage or defaults
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        themeApplied = storedTheme || 'system';
        localStorage.setItem("theme", themeApplied); // Ensure localStorage is set
  
        const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
        langApplied = storedLang || 'es';
        localStorage.setItem("language", langApplied); // Ensure localStorage is set
      }
    }
    
    applyTheme(themeApplied);
    setCurrentLanguage(langApplied);
  
  }, [userProfile, authLoading, applyTheme, hasMounted]);


  React.useEffect(() => {
    if (isMobileSheetOpen && hasMounted) {
      setIsMobileSheetOpen(false);
    }
  }, [pathname, hasMounted]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      toast({
        title: T.searchSubmitted,
        description: T.searchSubmittedDesc(searchQuery),
      });
    }
  };

  const handleLanguageChange = async (lang: 'es' | 'en') => {
    if (!hasMounted) return;

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
        const updatedProfileData: Partial<UserProfileType> = { idioma: lang };
        
        // Optimistic update to local state
        if (userProfile) {
            setUserProfileState({ ...userProfile, ...updatedProfileData });
        } else {
            // If userProfile was null, construct a new one to set locally
            // This assumes a base structure, might need more robust default creation
            const baseProfile: UserProfileType = {
                uid: user.uid,
                nombre: user.displayName || "Estudiante de Pruebas",
                correo: user.email || "test@darkaischool.tech",
                tema: (localStorage.getItem("theme") as Theme) || "system",
                idioma: lang,
                fotoPerfil: user.photoURL || `https://placehold.co/40x40.png?text=ET`,
                isAdmin: false, // Default isAdmin to false
            };
            setUserProfileState(baseProfile);
            // Attempt to setDoc in Firestore for a new profile, or update if it somehow exists
             await setDoc(userDocRef, baseProfile, { merge: true });
            return; // Return early as we've handled the state and Firestore
        }
        // If userProfile exists, just update it in Firestore
        await updateDoc(userDocRef, updatedProfileData);

      } catch (error) {
        console.error("Error updating language in Firestore:", error);
        toast({ title: "Error de Sincronización", description: T.languageSaveError, variant: "destructive" });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: T.navLogout, description: "Has cerrado tu portal en DarkAISchool." });
      router.push('/home'); // Redirect to home or login page after logout
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Error de Cierre", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };
  
  const getNavItemTitle = React.useCallback((item: NavItem | UserNavItem, langT: AppLayoutTextsType): string => {
    const key = 'key' in item ? item.key : (item as UserNavItem).key;
    if (typeof key === 'string') {
      switch (key) {
        case 'home': return langT.navPanel;
        case 'forums': return langT.navForums;
        case 'recovery-access': return langT.navRecovery;
        case 'study-materials': return langT.navMaterials;
        case 'settings': return langT.navSettings;
        case 'aiAssistant': return langT.navAiAssistant;
        case 'myForums': return langT.navMyForums;
        case 'favorites': return langT.navFavorites;
        case 'logout': return langT.navLogout;
        default: return item.title; // Fallback to item.title if key doesn't match
      }
    }
    return item.title;
  }, []);

  const userNavItemsList: UserNavItem[] = React.useMemo(() =>
    userNavItemsListDetails.map(detail => ({
      ...detail, // Spread detail first
      title: getNavItemTitle({ ...detail, title: detail.defaultTitle } as UserNavItem, T), // Then override title
      action: detail.actionKey === 'logoutAction' ? handleLogout : undefined,
      disabled: authLoading && detail.key !== 'settings' && detail.key !== 'logout', // Logout should always be enabled if user obj exists
    })), [T, handleLogout, getNavItemTitle, authLoading]);

  const mainNavItemsList: NavItem[] = React.useMemo(() =>
    mainNavItemsData.map(item => ({
      ...item,
      title: getNavItemTitle(item, T),
    })), [T, getNavItemTitle]);

  const UserDesktopSidebar = React.memo(function UserDesktopSidebarComponent() {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [sidebarHasMounted, setSidebarHasMounted] = React.useState(false);

    React.useEffect(() => {
      setSidebarHasMounted(true);
      if (typeof window !== 'undefined') {
        const storedState = localStorage.getItem('sidebarCollapsed_v3');
        if (storedState !== null) {
          try {
            setIsCollapsed(JSON.parse(storedState));
          } catch (e) {
            console.error("Error parsing sidebarCollapsed_v3 from localStorage", e);
            setIsCollapsed(false);
          }
        } else {
          setIsCollapsed(false); // Default to not collapsed if nothing in localStorage
        }
      }
    }, []);
    
    const toggleCollapse = React.useCallback(() => {
      if (sidebarHasMounted) {
        setIsCollapsed(prevState => {
          const newState = !prevState;
          localStorage.setItem('sidebarCollapsed_v3', JSON.stringify(newState));
          return newState;
        });
      }
    }, [sidebarHasMounted]);

    if (!user || !sidebarHasMounted) { // Don't render sidebar if no user or not mounted yet
      return null;
    }
    
    return (
      <aside className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out text-sidebar-foreground shadow-lg",
        isCollapsed ? "md:w-20" : "md:w-64" // Increased width for non-collapsed
      )}
      >
        <div className={cn("flex items-center border-b border-sidebar-border px-4", isCollapsed ? "justify-center h-16" : "h-16")}>
          {!isCollapsed && (
            <Link href="/home" className="flex items-center gap-2 group">
              <BrainCircuit className="h-8 w-8 text-primary group-hover:techno-glow-primary transition-all duration-300" />
              <span className="font-bold text-lg text-sidebar-foreground group-hover:text-primary transition-colors">DarkAISchool</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className={cn("text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-full", isCollapsed ? "absolute top-3 left-1/2 -translate-x-1/2" : "ml-auto")}>
            <Menu className={cn("h-5 w-5 transition-transform duration-300", isCollapsed ? "rotate-180" : "")} />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-3">
          <nav className="grid gap-1.5 px-3">
            {userNavItemsList.map((item) => (
              <Tooltip key={item.key || item.title} open={isCollapsed ? undefined : false}>
                <TooltipTrigger asChild>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-primary hover:scale-105 hover:shadow-md",
                        (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home')) && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-lg techno-glow-primary",
                        isCollapsed && "justify-center",
                        item.disabled && "opacity-50 cursor-not-allowed"
                      )}
                      aria-disabled={item.disabled}
                      onClick={(e) => { if (item.disabled) e.preventDefault(); }}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "", (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home')) ? "text-sidebar-primary-foreground" : "text-primary" )} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-primary hover:scale-105 hover:shadow-md justify-start",
                        isCollapsed && "justify-center",
                        item.disabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        if (item.disabled) e.preventDefault();
                        else item.action?.();
                      }}
                      disabled={item.disabled}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "", "text-primary")} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Button>
                  )}
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="bg-popover text-popover-foreground border-border shadow-xl"><p>{item.title}</p></TooltipContent>}
              </Tooltip>
            ))}
          </nav>
        </ScrollArea>
         {user && !isCollapsed && (
            <div className="mt-auto p-3 border-t border-sidebar-border">
              { userProfileLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24 bg-muted" />
                    <Skeleton className="h-3 w-32 bg-muted" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-primary techno-glow-primary">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Piloto"} data-ai-hint="user avatar small" />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {user.displayName?.substring(0, 2).toUpperCase() || (user.email ? user.email.substring(0, 2).toUpperCase() : "DS")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground truncate max-w-[140px]">{user.displayName || T.loadingUser}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}
      </aside>
    );
  });
  UserDesktopSidebar.displayName = 'UserDesktopSidebar';

  if (!hasMounted || authLoading) { // Keep authLoading check for initial page structure
    return (
       <div className="flex min-h-screen w-full animate-pulse bg-background">
        <div className="hidden md:flex md:w-64 flex-col border-r bg-sidebar p-4 space-y-3">
            <Skeleton className="h-8 w-3/4 bg-muted" />
            {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-9 w-full bg-muted rounded-md" />)}
            <div className="mt-auto space-y-2">
                <Skeleton className="h-10 w-full bg-muted rounded-md" />
            </div>
        </div>
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-md">
            <Skeleton className="h-8 w-8 bg-muted rounded-md md:hidden" />
            <Skeleton className="h-8 w-36 bg-muted rounded-md" />
            <div className="hidden md:flex flex-1 justify-center gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-28 bg-muted rounded-md" />)}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <Skeleton className="hidden sm:block h-9 w-48 bg-muted rounded-md" />
              <Skeleton className="h-9 w-9 bg-muted rounded-full" />
              <Skeleton className="h-9 w-9 bg-muted rounded-full" />
              <Skeleton className="h-9 w-9 bg-muted rounded-full" />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
             <Skeleton className="h-12 w-1/2 bg-muted rounded-lg mb-6" />
             <Skeleton className="h-72 w-full bg-muted rounded-lg" />
          </main>
        </div>
      </div>
    );
  }
  
  const sidebarWidthClass = (typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed_v3') === 'true' && user && !authLoading) 
    ? "md:ml-20" 
    : (user && !authLoading ? "md:ml-64" : "md:ml-0");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserDesktopSidebar />
        
        <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out",
          sidebarWidthClass
        )}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú de navegación</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 max-w-xs w-full sm:max-w-sm bg-card border-r border-border shadow-xl">
                <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                  <Link href="/home" className="flex items-center gap-2 group" onClick={() => setIsMobileSheetOpen(false)}>
                    <BrainCircuit className="h-7 w-7 text-primary group-hover:techno-glow-primary transition-all duration-300" />
                    <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">DarkAISchool</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full"> <X className="h-5 w-5" /> <span className="sr-only">Cerrar menú</span></Button>
                  </SheetClose>
                </div>
                <ScrollArea className="flex-1">
                  <nav className="grid gap-2 p-4">
                    <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.mainNavigation}</h3>
                    {mainNavItemsList.map((item) => (
                      <SheetClose asChild key={item.key}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-accent hover:scale-105",
                            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home')) && "bg-accent text-primary font-semibold techno-glow-primary"
                          )}
                        >
                          <item.icon className="h-5 w-5 text-primary" />
                          {item.title}
                        </Link>
                      </SheetClose>
                    ))}
                    {user && ( 
                      <>
                        <Separator className="my-3 bg-border"/>
                        <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.userNavigation}</h3>
                        {userNavItemsList.map((item) => (item.href ?
                          (<SheetClose asChild key={item.key || item.title}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-accent hover:scale-105",
                                item.disabled && "opacity-50 cursor-not-allowed",
                                pathname === item.href && !item.disabled && "bg-accent text-primary font-medium techno-glow-primary"
                              )}
                              onClick={(e) => {
                                if (item.disabled) { e.preventDefault(); }
                              }}
                              aria-disabled={item.disabled}
                            >
                              <item.icon className="h-5 w-5 text-primary" />
                              {item.title}
                            </Link>
                          </SheetClose>) : (
                          <SheetClose asChild key={item.key || item.title}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-accent hover:scale-105",
                                item.disabled && "opacity-50 cursor-not-allowed"
                              )}
                              onClick={(e) => {
                                if (item.disabled) {
                                  e.preventDefault();
                                } else if (item.action) {
                                  item.action();
                                }
                              }}
                              disabled={item.disabled}
                            >
                              <item.icon className="h-5 w-5 text-primary" />
                              {item.title}
                            </Button>
                          </SheetClose>
                        )
                        ))}
                      </>
                    )}
                  </nav>
                </ScrollArea>
                {user && (
                  <div className="mt-auto p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-10 w-10 border-2 border-primary techno-glow-primary">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Piloto"} data-ai-hint="user avatar" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">{user.displayName?.substring(0, 2).toUpperCase() || "DS"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.displayName || T.loadingUser}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            
            <div className="hidden md:block font-bold text-xl text-primary ml-2">
              { (typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed_v3') === 'true' && user && !authLoading) && "DAS" }
            </div>

            <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
                {mainNavItemsList.map((item: NavItem) => (
                    <Button
                    key={item.key}
                    asChild
                    variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home') ? "secondary" : "ghost"}
                    className="text-sm font-medium hover:scale-105 hover:brightness-110 transition-transform duration-150"
                    >
                    <Link href={item.href} className="flex items-center gap-1.5 px-3 py-2">
                        <item.icon className="h-4 w-4 text-primary/90" />
                        {item.title}
                    </Link>
                    </Button>
                ))}
            </nav>

            <div className={cn("flex items-center gap-1 sm:gap-1.5 ml-auto")}>
              <form className="hidden sm:block" onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Input
                    type="search"
                    name="search"
                    placeholder={T.searchPlaceholder}
                    className="pl-8 w-full sm:w-[150px] md:w-[180px] lg:w-[220px] bg-input border-input h-9 rounded-full focus:techno-glow-primary text-sm"
                  />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </span>
                </div>
              </form>
              <ThemeToggleButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Cambiar idioma" className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-full h-9 w-9 hover:scale-110 transition-transform">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border shadow-xl w-40">
                  <DropdownMenuItem onClick={() => handleLanguageChange('es')} className="hover:bg-accent cursor-pointer">Español</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('en')} className="hover:bg-accent cursor-pointer">English</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {authLoading && !user ? ( // Should show skeleton if auth is loading and no user yet
                <Skeleton className="h-9 w-9 rounded-full bg-muted" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:scale-110 transition-transform">
                      <Avatar className="h-9 w-9 border-2 border-primary techno-glow-primary">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Piloto"} data-ai-hint="user avatar small" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{user.displayName?.substring(0, 2).toUpperCase() || (user.email ? user.email.substring(0, 2).toUpperCase() : "DS")}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 bg-popover text-popover-foreground border-border shadow-xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 py-1">
                        <p className="text-sm font-semibold leading-none text-foreground">{user.displayName || T.loadingUser}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border"/>
                    <DropdownMenuGroup>
                      {userNavItemsList.filter(item => item.href).map(item => (
                        <DropdownMenuItem key={item.key || item.title} asChild disabled={item.disabled} className="hover:bg-accent cursor-pointer">
                          <Link href={item.href!} className={cn("flex items-center w-full", item.disabled && "opacity-50 cursor-not-allowed")}>
                            <item.icon className="mr-2 h-4 w-4 text-primary" />
                            <span>{item.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-border"/>
                    {userNavItemsList.find(item => item.actionKey === 'logoutAction') && (
                      <DropdownMenuItem
                        onClick={!userNavItemsList.find(item => item.actionKey === 'logoutAction')?.disabled ? handleLogout : undefined}
                        className={cn("cursor-pointer flex items-center hover:bg-accent", userNavItemsList.find(item => item.actionKey === 'logoutAction')?.disabled && "opacity-50 cursor-not-allowed")}
                        disabled={userNavItemsList.find(item => item.actionKey === 'logoutAction')?.disabled}
                      >
                        <LogOutIcon className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">{getNavItemTitle(userNavItemsList.find(item => item.actionKey === 'logoutAction')!, T)}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : ( // Case: not authLoading and no user (e.g. logged out state or error)
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => router.push('/home')} aria-label={T.loginSimulated} className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-full h-9 w-9">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round h-5 w-5"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-border shadow-xl">
                    <p>{T.loginSimulated}</p>
                  </TooltipContent>
                </Tooltip>
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

    