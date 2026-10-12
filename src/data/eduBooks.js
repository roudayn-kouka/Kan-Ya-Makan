/**
 * Livre éducatif (6.5) : Lire → Explorer (3D) → Animer → Explique-moi → Quiz.
 * Modèle simplifié du cœur, clairement présenté comme un schéma, pas une image médicale.
 * Orientation : vue de face, comme si l'enfant regardait quelqu'un en face de lui :
 * le côté GAUCHE du cœur est donc à DROITE de l'écran (expliqué dans « Explique-moi »).
 */

export const HEART_PARTS = {
  oreillette_droite: {
    name: { fr: 'Oreillette droite', ar: 'الأذين الأيمن' },
    desc: {
      fr: 'Elle reçoit le sang qui revient du corps. Ce sang a déjà donné son oxygène.',
      ar: 'يستقبل الدم العائد من الجسم. هذا الدم أعطى الأكسجين الذي كان فيه.',
    },
  },
  ventricule_droit: {
    name: { fr: 'Ventricule droit', ar: 'البطين الأيمن' },
    desc: {
      fr: 'Il pousse le sang vers les poumons, pour qu\'il reprenne de l\'oxygène.',
      ar: 'يدفع الدم نحو الرئتين ليأخذ الأكسجين من جديد.',
    },
  },
  oreillette_gauche: {
    name: { fr: 'Oreillette gauche', ar: 'الأذين الأيسر' },
    desc: {
      fr: 'Elle reçoit le sang qui revient des poumons, plein d\'oxygène.',
      ar: 'يستقبل الدم العائد من الرئتين، وهو مليء بالأكسجين.',
    },
  },
  ventricule_gauche: {
    name: { fr: 'Ventricule gauche', ar: 'البطين الأيسر' },
    desc: {
      fr: 'C\'est la partie la plus forte : elle envoie le sang dans tout le corps.',
      ar: 'هو الجزء الأقوى: يرسل الدم إلى كل الجسم.',
    },
  },
  aorte: {
    name: { fr: 'Aorte', ar: 'الأبهر' },
    desc: {
      fr: 'Le grand tuyau qui part du cœur et emmène le sang vers le corps.',
      ar: 'الأنبوب الكبير الذي يخرج من القلب ويحمل الدم إلى الجسم.',
    },
  },
};

/** Trajet du sang, dans l'ordre (utilisé par l'animation et la question « remets dans l'ordre »). */
export const BLOOD_PATH = ['oreillette_droite', 'ventricule_droit', 'poumons', 'oreillette_gauche', 'ventricule_gauche', 'aorte'];
export const PATH_NAMES = {
  poumons: { fr: 'Poumons', ar: 'الرئتان' },
};

/**
 * Banque de questions à trois niveaux (1 = très court, 2 = standard, 3 = plus difficile).
 * Types : qcm, vf (vrai ou faux), touch (toucher la partie dans le modèle 3D), order (remettre dans l'ordre).
 */
export const HEART_QUESTIONS = [
  { id: 'q1', concept: 1, level: 1, type: 'vf',
    fr: { q: 'Le cœur pompe le sang dans tout le corps.', answer: true, hint: 'Relis la première phrase !' },
    ar: { q: 'القلب يضخ الدم في كل الجسم.', answer: true, hint: 'أعد قراءة الجملة الأولى!' } },
  { id: 'q2', concept: 1, level: 1, type: 'qcm',
    fr: { q: 'Le cœur est gros comme…', choices: ['ton poing', 'un ballon'], correct: 0, hint: 'Ferme ta main et regarde-la.' },
    ar: { q: 'حجم القلب مثل…', choices: ['قبضة يدك', 'كرة'], correct: 0, hint: 'أغلق يدك وانظر إليها.' } },
  { id: 'q3', concept: 1, level: 2, type: 'qcm',
    fr: { q: 'Quelle partie envoie le sang dans tout le corps ?', choices: ['Le ventricule gauche', 'L\'oreillette droite', 'Les poumons'], correct: 0, hint: 'C\'est la partie la plus forte.' },
    ar: { q: 'أي جزء يرسل الدم إلى كل الجسم؟', choices: ['البطين الأيسر', 'الأذين الأيمن', 'الرئتان'], correct: 0, hint: 'إنه الجزء الأقوى.' } },
  { id: 'q4', concept: 1, level: 3, type: 'touch', target: 'aorte',
    fr: { q: 'Touche l\'aorte dans le modèle 3D.', hint: 'C\'est le grand tuyau qui part vers le haut.' },
    ar: { q: 'المس الأبهر في النموذج ثلاثي الأبعاد.', hint: 'إنه الأنبوب الكبير المتجه إلى الأعلى.' } },
  { id: 'q5', concept: 2, level: 1, type: 'vf',
    fr: { q: 'Le sang passe par les poumons pour prendre de l\'oxygène.', answer: true, hint: 'Regarde l\'animation : où change le sang ?' },
    ar: { q: 'يمر الدم عبر الرئتين ليأخذ الأكسجين.', answer: true, hint: 'شاهد الحركة: أين يتغير الدم؟' } },
  { id: 'q6', concept: 2, level: 2, type: 'qcm',
    fr: { q: 'Où va le sang qui sort du ventricule droit ?', choices: ['Vers les poumons', 'Vers les pieds', 'Vers l\'aorte'], correct: 0, hint: 'Il doit d\'abord reprendre de l\'oxygène.' },
    ar: { q: 'إلى أين يذهب الدم الخارج من البطين الأيمن؟', choices: ['نحو الرئتين', 'نحو القدمين', 'نحو الأبهر'], correct: 0, hint: 'يجب أن يأخذ الأكسجين أولا.' } },
  { id: 'q7', concept: 2, level: 3, type: 'order',
    items: ['ventricule_droit', 'poumons', 'ventricule_gauche'],
    fr: { q: 'Remets le voyage du sang dans l\'ordre : touche les étapes une par une.', hint: 'D\'abord le côté droit, puis les poumons, puis le côté gauche.' },
    ar: { q: 'رتب رحلة الدم: المس المراحل واحدة بعد الأخرى.', hint: 'أولا الجهة اليمنى، ثم الرئتان، ثم الجهة اليسرى.' } },
  { id: 'q8', concept: 2, level: 2, type: 'touch', target: 'ventricule_gauche',
    fr: { q: 'Touche la partie qui envoie le sang dans tout le corps.', hint: 'Elle est en bas, à droite de l\'écran.' },
    ar: { q: 'المس الجزء الذي يرسل الدم إلى كل الجسم.', hint: 'إنه في الأسفل، على يمين الشاشة.' } },
  { id: 'q9', concept: 1, level: 2, type: 'qcm', video: true,
    fr: { q: 'Dans la vidéo, les valves du cœur sont comme…', choices: ['des portes', 'des roues', 'des yeux'], correct: 0, hint: 'Elles s’ouvrent et se ferment.' },
    ar: { q: 'في الفيديو، صمامات القلب مثل…', choices: ['الأبواب', 'العجلات', 'العيون'], correct: 0, hint: 'تنفتح وتنغلق.' } },
  { id: 'q10', concept: 2, level: 2, type: 'qcm', video: true,
    fr: { q: 'Dans les poumons, le sang prend…', choices: ['de l’oxygène', 'du sucre', 'de l’eau'], correct: 0, hint: 'Regarde les lettres O₂ dans la vidéo.' },
    ar: { q: 'في الرئتين، يأخذ الدم…', choices: ['الأكسجين', 'السكر', 'الماء'], correct: 0, hint: 'انظر إلى الحرفين O₂ في الفيديو.' } },
];

/**
 * Vidéo du cours (fournie par l'équipe, public/videos/coeur.mp4, coupée à 1 min 58 :
 * les dernières secondes étaient un écran vide). Chapitres décrits par nous, d'après les images.
 * Le texte de chaque chapitre est l'équivalent écrit de ce que montre la vidéo (6.15).
 */
export const HEART_VIDEO = {
  src: './videos/coeur.mp4',
  webm: './videos/coeur.webm', // copie VP9 pour les navigateurs sans H.264
  duration: 118,
  credit: 'Vidéo fournie par l’équipe (droits à vérifier avant diffusion publique)',
  chapters: [
    { start: 0, end: 11, concept: 1, poster: './videos/coeur/p_3.jpg',
      title: { fr: 'Le cœur dans le corps', ar: 'القلب في الجسم' },
      desc: { fr: 'Le cœur est au milieu de la poitrine. Des tuyaux rouges et bleus partent de lui vers tout le corps.', ar: 'القلب في وسط الصدر. أنابيب حمراء وزرقاء تخرج منه نحو كل الجسم.' } },
    { start: 11, end: 30, concept: 1, poster: './videos/coeur/p_20.jpg',
      title: { fr: 'Le signal qui fait battre le cœur', ar: 'الإشارة التي تجعل القلب ينبض' },
      desc: { fr: 'On voit l’intérieur du cœur et ses quatre cavités. Une ligne jaune montre un petit signal électrique : à chaque signal, le cœur se serre. C’est un battement.', ar: 'نرى داخل القلب وتجاويفه الأربعة. خط أصفر يبين إشارة كهربائية صغيرة: مع كل إشارة ينقبض القلب. هذه نبضة.' } },
    { start: 30, end: 48, concept: 1, poster: './videos/coeur/p_40.jpg',
      title: { fr: 'Les valves, les portes du cœur', ar: 'الصمامات، أبواب القلب' },
      desc: { fr: 'Les valves s’ouvrent pour laisser passer le sang, puis se ferment pour qu’il ne revienne pas en arrière, comme des portes.', ar: 'الصمامات تنفتح ليمر الدم، ثم تنغلق حتى لا يعود إلى الوراء، مثل الأبواب.' } },
    { start: 48, end: 57, concept: 2, poster: './videos/coeur/p_52.jpg',
      title: { fr: 'Direction les poumons', ar: 'نحو الرئتين' },
      desc: { fr: 'Le côté droit du cœur envoie le sang vers les poumons.', ar: 'الجهة اليمنى من القلب ترسل الدم نحو الرئتين.' } },
    { start: 57, end: 76, concept: 2, poster: './videos/coeur/p_66.jpg',
      title: { fr: 'Dans les poumons : l’oxygène', ar: 'في الرئتين: الأكسجين' },
      desc: { fr: 'Dans de toutes petites bulles d’air, le sang prend l’oxygène (O₂) et laisse le gaz carbonique (CO₂), qu’on rejette en soufflant.', ar: 'في فقاعات هواء صغيرة جدا، يأخذ الدم الأكسجين ويترك ثاني أكسيد الكربون، الذي نخرجه عند الزفير.' } },
    { start: 76, end: 95, concept: 2, poster: './videos/coeur/p_66.jpg',
      title: { fr: 'Retour au cœur', ar: 'العودة إلى القلب' },
      desc: { fr: 'Le sang plein d’oxygène revient dans le cœur, qui continue de battre.', ar: 'الدم المليء بالأكسجين يعود إلى القلب الذي يواصل النبض.' } },
    { start: 95, end: 118, concept: 2, poster: './videos/coeur/p_100.jpg',
      title: { fr: 'Le voyage dans tout le corps', ar: 'الرحلة في كل الجسم' },
      desc: { fr: 'Le cœur envoie le sang jusqu’aux bras, aux jambes et aux pieds. Les globules rouges transportent l’oxygène partout.', ar: 'القلب يرسل الدم حتى الذراعين والساقين والقدمين. الكريات الحمراء تنقل الأكسجين إلى كل مكان.' } },
  ],
};

export const EDU_BOOKS = [
  {
    id: 'coeur',
    type: 'edu',
    title: { fr: 'Le cœur, une pompe magique', ar: 'القلب، مضخة عجيبة' },
    summary: { fr: 'Explore le cœur en 3D et suis le voyage du sang.', ar: 'اكتشف القلب بالأبعاد الثلاثة وتابع رحلة الدم.' },
    ageRange: '8-12',
    durationMin: 6,
    cover: '❤️',
    model: 'coeur',
    video: HEART_VIDEO,
    coverImg: './videos/coeur/p_20.jpg',
    characters: {},
    offline: [
      {
        fr: 'Pose ta main sur ta poitrine et compte tes battements pendant que quelqu\'un compte jusqu\'à 15. Puis saute 20 fois et recommence : que remarques-tu ?',
        ar: 'ضع يدك على صدرك وعد دقات قلبك بينما يعد شخص حتى 15. ثم اقفز 20 مرة وأعد: ماذا تلاحظ؟',
      },
    ],
    scenes: [
      {
        id: 1,
        where: { fr: 'Le cœur', ar: 'القلب' },
        explore: { focus: null, animate: false },
        characters: [],
        fr: {
          sentences: [
            {
              t: 'Le cœur pompe le sang dans tout le corps.',
              simple: 'Le cœur envoie le sang partout dans le corps.',
              explain: 'Le cœur est comme une pompe : il serre et se relâche sans arrêt, jour et nuit, pour faire bouger le sang.',
            },
            {
              t: 'C\'est un muscle à peu près gros comme ton poing.',
              simple: 'C\'est un muscle. Il est gros comme ton poing.',
              explain: 'Un muscle peut se serrer. Ferme ta main très fort puis ouvre-la : ton cœur fait un peu la même chose, environ 80 fois par minute.',
            },
          ],
          definitions: {
            pompe: 'Une machine qui pousse un liquide pour le faire avancer.',
            muscle: 'Une partie du corps qui peut se serrer et se relâcher pour faire bouger.',
            sang: 'Le liquide rouge qui circule dans le corps et transporte ce dont il a besoin.',
          },
          explore: 'Voici un modèle simplifié du cœur. Touche chaque partie pour savoir à quoi elle sert. Attention : c\'est comme si tu regardais quelqu\'un en face, donc le côté gauche du cœur est à droite de ton écran !',
        },
        ar: {
          sentences: [
            {
              t: 'القلب يضخ الدم في كل الجسم.',
              simple: 'القلب يرسل الدم إلى كل مكان في الجسم.',
              explain: 'القلب مثل المضخة: ينقبض وينبسط دون توقف، ليلا ونهارا، ليحرك الدم.',
            },
            {
              t: 'إنه عضلة حجمها تقريبا مثل قبضة يدك.',
              simple: 'إنه عضلة. حجمه مثل قبضة يدك.',
              explain: 'العضلة تستطيع أن تنقبض. أغلق يدك بقوة ثم افتحها: قلبك يفعل شيئا مشابها، حوالي 80 مرة في الدقيقة.',
            },
          ],
          definitions: {
            'يضخ': 'يدفع السائل ليتحرك إلى الأمام.',
            'عضلة': 'جزء من الجسم يستطيع أن ينقبض وينبسط ليحرك.',
            'الدم': 'السائل الأحمر الذي يجري في الجسم وينقل ما يحتاجه.',
          },
          explore: 'هذا نموذج مبسط للقلب. المس كل جزء لتعرف وظيفته. انتبه: كأنك تنظر إلى شخص أمامك، لذلك الجهة اليسرى من القلب تظهر على يمين شاشتك!',
        },
      },
      {
        id: 2,
        where: { fr: 'Le voyage du sang', ar: 'رحلة الدم' },
        explore: { focus: null, animate: true },
        characters: [],
        fr: {
          sentences: [
            {
              t: 'Le sang fait un grand voyage.',
              simple: 'Le sang voyage dans le corps.',
              explain: 'Le sang ne reste jamais au même endroit : il fait le tour du corps en moins d\'une minute !',
            },
            {
              t: 'Il passe par les poumons pour prendre de l\'oxygène, puis le cœur l\'envoie dans tout le corps.',
              simple: 'Il va aux poumons chercher de l\'oxygène. Puis le cœur l\'envoie partout.',
              explain: 'Le côté droit du cœur envoie le sang aux poumons. Là, il se recharge en oxygène. Il revient dans le côté gauche, qui l\'envoie dans tout le corps par l\'aorte.',
            },
          ],
          definitions: {
            poumons: 'Les deux organes dans ta poitrine qui se remplissent d\'air quand tu respires.',
            "l'oxygène": 'Une partie de l\'air dont ton corps a besoin pour vivre.',
            voyage: 'Un déplacement d\'un endroit à un autre.',
          },
          explore: 'Touche « Animer » pour voir le voyage du sang. Les petites boules ● montrent le sang qui a besoin d\'oxygène, les petits triangles ▲ le sang plein d\'oxygène.',
        },
        ar: {
          sentences: [
            {
              t: 'يقوم الدم برحلة كبيرة.',
              simple: 'الدم يسافر في الجسم.',
              explain: 'الدم لا يبقى أبدا في المكان نفسه: يدور حول الجسم في أقل من دقيقة!',
            },
            {
              t: 'يمر عبر الرئتين ليأخذ الأكسجين، ثم يرسله القلب إلى كل الجسم.',
              simple: 'يذهب إلى الرئتين ليأخذ الأكسجين. ثم يرسله القلب إلى كل مكان.',
              explain: 'الجهة اليمنى من القلب ترسل الدم إلى الرئتين. هناك يتزود بالأكسجين. ثم يعود إلى الجهة اليسرى التي ترسله إلى كل الجسم عبر الأبهر.',
            },
          ],
          definitions: {
            'الرئتين': 'العضوان في صدرك اللذان يمتلئان بالهواء عندما تتنفس.',
            'الأكسجين': 'جزء من الهواء يحتاجه جسمك ليعيش.',
            'رحلة': 'انتقال من مكان إلى آخر.',
          },
          explore: 'المس «حرك» لترى رحلة الدم. الكرات الصغيرة ● تمثل الدم الذي يحتاج إلى الأكسجين، والمثلثات الصغيرة ▲ الدم المليء بالأكسجين.',
        },
      },
    ],
  },
];
