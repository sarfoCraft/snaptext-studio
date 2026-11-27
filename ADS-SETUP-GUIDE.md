# WordToPDF: Ad Placement Audit and Setup Guide

## Strategy applied

This build uses one Adsterra 300 × 250 banner per selected page. No ad is placed inside file upload, processing, progress, or download controls. The slot stays hidden until an ad iframe is inserted, preventing a large empty box when the network does not fill an impression.

### Pages with one Adsterra banner

- Homepage: one 300 × 250 banner after the Word to PDF workspace.
- Main tools: `/word-to-pdf/`, `/pdf-to-word/`, `/pdf-to-images/`, `/images-to-pdf/`, `/merge-pdf/`, `/split-pdf/`, `/compress-pdf/`, `/image-to-text/`, `/batch-ocr/`, `/background-remover/`, `/image-converter/`, `/document-scanner/`, and `/qr-code-generator/`.
- Editorial: `/articles/`, `/articles/chatgpt-vs-pdf-converter/`, `/articles/how-to-choose-pdf-to-word-converter/`, `/articles/how-to-convert-pdf-to-word/`, and `/articles/ocr-vs-pdf-text-extraction/`.

### Pages kept ad-free

- `/about/`, `/contact/`, `/privacy-policy/`, `/terms/`, and `/404.html`.
- `/tools/` index and legacy duplicate pages under `/tools/*`.
- Three older, non-sitemap articles using the previous SnapText Studio presentation.

Empty reserved-ad boxes were removed from the legacy pages. They have not been given new ad tags.

## Adsterra tag

The 300 × 250 zone supplied by the site owner is installed once per selected page:

- Zone key: `93eeac727905f44a6881f877c04f163a`
- Format: iframe
- Size: 300 × 250
- Script host: `bauval.org`

The same zone code is reused across selected pages. Confirm in the Adsterra dashboard that this reuse matches the zone's account settings. If Adsterra requires separate zones, generate the relevant zone tags in the dashboard and replace each page's snippet. Do not invent or modify publisher keys.

The previous 728 × 90 and 320 × 50 homepage tags were removed. Only the 300 × 250 banner remains on the homepage.

## Monetag

The previous homepage-only script using zone `12364080` and `nap5k.com/tag.min.js` was disabled because it produced a floating In-Page Push style overlay near the page header. The root `sw.js` file was retained, but no Monetag ad tag is loaded by the current pages. Note that `sw.js` references zone `12363986`, which differs from the removed homepage tag zone `12364080`. Confirm in Monetag which zone the file belongs to before deleting or reusing it.

## Privacy, consent and ads.txt

The Privacy Policy now reflects the active Adsterra display ads and disabled floating Monetag tag. This is not a certified consent-management platform. Check the applicable consent requirements for visitors' regions and configure a suitable consent-management platform where required before serving personalized advertising or setting non-essential advertising cookies.

The root `/ads.txt` file still contains comments only. Add the exact seller record supplied by Adsterra in its dashboard or support response. Do not guess publisher IDs, seller IDs, account types, or certification IDs.

## Testing checklist

- Test the homepage, one tool page, and one guide page on desktop and mobile.
- Test in a private/incognito browser with ad blockers disabled.
- Confirm the banner does not cover upload, conversion, progress, or download controls.
- Confirm the ad slot stays hidden when no iframe is served.
- Confirm each selected page has one Adsterra tag and one 300 × 250 slot only.
- Test a deliberately invalid URL to confirm the custom 404 page appears with an HTTP 404 response.
- Never click your own ads or use bots, incentives, or artificial traffic to generate impressions or clicks.
