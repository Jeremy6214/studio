
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Default model for text generation tasks like prompts
  model: 'googleai/gemini-1.5-flash-latest', 
});
