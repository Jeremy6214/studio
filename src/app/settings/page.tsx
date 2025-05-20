
"use client";
// import { SettingsForm } from "@/components/auth/settings-form"; // Ya no se usa el formulario complejo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Construction } from "lucide-react";
// import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"; // Ya no se usa
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  // const { user, loading } = useFirebaseAuth(); // Ya no se usa

  // if (loading) {
  //   return (
  //     <div className="space-y-8 max-w-3xl mx-auto">
  //       {/* Skeleton remains for layout consistency if page is kept */}
  //     </div>
  //   );
  // }

  // if (!user) { // Se asume que no hay usuario, por lo que esta página no es accesible o muestra un mensaje
    return (
      <div className="space-y-8 max-w-3xl mx-auto text-center py-10">
        <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">Página de Configuración</h1>
        <p className="text-muted-foreground text-lg">
          Esta sección estaría disponible para usuarios registrados.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          (Funcionalidad de inicio de sesión eliminada en esta versión)
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/home">Volver al Panel</Link>
        </Button>
      </div>
    );
  // }

  // return (
  //   <div className="space-y-8 max-w-3xl mx-auto">
  //     <header className="mb-8">
  //       <h1 className="text-4xl font-bold tracking-tight">Configuración de Usuario</h1>
  //       <p className="text-muted-foreground text-lg mt-2">
  //         Actualiza tu información personal y preferencias de la aplicación.
  //       </p>
  //     </header>
      
  //     <Card className="shadow-lg">
  //       <CardHeader>
  //         <div className="flex items-center space-x-3">
  //           <SettingsIcon className="h-6 w-6 text-primary" />
  //           <CardTitle className="text-2xl">Detalles de la Cuenta</CardTitle>
  //         </div>
  //         <CardDescription>
  //           Esta funcionalidad requiere inicio de sesión.
  //         </CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //          <p>La gestión de perfiles de usuario ha sido desactivada en esta versión.</p>
  //         {/* <SettingsForm currentUser={user} /> // Ya no se pasa currentUser */}
  //       </CardContent>
  //     </Card>
  //   </div>
  // );
}
