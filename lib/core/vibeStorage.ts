import type { VibeTemplate, UserContext } from "@/lib/core/types";

const STORAGE_KEY = "intentCompilerVibeLibrary";

export function getStoredVibes(): VibeTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VibeTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVibe(vibe: VibeTemplate): void {
  const vibes = getStoredVibes();
  const existingIndex = vibes.findIndex((v) => v.id === vibe.id);
  
  if (existingIndex >= 0) {
    vibes[existingIndex] = { ...vibe, createdAt: vibes[existingIndex].createdAt || new Date().toISOString() };
  } else {
    vibes.push({ ...vibe, createdAt: new Date().toISOString() });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vibes));
}

export function deleteVibe(id: string): void {
  const vibes = getStoredVibes().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vibes));
}

export function exportVibes(vibes: VibeTemplate[]): string {
  return JSON.stringify(vibes, null, 2);
}

export function importVibes(json: string): VibeTemplate[] {
  try {
    const parsed = JSON.parse(json) as VibeTemplate[];
    if (!Array.isArray(parsed)) throw new Error("Invalid format");
    return parsed.map((v) => ({
      ...v,
      id: v.id || crypto.randomUUID(),
      isBuiltIn: false
    }));
  } catch {
    throw new Error("Failed to import vibes: invalid JSON format");
  }
}

export function mergeWithBuiltInVibes(builtInVibes: VibeTemplate[]): VibeTemplate[] {
  const stored = getStoredVibes();
  const markedBuiltIn = builtInVibes.map((v) => ({ ...v, isBuiltIn: true }));
  return [...markedBuiltIn, ...stored];
}
