
import type { LucideIcon } from 'lucide-react';
import { Home, MessagesSquare, ShieldQuestion, Library, LayoutDashboard } from 'lucide-react'; // Updated icons

export interface NavItem {
  key: string; 
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  variant?: "default" | "ghost";
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    key: 'home',
    title: 'Panel', // Kept from previous state, was "Panel"
    href: '/home', 
    icon: Home, // Changed from LayoutDashboard
  },
  {
    key: 'forums',
    title: 'Foros', // Kept from previous state
    href: '/forums',
    icon: MessagesSquare, // Changed from MessageSquareText
  },
  {
    key: 'recovery-access',
    title: 'Acceso de Recuperación', // Kept from previous state
    href: '/recovery-access',
    icon: ShieldQuestion, // Changed from LifeBuoy
  },
  {
    key: 'study-materials',
    title: 'Materiales de Estudio', // Kept from previous state
    href: '/study-materials',
    icon: Library, // Changed from Archive
  },
];
