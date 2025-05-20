
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, BookOpenCheck, MessageSquareText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-muted-foreground text-lg mt-2">
          ¡Bienvenido de nuevo! Aquí tienes un resumen de tu actividad en EduConnect.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary-foreground">
              <Activity className="mr-2 h-5 w-5 text-accent" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Resumen de tus últimas interacciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay actividad reciente para mostrar.</p>
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Gráfico abstracto de actividad" 
              width={300} 
              height={200} 
              className="mt-4 rounded-md opacity-75"
              data-ai-hint="abstract graph dark"
            />
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary-foreground">
              <BarChart3 className="mr-2 h-5 w-5 text-accent" />
              Tu Progreso
            </CardTitle>
            <CardDescription>Sigue tu trayectoria de aprendizaje.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">El seguimiento del progreso aún no está implementado.</p>
             <Image 
              src="https://placehold.co/600x400.png" 
              alt="Gráfico de barras de progreso" 
              width={300} 
              height={200} 
              className="mt-4 rounded-md opacity-75"
              data-ai-hint="chart data dark"
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary-foreground">
             <MessageSquareText className="mr-2 h-5 w-5 text-accent" />
              Acceso Rápido: Foros
            </CardTitle>
            <CardDescription>Participa en las discusiones.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Image 
              src="https://placehold.co/300x200.png" 
              alt="Icono de comunidad o foro" 
              width={150} 
              height={100} 
              className="mb-4 rounded-md"
              data-ai-hint="community people dark"
            />
            <p className="text-sm text-muted-foreground mb-4">Interactúa con la comunidad, haz preguntas y comparte tu conocimiento.</p>
            <Link href="/forums" passHref>
              <Button variant="default">Ir a los Foros</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-primary-foreground">
            <BookOpenCheck className="mr-2 h-5 w-5 text-accent" />
            Material de Estudio Destacado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No hay materiales destacados por el momento. Consulta el <Link href="/study-materials" className="text-primary hover:underline">Repositorio de Materiales de Estudio</Link> para todos los recursos disponibles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
