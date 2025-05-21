
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
  query: z.string().describe('The user_s question or request to the study assistant.'),
  language: z.enum(['es', 'en']).describe('The language the user is currently using in the UI.'),
  generateImageExplicitly: z.boolean().optional().describe('Whether the user explicitly asked for an image or the query implies a strong need for one.'),
});
export type StudyAssistantInput = z.infer<typeof StudyAssistantInputSchema>;

const StudyAssistantOutputSchema = z.object({
  mainResponse: z.string().describe("The main textual response from the assistant. This should be helpful, didactic, and in the user's language."),
  generatedImageUrl: z.string().optional().describe('The data URI of the generated image, if one was created. Format: data:image/png;base64,<base64_encoded_image>'),
  imageGenerationQuery: z.string().optional().describe('If an image was generated, this is the prompt used. If no image was generated but one might be useful, this is a suggested prompt for image generation.'),
  followUpSuggestions: z.array(z.string()).optional().describe('A few suggested follow-up questions or actions the user might want to take.'),
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;

export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  try {
    return await studyAssistantFlow(input);
  } catch (error: any) {
    console.error("Critical error in askStudyAssistant:", error);
    let errorMessage = input.language === 'es'
        ? 'Ocurrió un error inesperado al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.'
        : 'An unexpected error occurred while processing your request. Please try again later.';

    if (error.message && (error.message.includes('FAILED_PRECONDITION') || error.message.includes('API key'))) {
        errorMessage = input.language === 'es'
            ? 'Error de conexión con el servicio de IA: Parece que hay un problema con la configuración de la clave API (GOOGLE_API_KEY) en el servidor o con el acceso a los modelos de IA. Por favor, verifica la configuración.'
            : 'AI Service Connection Error: There seems to be an issue with the API key (GOOGLE_API_KEY) configuration on the server or access to the AI models. Please check the setup.';
    } else if (error.name === 'GenkitError') {
         errorMessage = input.language === 'es'
            ? `Error de Genkit: ${error.message}. Por favor, revisa los detalles y la configuración.`
            : `Genkit Error: ${error.message}. Please review the details and configuration.`;
    }
    return {
        mainResponse: errorMessage,
    };
  }
}

const internalStudyAssistantPrompt = ai.definePrompt({
  name: 'internalStudyAssistantPrompt',
  input: {schema: StudyAssistantInputSchema},
  output: {
    schema: z.object({
        responseText: z.string().describe("The assistant's direct textual answer to the user's query. This should be in the user's specified language."),
        imageQuerySuggestion: z.string().optional().describe("If the query could be significantly enhanced by an image (e.g., a diagram, map, visual comparison) OR if generateImageExplicitly is true, suggest a concise, descriptive, English prompt for an image generation model. Only suggest if truly helpful. Examples: 'simple diagram of the water cycle', 'map of the French Revolution major events', 'mind map of Pythagorean theorem applications'. If generateImageExplicitly is true, tailor the prompt to the user's request for an image."),
        followUps: z.array(z.string()).optional().describe("Suggest 2-3 brief follow-up questions or actions the user might find helpful, in their language.")
    })
  },
  prompt: `You are a helpful and knowledgeable AI Study Assistant for "DarkAIschool", a digital learning platform. Your primary role is to assist students and teachers.
Current UI Language for response: {{language}}
User's Query: "{{query}}"
User indicated need for an image: {{generateImageExplicitly}}

Your tasks are:
1.  Analyze the user's query carefully.
2.  Provide a clear, accurate, and didactic textual response (responseText) in the {{language}} language. Adapt your language to an appropriate academic level for a high school or early college student.
3.  Image Generation Decision:
    *   If '{{generateImageExplicitly}}' is true OR if you determine that a visual aid (like a diagram, map, simple illustration, or mind map) would significantly help in understanding the concept, formulate a concise and effective prompt in ENGLISH for an image generation model (imageQuerySuggestion).
    *   The image prompt should be descriptive and specific. Examples: "detailed diagram of a plant cell with labels", "historical map of the Silk Road trade routes", "visual comparison of mitosis and meiosis stages", "mind map summarizing the causes of World War I".
    *   Do NOT suggest an image query if the textual response is sufficient or if an image would not add significant value.
4.  If appropriate, suggest 2-3 brief follow-up questions or actions (followUps) in the {{language}} language that the user might find helpful.
5.  Guiding Principle: Do NOT give direct answers to homework or assignments if the user hasn't demonstrated prior effort or understanding. Instead, guide them through the learning process by asking clarifying questions, breaking down the problem, or explaining a foundational concept. Help them learn how to arrive at the answer.

Example Interaction (User asks in Spanish for Pythagorean theorem with an image):
User Query (es): "Explícame el teorema de Pitágoras con una imagen" (generateImageExplicitly would be true)
Your Output (for this prompt):
{
  "responseText": "El Teorema de Pitágoras establece que en un triángulo rectángulo, el cuadrado de la longitud de la hipotenusa (el lado opuesto al ángulo recto) es igual a la suma de los cuadrados de las longitudes de los otros dos lados (catetos). Se expresa como a² + b² = c², donde 'c' es la hipotenusa y 'a' y 'b' son los catetos. Es fundamental en geometría y trigonometría.",
  "imageQuerySuggestion": "diagram illustrating Pythagorean theorem with a right triangle labeled a, b, c, and squares on each side",
  "followUps": ["¿Puedes darme un ejemplo práctico con números?", "¿En qué tipo de problemas se usa el teorema de Pitágoras?"]
}

Example Interaction (User asks in English for study strategies):
User Query (en): "What are good study strategies for biology?" (generateImageExplicitly would likely be false unless they specified an image)
Your Output (for this prompt):
{
  "responseText": "For biology, effective study strategies include: \n1. Active Recall: Test yourself frequently. \n2. Spaced Repetition: Review material at increasing intervals. \n3. Concept Mapping: Visualize connections between topics. \n4. The Feynman Technique: Explain concepts in simple terms as if teaching someone else. \n5. Utilize diagrams and visual aids provided in your textbook or create your own.",
  "imageQuerySuggestion": "mind map illustrating effective biology study strategies",
  "followUps": ["Can you elaborate on concept mapping?", "How does the Feynman Technique work in practice?"]
}

Respond now based on the user's query: "{{query}}" and UI language: {{language}}.
`,
});


const studyAssistantFlow = ai.defineFlow(
  {
    name: 'studyAssistantFlow',
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async (input) => {
    let generatedImageUrl: string | undefined = undefined;
    let finalImageQuery: string | undefined = undefined;

    const { output: llmOutput, errors } = await internalStudyAssistantPrompt(input);

    if (errors || !llmOutput) {
      console.error('Error from internalStudyAssistantPrompt:', errors);
      const errorMessages = errors?.map(e => e.message).join('; ') || 'Unknown error';
      
      if (errorMessages.includes('FAILED_PRECONDITION') || errorMessages.includes('API key')) {
        throw new Error(input.language === 'es'
            ? 'Error de conexión con el servicio de IA: Clave API o acceso a modelos incorrecto.'
            : 'AI Service Connection Error: Incorrect API key or model access.');
      }
      throw new Error(input.language === 'es'
        ? `Hubo un problema con el asistente principal: ${errorMessages}`
        : `There was an issue with the main assistant: ${errorMessages}`);
    }

    const { responseText, imageQuerySuggestion, followUps } = llmOutput;
    finalImageQuery = imageQuerySuggestion;

    if (imageQuerySuggestion) {
      try {
        const { media, errors: imageErrors } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-exp',
          prompt: imageQuerySuggestion,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          },
        });

        if (imageErrors || !media || !media.url) {
          console.error('Error generating image or no media URL:', imageErrors);
          // Optionally, modify responseText to inform the user about image generation failure
        } else {
          generatedImageUrl = media.url;
        }
      } catch (err: any) {
        console.error('Exception during image generation:', err);
         if (err.message && (err.message.includes('FAILED_PRECONDITION') || err.message.includes('API key'))) {
            // Optionally, modify responseText to inform the user about image generation failure due to API key
        }
      }
    }

    return {
      mainResponse: responseText,
      generatedImageUrl: generatedImageUrl,
      imageGenerationQuery: finalImageQuery,
      followUpSuggestions: followUps,
    };
  }
);
