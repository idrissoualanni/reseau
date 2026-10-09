import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Fusionne des classes conditionnelles (clsx) puis dédoublonne les classes
// Tailwind conflictuelles (tailwind-merge). Base de tous les composants UI.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
