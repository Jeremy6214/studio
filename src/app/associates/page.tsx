import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AssociatesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Asociados</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Descubre y conecta con otros miembros de la legión.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-accent" />
            Directorio de Miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí se mostrará una lista de los asociados. (Contenido pendiente de implementación)
          </p>
          {/* Placeholder for future content, like a list or grid of users */}
        </CardContent>
      </Card>
    </div>
  );
}
