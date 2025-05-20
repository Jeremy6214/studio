
import type { LucideIcon } from 'lucide-react';
import { Settings, LayoutList, Star, LogOut, UserCircle } from 'lucide-react';
// No importamos de Firebase

export interface UserNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  action?: () => void; // Ya no es async
  disabled?: boolean;
}

// Lista de items simplificada o vacía si no hay sesión de usuario.
// Como no hay sesión de usuario, estas opciones no tienen mucho sentido.
// Las dejaré comentadas o puedes eliminarlas.
export const userNavItems: UserNavItem[] = [
  // {
  //   title: 'Configuración',
  //   href: '/settings',
  //   icon: Settings,
  // },
  // {
  //   title: 'Mis Foros',
  //   href: '/my-forums',
  //   icon: LayoutList,
  // },
  // {
  //   title: 'Favoritos',
  //   href: '/favorites',
  //   icon: Star,
  // },
  // {
  //   title: 'Iniciar Sesión', // Cambiado de Cerrar Sesión
  //   href: '/login', // Asumimos una página de login placeholder
  //   icon: UserCircle, 
  // },
];
