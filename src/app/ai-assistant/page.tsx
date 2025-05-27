
// src/app/ai-assistant/page.tsx
import { AiAssistantLayout } from "@/components/ai/ai-assistant-layout";
import { MoonStar } from "lucide-react"; // Changed from WandSparkles

export default function AiAssistantPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="pb-4 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center text-foreground">
          <MoonStar className="mr-3 h-8 w-8 text-primary techno-glow-primary" /> {/* Changed from WandSparkles */}
          Asistente IA Nova
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Tu copiloto en la aventura del conocimiento. Nova está aquí para ayudarte.
        </p>
      </header>
      <div className="flex-grow min-h-0"> {}
        <AiAssistantLayout />
      </div>
    </div>
  );
}
