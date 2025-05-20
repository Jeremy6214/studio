
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, MessageSquareText, LifeBuoy, Archive } from 'lucide-react'; // Users icon removed as 'Asociados' is not in main nav per last update

export interface NavItem {
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
    title: 'Panel',
    href: '/home', // Updated from '/'
    icon: LayoutDashboard,
  },
  {
    title: 'Foros',
    href: '/forums',
    icon: MessageSquareText,
  },
  {
    title: 'Acceso de Recuperación',
    href: '/recovery-access',
    icon: LifeBuoy,
  },
  {
    title: 'Materiales de Estudio',
    href: '/study-materials',
    icon: Archive,
  },
];
