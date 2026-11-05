
window.SnapTextTransfer = (() => {
 const NAME='snaptext-studio-transfer';
 const open=()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open(NAME,1);
   request.onupgradeneeded=()=>{ if(!request.result.objectStoreNames.contains('files')) request.result.createObjectStore('files'); };
   request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
 });
 async function run(mode, operation){ const db=await open(); return new Promise((resolve,reject)=>{
   const tx=db.transaction('files',mode), store=tx.objectStore('files');
   const req=operation(store); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
   tx.oncomplete=()=>db.close(); tx.onerror=()=>reject(tx.error);
 }); }
 return {save: async blob=>run('readwrite', s=>s.put(blob,'crop')),
         take: async ()=>{const blob=await run('readonly',s=>s.get('crop'));if(blob)await run('readwrite',s=>s.delete('crop'));return blob;}};
})();


  /* ============ THEME TOGGLE ============ */
  (function(){
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    const saved = localStorage.getItem('st-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    function updateIcon(theme){
      icon.innerHTML = theme === 'dark'
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
        : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>';
    }
    updateIcon(document.documentElement.getAttribute('data-theme') || 'light');
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', current);
      localStorage.setItem('st-theme', current);
      updateIcon(current);
    });
  })();

  
/* Static HTML navigation: unique crawlable routes, no hash-only screens. */
function navigateTo(route) {
  const href = (window.SNAPTEXT_ROUTES || {})[route] || window.SNAPTEXT_HOME || '/';
  window.location.assign(href);
}
/* ============ CATEGORY NAV (HOME) ============ */
  (function(){
    const buttons = document.querySelectorAll('.category-nav button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.target);
        if (target) {
          const y = target.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
  })();

  /* ============ MAIN WORKSPACE LOGIC ============ */
  document.addEventListener('DOMContentLoaded', function () {
    (() => {
      const $ = (id) => document.getElementById(id);
      if (!$('imageInput')) return; // OCR only on homepage and its dedicated page.
      const els = {
        imageInput: $('imageInput'), dropzone: $('dropzone'), browseBtn: $('browseBtn'), pasteBtn: $('pasteBtn'), captureBtn: $('captureBtn'),
        previewWrap: $('previewWrap'), imagePreview: $('imagePreview'), fileName: $('fileName'), fileMeta: $('fileMeta'), removeImageBtn: $('removeImageBtn'),
        languageSelect: $('languageSelect'), enhanceToggle: $('enhanceToggle'), ocrBtn: $('ocrBtn'), ocrBtnText: $('ocrBtnText'),
        progressWrap: $('progressWrap'), progressLabel: $('progressLabel'), progressPercent: $('progressPercent'), progressFill: $('progressFill'),
        textOutput: $('textOutput'), emptyHint: $('emptyHint'), editorStatus: $('editorStatus'), wordCount: $('wordCount'), charCount: $('charCount'),
        confidenceLabel: $('confidenceLabel'), cleanTextBtn: $('cleanTextBtn'), copyBtn: $('copyBtn'), downloadTxtBtn: $('downloadTxtBtn'), clearTextBtn: $('clearTextBtn'), pdfBtn: $('pdfBtn'),
        resetBtn: $('resetBtn'), toast: $('toast')
      };

      let currentFile = null;
      let currentImageUrl = null;
      let worker = null;
      let workerLanguage = '';
      let busy = false;
      let toastTimer = null;

      function showToast(message) {
        els.toast.textContent = message;
        els.toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
      }
      window.showToast = showToast;

      function formatBytes(bytes) {
        if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }

      function updateCounts() {
        const value = els.textOutput.value;
        const trimmed = value.trim();
        const words = trimmed ? trimmed.split(/\s+/u).length : 0;
        els.wordCount.textContent = words.toLocaleString();
        els.charCount.textContent = value.length.toLocaleString();
        const hasText = trimmed.length > 0;
        els.emptyHint.classList.toggle('hidden', hasText);
        els.cleanTextBtn.disabled = !hasText;
        els.copyBtn.disabled = !hasText;
        els.downloadTxtBtn.disabled = !hasText;
        els.clearTextBtn.disabled = !hasText;
        els.pdfBtn.disabled = !hasText;
      }

      function setEditorStatus(message, success = false) {
        els.editorStatus.innerHTML = '<span class="status-dot"></span>' + message;
        els.editorStatus.classList.toggle('success', success);
      }

      function setProgress(percent, label) {
        const safe = Math.max(0, Math.min(100, Math.round(percent || 0)));
        els.progressWrap.classList.remove('hidden');
        els.progressFill.style.width = `${safe}%`;
        els.progressPercent.textContent = `${safe}%`;
        if (label) els.progressLabel.textContent = label;
      }

      function resetProgress() {
        els.progressWrap.classList.add('hidden');
        els.progressFill.style.width = '0%';
        els.progressPercent.textContent = '0%';
      }

      function setBusy(value) {
        busy = value;
        els.ocrBtn.disabled = value || !currentFile;
        els.ocrBtnText.textContent = value ? 'Extracting text…' : 'Extract text from image';
        els.browseBtn.disabled = value;
        els.pasteBtn.disabled = value;
        els.captureBtn.disabled = value;
      }

      function setImage(file) {
        if (!file || !file.type.startsWith('image/')) {
          showToast('Please choose a valid image file.');
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          showToast('That image is over 20 MB. Please choose a smaller one.');
          return;
        }
        currentFile = file;
        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = URL.createObjectURL(file);
        els.imagePreview.src = currentImageUrl;
        els.fileName.textContent = file.name || 'Pasted screenshot';
        els.fileMeta.textContent = `${formatBytes(file.size)} · ${file.type.replace('image/', '').toUpperCase()}`;
        els.previewWrap.classList.remove('hidden');
        els.dropzone.classList.add('has-image');
        els.ocrBtn.disabled = busy;
        setEditorStatus('Image ready to scan');
        els.confidenceLabel.textContent = 'Not scanned yet';
        showToast('Image added. Choose a language and extract the text.');
      }

      function removeImage() {
        currentFile = null;
        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = null;
        els.imagePreview.removeAttribute('src');
        els.previewWrap.classList.add('hidden');
        els.imageInput.value = '';
        els.ocrBtn.disabled = true;
        setEditorStatus('Waiting for an image');
      }

      function loadImageFile(file) {
        if (!file) return;
        setImage(file);
      }

      async function preprocess(file) {
        if (!els.enhanceToggle.checked) return file;
        const bitmap = await createImageBitmap(file);
        const maxSide = 2600;
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;
        const contrast = 1.12;
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          const adjusted = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
          pixels[i] = adjusted;
          pixels[i + 1] = adjusted;
          pixels[i + 2] = adjusted;
        }
        ctx.putImageData(frame, 0, 0);
        return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not prepare this image.')), 'image/png'));
      }

      async function getWorker(language) {
        if (!window.Tesseract) throw new Error('The OCR engine could not load. Check your internet connection and refresh the page.');
        if (worker && workerLanguage === language) return worker;
        if (worker) {
          await worker.terminate();
          worker = null;
          workerLanguage = '';
        }
        setProgress(2, 'Loading OCR engine…');
        worker = await window.Tesseract.createWorker(language, 1, {
          logger: (message) => {
            if (message.status === 'loading tesseract core') setProgress(5, 'Loading text engine…');
            else if (message.status === 'initializing tesseract') setProgress(10, 'Preparing text engine…');
            else if (message.status === 'loading language traineddata') setProgress(18, 'Loading language data…');
            else if (message.status === 'initializing api') setProgress(30, 'Almost ready…');
            else if (message.status === 'recognizing text') setProgress(35 + (message.progress || 0) * 62, 'Reading your image…');
          }
        });
        workerLanguage = language;
        return worker;
      }

      async function extractText() {
        if (!currentFile || busy) return;
        if (!window.Tesseract) {
          showToast('OCR engine is still loading. Please try again in a moment.');
          return;
        }
        setBusy(true);
        els.confidenceLabel.textContent = 'Scanning…';
        setEditorStatus('Reading image…');
        try {
          const language = els.languageSelect.value;
          const imageForOcr = await preprocess(currentFile);
          const ocrWorker = await getWorker(language);
          const result = await ocrWorker.recognize(imageForOcr);
          const text = (result.data.text || '').trim();
          els.textOutput.value = text;
          updateCounts();
          const confidence = Math.round(result.data.confidence || 0);
          els.confidenceLabel.textContent = `OCR confidence: ${confidence}%`;
          setEditorStatus(text ? 'Text extracted successfully' : 'No readable text found', Boolean(text));
          setProgress(100, text ? 'Extraction complete' : 'Scan complete');
          if (text) showToast('Text extracted. You can edit it on the right.');
          else showToast('No readable text found. Try a clearer image or another language.');
        } catch (error) {
          console.error(error);
          setEditorStatus('Could not complete the scan');
          els.confidenceLabel.textContent = 'Scan failed';
          showToast(error.message || 'Something went wrong while reading the image.');
        } finally {
          setBusy(false);
          setTimeout(resetProgress, 1800);
        }
      }

      function cleanText() {
        const cleaned = els.textOutput.value
          .replace(/\r\n?/g, '\n')
          .replace(/[\t ]+/g, ' ')
          .split('\n').map(line => line.trim()).join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        els.textOutput.value = cleaned;
        updateCounts();
        showToast('Text spacing cleaned up.');
      }

      async function copyText() {
        const text = els.textOutput.value;
        if (!text.trim()) return;
        try {
          await navigator.clipboard.writeText(text);
          showToast('Text copied to clipboard.');
        } catch {
          els.textOutput.focus();
          els.textOutput.select();
          const ok = document.execCommand('copy');
          showToast(ok ? 'Text copied to clipboard.' : 'Select the text and copy it manually.');
        }
      }

      function downloadText() {
        const text = els.textOutput.value;
        if (!text.trim()) return;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'snaptext-extracted-text.txt';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        showToast('TXT file downloaded.');
      }

      function exportPdf() {
        const text = els.textOutput.value;
        if (!text.trim()) return;
        const directionChoice = /[\u0600-\u06FF\u0750-\u077F]/u.test(text) ? 'rtl' : 'ltr';
        const escaped = text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showToast('Please allow pop-ups to export your PDF.');
          return;
        }
        printWindow.document.open();
        printWindow.document.write(`<!doctype html><html lang="en" dir="${directionChoice}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SnapText Document</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:34px 42px;color:#202338;font:11pt/1.75 'DM Sans','Noto Naskh Arabic','Noto Nastaliq Urdu',Arial,sans-serif;direction:${directionChoice};}main{max-width:760px;margin:0 auto}header{border-bottom:1px solid #e7e8ef;padding-bottom:14px;margin-bottom:25px;color:#777c90;font-size:9pt;letter-spacing:.08em;text-transform:uppercase}.content{white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext;direction:${directionChoice};font-family:'DM Sans','Noto Naskh Arabic','Noto Nastaliq Urdu',Arial,sans-serif}@page{size:auto;margin:18mm}@media print{body{padding:0}header{break-after:avoid}}</style></head><body><main><header>SnapText Studio · Extracted document</header><article class="content">${escaped}</article></main><script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),350)});window.addEventListener('afterprint',()=>window.close());<\/script></body></html>`);
        printWindow.document.close();
      }

      async function pasteImage() {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              setImage(new File([blob], 'pasted-screenshot.png', { type: imageType }));
              return;
            }
          }
          showToast('No image found in clipboard. Copy a screenshot first.');
        } catch {
          showToast('Use Ctrl + V to paste a copied screenshot into this page.');
        }
      }

      async function captureScreen() {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          showToast('Screen capture is not available in this browser. Try uploading a screenshot.');
          return;
        }
        let stream;
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
          const video = document.createElement('video');
          video.srcObject = stream;
          video.muted = true;
          await video.play();
          await new Promise(resolve => requestAnimationFrame(resolve));
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          stream.getTracks().forEach(track => track.stop());
          if (blob) setImage(new File([blob], 'captured-screen.png', { type: 'image/png' }));
        } catch (error) {
          if (stream) stream.getTracks().forEach(track => track.stop());
          if (error.name !== 'NotAllowedError') showToast('Could not capture the screen. Please try again.');
        }
      }

      function resetAll() {
        if (busy) return;
        try { localStorage.removeItem('snaptext-editor-draft'); } catch (_) {}
        removeImage();
        els.textOutput.value = '';
        updateCounts();
        els.confidenceLabel.textContent = 'No scan yet';
        setEditorStatus('Waiting for an image');
        resetProgress();
        showToast('Workspace cleared. Start with a new image.');
      }

      els.browseBtn.addEventListener('click', (event) => { event.stopPropagation(); els.imageInput.click(); });
      els.dropzone.addEventListener('click', () => els.imageInput.click());
      els.dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); els.imageInput.click(); } });
      els.imageInput.addEventListener('change', (event) => loadImageFile(event.target.files?.[0]));
      els.dropzone.addEventListener('dragover', (event) => { event.preventDefault(); els.dropzone.classList.add('dragover'); });
      els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('dragover'));
      els.dropzone.addEventListener('drop', (event) => { event.preventDefault(); els.dropzone.classList.remove('dragover'); loadImageFile(event.dataTransfer.files?.[0]); });
      document.addEventListener('paste', (event) => {
        const imageItem = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) { setImage(new File([file], 'pasted-screenshot.png', { type: file.type })); event.preventDefault(); }
        }
      });
      els.pasteBtn.addEventListener('click', pasteImage);
      els.captureBtn.addEventListener('click', captureScreen);
      els.removeImageBtn.addEventListener('click', removeImage);
      els.ocrBtn.addEventListener('click', extractText);
      els.textOutput.addEventListener('input', () => { updateCounts(); try { localStorage.setItem('snaptext-editor-draft', els.textOutput.value); setEditorStatus('Saved locally',true); } catch (_) { setEditorStatus('Local save unavailable'); }});
      els.cleanTextBtn.addEventListener('click', cleanText);
      els.copyBtn.addEventListener('click', copyText);
      els.downloadTxtBtn.addEventListener('click', downloadText);
      els.clearTextBtn.addEventListener('click', () => { els.textOutput.value = ''; try { localStorage.removeItem('snaptext-editor-draft'); } catch (_) {} updateCounts(); els.confidenceLabel.textContent = 'Text cleared'; setEditorStatus('Text cleared'); });
      els.pdfBtn.addEventListener('click', exportPdf);
      els.resetBtn.addEventListener('click', resetAll);
      document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          if (currentFile && !busy) extractText();
        }
      });

      try { const draft = localStorage.getItem('snaptext-editor-draft'); if (draft) els.textOutput.value = draft; } catch (_) {}
      window.SnapTextTransfer.take().then(blob => { if (blob) setImage(new File([blob], 'cropped-document.png', { type:'image/png' })); }).catch(console.warn);
      updateCounts();
    })();

    /* ============ TOOLS LOGIC ============ */
    (() => {
      'use strict';
      const $ = (id) => document.getElementById(id);
      const state = { cropper: null, cropObjectUrl: null, bgImage: null, bgSample: null, qrReady: false };

      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      function setStatus(id, message, kind = '') {
        const node = $(id);
        if (!node) return;
        node.textContent = message;
        node.classList.remove('error', 'success');
        if (kind) node.classList.add(kind);
      }

      function setBusy(buttonId, busy, label) {
        const button = $(buttonId);
        if (!button) return;
        if (busy) {
          button.dataset.originalLabel = button.innerHTML;
          button.disabled = true;
          button.textContent = label || 'Working…';
        } else {
          button.disabled = false;
          button.innerHTML = button.dataset.originalLabel || button.textContent;
          delete button.dataset.originalLabel;
        }
      }

      function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }

      function safeBaseName(filename) {
        return (filename || 'document').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'document';
      }

      function requireLibrary(name, value) {
        if (!value) throw new Error(`${name} did not load. Refresh the page and try again.`);
        return value;
      }

      async function loadPdfJs(file) {
        const pdfjs = requireLibrary('PDF reader', window.pdfjsLib);
        return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      }

      async function loadPdfLib(file) {
        const lib = requireLibrary('PDF tools', window.PDFLib);
        return lib.PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
      }

      async function canvasBlob(canvas, type = 'image/png', quality) {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the image file.')), type, quality);
        });
      }

      function addFileChange(inputId, buttonId, statusId, minFiles = 1) {
        const input = $(inputId);
        const button = $(buttonId);
        if (!input || !button) return;
        input.addEventListener('change', () => {
          const count = input.files?.length || 0;
          button.disabled = count < minFiles;
          if (count) setStatus(statusId, `${count} file${count === 1 ? '' : 's'} selected. Ready to process.`);
        });
      }

      // PDF to editable Word
      addFileChange('pdfWordInput', 'pdfWordBtn', 'pdfWordStatus');
      $('pdfWordBtn')?.addEventListener('click', async () => {
        const file = $('pdfWordInput').files?.[0];
        if (!file) return;
        try {
          setBusy('pdfWordBtn', true, 'Extracting PDF text…');
          setStatus('pdfWordStatus', 'Reading PDF pages…');
          const pdf = await loadPdfJs(file);
          const docxLib = requireLibrary('Word exporter', window.docx);
          const paragraphs = [];
          let foundText = false;
          let ocrWorker = null;
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            setStatus('pdfWordStatus', `Extracting page ${pageNumber} of ${pdf.numPages}…`);
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const items = content.items.filter(item => item.str && item.str.trim());
            const positioned = items.map(item => ({
              text: item.str.trim(),
              x: item.transform?.[4] || 0,
              y: item.transform?.[5] || 0
            })).sort((a, b) => Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x);
            const lines = [];
            let current = '';
            let currentY = null;
            for (const item of positioned) {
              if (currentY !== null && Math.abs(item.y - currentY) > 3) {
                if (current.trim()) lines.push(current.trim());
                current = '';
              }
              current += `${current ? ' ' : ''}${item.text}`;
              currentY = item.y;
            }
            if (current.trim()) lines.push(current.trim());
            if (!lines.length) {
              if (!ocrWorker) {
                const tesseract = requireLibrary('OCR engine', window.Tesseract);
                ocrWorker = await tesseract.createWorker($('pdfWordLanguage').value, 1);
              }
              setStatus('pdfWordStatus', `Running OCR on scanned page ${pageNumber} of ${pdf.numPages}…`);
              const viewport = page.getViewport({ scale: 1.6 });
              const canvas = document.createElement('canvas');
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              const ocrResult = await ocrWorker.recognize(canvas);
              const recognized = (ocrResult.data.text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
              lines.push(...recognized);
            }
            if (lines.length) foundText = true;
            if (pageNumber > 1) paragraphs.push(new docxLib.Paragraph({ text: `— Page ${pageNumber} —`, heading: docxLib.HeadingLevel.HEADING_2, pageBreakBefore: true }));
            for (const line of lines) paragraphs.push(new docxLib.Paragraph({ children: [new docxLib.TextRun({ text: line })] }));
          }
          if (ocrWorker) await ocrWorker.terminate();
          if (!foundText) throw new Error('No readable text was found in this PDF. Try a clearer scan or another OCR language.');
          const document = new docxLib.Document({ sections: [{ properties: {}, children: paragraphs }] });
          const blob = await docxLib.Packer.toBlob(document);
          downloadBlob(blob, `${safeBaseName(file.name)}-converted.docx`);
          setStatus('pdfWordStatus', 'Word document downloaded. Review formatting before use.', 'success');
        } catch (error) {
          console.error(error);
          setStatus('pdfWordStatus', error.message || 'Could not convert this PDF.', 'error');
        } finally {
          setBusy('pdfWordBtn', false);
        }
      });

      // PDF to images
      addFileChange('pdfImagesInput', 'pdfImagesBtn', 'pdfImagesStatus');
      $('pdfImagesBtn')?.addEventListener('click', async () => {
        const file = $('pdfImagesInput').files?.[0];
        if (!file) return;
        try {
          setBusy('pdfImagesBtn', true, 'Rendering pages…');
          const pdf = await loadPdfJs(file);
          const zip = new (requireLibrary('ZIP exporter', window.JSZip))();
          for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
            setStatus('pdfImagesStatus', `Rendering page ${pageNo} of ${pdf.numPages}…`);
            const page = await pdf.getPage(pageNo);
            const viewport = page.getViewport({ scale: 1.7 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            zip.file(`page-${String(pageNo).padStart(3, '0')}.png`, await canvasBlob(canvas));
          }
          const blob = await zip.generateAsync({ type: 'blob' });
          downloadBlob(blob, `${safeBaseName(file.name)}-pages.zip`);
          setStatus('pdfImagesStatus', `${pdf.numPages} PNG page${pdf.numPages === 1 ? '' : 's'} exported.`, 'success');
        } catch (error) {
          console.error(error);
          setStatus('pdfImagesStatus', error.message || 'Could not render this PDF.', 'error');
        } finally {
          setBusy('pdfImagesBtn', false);
        }
      });

      // Images to PDF
      addFileChange('imagesPdfInput', 'imagesPdfBtn', 'imagesPdfStatus');
      $('imagesPdfBtn')?.addEventListener('click', async () => {
        const files = [...($('imagesPdfInput').files || [])];
        if (!files.length) return;
        try {
          setBusy('imagesPdfBtn', true, 'Building PDF…');
          const { PDFDocument } = requireLibrary('PDF tools', window.PDFLib);
          const pdf = await PDFDocument.create();
          for (let index = 0; index < files.length; index++) {
            const file = files[index];
            setStatus('imagesPdfStatus', `Adding image ${index + 1} of ${files.length}…`);
            let image;
            const bytes = await file.arrayBuffer();
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') image = await pdf.embedJpg(bytes);
            else if (file.type === 'image/png') image = await pdf.embedPng(bytes);
            else {
              const bitmap = await createImageBitmap(file);
              const canvas = document.createElement('canvas');
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              canvas.getContext('2d').drawImage(bitmap, 0, 0);
              bitmap.close?.();
              const convertedBlob = await canvasBlob(canvas);
              image = await pdf.embedPng(await convertedBlob.arrayBuffer());
            }
            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 22;
            const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
            const width = image.width * scale;
            const height = image.height * scale;
            const page = pdf.addPage([pageWidth, pageHeight]);
            page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
          }
          const bytes = await pdf.save();
          downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'snaptext-images-to-pdf.pdf');
          setStatus('imagesPdfStatus', `${files.length} image${files.length === 1 ? '' : 's'} combined into a PDF.`, 'success');
        } catch (error) {
          console.error(error);
          setStatus('imagesPdfStatus', error.message || 'Could not create a PDF from these images.', 'error');
        } finally {
          setBusy('imagesPdfBtn', false);
        }
      });

      // Merge PDFs
      addFileChange('mergePdfInput', 'mergePdfBtn', 'mergePdfStatus', 2);
      $('mergePdfBtn')?.addEventListener('click', async () => {
        const files = [...($('mergePdfInput').files || [])];
        if (files.length < 2) return;
        try {
          setBusy('mergePdfBtn', true, 'Merging PDFs…');
          const { PDFDocument } = requireLibrary('PDF tools', window.PDFLib);
          const merged = await PDFDocument.create();
          for (let index = 0; index < files.length; index++) {
            setStatus('mergePdfStatus', `Adding ${files[index].name} (${index + 1}/${files.length})…`);
            const source = await loadPdfLib(files[index]);
            const copied = await merged.copyPages(source, source.getPageIndices());
            copied.forEach(page => merged.addPage(page));
          }
          const bytes = await merged.save();
          downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'snaptext-merged.pdf');
          setStatus('mergePdfStatus', `Merged ${files.length} PDFs successfully.`, 'success');
        } catch (error) {
          console.error(error);
          setStatus('mergePdfStatus', error.message || 'Could not merge these PDFs. Password-protected files may not work.', 'error');
        } finally {
          setBusy('mergePdfBtn', false);
        }
      });

      // Split PDF
      addFileChange('splitPdfInput', 'splitPdfBtn', 'splitPdfStatus');
      function parsePageSelection(raw, pageCount) {
        if (!raw.trim()) return Array.from({ length: pageCount }, (_, index) => index);
        const selected = new Set();
        for (const part of raw.split(',')) {
          const value = part.trim();
          if (!value) continue;
          const match = value.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
          if (!match) throw new Error(`Invalid page range: "${value}". Use a format like 1, 3-5.`);
          const start = Number(match[1]);
          const end = Number(match[2] || match[1]);
          if (start < 1 || end < start || end > pageCount) throw new Error(`Page range ${value} is outside this PDF (1–${pageCount}).`);
          for (let page = start; page <= end; page++) selected.add(page - 1);
        }
        if (!selected.size) throw new Error('Enter at least one valid page number.');
        return [...selected].sort((a, b) => a - b);
      }
      $('splitPdfBtn')?.addEventListener('click', async () => {
        const file = $('splitPdfInput').files?.[0];
        if (!file) return;
        try {
          setBusy('splitPdfBtn', true, 'Extracting pages…');
          const source = await loadPdfLib(file);
          const indices = parsePageSelection($('splitPagesInput').value, source.getPageCount());
          const output = await window.PDFLib.PDFDocument.create();
          const pages = await output.copyPages(source, indices);
          pages.forEach(page => output.addPage(page));
          const bytes = await output.save();
          downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${safeBaseName(file.name)}-selected-pages.pdf`);
          setStatus('splitPdfStatus', `Exported ${indices.length} page${indices.length === 1 ? '' : 's'}.`, 'success');
        } catch (error) {
          console.error(error);
          setStatus('splitPdfStatus', error.message || 'Could not split this PDF.', 'error');
        } finally {
          setBusy('splitPdfBtn', false);
        }
      });

      // Compress PDF
      addFileChange('compressPdfInput', 'compressPdfBtn', 'compressPdfStatus');
      $('compressQuality')?.addEventListener('input', () => { $('compressQualityValue').textContent = `${$('compressQuality').value}%`; });
      $('compressPdfBtn')?.addEventListener('click', async () => {
        const file = $('compressPdfInput').files?.[0];
        if (!file) return;
        try {
          setBusy('compressPdfBtn', true, 'Optimizing pages…');
          const pdf = await loadPdfJs(file);
          const { PDFDocument } = requireLibrary('PDF tools', window.PDFLib);
          const output = await PDFDocument.create();
          const quality = Number($('compressQuality').value) / 100;
          for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
            setStatus('compressPdfStatus', `Optimizing page ${pageNo} of ${pdf.numPages}…`);
            const page = await pdf.getPage(pageNo);
            const baseViewport = page.getViewport({ scale: 1 });
            const renderViewport = page.getViewport({ scale: 1.35 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(renderViewport.width);
            canvas.height = Math.ceil(renderViewport.height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: renderViewport, background: '#ffffff' }).promise;
            const jpeg = await canvasBlob(canvas, 'image/jpeg', quality);
            const image = await output.embedJpg(await jpeg.arrayBuffer());
            const outPage = output.addPage([baseViewport.width, baseViewport.height]);
            outPage.drawImage(image, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
          }
          const bytes = await output.save({ useObjectStreams: true });
          const blob = new Blob([bytes], { type: 'application/pdf' });
          downloadBlob(blob, `${safeBaseName(file.name)}-compressed.pdf`);
          const difference = Math.round((1 - blob.size / file.size) * 100);
          setStatus('compressPdfStatus', difference > 0 ? `New file is about ${difference}% smaller. Text is now image-based.` : `Export complete. The file grew by about ${Math.abs(difference)}%; this PDF may not compress well as images.`, difference > 0 ? 'success' : '');
        } catch (error) {
          console.error(error);
          setStatus('compressPdfStatus', error.message || 'Could not compress this PDF.', 'error');
        } finally {
          setBusy('compressPdfBtn', false);
        }
      });

      // Image format conversion
      addFileChange('imageConvertInput', 'imageConvertBtn', 'imageConvertStatus');
      $('imageConvertBtn')?.addEventListener('click', async () => {
        const files = [...($('imageConvertInput').files || [])];
        if (!files.length) return;
        try {
          setBusy('imageConvertBtn', true, 'Converting images…');
          const mime = $('imageFormatSelect').value;
          const extension = mime === 'image/png' ? 'png' : 'jpg';
          const zip = files.length > 1 ? new (requireLibrary('ZIP exporter', window.JSZip))() : null;
          let singleBlob = null;
          for (let index = 0; index < files.length; index++) {
            setStatus('imageConvertStatus', `Converting ${index + 1} of ${files.length}…`);
            const bitmap = await createImageBitmap(files[index]);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (mime === 'image/jpeg') {
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(bitmap, 0, 0);
            bitmap.close?.();
            const blob = await canvasBlob(canvas, mime, 0.92);
            const name = `${safeBaseName(files[index].name)}.${extension}`;
            if (zip) zip.file(name, blob); else singleBlob = { blob, name };
          }
          if (zip) downloadBlob(await zip.generateAsync({ type: 'blob' }), 'snaptext-converted-images.zip');
          else downloadBlob(singleBlob.blob, singleBlob.name);
          setStatus('imageConvertStatus', `${files.length} image${files.length === 1 ? '' : 's'} converted to ${extension.toUpperCase()}.`, 'success');
        } catch (error) {
          console.error(error);
          setStatus('imageConvertStatus', error.message || 'Could not convert these images.', 'error');
        } finally {
          setBusy('imageConvertBtn', false);
        }
      });

      // Background remover
      const bgInput = $('bgRemoveInput');
      bgInput?.addEventListener('change', async () => {
        const file = bgInput.files?.[0];
        if (!file) return;
        try {
          const bitmap = await createImageBitmap(file);
          const maxSide = 1100;
          const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
          const canvas = $('bgCanvas');
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          canvas.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          state.bgImage = { name: file.name, width: bitmap.width, height: bitmap.height };
          bitmap.close?.();
          state.bgSample = null;
          $('bgSampleDot').style.background = '#fff';
          $('bgSampleText').textContent = 'Click the background to sample its colour.';
          $('bgPreviewWrap').classList.remove('hidden');
          $('bgRemoveBtn').disabled = false;
          setStatus('bgRemoveStatus', 'Click a background area in the preview to sample its colour.');
        } catch (error) {
          setStatus('bgRemoveStatus', error.message || 'Could not open this image.', 'error');
        }
      });
      $('bgCanvas')?.addEventListener('click', (event) => {
        const canvas = $('bgCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width)));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)));
        const pixel = canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, 1, 1).data;
        state.bgSample = [pixel[0], pixel[1], pixel[2]];
        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        $('bgSampleDot').style.background = color;
        $('bgSampleText').textContent = `Sampled ${color}. Adjust tolerance if needed.`;
      });
      $('bgTolerance')?.addEventListener('input', () => { $('bgToleranceValue').textContent = $('bgTolerance').value; });
      $('bgRemoveBtn')?.addEventListener('click', async () => {
        if (!state.bgImage) return;
        if (!state.bgSample) { setStatus('bgRemoveStatus', 'Click the background in the preview first.', 'error'); return; }
        try {
          setBusy('bgRemoveBtn', true, 'Removing background…');
          const canvas = $('bgCanvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = frame.data;
          const [r, g, b] = state.bgSample;
          const tolerance = Number($('bgTolerance').value) * 2.2;
          const feather = 22;
          for (let i = 0; i < pixels.length; i += 4) {
            const dr = pixels[i] - r;
            const dg = pixels[i + 1] - g;
            const db = pixels[i + 2] - b;
            const distance = Math.sqrt(dr * dr + dg * dg + db * db);
            const alpha = Math.max(0, Math.min(255, ((distance - tolerance) / feather) * 255));
            pixels[i + 3] = Math.round(pixels[i + 3] * alpha / 255);
          }
          ctx.putImageData(frame, 0, 0);
          const blob = await canvasBlob(canvas, 'image/png');
          downloadBlob(blob, `${safeBaseName(state.bgImage.name)}-transparent.png`);
          setStatus('bgRemoveStatus', 'Transparent PNG downloaded. Increase tolerance for more background removal.', 'success');
        } catch (error) {
          console.error(error);
          setStatus('bgRemoveStatus', error.message || 'Could not remove this background.', 'error');
        } finally {
          setBusy('bgRemoveBtn', false);
        }
      });

      // Batch OCR
      addFileChange('batchOcrInput', 'batchOcrBtn', 'batchOcrStatus');
      $('batchOcrBtn')?.addEventListener('click', async () => {
        const files = [...($('batchOcrInput').files || [])];
        if (!files.length) return;
        let worker;
        try {
          setBusy('batchOcrBtn', true, 'Preparing OCR…');
          const tesseract = requireLibrary('OCR engine', window.Tesseract);
          const language = $('batchOcrLanguage').value;
          worker = await tesseract.createWorker(language, 1, { logger: (message) => {
            if (message.status === 'recognizing text') setStatus('batchOcrStatus', `Reading image… ${Math.round((message.progress || 0) * 100)}%`);
          }});
          const output = [];
          for (let index = 0; index < files.length; index++) {
            setStatus('batchOcrStatus', `Scanning ${index + 1} of ${files.length}: ${files[index].name}`);
            const result = await worker.recognize(files[index]);
            output.push(`===== ${files[index].name} =====\n${(result.data.text || '').trim()}`);
            $('batchOcrResult').value = output.join('\n\n');
          }
          $('batchOcrDownload').disabled = !output.some(part => part.trim());
          setStatus('batchOcrStatus', `Finished scanning ${files.length} image${files.length === 1 ? '' : 's'}. Proofread the results.`, 'success');
        } catch (error) {
          console.error(error);
          setStatus('batchOcrStatus', error.message || 'Batch OCR could not finish.', 'error');
        } finally {
          if (worker) await worker.terminate().catch(() => {});
          setBusy('batchOcrBtn', false);
        }
      });
      $('batchOcrDownload')?.addEventListener('click', () => {
        const text = $('batchOcrResult').value;
        if (text.trim()) downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'snaptext-batch-ocr.txt');
      });

      // Crop
      $('cropInput')?.addEventListener('change', () => {
        const file = $('cropInput').files?.[0];
        if (!file) return;
        if (state.cropper) { state.cropper.destroy(); state.cropper = null; }
        if (state.cropObjectUrl) URL.revokeObjectURL(state.cropObjectUrl);
        state.cropObjectUrl = URL.createObjectURL(file);
        const image = $('cropPreview');
        image.onload = () => {
          $('cropPreviewWrap').classList.remove('hidden');
          if (!window.Cropper) {
            setStatus('cropStatus', 'Crop tool did not load. Refresh the page and try again.', 'error');
            return;
          }
          state.cropper = new window.Cropper(image, {
            viewMode: 1, dragMode: 'crop', autoCropArea: 0.9,
            responsive: true, background: false, movable: true,
            zoomable: true, scalable: false, rotatable: true,
            guides: true, center: true
          });
          $('cropToOcrBtn').disabled = false;
          setStatus('cropStatus', 'Adjust the crop frame, then send it to the OCR workspace.');
        };
        image.src = state.cropObjectUrl;
      });
      $('cropToOcrBtn')?.addEventListener('click', async () => {
        if (!state.cropper) return;
        try {
          setBusy('cropToOcrBtn', true, 'Preparing crop…');
          const canvas = state.cropper.getCroppedCanvas({ maxWidth: 3200, maxHeight: 3200, imageSmoothingQuality: 'high' });
          const blob = await canvasBlob(canvas, 'image/png');
          await window.SnapTextTransfer.save(blob);
          navigateTo('home');
        } catch (error) {
          console.error(error);
          setStatus('cropStatus', error.message || 'Could not crop this image.', 'error');
        } finally {
          setBusy('cropToOcrBtn', false);
        }
      });

      // QR code
      $('qrGenerateBtn')?.addEventListener('click', () => {
        const text = $('qrText').value.trim();
        if (!text) { setStatus('qrStatus', 'Enter a URL or some text first.', 'error'); return; }
        if (!window.QRCode) { setStatus('qrStatus', 'QR generator did not load. Refresh the page and try again.', 'error'); return; }
        const size = Number($('qrSize').value);
        const target = $('qrCanvas');
        target.innerHTML = '';
        try {
          new window.QRCode(target, { text, width: size, height: size, colorDark: '#14172b', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
          $('qrOutput').classList.remove('hidden');
          $('qrDownloadBtn').disabled = false;
          state.qrReady = true;
          setStatus('qrStatus', 'QR code generated. Scan it with a phone to test it.', 'success');
        } catch (error) {
          setStatus('qrStatus', error.message || 'Could not generate this QR code.', 'error');
        }
      });
      $('qrDownloadBtn')?.addEventListener('click', () => {
        if (!state.qrReady) return;
        const target = $('qrCanvas');
        const canvas = target.querySelector('canvas');
        const image = target.querySelector('img');
        if (canvas) canvas.toBlob(blob => blob && downloadBlob(blob, 'snaptext-qr-code.png'));
        else if (image?.src) {
          const link = document.createElement('a');
          link.href = image.src;
          link.download = 'snaptext-qr-code.png';
          link.click();
        }
      });
    })();
  });
  

document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-drop-input]').forEach(zone=>{
   const input=document.getElementById(zone.dataset.dropInput), list=document.querySelector(`[data-file-list="${zone.dataset.dropInput}"]`);
   if(!input)return;
   const redraw=()=>{
     if(!list)return;
     const files=Array.from(input.files||[]); list.innerHTML='';
     files.forEach((file,i)=>{
       const row=document.createElement('li');row.className='file-row';
       const type=document.createElement('span');type.className='file-chip';type.textContent=file.type.includes('pdf')?'PDF':'IMG';
       const name=document.createElement('span');name.className='file-name';name.textContent=file.name;name.title=file.name;
       const size=document.createElement('span');size.className='file-size';size.textContent=(file.size/1024/1024).toFixed(2)+' MB';
       row.append(type,name,size);
       if(input.multiple&&files.length>1){
         for(const [direction,symbol] of [[-1,'↑'],[1,'↓']]){
           const btn=document.createElement('button');btn.type='button';btn.textContent=symbol;btn.title=direction===-1?'Move earlier':'Move later';
           btn.setAttribute('aria-label',`${direction===-1?'Move earlier':'Move later'}: ${file.name}`);
           btn.disabled=(i===0&&direction===-1)||(i===files.length-1&&direction===1);
           btn.addEventListener('click',()=>{
             const newFiles=Array.from(input.files);[newFiles[i],newFiles[i+direction]]=[newFiles[i+direction],newFiles[i]];
             const dt=new DataTransfer();newFiles.forEach(f=>dt.items.add(f));input.files=dt.files;
             input.dispatchEvent(new Event('change',{bubbles:true}));
           });row.appendChild(btn);
         }
       }
       list.append(row);
     });
   };
   input.addEventListener('change',redraw);
   zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover')});
   zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
   zone.addEventListener('drop',e=>{
     e.preventDefault();zone.classList.remove('dragover');const dt=new DataTransfer();
     Array.from(e.dataTransfer.files||[]).filter(f=>{
       if(input.accept.includes('pdf'))return f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf');
       return f.type.startsWith('image/');
     }).slice(0,input.multiple?100:1).forEach(f=>dt.items.add(f));
     if(dt.files.length){input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));}
   });
   zone.addEventListener('click',e=>{if(e.target.closest('label'))return;input.click()});
   zone.setAttribute('role','button');zone.setAttribute('tabindex','0');
   zone.setAttribute('aria-label','Drop files here or choose files');
   zone.addEventListener('keydown',e=>{if(e.target===zone&&(e.key==='Enter'||e.key===' ')){e.preventDefault();input.click()}});
 });
 document.querySelectorAll('.filter-bar button').forEach(button=>{
   button.addEventListener('click',()=>{
     document.querySelectorAll('.filter-bar button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
     document.querySelectorAll('.tool-tile').forEach(card=>{
       card.classList.toggle('u-hide',button.dataset.filter!=='All'&&card.dataset.group!==button.dataset.filter);
     });
   });
 });
});
