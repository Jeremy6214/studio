
// src/app/ai-assistant/page.tsx
import { AiAssistantLayout } from "@/components/ai/ai-assistant-layout";
import { BrainCircuit } from "lucide-react";

export default function AiAssistantPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center">
          <BrainCircuit className="mr-3 h-8 w-8 text-primary" />
          Asistente IA Nova
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Gestiona tus conversaciones con Nova y obtén ayuda personalizada.
        </p>
      </header>
      <AiAssistantLayout />
    </div>
  );
}
