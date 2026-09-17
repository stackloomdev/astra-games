
const labels: Record<string, [string, string, string, string, string]> = {
  en: ['Guides', 'About & editorial policy', 'Privacy', 'Contact & corrections', 'Site information'],
  'zh-CN': ['玩法指南', '关于与编辑原则', '隐私政策', '联系与纠错', '网站信息'],
  ja: ['ガイド', '運営・編集方針', 'プライバシー', 'お問い合わせ・訂正', 'サイト情報'],
  ko: ['가이드', '소개 및 편집 원칙', '개인정보', '문의 및 정정', '사이트 정보'],
  fr: ['Guides', 'À propos et rédaction', 'Confidentialité', 'Contact et corrections', 'Informations'],
  de: ['Anleitungen', 'Über uns & Redaktion', 'Datenschutz', 'Kontakt & Korrekturen', 'Website-Informationen'],
  es: ['Guías', 'Acerca de y edición', 'Privacidad', 'Contacto y correcciones', 'Información'],
  'pt-BR': ['Guias', 'Sobre e edição', 'Privacidade', 'Contato e correções', 'Informações'],
  ru: ['Руководства', 'О сайте и редакции', 'Конфиденциальность', 'Контакты и исправления', 'О сайте'],
  ar: ['الأدلة', 'عن الموقع والتحرير', 'الخصوصية', 'التواصل والتصحيحات', 'معلومات الموقع'],
  hi: ['गाइड', 'परिचय और संपादकीय नीति', 'गोपनीयता', 'संपर्क और सुधार', 'वेबसाइट जानकारी'],
  id: ['Panduan', 'Tentang & editorial', 'Privasi', 'Kontak & koreksi', 'Informasi situs'],
};

export function contentNavigation(locale: string) {
  const [guides, about, privacy, contact, information] = labels[locale] ?? labels.en;
  const target = locale === 'zh-CN' ? 'zh-CN' : 'en';
  const suffix = target !== locale ? ' · English' : '';
  return {
    information,
    items: [
      { label: guides + suffix, href: '/' + target + '/guides', lang: target },
      { label: about + suffix, href: '/' + target + '/about', lang: target },
      { label: privacy + suffix, href: '/' + target + '/privacy', lang: target },
      { label: contact + suffix, href: '/' + target + '/contact', lang: target },
    ],
  };
}
