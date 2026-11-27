# WordToPDF Ad Placement Audit

## Summary

The uploaded archive contains 40 HTML files, 13 primary tool pages, 7 article pages, 12 legacy `/tools/` pages, plus utility and policy pages. The current sitemap lists the homepage, 13 primary tool routes, the article listing and four published guide pages, along with informational pages.

## Applied placement plan

| Page group | Pages | Ads per page | Decision |
|---|---:|---:|---|
| Homepage | 1 | 1 | One 300 × 250 banner |
| Main tool pages | 13 | 1 | One 300 × 250 banner after the tool workspace |
| Published guides | 4 | 1 | One 300 × 250 banner after the opening paragraph |
| Articles listing | 1 | 1 | One 300 × 250 banner after the guide cards |
| About, Contact, Privacy, Terms, 404 | 5 | 0 | Ad-free |
| Tools index and legacy `/tools/*` pages | 13 | 0 | Ad-free; empty reserved-ad boxes removed |
| Older non-sitemap articles | 3 | 0 | Ad-free; empty reserved-ad boxes removed |

## Findings and changes

1. The homepage previously loaded 728 × 90, 300 × 250, and 320 × 50 Adsterra zones. The 728 × 90 and 320 × 50 blocks were removed; only one 300 × 250 banner remains.
2. The 13 primary tool pages had hidden 300 × 250 placeholders. The supplied Adsterra tag was inserted once on each page.
3. The articles index and four sitemap-listed guide pages also had hidden placeholders. The supplied tag was inserted once on each.
4. The older `/tools/*` pages and three older articles used visible “Ad space reserved” boxes but are not in the current sitemap. Those boxes were removed and no new ad tags were added to these duplicate/legacy pages.
5. The homepage-only floating tag using `nap5k.com/tag.min.js` and zone `12364080` was removed to avoid the top-right overlay. The root `sw.js` file was retained; it references a different zone ID, `12363986`, so confirm which Monetag zone it belongs to before changing it.
6. Ad containers remain hidden until the Adsterra iframe is injected, so no large empty ad box is shown when an ad is blocked or unfilled.
7. The Privacy Policy and setup guide were updated to reflect the active Adsterra tag and disabled floating Monetag tag.
8. The custom 404 page was restored, expanded to include all 13 primary tools, and remains ad-free.

## Owner checks still required

- Confirm in Adsterra that zone `93eeac727905f44a6881f877c04f163a` may be reused across multiple pages. If not, create separate zones and replace the code per page.
- Add the exact Adsterra seller record to `/ads.txt` when available. The package does not invent this record.
- Configure a consent-management platform if applicable law requires consent for advertising cookies or identifiers.
- Test the published site in a clean browser profile on desktop and mobile. Ad delivery depends on inventory, region, browser settings and blockers; code presence alone does not guarantee an impression.
