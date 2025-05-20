
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navItems } from './nav-items';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Search, Globe, Menu } from 'lucide-react'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger as OriginalSheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import type { NavItem } from './nav-items';
import { useToast } from "@/hooks/use-toast";

const SheetTrigger = OriginalSheetTrigger; 

const MobileNavTrigger = () => {
  const { setOpenMobile } = useSidebar();
  return (
    <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)} className="md:hidden text-foreground hover:text-accent-foreground hover:bg-accent" aria-label="Abrir menú de navegación">
      <Menu />
    </Button>
  );
};

function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex gap-1 items-center">
      {navItems.map((item: NavItem) => (
        <Button
          key={item.title}
          asChild
          variant={pathname === item.href || (pathname === '/' && item.href === '/home') ? "secondary" : "ghost"}
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

function MobileNavSheet() {
  const { openMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent side="left" className="bg-sidebar text-sidebar-foreground p-0 w-72">
        <ScrollArea className="h-full">
          <div className="p-4">
            <Link href="/home" className="flex items-center gap-2 mb-4" onClick={() => setOpenMobile(false)}>
               <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                  <circle cx="20" cy="20" r="18" stroke="hsl(var(--sidebar-foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                    EC
                  </text>
                </svg>
              <h1 className="text-xl font-bold text-sidebar-foreground">EduConnect</h1>
            </Link>
          </div>
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item: NavItem) => (
              <SheetClose asChild key={item.title}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors
                    ${pathname === item.href || (pathname === '/' && item.href === '/home')
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  onClick={() => setOpenMobile(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = React.useState<'es' | 'en'>('es');

  const texts = {
    es: {
      searchPlaceholder: "Buscar...",
      logout: "Cerrar Sesión",
      languageChanged: "Idioma Cambiado (Simulación)",
      languageChangedDesc: (lang: string) => `El idioma de los elementos clave se ha cambiado a ${lang}. Una traducción completa requiere i18n.`,
      searchSubmitted: "Búsqueda Enviada",
      searchSubmittedDesc: (query: string) => `Has buscado: "${query}". Funcionalidad de búsqueda no implementada.`,
      logoutDesc: "Funcionalidad de cerrar sesión no implementada.",
      userMenuLabel: "Menú de usuario"
    },
    en: {
      searchPlaceholder: "Search...",
      logout: "Log Out",
      languageChanged: "Language Changed (Simulation)",
      languageChangedDesc: (lang: string) => `Key element language changed to ${lang}. Full translation requires i18n.`,
      searchSubmitted: "Search Submitted",
      searchSubmittedDesc: (query: string) => `You searched for: "${query}". Search functionality not implemented.`,
      logoutDesc: "Logout functionality not implemented.",
      userMenuLabel: "User menu"
    }
  };

  const T = texts[currentLanguage];

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    toast({
      title: T.searchSubmitted,
      description: T.searchSubmittedDesc(searchQuery),
    });
  };

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setCurrentLanguage(lang);
    const langName = lang === 'es' ? 'Español' : 'English';
    toast({
      title: T.languageChanged,
      description: T.languageChangedDesc(langName),
    });
  };

  const handleLogout = () => {
    toast({
      title: T.logout,
      description: T.logoutDesc,
    });
  };

  return (
    <SidebarProvider defaultOpen={false}> 
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 shadow-sm">
          <MobileNavTrigger />
          <Link href="/home" className="flex items-center gap-2 mr-4">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
              <circle cx="20" cy="20" r="18" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="hsl(var(--primary))" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                EC
              </text>
            </svg>
            <span className="font-bold text-xl text-foreground hidden sm:inline-block">EduConnect</span>
          </Link>
          
          <DesktopNav />

          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            <form className="hidden sm:block" onSubmit={handleSearchSubmit}> 
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder={T.searchPlaceholder}
                  className="pl-8 w-full sm:w-[200px] md:w-[250px] lg:w-[300px] bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]"
                />
              </div>
            </form>
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
                 <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {T.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <MobileNavSheet />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
