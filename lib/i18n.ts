/**
 * Locale registry. Upstream keeps one README per language at the repository
 * root, so a locale is fully described by its README file name plus the
 * presentation details the UI needs.
 */
export const LOCALES = [
  { code: 'zh-CN', readme: 'README.zh-CN.md', label: '简体中文', htmlLang: 'zh-CN', dir: 'ltr' },
  { code: 'en', readme: 'README.md', label: 'English', htmlLang: 'en', dir: 'ltr' },
  { code: 'ja', readme: 'README.ja.md', label: '日本語', htmlLang: 'ja', dir: 'ltr' },
  { code: 'ko', readme: 'README.ko.md', label: '한국어', htmlLang: 'ko', dir: 'ltr' },
  { code: 'fr', readme: 'README.fr.md', label: 'Français', htmlLang: 'fr', dir: 'ltr' },
  { code: 'de', readme: 'README.de.md', label: 'Deutsch', htmlLang: 'de', dir: 'ltr' },
  { code: 'es', readme: 'README.es.md', label: 'Español', htmlLang: 'es', dir: 'ltr' },
  { code: 'pt-BR', readme: 'README.pt-BR.md', label: 'Português (BR)', htmlLang: 'pt-BR', dir: 'ltr' },
  { code: 'ru', readme: 'README.ru.md', label: 'Русский', htmlLang: 'ru', dir: 'ltr' },
  { code: 'ar', readme: 'README.ar.md', label: 'العربية', htmlLang: 'ar', dir: 'rtl' },
  { code: 'hi', readme: 'README.hi.md', label: 'हिन्दी', htmlLang: 'hi', dir: 'ltr' },
  { code: 'id', readme: 'README.id.md', label: 'Bahasa Indonesia', htmlLang: 'id', dir: 'ltr' },
] as const;

export type Locale = (typeof LOCALES)[number]['code'];
export type LocaleEntry = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh-CN';

export const LOCALE_CODES = LOCALES.map((locale) => locale.code);

export function isLocale(value: string): value is Locale {
  return LOCALE_CODES.includes(value as Locale);
}

export function localeEntry(code: Locale): LocaleEntry {
  return LOCALES.find((locale) => locale.code === code) ?? LOCALES[0];
}

/** Locale → the upstream README the catalogue is read from for that language. */
export function readmeFor(code: Locale): string {
  return localeEntry(code).readme;
}

import type { Dictionary } from './dictionaries/types';

/**
 * Static map rather than a dynamic `import(`./dictionaries/${code}`)`, so every
 * dictionary is type-checked against the shared shape and the bundler can see
 * exactly which ones exist.
 */
const DICTIONARIES: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  'zh-CN': () => import('./dictionaries/zh-CN'),
  en: () => import('./dictionaries/en'),
  ja: () => import('./dictionaries/ja'),
  ko: () => import('./dictionaries/ko'),
  fr: () => import('./dictionaries/fr'),
  de: () => import('./dictionaries/de'),
  es: () => import('./dictionaries/es'),
  'pt-BR': () => import('./dictionaries/pt-BR'),
  ru: () => import('./dictionaries/ru'),
  ar: () => import('./dictionaries/ar'),
  hi: () => import('./dictionaries/hi'),
  id: () => import('./dictionaries/id'),
};

export async function getDictionary(code: Locale): Promise<Dictionary> {
  const load = DICTIONARIES[code] ?? DICTIONARIES[DEFAULT_LOCALE];
  return (await load()).default;
}

export type { Dictionary };
