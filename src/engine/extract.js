/**
 * Extraction du texte d'un fichier importé, entièrement dans le navigateur
 * (le livre ne quitte pas l'appareil dans le prototype).
 *  - TXT / MD : lecture directe
 *  - PDF      : PDF.js (chargé seulement quand on en a besoin)
 *  - DOCX     : mammoth.js (idem)
 *  - Photo (OCR) : version finale (tesseract.js) — non incluse ici.
 */

export const MAX_BYTES = 8 * 1024 * 1024;
export const ACCEPT = '.txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function kindOf(file) {
  const n = (file.name || '').toLowerCase();
  if (n.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (n.endsWith('.docx')) return 'docx';
  if (n.endsWith('.txt') || n.endsWith('.md') || file.type.startsWith('text/')) return 'txt';
  return null;
}

async function pdfText(file) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  let emptyPages = 0;
  for (let i = 1; i <= Math.min(doc.numPages, 200); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = '';
    let lastY = null;
    for (const item of content.items) {
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) text += '\n';
      text += item.str;
      if (item.hasEOL) text += '\n';
      lastY = y;
    }
    if (!text.trim()) emptyPages += 1;
    pages.push(text);
  }
  return { text: pages.join('\n\n'), scanned: emptyPages > 0 && emptyPages >= doc.numPages / 2, pages: doc.numPages };
}

async function docxText(file) {
  const mod = await import('mammoth/mammoth.browser.js');
  const mammoth = mod.default || mod;
  const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { text: res.value, scanned: false };
}

/** @returns {Promise<{text:string, kind:string, scanned:boolean}>} */
export async function extractText(file) {
  if (file.size > MAX_BYTES) throw new Error('too_big');
  const kind = kindOf(file);
  if (!kind) throw new Error('bad_type');
  if (kind === 'txt') return { text: await file.text(), kind, scanned: false };
  if (kind === 'pdf') return { kind, ...(await pdfText(file)) };
  return { kind, ...(await docxText(file)) };
}
