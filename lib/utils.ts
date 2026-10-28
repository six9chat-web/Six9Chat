import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function getCleanDisplayName(name?: string | null, username?: string | null, fallback = "User"): string {
  if (username && !isUuid(username) && username.trim()) {
    return username.trim();
  }
  if (name && !isUuid(name) && name.trim() && name.trim() !== "You") {
    return name.trim();
  }
  return fallback;
}
