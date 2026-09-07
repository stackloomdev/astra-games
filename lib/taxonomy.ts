import type { WorkCategory } from './catalog';

/** Display order of the category pill rail. Labels come from the dictionary. */
export const CATEGORY_ORDER: (WorkCategory | 'all')[] = [
  'all', 'game', 'experiment', 'app', 'tool', 'website', 'other',
];

/** Deterministic gradient per work so covers we cannot fetch still feel authored. */
const GRADIENTS = [
  'linear-gradient(135deg, #ff385c 0%, #92174d 52%, #2a0a3d 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #460479 55%, #16081f 100%)',
  'linear-gradient(135deg, #ff6b8a 0%, #ff385c 44%, #460479 100%)',
  'linear-gradient(135deg, #460479 0%, #92174d 48%, #ff385c 100%)',
  'linear-gradient(135deg, #e00b41 0%, #460479 60%, #0d0b0f 100%)',
  'linear-gradient(135deg, #92174d 0%, #8b5cf6 58%, #12101a 100%)',
];

export function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

/** Two-glyph monogram used as the fallback mark. */
export function monogram(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '★';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function hostOf(url: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
