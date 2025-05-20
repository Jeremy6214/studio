
import type { LucideIcon } from 'lucide-react';
import { Settings, LayoutList, Star, LogOut } from 'lucide-react';

export interface UserNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  action?: () => void; // For actions like logout
  disabled?: boolean;
}

export const userNavItems: UserNavItem[] = [
  {
    title: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Mis Foros',
    href: '/my-forums',
    icon: LayoutList, // Example icon, consider MessageSquare
  },
  {
    title: 'Favoritos',
    href: '/favorites',
    icon: Star,
  },
  // Separator can be handled in layout
  {
    title: 'Cerrar Sesión',
    icon: LogOut,
    action: () => {
      // Placeholder for logout logic
      console.log("Cerrar Sesión clickeado");
      // Actual logout logic would go here (e.g., Firebase signOut)
    },
  },
];
