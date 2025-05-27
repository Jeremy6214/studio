
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, BookOpenText, MoonStar } from "lucide-react"; // Changed WandSparkles to MoonStar

export default function RootPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-br from-background via-card to-background">
      <div className="mb-8">
        <Rocket className="h-24 w-24 text-primary techno-glow-primary animate-pulse" />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
        Bienvenido a <span className="text-primary">DarkAIschool</span>
      </h1>
      <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl">
        Tu portal hacia el conocimiento y la maestría. Emprende tu aventura de aprendizaje con Nova y la comunidad.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/home" passHref>
          <Button size="lg" className="hover:scale-105 hover:brightness-125 transition-transform duration-200 techno-glow-primary shadow-lg px-8 py-6 text-lg">
            <BookOpenText className="mr-2.5 h-5 w-5" />
            Acceder al Panel
          </Button>
        </Link>
         <Link href="/ai-assistant" passHref>
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-transform duration-200 techno-glow-primary shadow-lg px-8 py-6 text-lg">
            <MoonStar className="mr-2.5 h-5 w-5" /> {/* Changed from WandSparkles */}
            Contactar a Nova IA
          </Button>
        </Link>
      </div>
      <p className="mt-12 text-xs text-muted-foreground/70">
        DarkAIschool &copy; {new Date().getFullYear()} - Fomentando el futuro del conocimiento.
      </p>
    </div>
  );
}
