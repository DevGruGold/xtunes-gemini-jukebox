import { toast } from "@/hooks/use-toast";

export async function translateText(text: string) {
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
            text: `Translate the following lyrics to English: ${text}`
          }]
        }]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Translation failed');
  } catch (error) {
    toast({
      title: "Translation Error",
      description: "Failed to translate the text. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}