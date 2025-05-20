
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutList } from "lucide-react";

export default function MyForumsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Mis Foros</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Aquí verás las discusiones que has iniciado o en las que participas activamente.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LayoutList className="mr-2 h-5 w-5 text-accent" />
            Tus Contribuciones
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
