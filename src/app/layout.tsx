
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google'; // Changed from Geist
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
  title: 'DarkAISchool',
  description: 'Forja tu camino con las herramientas de DarkAISchool para acólitos y gremios.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning> {/* Added suppressHydrationWarning for theme handling */}
      <body className={`${figtree.variable} font-sans antialiased`}> {/* Apply font variable and a sans-serif fallback */}
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
