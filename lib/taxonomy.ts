import type { WorkCategory } from './catalog';

/** Filter rail options. Order is the display order of the category pill bar. */
export const CATEGORIES: { id: WorkCategory | 'all'; zh: string; en: string }[] = [
  { id: 'all', zh: '全部', en: 'All' },
  { id: 'game', zh: '游戏', en: 'Games' },
  { id: 'experiment', zh: '实验与艺术', en: 'Experiments' },
  { id: 'app', zh: '应用', en: 'Apps' },
  { id: 'tool', zh: '工具', en: 'Tools' },
  { id: 'website', zh: '网站', en: 'Sites' },
  { id: 'other', zh: '其他', en: 'Other' },
];

/** Deterministic gradient per work so cards without artwork still feel authored. */
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

/** Two-glyph monogram used as the card's fallback mark. */
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
