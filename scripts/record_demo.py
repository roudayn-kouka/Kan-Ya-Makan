"""
Usage : npm run build && npm run preview, puis  python3 scripts/record_demo.py  (pip install playwright).
Enregistre la vidéo de démonstration de Kan Ya Makan avec Playwright.
- Parcours réel de l'application (aucune image truquée).
- Cartons de chapitre injectés dans la page, clics visibles (cercle orange).
- Les sous-titres explicatifs sont horodatés dans captions.json, puis incrustés
  dans un bandeau sous l'image par ffmpeg (voir build_demo.sh).
"""
import asyncio, json, time, os, re
from playwright.async_api import async_playwright

BASE = os.environ.get('KYM_URL', 'http://localhost:4173/')  # npm run build && npm run preview
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'demo_out') + '/'
NOUR = open(os.path.join(HERE, 'nour.txt'), encoding='utf8').read()
W, H = 1280, 720
BAND = 84  # bandeau de sous-titres en bas de l'image
os.makedirs(OUT, exist_ok=True)

captions = []   # (t, chapitre, texte)
T0 = None

def now():
    return time.monotonic() - T0

async def fx(pg):
    await pg.evaluate(FX, BAND)

async def cap(pg, chapter, text):
    await fx(pg)
    await pg.evaluate("""([c, t]) => { const b = document.getElementById('demo-band');
      b.querySelector('.ch').textContent = c; b.querySelector('.tx').textContent = t; }""", [chapter, text])
    captions.append({'t': round(now(), 2), 'chapter': chapter, 'text': text})
    print(f'{now():7.1f}s  [{chapter}] {text}')

FX = """
(band) => {
  if (!document.getElementById('demo-style')) {
    const st = document.createElement('style'); st.id = 'demo-style';
    st.textContent = `html{height:calc(100vh - ${band}px)!important}.screen{padding-bottom:${band+40}px!important}
    .demo-ripple{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
      border:4px solid #F47B2A;background:rgba(244,123,42,.25);pointer-events:none;z-index:2147483647;
      animation:demoRip .7s ease-out forwards}@keyframes demoRip{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
    .demo-band{position:fixed;left:0;right:0;bottom:0;height:${band}px;z-index:2147483645;background:#1f2a44;color:#fff;
      display:flex;align-items:center;gap:18px;padding:0 26px;font-family:Lexend,"DejaVu Sans",system-ui,sans-serif;direction:ltr;
      border-top:4px solid #F47B2A;box-sizing:border-box}
    .demo-band .ch{color:#F47B2A;font-weight:700;font-size:16px;white-space:nowrap;min-width:150px}
    .demo-band .tx{font-size:19px;line-height:1.3}
    .demo-card{position:fixed;inset:0;bottom:${band}px;z-index:2147483646;display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:14px;background:#1f2a44;color:#fff;font-family:Lexend,"DejaVu Sans",system-ui,sans-serif;text-align:center;padding:24px;direction:ltr}
    .demo-card img{height:86px;background:#fff;border-radius:18px;padding:8px 16px}
    .demo-card .n{color:#F47B2A;font-weight:700;letter-spacing:.08em;font-size:20px}
    .demo-card h1{font-size:44px;margin:0;line-height:1.15;color:#fff}.demo-card p{font-size:22px;margin:0;opacity:.9;max-width:900px}`;
    document.head.appendChild(st);
    window.addEventListener('pointerdown', (e) => {
      const d = document.createElement('div'); d.className = 'demo-ripple';
      d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
      document.body.appendChild(d); setTimeout(() => d.remove(), 800);
    }, true);
  }
  if (!document.getElementById('demo-band')) {
    const b = document.createElement('div'); b.id = 'demo-band'; b.className = 'demo-band';
    b.innerHTML = '<span class="ch"></span><span class="tx"></span>';
    document.body.appendChild(b);
  }
}
"""

async def card(pg, n, title, sub='', hold=3.2):
    await fx(pg)
    await pg.evaluate("""([n,t,s]) => { const c=document.createElement('div'); c.className='demo-card'; c.id='demo-card';
      c.innerHTML = `<img src="./logo_kan_ya_makan.png" alt=""><div class="n">${n}</div><h1>${t}</h1><p>${s}</p>`;
      document.documentElement.appendChild(c); }""", [n, title, sub])
    await pg.wait_for_timeout(int(hold * 1000))
    await pg.evaluate("document.getElementById('demo-card')?.remove()")

async def w(pg, s):
    await pg.wait_for_timeout(int(s * 1000))

async def long_press(pg, locator, ms=1300):
    bb = await locator.bounding_box()
    await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    await pg.mouse.down(); await pg.wait_for_timeout(ms); await pg.mouse.up()

async def child_login(pg, name='Lina'):
    await pg.get_by_role('button', name=name, exact=True).click(); await w(pg, 0.8)
    for n in ['Soleil', 'Lune', 'Étoile']:
        await pg.get_by_role('button', name=n, exact=True).click(); await w(pg, 0.35)
    await w(pg, 1.2)

async def parent_login(pg):
    await long_press(pg, pg.locator('.longpress')); await w(pg, 0.6)
    for d in '2468':
        await pg.locator('.keypad button', has_text=d).first.click(); await w(pg, 0.25)
    await w(pg, 1.2)

async def answer_until_right(pg, max_tries=4):
    await w(pg, 2.2)  # le temps de lire la question
    for _ in range(max_tries):
        btns = pg.locator('.question-card .choice-btn:not([data-state="tried"]):not([data-state="correct"])')
        if await pg.locator('.question-card .choice-btn[data-state="correct"]').count():
            return
        if not await btns.count():
            return
        await btns.last.click(); await w(pg, 2.8)  # bonne réponse, ou indice de Sidi

async def main():
    global T0
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, record_video_dir=OUT, record_video_size={'width': W, 'height': H}, locale='fr-FR')
        pg = await ctx.new_page()
        T0 = time.monotonic()
        pg.set_default_timeout(20000)
        await pg.goto(BASE); await pg.evaluate('localStorage.clear()'); await pg.reload(); await w(pg, 1.0)

        # ---------- 0. Ouverture ----------
        await cap(pg, 'Kan Ya Makan', 'Le livre devient une expérience 3D adaptée au profil de l’enfant, sous le contrôle des parents.')
        await card(pg, 'DÉMO DE LA PLATEFORME', 'Kan Ya Makan — كان يا مكان', 'Il était une fois… ton histoire, à ta mesure.', 4.5)

        # ---------- 1. Vision des couleurs ----------
        await cap(pg, '1 · Premier lancement', 'Avant tout, une question : voyez-vous bien toutes les couleurs ? Le site entier s’adapte tout de suite.')
        await card(pg, 'CHAPITRE 1', 'Premier lancement : les couleurs', 'Le site s’adapte au daltonisme dès la première seconde.')
        await w(pg, 2.5)
        await pg.get_by_role('radio', name='Je confonds le rouge et le vert').click(); await w(pg, 1.0)
        await cap(pg, '1 · Premier lancement', 'Rouge-vert choisi : couleurs sûres, motifs et contours en plus, filtre de correction appliqué à tout le site.')
        await pg.mouse.wheel(0, 700); await w(pg, 4.0)
        await pg.mouse.wheel(0, -700); await w(pg, 0.8)
        await pg.get_by_role('radio', name='Je vois bien toutes les couleurs').click(); await w(pg, 1.5)
        await cap(pg, '1 · Premier lancement', 'Pour la suite de la démo, la personne qui tient l’écran voit bien les couleurs.')
        await pg.get_by_role('button', name='Continuer →').click(); await w(pg, 2.5)

        # ---------- 2. Compte parent + enfant ----------
        await cap(pg, '2 · Compte parent', 'Le parent crée le compte : email, mot de passe, pays, code parent à 4 chiffres et consentements.')
        await card(pg, 'CHAPITRE 2', 'Le parent crée le compte', 'Puis le profil de l’enfant, avec ce qu’il a remarqué.')
        await pg.get_by_role('button', name='👤 Créer un compte parent').click(); await w(pg, 1.2)
        await pg.locator('#su-email').press_sequentially('maman.lina@exemple.tn', delay=35)
        await pg.locator('#su-pw').press_sequentially('Lecture2026!', delay=35)
        await pg.locator('#su-pw2').press_sequentially('Lecture2026!', delay=25)
        await pg.mouse.wheel(0, 400); await w(pg, 0.6)
        await pg.locator('#su-pin').press_sequentially('2468', delay=60)
        await pg.locator('#su-pin2').press_sequentially('2468', delay=60)
        await pg.mouse.wheel(0, 500); await w(pg, 0.8)
        await pg.get_by_label('J’ai 18 ans ou plus').check(); await w(pg, 0.4)
        await pg.get_by_label('J’ai lu et j’accepte la façon dont les données sont gardées.').check(); await w(pg, 1.0)
        await pg.get_by_role('button', name='Créer le compte et ajouter mon enfant →').click(); await w(pg, 1.5)

        await cap(pg, '2 · Profil enfant', 'L’enfant n’a pas de compte : juste un surnom, une tranche d’âge et un avatar. Minimum de données.')
        await pg.locator('#nick').press_sequentially('Lina', delay=80); await w(pg, 0.5)
        await pg.get_by_role('button', name='Hibou').click()
        await w(pg, 1.5)
        await pg.get_by_role('button', name='Continuer →').click(); await w(pg, 1.2)
        await cap(pg, '2 · Ce que vous avez remarqué', 'Le parent indique ce qu’il a remarqué (ce n’est pas un diagnostic) : ici, lecture difficile, couleurs rouge-vert et audition.')
        await pg.get_by_role('button', name='Difficultés à lire').click(); await w(pg, 0.8)
        await pg.get_by_role('button', name='Confond certaines couleurs').click(); await w(pg, 0.8)
        await pg.get_by_role('button', name='Rouge et vert', exact=True).click(); await w(pg, 0.8)
        await pg.mouse.wheel(0, 400); await w(pg, 0.5)
        await pg.get_by_role('button', name='Entend mal, ou les bruits le dérangent').click(); await w(pg, 1.2)
        await pg.mouse.wheel(0, 500); await w(pg, 3.0)
        await pg.get_by_role('button', name='Continuer →').click(); await w(pg, 1.0)
        await cap(pg, '2 · Code en images', 'L’enfant se connecte avec 3 images, sans rien écrire.')
        for n in ['Soleil', 'Lune', 'Étoile']:
            await pg.get_by_role('button', name=n, exact=True).click(); await w(pg, 0.5)
        await w(pg, 1.5)
        await pg.get_by_role('button', name='Continuer →').click(); await w(pg, 0.8)
        await pg.get_by_label('J’ai lu et j’accepte la façon dont les données de mon enfant sont gardées.').check(); await w(pg, 0.8)
        await pg.get_by_role('button', name='Créer le profil →').click(); await w(pg, 2.0)
        await cap(pg, '2 · Réglages proposés', 'Réglages proposés automatiquement : préréglage Dyslexie, couleurs adaptées, sous-titres toujours visibles. Tout reste réglable avec un aperçu en direct.')
        await pg.mouse.wheel(0, 650); await w(pg, 3.0)
        ls = pg.locator('#ls')
        await ls.focus()
        for _ in range(4):
            await pg.keyboard.press('ArrowRight'); await w(pg, 0.35)
        await w(pg, 2.0)
        await pg.mouse.wheel(0, -650); await w(pg, 0.8)
        await pg.get_by_role('button', name='C’est prêt : aller à « Qui lit ? » →').click(); await w(pg, 2.0)

        # ---------- 3. Cendrillon ----------
        await cap(pg, '3 · L’espace enfant', 'Lina touche son avatar puis ses 3 images. Sidi Hkeya, le conteur à la chechia, l’accueille en derja.')
        await card(pg, 'CHAPITRE 3', 'Une histoire : Cendrillon', 'Regarder le film, puis lire page par page.')
        await child_login(pg)
        await cap(pg, '3 · Choisir un livre', 'Peu de choix à la fois pour éviter la surcharge. Les couleurs de Lina s’appliquent maintenant à tout le site.')
        await w(pg, 3.0)
        await pg.locator('.book-card', has_text='Cendrillon').click(); await w(pg, 2.0)
        await cap(pg, '3 · On se prépare', 'Aperçu de la scène, objectif du jour (ici 2 pages), et deux façons d’entrer : le film, ou la lecture page par page.')
        await pg.get_by_role('button', name='2 pages').click(); await w(pg, 2.5)
        await pg.get_by_role('button', name='▶ Regarder le film').click(); await w(pg, 1.5)
        await cap(pg, '3 · Regarder', 'La vidéo de toute l’histoire, découpée en scènes. Rien ne démarre seul : l’enfant appuie sur ▶.')
        await pg.locator('.vplayer-big').click(); await w(pg, 7.0)
        await cap(pg, '3 · Regarder', '« Ce qui se passe » : le texte de la page reste toujours lisible, même sans le son.')
        await pg.locator('.vplayer-mark').nth(5).click(); await w(pg, 6.0)
        await cap(pg, '3 · Personnages', 'Toucher un personnage met la vidéo en pause et montre ce qu’il ressent.')
        await pg.locator('.vplayer-chars .char-label').first.click(); await w(pg, 4.5)
        await pg.get_by_role('button', name='📖 Lire cette page').click(); await w(pg, 2.0)

        await cap(pg, '3 · Lire', 'Lecture page par page : le texte avec les réglages de Lina (espacements, lignes courtes) et l’extrait vidéo de la page.')
        await w(pg, 3.0)
        await cap(pg, '3 · Aide sur un mot', 'Toucher un mot souligné : définition simple, sans quitter la page.')
        await pg.locator('.word.has-def').first.click(); await w(pg, 3.5)
        await pg.keyboard.press('Escape'); await w(pg, 0.5)
        await cap(pg, '3 · Sidi explique', '💬 Sidi Hkeya explique la phrase à ce moment précis de l’histoire.')
        await pg.locator('.explain-btn').nth(1).click(); await w(pg, 4.5)
        await cap(pg, '3 · Texte simplifié', 'Texte simplifié en un geste, toujours signalé ; l’original reste à un geste.')
        await pg.get_by_role('button', name='✂️ Texte simplifié').click(); await w(pg, 3.5)
        await pg.get_by_role('button', name='✂️ Texte simplifié').click(); await w(pg, 1.0)
        await cap(pg, '3 · Écouter', 'Écouter la page : la voix de l’appareil lit et le texte se surligne. (Ici, sans voix installée, le surlignage suit quand même.)')
        await pg.get_by_role('button', name='🔊 Écouter la page').first.click(); await w(pg, 5.0)
        await cap(pg, '3 · Concentration', 'Mode concentration : la scène se cache et tout s’assombrit sauf la phrase en cours.')
        await pg.get_by_role('button', name='🎯 Concentration').click(); await w(pg, 4.0)
        await pg.get_by_role('button', name='🎯 Concentration').click(); await w(pg, 1.0)
        await cap(pg, '3 · Question', 'Une petite question facultative. Jamais d’échec affiché : une erreur donne un indice.')
        await pg.get_by_role('button', name='❓ Une petite question ?').click(); await w(pg, 1.0)
        await answer_until_right(pg); await w(pg, 2.0)
        await pg.get_by_role('button', name='Page suivante →').click(); await w(pg, 2.5)
        await pg.get_by_role('button', name='Page suivante →').click(); await w(pg, 1.5)
        await cap(pg, '3 · Objectif atteint', 'Objectif du jour atteint (2 pages) : Sidi félicite Lina, qui peut continuer ou s’arrêter.')
        await w(pg, 3.0)
        await pg.get_by_role('button', name=re.compile('bon pour aujourd')).click(); await w(pg, 1.5)
        await cap(pg, '3 · Fin de séance', 'Étoiles gagnées, découvertes… et une activité hors écran liée à l’histoire, que le parent confirmera.')
        await pg.mouse.wheel(0, 400); await w(pg, 5.0)
        await pg.get_by_role('button', name='👋 Au revoir').click(); await w(pg, 1.5)

        # ---------- 4. Génération d'une histoire 3D ----------
        await cap(pg, '4 · Génération 3D', 'Le parent ajoute un livre : un simple texte devient une histoire en 3D, scène par scène.')
        await card(pg, 'CHAPITRE 4', 'Générer une histoire en 3D', 'D’un texte à un film 3D : décors, personnages, actions.')
        await parent_login(pg)
        await pg.get_by_role('tab', name='Livres').click(); await w(pg, 1.2)
        await pg.get_by_role('button', name='＋ Ajouter un livre').click(); await w(pg, 1.2)
        await cap(pg, '4 · Import', 'Fichier TXT, PDF, DOCX… ou texte collé. Ici, l’histoire de Nour, le petit dragon.')
        await pg.get_by_role('button', name='📋 Coller un texte').click(); await w(pg, 0.8)
        await pg.locator('#bk-title').press_sequentially('Nour, le petit dragon', delay=40)
        await pg.locator('#bk-paste').fill(NOUR); await w(pg, 2.5)
        await pg.get_by_role('button', name='⚙️ Préparer le livre').click(); await w(pg, 0.5)
        await cap(pg, '4 · Analyse', 'Extraction, nettoyage, découpage en pages, niveau de lecture, scènes 3D, contrôle du contenu.')
        await w(pg, 3.5)
        await cap(pg, '4 · Script de scène', 'Pour chaque page : le décor, les personnages nommés (« Nour » est reconnu comme le dragon) et leurs actions (voler, marcher…). Rien qui ne soit pas dans le texte.')
        await pg.mouse.wheel(0, 500); await w(pg, 3.5)
        await pg.mouse.wheel(0, 600); await w(pg, 3.5)
        await pg.mouse.wheel(0, 900); await w(pg, 1.0)
        await cap(pg, '4 · Approbation', 'Rien n’est visible par l’enfant avant l’approbation du parent.')
        await pg.get_by_role('button', name='✓ Approuver et publier').click(); await w(pg, 2.5)
        await pg.get_by_role('button', name='🔓 Quitter').click(); await w(pg, 1.0)
        await child_login(pg)
        await pg.locator('.book-card', has_text='Nour').click(); await w(pg, 2.5)
        await cap(pg, '4 · Film 3D généré', 'Le film 3D est composé en temps réel à partir du script : caméra, décors, personnages, voix et sous-titres synchronisés.')
        await pg.get_by_role('button', name='▶ Regarder le film').click(); await w(pg, 1.5)
        await pg.locator('.film-card .btn-primary').click(); await w(pg, 11.0)
        await cap(pg, '4 · Film 3D généré', 'Page 3 : l’oiseau arrive du ciel, parce que le texte dit qu’il « se posa ».')
        await pg.locator('.film-chapter').nth(2).click(); await w(pg, 9.0)
        await cap(pg, '4 · Film 3D généré', 'Dernière page : Nour descend au village et les enfants s’approchent.')
        await pg.locator('.film-chapter').nth(5).click(); await w(pg, 10.0)
        await cap(pg, '4 · Personnages', 'Ici aussi, on peut toucher un personnage : le film se met en pause.')
        await pg.locator('.char-label').first.click(); await w(pg, 3.0)
        await pg.get_by_role('button', name='Arrêter la lecture').click(); await w(pg, 0.6)
        await pg.locator('[role=dialog] button', has_text='Arrêter la lecture').click(); await w(pg, 1.2)
        await pg.get_by_role('button', name='👋 Au revoir').click(); await w(pg, 1.2)

        # ---------- 5. Cours en 3D ----------
        await cap(pg, '5 · Cours en 3D', 'Les livres éducatifs suivent un parcours : Lire → Vidéo → Explorer → Animer → Explique-moi → Quiz.')
        await card(pg, 'CHAPITRE 5', 'Un cours en 3D : le cœur', 'Lire, regarder, explorer, animer, comprendre, tester.')
        await child_login(pg)
        await pg.locator('.book-card', has_text='cœur').click(); await w(pg, 1.5)
        await pg.get_by_role('button', name='🔬 Commencer').click(); await w(pg, 2.5)
        await cap(pg, '5 · Lire', 'Le concept sous sa forme la plus simple, avec les mêmes aides que les histoires.')
        await w(pg, 3.0)
        await pg.locator('.edu-steps .chip', has_text='Vidéo').click(); await w(pg, 1.2)
        await cap(pg, '5 · Vidéo', 'La vidéo du cours, en chapitres. Chaque chapitre est expliqué par écrit.')
        await pg.locator('.need-card').nth(1).click(); await w(pg, 0.5)
        await pg.locator('.vplayer-big').click(); await w(pg, 7.0)
        await pg.locator('.edu-steps .chip', has_text='Explorer').click(); await w(pg, 2.5)
        await cap(pg, '5 · Explorer', 'Un modèle 3D du cœur : on touche chaque partie pour savoir à quoi elle sert.')
        await pg.locator('.char-label', has_text='Ventricule gauche').click(); await w(pg, 3.0)
        await pg.locator('.char-label', has_text='Aorte').click(); await w(pg, 2.5)
        await cap(pg, '5 · Explorer', 'On peut le faire tourner pour le voir sous tous les angles.')
        for _ in range(3):
            await pg.get_by_role('button', name='Tourner vers la droite').click(); await w(pg, 0.7)
        await w(pg, 1.5)
        for _ in range(3):
            await pg.get_by_role('button', name='Tourner vers la gauche').click(); await w(pg, 0.4)
        await pg.locator('.edu-steps .chip', has_text='Animer').click(); await w(pg, 1.0)
        await cap(pg, '5 · Animer', 'Le trajet du sang s’anime : ● le sang qui a besoin d’oxygène, ▲ le sang plein d’oxygène (formes, pas seulement couleurs).')
        await w(pg, 7.0)
        await pg.locator('.edu-steps .chip', has_text='Explique-moi').click(); await w(pg, 1.0)
        await cap(pg, '5 · Explique-moi', 'Sidi Hkeya explique simplement ce qui vient d’être montré.')
        await w(pg, 4.0)
        await pg.locator('.edu-steps .chip', has_text='Quiz').click(); await w(pg, 1.2)
        await cap(pg, '5 · Quiz adaptatif', 'Le quiz s’adapte : après une erreur, un indice ; après deux, une question plus facile. Les résultats vont au tableau de bord.')
        await answer_until_right(pg); await w(pg, 3.0)
        if await pg.get_by_role('button', name='Question suivante →').count():
            await pg.get_by_role('button', name='Question suivante →').click(); await w(pg, 1.5)
            if await pg.locator('.question-card .choice-btn').count():
                await answer_until_right(pg)
            else:
                # question « touche dans le modèle »
                for part in ['Aorte', 'Ventricule gauche', 'Ventricule droit', 'Oreillette droite']:
                    btn = pg.locator('.question-card button', has_text=part)
                    if await btn.count() and not await pg.locator('.question-card [data-state="correct"]').count():
                        await btn.first.click(); await w(pg, 1.4)
            await w(pg, 2.5)
        await pg.locator('[aria-label="Arrêter la lecture"]').click(); await w(pg, 1.5)
        await pg.get_by_role('button', name='👋 Au revoir').click(); await w(pg, 1.2)

        # ---------- 6. Espace parent ----------
        await cap(pg, '6 · Espace parent', 'Protégé par un appui long et le code parent.')
        await card(pg, 'CHAPITRE 6', 'L’espace parent', 'Suivi, observations, temps, récompenses, activités hors écran.')
        await parent_login(pg)
        await cap(pg, '6 · Famille', 'Temps du jour, étoiles, marque-page, activités hors écran à confirmer, défis en famille.')
        await w(pg, 2.5)
        await pg.mouse.wheel(0, 450); await w(pg, 2.0)
        if await pg.get_by_role('button', name=re.compile('est fait')).count():
            await pg.get_by_role('button', name=re.compile('est fait')).first.click(); await w(pg, 2.0)
        await pg.mouse.wheel(0, -450); await w(pg, 0.6)
        await pg.get_by_role('tab', name='Suivi').click(); await w(pg, 1.5)
        await cap(pg, '6 · Suivi', 'Observations pédagogiques, jamais de diagnostic. Le parent applique lui-même une suggestion : rien ne change en silence.')
        await w(pg, 3.0)
        await pg.mouse.wheel(0, 500); await w(pg, 4.0)
        await pg.mouse.wheel(0, -500); await w(pg, 0.5)
        await pg.get_by_role('tab', name='Réglages').click(); await w(pg, 1.5)
        await cap(pg, '6 · Temps et pauses', 'Durée par séance, plafond par jour, plages horaires, pauses, objectif, récompenses réelles, droits de l’enfant.')
        await pg.mouse.wheel(0, 1250); await w(pg, 4.5)
        await pg.mouse.wheel(0, -1250); await w(pg, 0.5)
        await pg.get_by_role('tab', name='Récompenses').click(); await w(pg, 1.5)
        await cap(pg, '6 · Récompenses', 'Journal d’étoiles en ajout seul : une étoile gagnée n’est jamais retirée.')
        await w(pg, 3.5)
        await pg.get_by_role('tab', name='Données').click(); await w(pg, 1.2)
        await cap(pg, '6 · Données', 'Minimum de données, codes hachés, export et suppression à tout moment.')
        await w(pg, 3.5)

        # ---------- 7. Arabe ----------
        await cap(pg, '7 · Bilingue', 'Toute la plateforme existe en arabe, de droite à gauche.')
        await pg.get_by_role('button', name='العربية').click(); await w(pg, 2.0)
        await pg.get_by_role('tab', name='العائلة').click(); await w(pg, 2.5)
        await pg.get_by_role('button', name='🔓 خروج').click(); await w(pg, 1.0)
        await pg.get_by_role('button', name='Lina', exact=True).click(); await w(pg, 0.6)
        for n in ['شمس', 'قمر', 'نجمة']:
            await pg.get_by_role('button', name=n, exact=True).click(); await w(pg, 0.3)
        await w(pg, 2.0)
        await pg.locator('.book-card').first.click(); await w(pg, 1.5)
        await pg.locator('.film-choice .btn').nth(1).click(); await w(pg, 2.5)
        await cap(pg, '7 · Bilingue', 'Cendrillon en arabe : texte, explications, définitions et questions.')
        await pg.locator('.explain-btn').first.click(); await w(pg, 4.0)

        # ---------- Fin ----------
        await cap(pg, 'Kan Ya Makan', 'Kan Ya Makan — outil de soutien à la lecture et à la compréhension, pas un outil médical.')
        await card(pg, 'MERCI', 'Kan Ya Makan — كان يا مكان', 'Chaque livre devient une histoire qu’on voit, à la mesure de chaque enfant.', 5.0)

        await ctx.close()
        video = await pg.video.path()
        await b.close()
    json.dump({'video': video, 'captions': captions, 'duration': round(now(), 2)}, open(OUT + 'captions.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('VIDEO', video, 'DURATION', round(now(), 1))

asyncio.run(main())
