
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Post } from "./types";

export async function getSmartIntroduction(category: Category): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك كاتب محتوى مبدع، اكتب جملة ترحيبية قصيرة وجذابة لمدونة شخصية في قسم "${category}". الجملة يجب أن تكون ملهمة وتناسب ذوق مستخدمي آيفون الراقي. رد بالنص فقط باللغة العربية.`,
    });
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
  
  // تجهيز البيانات بشكل مكثف لزيادة دقة التحليل
  const postSummaries = posts.map(p => `ID: ${p.id}, Title: ${p.title}, Excerpt: ${p.excerpt}, Category: ${p.category}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أنت محرك بحث ذكي وخبير في تحليل المحتوى لمدونة "مسودة للنشر". 
المستخدم يبحث عن: "${query}".

مهمتك:
1. تحليل الكلمة أو الجملة التي كتبها المستخدم بعمق سياقي.
2. ابحث عن الروابط الدلالية (مثلاً: "اعلان" ترتبط بقسم الإعلانات، "كاميرا" ترتبط بالأفلام).
3. أعد قائمة بالمعرفات (ID) للمقالات الأكثر صلة.

هذه قائمة المقالات المتوفرة:
${postSummaries}

رد بتنسيق JSON فقط كقائمة (Array). لا تضف أي نص خارج الـ JSON.`,
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

    let text = response.text || "[]";
    // تنظيف النص من أي علامات Markdown محتملة
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const results = JSON.parse(text);
    return results;
  } catch (error) {
    console.error("AI Search Error:", error);
    return [];
  }
}
