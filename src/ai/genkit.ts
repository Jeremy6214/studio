import {genkit} from 'genkit';
// import {openai} from '@genkit-ai/openai'; // Import OpenAI plugin - Temporarily commented out due to installation issues
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the GoogleAI plugin.
// If OpenAI installation issues are resolved, you can re-enable the openai plugin.
export const ai = genkit({
  plugins: [
    // openai({ // Temporarily commented out
    //   // You can specify a default text model here if you want, e.g.,
    //   // textModel: 'gpt-4o'
    //   // dallEModel: 'dall-e-3' // You can specify default DALL-E model too
    // }),
    googleAI({
      // You can specify a default text model for Google AI here if needed,
      // e.g., textModel: 'gemini-1.5-flash-latest'
      // By default, Genkit will use a suitable Gemini model.
    }),
  ],
  // IMPORTANT: Ensure GOOGLE_API_KEY is set in your .env.local or environment variables for Google AI.
  // IMPORTANT: If you re-enable OpenAI, ensure OPENAI_API_KEY is set.
});

// The ai.registry.selectModel method is not used in Genkit 1.x for this purpose.
// Models are specified directly in prompts or plugin configurations.
// For example, 'googleai/gemini-1.5-flash-latest' is already specified in study-assistant-flow.ts.
