# WordToPDF: Ad Setup and Placement Guide

## Strategy applied

This build uses two restrained ad formats on selected high-intent pages:

- One Adsterra 300 × 250 display banner, placed after the main tool workspace or opening content.
- One Monetag In-Page Push (Banner) zone tag, loaded in the document `<head>` so Monetag can render its native-style on-page banner.

Neither tag is placed inside file upload, processing, progress, or download controls. The Monetag In-Page Push format is not a fixed 300 × 250 slot. Monetag says it commonly appears in the upper-right on desktop and at the top on mobile; its position can be changed by Monetag support on request.

## Pages with both formats

- Homepage: `/`.
- 13 main tools: `/word-to-pdf/`, `/pdf-to-word/`, `/pdf-to-images/`, `/images-to-pdf/`, `/merge-pdf/`, `/split-pdf/`, `/compress-pdf/`, `/image-to-text/`, `/batch-ocr/`, `/background-remover/`, `/image-converter/`, `/document-scanner/`, and `/qr-code-generator/`.
- Articles listing and four published guides: `/articles/`, `/articles/chatgpt-vs-pdf-converter/`, `/articles/how-to-choose-pdf-to-word-converter/`, `/articles/how-to-convert-pdf-to-word/`, and `/articles/ocr-vs-pdf-text-extraction/`.

Total: 19 selected pages. Each selected page has one Adsterra banner tag and one Monetag In-Page Push tag.

## Pages kept ad-free

- `/about/`, `/contact/`, `/privacy-policy/`, `/terms/`, and `/404.html`.
- `/tools/` index and legacy duplicate pages under `/tools/*`.
- Three older, non-sitemap articles.

## Adsterra zone

The exact 300 × 250 tag supplied by the site owner is installed once on each selected page:

- Zone key: `93eeac727905f44a6881f877c04f163a`
- Format: iframe
- Size: 300 × 250
- Loader: `https://bauval.org/22/93eeac727905f44a6881f877c04f163a`

The same zone is reused across selected pages. Confirm in the Adsterra dashboard that this zone is approved for use across the website. If separate zones are required, generate them in Adsterra and replace the code using the exact tags from the dashboard.

## Monetag In-Page Push zone

The exact zone supplied by the site owner is installed once in the `<head>` on each of the 19 selected pages:

- Zone ID: `12364901`
- Format: In-Page Push (Banner), as selected by the site owner
- Loader: `https://nap5k.com/tag.min.js`

The tag is marked `data-cfasync="false"` so Cloudflare Rocket Loader should leave it alone. The script is not a Push Notifications or MultiTag integration, so no Monetag `sw.js` file is added for this zone. Confirm the zone is active in the Monetag dashboard. Monetag's help center recommends placing the tag high in `<head>` and testing with ad blockers disabled.

## Loading behavior and testing

- Adsterra's inline `atOptions` configuration and external loader use `data-cfasync="false"`.
- The Adsterra wrapper remains hidden until its loader inserts an iframe; if no iframe appears within 20 seconds, the empty placement is removed.
- The Adsterra iframe is constrained to 300 × 250 and scales down to fit small screens.
- Monetag's In-Page Push is rendered by Monetag and may appear as an overlay-style native banner. It may be hidden by ad blockers and may take time to begin serving after activation.
- Do not add the same zone tag more than once on a page.
- The CSS and shared JavaScript URLs include a version query string to bypass the previous immutable browser cache after deployment.

## ads.txt and privacy

The root `/ads.txt` file contains comments only because the exact Adsterra seller record was not supplied. Add the seller line exactly as shown in the Adsterra dashboard. Do not guess a publisher ID, seller ID, account type, or certification ID. No Monetag `ads.txt` line has been invented.

The Privacy Policy now discloses Adsterra and Monetag. This starter policy is not legal advice or a certified consent-management platform. Check consent requirements for visitor regions and configure a suitable consent-management solution where required.

## Testing checklist

1. Deploy the updated ZIP to the repository root.
2. Open the homepage, one tool page and one guide in a private/incognito window with ad blockers disabled.
3. View page source and search for Monetag zone ID `12364901`; it should appear once in the `<head>` of each selected page.
4. Confirm the Adsterra `bauval.org` request loads and an iframe is inserted when inventory is available.
5. Confirm Monetag's In-Page Push banner appears when inventory is available. Its default location may be upper-right on desktop and top on mobile.
6. Confirm no empty Adsterra box remains when no ad is served and no tool controls are covered.
7. If Monetag does not appear, check that the zone is active, the tag is in `<head>`, `data-cfasync="false"` remains present, and no ad blocker is active. If Cloudflare Rocket Loader still interferes, disable it or exclude the relevant pages.
8. Never click your own ads or use bots, incentives, or artificial traffic to generate impressions or clicks.
