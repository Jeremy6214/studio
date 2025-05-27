
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems as mainNavItemsData } from './nav-items';
import type { NavItem } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Menu, X, LogOutIcon, Search as SearchIcon, MoonStar, Atom } from 'lucide-react'; // Changed Orbit to Atom
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
  toggleSidebarExpand: string;
  toggleSidebarCollapse: string;
  openNavigationMenu: string;
  closeNavigationMenu: string;
  appName: string;
}

const appLayoutTexts: Record<'es' | 'en', AppLayoutTextsType> = {
  es: {
    searchPlaceholder: "Buscar en DarkAIschool...",
    languageChanged: "Idioma Cambiado",
    languageChangedDesc: (lang: string) => `La interfaz ahora está en ${lang}.`,
    languageSaveError: "Error al guardar el idioma.",
    searchSubmitted: "Búsqueda Enviada",
    searchSubmittedDesc: (query: string) => `Has buscado: "${query}". (Funcionalidad de búsqueda no implementada).`,
    mainNavigation: "Navegación Principal",
    userNavigation: "Portal del Usuario",
    mobileMenuTitle: "DarkAIschool Menú",
    navPanel: "Panel",
    navForums: "Foros",
    navRecovery: "Soporte Académico",
    navMaterials: "Materiales",
    navSettings: "Configuración",
    navAiAssistant: "Asistente Nova",
    navMyForums: "Mis Foros",
    navFavorites: "Favoritos",
    navLogout: "Cerrar Sesión",
    loggedInAs: (name: string) => `Conectado como ${name}`,
    loadingUser: "Cargando perfil...",
    loginSimulated: "Acceder (Simulado)",
    toggleSidebarExpand: "Expandir barra lateral",
    toggleSidebarCollapse: "Colapsar barra lateral",
    openNavigationMenu: "Abrir menú de navegación",
    closeNavigationMenu: "Cerrar menú",
    appName: "DarkAIschool",
  },
  en: {
    searchPlaceholder: "Search DarkAIschool...",
    languageChanged: "Language Changed",
    languageChangedDesc: (lang: string) => `Interface language is now ${lang}.`,
    languageSaveError: "Error saving language preference.",
    searchSubmitted: "Search Submitted",
    searchSubmittedDesc: (query: string) => `You searched for: "${query}". (Search functionality not implemented).`,
    mainNavigation: "Main Navigation",
    userNavigation: "User Portal",
    mobileMenuTitle: "DarkAIschool Menu",
    navPanel: "Dashboard",
    navForums: "Forums",
    navRecovery: "Academic Support",
    navMaterials: "Materials",
    navSettings: "Settings",
    navAiAssistant: "Nova Assistant",
    navMyForums: "My Forums",
    navFavorites: "Favorites",
    navLogout: "Log Out",
    loggedInAs: (name: string) => `Logged in as ${name}`,
    loadingUser: "Loading profile...",
    loginSimulated: "Sign In (Simulated)",
    toggleSidebarExpand: "Expand sidebar",
    toggleSidebarCollapse: "Collapse sidebar",
    openNavigationMenu: "Open navigation menu",
    closeNavigationMenu: "Close menu",
    appName: "DarkAIschool",
  }
};

type Theme = "light" | "dark" | "system";


const UserDesktopSidebar = React.memo(function UserDesktopSidebarComponent({
  user,
  userProfile,
  userProfileLoading,
  currentLanguage,
  T,
  pathname,
  isCollapsed,
  toggleCollapse,
  userNavItemsList,
}: {
  user: ReturnType<typeof useFirebaseAuth>['user'];
  userProfile: ReturnType<typeof useFirebaseAuth>['userProfile'];
  userProfileLoading: boolean;
  currentLanguage: 'es' | 'en';
  T: AppLayoutTextsType;
  pathname: string;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  userNavItemsList: UserNavItem[];
}) {
  if (!user) {
    return null;
  }

  return (
    <aside
      className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out text-sidebar-foreground shadow-lg",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}
    >
      <div className={cn("flex items-center border-b border-sidebar-border px-4", isCollapsed ? "justify-center h-16" : "h-16")}>
        {!isCollapsed && (
          <Link href="/home" className="flex items-center gap-2 group">
            <Atom className="h-8 w-8 text-sidebar-primary group-hover:techno-glow-primary transition-all duration-300" /> {/* Icon Changed */}
            <span className="font-bold text-lg text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">{T.appName}</span>
          </Link>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className={cn("text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-full", isCollapsed ? "absolute top-3 left-1/2 -translate-x-1/2" : "ml-auto")}
                aria-label={isCollapsed ? T.toggleSidebarExpand : T.toggleSidebarCollapse}
            >
              <Menu className={cn("h-5 w-5 transition-transform duration-300", isCollapsed ? "rotate-180" : "")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover text-popover-foreground border-border shadow-xl">
            <p>{isCollapsed ? T.toggleSidebarExpand : T.toggleSidebarCollapse}</p>
          </TooltipContent>
        </Tooltip>
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
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.03] hover:shadow-md",
                      (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home')) && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-md techno-glow-primary",
                      isCollapsed && "justify-center",
                      item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                    aria-disabled={item.disabled}
                    onClick={(e) => { if (item.disabled) e.preventDefault(); }}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "", (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home')) ? "text-sidebar-primary-foreground" : "text-sidebar-primary")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.03] hover:shadow-md justify-start",
                      isCollapsed && "justify-center",
                      item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                      else item.action?.();
                    }}
                    disabled={item.disabled}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "mx-auto" : "", "text-sidebar-primary")} />
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
          {userProfileLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ) : userProfile ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-sidebar-primary techno-glow-primary">
                <AvatarImage src={userProfile.fotoPerfil || user.photoURL || undefined} alt={userProfile.nombre || user.displayName || "Usuario"} data-ai-hint="user avatar small" />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {(userProfile.nombre || user.displayName)?.substring(0, 2).toUpperCase() || (user.email ? user.email.substring(0, 2).toUpperCase() : "DS")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-sidebar-foreground truncate max-w-[140px]">{userProfile.nombre || user.displayName || T.loadingUser}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{userProfile.correo || user.email}</p>
              </div>
            </div>
          ) : (
             <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-sidebar-primary techno-glow-primary">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuario"} data-ai-hint="user avatar small"/>
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {(user.displayName)?.substring(0, 2).toUpperCase() || (user.email ? user.email.substring(0, 2).toUpperCase() : "DS")}
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


export function AppLayout({ children }: { children: React.ReactNode; }) {
  const { toast } = useToast();
  const { user, authLoading, userProfile, userProfileLoading, setUserProfileState } = useFirebaseAuth();
  const [currentLanguage, setCurrentLanguageState] = React.useState<'es' | 'en'>('es');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const T = React.useMemo(() => appLayoutTexts[currentLanguage], [currentLanguage]);

  const applyTheme = React.useCallback((themeToApply: Theme | undefined | null) => {
    if (typeof window === 'undefined' || !themeToApply) return;
    document.documentElement.classList.remove("light", "dark");
    if (themeToApply === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeToApply === "light") {
      document.documentElement.classList.remove("dark");
    } else {
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

    if (authLoading || userProfileLoading) {
      // While loading, prioritize localStorage to prevent FOUC
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) themeApplied = storedTheme;
        const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
        if (storedLang) langApplied = storedLang;
      }
    } else {
      // Once loading is complete, use Firestore profile data as source of truth
      if (userProfile) {
        themeApplied = userProfile.tema || 'system';
        langApplied = userProfile.idioma || 'es';
        if (typeof window !== 'undefined') { // Sync localStorage
          localStorage.setItem("theme", themeApplied);
          localStorage.setItem("language", langApplied);
        }
      } else { // Fallback to localStorage if profile somehow still missing
        if (typeof window !== 'undefined') {
          const storedTheme = localStorage.getItem("theme") as Theme | null;
          themeApplied = storedTheme || 'system';
          localStorage.setItem("theme", themeApplied); // Save default if not set

          const storedLang = localStorage.getItem("language") as 'es' | 'en' | null;
          langApplied = storedLang || 'es';
          localStorage.setItem("language", langApplied); // Save default if not set
        }
      }
    }
    applyTheme(themeApplied);
    setCurrentLanguageState(langApplied);

  }, [userProfile, authLoading, userProfileLoading, applyTheme, hasMounted]);


  React.useEffect(() => {
    if (userProfile?.idioma && userProfile.idioma !== currentLanguage) {
      setCurrentLanguageState(userProfile.idioma);
    }
  }, [userProfile?.idioma, currentLanguage]);


  React.useEffect(() => {
    if (hasMounted && typeof window !== 'undefined') {
      const storedSidebarState = localStorage.getItem('sidebarCollapsed_v3');
      if (storedSidebarState !== null) {
        try {
          setIsSidebarCollapsed(JSON.parse(storedSidebarState));
        } catch (e) {
          setIsSidebarCollapsed(false);
        }
      }
    }
  }, [hasMounted]);

  const toggleSidebarCollapse = React.useCallback(() => {
    if (hasMounted && typeof window !== 'undefined') {
      setIsSidebarCollapsed(prevState => {
        const newState = !prevState;
        localStorage.setItem('sidebarCollapsed_v3', JSON.stringify(newState));
        return newState;
      });
    }
  }, [hasMounted]);

  React.useEffect(() => {
    if (isMobileSheetOpen && hasMounted) {
      setIsMobileSheetOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hasMounted]);

  const handleSearchSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      toast({
        title: T.searchSubmitted,
        description: T.searchSubmittedDesc(searchQuery),
      });
    }
  }, [toast, T]);

  const handleLanguageChange = React.useCallback(async (lang: 'es' | 'en') => {
    if (!hasMounted) return;

    setCurrentLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem("language", lang);
    }
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });

    if (user && user.uid) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const updatedProfileData: Partial<UserProfileType> = { idioma: lang };

        await updateDoc(userDocRef, updatedProfileData);
        if (userProfile) {
          setUserProfileState({ ...userProfile, ...updatedProfileData });
        } else {
          const baseProfileSnap = await getDoc(userDocRef);
          if (baseProfileSnap.exists()){
              setUserProfileState(baseProfileSnap.data() as UserProfileType);
          }
        }
      } catch (error) {
        console.error("Error updating language in Firestore:", error);
        let errorMsg = T.languageSaveError;
        if (error instanceof Error && error.message.includes('offline')) {
           errorMsg = "Preferencia de idioma guardada localmente. Se sincronizará al reconectar.";
           toast({ title: "Modo Offline", description: errorMsg, variant: "default"});
        } else {
           toast({ title: "Error de Sincronización", description: errorMsg, variant: "destructive" });
        }
      }
    }
  }, [hasMounted, user, userProfile, setUserProfileState, toast, T]);

  const handleLogout = React.useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: T.navLogout, description: "Has cerrado tu sesión en DarkAIschool." });
      router.push('/home'); // Or your designated login/landing page after logout
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Error de Cierre", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  }, [toast, T, router]);

  const getNavItemTitle = React.useCallback((itemKey: NavItem['key'] | UserNavItem['key'] | string, defaultTitle: string): string => {
    switch (itemKey) {
      case 'home': return T.navPanel;
      case 'forums': return T.navForums;
      case 'recovery-access': return T.navRecovery;
      case 'study-materials': return T.navMaterials;
      case 'settings': return T.navSettings;
      case 'aiAssistant': return T.navAiAssistant;
      case 'myForums': return T.navMyForums;
      case 'favorites': return T.navFavorites;
      case 'logout': return T.navLogout;
      default: return defaultTitle;
    }
  }, [T]);

  const userNavItemsList = React.useMemo(() =>
    userNavItemsListDetails.map(detail => ({
      ...detail,
      title: getNavItemTitle(detail.key, detail.defaultTitle),
      action: detail.actionKey === 'logoutAction' ? handleLogout : undefined,
      disabled: (authLoading || userProfileLoading) && detail.key !== 'settings' && detail.key !== 'logout',
    })), [getNavItemTitle, handleLogout, authLoading, userProfileLoading]);

  const mainNavItemsList = React.useMemo(() =>
    mainNavItemsData.map(item => ({
      ...item,
      title: getNavItemTitle(item.key, item.title),
    })), [getNavItemTitle]);

  const sidebarMarginClass = React.useMemo(() => {
    if (!hasMounted || !user) return "md:ml-0";
    return isSidebarCollapsed ? "md:ml-20" : "md:ml-64";
  }, [hasMounted, user, isSidebarCollapsed]);


  if (!hasMounted || authLoading || userProfileLoading) {
    // Consistent skeleton for SSR and initial client render
    return (
       <div className="flex min-h-screen w-full bg-background"> {/* Removed animate-pulse from root for skeleton */}
        {/* Skeleton Sidebar (always expanded width during loading) */}
        <aside className="hidden md:flex md:w-64 flex-col border-r bg-sidebar p-4 space-y-3"> {/* Consistent width */}
            <Skeleton className="h-8 w-3/4" /> {/* bg-muted removed, relies on Skeleton's default */}
            {[...Array(5)].map((_,i) => <Skeleton key={`sidebar-skeleton-${i}`} className="h-9 w-full rounded-md" />)}
            <div className="mt-auto space-y-2">
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        </aside>
        {/* Skeleton Main Content */}
        <div className="flex flex-col flex-1 md:ml-64"> {/* Consistent margin */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
            <Skeleton className="h-8 w-8 rounded-md md:hidden" />
            <div className="hidden md:block font-bold text-xl text-primary ml-2 invisible">DS</div>
            <div className="hidden md:flex flex-1 items-center justify-center gap-1">
              {[...Array(4)].map((_, index) => <Skeleton key={`nav-skeleton-${index}`} className="h-9 w-24 rounded-md" />)}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
              <Skeleton className="hidden sm:block h-9 w-48 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
             <Skeleton className="h-12 w-1/2 rounded-lg mb-6" />
             <Skeleton className="h-72 w-full rounded-lg" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex min-h-screen w-full", userProfile?.tema === 'dark' ? 'dark' : '')}>
        <UserDesktopSidebar
          user={user}
          userProfile={userProfile}
          userProfileLoading={userProfileLoading}
          currentLanguage={currentLanguage}
          T={T}
          pathname={pathname}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={toggleSidebarCollapse}
          userNavItemsList={userNavItemsList}
        />

        <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", user ? sidebarMarginClass : "md:ml-0" )}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground rounded-full" aria-label={T.openNavigationMenu}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 max-w-xs w-full sm:max-w-sm bg-card border-r border-border shadow-xl">
                <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                  <Link href="/home" className="flex items-center gap-2 group" onClick={() => setIsMobileSheetOpen(false)}>
                    <Atom className="h-7 w-7 text-primary group-hover:techno-glow-primary transition-all duration-300" /> {/* Icon Changed */}
                    <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{T.appName}</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" aria-label={T.closeNavigationMenu}> <X className="h-5 w-5" /></Button>
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
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-accent hover:scale-[1.03]",
                            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home')) && "bg-accent text-primary font-semibold techno-glow-primary"
                          )}
                           onClick={() => setIsMobileSheetOpen(false)}
                        >
                          <item.icon className="h-5 w-5 text-primary" />
                          {item.title}
                        </Link>
                      </SheetClose>
                    ))}
                     <Separator className="my-3"/>
                     <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{T.userNavigation}</h3>
                     {userNavItemsList.map((item) => ( item.href ?
                       (<SheetClose asChild key={item.key || item.title}>
                         <Link
                           href={item.href}
                           className={cn(
                             "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-accent hover:scale-[1.03]",
                             item.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                             pathname === item.href && !item.disabled && "bg-accent text-primary font-medium techno-glow-primary"
                           )}
                           onClick={(e) => {
                             if (item.disabled) { e.preventDefault(); }
                             else {setIsMobileSheetOpen(false);}
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
                             "w-full justify-start flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-accent hover:scale-[1.03]",
                             item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                           )}
                           onClick={(e) => {
                             if (item.disabled) {
                               e.preventDefault();
                             } else if (item.action) {
                               item.action();
                               setIsMobileSheetOpen(false);
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
                  </nav>
                </ScrollArea>
                {user && userProfile && (
                  <div className="mt-auto p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-10 w-10 border-2 border-primary techno-glow-primary">
                        <AvatarImage src={userProfile.fotoPerfil || user.photoURL || undefined} alt={userProfile.nombre || user.displayName || "Usuario"} data-ai-hint="user avatar"/>
                        <AvatarFallback className="bg-secondary text-secondary-foreground">{(userProfile.nombre || user.displayName)?.substring(0, 2).toUpperCase() || "DS"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{userProfile.nombre || user.displayName || T.loadingUser}</p>
                        <p className="text-xs text-muted-foreground">{userProfile.correo || user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                 {!user && !authLoading && (
                  <div className="mt-auto p-4 border-t border-border">
                    <Button asChild className="w-full">
                      <Link href="/home" onClick={() => setIsMobileSheetOpen(false)}>{T.loginSimulated}</Link>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <div className={cn("hidden md:block font-bold text-xl text-primary ml-2", (isSidebarCollapsed || !user) ? "" : "invisible")}>
              DS
            </div>

            <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
                {mainNavItemsList.map((item: NavItem) => (
                    <Button
                    key={item.key}
                    asChild
                    variant={(pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/home') || (pathname === '/' && item.href === '/home')) ? "secondary" : "ghost"}
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
                   <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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

              {(authLoading || userProfileLoading) && !user && !userProfile ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:scale-110 transition-transform">
                      <Avatar className="h-9 w-9 border-2 border-primary techno-glow-primary">
                        <AvatarImage src={userProfile?.fotoPerfil || user.photoURL || undefined} alt={userProfile?.nombre || user.displayName || "Usuario"} data-ai-hint="user avatar small" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{(userProfile?.nombre || user.displayName)?.substring(0, 2).toUpperCase() || "DS"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 bg-popover text-popover-foreground border-border shadow-xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 py-1">
                        <p className="text-sm font-semibold leading-none text-foreground">{userProfile?.nombre || user.displayName || T.loadingUser}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userProfile?.correo || user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {userNavItemsList.filter(item => item.href).map(item => (
                        <DropdownMenuItem key={item.key || item.title} asChild disabled={item.disabled} className="hover:bg-accent cursor-pointer">
                          <Link href={item.href!} className={cn("flex items-center w-full", item.disabled && "opacity-50 cursor-not-allowed pointer-events-none")}>
                            <item.icon className="mr-2 h-4 w-4 text-primary" />
                            <span>{item.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {userNavItemsList.find(item => item.actionKey === 'logoutAction') && (
                      <DropdownMenuItem
                        onClick={!userNavItemsList.find(item => item.actionKey === 'logoutAction')?.disabled ? handleLogout : undefined}
                        className={cn("cursor-pointer flex items-center hover:bg-accent", userNavItemsList.find(item => item.actionKey === 'logoutAction')?.disabled && "opacity-50 cursor-not-allowed pointer-events-none")}
                        disabled={userNavItemsList.find(item => item.actionKey === 'logoutAction')?.disabled}
                      >
                        <LogOutIcon className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">{getNavItemTitle('logout', T.navLogout)}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
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
