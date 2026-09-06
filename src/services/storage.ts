import { VoiceProfile, GenerationDraft, GenerationHistoryItem } from "../types";

const STORAGE_VERSION_KEY = "tts_studio_storage_version";
const CURRENT_VERSION = "1.0";

const PROFILES_KEY = "tts_studio_profiles";
const DEFAULT_PROFILE_ID_KEY = "tts_studio_default_profile_id";
const LAST_PROFILE_ID_KEY = "tts_studio_last_profile_id";
const DRAFT_KEY = "tts_studio_draft";
const HISTORY_KEY = "tts_studio_history";

export const INITIAL_DEFAULT_PROFILE: VoiceProfile | null = null;
export const INITIAL_DEMO_PROFILES: VoiceProfile[] = [];

export const INITIAL_DRAFT: GenerationDraft = {
  projectTitle: "",
  scene: "",
  sampleContext: "",
  text: "",
};

/**
 * Initializes and retrieves saved voice profiles
 */
export function loadProfiles(): VoiceProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to load profiles from localStorage:", err);
    return [];
  }
}

export function saveProfiles(profiles: VoiceProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error("Failed to save profiles to localStorage:", err);
  }
}

export function getDefaultProfileId(): string | null {
  try {
    return localStorage.getItem(DEFAULT_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

export function setDefaultProfileId(id: string): void {
  try {
    localStorage.setItem(DEFAULT_PROFILE_ID_KEY, id);
  } catch (err) {
    console.error("Failed to set default profile id:", err);
  }
}

export function getLastProfileId(): string | null {
  try {
    return localStorage.getItem(LAST_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

export function setLastProfileId(id: string): void {
  try {
    localStorage.setItem(LAST_PROFILE_ID_KEY, id);
  } catch (err) {
    console.error("Failed to set last profile id:", err);
  }
}

export function loadDraft(): GenerationDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return INITIAL_DRAFT;
    const parsed = JSON.parse(raw);
    return {
      projectTitle: parsed.projectTitle ?? "",
      scene: parsed.scene ?? "",
      sampleContext: parsed.sampleContext ?? "",
      text: parsed.text ?? "",
    };
  } catch {
    return INITIAL_DRAFT;
  }
}

export function saveDraft(draft: GenerationDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to save draft to localStorage:", err);
  }
}

export function loadHistory(): GenerationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: GenerationHistoryItem): GenerationHistoryItem[] {
  try {
    const history = loadHistory();
    // Prioritize keeping recent items, with audioBase64 if it fits
    const newHistory = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 30);
    
    // Attempt saving full data
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    } catch (quotaErr) {
      // If quota exceeded, strip audioBase64 from oldest items progressively until it fits
      console.warn("localStorage quota exceeded, progressively shedding older audio payloads:", quotaErr);
      const reducedHistory = newHistory.map((entry, index) => {
        // Keep audio only for the newest 3 items if space is limited
        if (index >= 3) {
          return { ...entry, audioBase64: undefined };
        }
        return entry;
      });
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(reducedHistory));
        return reducedHistory;
      } catch {
        // Fallback: keep metadata only for all past items
        const metadataOnly = newHistory.map((entry) => ({ ...entry, audioBase64: undefined }));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(metadataOnly));
        return metadataOnly;
      }
    }
  } catch (err) {
    console.error("Failed to save history item:", err);
    return [];
  }
}

export function deleteHistoryItem(id: string): GenerationHistoryItem[] {
  try {
    const history = loadHistory();
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to delete history item:", err);
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error("Failed to clear history:", err);
  }
}

export function clearAllStorage(): void {
  try {
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(DEFAULT_PROFILE_ID_KEY);
    localStorage.removeItem(LAST_PROFILE_ID_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(STORAGE_VERSION_KEY);
  } catch (err) {
    console.error("Failed to clear all storage:", err);
  }
}
