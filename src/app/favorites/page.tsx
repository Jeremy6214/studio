
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarOff } from "lucide-react"; // StarOff para indicar funcionalidad no disponible
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Favoritos</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Accede rápidamente a tus posts, materiales o recursos marcados como favoritos.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <StarOff className="mr-2 h-5 w-5 text-destructive" /> {/* Icono cambiado */}
            Funcionalidad No Disponible
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Esta sección requiere que inicies sesión para guardar y ver tus elementos favoritos.
          </p>
           <p className="text-sm text-muted-foreground">
            (La funcionalidad de inicio de sesión ha sido eliminada en esta versión de la aplicación.)
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/home">Volver al Panel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
