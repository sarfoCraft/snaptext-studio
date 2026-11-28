# WordToPDF Ad Placement Audit

## Applied strategy

This build uses both networks on 19 selected high-intent pages:

- Adsterra: one 300 × 250 banner after the main converter workspace or opening content.
- Monetag: one In-Page Push (Banner) zone tag in the page `<head>`. This is a provider-rendered on-page banner, not a fixed in-content 300 × 250 slot.

| Page group | Pages | Adsterra tags per page | Monetag tags per page |
|---|---:|---:|---:|
| Homepage | 1 | 1 | 1 |
| Main tool pages | 13 | 1 | 1 |
| Published guides | 4 | 1 | 1 |
| Articles listing | 1 | 1 | 1 |
| About, Contact, Privacy, Terms, 404 | 5 | 0 | 0 |
| Tools index and legacy `/tools/*` pages | 13 | 0 | 0 |
| Supplemental guides now included in the sitemap | 3 | 0 | 0 |

## Implementation notes

1. The homepage has one 300 × 250 Adsterra banner. The previous 728 × 90 and 320 × 50 homepage banners remain removed.
2. The supplied Adsterra 300 × 250 tag is installed once on each of the 13 main tool pages, the articles listing page, and four published guides: 19 pages total.
3. The supplied Monetag In-Page Push tag for zone `12364901` is installed once in the `<head>` of those same 19 pages.
4. The Monetag tag and dynamically created loader carry `data-cfasync="false"` to reduce the risk of Cloudflare Rocket Loader delaying the tag.
5. The old Monetag floating-ad integration and service worker (`sw.js`, old zone `12363986`) are not restored. The new zone is In-Page Push and does not require the Push Notifications/MultiTag service-worker setup.
6. Adsterra placements stay hidden until the loader inserts an iframe. If no iframe appears within 20 seconds, the empty placement is removed.
7. The Adsterra iframe is constrained to a maximum width of 300 px and a height of 250 px, with responsive scaling for small screens.
8. The custom 404 page and legal pages remain ad-free.
9. The Privacy Policy discloses Adsterra, Monetag and the Google Analytics 4 tag currently installed on the homepage only.

## Exact zones supplied by the site owner

### Adsterra
- Zone key: `93eeac727905f44a6881f877c04f163a`
- Format: iframe, 300 × 250
- Loader: `https://bauval.org/22/93eeac727905f44a6881f877c04f163a`

### Monetag
- Zone ID: `12364901`
- Format: In-Page Push (Banner), as stated by the site owner
- Loader: `https://nap5k.com/tag.min.js`

## Owner checks still required

- Confirm both zones are active and approved for `wordtopdf.fun` in their respective dashboards.
- Add the exact Adsterra seller record to `/ads.txt` when supplied by Adsterra. The current file intentionally contains no invented seller line.
- Test the published homepage, one tool page and one guide in a private browser window with ad blockers disabled.
- Monetag's default In-Page Push location may be upper-right on desktop and top on mobile. If this interferes with the sticky header, ask Monetag support whether the zone can be repositioned or disable it on affected pages.
- Configure a suitable consent-management solution if applicable law requires consent for advertising cookies or identifiers.
- Never click your own ads or use bots, incentives, or artificial traffic to generate impressions or clicks.
