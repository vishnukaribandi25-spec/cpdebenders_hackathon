// Settings persisted to localStorage. Only client code touches storage, and only
// after mount, so the server render and first client render use the defaults.

export const SETTINGS_KEY = "carecircle.settings.v1";

export interface CareSettings {
  familyName: string;
  recipientName: string;
}

export const DEFAULT_SETTINGS: CareSettings = {
  familyName: "Lakshmi's care circle",
  recipientName: "Lakshmi",
};

function textOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

/** Parses stored JSON. Missing or invalid values fall back to the defaults. */
export function parseSettings(raw: string | null | undefined): CareSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return DEFAULT_SETTINGS;
    const record = data as Record<string, unknown>;
    return {
      familyName: textOr(record.familyName, DEFAULT_SETTINGS.familyName),
      recipientName: textOr(record.recipientName, DEFAULT_SETTINGS.recipientName),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const listeners = new Set<() => void>();

// undefined = not read yet (server render and first client render);
// string | null = the stored value (null means nothing saved yet).
let storeRaw: string | null | undefined;

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    // Storage can be blocked. The form then works from defaults for this session.
    return null;
  }
}

export function getSettingsSnapshot(): string | null | undefined {
  if (storeRaw === undefined) storeRaw = readStorage();
  return storeRaw;
}

export function getServerSettingsSnapshot(): string | null | undefined {
  return undefined;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function saveSettings(next: CareSettings): void {
  const raw = JSON.stringify(next);
  // Keep the in-memory value even if storage is unavailable.
  storeRaw = raw;
  try {
    window.localStorage.setItem(SETTINGS_KEY, raw);
  } catch {
    // Quota exceeded or storage blocked. The in-memory value still applies.
  }
  listeners.forEach((listener) => listener());
}
