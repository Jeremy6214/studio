'use server';
/**
 * @fileOverview AI Study Assistant para DarkAIschool, utilizando Genkit con Google AI (Gemini).
 *
 * - askStudyAssistant - Maneja consultas de usuarios.
 * - StudyAssistantInput - Tipo de entrada para la función.
 * - StudyAssistantOutput - Tipo de salida para la función.
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
  mainResponse: z.string().describe('La respuesta principal del asistente de estudio.'),
  generatedImageUrl: z.string().optional().describe('URL de la imagen generada, si se solicitó y se generó exitosamente.'),
  imageGenerationQuery: z.string().optional().describe('La consulta utilizada o sugerida para la generación de la imagen.'),
  followUpSuggestions: z.array(z.string()).optional().describe('Sugerencias para preguntas de seguimiento.'),
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;


const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantDarkAISchoolGoogleAI',
  model: 'googleai/gemini-1.5-flash-latest', // Using Google AI model
  input: { schema: StudyAssistantInputSchema },
  output: { schema: StudyAssistantOutputSchema },
  prompt: `Eres un Asistente de Estudio IA avanzado para "DarkAIschool". Tu objetivo es ayudar a estudiantes y docentes a comprender temas académicos, crear esquemas de estudio, resolver dudas y sugerir estrategias de aprendizaje.

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
  2. ADEMÁS, en el campo 'imageGenerationQuery', proporciona una consulta concisa y descriptiva (en inglés, ideal para modelos de imagen) para generar dicha imagen. Ej: "simple diagram of photosynthesis process", "concept map French Revolution causes". No incluyas esta consulta en la 'mainResponse'.
- Si no es apropiado generar una imagen o el usuario no lo pidió explícitamente y no es obvio, deja 'imageGenerationQuery' vacío.

Sugerencias de Seguimiento:
- Ofrece 2-3 sugerencias de seguimiento ('followUpSuggestions') que sean relevantes para la respuesta dada y fomenten una mayor exploración del tema.

Usuario Pregunta:
"{{query}}"
`,
  config: {
    // Gemini specific config if needed
    // temperature: 0.7, 
    safetySettings: [ // Example safety settings, adjust as needed
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const internalStudyAssistantFlow = ai.defineFlow(
  {
    name: 'studyAssistantFlowGoogleAI',
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async (input) => {
    try {
      const { output: mainAiResponse } = await studyAssistantPrompt(input);

      if (!mainAiResponse) {
        console.error('[studyAssistantFlowGoogleAI] No output from main prompt.');
        return {
          mainResponse: input.language === 'es' ? 'Lo siento, no pude procesar tu solicitud en este momento.' : "Sorry, I couldn't process your request at this time.",
        };
      }

      let imageUrl: string | undefined = undefined;
      if (mainAiResponse.imageGenerationQuery) {
        try {
          console.log(`Attempting to generate image with Gemini using query: "${mainAiResponse.imageGenerationQuery}"`);
          const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-exp', // Gemini model for image generation
            prompt: mainAiResponse.imageGenerationQuery,
            config: {
              responseModalities: ['TEXT', 'IMAGE'], // Crucial for Gemini image generation
            },
          });
          imageUrl = media?.url;
          if (imageUrl) {
            console.log("Image generated successfully by Gemini:", imageUrl);
          } else {
            console.warn("Gemini media response did not contain a URL for the image.");
            mainAiResponse.mainResponse += input.language === 'es' ? "\n(Pude procesar tu solicitud de texto, pero no se generó una imagen esta vez.)" : "\n(I could process your text request, but an image was not generated this time.)";
          }
        } catch (imgError: any) {
          console.error('Error generating image with Gemini:', imgError.message || imgError);
          let errorMsg = input.language === 'es' ? "\n(No pude generar la imagen solicitada en este momento.)" : "\n(I couldn't generate the requested image at this time.)";
           if (imgError.message && (imgError.message.includes('API key') || imgError.message.includes('AUTHENTICATION_ERROR') || imgError.message.includes('FAILED_PRECONDITION'))) {
            errorMsg = input.language === 'es'
              ? "\n(Error con la clave API de Google para imágenes. Por favor, verifica GOOGLE_API_KEY.)"
              : "\n(Error with Google API key for images. Please check GOOGLE_API_KEY.)";
          }
          mainAiResponse.mainResponse += errorMsg;
        }
      }

      return {
        mainResponse: mainAiResponse.mainResponse,
        generatedImageUrl: imageUrl,
        imageGenerationQuery: mainAiResponse.imageGenerationQuery,
        followUpSuggestions: mainAiResponse.followUpSuggestions,
      };

    } catch (error: any) {
      console.error('[studyAssistantFlowGoogleAI] Error:', error.message || error);
      if (error.message && (error.message.includes('API key') || error.message.includes('AUTHENTICATION_ERROR') || error.message.includes('FAILED_PRECONDITION'))) {
        return {
          mainResponse: input.language === 'es'
            ? "Error: Parece que hay un problema con la configuración de la clave API de Google (GOOGLE_API_KEY). Por favor, verifica que esté configurada correctamente en tus variables de entorno."
            : "Error: There seems to be an issue with the Google API key (GOOGLE_API_KEY) configuration. Please ensure it is set correctly in your environment variables.",
        };
      }
      return {
        mainResponse: input.language === 'es' ? 'Lo siento, ocurrió un error inesperado al procesar tu solicitud con Google AI.' : 'Sorry, an unexpected error occurred while processing your request with Google AI.',
      };
    }
  }
);

export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return internalStudyAssistantFlow(input);
}
