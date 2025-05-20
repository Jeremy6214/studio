
// This file can be removed or repurposed if /home is the new default.
// For now, let's make it redirect to /home or just show a minimal message.
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootPage() {
  // Option 1: Redirect (requires 'use client' and useRouter or server-side redirect in next.config.js)
  // Option 2: Simple link page
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-4xl font-bold mb-4">Bienvenido a EduConnect</h1>
      <p className="text-lg text-muted-foreground mb-8">
        La plataforma de aprendizaje ha sido actualizada.
      </p>
      <Link href="/home" passHref>
        <Button size="lg">Ir al Panel Principal</Button>
      </Link>
    </div>
  );
}
