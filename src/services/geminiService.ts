import { Contact } from "../types";

interface PokeSearchResponse {
  contactIds?: string[];
  source?: string;
}

interface PokeDraftResponse {
  draft?: string;
  source?: string;
}

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || "Request failed");
  }

  return data as T;
};

const localSearch = (prompt: string, allContacts: Contact[]) => {
  const terms = prompt.toLowerCase().split(/\s+/).filter(Boolean);

  return allContacts
    .map((contact) => {
      const haystack = [contact.name, contact.role, contact.company, contact.email || "", contact.source].join(" ").toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { contact, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.contact);
};

const localDraft = (prompt: string, contact: Contact) => {
  const firstName = contact.name.split(" ")[0] || contact.name;
  return [
    `Hey ${firstName},`,
    "",
    `I was thinking about your work at ${contact.company} and wanted to reach out about ${prompt}.`,
    "",
    "If it makes sense, I would love to connect and share a quick note.",
    "",
    "Thanks,",
    "Tolulope",
  ].join("\n");
};

export const searchContacts = async (prompt: string, allContacts: Contact[]) => {
  try {
    const data = await postJson<PokeSearchResponse>("/api/poke/contacts/search", {
      prompt,
      contacts: allContacts,
    });

    const contactIds = Array.isArray(data.contactIds) ? data.contactIds : [];
    if (contactIds.length > 0) {
      return allContacts.filter((contact) => contactIds.includes(contact.id));
    }
  } catch (error) {
    console.error("Poke contact search failed, falling back to local matching", error);
  }

  return localSearch(prompt, allContacts);
};

export const generateDraft = async (prompt: string, contact: Contact) => {
  try {
    const data = await postJson<PokeDraftResponse>("/api/poke/outreach/draft", {
      prompt,
      contact,
    });

    if (data.draft) {
      return data.draft;
    }
  } catch (error) {
    console.error("Poke draft generation failed, falling back to local draft", error);
  }

  return localDraft(prompt, contact);
};
