
import type { LucideIcon } from 'lucide-react';
import { Settings, LayoutList, Star, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';


export interface UserNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  action?: () => void; 
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
    icon: LayoutList,
  },
  {
    title: 'Favoritos',
    href: '/favorites',
    icon: Star,
  },
  {
    title: 'Cerrar Sesión',
    icon: LogOut,
    action: async () => {
      try {
        await signOut(auth);
        // La redirección o actualización de UI se maneja por el onAuthStateChanged listener
        console.log("Usuario cerró sesión");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        // Manejar el error, quizás con un toast
      }
    },
  },
];
