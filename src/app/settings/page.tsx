
"use client";
import { SettingsForm } from "@/components/auth/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, loading, userProfile } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <header className="mb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </header>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            <Skeleton className="h-4 w-2/3 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Con el hook simulado, user siempre existirá después de la carga inicial.
  // Esta comprobación es más por si se cambia la lógica del hook en el futuro.
  if (!user) { 
    return (
      <div className="space-y-8 max-w-3xl mx-auto text-center py-10">
        <SettingsIcon className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">Página de Configuración</h1>
        <p className="text-muted-foreground text-lg">
          Esta sección requiere que inicies sesión (simulado como "uid_test").
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Configuración de Usuario</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Actualiza tu información personal y preferencias de la aplicación para el usuario "{user.displayName || user.uid}".
        </p>
      </header>
      
      <Card className="shadow-lg bg-card">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-6 w-6 text-accent" />
            <CardTitle className="text-2xl text-primary-foreground">Detalles de la Cuenta</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Modifica tus datos personales y las preferencias de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
