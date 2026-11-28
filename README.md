# WordToPDF.fun

A static, browser-based document tools website for Word, PDF, OCR and image workflows.

## Hosting target

This package is prepared for **Cloudflare Pages**.

- Framework preset: None
- Build command: leave blank
- Build output directory: `.`
- Production branch: keep the branch already configured in your Cloudflare Pages project
- Custom domain: manage `wordtopdf.fun` in the Cloudflare Pages project settings

Do not change the existing Cloudflare build settings unless your project currently uses a different working configuration.

## Included

- Homepage positioned as a general PDF, Word and image tools hub.
- 13 current tool pages.
- About, Contact, Privacy Policy and Terms pages.
- Articles and guides.
- SEO titles, descriptions, canonical URLs, Open Graph metadata, Schema.org JSON-LD, `robots.txt` and `sitemap.xml`.
- Cloudflare Pages `_redirects` rules for legacy tool URLs.
- Cloudflare Pages `_headers`.
- Adsterra 300 × 250 banner and Monetag In-Page Push (Banner) integrations on 19 selected pages. See `AD-PLACEMENT-AUDIT.md` and `ADS-SETUP-GUIDE.md`.

## Safe deployment workflow

1. Create a backup branch in GitHub before replacing files.
2. Extract this ZIP on your computer.
3. Copy the **contents** of the extracted folder into the repository root. Do not upload the ZIP itself or create an extra nested folder.
4. Commit the changes to a separate testing branch first.
5. Let Cloudflare Pages create a preview deployment.
6. Test redirects, all converters, articles, ads and mobile layout on the preview.
7. Merge into the configured production branch only after the preview passes.

See `DEPLOYMENT-CHECKLIST.txt` for the full checklist.

## Tool limitations

- **Word to PDF:** accepts DOCX files. It prepares browser-rendered HTML and opens the print dialog. The visitor must choose **Save as PDF**. Older DOC files are not supported, and complex layouts may differ.
- **PDF to Word:** extracts selectable text and uses OCR for scanned pages. Complex formatting and layout may not be preserved.
- **Compress PDF:** rasterises pages, which can make text non-selectable and may not reduce every file.
- **PDF to Images:** exports PNG pages.
- **Background Remover:** works best with plain, single-colour backgrounds. It is not general AI subject segmentation.
- **Document Scanner:** currently crops a document image before OCR. It is not a multi-page camera scanner or a scan-to-PDF workflow.
- **OCR:** recognition can contain errors. Review names, numbers and important text.
- Files are processed in the browser by the supplied runtime. This static build does not include a server-side upload service, user accounts, database or cloud file storage.

## Owner actions before production

- Replace the Contact page support/privacy email placeholder with a monitored address.
- Add the exact Adsterra seller record to `ads.txt` from the publisher dashboard. Do not invent IDs.
- Review Privacy Policy and Terms against actual services and target visitors.
- Confirm the Adsterra and Monetag zones are active and approved for `wordtopdf.fun`.
- Review applicable consent requirements and configure a suitable consent-management platform if required.
- Test every converter with non-sensitive sample files on desktop and mobile.
- Submit `https://wordtopdf.fun/sitemap.xml` to Google Search Console after production deployment.

## Advertising

- Adsterra 300 × 250 banner: retained on 19 selected pages.
- Monetag In-Page Push (Banner), zone `12364901`: retained on the same 19 selected pages.
- The older Monetag floating-ad integration and its legacy service worker are not used. The old service worker is only unregistered as legacy cleanup.
- No ads are intentionally placed inside upload, conversion, progress or download controls.
- Actual ad serving, approval, fill rate and dashboard-level settings must be verified by the site owner.

## Important

This package is a static website source update. It has not been deployed to your Cloudflare Pages production project. Preview and live browser testing are still required.
