# WordToPDF advertising placement audit

## Current configuration

- **Adsterra:** one 300 × 250 display banner on the homepage, 13 main tool pages, the articles listing page, and four published guides (19 pages total).
- **Monetag:** standalone browser Push Notifications, zone `12374210`, installed on active HTML pages. The matching service worker is `/sw.js` at the website root.
- The old Monetag In-Page Push (Banner) zone `12364901` has been removed.
- The old Monetag service-worker zone `12363986` has been replaced with the supplied zone `12374210`.
- The custom 404 page remains free of ad and push tags.

## Ad placement and mobile behavior

1. Adsterra 300 × 250 banners remain after the main converter/tool workspace or opening content, never inside upload, processing, progress or download controls.
2. Adsterra slots stay hidden until the supplied loader inserts an iframe. If no iframe appears within 20 seconds, the empty placement is removed.
3. Adsterra slots are centered and constrained to a maximum width of 300 px, with a 6:5 responsive iframe ratio on narrow screens.
4. On mobile tool pages, the upload/conversion workspace appears before the marketing illustration and supporting copy, reducing scrolling before users can reach the tool.
5. Monetag Push Notifications are not an on-page banner placement. The browser controls notification permission; a visitor must allow notifications before the browser can deliver them.
6. No fixed or sticky ad container has been added by the site CSS.

## Hostinger affiliate banner

- One Hostinger affiliate banner is shown on the homepage, the tools directory, all 13 main tool pages, the articles listing page and published article pages.
- Affiliate URL: `https://www.hostinger.com?REFERRALCODE=H2ABSTSARZDJ`
- Creative: `/assets/images/hostinger-affiliate.webp`
- The banner is marked as an advertisement and includes an affiliate disclosure. It uses a static HTML placement, so it does not depend on Adsterra or Monetag scripts.
- On wide desktop screens it uses the right-side gutter. On ordinary desktop and mobile screens it stays in the page flow and does not cover upload, conversion or download controls.

## Exact zones supplied by the site owner

### Adsterra
- Zone key: `93eeac727905f44a6881f877c04f163a`
- Format: iframe, 300 × 250
- Loader: `https://bauval.org/22/93eeac727905f44a6881f877c04f163a`

### Monetag Push Notifications
- Zone ID: `12374210`
- Tag: `https://5gvci.com/act/files/tag.min.js?z=12374210`
- Service-worker domain: `3nbf4.com`
- Service-worker script: `https://3nbf4.com/act/files/service-worker.min.js?r=sw`
- Local service-worker file: `/sw.js`

## Owner checks still required

- Confirm both zones are active and approved for `wordtopdf.fun` in their respective dashboards.
- Add the exact Adsterra seller record to `/ads.txt` when supplied by Adsterra. No seller record has been guessed.
- Test the published homepage, one tool page and one guide in a private browser window with ad blockers disabled.
- Test Push Notifications using a browser profile where notification permission has not already been decided. Do not expect a notification permission prompt if the visitor previously blocked it.
- Check browser DevTools > Application > Service Workers and confirm `/sw.js` is registered and active.
- Configure a suitable consent-management solution if applicable law requires consent for advertising cookies or identifiers.
- Never click your own ads or use bots, incentives, or artificial traffic to generate impressions or clicks.
