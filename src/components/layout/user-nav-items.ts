
import type { LucideIcon } from 'lucide-react';
import { Settings, LayoutList, Star, LogOut, UserCircle, BrainCircuit } from 'lucide-react'; // BrainCircuit for AI

export interface UserNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  action?: () => void; 
  disabled?: boolean;
}

// Lista de items simplificada o vacía si no hay sesión de usuario.
export const userNavItemsListDetails: Array<{ key: string; defaultTitle: string; href?: string; icon: LucideIcon; actionKey?: 'logoutAction' }> = [
  { key: 'settings', defaultTitle: 'Configuración', href: '/settings', icon: Settings },
  { key: 'aiAssistant', defaultTitle: 'Asistente Nova', href: '/ai-assistant', icon: BrainCircuit },
  { key: 'myForums', defaultTitle: 'Mis Foros', href: '/my-forums', icon: LayoutList },
  { key: 'favorites', defaultTitle: 'Favoritos', href: '/favorites', icon: Star },
  { key: 'logout', defaultTitle: 'Cerrar Sesión', icon: LogOut, actionKey: 'logoutAction' },
];
