
'use server';
/**
 * @fileOverview AI Study Assistant (Simulado Avanzado) para DarkAIschool.
 *
 * - askStudyAssistant - Maneja consultas de usuarios con respuestas predefinidas.
 * - StudyAssistantInput - Tipo de entrada para la función.
 * - StudyAssistantOutput - Tipo de salida para la función.
 */

// Ya no se usa Genkit ni Zod para esta versión simulada sin API externa.

export interface StudyAssistantInput {
  query: string;
  language: 'es' | 'en';
  generateImageExplicitly?: boolean; // Podemos usar esto para decidir si mostrar una imagen de placeholder
}

export interface StudyAssistantOutput {
  mainResponse: string;
  generatedImageUrl?: string;
  imageGenerationQuery?: string; // Aunque no generamos, podemos simular el query usado
  followUpSuggestions?: string[];
}

const SIMULATED_RESPONSE_DELAY_MS = 300; // Simular un pequeño retraso

// Base de conocimiento simulada (ampliar según sea necesario)
const knowledgeBase = {
  es: {
    "teorema de pitágoras": {
      explanation: "El Teorema de Pitágoras establece que en todo triángulo rectángulo, el cuadrado de la longitud de la hipotenusa es igual a la suma de los cuadrados de las respectivas longitudes de los catetos. Es una de las proposiciones más conocidas entre las que tienen nombre propio en la matemática.",
      imagePrompt: "diagrama del teorema de pitágoras con triángulo rectángulo",
      suggestions: ["¿Puedes darme un ejemplo con números?", "¿En qué se usa el teorema de Pitágoras?"],
    },
    "fotosíntesis": {
      explanation: "La fotosíntesis es el proceso metabólico por el cual las plantas verdes y algunos otros organismos convierten la energía luminosa en energía química, almacenada en forma de glucosa. Se realiza en los cloroplastos y requiere dióxido de carbono, agua y luz solar.",
      imagePrompt: "diagrama simplificado del proceso de fotosíntesis",
      suggestions: ["¿Cuáles son las fases de la fotosíntesis?", "¿Qué organismos realizan la fotosíntesis?"],
    },
    "revolución francesa": {
      explanation: "La Revolución Francesa fue un período de profundos cambios sociales y políticos en Francia que duró desde 1789 hasta 1799. Condujo a la abolición de la monarquía, el establecimiento de la república y, finalmente, al ascenso de Napoleón Bonaparte. Sus ideales de libertad, igualdad y fraternidad tuvieron un gran impacto mundial.",
      imagePrompt: "mapa conceptual de las causas de la Revolución Francesa",
      suggestions: ["¿Cuáles fueron las principales causas?", "¿Qué consecuencias tuvo?"],
    },
    "default_explanation_prefix": "Claro, aquí tienes una explicación simulada sobre ",
    "default_explanation_suffix": ": [Explicación detallada y didáctica simulada...]. ¿Necesitas que profundice o un ejemplo?",
    "default_image_response": "¡Entendido! Aquí tienes una visualización simulada. Si necesitas algo específico, dímelo.",
    "default_image_prompt": "ilustración genérica abstracta",
    "default_study_plan_prefix": "Aquí tienes una plantilla de plan de estudio simulado para ",
    "default_study_plan_suffix": ":\n1. Define tus objetivos.\n2. Divide el material en secciones pequeñas.\n3. Programa sesiones de estudio regulares.\n4. Utiliza técnicas de estudio activo.\n5. Repasa periódicamente.",
    "default_study_strategies": "Algunas estrategias de estudio efectivas son: la técnica Pomodoro, crear mapas mentales, explicar los temas en voz alta, y practicar con ejercicios. ¿Quieres que detalle alguna?",
    "greeting": "¡Hola! Soy tu Asistente de Estudio IA (Simulado Avanzado) de DarkAIschool. ¿En qué puedo ayudarte hoy?",
    "fallback": "He recibido tu consulta. Para ayudarte mejor, ¿podrías preguntarme sobre explicar un tema, crear un plan de estudio, o estrategias de aprendizaje? También puedo intentar generar una imagen de marcador de posición si la pides.",
    "image_suggestions": ["Explícame esta imagen.", "¿Podemos hacerla más simple?"],
    "explanation_suggestions_generic": ["Dame un ejemplo.", "¿Tiene aplicaciones prácticas?"],
    "study_plan_suggestions": ["¿Cómo defino objetivos SMART?", "Explícame la técnica Pomodoro."],
  },
  en: {
    "pythagorean theorem": {
      explanation: "The Pythagorean Theorem states that in any right-angled triangle, the square of the length of the hypotenuse is equal to the sum of the squares of the lengths of the other two sides (legs). It is one of the best-known propositions in mathematics.",
      imagePrompt: "diagram of pythagorean theorem with right triangle",
      suggestions: ["Can you give me an example with numbers?", "What is the Pythagorean theorem used for?"],
    },
    "photosynthesis": {
      explanation: "Photosynthesis is the metabolic process by which green plants and some other organisms convert light energy into chemical energy, stored in the form of glucose. It takes place in chloroplasts and requires carbon dioxide, water, and sunlight.",
      imagePrompt: "simplified diagram of the photosynthesis process",
      suggestions: ["What are the stages of photosynthesis?", "Which organisms perform photosynthesis?"],
    },
    "french revolution": {
      explanation: "The French Revolution was a period of profound social and political upheaval in France that lasted from 1789 to 1799. It led to the abolition of the monarchy, the establishment of the republic, and ultimately to the rise of Napoleon Bonaparte. Its ideals of liberty, equality, and fraternity had a major global impact.",
      imagePrompt: "concept map of the causes of the French Revolution",
      suggestions: ["What were the main causes?", "What were its consequences?"],
    },
    "default_explanation_prefix": "Sure, here's a simulated explanation about ",
    "default_explanation_suffix": ": [Detailed and didactic simulated explanation...]. Do you need me to elaborate or give an example?",
    "default_image_response": "Got it! Here's a simulated visualization. If you need something specific, let me know.",
    "default_image_prompt": "generic abstract illustration",
    "default_study_plan_prefix": "Here's a simulated study plan template for ",
    "default_study_plan_suffix": ":\n1. Define your goals.\n2. Break down the material into small sections.\n3. Schedule regular study sessions.\n4. Use active study techniques.\n5. Review periodically.",
    "default_study_strategies": "Some effective study strategies include: the Pomodoro technique, creating mind maps, explaining topics aloud, and practicing with exercises. Would you like me to detail any of these?",
    "greeting": "Hi! I'm your DarkAIschool AI Study Assistant (Advanced Simulated). How can I help you today?",
    "fallback": "I've received your query. To help you better, could you ask me to explain a topic, create a study plan, or about learning strategies? I can also try to generate a placeholder image if you ask for one.",
    "image_suggestions": ["Explain this image to me.", "Can we make it simpler?"],
    "explanation_suggestions_generic": ["Give me an example.", "Does it have practical applications?"],
    "study_plan_suggestions": ["How do I define SMART goals?", "Explain the Pomodoro technique."],
  }
};

export async function askStudyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  const { query, language, generateImageExplicitly } = input;
  const langKb = knowledgeBase[language];
  const lowerQuery = query.toLowerCase();

  let mainResponse = "";
  let generatedImageUrl: string | undefined = undefined;
  let imageGenerationQuery: string | undefined = undefined;
  let followUpSuggestions: string[] = [];

  const createResponse = (response: StudyAssistantOutput) => 
    new Promise<StudyAssistantOutput>(resolve => {
      setTimeout(() => resolve(response), SIMULATED_RESPONSE_DELAY_MS);
    });

  // Check for specific known topics
  for (const topic in langKb) {
    if (lowerQuery.includes(topic) && typeof langKb[topic as keyof typeof langKb] === 'object' && 'explanation' in langKb[topic as keyof typeof langKb]) {
      const topicData = langKb[topic as keyof typeof langKb] as { explanation: string, imagePrompt?: string, suggestions?: string[] };
      mainResponse = topicData.explanation;
      if (generateImageExplicitly || lowerQuery.includes(language === 'es' ? "imagen de" : "image of") || lowerQuery.includes(language === 'es' ? "diagrama de" : "diagram of")) {
        generatedImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(topicData.imagePrompt || topic)}`;
        imageGenerationQuery = topicData.imagePrompt || topic;
        if (!mainResponse.includes(langKb.default_image_response)) {
             mainResponse += `\n\n${langKb.default_image_response}`;
        }
      }
      followUpSuggestions = topicData.suggestions || langKb.explanation_suggestions_generic;
      return createResponse({ mainResponse, generatedImageUrl, imageGenerationQuery, followUpSuggestions });
    }
  }

  // Generic keyword matching
  if (lowerQuery.includes(language === 'es' ? "explícame" : "explain")) {
    const topicMatch = lowerQuery.match(new RegExp(`(?:${language === 'es' ? "explícame" : "explain"})\\s+(.+?)(?:\\s+con\\s+una\\s+imagen|\\s+with\\s+an\\s+image)?$`, 'i'));
    const topic = topicMatch && topicMatch[1] ? topicMatch[1].trim() : (language === 'es' ? "el tema solicitado" : "the requested topic");
    mainResponse = `${langKb.default_explanation_prefix}${topic}${langKb.default_explanation_suffix}`;
    if (generateImageExplicitly || (topicMatch && topicMatch[0].includes(language === 'es' ? "con una imagen" : "with an image"))) {
        generatedImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(topic)}`;
        imageGenerationQuery = topic;
        mainResponse += `\n\n${langKb.default_image_response}`;
    }
    followUpSuggestions = langKb.explanation_suggestions_generic.map(s => s.replace("el tema", topic));
  } else if (generateImageExplicitly || lowerQuery.includes(language === 'es' ? "imagen" : "picture") || lowerQuery.includes(language === 'es' ? "diagrama" : "diagram") || lowerQuery.includes(language === 'es' ? "mapa" : "map") || lowerQuery.includes(language === 'es' ? "visual" : "visual")) {
    mainResponse = langKb.default_image_response;
    const imageSubjectMatch = lowerQuery.match(new RegExp(`(?:imagen|diagrama|mapa|visual|picture|diagram|map)\\s+(?:de|del|of|for|about)\\s+(.+)$`, 'i'));
    const imageSubject = imageSubjectMatch && imageSubjectMatch[1] ? imageSubjectMatch[1].trim() : langKb.default_image_prompt;
    generatedImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(imageSubject)}`;
    imageGenerationQuery = imageSubject;
    followUpSuggestions = langKb.image_suggestions;
  } else if (lowerQuery.includes(language === 'es' ? "plan de estudio" : "study plan") || lowerQuery.includes(language === 'es' ? "estrategias" : "strategies")) {
    if (lowerQuery.includes(language === 'es' ? "plan de estudio" : "study plan")) {
        const subjectMatch = lowerQuery.match(new RegExp(`(?:plan\\s+de\\s+estudio|study\\s+plan)\\s+(?:para|para el|for)\\s+(.+)$`, 'i'));
        const subject = subjectMatch && subjectMatch[1] ? subjectMatch[1].trim() : (language === 'es' ? "tus estudios" : "your studies");
        mainResponse = `${langKb.default_study_plan_prefix}${subject}${langKb.default_study_plan_suffix}`;
    } else {
        mainResponse = langKb.default_study_strategies;
    }
    followUpSuggestions = langKb.study_plan_suggestions;
  } else if (lowerQuery.includes("hola") || lowerQuery.includes("hello") || lowerQuery.includes("hi")) {
    mainResponse = langKb.greeting;
    followUpSuggestions = language === 'es' ? ["Explícame el teorema de Pitágoras.", "¿Puedes generar una imagen de un átomo?"] : ["Explain the Pythagorean theorem.", "Can you generate an image of an atom?"];
  } else {
    mainResponse = langKb.fallback;
    followUpSuggestions = language === 'es' ? ["¿Qué es la fotosíntesis?", "Necesito un plan de estudio para historia."] : ["What is photosynthesis?", "I need a study plan for history."];
  }

  // Simulate language switch request (this is very basic)
  if (lowerQuery.includes("en inglés") || lowerQuery.includes("in english")) {
    mainResponse = `Okay, switching to English (simulated). Original query was about: "${query}". A simulated response in English would be here.`;
    // Potentially re-evaluate with English knowledge base if more complex logic is needed.
  } else if (lowerQuery.includes("en español") || lowerQuery.includes("in spanish")) {
    mainResponse = `De acuerdo, cambiando a español (simulado). La consulta original era sobre: "${query}". Aquí iría una respuesta simulada en español.`;
  }

  return createResponse({
    mainResponse,
    generatedImageUrl,
    imageGenerationQuery,
    followUpSuggestions: followUpSuggestions.length > 0 ? followUpSuggestions : undefined,
  });
}
