(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var config = window.WordToPDFConfig || {};

  function status(id, message, kind) {
    var node = $(id);
    if (!node) return;
    node.textContent = message;
    node.classList.remove('error', 'success');
    if (kind) node.classList.add(kind);
  }

  function busy(id, on, label) {
    var button = $(id);
    if (!button) return;
    if (on) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.textContent = label || 'Working…';
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  function requireLibrary(name, library) {
    if (!library) throw new Error(name + ' did not load. Refresh the page and try again.');
    return library;
  }

  function safeName(filename) {
    return (filename || 'document')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'document';
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1800);
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Could not create the output file.'));
      }, type || 'image/png', quality);
    });
  }

  function validateFile(file, types, maxBytes) {
    if (!file) throw new Error('Choose a file first.');
    var extension = (file.name.split('.').pop() || '').toLowerCase();
    if (types.indexOf(extension) === -1) throw new Error('This file type is not supported.');
    if (maxBytes && file.size > maxBytes) throw new Error('This file is too large for this browser tool.');
  }


  async function loadPdfJs(file) {
    var pdfjs = requireLibrary('PDF reader', window.pdfjsLib);
    if (config.pdfWorkerUrl) pdfjs.GlobalWorkerOptions.workerSrc = config.pdfWorkerUrl;
    return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  }

  async function loadPdfLib(file) {
    var lib = requireLibrary('PDF tools', window.PDFLib);
    return lib.PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  }

  function addFileChange(inputId, buttonId, statusId, minFiles) {
    var input = $(inputId);
    var button = $(buttonId);
    if (!input || !button) return;
    minFiles = minFiles || 1;
    input.addEventListener('change', function () {
      var count = input.files ? input.files.length : 0;
      button.disabled = count < minFiles;
      if (count) status(statusId, count + ' file' + (count === 1 ? '' : 's') + ' selected. Ready to process.');
      else status(statusId, 'Choose a file to begin.');
    });
  }

  // Small IndexedDB handoff lets the crop tool send an image to the OCR page without uploading it.
  var transfer = {
    open: function () {
      return new Promise(function (resolve, reject) {
        if (!window.indexedDB) return reject(new Error('This browser does not support the local crop handoff.'));
        var request = indexedDB.open('wordtopdf-transfer', 1);
        request.onupgradeneeded = function () {
          if (!request.result.objectStoreNames.contains('files')) request.result.createObjectStore('files');
        };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error); };
      });
    },
    save: async function (blob) {
      var db = await transfer.open();
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put(blob, 'crop');
        tx.oncomplete = function () { db.close(); resolve(true); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    },
    take: async function () {
      var db = await transfer.open();
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readwrite');
        var store = tx.objectStore('files');
        var request = store.get('crop');
        var result;
        request.onsuccess = function () { result = request.result || null; store.delete('crop'); };
        request.onerror = function () { db.close(); reject(request.error); };
        tx.oncomplete = function () { db.close(); resolve(result); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    }
  };
  window.WordToPDFTransfer = transfer;

  function initWordToPdf() {
    var input = $('wordPdfInput');
    var button = $('wordPdfBtn');
    if (!input || !button) return;

    var dropzone = $('wordPdfDropzone');
    var fileHint = $('wordPdfHint');

    function updateWordFileSelection() {
      var file = input.files && input.files[0];
      var isDocx = !!(file && /\.docx$/i.test(file.name));
      var isSmallEnough = !!(file && file.size <= 25 * 1024 * 1024);
      var valid = !!(file && isDocx && isSmallEnough);
      button.disabled = !valid;

      if (dropzone) dropzone.classList.toggle('has-file', !!file);
      if (fileHint) {
        fileHint.textContent = !file
          ? 'DOCX format only • Maximum file size: 25 MB'
          : (isDocx && isSmallEnough ? file.name + ' • Ready to convert' :
            (!isDocx ? 'Please choose a .DOCX file.' : 'This file is larger than 25 MB.'));
      }

      if (!file) {
        status('wordPdfStatus', 'Choose a DOCX file to get started.');
      } else if (!isDocx) {
        status('wordPdfStatus', 'This converter accepts DOCX files only.', 'error');
      } else if (!isSmallEnough) {
        status('wordPdfStatus', 'Your file is larger than the 25 MB limit.', 'error');
      } else {
        status('wordPdfStatus', file.name + ' selected. Ready to convert.');
      }
    }

    input.addEventListener('change', updateWordFileSelection);

    if (dropzone) {
      dropzone.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          input.click();
        }
      });

      ['dragenter', 'dragover'].forEach(function (eventName) {
        dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          dropzone.classList.add('is-dragging');
        });
      });

      ['dragleave', 'dragend'].forEach(function (eventName) {
        dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          dropzone.classList.remove('is-dragging');
        });
      });

      dropzone.addEventListener('drop', function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.remove('is-dragging');
        var droppedFiles = event.dataTransfer && event.dataTransfer.files;
        if (!droppedFiles || !droppedFiles.length) return;
        try {
          var transfer = new DataTransfer();
          transfer.items.add(droppedFiles[0]);
          input.files = transfer.files;
        } catch (error) {
          input.files = droppedFiles;
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    button.addEventListener('click', async function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var printWindow = window.open('', '_blank');
      if (!printWindow) {
        status('wordPdfStatus', 'Allow pop-ups for this site, then try again.', 'error');
        return;
      }
      try {
        validateFile(file, ['docx'], 25 * 1024 * 1024);
        busy('wordPdfBtn', true, 'Preparing document…');
        status('wordPdfStatus', 'Reading DOCX content…');
        var mammoth = requireLibrary('DOCX reader', window.mammoth);
        var result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        var safeHtml = sanitizeDocumentHtml(result.value || '');
        if (!safeHtml.trim()) throw new Error('No readable document content was found in this DOCX file.');
        var title = escapeHtml(file.name.replace(/\.docx$/i, '') || 'Word document');
        printWindow.document.open();
        printWindow.document.write(
          '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>' + title + ' | WordToPDF</title><style>' +
          'html{background:#fff}body{margin:0;padding:24mm 18mm;color:#1b2437;font:11pt/1.6 Arial,Helvetica,sans-serif}' +
          'main{max-width:850px;margin:0 auto}h1,h2,h3{line-height:1.25;break-after:avoid}p{margin:0 0 10pt}table{width:100%;border-collapse:collapse;margin:12pt 0}td,th{border:1px solid #cbd5e1;padding:6pt;vertical-align:top}img{max-width:100%;height:auto}li{margin:0 0 4pt}a{color:#174ea6;text-decoration:underline}' +
          '@page{size:A4;margin:18mm}@media print{body{padding:0}a{color:inherit;text-decoration:none}}' +
          '</style></head><body><main>' + safeHtml + '</main><script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</script></body></html>'
        );
        printWindow.document.close();
        status('wordPdfStatus', 'Print window opened. Choose “Save as PDF” as the destination.', 'success');
      } catch (error) {
        if (printWindow && !printWindow.closed) printWindow.close();
        status('wordPdfStatus', error.message || 'Could not convert this DOCX file.', 'error');
      } finally {
        busy('wordPdfBtn', false);
      }
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function sanitizeDocumentHtml(html) {
    var parsed = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    var allowed = { P:1, BR:1, STRONG:1, B:1, EM:1, I:1, U:1, H1:1, H2:1, H3:1, H4:1, UL:1, OL:1, LI:1, TABLE:1, THEAD:1, TBODY:1, TR:1, TH:1, TD:1, BLOCKQUOTE:1, A:1, IMG:1, HR:1, SUP:1, SUB:1 };
    function copyNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
      if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
      var fragment = document.createDocumentFragment();
      if (!allowed[node.tagName]) {
        Array.prototype.forEach.call(node.childNodes, function (child) { fragment.appendChild(copyNode(child)); });
        return fragment;
      }
      var clean = document.createElement(node.tagName.toLowerCase());
      if (node.tagName === 'A') {
        var href = node.getAttribute('href') || '';
        try {
          var parsedUrl = new URL(href, window.location.href);
          if (['http:', 'https:', 'mailto:'].indexOf(parsedUrl.protocol) !== -1) clean.setAttribute('href', parsedUrl.href);
        } catch (e) {}
        clean.setAttribute('rel', 'noopener noreferrer');
      }
      if (node.tagName === 'IMG') {
        var src = node.getAttribute('src') || '';
        if (/^data:image\/(png|jpeg|gif|webp);base64,/i.test(src)) clean.setAttribute('src', src);
        clean.setAttribute('alt', node.getAttribute('alt') || '');
      }
      if (node.tagName === 'TD' || node.tagName === 'TH') {
        ['colspan', 'rowspan'].forEach(function (attr) {
          var value = parseInt(node.getAttribute(attr), 10);
          if (value > 0 && value < 100) clean.setAttribute(attr, String(value));
        });
      }
      Array.prototype.forEach.call(node.childNodes, function (child) { clean.appendChild(copyNode(child)); });
      return clean;
    }
    var wrapper = document.createElement('div');
    Array.prototype.forEach.call(parsed.body.firstChild.childNodes, function (child) { wrapper.appendChild(copyNode(child)); });
    return wrapper.innerHTML;
  }

  function initPdfToWord() {
    addFileChange('pdfWordInput', 'pdfWordBtn', 'pdfWordStatus');
    var button = $('pdfWordBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var file = $('pdfWordInput').files && $('pdfWordInput').files[0];
      if (!file) return;
      var ocrWorker = null;
      try {
        validateFile(file, ['pdf'], 50 * 1024 * 1024);
        busy('pdfWordBtn', true, 'Extracting text…');
        status('pdfWordStatus', 'Opening PDF pages…');
        var pdf = await loadPdfJs(file);
        var docx = requireLibrary('Word exporter', window.docx);
        var paragraphs = [];
        var foundText = false;
        for (var pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
          status('pdfWordStatus', 'Reading page ' + pageNo + ' of ' + pdf.numPages + '…');
          var page = await pdf.getPage(pageNo);
          var content = await page.getTextContent();
          var items = content.items.filter(function (item) { return item.str && item.str.trim(); });
          var positioned = items.map(function (item) {
            return { text: item.str.trim(), x: item.transform ? item.transform[4] : 0, y: item.transform ? item.transform[5] : 0 };
          }).sort(function (a, b) {
            return Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x;
          });
          var lines = [];
          var current = '';
          var currentY = null;
          positioned.forEach(function (item) {
            if (currentY !== null && Math.abs(item.y - currentY) > 3) {
              if (current.trim()) lines.push(current.trim());
              current = '';
            }
            current += (current ? ' ' : '') + item.text;
            currentY = item.y;
          });
          if (current.trim()) lines.push(current.trim());

          if (!lines.length) {
            if (!ocrWorker) {
              var tesseract = requireLibrary('OCR engine', window.Tesseract);
              ocrWorker = await tesseract.createWorker($('pdfWordLanguage') ? $('pdfWordLanguage').value : 'eng', 1);
            }
            status('pdfWordStatus', 'Running OCR on scanned page ' + pageNo + ' of ' + pdf.numPages + '…');
            var viewport = page.getViewport({ scale: 1.5 });
            var canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
            var ocr = await ocrWorker.recognize(canvas);
            lines = (ocr.data.text || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
          }
          if (lines.length) foundText = true;
          if (pageNo > 1) {
            paragraphs.push(new docx.Paragraph({
              text: 'Page ' + pageNo,
              heading: docx.HeadingLevel ? docx.HeadingLevel.HEADING_2 : undefined,
              pageBreakBefore: true
            }));
          }
          lines.forEach(function (line) {
            paragraphs.push(new docx.Paragraph({ children: [new docx.TextRun({ text: line })] }));
          });
        }
        if (!foundText) throw new Error('No readable text was found. Try a text-based PDF or a clearer scan.');
        var documentFile = new docx.Document({ sections: [{ properties: {}, children: paragraphs }] });
        var blob = await docx.Packer.toBlob(documentFile);
        downloadBlob(blob, safeName(file.name) + '-converted.docx');
        status('pdfWordStatus', 'DOCX downloaded. Review the layout and OCR text before using it.', 'success');
      } catch (error) {
        status('pdfWordStatus', error.message || 'Could not convert this PDF.', 'error');
      } finally {
        if (ocrWorker) {
          try { await ocrWorker.terminate(); } catch (e) {}
        }
        busy('pdfWordBtn', false);
      }
    });
  }

  function initPdfToImages() {
    addFileChange('pdfImagesInput', 'pdfImagesBtn', 'pdfImagesStatus');
    var button = $('pdfImagesBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var file = $('pdfImagesInput').files && $('pdfImagesInput').files[0];
      if (!file) return;
      try {
        validateFile(file, ['pdf'], 50 * 1024 * 1024);
        busy('pdfImagesBtn', true, 'Rendering pages…');
        var pdf = await loadPdfJs(file);
        if (pdf.numPages > 150) throw new Error('This PDF has more than 150 pages. Split it into smaller files first.');
        var JSZip = requireLibrary('ZIP exporter', window.JSZip);
        var zip = new JSZip();
        for (var i = 1; i <= pdf.numPages; i++) {
          status('pdfImagesStatus', 'Rendering page ' + i + ' of ' + pdf.numPages + '…');
          var page = await pdf.getPage(i);
          var viewport = page.getViewport({ scale: 1.5 });
          var canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
          zip.file('page-' + String(i).padStart(3, '0') + '.png', await canvasBlob(canvas));
        }
        downloadBlob(await zip.generateAsync({ type: 'blob' }), safeName(file.name) + '-pages.zip');
        status('pdfImagesStatus', pdf.numPages + ' page images exported.', 'success');
      } catch (error) {
        status('pdfImagesStatus', error.message || 'Could not export PDF pages.', 'error');
      } finally {
        busy('pdfImagesBtn', false);
      }
    });
  }

  async function imageToPngBytes(file) {
    var bitmap = await createImageBitmap(file);
    var canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    if (bitmap.close) bitmap.close();
    var blob = await canvasBlob(canvas, 'image/png');
    return blob.arrayBuffer();
  }

  function initImagesToPdf() {
    addFileChange('imagesPdfInput', 'imagesPdfBtn', 'imagesPdfStatus');
    var button = $('imagesPdfBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var files = Array.from(($('imagesPdfInput').files || []));
      if (!files.length) return;
      try {
        if (files.length > 50) throw new Error('Choose 50 images or fewer at a time.');
        var PDFDocument = requireLibrary('PDF tools', window.PDFLib).PDFDocument;
        busy('imagesPdfBtn', true, 'Building PDF…');
        var pdf = await PDFDocument.create();
        for (var i = 0; i < files.length; i++) {
          status('imagesPdfStatus', 'Adding image ' + (i + 1) + ' of ' + files.length + '…');
          var file = files[i];
          validateFile(file, ['jpg', 'jpeg', 'png', 'webp', 'bmp'], 20 * 1024 * 1024);
          var bytes = await file.arrayBuffer();
          var image;
          if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) image = await pdf.embedJpg(bytes);
          else if (file.type === 'image/png') image = await pdf.embedPng(bytes);
          else image = await pdf.embedPng(await imageToPngBytes(file));
          var pageWidth = 595.28, pageHeight = 841.89, margin = 22;
          var scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
          var width = image.width * scale, height = image.height * scale;
          var page = pdf.addPage([pageWidth, pageHeight]);
          page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width: width, height: height });
        }
        var bytesOut = await pdf.save();
        downloadBlob(new Blob([bytesOut], { type: 'application/pdf' }), 'wordtopdf-images-to-pdf.pdf');
        status('imagesPdfStatus', files.length + ' image(s) combined into a PDF.', 'success');
      } catch (error) {
        status('imagesPdfStatus', error.message || 'Could not create the PDF.', 'error');
      } finally {
        busy('imagesPdfBtn', false);
      }
    });
  }

  function initMergePdf() {
    addFileChange('mergePdfInput', 'mergePdfBtn', 'mergePdfStatus', 2);
    var button = $('mergePdfBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var files = Array.from(($('mergePdfInput').files || []));
      if (files.length < 2) return;
      try {
        if (files.length > 20) throw new Error('Choose 20 PDFs or fewer at a time.');
        busy('mergePdfBtn', true, 'Merging PDFs…');
        var PDFDocument = requireLibrary('PDF tools', window.PDFLib).PDFDocument;
        var merged = await PDFDocument.create();
        for (var i = 0; i < files.length; i++) {
          validateFile(files[i], ['pdf'], 50 * 1024 * 1024);
          status('mergePdfStatus', 'Adding file ' + (i + 1) + ' of ' + files.length + '…');
          var source = await PDFDocument.load(await files[i].arrayBuffer(), { ignoreEncryption: false });
          var pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach(function (page) { merged.addPage(page); });
        }
        var bytes = await merged.save();
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'wordtopdf-merged.pdf');
        status('mergePdfStatus', 'Merged ' + files.length + ' PDFs successfully.', 'success');
      } catch (error) {
        status('mergePdfStatus', error.message || 'Could not merge these PDFs. Password-protected files may not work.', 'error');
      } finally {
        busy('mergePdfBtn', false);
      }
    });
  }

  function parsePageSelection(raw, pageCount) {
    if (!raw.trim()) return Array.from({ length: pageCount }, function (_, index) { return index; });
    var selected = new Set();
    raw.split(',').forEach(function (part) {
      var value = part.trim();
      if (!value) return;
      var match = value.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('Invalid page range: "' + value + '". Use a format like 1, 3-5.');
      var start = Number(match[1]);
      var end = Number(match[2] || match[1]);
      if (start < 1 || end < start || end > pageCount) throw new Error('Page range ' + value + ' is outside this PDF (1-' + pageCount + ').');
      for (var p = start; p <= end; p++) selected.add(p - 1);
    });
    if (!selected.size) throw new Error('Enter at least one valid page number.');
    return Array.from(selected).sort(function (a, b) { return a - b; });
  }

  function initSplitPdf() {
    addFileChange('splitPdfInput', 'splitPdfBtn', 'splitPdfStatus');
    var button = $('splitPdfBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var file = $('splitPdfInput').files && $('splitPdfInput').files[0];
      if (!file) return;
      try {
        validateFile(file, ['pdf'], 50 * 1024 * 1024);
        busy('splitPdfBtn', true, 'Extracting pages…');
        var source = await loadPdfLib(file);
        var pagesInput = $('splitPagesInput');
        var indices = parsePageSelection(pagesInput ? pagesInput.value : '', source.getPageCount());
        var output = await window.PDFLib.PDFDocument.create();
        var copied = await output.copyPages(source, indices);
        copied.forEach(function (page) { output.addPage(page); });
        var bytes = await output.save();
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), safeName(file.name) + '-selected-pages.pdf');
        status('splitPdfStatus', 'Exported ' + indices.length + ' page(s).', 'success');
      } catch (error) {
        status('splitPdfStatus', error.message || 'Could not split this PDF.', 'error');
      } finally {
        busy('splitPdfBtn', false);
      }
    });
  }

  function initCompressPdf() {
    addFileChange('compressPdfInput', 'compressPdfBtn', 'compressPdfStatus');
    var slider = $('compressQuality');
    if (slider) slider.addEventListener('input', function () {
      if ($('compressQualityValue')) $('compressQualityValue').textContent = slider.value + '%';
    });
    var button = $('compressPdfBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var file = $('compressPdfInput').files && $('compressPdfInput').files[0];
      if (!file) return;
      try {
        validateFile(file, ['pdf'], 50 * 1024 * 1024);
        busy('compressPdfBtn', true, 'Rendering pages…');
        var pdf = await loadPdfJs(file);
        if (pdf.numPages > 80) throw new Error('This PDF has more than 80 pages. Split it into smaller files first.');
        var PDFDocument = requireLibrary('PDF tools', window.PDFLib).PDFDocument;
        var output = await PDFDocument.create();
        var quality = Number(slider ? slider.value : 65) / 100;
        for (var pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
          status('compressPdfStatus', 'Optimizing page ' + pageNo + ' of ' + pdf.numPages + '…');
          var page = await pdf.getPage(pageNo);
          var base = page.getViewport({ scale: 1 });
          var view = page.getViewport({ scale: 1.2 });
          var canvas = document.createElement('canvas');
          canvas.width = Math.ceil(view.width);
          canvas.height = Math.ceil(view.height);
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: view, background: '#ffffff' }).promise;
          var jpeg = await canvasBlob(canvas, 'image/jpeg', quality);
          var image = await output.embedJpg(await jpeg.arrayBuffer());
          var outPage = output.addPage([base.width, base.height]);
          outPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
        }
        var bytes = await output.save({ useObjectStreams: true });
        var blob = new Blob([bytes], { type: 'application/pdf' });
        downloadBlob(blob, safeName(file.name) + '-compressed.pdf');
        var change = Math.round((1 - blob.size / file.size) * 100);
        status('compressPdfStatus', change > 0 ? 'New file is about ' + change + '% smaller. Text is now image-based.' : 'Export complete, but the file did not become smaller. Text is now image-based.', change > 0 ? 'success' : '');
      } catch (error) {
        status('compressPdfStatus', error.message || 'Could not compress this PDF.', 'error');
      } finally {
        busy('compressPdfBtn', false);
      }
    });
  }

  function initImageConvert() {
    addFileChange('imageConvertInput', 'imageConvertBtn', 'imageConvertStatus');
    var button = $('imageConvertBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var files = Array.from(($('imageConvertInput').files || []));
      if (!files.length) return;
      try {
        if (files.length > 50) throw new Error('Choose 50 images or fewer at a time.');
        busy('imageConvertBtn', true, 'Converting images…');
        var mime = $('imageFormatSelect').value;
        var extension = mime === 'image/png' ? 'png' : 'jpg';
        var JSZip = requireLibrary('ZIP exporter', window.JSZip);
        var zip = files.length > 1 ? new JSZip() : null;
        var single = null;
        for (var i = 0; i < files.length; i++) {
          validateFile(files[i], ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'], 20 * 1024 * 1024);
          status('imageConvertStatus', 'Converting image ' + (i + 1) + ' of ' + files.length + '…');
          var bitmap = await createImageBitmap(files[i]);
          var canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          var ctx = canvas.getContext('2d');
          if (mime === 'image/jpeg') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(bitmap, 0, 0);
          if (bitmap.close) bitmap.close();
          var blob = await canvasBlob(canvas, mime, 0.92);
          var name = safeName(files[i].name) + '.' + extension;
          if (zip) zip.file(name, blob);
          else single = { blob: blob, name: name };
        }
        if (zip) downloadBlob(await zip.generateAsync({ type: 'blob' }), 'wordtopdf-converted-images.zip');
        else downloadBlob(single.blob, single.name);
        status('imageConvertStatus', files.length + ' image(s) converted to ' + extension.toUpperCase() + '.', 'success');
      } catch (error) {
        status('imageConvertStatus', error.message || 'Could not convert these images.', 'error');
      } finally {
        busy('imageConvertBtn', false);
      }
    });
  }

  function initBackgroundRemover() {
    var input = $('bgRemoveInput');
    if (!input) return;
    var imageInfo = null;
    var sample = null;
    input.addEventListener('change', async function () {
      var file = input.files && input.files[0];
      if (!file) return;
      try {
        validateFile(file, ['jpg', 'jpeg', 'png', 'webp', 'bmp'], 20 * 1024 * 1024);
        var bitmap = await createImageBitmap(file);
        var maxSide = 1200;
        var scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        var canvas = $('bgCanvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        imageInfo = { name: file.name };
        if (bitmap.close) bitmap.close();
        sample = null;
        $('bgSampleDot').style.background = '#fff';
        $('bgSampleText').textContent = 'Click the background to sample its colour.';
        $('bgPreviewWrap').classList.remove('hidden');
        $('bgRemoveBtn').disabled = false;
        status('bgRemoveStatus', 'Click a plain background area in the preview to sample its colour.');
      } catch (error) {
        status('bgRemoveStatus', error.message || 'Could not open this image.', 'error');
      }
    });
    var canvas = $('bgCanvas');
    if (canvas) canvas.addEventListener('click', function (event) {
      var rect = canvas.getBoundingClientRect();
      var x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width)));
      var y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)));
      var pixel = canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, 1, 1).data;
      sample = [pixel[0], pixel[1], pixel[2]];
      var color = 'rgb(' + pixel[0] + ', ' + pixel[1] + ', ' + pixel[2] + ')';
      $('bgSampleDot').style.background = color;
      $('bgSampleText').textContent = 'Sampled ' + color + '. Adjust tolerance if needed.';
    });
    var range = $('bgTolerance');
    if (range) range.addEventListener('input', function () { $('bgToleranceValue').textContent = range.value; });
    var button = $('bgRemoveBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      if (!imageInfo) return;
      if (!sample) {
        status('bgRemoveStatus', 'Click the background in the preview first.', 'error');
        return;
      }
      try {
        busy('bgRemoveBtn', true, 'Removing background…');
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        var frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = frame.data;
        var tolerance = Number(range ? range.value : 45) * 2.2;
        var feather = 24;
        for (var i = 0; i < pixels.length; i += 4) {
          var dr = pixels[i] - sample[0], dg = pixels[i + 1] - sample[1], db = pixels[i + 2] - sample[2];
          var distance = Math.sqrt(dr * dr + dg * dg + db * db);
          var alpha = Math.max(0, Math.min(255, ((distance - tolerance) / feather) * 255));
          pixels[i + 3] = Math.round(pixels[i + 3] * alpha / 255);
        }
        ctx.putImageData(frame, 0, 0);
        downloadBlob(await canvasBlob(canvas), safeName(imageInfo.name) + '-transparent.png');
        status('bgRemoveStatus', 'Transparent PNG downloaded. This tool works best on plain, single-colour backgrounds.', 'success');
      } catch (error) {
        status('bgRemoveStatus', error.message || 'Could not remove the background.', 'error');
      } finally {
        busy('bgRemoveBtn', false);
      }
    });
  }

  function initBatchOcr() {
    addFileChange('batchOcrInput', 'batchOcrBtn', 'batchOcrStatus');
    var button = $('batchOcrBtn');
    if (!button) return;
    button.addEventListener('click', async function () {
      var files = Array.from(($('batchOcrInput').files || []));
      if (!files.length) return;
      var worker = null;
      try {
        if (files.length > 20) throw new Error('Choose 20 images or fewer at a time.');
        files.forEach(function (file) { validateFile(file, ['jpg', 'jpeg', 'png', 'webp', 'bmp'], 20 * 1024 * 1024); });
        busy('batchOcrBtn', true, 'Preparing OCR…');
        var tesseract = requireLibrary('OCR engine', window.Tesseract);
        var language = $('batchOcrLanguage').value;
        worker = await tesseract.createWorker(language, 1, {
          logger: function (message) {
            if (message.status === 'recognizing text') status('batchOcrStatus', 'Reading image… ' + Math.round((message.progress || 0) * 100) + '%');
          }
        });
        var output = [];
        for (var i = 0; i < files.length; i++) {
          status('batchOcrStatus', 'Scanning ' + (i + 1) + ' of ' + files.length + ': ' + files[i].name);
          var result = await worker.recognize(files[i]);
          output.push('===== ' + files[i].name + ' =====\n' + (result.data.text || '').trim());
          $('batchOcrResult').value = output.join('\n\n');
        }
        $('batchOcrDownload').disabled = !output.some(function (part) { return part.trim(); });
        status('batchOcrStatus', 'Finished scanning ' + files.length + ' image(s). Proofread the results.', 'success');
      } catch (error) {
        status('batchOcrStatus', error.message || 'Batch OCR could not finish.', 'error');
      } finally {
        if (worker) {
          try { await worker.terminate(); } catch (e) {}
        }
        busy('batchOcrBtn', false);
      }
    });
    var download = $('batchOcrDownload');
    if (download) download.addEventListener('click', function () {
      var text = $('batchOcrResult').value;
      if (text.trim()) downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'wordtopdf-batch-ocr.txt');
    });
  }

  function initCropper() {
    var input = $('cropInput');
    if (!input) return;
    var cropper = null;
    var objectUrl = null;
    var image = $('cropPreview');
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      try { validateFile(file, ['jpg', 'jpeg', 'png', 'webp', 'bmp'], 20 * 1024 * 1024); }
      catch (error) { status('cropStatus', error.message, 'error'); return; }
      if (cropper) { cropper.destroy(); cropper = null; }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      image.onload = function () {
        $('cropPreviewWrap').classList.remove('hidden');
        try {
          var Cropper = requireLibrary('Image cropper', window.Cropper);
          cropper = new Cropper(image, {
            viewMode: 1, dragMode: 'crop', autoCropArea: 0.9,
            responsive: true, background: false, movable: true,
            zoomable: true, scalable: false, rotatable: true,
            guides: true, center: true
          });
          $('cropToOcrBtn').disabled = false;
          status('cropStatus', 'Adjust the crop frame, then send it to the OCR workspace.');
        } catch (error) {
          status('cropStatus', error.message || 'The crop tool could not load.', 'error');
        }
      };
      image.src = objectUrl;
    });
    var button = $('cropToOcrBtn');
    if (button) button.addEventListener('click', async function () {
      if (!cropper) return;
      try {
        busy('cropToOcrBtn', true, 'Preparing crop…');
        var canvas = cropper.getCroppedCanvas({ maxWidth: 3200, maxHeight: 3200, imageSmoothingQuality: 'high' });
        await transfer.save(await canvasBlob(canvas));
        if (config.ocrUrl) window.location.assign(config.ocrUrl);
        else status('cropStatus', 'Open the Image to Text page to continue.', 'success');
      } catch (error) {
        status('cropStatus', error.message || 'Could not crop this image.', 'error');
      } finally {
        busy('cropToOcrBtn', false);
      }
    });
    window.addEventListener('beforeunload', function () {
      if (cropper) cropper.destroy();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    });
  }

  function initQr() {
    var button = $('qrGenerateBtn');
    if (!button) return;
    button.addEventListener('click', function () {
      var text = $('qrText').value.trim();
      if (!text) { status('qrStatus', 'Enter a URL or some text first.', 'error'); return; }
      var QRCode;
      try {
        QRCode = requireLibrary('QR generator', window.QRCode);
      } catch (error) {
        status('qrStatus', error.message || 'QR generator did not load.', 'error');
        return;
      }
      var size = Number($('qrSize').value || 256);
      var target = $('qrCanvas');
      target.innerHTML = '';
      try {
        new QRCode(target, { text: text, width: size, height: size, colorDark: '#14233f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
        $('qrOutput').classList.remove('hidden');
        $('qrDownloadBtn').disabled = false;
        status('qrStatus', 'QR code generated. Scan it with a phone to test it.', 'success');
      } catch (error) {
        status('qrStatus', error.message || 'Could not generate this QR code.', 'error');
      }
    });
    var download = $('qrDownloadBtn');
    if (download) download.addEventListener('click', function () {
      var target = $('qrCanvas');
      var canvas = target.querySelector('canvas');
      var image = target.querySelector('img');
      if (canvas) canvas.toBlob(function (blob) { if (blob) downloadBlob(blob, 'wordtopdf-qr-code.png'); });
      else if (image && image.src) {
        var link = document.createElement('a');
        link.href = image.src;
        link.download = 'wordtopdf-qr-code.png';
        link.click();
      }
    });
  }

  function initImageToText() {
    var input = $('imageInput');
    if (!input) return;
    var els = {
      dropzone: $('dropzone'), browseBtn: $('browseBtn'), pasteBtn: $('pasteBtn'), captureBtn: $('captureBtn'),
      previewWrap: $('previewWrap'), imagePreview: $('imagePreview'), fileName: $('fileName'), fileMeta: $('fileMeta'),
      removeImageBtn: $('removeImageBtn'), languageSelect: $('languageSelect'), enhanceToggle: $('enhanceToggle'),
      ocrBtn: $('ocrBtn'), ocrBtnText: $('ocrBtnText'), progressWrap: $('progressWrap'),
      progressLabel: $('progressLabel'), progressPercent: $('progressPercent'), progressFill: $('progressFill'),
      textOutput: $('textOutput'), emptyHint: $('emptyHint'), editorStatus: $('editorStatus'),
      wordCount: $('wordCount'), charCount: $('charCount'), confidenceLabel: $('confidenceLabel'),
      cleanTextBtn: $('cleanTextBtn'), copyBtn: $('copyBtn'), downloadTxtBtn: $('downloadTxtBtn'),
      clearTextBtn: $('clearTextBtn'), pdfBtn: $('pdfBtn'), resetBtn: $('resetBtn'), toast: $('toast')
    };
    var currentFile = null, currentUrl = null, worker = null, workerLanguage = '', working = false, toastTimer = null;

    function toast(message) {
      if (!els.toast) return;
      els.toast.textContent = message;
      els.toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { els.toast.classList.remove('show'); }, 2600);
    }
    function updateCounts() {
      var value = els.textOutput.value || '';
      var trimmed = value.trim();
      els.wordCount.textContent = trimmed ? trimmed.split(/\s+/u).length.toLocaleString() : '0';
      els.charCount.textContent = value.length.toLocaleString();
      var hasText = !!trimmed;
      els.emptyHint.classList.toggle('hidden', hasText);
      ['cleanTextBtn', 'copyBtn', 'downloadTxtBtn', 'clearTextBtn', 'pdfBtn'].forEach(function (id) {
        if ($(id)) $(id).disabled = !hasText;
      });
    }
    function editorStatus(message, success) {
      if (!els.editorStatus) return;
      els.editorStatus.textContent = message;
      els.editorStatus.classList.toggle('success', !!success);
    }
    function progress(percent, message) {
      var value = Math.max(0, Math.min(100, Math.round(percent || 0)));
      els.progressWrap.classList.remove('hidden');
      els.progressFill.style.width = value + '%';
      els.progressPercent.textContent = value + '%';
      if (message) els.progressLabel.textContent = message;
    }
    function setBusy(value) {
      working = value;
      els.ocrBtn.disabled = value || !currentFile;
      els.ocrBtnText.textContent = value ? 'Extracting text…' : 'Extract text from image';
      [els.browseBtn, els.pasteBtn, els.captureBtn].forEach(function (button) { if (button) button.disabled = value; });
    }
    function setImage(file) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        toast('Choose a valid image file.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast('Choose an image smaller than 20 MB.');
        return;
      }
      currentFile = file;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = URL.createObjectURL(file);
      els.imagePreview.src = currentUrl;
      els.fileName.textContent = file.name || 'Pasted screenshot';
      els.fileMeta.textContent = Math.max(1, Math.round(file.size / 1024)) + ' KB · ' + file.type.replace('image/', '').toUpperCase();
      els.previewWrap.classList.remove('hidden');
      els.dropzone.classList.add('has-image');
      els.ocrBtn.disabled = working;
      editorStatus('Image ready to scan');
      els.confidenceLabel.textContent = 'Not scanned yet';
    }
    function removeImage() {
      currentFile = null;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = null;
      els.imagePreview.removeAttribute('src');
      els.previewWrap.classList.add('hidden');
      input.value = '';
      els.ocrBtn.disabled = true;
      editorStatus('Waiting for an image');
    }
    async function preprocess(file) {
      if (!els.enhanceToggle || !els.enhanceToggle.checked) return file;
      var bitmap = await createImageBitmap(file);
      var maxSide = 2400;
      var scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      if (bitmap.close) bitmap.close();
      var frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var pixels = frame.data;
      for (var i = 0; i < pixels.length; i += 4) {
        var gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        var adjusted = Math.max(0, Math.min(255, (gray - 128) * 1.1 + 128));
        pixels[i] = pixels[i + 1] = pixels[i + 2] = adjusted;
      }
      ctx.putImageData(frame, 0, 0);
      return canvasBlob(canvas, 'image/png');
    }
    async function getWorker(language) {
      var Tesseract = requireLibrary('OCR engine', window.Tesseract);
      if (worker && workerLanguage === language) return worker;
      if (worker) {
        await worker.terminate();
        worker = null;
        workerLanguage = '';
      }
      worker = await Tesseract.createWorker(language, 1, {
        logger: function (message) {
          if (message.status === 'loading tesseract core') progress(5, 'Loading OCR engine…');
          else if (message.status === 'loading language traineddata') progress(18, 'Loading language data…');
          else if (message.status === 'recognizing text') progress(35 + (message.progress || 0) * 62, 'Reading your image…');
        }
      });
      workerLanguage = language;
      return worker;
    }
    async function extract() {
      if (!currentFile || working) return;
      try {
        setBusy(true);
        els.confidenceLabel.textContent = 'Scanning…';
        editorStatus('Reading image…');
        var image = await preprocess(currentFile);
        var ocrWorker = await getWorker(els.languageSelect.value);
        var result = await ocrWorker.recognize(image);
        var text = (result.data.text || '').trim();
        els.textOutput.value = text;
        updateCounts();
        var confidence = Math.round(result.data.confidence || 0);
        els.confidenceLabel.textContent = 'OCR confidence: ' + confidence + '%';
        editorStatus(text ? 'Text extracted successfully' : 'No readable text found', !!text);
        progress(100, text ? 'Extraction complete' : 'Scan complete');
        toast(text ? 'Text extracted. Review the result.' : 'No readable text found. Try a clearer image or another language.');
      } catch (error) {
        editorStatus('Could not complete the scan');
        els.confidenceLabel.textContent = 'Scan failed';
        toast(error.message || 'OCR could not complete.');
      } finally {
        setBusy(false);
        window.setTimeout(function () { els.progressWrap.classList.add('hidden'); }, 1500);
      }
    }
    function cleanText() {
      els.textOutput.value = els.textOutput.value.replace(/\r\n?/g, '\n').replace(/[\t ]+/g, ' ').split('\n').map(function (line) { return line.trim(); }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
      updateCounts();
      toast('Text spacing cleaned up.');
    }
    async function copyText() {
      var value = els.textOutput.value;
      if (!value.trim()) return;
      try {
        await navigator.clipboard.writeText(value);
        toast('Text copied.');
      } catch (error) {
        els.textOutput.focus();
        els.textOutput.select();
        toast(document.execCommand('copy') ? 'Text copied.' : 'Select and copy the text manually.');
      }
    }
    function downloadText() {
      if (!els.textOutput.value.trim()) return;
      downloadBlob(new Blob([els.textOutput.value], { type: 'text/plain;charset=utf-8' }), 'wordtopdf-extracted-text.txt');
    }
    function exportPdf() {
      var text = els.textOutput.value;
      if (!text.trim()) return;
      var win = window.open('', '_blank');
      if (!win) { toast('Allow pop-ups to export the PDF.'); return; }
      var dir = /[\u0600-\u06FF\u0750-\u077F]/u.test(text) ? 'rtl' : 'ltr';
      win.document.open();
      win.document.write('<!doctype html><html lang="en" dir="' + dir + '"><head><meta charset="utf-8"><title>WordToPDF OCR Document</title><style>body{font:12pt/1.7 Arial,sans-serif;padding:20mm;color:#202a3b}main{max-width:760px;margin:auto;white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext}@page{margin:18mm}@media print{body{padding:0}}</style></head><body><main>' + escapeHtml(text) + '</main><script>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});</script></body></html>');
      win.document.close();
    }
    function chooseFile(file) {
      if (!file) return;
      if (file.type && file.type.indexOf('image/') === 0) setImage(file);
      else toast('Choose an image file.');
    }
    async function pasteImage() {
      try {
        var items = await navigator.clipboard.read();
        for (var i = 0; i < items.length; i++) {
          var type = items[i].types.find(function (t) { return t.indexOf('image/') === 0; });
          if (type) {
            var blob = await items[i].getType(type);
            setImage(new File([blob], 'pasted-image.png', { type: type }));
            return;
          }
        }
        toast('No image found in clipboard. Copy a screenshot first.');
      } catch (error) {
        toast('Use Ctrl + V to paste a copied screenshot.');
      }
    }
    async function captureScreen() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast('Screen capture is not available in this browser.');
        return;
      }
      var stream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
        var video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        await new Promise(function (resolve) { requestAnimationFrame(resolve); });
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        var blob = await canvasBlob(canvas, 'image/png');
        stream.getTracks().forEach(function (track) { track.stop(); });
        if (blob) setImage(new File([blob], 'screen-capture.png', { type: 'image/png' }));
      } catch (error) {
        if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
        if (error.name !== 'NotAllowedError') toast('Could not capture the screen.');
      }
    }

    els.browseBtn.addEventListener('click', function (event) { event.stopPropagation(); input.click(); });
    els.dropzone.addEventListener('click', function (event) { if (event.target !== els.browseBtn) input.click(); });
    els.dropzone.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function () { chooseFile(input.files && input.files[0]); });
    els.dropzone.addEventListener('dragover', function (event) { event.preventDefault(); els.dropzone.classList.add('dragover'); });
    els.dropzone.addEventListener('dragleave', function () { els.dropzone.classList.remove('dragover'); });
    els.dropzone.addEventListener('drop', function (event) { event.preventDefault(); els.dropzone.classList.remove('dragover'); chooseFile(event.dataTransfer.files && event.dataTransfer.files[0]); });
    document.addEventListener('paste', function (event) {
      var items = Array.from((event.clipboardData && event.clipboardData.items) || []);
      var imageItem = items.find(function (item) { return item.type.indexOf('image/') === 0; });
      if (imageItem) {
        var file = imageItem.getAsFile();
        if (file) { setImage(file); event.preventDefault(); }
      }
    });
    els.pasteBtn.addEventListener('click', pasteImage);
    els.captureBtn.addEventListener('click', captureScreen);
    els.removeImageBtn.addEventListener('click', removeImage);
    els.ocrBtn.addEventListener('click', extract);
    els.textOutput.addEventListener('input', updateCounts);
    els.cleanTextBtn.addEventListener('click', cleanText);
    els.copyBtn.addEventListener('click', copyText);
    els.downloadTxtBtn.addEventListener('click', downloadText);
    els.clearTextBtn.addEventListener('click', function () { els.textOutput.value = ''; updateCounts(); els.confidenceLabel.textContent = 'Text cleared'; editorStatus('Text cleared'); });
    els.pdfBtn.addEventListener('click', exportPdf);
    els.resetBtn.addEventListener('click', function () {
      if (working) return;
      removeImage();
      els.textOutput.value = '';
      updateCounts();
      els.confidenceLabel.textContent = 'No scan yet';
      editorStatus('Waiting for an image');
      els.progressWrap.classList.add('hidden');
      toast('Workspace cleared.');
    });
    transfer.take().then(function (blob) {
      if (blob) setImage(new File([blob], 'cropped-document.png', { type: 'image/png' }));
    }).catch(function () {});
    updateCounts();
    window.addEventListener('beforeunload', function () {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      if (worker) worker.terminate();
    });
  }

  function initDropAndFilter() {
    document.querySelectorAll('.filter-bar button').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelectorAll('.filter-bar button').forEach(function (item) {
          item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
        });
        document.querySelectorAll('.tool-tile').forEach(function (card) {
          card.classList.toggle('u-hide', button.dataset.filter !== 'All' && card.dataset.group !== button.dataset.filter);
        });
      });
    });
  }

  function init() {
    initWordToPdf();
    initPdfToWord();
    initPdfToImages();
    initImagesToPdf();
    initMergePdf();
    initSplitPdf();
    initCompressPdf();
    initImageConvert();
    initBackgroundRemover();
    initBatchOcr();
    initCropper();
    initQr();
    initImageToText();
    initDropAndFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
