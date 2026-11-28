# WordToPDF SEO implementation notes

Updated: 28 November 2026

## Changes included in this build

1. Repositioned the homepage as the broad PDF, Word and image tools hub. The dedicated `/word-to-pdf/` page remains the primary Word-to-PDF landing page.
2. Added Cloudflare Pages 301 redirects from legacy duplicate `/tools/*` routes to the current root-level tool URLs. The `/tools/` index page remains available.
3. Added canonical URLs and current WordToPDF branding to three previously unlisted guides:
   - `/articles/how-to-combine-images-into-one-pdf/`
   - `/articles/how-to-extract-text-from-an-image/`
   - `/articles/jpg-vs-png-which-format-should-you-use/`
4. Expanded those guides with practical, product-accurate instructions and links to the current canonical tool pages.
5. Added the three guides to the Articles index and XML sitemap.
6. Added natural, relevant long-tail FAQs to Word to PDF, Images to PDF, Merge PDF, Split PDF and Compress PDF pages.
7. Updated Images to PDF copy to reflect the accepted formats: JPG, JPEG, PNG, WebP and BMP.
8. Restored the missing shared `runtime.js` script on the Background Remover page so its image upload and background-removal logic can initialize.
9. Corrected the Document Scanner instructions to explain its local IndexedDB handoff to the OCR workspace.
10. Added visible file-size, batch and page limits where the current runtime enforces them.
11. Updated the Privacy Policy to disclose that Google Analytics 4 is currently installed on the homepage only.
12. Corrected a stale comment in the shared ad script so it no longer claims the site uses Adsterra only.

## Advertising integrations preserved

-   Adsterra 300 × 250 banner tag: retained on the same 19 selected
    pages.
-   Monetag In-Page Push (Banner), zone `12364901`: retained on the same
    19 selected pages.
-   No advertising tag was moved into file upload, conversion, progress
    or download controls.
-   The Adsterra slot remains hidden until an iframe is inserted; an
    empty slot is removed after the timeout.
-   No popunder, fake download button, forced redirect or extra ad
    network tag was added.
-   The old Monetag service worker (`sw.js`, zone `12363986`) remains in
    the repository only for legacy cleanup; the shared script
    unregisters that old worker if found. The current In-Page Push tag
    is separate.

## Items that still require owner action

1.  **ads.txt:** The current file has comments only. Add the exact
    seller record from the Adsterra publisher dashboard. Do not guess
    publisher IDs or seller details.
2.  **Consent management:** This source build is not a certified CMP.
    Check consent requirements for the countries where ads and analytics
    are served, then configure a suitable CMP and make all relevant tags
    respect consent where required.
3.  **GA4 coverage:** GA4 currently loads on the homepage only. This is
    partial analytics coverage, not site-wide tracking. Decide whether
    to keep it homepage-only or roll it out consistently after the
    consent approach is decided.
4.  **Contact details:** The Contact page still contains a site-owner
    placeholder. Publish a real support/privacy contact address before
    promoting the site.
5.  **Ad network verification:** Confirm both zones are active and
    approved for wordtopdf.fun in their dashboards. Code inspection
    cannot verify account-level approval, actual fill rate or the ads
    users see.

## Keyword strategy guardrails

-   Map one primary search intent to one canonical landing page.
-   Combine close variants and question phrasings into a useful page or
    FAQ. Do not create one thin page per keyword.
-   Target only keywords that match the tool's current behavior.
-   Do not target PDF-to-JPEG/JPG, PDF editing, signatures, fillable
    forms, password removal or other unavailable features as if the site
    supports them.
-   Exclude book/document download queries, unrelated PDF lookups,
    competitor navigational terms and non-English queries from the
    English-language US content plan.
-   KD 0 is not a ranking guarantee. Relevance, SERP intent, page
    quality, technical accessibility and competition still matter.
-   The uploaded keyword exports do not state their database geography.
    Confirm the metrics were exported from the US database before
    treating their volume values as US-only search volumes.

## Deployment and QA checklist

1.  Upload the ZIP contents to the Cloudflare Pages project root, not as
    an extra nested directory.
2.  Deploy to a preview first.
3.  Test all 12 legacy `/tools/*` redirects and confirm each resolves to
    its intended canonical URL with HTTP 301.
4.  Test the Word-to-PDF, PDF-to-Word, Images-to-PDF, PDF-to-Images,
    Merge, Split and Compress workflows with non-sensitive sample files.
5.  Test the three supplemental articles and their internal links.
6.  Check the sitemap and robots.txt in the preview.
7.  Check one desktop and one mobile viewport with ad blockers disabled,
    and verify ads do not cover upload or download controls.
8.  Check the Privacy Policy, Contact page and ads.txt owner actions
    before production rollout.
9.  Submit the updated sitemap in Google Search Console after the
    production deploy. Inspect a sample of updated and redirected URLs.

## Uploaded keyword research processed

The keyword workbook includes 4,689 raw rows across the supplied keyword
exports and the additional rows pasted in chat, consolidated to 4,168
unique keyword phrases.

Current classification: - 807 unique terms mapped to existing tool
pages. - 108 relevant content opportunities. - 665 terms reserved for
future features that are not currently available. - 20 low-priority
general PDF information topics. - 2,568 excluded terms, including
competitor navigation, unrelated PDF document lookups,
copyrighted-download intent and non-English queries. - 164 Priority A
terms meet the working filter of current-tool relevance, KD 40 or lower
and volume 500 or higher. - 189 unique KD 0 terms were found. Only 5
match existing tool functionality; 3 relate to unavailable features and
181 are excluded as irrelevant or unsuitable.

These counts are rule-based triage of the uploaded lists, not ranking
forecasts. The exports do not identify their country database, so verify
that search-volume metrics came from the US database before using them
as US-only estimates.


## On-page SEO keyword implementation (28 November 2026)

The on-page revision uses the supplied keyword exports and question lists, not generic keyword suggestions. Keyword phrases are assigned by search intent to one preferred URL to reduce cannibalization.

### Primary tool-page clusters
- `/word-to-pdf/`: word to pdf; DOCX to PDF; word to pdf converter free; how to save a Word document as a PDF; how to change DOCX to PDF.
- `/pdf-to-word/`: PDF to Word; PDF to Word converter free; PDF to Word DOC; PDF to DOCX; turn PDF into DOCX; OCR for scanned PDF pages.
- `/images-to-pdf/`: JPG to PDF; PNG to PDF; JPEG to PDF; image to PDF converter; convert PNG to PDF online.
- `/pdf-to-images/`: PDF to PNG; convert PDF to PNG. PDF-to-JPG/JPEG terms are intentionally not claimed because the current tool exports PNG only.
- `/merge-pdf/`: merge PDF; PDF combiner; combine PDF; PDF merger.
- `/split-pdf/`: split PDF; PDF split; PDF splitter; separate pages and extract selected pages. The tool creates one PDF with selected pages, not one file per page.
- `/compress-pdf/`: compress PDF; PDF compressor; make a PDF smaller; reduce PDF size; compress a PDF for email.
- `/image-to-text/`: image to text; extract text from image; image OCR; screenshot to text.
- `/batch-ocr/`: batch OCR; extract text from multiple images.
- `/document-scanner/`: crop document image before OCR. It is not a paper scanner or PDF cropper.
- `/image-converter/`: JPG to PNG; PNG to JPG.
- `/background-remover/`: background remover for plain, single-color backgrounds.
- `/qr-code-generator/`: QR code generator from text or URL.

### New guides created from supplied question and low-KD lists
- `/articles/how-to-scan-documents-to-pdf/`: how to scan documents to PDF (8,100; KD 24), plus multi-page scan questions. Clearly distinguishes phone scanning from WordToPDF image-to-PDF functionality.
- `/articles/convert-photo-to-pdf-iphone/`: how to convert a photo to PDF on iPhone (880; KD 24), picture-to-PDF iPhone variants, screenshot-to-PDF and mobile file conversion. Instructions distinguish image files from DOCX files.
- `/articles/how-to-convert-pdf-to-google-doc/`: how to convert PDF to Google Doc (5,400; KD 40), PDF to Google Docs variants. Clearly states that WordToPDF exports DOCX, followed by a separate Google Drive/Docs step.
- `/articles/how-to-save-email-as-pdf/`: how to save email as PDF (3,600; KD 26), Outlook and email-print variants.

### Keyword use and exclusions
- Keywords with matching intent are used in titles, H1s, introductory copy, section headings, FAQs and contextual links where appropriate.
- Similar keyword variations are grouped on one relevant page rather than repeated unnaturally.
- Unrelated document lookups, copyrighted-download queries, competitor brand terms and unsupported feature queries are not forced into page copy.
- The uploaded exports do not include a country field in the CSV. Treat the volumes and KD as the supplied research values; confirm the source tool's United States database setting before forecasting US traffic.
