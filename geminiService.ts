
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Post } from "./types";

// Always initialize the client inside each function right before making the API call
export async function getSmartIntroduction(category: Category): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك كاتب محتوى مبدع، اكتب جملة ترحيبية قصيرة وجذابة لمدونة شخصية في قسم "${category}". الجملة يجب أن تكون ملهمة وتناسب ذوق مستخدمي آيفون الراقي. رد بالنص فقط باللغة العربية.`,
    });
    // Use .text property to get the generated content
    return response.text?.trim() || "مرحباً بك في عالمي الخاص.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "استكشف أحدث المقالات والأفكار.";
  }
}

export interface AISearchResult {
  id: string;
  relevanceReason: string;
}

export async function searchWithAI(query: string, posts: Post[]): Promise<AISearchResult[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // تجهيز قائمة العناوين لتقليل استهلاك التوكنز
  const postSummaries = posts.map(p => `ID: ${p.id}, Title: ${p.title}, Excerpt: ${p.excerpt}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `المستخدم يبحث في مدونة عن: "${query}".
هذه قائمة المقالات المتاحة:
${postSummaries}

حدد المقالات الأكثر صلة. حتى لو لم تكن الكلمات متطابقة، استخدم فهمك السياقي.
رد بتنسيق JSON فقط كقائمة من الأشياء تحتوي على id و relevanceReason (جملة قصيرة بالعربية تشرح لمَ هذا المقال قريب مما يبحث عنه، مثلاً: "يتحدث عن صناعة الأفلام وهو قريب من اهتمامك بالسينما").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              relevanceReason: { type: Type.STRING }
            },
            required: ["id", "relevanceReason"]
          }
        }
      }
    });

    // Use .text property directly to access the JSON string
    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("AI Search Error:", error);
    return [];
  }
}
