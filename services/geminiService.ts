
import { ChatMessage } from "../types";

// The Gemini service has been replaced with a local static mock
// to allow the application to run without an API key.

export const generateRomanticResponse = async (
  prompt: string,
  history: ChatMessage[]
): Promise<string> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));

  const lower = prompt.toLowerCase();
  
  if (lower.includes('movie')) {
    return "I recommend 'About Time' – a beautiful story about love and cherishing every moment. Or perhaps 'The Notebook' for a timeless classic.";
  }
  
  if (lower.includes('topic')) {
    const topics = [
      "What is one memory of us that you want to remember forever?",
      "If we could travel anywhere right now, where would we go?",
      "What is your favorite thing about our relationship?",
      "What is a dream you've never told anyone else?"
    ];
    return `Here is a thought to share: ${topics[Math.floor(Math.random() * topics.length)]}`;
  }
  
  if (lower.includes('poem')) {
    return "The stars above whisper your name,\nIn every constellation, it's the same.\nMy heart beats only for you,\nA love so deep, and always true.";
  }

  const genericResponses = [
    "I am here to ensure your evening is perfect. The stars are shining brightly for you both tonight.",
    "That sounds wonderful. Is there anything else I can help you with?",
    "Love is the poetry of the senses.",
    "The night sky is vast, but your connection is the most beautiful thing here."
  ];

  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
};

export const suggestMovies = async (): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    "La La Land", 
    "The Notebook", 
    "About Time", 
    "Before Sunrise", 
    "Eternal Sunshine of the Spotless Mind"
  ];
};
