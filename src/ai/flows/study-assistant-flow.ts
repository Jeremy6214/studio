
'use server';
/**
 * @fileOverview AI Study Assistant for DarkAIschool.
 *
 * - askStudyAssistant - Handles user queries, provides explanations, study aids, and optional image generation.
 * - StudyAssistantInput - Input type for the flow.
 * - StudyAssistantOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyAssistantInputSchema = z.object({
  query: z.string().describe('The user_s academic query or request for assistance.'),
  language: z.enum(['es', 'en']).describe('The primary language for the interaction, detected from the UI.'),
  // We could add conversationHistory here in the future for more context
});
export type StudyAssistantInput = z.infer<typeof StudyAssistantInputSchema>;

const StudyAssistantOutputSchema = z.object({
  mainResponse: z.string().describe('The main textual answer or explanation from the AI assistant.'),
  generatedImageUrl: z.string().optional().describe('URL of a generated image, if one was created to illustrate the concept.'),
  followUpSuggestions: z.array(z.string()).optional().describe('Optional follow-up questions or topics the user might be interested in.'),
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;


const AssistantPromptInputSchema = StudyAssistantInputSchema; // Same input for this prompt

const AssistantPromptOutputSchema = z.object({
    directResponse: z.string().describe("The direct, comprehensive answer to the user's query in the specified language."),
    imageGenerationQuery: z.string().optional().describe("If an image would significantly aid understanding (e.g., for diagrams, visual comparisons, concept maps), provide a concise, descriptive query for an image generation model. Otherwise, omit this field. Example: 'diagram of the pythagorean theorem with a right triangle labeled a, b, c' or 'concept map of the French Revolution key events'."),
    suggestedFollowUps: z.array(z.string()).optional().describe("Up to three relevant follow-up questions or topics the user might find helpful, in the specified language.")
});


const studyAssistantPrompt = ai.definePrompt({
  name: 'darkAISchoolAssistantPrompt',
  input: { schema: AssistantPromptInputSchema },
  output: { schema: AssistantPromptOutputSchema },
  prompt: `Eres un Asistente de Estudio Inteligente de DarkAIschool. Tu plataforma se llama "DarkAIschool".
Tu objetivo es ayudar a estudiantes y docentes a:
- Comprender mejor los temas académicos (por ejemplo, matemáticas, ciencias, historia, etc.)
- Crear esquemas de estudio, mapas conceptuales o ideas para tareas.
- Resolver dudas mediante explicaciones claras y didácticas.
- Sugerir estrategias de aprendizaje personalizadas.

Instrucciones Clave:
1.  Idioma: Debes responder en el idioma especificado: {{{language}}}. Sin embargo, si el usuario te pide explícitamente responder en un idioma diferente dentro de su consulta (ej. "...en inglés" o "...in Spanish"), prioriza esa solicitud para tu respuesta.
2.  Nivel Académico: Adapta tus respuestas para que sean claras y comprensibles para un estudiante de nivel secundario o universitario temprano. Evita jerga excesiva a menos que la expliques.
3.  Guía, No Resuelvas Tareas Directamente: Si una pregunta parece ser una tarea directa (ej. "¿Cuál es la respuesta a X?"), no proporciones la respuesta final. En su lugar, guía al usuario a través de los pasos para entender el concepto o resolver el problema por sí mismo. Pregunta qué ha intentado o qué parte específica no entiende.
4.  Generación de Imágenes (Condicional):
    *   Si la consulta del usuario se beneficiaría CLARAMENTE de una imagen simple (como un diagrama, un mapa conceptual básico, una comparación visual, o un resumen visual) Y si la solicitud implica visualización (ej. "muéstrame un diagrama", "con una imagen", "mapa mental"), entonces debes proponer una consulta para generar esa imagen.
    *   Esta consulta para la imagen debe ir en el campo 'imageGenerationQuery'. Debe ser concisa, descriptiva, y en inglés (ya que los modelos de imagen suelen funcionar mejor con inglés). Ejemplos: 'diagram of photosynthesis reactants and products', 'simple timeline of World War 1 major battles', 'concept map of machine learning types'.
    *   NO sugieras imágenes para preguntas abstractas que no se benefician de una visualización simple o si el usuario no lo sugiere. No intentes generar fotografías complejas.
5.  Respuesta Principal: Proporciona tu respuesta textual detallada en el campo 'directResponse'.
6.  Sugerencias de Seguimiento: Ofrece hasta 3 'suggestedFollowUps' relevantes si crees que podrían ayudar al usuario a profundizar o explorar temas relacionados.

Contexto del Usuario:
{{{query}}}
`,
});

// Main flow function - not exported directly
const internalStudyAssistantFlow = ai.defineFlow(
  {
    name: 'studyAssistantFlowInternal', // Renamed to avoid conflict if old one was cached
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async (input: StudyAssistantInput): Promise<StudyAssistantOutput> => {
    const { query, language } = input;
    let mainTextResponse = language === 'es' 
        ? "No pude procesar tu solicitud en este momento. Por favor, inténtalo de nuevo más tarde."
        : "I couldn't process your request at this time. Please try again later.";
    let imageQueryFromLLM: string | undefined = undefined;
    let followUps: string[] | undefined = undefined;
    let imageUrl: string | undefined = undefined;

    try {
      const llmResponse = await studyAssistantPrompt({ query, language });

      if (llmResponse.output) {
        mainTextResponse = llmResponse.output.directResponse;
        imageQueryFromLLM = llmResponse.output.imageGenerationQuery;
        followUps = llmResponse.output.suggestedFollowUps;
      } else {
        console.error("AI Study Assistant: LLM did not return a valid output structure from studyAssistantPrompt.");
        // Fallback mainTextResponse is already set
      }
    } catch (error: any) {
      console.error("AI Study Assistant: Error calling main LLM prompt (studyAssistantPrompt):", error);
      if (error.message && (error.message.includes('FAILED_PRECONDITION') || error.message.includes('API key') || error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY'))) {
        mainTextResponse = language === 'es'
            ? "Error de configuración: Parece que la clave API de Google AI (GOOGLE_API_KEY) no está configurada correctamente, no es válida, o el servicio no está habilitado. Por favor, verifica la variable de entorno GOOGLE_API_KEY en tu archivo .env.local y asegúrate de que la API 'Generative Language API' esté habilitada en tu proyecto de Google Cloud."
            : "Configuration Error: It seems the Google AI API key (GOOGLE_API_KEY) is not configured correctly, is invalid, or the service is not enabled. Please check the GOOGLE_API_KEY environment variable in your .env.local file and ensure the 'Generative Language API' is enabled in your Google Cloud project.";
      }
      // Otherwise, the generic fallback message is already set
      return { // Return early with error message
        mainResponse: mainTextResponse,
        generatedImageUrl: undefined,
        followUpSuggestions: undefined,
      };
    }
    

    if (imageQueryFromLLM && imageQueryFromLLM.trim() !== "" && !mainTextResponse.startsWith("Error de configuración") && !mainTextResponse.startsWith("Configuration Error")) {
      try {
        console.log(`AI Study Assistant: Attempting to generate image with prompt: "${imageQueryFromLLM}"`);
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-exp',
          prompt: imageQueryFromLLM,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        if (media && media.url) {
          imageUrl = media.url;
          console.log("AI Study Assistant: Image generated successfully.");
        } else {
          console.warn("AI Study Assistant: Image generation call succeeded but no media URL was returned.");
        }
      } catch (error: any) {
        console.error("AI Study Assistant: Error generating image:", error);
        if (language === 'es') {
            mainTextResponse += "\n\n(Hubo un problema al intentar generar la imagen solicitada. Por favor, verifica que el modelo 'gemini-2.0-flash-exp' esté disponible y tu configuración API lo permita.)";
        } else {
            mainTextResponse += "\n\n(There was an issue trying to generate the requested image. Please ensure the 'gemini-2.0-flash-exp' model is available and your API setup allows it.)";
        }
      }
    }

    return {
      mainResponse: mainTextResponse,
      generatedImageUrl: imageUrl,
      followUpSuggestions: followUps,
    };
  }
);

export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return internalStudyAssistantFlow(input);
}
