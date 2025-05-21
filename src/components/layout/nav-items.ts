
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, MessageSquareText, LifeBuoy, Archive } from 'lucide-react'; 

export interface NavItem {
  key: string; // Added key for easier mapping and translation
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
    title: 'Panel',
    href: '/home', 
    icon: LayoutDashboard,
  },
  {
    key: 'forums',
    title: 'Foros',
    href: '/forums',
    icon: MessageSquareText,
  },
  {
    key: 'recovery-access',
    title: 'Acceso de Recuperación',
    href: '/recovery-access',
    icon: LifeBuoy,
  },
  {
    key: 'study-materials',
    title: 'Materiales de Estudio',
    href: '/study-materials',
    icon: Archive,
  },
];
