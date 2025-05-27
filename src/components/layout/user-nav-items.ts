
import type { LucideIcon } from 'lucide-react';
import { Cog, ListChecks, Star, LogOut, MoonStar, Orbit } from 'lucide-react'; // Changed BrainCircuit to MoonStar

export interface UserNavItem {
  key: string; 
  defaultTitle: string;
  title?: string; 
  href?: string;
  icon: LucideIcon;
  action?: () => void; 
  actionKey?: string; 
  disabled?: boolean;
}

export const userNavItemsListDetails: UserNavItem[] = [
  { key: 'settings', defaultTitle: 'Configuración', href: '/settings', icon: Cog },
  { key: 'aiAssistant', defaultTitle: 'Asistente Nova', href: '/ai-assistant', icon: MoonStar }, // Changed from BrainCircuit
  { key: 'myForums', defaultTitle: 'Mis Foros', href: '/my-forums', icon: ListChecks },
  { key: 'favorites', defaultTitle: 'Favoritos', href: '/favorites', icon: Star },
  { key: 'logout', defaultTitle: 'Cerrar Sesión', icon: LogOut, actionKey: 'logoutAction' },
];
