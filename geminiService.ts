import { GoogleGenAI } from "@google/genai";
import { Category } from "./types";

// التأكد من تهيئة العميل بشكل صحيح وفقاً للإرشادات
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function getSmartIntroduction(category: Category): Promise<string> {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك كاتب محتوى مبدع، اكتب جملة ترحيبية قصيرة وجذابة لمدونة شخصية في قسم "${category}". الجملة يجب أن تكون ملهمة وتناسب ذوق مستخدمي آيفون الراقي. رد بالنص فقط باللغة العربية.`,
    });
    // استخدام خاصية .text مباشرة كما تنص التعليمات
    return response.text?.trim() || "مرحباً بك في عالمي الخاص.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "استكشف أحدث المقالات والأفكار.";
  }
}

export async function summarizeContent(text: string): Promise<string> {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `لخص هذا النص في جملة واحدة قوية باللغة العربية: ${text}`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
}