import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";

// Configure Figtree font
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree', // Use a CSS variable
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EduConnect',
  description: 'Plataforma educativa para estudiantes y educadores.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${figtree.variable} font-sans antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
