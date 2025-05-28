
// No 'use server' for static export
/**
 * @fileOverview A SIMULATED AI Study Assistant "Nova" for DarkAIschool.
 * This version provides predefined responses and does NOT use Genkit or external AI models.
 *
 * - askStudyAssistant - Handles user queries with simulated logic.
 * - StudyAssistantInput - Input type for the function.
 * - StudyAssistantOutput - Output type for the function.
 */

// Zod and Genkit 'ai' are removed as we are not using them for a static build.

export interface StudyAssistantInput {
  query: string;
  language: 'es' | 'en';
  generateImageExplicitly?: boolean;
}

export interface StudyAssistantOutput {
  mainResponse: string;
  generatedImageUrl?: string;
  imageQuerySuggestion?: string;
  followUpSuggestions?: string[];
  isError?: boolean;
}

const SIMULATED_RESPONSE_DELAY_MS = 500; // Simulate network delay

// Simple knowledge base for simulated responses
const knowledgeBase = {
  es: {
    "teorema de pitágoras": "El teorema de Pitágoras establece que en todo triángulo rectángulo, el cuadrado de la longitud de la hipotenusa es igual a la suma de los cuadrados de las respectivas longitudes de los catetos. Es una de las proposiciones más conocidas entre las que tienen nombre propio en la matemática. Fórmula: a² + b² = c².",
    "fotosíntesis": "La fotosíntesis es el proceso metabólico por el cual las plantas verdes y algunas otras formas de vida convierten la energía luminosa en energía química, que luego se utiliza para alimentar las actividades celulares. Se captura dióxido de carbono y se libera oxígeno.",
    "revolución francesa": "La Revolución Francesa fue un período de profundos cambios sociales y políticos en Francia que duró desde 1789 hasta 1799. Condujo al fin de la monarquía, el establecimiento de una república y, finalmente, al ascenso de Napoleón Bonaparte. Se caracterizó por la Declaración de los Derechos del Hombre y del Ciudadano."
  },
  en: {
    "pythagorean theorem": "The Pythagorean theorem states that in any right-angled triangle, the square of the length of the hypotenuse is equal to the sum of the squares of the respective lengths of the legs. It is one of the best-known propositions among those that have their own name in mathematics. Formula: a² + b² = c².",
    "photosynthesis": "Photosynthesis is the metabolic process by which green plants and some other life forms convert light energy into chemical energy, which is then used to fuel cellular activities. Carbon dioxide is captured and oxygen is released.",
    "french revolution": "The French Revolution was a period of profound social and political upheaval in France that lasted from 1789 to 1799. It led to the end of the monarchy, the establishment of a republic, and ultimately to the rise of Napoleon Bonaparte. It was characterized by the Declaration of the Rights of Man and of the Citizen."
  }
};


export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  const { query, language, generateImageExplicitly } = input;
  const lowerQuery = query.toLowerCase();

  let mainResponse = "";
  let generatedImageUrl: string | undefined = undefined;
  let imageQuerySuggestion: string | undefined = undefined;
  let followUpSuggestions: string[] = [];
  let isError = false;

  // Simulate responses based on keywords
  const langKnowledge = knowledgeBase[language] || knowledgeBase.es;
  let specificTopicExplained = false;

  for (const topic in langKnowledge) {
    if (lowerQuery.includes(topic)) {
      mainResponse = langKnowledge[topic as keyof typeof langKnowledge];
      followUpSuggestions = language === 'es' ? [`¿Puedes darme un ejemplo sobre "${topic}"?`, `¿Qué importancia tiene "${topic}"?`] : [`Can you give an example about "${topic}"?`, `What is the importance of "${topic}"?`];
      specificTopicExplained = true;
      break;
    }
  }

  if (!specificTopicExplained) {
    if (lowerQuery.includes("explícame") || lowerQuery.includes("explain")) {
      const topicMatch = lowerQuery.match(/(?:explícame|explain)\s+(.+)/i);
      const topic = topicMatch && topicMatch[1] ? topicMatch[1] : (language === 'es' ? "el tema solicitado" : "the requested topic");
      mainResponse = language === 'es' 
        ? `Claro, aquí tienes una explicación simulada sobre ${topic}: [Explicación detallada y didáctica simulada...]. ¿Necesitas que profundice en algún aspecto o que te dé un ejemplo?`
        : `Sure, here's a simulated explanation about ${topic}: [Detailed and didactic simulated explanation...]. Do you need me to elaborate on any aspect or give you an example?`;
      followUpSuggestions = language === 'es' ? [`¿Puedes darme un ejemplo de ${topic}?`, `¿Qué aplicaciones tiene ${topic}?`] : [`Can you give me an example of ${topic}?`, `What are the applications of ${topic}?`];
    } else if (lowerQuery.includes("plan de estudio") || lowerQuery.includes("study plan") || lowerQuery.includes("estrategias") || lowerQuery.includes("strategies")) {
      mainResponse = language === 'es'
        ? "Aquí tienes algunas estrategias de estudio simuladas que podrían ayudarte: 1. Técnica Pomodoro. 2. Mapas mentales. 3. Enseñanza activa a otros. ¿Quieres que detalle alguna?"
        : "Here are some simulated study strategies that might help you: 1. Pomodoro Technique. 2. Mind Maps. 3. Actively teach others. Would you like me to detail any of these?";
      followUpSuggestions = language === 'es' ? ["Detalla la técnica Pomodoro.", "¿Cómo hago un mapa mental efectivo?"] : ["Detail the Pomodoro Technique.", "How do I make an effective mind map?"];
    } else if (lowerQuery.includes("hola") || lowerQuery.includes("hello") || lowerQuery.includes("hi")) {
       mainResponse = language === 'es' 
          ? "¡Hola! Soy Nova ✨, tu Asistente de Estudio IA (Simulado) de DarkAIschool. ¿En qué puedo ayudarte hoy?" 
          : "Hi! I'm Nova ✨, your DarkAIschool AI Study Assistant (Simulated). How can I help you today?";
    } else {
      mainResponse = language === 'es' 
        ? `He recibido tu consulta: "${query}". Estoy aquí para ayudarte (simuladamente). ¿Podrías ser más específico sobre lo que necesitas?`
        : `I've received your query: "${query}". I'm here to help you (simulated). Could you be more specific about what you need?`;
      followUpSuggestions = language === 'es' ? ["¿Puedes explicarme un tema?", "¿Necesito un plan de estudio para X."]: ["Can you explain a topic to me?", "I need a study plan for X."];
    }
  }
  
  if (generateImageExplicitly || lowerQuery.includes("imagen") || lowerQuery.includes("diagrama") || lowerQuery.includes("mapa") || lowerQuery.includes("visual") || lowerQuery.includes("picture") || lowerQuery.includes("diagram") || lowerQuery.includes("map")) {
    const imageTopicMatch = lowerQuery.match(/(?:imagen de|diagrama de|mapa de|visual de|picture of|diagram of|map of)\s+(.+)/i);
    const imageTopic = imageTopicMatch && imageTopicMatch[1] ? imageTopicMatch[1] : "concepto";
    imageQuerySuggestion = imageTopic;
    
    if (!specificTopicExplained && !mainResponse.toLowerCase().includes("imagen")) { // Add image related text if not already present
        mainResponse += language === 'es' 
        ? "\n\n¡Entendido! Aquí tienes una visualización simulada para ayudarte a comprender mejor."
        : "\n\nGot it! Here's a simulated visualization to help you understand better.";
    }
    generatedImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(imageTopic.substring(0,50))}`; // Placeholder image
    followUpSuggestions = language === 'es' ? ["Explícame esta imagen.", "¿Podemos hacerla más simple?"] : ["Explain this image to me.", "Can we make it simpler?"];
  }

  // Simulate language switch request
  if (lowerQuery.includes("en inglés") || lowerQuery.includes("in english")) {
    mainResponse = `Okay, switching to English (simulated): ${mainResponse.replace(/\[.+?\]/g, '[Simulated content in English...].')}`;
  } else if (lowerQuery.includes("en español") || lowerQuery.includes("in spanish")) {
     mainResponse = `De acuerdo, cambiando a español (simulado): ${mainResponse.replace(/\[.+?\]/g, '[Contenido simulado en español...].')}`;
  }

  // Simulate a delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        mainResponse,
        generatedImageUrl,
        imageQuerySuggestion,
        followUpSuggestions: followUpSuggestions.length > 0 ? followUpSuggestions : undefined,
        isError,
      });
    }, SIMULATED_RESPONSE_DELAY_MS);
  });
}
