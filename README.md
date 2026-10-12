# Kan Ya Makan — كان يا مكان

**Le livre devient une expérience 3D adaptée au profil de l'enfant, sous le contrôle des parents.**

Prototype d'atelier du document unifié (6.16), étendu (version 2) avec les fonctions des chapitres 6 et 6 bis : film 3D de toute l'histoire, création de compte parent avec les besoins de l'enfant, adaptation du site entier au daltonisme, livre éducatif Explorer, import de livres, activités hors écran. Interface en français et en arabe (droite à gauche). Pas de serveur : tout tourne dans le navigateur.

## Contenus du catalogue (version 3)

| Livre | Vidéo | Ce qui s'y ajoute |
|---|---|---|
| **Cendrillon** (d'après Perrault, domaine public, raconté avec nos mots) | `public/videos/cendrillon.mp4` (8 min 08) + copie `.webm` | 11 scènes calées sur la vidéo (`clip: [début, fin]`), texte FR/AR avec version simplifiée, explications de Sidi Hkeya, définitions, ce que ressent chaque personnage, questions, activités hors écran |
| **Le cœur, une pompe magique** (livre éducatif) | `public/videos/coeur.mp4` (coupée à 1 min 58 : la fin était un écran vide) + copie `.webm` | Nouvelle étape **Vidéo** : 7 chapitres décrits en FR/AR (signal électrique, valves, poumons O₂/CO₂, voyage du sang), puis Explorer 3D, Animer, Explique-moi, Quiz (2 questions sur la vidéo) |

- **Regarder** joue la vidéo de toute l'histoire, découpée en scènes : chapitres, bandeau « Ce qui se passe » (le texte de la page, toujours disponible sans le son), personnages à toucher (la vidéo se met en pause), pauses proposées, minuteur, étoiles, marque-page. Rien ne démarre seul.
- **Lire page par page** : chaque page joue son extrait vidéo à côté du texte (muet pendant la voix de lecture).
- Les textes ne sont **pas** une transcription de la bande son (la transcription automatique n'était pas disponible) : ils racontent ce que montrent les images, scène par scène.
- Les deux vidéos viennent de l'équipe : **vérifier les droits** avant toute diffusion publique (6 bis D « Droits », annexe C).
- « Nour, le petit dragon » (`src/data/story.js`) reste dans le code comme exemple de **film 3D généré depuis un script** : c'est ce moteur qui anime les livres importés sans vidéo.
- Les vidéos existent en MP4 (H.264) et en WebM (VP9) : Chrome, Edge, Firefox, Safari et les Chromium sans H.264 les lisent.

## Vidéo de démonstration

`scripts/record_demo.py` rejoue tout le parcours dans un vrai navigateur (Playwright) et enregistre la vidéo, avec un bandeau de sous-titres explicatifs synchronisé et des cartons de chapitre : premier lancement et couleurs, compte parent et besoins de l'enfant, Cendrillon (vidéo + lecture), génération d'une histoire 3D à partir d'un texte, cours 3D sur le cœur, espace parent, arabe.

```bash
npm run build && npm run preview          # http://localhost:4173
pip install playwright && python3 scripts/record_demo.py   # vidéo dans demo_out/
```

La génération 3D d'un livre importé : une page par paragraphe (max 60 s), décor et ambiance d'après les mots-clés, personnages par leur type, par leur nom présenté dans le texte (« Il s'appelait Nour ») ou par groupe présent (« les enfants s'approchèrent »), et les verbes deviennent des animations (« se posa » → l'oiseau arrive du ciel, « descendit » → entrée en marchant, « baissa la tête », « regardait », « riaient »).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 18 tests (moteurs + contenus Cendrillon et cœur)
npm run build      # version statique dans dist/ (installable, lecture hors ligne en HTTPS)
```

## Premier lancement

1. **Couleurs** : le tout premier écran demande « Voyez-vous bien toutes les couleurs ? » (5 réponses ou un mini-test de 30 s). Le site entier s'adapte immédiatement.
2. **Accueil** : *Créer un compte parent* ou *Essayer avec la famille de démo*.
3. **Compte parent** : email, mot de passe, pays, code parent à 4 chiffres, consentements.
4. **Ajouter l'enfant** : surnom, âge, avatar → *Qu'avez-vous remarqué ?* (lecture, attention, compréhension, couleurs + mini-test, audition, parole) → code en 3 images → consentement → réglages proposés avec aperçu en direct.

### Famille de démo

| Qui | Accès | Profil |
|---|---|---|
| Parent | `demo@kanyamakan.tn` / `demo1234`, code parent **1234** | — |
| Amine 🦊 | ☀️ 🌙 ⭐ | Difficultés à lire (dyslexie) |
| Sami 🦉 | 🐟 🌸 🍎 | Attention (TDAH) + confond rouge et vert |

## Fonctions et correspondance avec le document

| Fonction | Document | Fichiers |
|---|---|---|
| **Film 3D continu de toute l'histoire** : caméra et personnages animés par images clés, voix synchronisée phrase par phrase (l'image attend la voix), sous-titres avec le mot en cours, chapitres, pause, toucher un personnage met en pause et révèle ce qu'il ressent, fondus entre scènes, génériques | 6.3 Regarder, 6 bis D/E | `engine/film.js`, `components/three/FilmStage.jsx`, `screens/Film.jsx`, pistes `film` dans `data/story.js` |
| Scène de chaque page = extrait du film, qui suit la narration ou se joue avec ▶ | 6.14 écran 4 | `components/Scene3D.jsx` |
| **Question sur la vision des couleurs au premier lancement**, mini-test, palettes sûres (Okabe-Ito) sur tout le site, motifs et contours sur les états, **filtre de correction par matrice** (daltonisation) sur toute l'app et les scènes 3D, vision sans couleurs, contraste élevé, réduction des animations | 6.6, 6.15, 6 bis B | `screens/Vision.jsx`, `components/ColorTest.jsx`, `components/A11yLayer.jsx`, `engine/vision.js`, `styles/global.css` |
| **Création du compte parent** (email + mot de passe hachés, pays, code parent, consentements), connexion avec verrouillage, déconnexion, suppression du compte | 6.7, 6.13 B, 6 bis H | `screens/Signup.jsx`, `screens/Login.jsx`, `screens/Welcome.jsx` |
| **Besoins de l'enfant dès l'inscription** → préréglage + palette + sous-titres + grands boutons (jamais un diagnostic, modifiable dans les réglages) | 6.6, 6.8 | `screens/AddChild.jsx`, `engine/profileTest.js` (`profileFromNeeds`) |
| Préréglages Général / Dyslexie / TDAH / Dyslexie + TDAH / **Compréhension** ; test de profil | 6.6, 6.8, 6.15 | `data/presets.js`, `screens/ProfileTest.jsx` |
| **Livre éducatif** : Lire → Explorer (cœur 3D, parties à toucher, rotation) → Animer (trajet du sang, ● / ▲) → Explique-moi → Quiz (QCM, vrai/faux, toucher dans le modèle, remettre dans l'ordre) avec **ajusteur de difficulté** et indices | 6.5, écran 5 | `screens/Explore.jsx`, `components/three/Heart.jsx`, `data/eduBooks.js`, `engine/quiz.js` |
| **Ajouter un livre** : TXT, PDF, DOCX ou texte collé → étapes visibles (extraction, nettoyage, découpage en pages de 30–60 s sans couper de phrase, niveau, scènes par mots-clés, contrôle de contenu) → aperçu → approbation parent → visible pour les enfants choisis | 6.2, 6.13 C, 6 bis C, écran 10 | `screens/ImportBook.jsx`, `engine/extract.js`, `engine/importBook.js` |
| **Activités hors écran** liées au livre à la fin de la séance, confirmées par le parent (+2 ⭐, badge), **défis en famille**, **équilibre** lecture / pauses / activités | 6.10, 6.13 F | `data/offline.js`, `screens/Finished.jsx`, onglet Famille |
| Sidi Hkeya **qui évolue** avec les étoiles, **coffre** à ouvrir pour une récompense en attente, gag de la chechia | 6.9, Identité | `components/SidiHkeya.jsx`, `engine/rewards.js` |
| Jours autorisés dans la plage horaire, **signaler un problème**, livres du catalogue / importés / en attente | 6.9, 6 bis H | `screens/ChildSettings.jsx`, onglet Livres |
| Application installable et **lecture hors ligne** | 6 bis A | `public/sw.js`, `public/manifest.webmanifest` |
| (v1) Lire / Écouter / Regarder, aide sur un mot et une phrase, mode concentration, règle, minuteur doux, pauses, objectif, journal d'étoiles non modifiable, observations pédagogiques, export / suppression | 6.3–6.11 | voir `src/` |

## Ce qui reste pour la version finale

- **Serveur** : les données sont dans `localStorage`. Passage à Supabase (Auth + PostgreSQL, tables 6 bis H) ; temps de séance compté côté serveur.
- **IA** : texte simplifié, explications, définitions et questions des livres importés ; « Créer une histoire » par prompt ; OCR des photos (tesseract.js). Les boutons existent, marqués « version finale ».
- **Voix** : voix du navigateur. Sans voix arabe sur l'appareil, le film et le surlignage fonctionnent quand même (durées estimées), sans son. Version finale : voix cloud avec horodatage des mots.
- **Assets 3D** : primitives Three.js. Pour des modèles Blender : exporter en `.glb` dans `public/models/` et remplacer `Dragon`, `Bird`, `Child` dans `components/three/kit.jsx` (les pistes du film ne changent pas).
- **Filtre de correction** : à valider avec des personnes daltoniennes et des simulateurs (annexe A).

## Structure

```
src/
  data/        histoire + pistes du film, livre éducatif, préréglages, Sidi Hkeya, activités hors écran, bibliothèque
  engine/      logique pure et testée : film, vision, texte, adaptation, voix, temps, récompenses, quiz, import, observations
  state/       store (reducer) v2 : compte, vision, enfants, séances, journal, livres, activités
  i18n/        fr.js, ar.js (toutes les clés vérifiées dans les deux langues)
  components/  three/ (kit 3D, plateau du film, cœur), couche d'accessibilité, Sidi Hkeya, lecteur de texte, UI
  screens/     un fichier par écran (Vision, Welcome, Signup, Login, WhoReads, ChooseBook, GetReady, Reader, Film, Explore, Finished, ParentSpace, ImportBook…)
tests/         npm test
```

**Écrire le film d'une nouvelle histoire** : ajouter à chaque scène un bloc `film` avec `camera` (`[t, position, cible]`), `actors` (`[t, position, rotation, action]`) et `sounds` (`[t, type]`), `t` allant de 0 à 1 dans la scène. La durée réelle vient de la narration. Sans bloc `film`, une piste par défaut est utilisée (livres importés).
