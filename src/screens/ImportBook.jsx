/**
 * Écran 10 — Ajouter un livre (parent) : importer un fichier (TXT, PDF, DOCX)
 * ou coller un texte → étapes de traitement visibles → aperçu page par page
 * → approbation et choix des enfants. Rien n'est visible par l'enfant avant l'approbation.
 * La photo (OCR) et « Créer une histoire » par IA sont annoncés comme évolutions.
 */
import { useRef, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { extractText, ACCEPT } from '../engine/extract.js';
import { buildImportedBook, IMPORT_STEPS } from '../engine/importBook.js';
import { avatarOf } from '../components/ui.jsx';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ImportBook() {
  const { state, dispatch, navigate, uid } = useStore();
  const t = useT();
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [paste, setPaste] = useState('');
  const [title, setTitle] = useState('');
  const [lang, setLang] = useState('auto');
  const [childIds, setChildIds] = useState(state.children.map((c) => c.id));
  const [stepIdx, setStepIdx] = useState(-1);
  const [error, setError] = useState('');
  const [book, setBook] = useState(null);
  const [scanned, setScanned] = useState(false);
  const input = useRef(null);

  const canStart = title.trim().length >= 2 && (mode === 'file' ? Boolean(file) : paste.trim().length >= 40) && childIds.length > 0;

  const run = async () => {
    setError('');
    setBook(null);
    try {
      setStepIdx(0); await wait(250);                       // réception
      setStepIdx(1);                                         // extraction
      let raw = paste;
      let source = 'texte';
      if (mode === 'file') {
        const res = await extractText(file);
        raw = res.text;
        source = res.kind;
        setScanned(res.scanned);
        if (res.scanned && raw.trim().length < 40) throw new Error('scanned');
      }
      if (raw.trim().length < 40) throw new Error('empty');
      for (let i = 2; i <= 6; i++) { setStepIdx(i); await wait(220); } // nettoyage → contrôle
      const b = buildImportedBook({ id: uid('livre'), title: title.trim(), raw, lang: lang === 'auto' ? undefined : lang, source, childIds });
      if (!b.scenes.length) throw new Error('empty');
      setStepIdx(7);
      setBook(b);
    } catch (e) {
      setStepIdx(-1);
      setError(t(`import_err_${['too_big', 'bad_type', 'scanned', 'empty'].includes(e.message) ? e.message : 'generic'}`));
    }
  };

  const approve = () => {
    dispatch({ type: 'ADD_BOOK', book: { ...book, status: 'approved', approvedAt: new Date().toISOString() } });
    navigate('parent', { tab: 'books' });
  };
  const keepPending = () => {
    dispatch({ type: 'ADD_BOOK', book });
    navigate('parent', { tab: 'books' });
  };

  return (
    <main className="screen">
      <div className="screen-narrow stack">
        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('parent', { tab: 'books' })}>← {t('back')}</button>
        <h1>📚 {t('add_book')}</h1>

        {!book && (
          <>
            <div className="row" role="group" aria-label={t('add_book')}>
              <button type="button" className="chip" aria-pressed={mode === 'file'} onClick={() => setMode('file')}>📄 {t('import_file')}</button>
              <button type="button" className="chip" aria-pressed={mode === 'paste'} onClick={() => setMode('paste')}>📋 {t('import_paste')}</button>
              <button type="button" className="chip" disabled aria-describedby="soon1">📷 {t('import_photo')}</button>
              <button type="button" className="chip" disabled aria-describedby="soon1">✨ {t('create_story')}</button>
              <span id="soon1" className="badge-tag soon">{t('import_soon')}</span>
            </div>

            <div className="field">
              <label htmlFor="bk-title">{t('book_title')}</label>
              <input id="bk-title" type="text" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {mode === 'file' ? (
              <div
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); } }}
              >
                <p style={{ margin: '0 0 10px' }}>{file ? `📄 ${file.name} (${Math.round(file.size / 1024)} Ko)` : t('drop_here')}</p>
                <input ref={input} type="file" accept={ACCEPT} className="visually-hidden" id="bk-file"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); } }} />
                <label htmlFor="bk-file" className="btn">{t('choose_file')}</label>
                <p className="muted" style={{ fontSize: '0.85em', margin: '10px 0 0' }}>{t('import_formats')}</p>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="bk-paste">{t('import_paste_label')}</label>
                <textarea id="bk-paste" className="paste" value={paste} onChange={(e) => setPaste(e.target.value)} />
              </div>
            )}

            <div className="row">
              <div className="field">
                <label htmlFor="bk-lang">{t('book_lang')}</label>
                <select id="bk-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="auto">{t('lang_auto')}</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
            <div className="field">
              <span className="label">{t('book_for')}</span>
              <div className="row">
                {state.children.map((c) => (
                  <button key={c.id} type="button" className="chip" aria-pressed={childIds.includes(c.id)}
                    onClick={() => setChildIds((ids) => (ids.includes(c.id) ? ids.filter((x) => x !== c.id) : [...ids, c.id]))}>
                    {avatarOf(c.avatar).emoji} {c.nickname}
                  </button>
                ))}
              </div>
            </div>
            <p className="banner">🔒 {t('import_private')}</p>
            <button type="button" className="btn btn-primary" disabled={!canStart || stepIdx >= 0} onClick={run} style={{ alignSelf: 'flex-start' }}>⚙️ {t('import_start')}</button>
          </>
        )}

        {stepIdx >= 0 && (
          <div className="pipeline" aria-live="polite">
            {IMPORT_STEPS.map((s, i) => (
              <div key={s} className="pipeline-step" data-state={i < stepIdx || (book && i <= stepIdx) ? 'done' : i === stepIdx ? 'run' : 'wait'}>
                {t(`ist_${s}`)}
              </div>
            ))}
          </div>
        )}
        {error && <p role="alert" className="banner">⚠ {error}</p>}

        {book && (
          <div className="stack">
            <div className="card stack">
              <h2 style={{ margin: 0 }}>{book.cover} {book.title.fr}</h2>
              <div className="row" style={{ gap: 6 }}>
                <span className="badge-tag">📄 {t('pages_n', { n: book.stats.pages })}</span>
                <span className="badge-tag">{book.stats.words} {t('words')}</span>
                <span className="badge-tag">⏱ {t('minutes', { n: book.durationMin })}</span>
                <span className="badge-tag">📶 {t(`level_${book.level.level}`)}</span>
                <span className="badge-tag">{book.lang === 'ar' ? 'العربية' : 'Français'}</span>
              </div>
              {book.warnings.length > 0 && (
                <p className="banner" role="alert">⚠ {t('import_warnings', { words: book.warnings.join(', ') })}</p>
              )}
              {scanned && <p className="banner">⚠ {t('import_scanned_partial')}</p>}
              <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>{t('import_limits')}</p>
            </div>
            <h3>{t('preview_pages')}</h3>
            <ol className="stack" style={{ paddingInlineStart: 22, gap: 10, margin: 0 }}>
              {book.scenes.map((s) => (
                <li key={s.id} className="card" style={{ padding: 12 }}>
                  <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                    <span className="badge-tag">{s.emoji} {t.pick(s.where)}{s.decorGuessed ? ` (${t('guessed')})` : ''}</span>
                    {s.characters.map((c) => <span key={c.id} className="badge-tag">{book.characters[c.id].shape} {t.pick(book.characters[c.id].name)}</span>)}
                    {s.sound && <span className="badge-tag">🔊 {t(`sound_${s.sound.type}`)}</span>}
                  </div>
                  <p dir={book.lang === 'ar' ? 'rtl' : 'ltr'} lang={book.lang} style={{ margin: 0 }}>{s[book.lang].sentences.map((x) => x.t).join(' ')}</p>
                </li>
              ))}
            </ol>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={approve}>✓ {t('approve_publish')}</button>
              <button type="button" className="btn" onClick={keepPending}>{t('keep_pending')}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setBook(null); setStepIdx(-1); }}>{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
