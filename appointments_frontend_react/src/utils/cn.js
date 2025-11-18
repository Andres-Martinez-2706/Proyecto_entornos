import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind evitando conflictos
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
