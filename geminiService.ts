
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
  
  // تجهيز البيانات بشكل مكثف لزيادة دقة التحليل
  const postSummaries = posts.map(p => `ID: ${p.id}, Title: ${p.title}, Excerpt: ${p.excerpt}, Category: ${p.category}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أنت محرك بحث ذكي وخبير في تحليل المحتوى لمدونة "مسودة للنشر". 
المستخدم يبحث عن: "${query}".

مهمتك:
1. تحليل الكلمة أو الجملة التي كتبها المستخدم بعمق سياقي.
2. حتى لو كتب كلمة واحدة (مثل: "صورة"، "مشاعر"، "تسويق")، توقع المقالات التي قد تهمه بناءً على محتواها وليس فقط عنوانها.
3. ابحث عن الروابط الدلالية (مثلاً: "كاميرا" ترتبط بالأفلام، "نجاح" ترتبط بالتأملات، "براند" يرتبط بالإعلانات).

هذه قائمة المقالات المتوفرة:
${postSummaries}

رد بتنسيق JSON فقط كقائمة تحتوي على:
- id: معرف المقال.
- relevanceReason: جملة قصيرة جداً ومشوقة بالعربية تشرح لمَ هذا المقال هو ما يبحث عنه (مثلاً: "قد يهمك هذا التحليل عن صناعة السينما").`,
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

    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("AI Search Error:", error);
    return [];
  }
}
