# WordToPDF: Ad Setup and Placement Guide

## Strategy applied

This build uses two formats:

- **Adsterra 300 × 250 display banners** on 19 selected high-intent pages. Each banner appears after the main tool workspace or opening content.
- **Monetag standalone browser Push Notifications**, zone `12374210`, installed on active HTML pages with a matching root-level `sw.js` file.

The old Monetag In-Page Push (Banner) zone `12364901` is removed. Push Notifications are separate from on-page banner ads and depend on browser notification permission.

## Adsterra pages

The Adsterra banner remains on:
- Homepage: `/`.
- 13 main tools: `/word-to-pdf/`, `/pdf-to-word/`, `/pdf-to-images/`, `/images-to-pdf/`, `/merge-pdf/`, `/split-pdf/`, `/compress-pdf/`, `/image-to-text/`, `/batch-ocr/`, `/background-remover/`, `/image-converter/`, `/document-scanner/`, and `/qr-code-generator/`.
- Articles listing and four published guides: `/articles/`, `/articles/chatgpt-vs-pdf-converter/`, `/articles/how-to-choose-pdf-to-word-converter/`, `/articles/how-to-convert-pdf-to-word/`, and `/articles/ocr-vs-pdf-text-extraction/`.

Total: 19 pages.

## Hostinger affiliate banner

- One Hostinger affiliate banner is shown on the homepage, the tools directory, all 13 main tool pages, the articles listing page and published article pages.
- Affiliate URL: `https://www.hostinger.com?REFERRALCODE=H2ABSTSARZDJ`
- Creative: `/assets/images/hostinger-affiliate.webp`
- The banner is marked as an advertisement and includes an affiliate disclosure. It uses a static HTML placement, so it does not depend on Adsterra or Monetag scripts.
- On wide desktop screens it uses the right-side gutter. On ordinary desktop and mobile screens it stays in the page flow and does not cover upload, conversion or download controls.

## Adsterra zone

- Zone key: `93eeac727905f44a6881f877c04f163a`
- Format: iframe, 300 × 250
- Loader: `https://bauval.org/22/93eeac727905f44a6881f877c04f163a`

The same zone is reused across selected pages. Confirm in the Adsterra dashboard that this zone is approved for use across the website.

## Monetag Push Notifications zone

- Zone ID: `12374210`
- Tag supplied by the site owner:

```html
<script src="https://5gvci.com/act/files/tag.min.js?z=12374210" data-cfasync="false" async></script>
```

- Service-worker domain: `3nbf4.com`
- Root file: `/sw.js`
- Service-worker script imported by that file: `https://3nbf4.com/act/files/service-worker.min.js?r=sw`

The supplied tag is installed on active HTML pages. The old service-worker cleanup code has been removed so the site does not unregister Monetag's new `/sw.js`. The previous zone `12363986` is no longer configured.

## Mobile behavior

- Adsterra banners stay inline below the tool workspace and never cover upload or download controls.
- The 300 × 250 ad slot is centered and uses a responsive 6:5 ratio on narrow screens.
- On mobile tool pages, the actual upload/conversion workspace appears before the marketing illustration and supporting copy.
- Monetag Push Notifications are browser notifications, not a fixed on-page banner. Visitors control permission through their browser.

## ads.txt and privacy

The root `/ads.txt` file contains comments only because the exact Adsterra seller record was not supplied. Add the seller line exactly as shown in the Adsterra dashboard. Do not guess publisher IDs, seller IDs, account types or certification IDs.

The Privacy Policy now describes Adsterra banners and Monetag Push Notifications. This starter policy is not legal advice or a certified consent-management platform. Check consent requirements for visitor regions and configure a suitable consent-management solution where required.

## Testing checklist

1. Extract this ZIP and copy its contents into the repository root. Do not upload the ZIP itself.
2. Deploy to a Cloudflare Pages preview before production.
3. View page source and confirm Monetag zone `12374210` appears once on active pages.
4. Confirm `/sw.js` loads and the browser registers it successfully.
5. Test Push Notifications with browser permission in the default or undecided state. If permission was previously denied, reset it in browser site settings before retesting.
6. Confirm the Adsterra `bauval.org` request loads and an iframe is inserted when inventory is available.
7. Test one desktop and one mobile viewport. Confirm no ad covers upload, convert, progress or download controls.
8. Never click your own ads or use bots, incentives or artificial traffic.
