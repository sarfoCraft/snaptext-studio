# WordToPDF Ad Placement Audit

## Applied strategy

This build uses one Adsterra 300 × 250 banner on selected high-intent pages. Ads are placed after the main converter workspace or after the opening content, never inside upload, processing, progress, or download controls.

| Page group | Pages | Ads per page | Placement |
|---|---:|---:|---|
| Homepage | 1 | 1 | After the Word to PDF workspace |
| Main tool pages | 13 | 1 | After the tool workspace |
| Published guides | 4 | 1 | After the opening content |
| Articles listing | 1 | 1 | After the guide cards |
| About, Contact, Privacy, Terms, 404 | 5 | 0 | Ad-free |
| Tools index and legacy `/tools/*` pages | 13 | 0 | Ad-free |
| Older non-sitemap articles | 3 | 0 | Ad-free |

## Fixes in this build

1. The homepage has one 300 × 250 Adsterra banner. The previous 728 × 90 and 320 × 50 homepage banners were removed.
2. The supplied 300 × 250 Adsterra tag is installed once on each of the 13 main tool pages, the articles listing page, and four published guides. That is 19 selected pages in total.
3. The inline Adsterra configuration script and external loader both use `data-cfasync="false"` to prevent Cloudflare Rocket Loader from reordering the tag sequence.
4. Ad placements stay hidden until the Adsterra loader inserts an iframe. If the provider script errors or no iframe appears within 20 seconds, the empty placement is removed.
5. The ad iframe is constrained to a maximum width of 300 px and a height of 250 px, with a responsive maximum width for small screens.
6. The old homepage-only floating Monetag tag and the Monetag root service worker (`sw.js`, zone `12363986`) were removed. The shared `assets/js/site.js` script unregisters the old same-origin `/sw.js` worker for returning visitors.
7. CSS and JavaScript asset URLs have a version query string so browsers do not keep using the previous immutable cached files after deployment.
8. Empty reserved-ad boxes were removed from the legacy duplicate pages. The custom 404 page remains ad-free.
9. The Privacy Policy and setup notes now describe the Adsterra-only setup.

## Exact ad zone supplied by the site owner

- Zone key: `93eeac727905f44a6881f877c04f163a`
- Format: iframe
- Size: 300 × 250
- Loader: `https://bauval.org/22/93eeac727905f44a6881f877c04f163a`

The same zone tag is reused on the 19 selected pages. Confirm in the Adsterra dashboard that the zone is approved for use across the site's pages. If Adsterra requires separate zones, create those in the dashboard and replace the supplied tag on the relevant pages. No publisher IDs or seller records have been guessed.

## Owner checks still required

- Confirm the 300 × 250 zone is active and approved for `wordtopdf.fun` in Adsterra.
- Add the exact Adsterra seller record to `/ads.txt` when it is supplied in the publisher dashboard. The current file intentionally contains no invented seller line.
- Test the published homepage, one tool page and one guide in a private browser window with ad blockers disabled.
- If no iframe is inserted after deployment, check the browser Network and Console panels for the `bauval.org` request, and confirm the zone is active in Adsterra. Code presence alone cannot guarantee ad inventory or an impression.
- Configure a suitable consent-management solution if applicable law requires consent for advertising cookies or identifiers.
- Never click your own ads or use bots, incentives, or artificial traffic to generate impressions or clicks.
