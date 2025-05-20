
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

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
            <Star className="mr-2 h-5 w-5 text-accent" />
            Tus Elementos Guardados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            (Contenido pendiente de implementación)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
