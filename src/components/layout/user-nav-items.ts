
import type { LucideIcon } from 'lucide-react';
import { Settings, LayoutList, Star, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Ensure auth is imported from your firebase config


export interface UserNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  action?: () => Promise<void>; // Action can be async
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
        // Optional: Redirect or UI update after sign-out can be handled by onAuthStateChanged listener in useFirebaseAuth or AppLayout
        console.log("Usuario cerró sesión exitosamente.");
        // Consider redirecting to login page or home after logout
        if (typeof window !== 'undefined') {
          window.location.href = '/login'; // Or use Next.js router if available in this context
        }
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        // Handle error, perhaps with a toast notification if this function is called from a UI component
      }
    },
  },
];
