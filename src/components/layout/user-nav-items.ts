
import type { LucideIcon } from 'lucide-react';
import { Cog, ListChecks, Star, LogOut, MoonStar } from 'lucide-react';

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
  { key: 'aiAssistant', defaultTitle: 'Asistente Nova', href: '/ai-assistant', icon: MoonStar },
  { key: 'myForums', defaultTitle: 'Mis Foros', href: '/my-forums', icon: ListChecks, disabled: true }, // Keep disabled as it's a placeholder
  { key: 'favorites', defaultTitle: 'Favoritos', href: '/favorites', icon: Star, disabled: true }, // Keep disabled as it's a placeholder
  { key: 'logout', defaultTitle: 'Cerrar Sesión (Simulado)', icon: LogOut, actionKey: 'logoutAction' },
];
