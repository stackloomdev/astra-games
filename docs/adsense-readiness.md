# Content improvements, September 2026

The site retains the complete, automatically refreshed upstream catalogue. Selected works now have separately maintained English and Chinese guides, with source links, dated evidence statements and no invented reviews or ratings. Guides do not gate catalogue inclusion. Other language catalogues explicitly link to the English editorial pages.

About/editorial, privacy and contact pages describe the actual website, analytics providers and public feedback channels. These are discoverable from the header/footer, have their own canonical URLs and are included in the sitemap. The mobile menu and skip link expose the same navigation. Statistics render the actual count before JavaScript runs.

## Operating the content

- Add or revise guides in `lib/editorial.ts`, using public documentation or recorded observations. Keep the basis statement and source revision accurate; do not label documentation research as hands-on testing.
- The catalogue and detail pages keep their existing 300-second revalidation. It is request-driven caching, not an instant upstream webhook; a new request may receive stale content while revalidation completes. No daily manual website update is needed.
- `npm test` covers upstream additions/removals, outage recovery and guide matching across translations. `npm run build` generates covers and runs the production build.
- `lib/site-information.ts` must change when tracking, operator contact details or advertising practices change. Public GitHub feedback is the currently available channel; do not invent a support email or publish sensitive information.

## Before requesting AdSense review or enabling ads

The September content change did not certify approval or submit an application. Adsterra advertising was subsequently integrated; see the current advertising state below. Three guides are an initial content improvement, not a Google minimum or an assurance that the entire automatically collected catalogue has sufficient original value.

Review the main `aigccreative.com` website as well: the rejection screenshot names that site entry, and the precise rejected pages are not identified. The separate radar website is outside this repository.

Assess proposed ad-bearing pages for sufficient original value and actual rights. A CC0 catalogue statement does not clear every external game or branded recreation. Do not place ads on unreviewed, thin, copied or problematic pages merely because a domain is approved. The October 28 integration adds the owner-requested AdSense loader to language pages; it does not certify every page as suitable for ads. Use AdSense page/area exclusions for unsuitable pages and controls.

Before ads go live, implement the applicable consent management requirements, update privacy disclosures for actual Google data use, and verify publisher-specific ads.txt/domain configuration. None of these is replaced by a privacy page or disclaimer. See the current Google Publisher Policies for replicated content, privacy disclosures and intellectual property.

## October 9, 2026 audit

- Demo counts measure records with a demo URL, not successful reachability checks or completed playtests. All twelve language catalogues now label them as demo links and avoid claiming every destination is currently playable. The complete upstream catalogue and its automatic revalidation remain intact.
- Adsterra components are present. `NEXT_PUBLIC_ADS_ENABLED=true` enables placements at build time; the source default is off. Do not infer production behavior from that default: the public English catalogue was observed with ad placements and provider scripts on October 9.
- Adsterra consent controls are not a Google-certified CMP and do not satisfy future Google consent requirements by themselves. If Google ads are introduced, assess the actual partner, region and cookie behavior before enabling them.
- Using another advertising network is not, by itself, proof of an AdSense violation. Google explicitly prohibits Google ads on sites containing or triggering pop-unders; the configured Adsterra pop-under must be disabled before combining with Google ads. Review floating placements, deceptive links and the landing pages actually delivered. See https://support.google.com/adsense/answer/1346295 and https://support.google.com/adsense/answer/9728. The rejection notice does not identify the exact offending pages.
- Keep source research distinct from actual play observations, and review permissions for branded recreations individually. Listing all works does not automatically make all pages suitable for advertisements.

## October 15, 2026 advertising removal

The former Adsterra integration (all remaining scripts, placements, Smartlinks,
consent UI and PostScribe dependency) has been removed after unwanted redirects
were reported. The October 9 audit above describes historical behavior.
`NEXT_PUBLIC_ADS_ENABLED` now controls only the independent sponsor slot.
This removal is not a guarantee of AdSense approval.

## October 28, 2026 Google AdSense connection

- Added the owner's ordinary, non-AMP AdSense script to the shared language layout's `<head>`, with `async`, `crossorigin="anonymous"` and publisher `ca-pub-9565558700858500`. It covers the catalogue, work details and information pages in every supported language without a second client-side injector. It is independent of the sponsor-slot environment flag.
- Added the matching `public/ads.txt` entry on this subdomain. The main radar site's existing verification and ads.txt are managed in its separate repository.
- Updated English and Chinese privacy disclosures, Google partner-data/advertising-partner references and personalization opt-out links. No Adsterra scripts or consent controls are reintroduced.
- The supplied dashboard still shows the site as Getting ready / 正在准备. This deployment is code installation, not approval or proof of ad delivery. Do not delete and recreate the site entry to restart review.
- In AdSense Privacy & messaging, the owner should configure/publish the applicable Google-certified consent messages for the site's audiences. The old Adsterra consent UI is absent and is not a certified Google CMP. This code change does not claim the dashboard's consent messages have been configured.
- Auto ads are already enabled in the supplied dashboard. Actual ad placement and eligibility remain controlled by Google and the site's account settings; this integration does not add fake ad units or request clicks.
