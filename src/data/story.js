/**
 * Histoire du prototype, scriptée à la main (6.16).
 * Format = le « script de scène » JSON décrit en 6 bis C, étendu pour deux langues.
 *
 * Chaque scène contient :
 *  - decor / ambiance / camera : ce que le moteur 3D doit composer
 *  - characters : personnages présents, animation, émotion, texte révélé au toucher
 *    (au plus 3 points interactifs par page — garde-fou 4 bis)
 *  - sound : son de la page + son équivalent visuel (troubles auditifs)
 *  - fr / ar : phrases originales, version simplifiée (même nombre de phrases),
 *    explication contextuelle de chaque phrase (aide de Sidi Hkeya), définitions
 *  - question : question facultative de compréhension
 *
 * Règle de fidélité : rien dans la scène qui ne soit pas dans le texte.
 */

export const STORY = {
  id: 'nour',
  title: { fr: 'Nour, le petit dragon', ar: 'نور، التنين الصغير' },
  summary: {
    fr: 'Un petit dragon tout seul sur sa montagne rencontre un oiseau.',
    ar: 'تنين صغير وحيد فوق جبله يلتقي بعصفور.',
  },
  ageRange: '5-9',
  durationMin: 6,
  cover: '🐉',
  type: 'story',
  // Activités hors écran liées à l'histoire (6.10)
  offline: [
    {
      fr: 'Dessine Nour et son ami l\'oiseau, puis invente la première phrase de l\'histoire que Nour raconte aux enfants.',
      ar: 'ارسم نور وصديقه العصفور، ثم اخترع الجملة الأولى من الحكاية التي يحكيها نور للأطفال.',
    },
    {
      fr: 'Raconte à quelqu\'un de ta famille une histoire qui commence par « Kan ya makan… ».',
      ar: 'احك لشخص من عائلتك حكاية تبدأ بـ«كان يا مكان…».',
    },
  ],
  characters: {
    dragon: { name: { fr: 'Nour', ar: 'نور' }, shape: '▲' },
    oiseau: { name: { fr: "L'oiseau", ar: 'العصفور' }, shape: '●' },
    yasmine: { name: { fr: 'Yasmine', ar: 'ياسمين' }, shape: '■' },
    adam: { name: { fr: 'Adam', ar: 'آدم' }, shape: '◆' },
  },
  scenes: [
    {
      id: 1,
      decor: 'montagne',
      ambiance: 'matin',
      camera: 'plan_large',
      duree_s: 45,
      film: {
        // Le film s'ouvre sur toute la montagne, puis descend vers Nour.
        camera: [[0, [0, 7.5, 17], [0, 2.5, -3]], [0.5, [3.2, 3.2, 8.5], [0, 1.2, 0]], [1, [1.6, 2.4, 6.2], [0, 1.4, 0]]],
        actors: {
          dragon: [[0, [0, 0, 0], 0, 'respirer'], [0.45, [0, 0, 0], 0.35, 'regarder'], [0.8, [0, 0, 0], 0.15, 'respirer']],
        },
        sounds: [[0.02, 'vent']],
      },
      where: { fr: 'Au sommet de la montagne', ar: 'في قمة الجبل' },
      sound: { type: 'vent', visual: 'particules' },
      characters: [
        {
          id: 'dragon', position: [0, 0], animation: 'respirer', emotion: 'curieux',
          reveal: {
            fr: 'Nour se sent curieux. Il pense : « Qu\'y a-t-il en bas, dans la vallée ? »',
            ar: 'نور يشعر بالفضول. يفكر: ماذا يوجد في الأسفل، في الوادي؟',
          },
        },
      ],
      fr: {
        sentences: [
          {
            t: "Un petit dragon vivait au sommet d'une montagne.",
            simple: 'Un petit dragon habite en haut d\'une montagne.',
            explain: "L'histoire commence : on découvre où habite le héros. Il vit tout en haut, loin des autres.",
          },
          {
            t: 'Il s\'appelait Nour, et ses écailles brillaient comme le soleil du matin.',
            simple: 'Il s\'appelle Nour. Sa peau brille comme le soleil.',
            explain: 'On apprend le nom du dragon. Ses écailles brillent comme le soleil : Nour veut justement dire « lumière ».',
          },
        ],
        definitions: {
          sommet: "Le point le plus haut d'une montagne.",
          'écailles': 'Les petites plaques dures qui couvrent la peau des poissons, des serpents et des dragons.',
          brillaient: 'Envoyaient de la lumière, comme une étoile.',
        },
      },
      ar: {
        sentences: [
          {
            t: 'كان يعيش تنين صغير في قمة جبل عال.',
            simple: 'تنين صغير يسكن فوق جبل.',
            explain: 'تبدأ الحكاية: نكتشف أين يسكن البطل. إنه يعيش في الأعلى، بعيدا عن الآخرين.',
          },
          {
            t: 'كان اسمه نور، وكانت حراشفه تلمع مثل شمس الصباح.',
            simple: 'اسمه نور. جلده يلمع مثل الشمس.',
            explain: 'نعرف اسم التنين. حراشفه تلمع مثل الشمس، واسمه نور يعني الضوء.',
          },
        ],
        definitions: {
          'قمة': 'أعلى نقطة في الجبل.',
          'حراشفه': 'قطع صغيرة صلبة تغطي جلد السمك والأفاعي والتنانين.',
          'تلمع': 'تعطي ضوءا مثل النجمة.',
        },
      },
      question: {
        fr: { q: 'Où vit le dragon ?', choices: ['Dans la mer', 'Sur une montagne', 'Dans une maison'], correct: 1 },
        ar: { q: 'أين يعيش التنين؟', choices: ['في البحر', 'فوق جبل', 'في منزل'], correct: 1 },
      },
    },
    {
      id: 2,
      decor: 'vallee',
      ambiance: 'matin',
      camera: 'plan_large',
      duree_s: 45,
      film: {
        // Par-dessus l'épaule de Nour, la caméra glisse vers le village de la vallée.
        camera: [[0, [-0.4, 3.1, 4.8], [-1.0, 1.4, -1.5]], [0.55, [0.6, 1.8, 3.4], [0.6, -2.6, -7]], [1, [2.4, 1.6, 4.6], [0.4, -2.6, -6.6]]],
        actors: {
          dragon: [[0, [-1.2, 0, 1], Math.PI, 'regarder'], [1, [-1.2, 0, 1], Math.PI, 'regarder']],
        },
        sounds: [],
      },
      where: { fr: 'Nour regarde la vallée', ar: 'نور ينظر إلى الوادي' },
      sound: null,
      characters: [
        {
          id: 'dragon', position: [-1.2, 0.6], animation: 'regarder', emotion: 'rêveur',
          reveal: {
            fr: 'Nour se sent un peu seul. Il pense : « J\'aimerais jouer avec eux. »',
            ar: 'نور يشعر ببعض الوحدة. يفكر: أتمنى أن ألعب معهم.',
          },
        },
      ],
      fr: {
        sentences: [
          {
            t: 'Chaque matin, Nour regardait la vallée.',
            simple: 'Tous les matins, Nour regarde en bas.',
            explain: "C'est une habitude : Nour fait la même chose tous les jours. Il regarde en bas, car il aimerait savoir ce qui s'y passe.",
          },
          {
            t: 'Il voyait des maisons blanches aux portes bleues, et des enfants qui jouaient.',
            simple: 'Il voit des maisons blanches et des enfants qui jouent.',
            explain: 'Nour observe le village de loin. Il voit des enfants s\'amuser ensemble, alors que lui est tout seul.',
          },
        ],
        definitions: {
          'vallée': "Le creux entre deux montagnes, où l'on trouve souvent des villages.",
          chaque: 'Tous, un par un, sans en oublier.',
        },
      },
      ar: {
        sentences: [
          {
            t: 'كل صباح، كان نور ينظر إلى الوادي.',
            simple: 'كل صباح، ينظر نور إلى الأسفل.',
            explain: 'هذه عادة: نور يفعل الشيء نفسه كل يوم. ينظر إلى الأسفل لأنه يريد أن يعرف ما يحدث هناك.',
          },
          {
            t: 'كان يرى بيوتا بيضاء بأبواب زرقاء، وأطفالا يلعبون.',
            simple: 'يرى بيوتا بيضاء وأطفالا يلعبون.',
            explain: 'نور يراقب القرية من بعيد. يرى الأطفال يلعبون معا، أما هو فوحيد.',
          },
        ],
        definitions: {
          'الوادي': 'المكان المنخفض بين جبلين، وفيه غالبا قرى.',
          'صباح': 'أول النهار، بعد طلوع الشمس.',
        },
      },
      question: null,
    },
    {
      id: 3,
      decor: 'montagne',
      ambiance: 'matin',
      camera: 'plan_moyen',
      duree_s: 50,
      film: {
        // L'oiseau arrive du ciel et se pose sur l'aile de Nour.
        camera: [[0, [0.5, 2.8, 8], [0.8, 1.6, 0]], [0.55, [1.2, 2.4, 5.6], [0.4, 1.5, 0]], [1, [-1.4, 2.3, 5.2], [0.3, 1.4, 0]]],
        actors: {
          dragon: [[0, [0, 0, 0], 0, 'respirer'], [0.4, [0, 0, 0], 0.5, 'regarder'], [0.75, [0, 0, 0], 0.4, 'respirer']],
          oiseau: [[0, [6, 5.2, -4], -1.3, 'voler'], [0.3, [2.2, 2.9, -0.4], -1.1, 'voler'], [0.45, [0.85, 1.72, -0.1], -0.9, 'pose'], [1, [0.85, 1.72, -0.1], -0.9, 'pose']],
        },
        sounds: [[0.12, 'chant']],
      },
      where: { fr: 'Sur la montagne, un visiteur arrive', ar: 'فوق الجبل، يصل زائر' },
      sound: { type: 'chant', visual: 'notes' },
      characters: [
        {
          id: 'dragon', position: [-0.6, 0], animation: 'respirer', emotion: 'surpris',
          reveal: {
            fr: 'Nour est surpris. Il pense : « Personne ne vient jamais me voir ! »',
            ar: 'نور متفاجئ. يفكر: لا أحد يأتي لزيارتي أبدا!',
          },
        },
        {
          id: 'oiseau', position: [1.1, 0.2], animation: 'voler', emotion: 'curieux',
          reveal: {
            fr: 'L\'oiseau est curieux et gentil. Il pense : « Ce dragon a l\'air triste. »',
            ar: 'العصفور فضولي ولطيف. يفكر: هذا التنين يبدو حزينا.',
          },
        },
      ],
      fr: {
        sentences: [
          {
            t: 'Un jour, un petit oiseau se posa sur son aile.',
            simple: 'Un jour, un petit oiseau arrive sur l\'aile de Nour.',
            explain: '« Un jour » annonce que quelque chose de nouveau arrive. Un oiseau vient voir Nour : c\'est le début d\'une rencontre.',
          },
          {
            t: '« Pourquoi restes-tu tout seul là-haut ? » demanda l\'oiseau.',
            simple: 'L\'oiseau demande : « Pourquoi es-tu seul ? »',
            explain: "L'oiseau a remarqué que Nour est seul. Il pose la question parce qu'il s'intéresse à lui : il veut comprendre.",
          },
        ],
        definitions: {
          posa: "S'arrêta doucement sur quelque chose, après avoir volé.",
          aile: 'La partie du corps qui sert à voler.',
        },
      },
      ar: {
        sentences: [
          {
            t: 'وذات يوم، حط عصفور صغير على جناحه.',
            simple: 'في يوم، جاء عصفور صغير ووقف على جناح نور.',
            explain: '«ذات يوم» تعلن أن شيئا جديدا سيحدث. عصفور يأتي لزيارة نور: إنها بداية لقاء.',
          },
          {
            t: 'سأل العصفور: «لماذا تبقى وحيدا هناك في الأعلى؟»',
            simple: 'سأل العصفور: «لماذا أنت وحيد؟»',
            explain: 'لاحظ العصفور أن نور وحيد. يسأل لأنه يهتم به ويريد أن يفهم.',
          },
        ],
        definitions: {
          'حط': 'نزل ووقف بلطف على شيء بعد الطيران.',
          'جناحه': 'الجزء من الجسم الذي يستعمل للطيران.',
        },
      },
      question: {
        fr: { q: 'Qui vient voir Nour ?', choices: ['Un oiseau', 'Un chat', 'Un enfant'], correct: 0 },
        ar: { q: 'من جاء لزيارة نور؟', choices: ['عصفور', 'قط', 'طفل'], correct: 0 },
      },
    },
    {
      id: 4,
      decor: 'montagne',
      ambiance: 'matin',
      camera: 'plan_moyen',
      duree_s: 50,
      film: {
        // Nour baisse la tête ; l'oiseau descend près de lui pour l'écouter. Lent travelling avant.
        camera: [[0, [0.2, 2.5, 6.2], [0, 1.4, 0]], [1, [1.1, 1.9, 3.6], [0.3, 1.4, 0]]],
        actors: {
          dragon: [[0, [0, 0, 0], 0.2, 'respirer'], [0.15, [0, 0, 0], 0.2, 'baisser_tete'], [1, [0, 0, 0], 0.2, 'baisser_tete']],
          oiseau: [[0, [0.85, 1.72, -0.1], -0.9, 'pose'], [0.5, [0.85, 1.72, -0.1], -0.9, 'pose'], [0.62, [1.15, 1.05, 0.85], -2.2, 'voler'], [0.7, [1.15, 0.95, 0.85], -2.2, 'pose'], [1, [1.15, 0.95, 0.85], -2.2, 'pose']],
        },
        sounds: [],
      },
      where: { fr: 'Nour confie son secret', ar: 'نور يبوح بسره' },
      sound: null,
      characters: [
        {
          id: 'dragon', position: [-0.6, 0], animation: 'baisser_tete', emotion: 'inquiet',
          reveal: {
            fr: 'Nour se sent inquiet. Il pense : « Je suis grand et j\'ai des ailes, ils vont s\'enfuir. »',
            ar: 'نور قلق. يفكر: أنا كبير ولي أجنحة، سيهربون مني.',
          },
        },
        {
          id: 'oiseau', position: [1.1, 0.2], animation: 'voler', emotion: 'attentif',
          reveal: {
            fr: 'L\'oiseau écoute. Il pense : « Je vais l\'aider. »',
            ar: 'العصفور يستمع. يفكر: سأساعده.',
          },
        },
      ],
      fr: {
        sentences: [
          {
            t: 'Nour baissa la tête.',
            simple: 'Nour baisse la tête.',
            explain: "Quand on baisse la tête, c'est souvent qu'on est triste ou un peu gêné. Nour n'ose pas regarder l'oiseau.",
          },
          {
            t: '« J\'ai peur que les enfants aient peur de moi », murmura-t-il.',
            simple: 'Il dit tout bas : « J\'ai peur que les enfants aient peur de moi. »',
            explain: "Voilà le vrai problème : Nour n'est pas méchant, il a peur qu'on le trouve effrayant parce qu'il est un dragon. Il parle tout bas car c'est difficile à dire.",
          },
        ],
        definitions: {
          'murmura-t-il': 'Il parla très doucement, presque sans bruit.',
          baissa: 'Mit plus bas.',
        },
      },
      ar: {
        sentences: [
          {
            t: 'أحنى نور رأسه.',
            simple: 'نور ينزل رأسه.',
            explain: 'عندما نحني رؤوسنا، نكون غالبا حزينين أو خجولين. نور لا يجرؤ على النظر إلى العصفور.',
          },
          {
            t: 'همس قائلا: «أخاف أن يخاف الأطفال مني».',
            simple: 'قال بصوت منخفض: «أخاف أن يخاف الأطفال مني».',
            explain: 'هذه هي المشكلة الحقيقية: نور ليس شريرا، لكنه يخاف أن يراه الأطفال مخيفا لأنه تنين. يتكلم بصوت منخفض لأن الكلام صعب.',
          },
        ],
        definitions: {
          'همس': 'تكلم بصوت منخفض جدا.',
          'أحنى': 'أنزل إلى الأسفل.',
        },
      },
      question: {
        fr: { q: 'Pourquoi Nour est-il inquiet ?', choices: ['Il a faim', 'Il a peur que les enfants aient peur de lui', 'Il est fatigué'], correct: 1 },
        ar: { q: 'لماذا نور قلق؟', choices: ['لأنه جائع', 'يخاف أن يخاف منه الأطفال', 'لأنه متعب'], correct: 1 },
      },
    },
    {
      id: 5,
      decor: 'foret',
      ambiance: 'midi',
      camera: 'plan_moyen',
      duree_s: 50,
      film: {
        // L'oiseau montre le chemin ; Nour descend à travers la forêt. La caméra recule avec eux.
        camera: [[0, [2.6, 2.7, -1.5], [0, 1.1, -7]], [0.5, [2.9, 2.4, 2.8], [0, 1.1, -2.5]], [1, [1.7, 2.2, 5.8], [0, 1.2, 0.6]]],
        actors: {
          dragon: [[0, [0, 0, -7], 0, 'marcher'], [0.85, [0, 0, 0.4], 0, 'marcher'], [1, [0, 0, 0.6], 0, 'respirer']],
          oiseau: [[0, [0.9, 2.5, -5.2], 0, 'voler'], [0.85, [0.9, 2.4, 1.8], 0, 'voler'], [1, [0.9, 2.3, 2.1], 0.4, 'voler']],
        },
        sounds: [[0.4, 'chant']],
      },
      where: { fr: 'Sur le chemin qui descend', ar: 'على الطريق النازل' },
      sound: { type: 'chant', visual: 'notes' },
      characters: [
        {
          id: 'oiseau', position: [0.9, 0.4], animation: 'voler', emotion: 'joyeux',
          reveal: {
            fr: 'L\'oiseau est joyeux. Il pense : « Nour va se faire des amis ! »',
            ar: 'العصفور سعيد. يفكر: نور سيصنع أصدقاء!',
          },
        },
        {
          id: 'dragon', position: [-0.8, 0], animation: 'marcher', emotion: "plein d'espoir",
          reveal: {
            fr: 'Nour reprend courage. Il pense : « Et si c\'était possible ? »',
            ar: 'نور يستعيد شجاعته. يفكر: وماذا لو كان ذلك ممكنا؟',
          },
        },
      ],
      fr: {
        sentences: [
          {
            t: "L'oiseau sourit et battit des ailes.",
            simple: "L'oiseau sourit et bouge ses ailes.",
            explain: "L'oiseau n'est pas inquiet du tout : il sourit parce qu'il a une idée pour aider Nour.",
          },
          {
            t: '« Viens avec moi ! Les enfants adorent les histoires, et toi, tu en connais beaucoup. »',
            simple: '« Viens ! Les enfants aiment les histoires, et tu en connais beaucoup. »',
            explain: "L'oiseau a trouvé la solution : Nour connaît beaucoup d'histoires, et les enfants aiment les écouter. C'est une façon de se faire des amis sans faire peur.",
          },
        ],
        definitions: {
          adorent: 'Aiment beaucoup, beaucoup.',
          battit: 'Bougea vite, de haut en bas.',
        },
      },
      ar: {
        sentences: [
          {
            t: 'ابتسم العصفور ورفرف بجناحيه.',
            simple: 'العصفور يبتسم ويحرك جناحيه.',
            explain: 'العصفور ليس قلقا أبدا: يبتسم لأن لديه فكرة لمساعدة نور.',
          },
          {
            t: '«تعال معي! الأطفال يحبون الحكايات كثيرا، وأنت تعرف الكثير منها.»',
            simple: '«تعال! الأطفال يحبون الحكايات، وأنت تعرف الكثير منها.»',
            explain: 'وجد العصفور الحل: نور يعرف حكايات كثيرة، والأطفال يحبون سماعها. هكذا يصنع أصدقاء دون أن يخيف أحدا.',
          },
        ],
        definitions: {
          'ورفرف': 'حرك جناحيه بسرعة إلى الأعلى والأسفل.',
          'الحكايات': 'قصص نرويها ونسمعها.',
        },
      },
      question: null,
    },
    {
      id: 6,
      decor: 'village',
      ambiance: 'soir',
      camera: 'plan_large',
      duree_s: 55,
      film: {
        // Nour arrive au village au coucher du soleil ; Yasmine et Adam s'approchent, il commence : « Kan ya makan… »
        camera: [[0, [0, 4.2, 10], [0, 1, -2.5]], [0.5, [0, 2.7, 7.2], [0, 1.2, -0.6]], [1, [-1.1, 2.2, 5.3], [0, 1.3, -0.4]]],
        actors: {
          dragon: [[0, [0, 0, -2.9], 0, 'marcher'], [0.32, [0, 0, -0.6], 0, 'respirer'], [0.6, [0, 0, -0.6], 0, 'raconter'], [1, [0, 0, -0.6], 0, 'raconter']],
          yasmine: [[0, [-5, 0, 0.8], 1.5, 'marcher'], [0.25, [-5, 0, 0.8], 1.5, 'marcher'], [0.62, [-1.55, 0, 0.9], 2.3, 'rire'], [1, [-1.55, 0, 0.9], 2.3, 'rire']],
          adam: [[0, [5, 0, 0.8], -1.5, 'marcher'], [0.28, [5, 0, 0.8], -1.5, 'marcher'], [0.65, [1.55, 0, 0.9], -2.3, 'rire'], [1, [1.55, 0, 0.9], -2.3, 'rire']],
        },
        sounds: [[0.7, 'rires']],
      },
      where: { fr: 'Dans le village de la vallée', ar: 'في قرية الوادي' },
      sound: { type: 'rires', visual: 'etoiles' },
      characters: [
        {
          id: 'dragon', position: [0, -0.6], animation: 'raconter', emotion: 'heureux',
          reveal: {
            fr: 'Nour est heureux. Il pense : « Ils m\'écoutent ! »',
            ar: 'نور سعيد. يفكر: إنهم يستمعون إلي!',
          },
        },
        {
          id: 'yasmine', position: [-1.5, 0.9], animation: 'rire', emotion: 'émerveillée',
          reveal: {
            fr: 'Yasmine est émerveillée. Elle pense : « Un dragon conteur ! »',
            ar: 'ياسمين مندهشة. تفكر: تنين حكواتي!',
          },
        },
        {
          id: 'adam', position: [1.5, 0.9], animation: 'rire', emotion: 'joyeux',
          reveal: {
            fr: 'Adam rit. Il pense : « Encore une histoire ! »',
            ar: 'آدم يضحك. يفكر: حكاية أخرى!',
          },
        },
      ],
      fr: {
        sentences: [
          {
            t: 'Nour descendit dans la vallée, le cœur battant.',
            simple: 'Nour descend dans la vallée. Il est ému.',
            explain: '« Le cœur battant » veut dire que Nour est ému et un peu stressé, mais il ose quand même y aller. C\'est du courage.',
          },
          {
            t: 'Les enfants s\'approchèrent, et Nour commença : « Kan ya makan… »',
            simple: 'Les enfants viennent près de lui. Nour dit : « Kan ya makan… »',
            explain: 'Les enfants n\'ont pas peur : ils viennent vers lui. Nour commence avec la formule des conteurs, « il était une fois ». Sa peur n\'avait pas de raison.',
          },
        ],
        definitions: {
          descendit: 'Alla vers le bas.',
          "s'approchèrent": 'Vinrent plus près.',
          battant: 'Qui bat fort, quand on est ému.',
        },
      },
      ar: {
        sentences: [
          {
            t: 'نزل نور إلى الوادي وقلبه يخفق.',
            simple: 'نزل نور إلى الوادي. هو متأثر.',
            explain: '«قلبه يخفق» تعني أن نور متأثر وقلق قليلا، لكنه يتجرأ ويذهب. هذه شجاعة.',
          },
          {
            t: 'اقترب الأطفال، وبدأ نور يحكي: «كان يا مكان…»',
            simple: 'جاء الأطفال قربه. قال نور: «كان يا مكان…»',
            explain: 'الأطفال لا يخافون: يأتون نحوه. نور يبدأ الحكاية بعبارة الحكواتي «كان يا مكان». لم يكن هناك سبب لخوفه.',
          },
        ],
        definitions: {
          'يخفق': 'يدق بقوة عندما نكون متأثرين.',
          'اقترب': 'جاء أقرب.',
          'الوادي': 'المكان المنخفض بين جبلين، وفيه غالبا قرى.',
        },
      },
      question: null,
    },
  ],
  finalQuestions: [
    {
      fr: { q: 'Au début, pourquoi Nour restait-il seul ?', choices: ["Il n'aimait pas les enfants", 'Il avait peur de faire peur', 'Il dormait'], correct: 1 },
      ar: { q: 'في البداية، لماذا كان نور وحيدا؟', choices: ['لا يحب الأطفال', 'يخاف أن يخيف الآخرين', 'كان نائما'], correct: 1 },
    },
    {
      fr: { q: 'Comment Nour se fait-il des amis ?', choices: ['Il vole très haut', 'Il raconte des histoires', 'Il crache du feu'], correct: 1 },
      ar: { q: 'كيف صنع نور أصدقاء؟', choices: ['طار عاليا', 'حكى حكايات', 'نفث النار'], correct: 1 },
    },
  ],
};

export const BOOKS = [STORY];

export function getBook(id) {
  return BOOKS.find((b) => b.id === id) || null;
}
