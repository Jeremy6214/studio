
'use server';
/**
 * @fileOverview AI Study Assistant "Nova" for EduConnect, using Genkit with Google AI (Gemini).
 *
 * - askStudyAssistant - Handles user queries.
 * - StudyAssistantInput - Input type for the function.
 * - StudyAssistantOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyAssistantInputSchema = z.object({
  query: z.string().describe('La consulta del usuario.'),
  language: z.enum(['es', 'en']).default('es').describe('El idioma actual de la interfaz o el idioma preferido para la respuesta.'),
  generateImageExplicitly: z.boolean().optional().default(false).describe('Indica si el usuario solicitó explícitamente una imagen o si la consulta lo sugiere fuertemente.'),
});
export type StudyAssistantInput = z.infer<typeof StudyAssistantInputSchema>;

const StudyAssistantOutputSchema = z.object({
  mainResponse: z.string().describe('La respuesta principal del asistente de estudio Nova.'),
  generatedImageUrl: z.string().optional().describe('URL de la imagen generada, si se solicitó y se generó exitosamente.'),
  imageQuerySuggestion: z.string().optional().describe('La consulta (en inglés) utilizada o sugerida para la generación de la imagen.'),
  followUpSuggestions: z.array(z.string()).optional().describe('Sugerencias para preguntas de seguimiento que fomenten una mayor exploración.'),
  isError: z.boolean().optional().default(false).describe('Indica si la respuesta es un mensaje de error.')
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;


const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantNovaEduConnect', // Updated name for EduConnect
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: StudyAssistantInputSchema },
  output: { schema: StudyAssistantOutputSchema.omit({ isError: true }) },
  prompt: `Eres 'Nova', la Asistente de Estudio IA de 'EduConnect'. Tu objetivo es ayudar a estudiantes y docentes a comprender temas académicos, crear esquemas de estudio, resolver dudas y sugerir estrategias de aprendizaje.
Adopta un tono paciente, alentador y claro. Puedes usar emojis sutiles relacionados con el aprendizaje 💡, libros 📚 o ideas ✨ si es apropiado. Evita ser demasiado informal.

Idioma: Responde en el idioma proporcionado ({{language}}), a menos que el usuario solicite explícitamente un cambio en su consulta.

Capacidades:
- Explicaciones Claras: Proporciona explicaciones didácticas y adaptadas.
- Creación de Contenido: Ayuda a generar esquemas, mapas mentales, ideas para tareas.
- Resolución de Dudas: Responde preguntas de forma concisa y precisa.
- Estrategias de Aprendizaje: Sugiere técnicas de estudio personalizadas.
- Guía, No Resuelvas Directamente: No des respuestas directas a tareas si el usuario no ha demostrado comprensión; en su lugar, guía su aprendizaje con pistas o preguntas.

Generación de Imágenes:
- Si la consulta del usuario se beneficiaría enormemente de una imagen (diagrama, mapa conceptual, comparación visual, etc.) Y (el usuario lo solicita explícitamente con palabras como 'imagen', 'dibuja', 'diagrama', 'mapa', 'visualiza' O el campo 'generateImageExplicitly' es true) O (la consulta lo implica fuertemente, ej. "muéstrame un átomo", "mapa de la revolución francesa"), entonces:
  1. Incluye en tu respuesta principal ('mainResponse') la explicación textual.
  2. ADEMÁS, en el campo 'imageQuerySuggestion', proporciona una consulta concisa y descriptiva (en inglés, ideal para modelos de imagen) para generar dicha imagen. Ej: "simple diagram of photosynthesis process", "concept map French Revolution causes", "diagram of a neural network". No incluyas esta consulta en la 'mainResponse'.
- Si no es apropiado generar una imagen o el usuario no lo pidió explícitamente y no es obvio, deja 'imageQuerySuggestion' vacío.

Sugerencias de Seguimiento:
- Ofrece 2-3 sugerencias de seguimiento ('followUpSuggestions') que sean relevantes para la respuesta dada y fomenten una mayor exploración del tema. Deben ser concisas y accionables.

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
    temperature: 0.6, // Slightly less creative, more focused on educational accuracy
  },
});

const internalStudyAssistantFlow = ai.defineFlow(
  {
    name: 'internalStudyAssistantFlowNovaEduConnect', // Updated name
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async (input): Promise<StudyAssistantOutput> => {
    let mainAiResponseOutput: Omit<StudyAssistantOutput, 'isError'> | undefined;
    const errorBase = { mainResponse: "", isError: true, followUpSuggestions: [] };

    try {
      console.log('[NovaFlow] Input:', input);
      const { output } = await studyAssistantPrompt(input);
      mainAiResponseOutput = output;

      if (!mainAiResponseOutput) {
        console.error('[NovaFlow] No output from main prompt. Check LLM response and API key validity.');
        const errorMsg = input.language === 'es' ? 'Nova no pudo procesar tu solicitud de texto en este momento. 🌌 Parece que hay un problema de comunicación.' : "Nova couldn't process your text request at this time. 🌌 Communication issue detected.";
        return { ...errorBase, mainResponse: errorMsg };
      }

      let imageUrl: string | undefined = undefined;
      if (mainAiResponseOutput.imageQuerySuggestion && mainAiResponseOutput.imageQuerySuggestion.trim() !== "") {
        try {
          console.log(`[NovaFlow] Attempting to generate image with Google AI using query: "${mainAiResponseOutput.imageQuerySuggestion}"`);
          const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-exp',
            prompt: mainAiResponseOutput.imageQuerySuggestion,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          });
          imageUrl = media?.url;
          if (imageUrl) {
            console.log("[NovaFlow] Image generated successfully:", imageUrl.substring(0,100) + "...");
          } else {
            console.warn("[NovaFlow] Media response did not contain a URL for the image.");
             mainAiResponseOutput.mainResponse += input.language === 'es' ? "\n(Nova pudo procesar tu solicitud de texto, pero la visualización no se materializó esta vez. 🖼️)" : "\n(Nova could process your text request, but the visualization didn't materialize this time. 🖼️)";
          }
        } catch (imgError: any) {
          console.error('[NovaFlow] Error generating image:', imgError.message || imgError, imgError.code);
          let errorMsg = input.language === 'es' ? "\n(Nova no pudo materializar la visualización solicitada en este momento. 🌠)" : "\n(Nova couldn't materialize the requested visualization at this time. 🌠)";
           if (imgError.message && (imgError.message.includes('API key') || imgError.message.includes('GEMINI_API_KEY') || imgError.message.includes('GOOGLE_API_KEY')) || imgError.code === 'UNAUTHENTICATED' || imgError.code === 'PERMISSION_DENIED') {
             errorMsg = input.language === 'es'
              ? "\n(Error de autenticación con el servicio de imágenes. Verifica tu GOOGLE_API_KEY y sus permisos para imágenes.)"
              : "\n(Authentication error with the image service. Please check your GOOGLE_API_KEY and its permissions for images.)";
          } else if (imgError.message && imgError.message.toLowerCase().includes('quota')) {
             errorMsg = input.language === 'es'
              ? "\n(Se ha alcanzado la cuota para visualizaciones. Inténtalo más tarde. ⏳)"
              : "\n(Quota for visualizations has been reached. Please try again later. ⏳)";
          } else if (imgError.message && (imgError.message.toLowerCase().includes('unsupported') || imgError.message.toLowerCase().includes('model cannot be used'))) {
            errorMsg = input.language === 'es'
              ? "\n(El servicio de imágenes no pudo procesar esa solicitud o el modelo no está disponible. Intenta con otra idea. 🤔)"
              : "\n(The image service couldn't process that image request or the model is unavailable. Try another idea. 🤔)";
          }
          mainAiResponseOutput.mainResponse += errorMsg;
        }
      }

      return {
        mainResponse: mainAiResponseOutput.mainResponse,
        generatedImageUrl: imageUrl,
        imageQuerySuggestion: mainAiResponseOutput.imageQuerySuggestion,
        followUpSuggestions: mainAiResponseOutput.followUpSuggestions,
        isError: false
      };

    } catch (error: any) {
      console.error('[NovaFlow] Main flow error:', error.message || error, error.code, error.stack);
      let responseText = "";
      if (error.message && (error.message.includes('API key') || error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')) || error.code === 'UNAUTHENTICATED' || error.code === 'PERMISSION_DENIED' || error.code === 'FAILED_PRECONDITION') {
         responseText = input.language === 'es'
            ? "Error de Configuración: La clave de acceso a la IA (GOOGLE_API_KEY) no está configurada, no es válida o no tiene permisos para Nova. Por favor, verifica tus credenciales y permisos en las variables de entorno y en Google Cloud Console. 🔑"
            : "Configuration Error: The AI access key (GOOGLE_API_KEY) is not configured, is invalid, or lacks permissions for Nova. Please check your credentials and permissions in the environment variables and Google Cloud Console. 🔑";
      } else if (error.message && error.message.toLowerCase().includes('quota')) {
         responseText = input.language === 'es'
            ? "Límite Alcanzado: Se ha alcanzado la cuota para el servicio de IA de Nova. Por favor, inténtalo más tarde. ⏳"
            : "Limit Reached: The quota for Nova's AI service has been reached. Please try again later. ⏳";
      } else if (error.message && error.message.toLowerCase().includes('unsupported content')) {
        responseText = input.language === 'es'
            ? "Contenido No Soportado: Nova no pudo procesar parte de tu solicitud. Intenta reformular. ⚙️"
            : "Unsupported Content: Nova couldn't process part of your request. Try rephrasing. ⚙️";
      }
       else {
        responseText = input.language === 'es' ? 'Error Inesperado: Nova tuvo un error al procesar tu solicitud con el servicio de IA. 💫' : 'Unexpected Error: Nova encountered an error while processing your request with the AI service. 💫';
      }
      return { ...errorBase, mainResponse: responseText };
    }
  }
);

export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return internalStudyAssistantFlow(input);
}
