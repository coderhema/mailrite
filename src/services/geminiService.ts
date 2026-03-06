import { GoogleGenAI, Type } from "@google/genai";
import { Contact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const searchContacts = async (prompt: string, allContacts: Contact[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      You are an AI assistant for MailRite. 
      Given a list of contacts and a user query, identify the most relevant contacts.
      
      User Query: "${prompt}"
      
      Contacts:
      ${JSON.stringify(allContacts)}
      
      Return a JSON array of the IDs of the relevant contacts.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    const contactIds = JSON.parse(response.text || "[]");
    return allContacts.filter(c => contactIds.includes(c.id));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const generateDraft = async (prompt: string, contact: Contact) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Draft a professional outreach email for ${contact.name} (${contact.role} at ${contact.company}).
      Context: ${prompt}
      Keep it short, personalized, and punchy.
    `,
  });

  return response.text || "Failed to generate draft.";
};
