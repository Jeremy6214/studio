
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, BarChartBig, MessageCircleMore, MoonStar, BookHeart } from "lucide-react"; // Changed WandSparkles to MoonStar
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Panel de DarkAIschool</h1>
        <p className="text-muted-foreground text-lg mt-2">
          ¡Bienvenido! Aquí tienes un resumen de tu actividad y progreso.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-primary/30 transition-all duration-300 bg-card hover:scale-[1.03] group">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-xl text-foreground group-hover:text-primary transition-colors">
              <Zap className="mr-3 h-6 w-6 text-primary group-hover:techno-glow-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription className="text-sm">Interacciones y progresos clave.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Aún no hay actividad reciente para mostrar.</p>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Gráfico abstracto de actividad"
              width={600}
              height={400}
              className="mt-4 rounded-lg opacity-75 group-hover:opacity-100 transition-opacity"
              data-ai-hint="abstract graph dark"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-secondary/30 transition-all duration-300 bg-card hover:scale-[1.03] group">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-xl text-foreground group-hover:text-secondary transition-colors">
              <BarChartBig className="mr-3 h-6 w-6 text-secondary group-hover:techno-glow-secondary" />
              Tu Progreso
            </CardTitle>
            <CardDescription className="text-sm">Sigue tu trayectoria de aprendizaje.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <p className="text-sm text-muted-foreground">El seguimiento del progreso aún no está implementado.</p>
             <Image
              src="https://placehold.co/600x400.png"
              alt="Gráfico de barras de progreso"
              width={600}
              height={400}
              className="mt-4 rounded-lg opacity-75 group-hover:opacity-100 transition-opacity"
              data-ai-hint="chart data dark"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-primary/30 transition-all duration-300 bg-card hover:scale-[1.03] group row-span-1 md:row-span-2 flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-xl text-foreground group-hover:text-primary transition-colors">
             <MessageCircleMore className="mr-3 h-6 w-6 text-primary group-hover:techno-glow-primary" />
              Foros Activos
            </CardTitle>
            <CardDescription className="text-sm">Únete a la conversación.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center text-center flex-grow justify-center">
            <Image
              src="https://placehold.co/300x200.png"
              alt="Icono de comunidad o foro"
              width={300}
              height={200}
              className="mb-4 rounded-lg shadow-sm group-hover:shadow-lg transition-shadow"
              data-ai-hint="community discussion dark"
            />
            <p className="text-sm text-muted-foreground mb-6">Interactúa con la comunidad, haz preguntas y comparte tu conocimiento.</p>
            <Link href="/forums" passHref>
              <Button variant="default" size="lg" className="hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary">Ir a los Foros</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-primary/30 transition-all duration-300 bg-card hover:scale-[1.03] group md:col-span-2">
           <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-xl text-foreground group-hover:text-primary transition-colors">
              <MoonStar className="mr-3 h-6 w-6 text-primary group-hover:techno-glow-primary" /> {/* Changed from WandSparkles */}
              Asistente IA Nova
            </CardTitle>
            <CardDescription className="text-sm">Tu guía personal en el aprendizaje.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
            <Image
              src="https://placehold.co/200x200.png"
              alt="Nova AI Assistant"
              width={150}
              height={150}
              className="rounded-full shadow-md border-2 border-primary group-hover:techno-glow-primary"
              data-ai-hint="robot mascot cute"
            />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-muted-foreground mb-4">
                Nova está lista para ayudarte a comprender temas complejos, generar ideas y optimizar tu estudio.
              </p>
              <Link href="/ai-assistant" passHref>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary">
                  Chatear con Nova
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-card hover:shadow-secondary/30 transition-all duration-300 hover:scale-[1.03] group">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center text-xl text-foreground group-hover:text-secondary transition-colors">
            <BookHeart className="mr-3 h-6 w-6 text-secondary group-hover:techno-glow-secondary" />
            Material de Estudio Destacado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Aún no hay materiales destacados. Consulta el <Link href="/study-materials" className="text-primary hover:text-primary/80 hover:underline">Repositorio de Materiales de Estudio</Link> para todos los recursos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
