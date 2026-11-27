# WordToPDF Website

A static, browser-based document tools website branded as WordToPDF. The site is designed for GitHub Pages and can also be deployed to Cloudflare Pages.

## What's included

- Homepage with Word to PDF as the primary converter.
- 13 current tool pages: Word to PDF, PDF to Word, PDF to Images, Images to PDF, Merge PDF, Split PDF, Compress PDF, Image to Text OCR, Batch OCR, Image Converter, Background Remover, Document Scanner and QR Code Generator.
- About, Contact, Privacy Policy and Terms pages.
- Articles and Guides section with seven articles.
- Responsive layout, theme toggle, tool navigation and sticky-header styling.
- SEO titles, descriptions, canonical URLs, Open Graph metadata, Schema.org JSON-LD, `robots.txt` and `sitemap.xml`.
- One Adsterra 300 × 250 banner on 19 selected pages, with ad-free legal and 404 pages. See `AD-PLACEMENT-AUDIT.md` and `ADS-SETUP-GUIDE.md`.
- `.nojekyll` for GitHub Pages. `_headers` and `_redirects` are retained for Cloudflare Pages compatibility.

## Deploy to GitHub Pages

1. Extract the ZIP.
2. Upload the **contents** of the extracted folder to the root of the `sarfocraft/snaptext-studio` repository. Do not upload the outer ZIP folder as an extra nested directory.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
5. Wait for the Pages deployment to finish.
6. Open `https://sarfocraft.github.io/snaptext-studio/` and hard-refresh with `Ctrl + Shift + R`.
7. If using `wordtopdf.fun`, configure it under **Settings → Pages → Custom domain** and set the DNS records in Cloudflare to the exact values GitHub provides. Keep the canonical URLs pointed at the production custom domain.

All local HTML links and asset references are page-relative so the project works from the GitHub Pages `/snaptext-studio/` path as well as from a custom-domain root.

## Deploy to Cloudflare Pages instead

1. Connect the GitHub repository to Cloudflare Pages.
2. Use framework preset **None**.
3. Leave the build command empty.
4. Set the build output directory to `.` (repository root).
5. Deploy and add the custom domain in the Pages project.
6. Test all routes and tools over HTTPS.

## Important implementation note: current and legacy assets

There are two page generations in this repository. They are **not exact duplicate files**, and both are still referenced by live HTML routes:

- Current WordToPDF pages use `assets/css/app.css`, `assets/js/runtime.js` and `assets/js/site.js`.
- Older `/tools/.../` pages use `assets/app.css` and `assets/app.js`.

The two CSS files and two runtime files have different content and different page dependencies. They were retained to avoid breaking existing `/tools/` routes. The old tool pages now load only the external libraries they actually need, instead of loading every library on every page. Editorial pages use the small navigation/theme script and do not load the converter runtime or converter libraries.

## Tool limitations

- **Word to PDF:** accepts DOCX files. It prepares browser-rendered HTML and opens the print dialog. The visitor must choose **Save as PDF**. Older DOC files are not supported, and complex layouts may differ.
- **PDF to Word:** extracts selectable text and uses OCR for scanned pages. Complex formatting and layout may not be preserved.
- **Compress PDF:** rasterises pages, which can make text non-selectable and may not reduce every file.
- **Background Remover:** works best with plain, single-colour backgrounds. It is not general AI subject segmentation.
- **OCR:** recognition can contain errors. Review names, numbers and important text.
- Files are processed in the browser by the supplied runtime. There is no upload server, user account system, database or cloud file storage in this static build.
- Third-party libraries and OCR language data are loaded from pinned public CDNs. CDN providers may receive normal request metadata.

## Before public launch

- Replace any contact/support email placeholder with a working address.
- Review Privacy Policy and Terms so they accurately describe your services, location, ad networks and analytics.
- Test every tool with sample files on desktop and mobile.
- Submit `https://wordtopdf.fun/sitemap.xml` to Google Search Console after the custom domain is live.
- Confirm the supplied Adsterra 300 × 250 zone is active and approved for `wordtopdf.fun`.
- Add the exact Adsterra seller record to `ads.txt` when it is provided in the publisher dashboard. Do not invent IDs.
- Review `ADS-SETUP-GUIDE.md` and `AD-PLACEMENT-AUDIT.md` for the applied placements. The starter policy text is not legal advice or a certified consent-management platform.

## Source note

The supplied WordPress theme ZIP did not contain the companion Runtime plugin or all original PHP-side dependencies. The static browser runtime was reconstructed for this project. This package is not a byte-for-byte recovery of the original WordPress installation.


## Illustrated tool page refresh

The current tool pages now use a shared two-column layout inspired by the homepage:
- A left-side introduction with a tool-specific headline, short explanation, benefit
  points and a matching SVG illustration.
- A right-side workspace with the original tool title, description and functional
  converter controls.
- The homepage and All Tools directory cards now include individual line icons,
  readable text wrappers and consistent arrow indicators.
- The Image to Text OCR page uses the same visual system while keeping its
  existing upload, OCR, editing and export controls.
- Responsive styles stack the introduction and workspace on smaller screens.

The original converter element IDs, script references, SEO text below the tool,
and existing routes were preserved.
