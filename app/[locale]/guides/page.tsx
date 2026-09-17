import { notFound } from 'next/navigation';
import { ContentShell, GuideCards } from '@/components/Editorial';
import { isContentLocale } from '@/lib/editorial';
import { editorialMetadata } from '@/lib/editorial-metadata';

type Props = { params: Promise<{ locale: string }> };
const copy = {
  en: { title: 'Guides for playing & creating', description: 'Practical guides to selected Astra works: controls, creative workflows and the evidence behind each recommendation.' },
  'zh-CN': { title: '玩法与创作指南', description: '从作品选择到具体操作，了解精选 Astra 作品的机制、创作流程与资料依据。' },
};
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isContentLocale(locale)) return {};
  return editorialMetadata(locale, '/guides', copy[locale].title, copy[locale].description);
}
export default async function GuidesPage({ params }: Props) {
  const { locale } = await params;
  if (!isContentLocale(locale)) notFound();
  return <ContentShell locale={locale} path="/guides">
    <p className="t-micro text-[var(--palette-rausch)]">ASTRA GAMES · {locale === 'zh-CN' ? '编辑内容' : 'EDITORIAL'}</p>
    <h1 className="t-section mt-4 max-w-3xl">{copy[locale].title}</h1>
    <p className="mb-12 mt-6 max-w-2xl text-lg leading-8 text-[var(--palette-text-secondary)]">{copy[locale].description}</p>
    <GuideCards locale={locale} />
    <p className="mt-10 max-w-3xl text-base leading-8 text-[var(--palette-text-secondary)]">{locale === 'zh-CN' ? '指南覆盖部分作品，完整目录仍自动收录上游更新。资料整理与浏览器抽查会分别标注；目录同步不代表所有作品都已试玩或通过版权审核。' : 'Guides cover selected works. The complete catalogue continues to follow upstream updates automatically. Documentation research and browser spot checks are identified separately; catalogue sync does not mean every work has been played or cleared for reuse.'}</p>
    <a className="mt-4 inline-flex min-h-11 items-center underline underline-offset-4" href={`/${locale}#works`}>{locale === 'zh-CN' ? '浏览所有作品 →' : 'Explore all works →'}</a>
  </ContentShell>;
}
