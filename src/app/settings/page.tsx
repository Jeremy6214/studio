
"use client";
import { SettingsForm } from "@/components/auth/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"; // Asegúrate que la ruta es correcta
import { Skeleton } from "@/components/ui/skeleton"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <header className="mb-8">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2 mt-2" />
        </header>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <Skeleton className="h-8 w-1/3" />
            </div>
             <Skeleton className="h-4 w-full mt-1" />
             <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto text-center py-10">
        <SettingsIcon className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground text-lg">
          Debes iniciar sesión para acceder a la configuración de tu cuenta.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
         <p className="text-sm text-muted-foreground mt-4">
          ¿No tienes una cuenta? <Link href="/register" className="text-primary hover:underline">Regístrate aquí</Link>.
        </p>
      </div>
    );
  }

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
            Administra los detalles de tu perfil y las preferencias de la aplicación. Tus cambios se guardarán en Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm currentUser={user} />
        </CardContent>
      </Card>
    </div>
  );
}
