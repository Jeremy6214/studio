
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
    name: 'studyAssistantFlow',
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async (input: StudyAssistantInput): Promise<StudyAssistantOutput> => {
    const { query, language } = input;
    let mainTextResponse = "No pude procesar tu solicitud en este momento. Por favor, inténtalo de nuevo más tarde.";
    let imageQueryFromLLM: string | undefined = undefined;
    let followUps: string[] | undefined = undefined;
    let imageUrl: string | undefined = undefined;

    try {
      // 1. Get initial response and potential image generation query from the main LLM
      const llmResponse = await studyAssistantPrompt({ query, language });

      if (llmResponse.output) {
        mainTextResponse = llmResponse.output.directResponse;
        imageQueryFromLLM = llmResponse.output.imageGenerationQuery;
        followUps = llmResponse.output.suggestedFollowUps;
      } else {
        console.error("AI Study Assistant: LLM did not return a valid output structure.");
      }
    } catch (error) {
      console.error("AI Study Assistant: Error calling main LLM prompt:", error);
      // mainTextResponse is already set to a fallback
    }
    

    // 2. If an image generation query was provided, generate the image
    if (imageQueryFromLLM && imageQueryFromLLM.trim() !== "") {
      try {
        console.log(`AI Study Assistant: Attempting to generate image with prompt: "${imageQueryFromLLM}"`);
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-exp', // Specific model for image generation
          prompt: imageQueryFromLLM, // Use the prompt generated by the first LLM
          config: {
            responseModalities: ['TEXT', 'IMAGE'], // Must include TEXT even if only IMAGE is primary
            // Optionally, add safetySettings if needed for image generation
          },
        });
        if (media && media.url) {
          imageUrl = media.url;
          console.log("AI Study Assistant: Image generated successfully:", imageUrl.substring(0,100) + "...");
        } else {
          console.warn("AI Study Assistant: Image generation call succeeded but no media URL was returned.");
        }
      } catch (error) {
        console.error("AI Study Assistant: Error generating image:", error);
        // Optionally, inform the user that image generation failed but text response is available
        // For now, we just log it and the mainTextResponse will still be sent.
      }
    }

    return {
      mainResponse: mainTextResponse,
      generatedImageUrl: imageUrl,
      followUpSuggestions: followUps,
    };
  }
);

// Export a wrapper async function to be called from the client component
export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return internalStudyAssistantFlow(input);
}
