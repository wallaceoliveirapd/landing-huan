"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

/**
 * Extract durable preferences from a user chat message and persist them
 * on the user's profile. Called fire-and-forget from /api/chat after each
 * user turn — it MUST NOT block the chat response.
 *
 * Returns the list of newly-stored preferences for the caller's logs.
 */
export const extract = action({
  args: {
    userId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { userId, message }) => {
    const text = message.trim();
    if (text.length < 6 || text.length > 800) return { stored: 0 };

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return { stored: 0 };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            preferences: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  key: { type: SchemaType.STRING },
                  value: { type: SchemaType.STRING },
                  confidence: { type: SchemaType.NUMBER },
                },
                required: ["key", "value", "confidence"],
              },
            },
          },
          required: ["preferences"],
        },
        temperature: 0.1,
        maxOutputTokens: 400,
      },
    });

    // Compact, tight prompt. Returns [] for messages that are pure intent
    // ("quero passeio de barco"), only persists stable facts about the user.
    const prompt = `Você extrai PREFERÊNCIAS DURÁVEIS do usuário a partir de uma mensagem dele no chat de viagens.

Retorne SOMENTE fatos persistentes sobre quem é o usuário ou como ele viaja, NÃO sobre o que ele quer agora.

KEYS ACEITAS:
- "dietary" → restrição alimentar (vegetariano, vegano, sem glúten, halal, kosher...)
- "trip_companions" → com quem viaja (sozinho, casal, crianças, grupo, idosos, pet)
- "budget_band" → faixa de orçamento (baixo, medio, alto)
- "mobility" → mobilidade reduzida, cadeirante, gestante, etc.
- "favorite_activity" → atividade que ele AMA (mergulho, trilha, fotografia, gastronomia...)
- "disliked" → o que ele REJEITA (multidão, locais turísticos, madrugada, churrasco...)
- "home_city" → cidade de origem dele
- "spoken_language" → idioma se mencionar
- "allergies" → alergias (frutos do mar, lactose, glúten...)

REGRAS:
- value: curto, em minúsculas, normalizado (ex: "vegetariano", não "Eu não como carne").
- confidence: 0.6–1.0. Use >=0.85 só se for explícito ("sou vegetariano").
- Ignore pedidos pontuais ("hoje quero comer pizza"), só persistência.
- Ignore se a mensagem não trouxer NENHUM fato pessoal. Retorne {"preferences": []}.

MENSAGEM: """${text}"""

Retorne: { "preferences": [{ "key": "...", "value": "...", "confidence": 0.0 }] }`;

    let extracted: { key: string; value: string; confidence: number }[] = [];
    try {
      const result = await model.generateContent(prompt);
      const json = JSON.parse(result.response.text()) as {
        preferences?: { key: string; value: string; confidence: number }[];
      };
      extracted = Array.isArray(json.preferences) ? json.preferences : [];
    } catch (err) {
      console.warn("[userMemory.extract] LLM failed:", err);
      return { stored: 0 };
    }

    let stored = 0;
    for (const p of extracted) {
      const key = String(p.key ?? "").trim().toLowerCase();
      const value = String(p.value ?? "").trim().toLowerCase();
      const confidence = Number(p.confidence ?? 0);
      if (!key || !value || confidence < 0.6) continue;
      if (value.length > 80 || key.length > 40) continue;
      try {
        await ctx.runMutation(internal.userMemoryData.upsert, {
          userId,
          key,
          value,
          confidence,
          source: "chat",
        });
        stored += 1;
      } catch (err) {
        console.warn("[userMemory.extract] upsert failed:", err);
      }
    }
    return { stored };
  },
});
