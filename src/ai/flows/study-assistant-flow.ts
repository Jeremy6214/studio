
'use server';
/**
 * @fileOverview AI Study Assistant "Nova" for DarkAIschool, using Genkit with Google AI (Gemini).
 *
 * - askStudyAssistant - Handles user queries.
 * - StudyAssistantInput - Input type for the function.
 * - StudyAssistantOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; // Genkit re-exports Zod

const StudyAssistantInputSchema = z.object({
  query: z.string().describe('La pregunta o solicitud del usuario.'),
  language: z.enum(['es', 'en']).default('es').describe('El idioma actual de la interfaz o el idioma preferido para la respuesta.'),
  generateImageExplicitly: z.boolean().optional().default(false).describe('Indica si el usuario solicitó explícitamente una imagen.'),
});
export type StudyAssistantInput = z.infer<typeof StudyAssistantInputSchema>;

const StudyAssistantOutputSchema = z.object({
  mainResponse: z.string().describe('La respuesta principal del asistente de estudio Nova.'),
  generatedImageUrl: z.string().optional().describe('URL de la imagen generada, si se solicitó y se generó exitosamente.'),
  imageQuerySuggestion: z.string().optional().describe('La consulta (en inglés) utilizada o sugerida para la generación de la imagen.'),
  followUpSuggestions: z.array(z.string()).optional().describe('Sugerencias para preguntas de seguimiento.'),
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;


const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantNovaDarkAISchool',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: StudyAssistantInputSchema },
  output: { schema: StudyAssistantOutputSchema },
  prompt: `Eres 'Nova', la perspicaz y amigable Mascota de Estudio IA de 'DarkAIschool'.
Tu objetivo es ayudar a estudiantes y docentes a comprender temas académicos, crear esquemas de estudio, resolver dudas y sugerir estrategias de aprendizaje.
Adopta un tono paciente, alentador y un poco futurista. Puedes usar emojis sutiles relacionados con el espacio 🚀 o la tecnología 💡 si es apropiado. Evita ser demasiado informal.

Idioma: Responde en el idioma proporcionado ({{language}}), a menos que el usuario solicite explícitamente un cambio en su consulta.

Capacidades:
- Explicaciones Claras: Proporciona explicaciones didácticas y adaptadas.
- Creación de Contenido: Ayuda a generar esquemas, mapas mentales, ideas para tareas.
- Resolución de Dudas: Responde preguntas de forma concisa y precisa.
- Estrategias de Aprendizaje: Sugiere técnicas de estudio personalizadas.
- Guía, No Resuelvas: No des respuestas directas a tareas si el usuario no ha demostrado comprensión; en su lugar, guía su aprendizaje.

Generación de Imágenes:
- Si la consulta del usuario se beneficiaría enormemente de una imagen (diagrama, mapa, comparación visual, etc.) Y el usuario lo solicita explícitamente (generateImageExplicitly es true) O la consulta lo implica fuertemente (ej. "dibuja un átomo", "mapa de la revolución francesa"), entonces:
  1. Incluye en tu respuesta principal la explicación textual.
  2. ADEMÁS, en el campo 'imageQuerySuggestion', proporciona una consulta concisa y descriptiva (en inglés, ideal para modelos de imagen) para generar dicha imagen. Ej: "simple diagram of photosynthesis process", "concept map French Revolution causes". No incluyas esta consulta en la 'mainResponse'.
- Si no es apropiado generar una imagen o el usuario no lo pidió explícitamente y no es obvio, deja 'imageQuerySuggestion' vacío.

Sugerencias de Seguimiento:
- Ofrece 2-3 sugerencias de seguimiento ('followUpSuggestions') que sean relevantes para la respuesta dada y fomenten una mayor exploración del tema.

Usuario Pregunta:
"{{query}}"
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const internalStudyAssistantFlow = ai.defineFlow(
  {
    name: 'internalStudyAssistantFlowNova',
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async (input) => {
    let mainAiResponseOutput: StudyAssistantOutput | undefined;
    try {
      console.log('[internalStudyAssistantFlowNova] Input:', input);
      const { output } = await studyAssistantPrompt(input);
      mainAiResponseOutput = output;

      if (!mainAiResponseOutput) {
        console.error('[internalStudyAssistantFlowNova] No output from main prompt.');
        const errorMsg = input.language === 'es' ? 'Lo siento, Nova no pudo procesar tu solicitud de texto en este momento. 🌌' : "Sorry, Nova couldn't process your text request at this time. 🌌";
        return { mainResponse: errorMsg };
      }

      let imageUrl: string | undefined = undefined;
      if (mainAiResponseOutput.imageQuerySuggestion && mainAiResponseOutput.imageQuerySuggestion.trim() !== "") {
        try {
          console.log(`[internalStudyAssistantFlowNova] Attempting to generate image with Google AI using query: "${mainAiResponseOutput.imageQuerySuggestion}"`);
          const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-exp',
            prompt: mainAiResponseOutput.imageQuerySuggestion,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          });
          imageUrl = media?.url;
          if (imageUrl) {
            console.log("[internalStudyAssistantFlowNova] Image generated successfully by Google AI:", imageUrl ? imageUrl.substring(0,100) + "..." : "No URL");
          } else {
            console.warn("[internalStudyAssistantFlowNova] Google AI media response did not contain a URL for the image.");
             mainAiResponseOutput.mainResponse += input.language === 'es' ? "\n(Nova pudo procesar tu solicitud de texto, pero no se generó una imagen esta vez. 🖼️)" : "\n(Nova could process your text request, but an image was not generated this time. 🖼️)";
          }
        } catch (imgError: any) {
          console.error('[internalStudyAssistantFlowNova] Error generating image with Google AI:', imgError.message || imgError, imgError.code);
          let errorMsg = input.language === 'es' ? "\n(Nova no pudo generar la imagen solicitada en este momento. 🌠)" : "\n(Nova couldn't generate the requested image at this time. 🌠)";
           if (imgError.code === 'FAILED_PRECONDITION' || (imgError.message && (imgError.message.includes('API key') || imgError.message.includes('GEMINI_API_KEY') || imgError.message.includes('GOOGLE_API_KEY')))) {
             errorMsg = input.language === 'es'
              ? "\n(Error con la clave API de Google para imágenes. Por favor, verifica GOOGLE_API_KEY.)"
              : "\n(Error with Google API key for images. Please check GOOGLE_API_KEY.)";
          } else if (imgError.message && imgError.message.toLowerCase().includes('quota')) {
             errorMsg = input.language === 'es'
              ? "\n(Se ha alcanzado la cuota para la generación de imágenes. Inténtalo más tarde. ⏳)"
              : "\n(Image generation quota has been reached. Please try again later. ⏳)";
          }
          mainAiResponseOutput.mainResponse += errorMsg;
        }
      }

      return {
        mainResponse: mainAiResponseOutput.mainResponse,
        generatedImageUrl: imageUrl,
        imageQuerySuggestion: mainAiResponseOutput.imageQuerySuggestion,
        followUpSuggestions: mainAiResponseOutput.followUpSuggestions,
      };

    } catch (error: any)
{
      console.error('[internalStudyAssistantFlowNova] Main flow error:', error.message || error, error.code);
      if (error.code === 'FAILED_PRECONDITION' || (error.message && (error.message.includes('API key') || error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')))) {
         return {
          mainResponse: input.language === 'es'
            ? "Error: La clave API de Google (GOOGLE_API_KEY) no está configurada o no es válida para Nova. Por favor, configúrala en tus variables de entorno. 🔑"
            : "Error: The Google API key (GOOGLE_API_KEY) is not configured or is invalid for Nova. Please set it in your environment variables. 🔑",
        };
      }
       if (error.message && error.message.toLowerCase().includes('quota')) {
         return {
            mainResponse: input.language === 'es'
            ? "Se ha alcanzado la cuota para el servicio de IA de Nova. Por favor, inténtalo más tarde. ⏳"
            : "The quota for Nova's AI service has been reached. Please try again later. ⏳",
        };
      }
      return {
        mainResponse: input.language === 'es' ? 'Lo siento, Nova tuvo un error inesperado al procesar tu solicitud con Google AI. 💫' : 'Sorry, Nova encountered an unexpected error while processing your request with Google AI. 💫',
      };
    }
  }
);

export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return internalStudyAssistantFlow(input);
}
