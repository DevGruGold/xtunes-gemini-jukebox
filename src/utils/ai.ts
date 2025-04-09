
import { toast } from "@/hooks/use-toast";

interface TranslationOptions {
  preserveFormatting?: boolean;
  priority?: 'speed' | 'accuracy';
}

export async function translateText(
  text: string, 
  sourceLang?: string, 
  targetLang: string = 'en',
  options: TranslationOptions = { preserveFormatting: true, priority: 'speed' }
) {
  try {
    // Construct a more effective prompt based on options
    let promptText = `Translate the following `;
    
    if (sourceLang) {
      promptText += `${sourceLang} text `;
    } else {
      promptText += `text `;
    }
    
    promptText += `to ${targetLang}:\n\n${text}`;
    
    // Add specific instructions based on options
    if (options.preserveFormatting) {
      promptText += "\n\nPreserve the original formatting.";
    }
    
    if (options.priority === 'speed') {
      promptText += "\n\nOptimize for speed, be concise.";
    } else if (options.priority === 'accuracy') {
      promptText += "\n\nOptimize for accuracy and fluency.";
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    toast({
      title: "Translation Error",
      description: "Failed to translate the text. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}

export async function identifySong(lyrics: string) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Given these lyrics, identify the song title and artist. If you can't identify with certainty, provide your best guess of similar songs. Lyrics: ${lyrics}`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 256,
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Song identification failed');
  } catch (error) {
    console.error('Song identification error:', error);
    return null;
  }
}

// Function to detect what language is being spoken
export async function detectLanguage(text: string) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Detect the language of this text and respond with only the ISO language code (e.g., 'en', 'es', 'fr'): "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      // Extract just the language code
      const result = data.candidates[0].content.parts[0].text;
      const langCodeMatch = result.match(/^[a-z]{2}(-[A-Z]{2})?$/);
      return langCodeMatch ? langCodeMatch[0] : null;
    }
    return null;
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}
