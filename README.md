# WordToPDF Static Website, GitHub Pages + Cloudflare Pages

This is the static-site conversion of the supplied SnapText Studio WordPress theme, rebranded as WordToPDF.

**GitHub Pages path fix:** the site now automatically detects `https://sarfocraft.github.io/snaptext-studio/` and loads assets/navigation from `/snaptext-studio/`. On `wordtopdf.fun` and Cloudflare Pages, it uses `/`. This corrects the unstyled page shown when assets were requested from the wrong root path.

## What is included

- Static homepage with Word to PDF as the primary tool.
- 13 tool pages: Word to PDF, PDF to Word, PDF to Images, Images to PDF, Merge PDF, Split PDF, Compress PDF, Image to Text OCR, Batch OCR, Image Converter, Background Remover, Document Scanner and QR Code Generator.
- About page, Articles & Guides index, four starter articles, Privacy Policy, Terms and Contact pages.
- Rebranded CSS, logo/icon, dark-mode toggle, responsive navigation.
- Static SEO titles, descriptions, canonical links, Open Graph tags, Schema.org JSON-LD, robots.txt and sitemap.xml.
- Cloudflare Pages `_headers` and `_redirects`, plus `.nojekyll` for GitHub Pages.
- Automatic base-path detection: GitHub project URL `/snaptext-studio/` uses the repository subpath; Cloudflare Pages and a custom domain use the root path.

## Important source audit note

The uploaded ZIP contained the WordPress theme and PHP tool interfaces, but did not contain the companion Runtime plugin or its local JavaScript libraries. The browser-side runtime in this package was reconstructed from the runtime package created in the previous step. The CDN library URLs are pinned to specific versions. This is not a byte-for-byte recovery of the missing original plugin.

## Tool limitations

- Word to PDF: DOCX only. Converts DOCX to browser-rendered HTML, then opens the print dialog. The visitor chooses Save as PDF. Older DOC files are not supported, and complex layouts may differ.
- PDF to Word: extracts selectable text and uses OCR for scanned pages. Complex layout may not be preserved.
- Compress PDF: rasterises pages, which can make text non-selectable and may not reduce every file.
- Background Remover: works best on plain, single-colour backgrounds, not general AI subject segmentation.
- OCR: recognition can contain errors. Review names, numbers and important text.
- Selected files are processed in the browser by the supplied runtime. The site does not include a WordToPDF file-upload server or account/database system.
- Third-party libraries and OCR language data are loaded from pinned public CDNs. CDN providers may receive normal request metadata. Review the privacy policy and library terms before launch.

## Deploy to your existing GitHub Pages repository

This package automatically detects the current project URL `https://sarfocraft.github.io/snaptext-studio/` and uses `/snaptext-studio/` as its asset and navigation base. On Cloudflare Pages or a custom domain, it automatically uses `/`.

1. Extract this ZIP on your computer.
2. Open your existing GitHub repository: `sarfocraft/snaptext-studio`.
3. Upload the **contents** of the extracted folder to the repository root. Do not upload the ZIP itself or put the files inside another folder. `index.html`, `assets/`, `favicon.svg`, `.nojekyll` and the other files must be at the top level.
4. Commit the changes to the branch configured for GitHub Pages (usually `main`).
5. In the repository, open **Settings > Pages**. Confirm that the source is **Deploy from a branch**, the correct branch is selected, and the folder is `/(root)`.
6. Wait for the GitHub Pages deployment to finish.
7. Open `https://sarfocraft.github.io/snaptext-studio/` in a private/incognito window or hard-refresh with Ctrl+Shift+R.
8. Test the homepage, tool links, logo, CSS, JavaScript and sample file conversions.

## Deploy the same package to Cloudflare Pages later

1. Connect the GitHub repository to Cloudflare Pages, or upload the extracted static output.
2. Choose **None** as the framework preset.
3. Leave the build command empty.
4. Set the build output directory to `.` (repository root).
5. Deploy.
6. Add `wordtopdf.fun` under the Pages project's **Custom domains** and follow Cloudflare's DNS prompts.
7. On Cloudflare Pages and on `wordtopdf.fun`, the package automatically uses the root path, so no source edits are needed.

## Before public launch

- Replace the contact placeholder with a real support email.
- Review and update Privacy Policy and Terms to match your location, actual services, ad networks and analytics.
- Do not add ad scripts until the privacy and consent setup is appropriate for the visitors you target.
- Test each tool with sample files on desktop and mobile.
- Submit `https://wordtopdf.fun/sitemap.xml` to Google Search Console after the site is live.
- This build has not been deployed to your Cloudflare account. It is prepared for deployment, but the live domain/DNS setup must be completed in your account.


## Advertising setup

This build includes optional ad placements, but no live network tags are installed yet.

- Adsterra: one 300 x 250 banner placeholder per monetized page.
- Monetag: one In-Page Push (Banner) tag placeholder in the head of monetized pages. This is a native on-page banner, not a fixed rectangular display slot.
- Privacy Policy and Terms of Use include starter disclosures for the two networks.
- `ads.txt` is a comments-only placeholder until real seller records are provided by the networks.

Read `ADS-SETUP-GUIDE.md` before inserting any publisher tags. Unique account tags, zone IDs and seller records cannot be generated by this package. Do not use invented IDs. The starter policy is not legal advice or a certified consent-management platform.
