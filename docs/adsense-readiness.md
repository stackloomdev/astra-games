# Content improvements, September 2026

The site retains the complete, automatically refreshed upstream catalogue. Selected works now have separately maintained English and Chinese guides, with source links, dated evidence statements and no invented reviews or ratings. Guides do not gate catalogue inclusion. Other language catalogues explicitly link to the English editorial pages.

About/editorial, privacy and contact pages describe the actual website, analytics providers and public feedback channels. These are discoverable from the header/footer, have their own canonical URLs and are included in the sitemap. The mobile menu and skip link expose the same navigation. Statistics render the actual count before JavaScript runs.

## Operating the content

- Add or revise guides in `lib/editorial.ts`, using public documentation or recorded observations. Keep the basis statement and source revision accurate; do not label documentation research as hands-on testing.
- The catalogue and detail pages keep their existing 300-second revalidation. It is request-driven caching, not an instant upstream webhook; a new request may receive stale content while revalidation completes. No daily manual website update is needed.
- `npm test` covers upstream additions/removals, outage recovery and guide matching across translations. `npm run build` generates covers and runs the production build.
- `lib/site-information.ts` must change when tracking, operator contact details or advertising practices change. Public GitHub feedback is the currently available channel; do not invent a support email or publish sensitive information.

## Before requesting AdSense review or enabling ads

This change does not certify approval, install ads or submit an application. Three guides are an initial content improvement, not a Google minimum or an assurance that the entire automatically collected catalogue has sufficient original value.

Review the main `aigccreative.com` website as well: the rejection screenshot names that site entry, and the precise rejected pages are not identified. The separate radar website is outside this repository.

Assess proposed ad-bearing pages for sufficient original value and actual rights. A CC0 catalogue statement does not clear every external game or branded recreation. Do not place ads on unreviewed, thin, copied or problematic pages merely because a domain is approved. A future implementation should explicitly select eligible pages; global automatic ad injection is not added here.

Before ads go live, implement the applicable consent management requirements, update privacy disclosures for actual Google data use, and verify publisher-specific ads.txt/domain configuration. None of these is replaced by a privacy page or disclaimer. See the current Google Publisher Policies for replicated content, privacy disclosures and intellectual property.
