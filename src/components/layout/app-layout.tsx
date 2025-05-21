
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems as mainNavItemsData } from './nav-items'; 
import type { NavItem } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Menu, X, LogOut, Settings, LayoutList, Star, User as UserIcon, BrainCircuit } from 'lucide-react'; 
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
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import type { UserNavItem } from './user-nav-items';
import { userNavItemsListDetails } from './user-nav-items';
import { signOut as firebaseSignOut } from 'firebase/auth'; 
import { auth } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

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
    navAiAssistant: "Asistente Nova",
    navMyForums: "Mis Foros",
    navFavorites: "Favoritos",
    navLogout: "Cerrar Sesión",
    loggedInAs: (name: string) => `Sesión iniciada como ${name}`,
    loadingUser: "Cargando...",
    loginSimulated: "Iniciar sesión (Simulado)",
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
    navAiAssistant: "Nova Assistant",
    navMyForums: "My Forums",
    navFavorites: "Favorites",
    navLogout: "Log Out",
    loggedInAs: (name: string) => `Logged in as ${name}`,
    loadingUser: "Loading...",
    loginSimulated: "Log In (Simulated)",
  }
};


function DesktopNav({ currentLanguage, T, pathname }: { currentLanguage: 'es' | 'en', T: AppLayoutTextsType, pathname: string}) {
  const getNavItemTitle = (item: NavItem) => {
    switch (item.key) {
      case 'home': return T.navPanel;
      case 'forums': return T.navForums;
      case 'recovery-access': return T.navRecovery;
      case 'study-materials': return T.navMaterials;
      default: return item.title;
    }
  };

  return (
    <nav className="hidden md:flex gap-1 items-center">
      {mainNavItemsData.map((item: NavItem) => (
        <Button
          key={item.key}
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

// Main User Sidebar Component
function UserDesktopSidebar({ currentLanguage, T, pathname, user, handleLogout, userNavItems, userProfileLoading }: { 
  currentLanguage: 'es' | 'en', 
  T: AppLayoutTextsType, 
  pathname: string,
  user: ReturnType<typeof useFirebaseAuth>['user'],
  handleLogout: () => void,
  userNavItems: UserNavItem[],
  userProfileLoading: boolean,
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false); 

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem('sidebarCollapsed');
      if (storedState) {
        setIsCollapsed(JSON.parse(storedState));
      }
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prevState => {
      const newState = !prevState;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };


  return (
    <aside className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out text-sidebar-foreground",
        isCollapsed ? "md:w-16" : "md:w-60" 
      )}
    >
      <div className={cn("flex items-center border-b border-sidebar-border px-4", isCollapsed ? "justify-center h-16" : "h-16")}>
        {!isCollapsed && (
           <Link href="/home" className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-7 w-7">
                <rect width="256" height="256" fill="none"></rect>
                <path d="M41.4,104.6C22.8,123.1,16,144,16,160a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,104.6Z" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                <path d="M113.4,104.6c18.6-18.5,25.4-39.4,25.4-55.4a64,64,0,0,0-128,0c0,16,6.8,36.9,25.4,55.4a71.8,71.8,0,0,0,50.2,22.1A71.8,71.8,0,0,0,113.4,104.6Z" transform="translate(256 48) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                <path d="M41.4,151.4c-18.6,18.5-25.4,39.4-25.4,55.4a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,151.4Z" transform="translate(48 256) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                <path d="M113.4,151.4c-18.6-18.5-25.4-39.4-25.4-55.4a64,64,0,0,1,128,0c0,16,6.8,36.9,25.4,55.4a71.8,71.8,0,0,1-50.2,22.1A71.8,71.8,0,0,1,113.4,151.4Z" transform="translate(256 208) rotate(180)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
            </svg>
            <span className="font-bold text-lg text-sidebar-foreground">DarkAISchool</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggleCollapse} className={cn("text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isCollapsed ? "absolute top-3 left-1/2 -translate-x-1/2" : "ml-auto")}>
          <Menu className={cn("h-5 w-5 transition-transform duration-300", isCollapsed ? "rotate-180" : "")}/>
        </Button>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {userNavItems.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home')) && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold",
                      isCollapsed && "justify-center"
                    )}
                    aria-disabled={item.disabled}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start",
                       isCollapsed && "justify-center"
                    )}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                      else item.action?.();
                    }}
                    disabled={item.disabled}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Button>
                )}
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right" className="bg-popover text-popover-foreground"><p>{item.title}</p></TooltipContent>}
            </Tooltip>
          ))}
        </nav>
      </ScrollArea>
       {user && !isCollapsed && (
          <div className="mt-auto p-3 border-t border-sidebar-border">
            { userProfileLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full bg-muted" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <Skeleton className="h-3 w-32 bg-muted" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuario"} data-ai-hint="user avatar"/>
                  <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || (user.email ? user.email.substring(0,2).toUpperCase() : "ET")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]">{user.displayName || T.loadingUser}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        )}
    </aside>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, loading: userProfileLoading, userProfile, setUserProfileState } = useFirebaseAuth(); 
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
      // document.documentElement.classList.add("light"); // Only add dark, light is default via lack of .dark
    } else { // system
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        // document.documentElement.classList.remove("dark"); // default is light
      }
    }
  }, []);

  React.useEffect(() => {
    let themeApplied: Theme = 'system';
    let langApplied: 'es' | 'en' = 'es';

    if (typeof window !== 'undefined') { // Ensure localStorage is available
      if (userProfileLoading) {
        // While user profile is loading, prioritize localStorage for quick UI setup
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) {
          themeApplied = storedTheme;
        }
        const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
        if (storedLang) {
          langApplied = storedLang;
        }
      } else {
        // User profile (from Firestore or defaults) is loaded
        if (userProfile) {
          themeApplied = userProfile.tema || 'system';
          langApplied = userProfile.idioma || 'es';
          localStorage.setItem("theme", themeApplied); // Sync localStorage with Firestore
          localStorage.setItem("language", langApplied);
        } else {
          // Fallback to localStorage if profile still not available (should be rare with simulated user)
          const storedTheme = localStorage.getItem("theme") as Theme | null;
          themeApplied = storedTheme || 'system';
          localStorage.setItem("theme", themeApplied);
          const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
          langApplied = storedLang || 'es';
          localStorage.setItem("language", langApplied);
        }
      }
      applyTheme(themeApplied);
      setCurrentLanguage(langApplied);
    }
  }, [userProfile, userProfileLoading, applyTheme]);


  React.useEffect(() => {
    if (isMobileSheetOpen) {
      setIsMobileSheetOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (typeof window !== 'undefined') localStorage.setItem("language", lang); 
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });

    if (user && user.uid) { 
      try {
        const userDocRef = doc(db, "users", user.uid);
        // Optimistically update local state, Firestore will catch up
        const updatedProfile = { ...(userProfile || { uid: user.uid, nombre: user.displayName || "", correo: user.email || "" }), idioma: lang };
        
        // Ensure all required fields are present before setting
        const profileToSave: any = {
            nombre: updatedProfile.nombre || user.displayName || "Usuario de Prueba",
            correo: updatedProfile.correo || user.email || "test@example.com",
            idioma: lang,
            tema: updatedProfile.tema || "system",
            fotoPerfil: updatedProfile.fotoPerfil || user.photoURL || `https://placehold.co/40x40.png?text=ET`,
            uid: user.uid,
        };
        if(updatedProfile.isAdmin !== undefined) profileToSave.isAdmin = updatedProfile.isAdmin;


        await setDoc(userDocRef, profileToSave, { merge: true });
        setUserProfileState(profileToSave as UserProfile);

      } catch (error) {
        console.error("Error updating language in Firestore:", error);
        toast({ title: "Error", description: T.languageSaveError, variant: "destructive" });
      }
    }
  };
  
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth); 
      toast({ title: "Sesión Cerrada", description: "Has cerrado tu sesión exitosamente." });
      // With simulated auth, user state in useFirebaseAuth will reset.
      // If real auth, router.push('/login') might be needed.
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };
  
  const getNavItemTitle = React.useCallback((itemKey: string, langT: AppLayoutTextsType): string => {
    const itemDetail = userNavItemsListDetails.find(detail => detail.key === itemKey);
    if (!itemDetail) return itemKey; 

    switch (itemKey) {
      case 'settings': return langT.navSettings;
      case 'aiAssistant': return langT.navAiAssistant;
      case 'myForums': return langT.navMyForums;
      case 'favorites': return langT.navFavorites;
      case 'logout': return langT.navLogout;
      default: return itemDetail.defaultTitle; 
    }
  }, []);

  const userNavItemsList = React.useMemo(() => 
    userNavItemsListDetails.map(detail => ({
      title: getNavItemTitle(detail.key, T),
      href: detail.href,
      icon: detail.icon,
      action: detail.actionKey === 'logoutAction' ? handleLogout : undefined,
      disabled: false, // User is always "logged in" with simulated auth
    })),
  [T, handleLogout, getNavItemTitle]);


  if (userProfileLoading && typeof window !== 'undefined' && !localStorage.getItem('theme')) { 
    return (
      <div className="flex min-h-screen w-full animate-pulse">
        <div className="hidden md:flex md:w-60 flex-col border-r bg-sidebar p-4 space-y-3">
            <Skeleton className="h-8 w-3/4 bg-muted" />
            {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-9 w-full bg-muted" />)}
            <div className="mt-auto space-y-2">
                <Skeleton className="h-9 w-full bg-muted" />
                <Skeleton className="h-9 w-full bg-muted" />
            </div>
        </div>
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
            <div className="h-8 w-8 bg-muted rounded-md md:hidden"></div> 
            <div className="h-6 w-32 bg-muted rounded-md"></div> 
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
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
             <Skeleton className="h-10 w-1/2 bg-muted rounded-lg mb-4" />
             <Skeleton className="h-64 w-full bg-muted rounded-lg" /> 
          </main>
        </div>
      </div>
    );
  }

  const sidebarWidthClass = "md:ml-60"; // Default for expanded sidebar
  // const sidebarWidthClass = isSidebarCollapsed ? "md:ml-16" : "md:ml-60"; // If collapse state was managed here

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full">
        <UserDesktopSidebar 
            currentLanguage={currentLanguage} 
            T={T} 
            pathname={pathname} 
            user={user} 
            handleLogout={handleLogout} 
            userNavItems={userNavItemsList}
            userProfileLoading={userProfileLoading}
        />
        
        <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", user ? sidebarWidthClass : "md:ml-0" )}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
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
                        <path d="M41.4,151.4c-18.6,18.5-25.4,39.4-25.4-55.4a64,64,0,0,0,128,0c0-16-6.8-36.9-25.4-55.4a71.8,71.8,0,0,0-50.2-22.1A71.8,71.8,0,0,0,41.4,151.4Z" transform="translate(48 256) rotate(90)" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
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
                    {mainNavItemsData.map((item) => (
                      <SheetClose asChild key={item.key}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent",
                            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home')) && "bg-accent text-primary font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
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
                          {item.title}
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
                            {item.title}
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
            
            <div className="hidden md:flex flex-1 justify-center">
              <DesktopNav currentLanguage={currentLanguage} T={T} pathname={pathname} />
            </div>

            <div className={cn("flex items-center gap-2 sm:gap-3 ml-auto")}>
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
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                  <DropdownMenuItem onClick={() => handleLanguageChange('es')}>Español</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('en')}>English</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

               {userProfileLoading && !user ? ( // Show skeleton only if truly loading and no user yet
                 <Skeleton className="h-9 w-9 rounded-full bg-muted" />
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
                  <DropdownMenuContent className="w-56 bg-popover text-popover-foreground" align="end" forceMount>
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
                            <span>{item.title}</span>
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
                         <span>{userNavItemsList.find(item => item.action)!.title}</span>
                       </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => router.push('/home')} aria-label={T.loginSimulated} className="text-foreground hover:text-accent-foreground hover:bg-accent">
                           <UserIcon className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground">
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
