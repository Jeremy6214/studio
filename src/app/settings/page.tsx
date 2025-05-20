
import { SettingsForm } from "@/components/auth/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Configuración de Usuario</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Actualiza tu información personal y preferencias de la aplicación.
        </p>
      </header>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Detalles de la Cuenta</CardTitle>
          </div>
          <CardDescription>
            Administra los detalles de tu perfil y las preferencias de la aplicación. Los cambios se guardarán localmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
