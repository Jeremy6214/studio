import {genkit} from 'genkit';
// import {openai} from '@genkit-ai/openai'; // Import OpenAI plugin
import {googleAI} from '@genkit-ai/googleai'; // Keep GoogleAI for now if needed for specific models or fallback

// Initialize Genkit with the GoogleAI plugin.
// IMPORTANT: Ensure GOOGLE_API_KEY is set in your .env.local or environment variables.
export const ai = genkit({
  plugins: [
    googleAI({
      // You can specify a default text model for Google AI here if desired, e.g.:
      // textModel: 'gemini-1.5-flash-latest'
      // You can also specify a default image generation model if the plugin supports it directly
      // or handle it within the flow.
    }),
    // openai({ // Comentado o eliminar si solo se usa GoogleAI
    //   // Puedes especificar un modelo de texto de OpenAI por defecto aquí si lo deseas, ej:
    //   // textModel: 'gpt-4o'
    //   // dallEModel: 'dall-e-3' // También puedes especificar el modelo DALL-E por defecto
    // }),
  ],
  // Ensure GOOGLE_API_KEY (for Google AI) is set in your environment variables.
  // If you were using OpenAI, OPENAI_API_KEY would be needed.
});
