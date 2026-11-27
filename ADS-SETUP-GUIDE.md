# WordToPDF: Ad Setup and Placement Guide

## Strategy applied

This build uses one Adsterra 300 × 250 banner on selected high-intent pages. It keeps the layout restrained and does not place ads inside file upload, processing, progress, or download controls.

### Pages with one banner

- Homepage: one banner after the Word to PDF workspace.
- 13 main tools: `/word-to-pdf/`, `/pdf-to-word/`, `/pdf-to-images/`, `/images-to-pdf/`, `/merge-pdf/`, `/split-pdf/`, `/compress-pdf/`, `/image-to-text/`, `/batch-ocr/`, `/background-remover/`, `/image-converter/`, `/document-scanner/`, and `/qr-code-generator/`.
- Articles listing and four published guides: `/articles/`, `/articles/chatgpt-vs-pdf-converter/`, `/articles/how-to-choose-pdf-to-word-converter/`, `/articles/how-to-convert-pdf-to-word/`, and `/articles/ocr-vs-pdf-text-extraction/`.

Total: 19 selected pages, one banner per page.

### Pages kept ad-free

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

## Loading behavior

- Both the inline `atOptions` configuration and the external loader use `data-cfasync="false"` so Cloudflare Rocket Loader does not reorder them.
- The ad wrapper is hidden until the Adsterra loader inserts an iframe.
- If the external script fails or no iframe appears within 20 seconds, the empty placement is removed.
- The iframe is constrained to 300 × 250 and scales down to fit small screens.
- The CSS and shared JavaScript URLs include a version query string to bypass the previous immutable browser cache after deployment.

## Monetag

The previous floating Monetag tag and its root service worker (`sw.js`) have been removed. The shared site script unregisters the previous same-origin `/sw.js` service worker for returning visitors. This build intentionally uses Adsterra banners only.

## ads.txt and privacy

The root `/ads.txt` file contains comments only because the exact Adsterra seller record was not supplied. Add the seller line exactly as shown in the Adsterra dashboard. Do not guess a publisher ID, seller ID, account type, or certification ID.

The Privacy Policy has been updated to describe the Adsterra banners. This starter policy is not legal advice or a certified consent-management platform. Check the consent requirements for the regions where visitors are located and configure a suitable consent-management solution where required.

## Testing checklist

1. Deploy the updated ZIP to the repository root.
2. Open the homepage, one tool page and one guide in a private/incognito window.
3. Disable ad blockers for this test and allow the `bauval.org` request.
4. Confirm one 300 × 250 banner appears where inventory is available.
5. Confirm no empty ad box remains when no ad is served.
6. Confirm mobile pages do not overflow horizontally and the ad does not cover the tool controls.
7. If no iframe appears, inspect the browser Network and Console panels and confirm the Adsterra zone is active and approved for `wordtopdf.fun`.
8. Never click your own ads or use bots, incentives, or artificial traffic to generate impressions or clicks.
