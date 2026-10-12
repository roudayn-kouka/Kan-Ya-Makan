/**
 * Cendrillon — d'après le conte de Charles Perrault (1697, domaine public), raconté
 * avec nos propres mots et calé sur la vidéo fournie par l'équipe
 * (public/videos/cendrillon.mp4, 8 min 08). Chaque scène porte son extrait vidéo
 * `clip: [début, fin]` en secondes : le mode Regarder joue la vidéo, le lecteur
 * joue l'extrait de la page.
 *
 * Le texte suit ce que MONTRE la vidéo (ex. : Cendrillon apporte elle-même l'autre
 * pantoufle au palais). Ce n'est pas une transcription de la bande son.
 */

const P = (t) => `./videos/cendrillon/p_${t}.jpg`;

export const CENDRILLON = {
  id: 'cendrillon',
  type: 'story',
  title: { fr: 'Cendrillon', ar: 'سندريلا' },
  summary: {
    fr: 'Une jeune fille courageuse, une fée, un bal… et une pantoufle de verre.',
    ar: 'فتاة شجاعة، وجنية، وحفلة راقصة… وحذاء من زجاج.',
  },
  ageRange: '5-9',
  durationMin: 8,
  cover: '👠',
  coverImg: P(250),
  video: { src: './videos/cendrillon.mp4', webm: './videos/cendrillon.webm', duration: 488, credit: 'Vidéo fournie par l’équipe (droits à vérifier avant diffusion publique)' },
  characters: {
    cendrillon: { name: { fr: 'Cendrillon', ar: 'سندريلا' }, shape: '■' },
    belle_mere: { name: { fr: 'La belle-mère', ar: 'زوجة الأب' }, shape: '▲' },
    soeurs: { name: { fr: 'Les deux sœurs', ar: 'الأختان' }, shape: '◆' },
    fee: { name: { fr: 'La fée', ar: 'الجنية' }, shape: '★' },
    prince: { name: { fr: 'Le prince', ar: 'الأمير' }, shape: '●' },
    animaux: { name: { fr: 'Les souris et les colombes', ar: 'الفئران والحمام' }, shape: '♥' },
  },
  offline: [
    {
      fr: 'Dessine la robe que tu porterais pour aller au bal, puis explique à quelqu’un de ta famille pourquoi tu l’as choisie.',
      ar: 'ارسم الفستان أو اللباس الذي ستلبسه للذهاب إلى الحفلة، ثم اشرح لشخص من عائلتك لماذا اخترته.',
    },
    {
      fr: 'Aide quelqu’un à la maison aujourd’hui, comme Cendrillon, et demande-lui comment il s’est senti.',
      ar: 'ساعد شخصا في البيت اليوم، مثل سندريلا، واسأله كيف شعر.',
    },
  ],
  scenes: [
    {
      id: 1, clip: [0, 30], poster: P(2),
      where: { fr: 'Dans une grande maison', ar: 'في بيت كبير' },
      characters: [
        { id: 'cendrillon', reveal: { fr: 'Cendrillon est triste : sa maman lui manque. Elle pense : « Je dois rester gentille, comme elle. »', ar: 'سندريلا حزينة: تشتاق إلى أمها. تفكر: «يجب أن أبقى لطيفة، مثلها».' } },
        { id: 'belle_mere', reveal: { fr: 'La belle-mère est fière et froide. Elle pense : « Mes filles passeront toujours en premier. »', ar: 'زوجة الأب متكبرة وباردة. تفكر: «ابنتاي ستكونان دائما الأوليين».' } },
      ],
      fr: {
        sentences: [
          { t: 'Il était une fois une jeune fille douce et gentille qui avait perdu sa maman.', simple: 'Il était une fois une fille gentille. Sa maman était morte.', explain: 'L’histoire commence par un grand chagrin : la jeune fille a perdu sa maman. On comprend tout de suite qu’elle est gentille malgré sa tristesse.' },
          { t: 'Son papa se remaria avec une femme sévère, qui arriva avec ses deux filles.', simple: 'Son papa se maria encore. La nouvelle femme était sévère et avait deux filles.', explain: 'Une nouvelle famille arrive : une belle-mère et deux sœurs. Le mot « sévère » nous prévient que la vie de la jeune fille va devenir difficile.' },
          { t: 'Un jour, le papa partit en voyage, et la jeune fille resta seule avec elles.', simple: 'Le papa partit en voyage. La fille resta seule avec elles.', explain: 'Sans son papa, la jeune fille n’a plus personne pour la protéger. C’est pour ça que la suite va être dure pour elle.' },
        ],
        definitions: {
          remaria: 'Se maria une nouvelle fois.',
          'sévère': 'Qui gronde souvent et n’est pas douce.',
          voyage: 'Un déplacement loin de chez soi.',
        },
      },
      ar: {
        sentences: [
          { t: 'كان يا مكان، فتاة لطيفة وطيبة فقدت أمها.', simple: 'كان يا مكان، بنت طيبة. أمها ماتت.', explain: 'تبدأ الحكاية بحزن كبير: الفتاة فقدت أمها. نفهم فورا أنها طيبة رغم حزنها.' },
          { t: 'تزوج أبوها امرأة قاسية، جاءت مع ابنتيها.', simple: 'تزوج أبوها من جديد. الزوجة الجديدة قاسية ولها بنتان.', explain: 'عائلة جديدة تصل: زوجة الأب وأختان. كلمة «قاسية» تنبهنا إلى أن حياة الفتاة ستصبح صعبة.' },
          { t: 'وذات يوم، سافر الأب، وبقيت الفتاة وحدها معهن.', simple: 'سافر الأب. بقيت البنت وحدها معهن.', explain: 'دون أبيها، لم يعد هناك من يحميها. لهذا ستكون البقية صعبة عليها.' },
        ],
        definitions: {
          'قاسية': 'لا ترحم وتعامل الآخرين بشدة.',
          'سافر': 'ذهب إلى مكان بعيد عن بيته.',
          'فقدت': 'لم يعد عندها، رحل عنها.',
        },
      },
      question: {
        fr: { q: 'Qui arrive dans la maison ?', choices: ['Une fée', 'Une belle-mère et ses deux filles', 'Un prince'], correct: 1 },
        ar: { q: 'من جاء إلى البيت؟', choices: ['جنية', 'زوجة الأب وابنتاها', 'أمير'], correct: 1 },
      },
    },
    {
      id: 2, clip: [30, 58], poster: P(40),
      where: { fr: 'Dans la cuisine et au grenier', ar: 'في المطبخ وفي العلية' },
      characters: [
        { id: 'cendrillon', reveal: { fr: 'Cendrillon est fatiguée mais courageuse. Elle pense : « Demain sera peut-être un meilleur jour. »', ar: 'سندريلا متعبة لكنها شجاعة. تفكر: «ربما يكون الغد يوما أفضل».' } },
        { id: 'soeurs', reveal: { fr: 'Les sœurs sont jalouses. Elles pensent : « Elle est plus jolie que nous, alors faisons-la travailler ! »', ar: 'الأختان غيورتان. تفكران: «إنها أجمل منا، فلنجعلها تعمل!»' } },
      ],
      fr: {
        sentences: [
          { t: 'La belle-mère obligea la jeune fille à faire tout le ménage de la maison.', simple: 'La belle-mère lui fit faire tout le ménage.', explain: 'La belle-mère traite la jeune fille comme une servante. Ce n’est pas juste : dans une famille, on partage le travail.' },
          { t: 'Elle dormait au grenier, près des cendres, alors ses sœurs l’appelèrent Cendrillon.', simple: 'Elle dormait près des cendres. On l’appela Cendrillon.', explain: 'On apprend d’où vient son nom : « Cendrillon » vient du mot « cendres ». Ses sœurs lui donnent ce nom pour se moquer d’elle.' },
        ],
        definitions: {
          grenier: 'La pièce tout en haut de la maison, sous le toit.',
          cendres: 'La poussière grise qui reste quand le bois a brûlé.',
          'ménage': 'Le travail pour nettoyer et ranger la maison.',
        },
      },
      ar: {
        sentences: [
          { t: 'أجبرت زوجة الأب الفتاة على القيام بكل أعمال البيت.', simple: 'جعلتها زوجة الأب تقوم بكل أعمال البيت.', explain: 'زوجة الأب تعامل الفتاة كخادمة. هذا ليس عدلا: في العائلة نتقاسم العمل.' },
          { t: 'كانت تنام في العلية قرب الرماد، فسمتها أختاها سندريلا.', simple: 'كانت تنام قرب الرماد. فسموها سندريلا.', explain: 'نعرف من أين جاء اسمها: «سندريلا» يأتي من كلمة الرماد. أختاها تسميانها هكذا لتسخرا منها.' },
        ],
        definitions: {
          'العلية': 'الغرفة في أعلى البيت، تحت السقف.',
          'الرماد': 'الغبار الرمادي الذي يبقى بعد احتراق الحطب.',
          'أجبرت': 'فرضت عليها بالقوة.',
        },
      },
      question: null,
    },
    {
      id: 3, clip: [58, 98], poster: P(70),
      where: { fr: 'Dans la maison', ar: 'في البيت' },
      characters: [
        { id: 'animaux', reveal: { fr: 'Les souris aiment Cendrillon. Elles pensent : « Elle partage toujours avec nous ! »', ar: 'الفئران تحب سندريلا. تفكر: «إنها تقتسم معنا دائما!»' } },
        { id: 'soeurs', reveal: { fr: 'Les sœurs ont très peur. Elles pensent : « Au secours, une souris ! »', ar: 'الأختان خائفتان جدا. تفكران: «النجدة، فأر!»' } },
      ],
      fr: {
        sentences: [
          { t: 'Cendrillon avait des amis : de petites souris et des colombes, à qui elle donnait à manger.', simple: 'Cendrillon avait des amis : des souris et des oiseaux. Elle leur donnait à manger.', explain: 'Même quand on est malheureux, on peut être gentil avec les autres. Cendrillon partage le peu qu’elle a, et les animaux deviennent ses amis.' },
          { t: 'Quand les sœurs voyaient une souris, elles criaient et montaient sur les chaises !', simple: 'Les sœurs avaient peur des souris. Elles criaient très fort !', explain: 'C’est un moment drôle : les sœurs, si méchantes, ont peur d’une toute petite souris.' },
        ],
        definitions: {
          colombes: 'Des oiseaux blancs, souvent le signe de la paix.',
          souris: 'Un tout petit animal gris avec une longue queue.',
          criaient: 'Parlaient très fort, avec peur ou colère.',
        },
      },
      ar: {
        sentences: [
          { t: 'كان لسندريلا أصدقاء: فئران صغيرة وحمامات، كانت تطعمها.', simple: 'كان لسندريلا أصدقاء: فئران وطيور. كانت تطعمها.', explain: 'حتى عندما نكون حزينين، يمكننا أن نكون لطفاء مع الآخرين. سندريلا تقتسم القليل الذي عندها، فتصبح الحيوانات صديقاتها.' },
          { t: 'وعندما كانت الأختان ترى فأرا، كانتا تصرخان وتقفزان فوق الكراسي!', simple: 'الأختان تخافان من الفئران. كانتا تصرخان بقوة!', explain: 'إنها لحظة مضحكة: الأختان الشريرتان تخافان من فأر صغير جدا.' },
        ],
        definitions: {
          'وحمامات': 'طيور بيضاء، غالبا رمز للسلام.',
          'فئران': 'حيوانات صغيرة رمادية لها ذيل طويل.',
          'تصرخان': 'تتكلمان بصوت عال جدا من الخوف أو الغضب.',
        },
      },
      question: {
        fr: { q: 'Qui sont les amis de Cendrillon ?', choices: ['Ses sœurs', 'Les souris et les colombes', 'Des chats'], correct: 1 },
        ar: { q: 'من هم أصدقاء سندريلا؟', choices: ['أختاها', 'الفئران والحمام', 'قطط'], correct: 1 },
      },
    },
    {
      id: 4, clip: [98, 130], poster: P(108),
      where: { fr: 'Un messager à la porte', ar: 'رسول عند الباب' },
      characters: [
        { id: 'soeurs', reveal: { fr: 'Les sœurs sont surexcitées. Elles pensent : « Le prince va forcément me choisir ! »', ar: 'الأختان متحمستان جدا. تفكر كل واحدة: «الأمير سيختارني أنا!»' } },
        { id: 'cendrillon', reveal: { fr: 'Cendrillon rêve en silence. Elle pense : « Moi aussi, j’aimerais tant y aller… »', ar: 'سندريلا تحلم في صمت. تفكر: «أنا أيضا أتمنى كثيرا أن أذهب…»' } },
      ],
      fr: {
        sentences: [
          { t: 'Un jour, un messager du roi apporta une invitation : le prince donnait un grand bal.', simple: 'Un messager du roi arriva. Il y avait un grand bal chez le prince.', explain: 'Voici le grand évènement de l’histoire : un bal au palais. Tout le monde est invité, et c’est ce qui va tout changer pour Cendrillon.' },
          { t: 'Les deux sœurs, ravies, obligèrent Cendrillon à coudre leurs plus belles robes.', simple: 'Les sœurs étaient contentes. Cendrillon dut coudre leurs robes.', explain: 'Les sœurs ne pensent qu’à elles. Cendrillon prépare leurs robes alors qu’elle aimerait, elle aussi, aller au bal.' },
        ],
        definitions: {
          messager: 'Une personne qui apporte un message de la part de quelqu’un.',
          bal: 'Une grande fête où l’on danse.',
          coudre: 'Assembler du tissu avec du fil et une aiguille.',
          invitation: 'Un message qui demande à quelqu’un de venir à une fête.',
        },
      },
      ar: {
        sentences: [
          { t: 'وذات يوم، جاء رسول من الملك بدعوة: الأمير يقيم حفلة راقصة كبيرة.', simple: 'جاء رسول الملك. هناك حفلة كبيرة عند الأمير.', explain: 'هذا هو الحدث الكبير في الحكاية: حفلة في القصر. الجميع مدعوون، وهذا ما سيغير كل شيء بالنسبة إلى سندريلا.' },
          { t: 'فرحت الأختان، وأجبرتا سندريلا على خياطة أجمل فساتينهما.', simple: 'فرحت الأختان. وخاطت سندريلا فساتينهما.', explain: 'الأختان لا تفكران إلا في نفسيهما. سندريلا تحضر فساتينهما وهي أيضا تتمنى الذهاب إلى الحفلة.' },
        ],
        definitions: {
          'رسول': 'شخص يحمل رسالة من طرف شخص آخر.',
          'بدعوة': 'برسالة تطلب من شخص أن يأتي إلى حفلة.',
          'خياطة': 'جمع قطع القماش بالخيط والإبرة.',
        },
      },
      question: null,
    },
    {
      id: 5, clip: [130, 178], poster: P(150),
      where: { fr: 'Le soir du bal, à la maison', ar: 'مساء الحفلة، في البيت' },
      characters: [
        { id: 'belle_mere', reveal: { fr: 'La belle-mère est méchante. Elle pense : « Elle n’y arrivera jamais ! »', ar: 'زوجة الأب شريرة. تفكر: «لن تنجح أبدا!»' } },
        { id: 'animaux', reveal: { fr: 'Les souris et les colombes veulent aider. Elles pensent : « Vite, tous ensemble ! »', ar: 'الفئران والحمام يريدون المساعدة. يفكرون: «بسرعة، كلنا معا!»' } },
        { id: 'cendrillon', reveal: { fr: 'Cendrillon a le cœur brisé. Elle pense : « J’ai tout fait, et ce n’est pas juste. »', ar: 'قلب سندريلا مكسور. تفكر: «فعلت كل شيء، وهذا ليس عدلا».' } },
      ],
      fr: {
        sentences: [
          { t: 'La belle-mère jeta des petits pois par terre : « Trie tous ces pois, et tu pourras venir au bal. »', simple: 'La belle-mère jeta des petits pois. « Ramasse-les et tu viendras au bal. »', explain: 'La belle-mère donne une tâche presque impossible. Elle ne veut pas vraiment que Cendrillon vienne : c’est un piège.' },
          { t: 'Les souris et les colombes l’aidèrent, mais la belle-mère partit au bal sans elle.', simple: 'Ses amis l’aidèrent. Mais la belle-mère partit sans elle.', explain: 'Grâce à ses amis, Cendrillon réussit la tâche. Pourtant, la belle-mère ne tient pas sa promesse. Cendrillon reste seule, très déçue.' },
        ],
        definitions: {
          trie: 'Sépare les choses et les range selon leur sorte.',
          'jeta': 'Lança quelque chose.',
          pois: 'De petites graines vertes et rondes qu’on mange.',
        },
      },
      ar: {
        sentences: [
          { t: 'رمت زوجة الأب حبات البازلاء على الأرض: «اجمعيها كلها، وستذهبين إلى الحفلة».', simple: 'رمت زوجة الأب البازلاء. «اجمعيها وستأتين إلى الحفلة».', explain: 'زوجة الأب تعطي مهمة شبه مستحيلة. هي لا تريد حقا أن تأتي سندريلا: إنه فخ.' },
          { t: 'ساعدتها الفئران والحمامات، لكن زوجة الأب ذهبت إلى الحفلة بدونها.', simple: 'ساعدها أصدقاؤها. لكن زوجة الأب ذهبت بدونها.', explain: 'بفضل أصدقائها، تنجح سندريلا في المهمة. ومع ذلك، لا تفي زوجة الأب بوعدها. تبقى سندريلا وحيدة وحزينة جدا.' },
        ],
        definitions: {
          'البازلاء': 'حبات خضراء صغيرة ومستديرة نأكلها.',
          'رمت': 'ألقت الشيء بعيدا.',
          'اجمعيها': 'ضعيها معا في مكان واحد.',
        },
      },
      question: {
        fr: { q: 'La belle-mère a-t-elle tenu sa promesse ?', choices: ['Oui', 'Non'], correct: 1 },
        ar: { q: 'هل وفت زوجة الأب بوعدها؟', choices: ['نعم', 'لا'], correct: 1 },
      },
    },
    {
      id: 6, clip: [178, 232], poster: P(205),
      where: { fr: 'Sous le grand arbre, au coucher du soleil', ar: 'تحت الشجرة الكبيرة، عند غروب الشمس' },
      characters: [
        { id: 'fee', reveal: { fr: 'La fée est pleine de tendresse. Elle pense : « Ta gentillesse mérite une récompense. »', ar: 'الجنية مليئة بالحنان. تفكر: «طيبتك تستحق مكافأة».' } },
        { id: 'cendrillon', reveal: { fr: 'Cendrillon n’en croit pas ses yeux. Elle pense : « Est-ce que je rêve ? »', ar: 'سندريلا لا تصدق عينيها. تفكر: «هل أنا أحلم؟»' } },
      ],
      fr: {
        sentences: [
          { t: 'Cendrillon pleurait sous le grand arbre quand une fée apparut dans la lumière.', simple: 'Cendrillon pleurait. Une fée apparut.', explain: 'Au moment où Cendrillon est la plus triste, quelqu’un vient l’aider. Dans les contes, la gentillesse finit souvent par être récompensée.' },
          { t: 'D’un coup de baguette magique, la fée changea une citrouille en carrosse doré !', simple: 'La fée utilisa sa baguette. La citrouille devint un carrosse !', explain: 'C’est la magie de la fée : un simple légume devient un carrosse pour aller au bal. Tout ce qui semblait impossible devient possible.' },
        ],
        definitions: {
          'apparut': 'Se montra tout à coup.',
          baguette: 'Un petit bâton magique.',
          citrouille: 'Un gros légume rond et orange.',
          carrosse: 'Une grande voiture tirée par des chevaux, pour les rois et les princesses.',
        },
      },
      ar: {
        sentences: [
          { t: 'كانت سندريلا تبكي تحت الشجرة الكبيرة عندما ظهرت جنية في الضوء.', simple: 'كانت سندريلا تبكي. ظهرت جنية.', explain: 'في اللحظة التي تكون فيها سندريلا أكثر حزنا، يأتي من يساعدها. في الحكايات، تكافأ الطيبة غالبا في النهاية.' },
          { t: 'بضربة من عصاها السحرية، حولت الجنية اليقطينة إلى عربة ذهبية!', simple: 'استعملت الجنية عصاها. صارت اليقطينة عربة!', explain: 'هذا سحر الجنية: خضرة بسيطة تصبح عربة للذهاب إلى الحفلة. كل ما كان مستحيلا يصبح ممكنا.' },
        ],
        definitions: {
          'ظهرت': 'بانت فجأة.',
          'عصاها': 'عصا صغيرة سحرية.',
          'اليقطينة': 'خضرة كبيرة مستديرة برتقالية اللون.',
          'عربة': 'مركبة كبيرة تجرها الخيول، للملوك والأميرات.',
        },
      },
      question: {
        fr: { q: 'En quoi la fée change-t-elle la citrouille ?', choices: ['En carrosse', 'En gâteau', 'En maison'], correct: 0 },
        ar: { q: 'إلى ماذا حولت الجنية اليقطينة؟', choices: ['إلى عربة', 'إلى كعكة', 'إلى بيت'], correct: 0 },
      },
    },
    {
      id: 7, clip: [232, 283], poster: P(250),
      where: { fr: 'La nuit, sous la lune', ar: 'في الليل، تحت القمر' },
      characters: [
        { id: 'cendrillon', reveal: { fr: 'Cendrillon est émerveillée. Elle pense : « Je n’ai jamais été aussi heureuse ! »', ar: 'سندريلا مندهشة. تفكر: «لم أكن يوما سعيدة إلى هذا الحد!»' } },
        { id: 'fee', reveal: { fr: 'La fée est un peu inquiète. Elle pense : « Pourvu qu’elle n’oublie pas l’heure ! »', ar: 'الجنية قلقة قليلا. تفكر: «أرجو ألا تنسى الوقت!»' } },
      ],
      fr: {
        sentences: [
          { t: 'Ses vieux habits devinrent une robe bleue qui brillait, avec des pantoufles de verre.', simple: 'Elle eut une belle robe bleue et des chaussures de verre.', explain: 'Cendrillon est transformée. Les pantoufles de verre sont très importantes : retiens-les bien, elles vont revenir dans l’histoire !' },
          { t: '« Attention, dit la fée, à minuit, la magie s’arrêtera ! »', simple: 'La fée dit : « À minuit, la magie s’arrête ! »', explain: 'La fée donne une règle : la magie ne dure pas toujours. Minuit, c’est le milieu de la nuit. Cette règle va créer du suspense.' },
        ],
        definitions: {
          pantoufles: 'Des chaussures légères. Ici, elles sont en verre.',
          minuit: 'Le milieu de la nuit : douze heures du soir.',
          habits: 'Les vêtements.',
        },
      },
      ar: {
        sentences: [
          { t: 'تحولت ملابسها القديمة إلى فستان أزرق يلمع، مع حذاء من زجاج.', simple: 'صار لها فستان أزرق جميل وحذاء من زجاج.', explain: 'تحولت سندريلا. الحذاء الزجاجي مهم جدا: تذكره جيدا، سيعود في الحكاية!' },
          { t: 'قالت الجنية: «انتبهي، عند منتصف الليل سيتوقف السحر!»', simple: 'قالت الجنية: «عند منتصف الليل يتوقف السحر!»', explain: 'الجنية تعطي قاعدة: السحر لا يدوم دائما. منتصف الليل هو وسط الليل. هذه القاعدة ستخلق التشويق.' },
        ],
        definitions: {
          'فستان': 'لباس طويل للبنات والنساء.',
          'منتصف': 'الوسط.',
          'ملابسها': 'ثيابها.',
        },
      },
      question: {
        fr: { q: 'À quelle heure la magie s’arrête-t-elle ?', choices: ['À midi', 'À minuit', 'Le matin'], correct: 1 },
        ar: { q: 'متى يتوقف السحر؟', choices: ['عند منتصف النهار', 'عند منتصف الليل', 'في الصباح'], correct: 1 },
      },
    },
    {
      id: 8, clip: [283, 322], poster: P(300),
      where: { fr: 'Au bal, dans le palais', ar: 'في الحفلة، في القصر' },
      characters: [
        { id: 'prince', reveal: { fr: 'Le prince est charmé. Il pense : « Qui est cette jeune fille si douce ? »', ar: 'الأمير معجب. يفكر: «من هذه الفتاة اللطيفة؟»' } },
        { id: 'cendrillon', reveal: { fr: 'Cendrillon a oublié l’heure. Elle pense : « Je voudrais que ce moment dure toujours. »', ar: 'سندريلا نسيت الوقت. تفكر: «أتمنى أن تدوم هذه اللحظة دائما».' } },
      ],
      fr: {
        sentences: [
          { t: 'Au palais, le prince ne vit qu’elle et l’invita à danser toute la soirée.', simple: 'Le prince vit Cendrillon. Ils dansèrent toute la soirée.', explain: 'Le prince remarque Cendrillon parmi tous les invités. Personne ne la reconnaît, pas même ses sœurs !' },
          { t: 'Soudain, la grande horloge sonna le premier coup de minuit.', simple: 'Soudain, l’horloge sonna minuit.', explain: 'C’est le moment de tension : minuit arrive et Cendrillon doit partir avant la fin de la magie.' },
        ],
        definitions: {
          palais: 'La très grande maison d’un roi ou d’un prince.',
          horloge: 'Une grande pendule qui donne l’heure.',
          soudain: 'Tout à coup.',
        },
      },
      ar: {
        sentences: [
          { t: 'في القصر، لم ير الأمير أحدا غيرها ودعاها إلى الرقص طوال السهرة.', simple: 'رأى الأمير سندريلا. رقصا طوال السهرة.', explain: 'الأمير يلاحظ سندريلا بين كل المدعوين. لا أحد يعرفها، ولا حتى أختاها!' },
          { t: 'وفجأة، دقت الساعة الكبيرة أول دقة من منتصف الليل.', simple: 'فجأة، دقت الساعة منتصف الليل.', explain: 'هذه لحظة التوتر: منتصف الليل يقترب وعلى سندريلا أن تغادر قبل نهاية السحر.' },
        ],
        definitions: {
          'القصر': 'البيت الكبير جدا للملك أو الأمير.',
          'الساعة': 'آلة كبيرة تبين الوقت.',
          'وفجأة': 'بسرعة ودون انتظار.',
        },
      },
      question: null,
    },
    {
      id: 9, clip: [322, 362], poster: P(345),
      where: { fr: 'Dans le grand escalier', ar: 'في الدرج الكبير' },
      characters: [
        { id: 'cendrillon', reveal: { fr: 'Cendrillon a peur. Elle pense : « Vite, avant que tout redevienne comme avant ! »', ar: 'سندريلا خائفة. تفكر: «بسرعة، قبل أن يعود كل شيء كما كان!»' } },
        { id: 'prince', reveal: { fr: 'Le prince est décidé. Il pense : « Je la retrouverai, grâce à cette pantoufle. »', ar: 'الأمير عازم. يفكر: «سأجدها، بفضل هذا الحذاء».' } },
      ],
      fr: {
        sentences: [
          { t: 'Cendrillon s’enfuit en courant et perdit une pantoufle de verre dans le grand escalier.', simple: 'Cendrillon partit en courant. Elle perdit une chaussure de verre.', explain: 'Dans sa course, Cendrillon perd une pantoufle. C’est le seul indice qui peut mener le prince jusqu’à elle.' },
          { t: 'Le prince la ramassa et promit de retrouver la jeune fille à qui elle allait.', simple: 'Le prince prit la chaussure. Il voulait retrouver la fille.', explain: 'Le prince va chercher la jeune fille dont le pied entre dans la pantoufle. C’est comme une enquête !' },
        ],
        definitions: {
          "s'enfuit": 'Partit très vite pour s’échapper.',
          escalier: 'Des marches pour monter ou descendre.',
          ramassa: 'Prit quelque chose qui était par terre.',
        },
      },
      ar: {
        sentences: [
          { t: 'هربت سندريلا جريا وأضاعت حذاء زجاجيا في الدرج.', simple: 'ركضت سندريلا. أضاعت حذاء من زجاج.', explain: 'أثناء ركضها، تضيع سندريلا حذاء. إنه الدليل الوحيد الذي يمكن أن يقود الأمير إليها.' },
          { t: 'التقطه الأمير ووعد بأن يجد الفتاة التي يناسبها.', simple: 'أخذ الأمير الحذاء. أراد أن يجد الفتاة.', explain: 'سيبحث الأمير عن الفتاة التي تدخل قدمها في الحذاء. إنه مثل التحقيق!' },
        ],
        definitions: {
          'هربت': 'ذهبت بسرعة لتفلت.',
          'الدرج': 'درجات للصعود أو النزول.',
          'التقطه': 'أخذه من الأرض.',
        },
      },
      question: {
        fr: { q: 'Qu’est-ce que Cendrillon perd dans l’escalier ?', choices: ['Sa robe', 'Une pantoufle de verre', 'Sa baguette'], correct: 1 },
        ar: { q: 'ماذا أضاعت سندريلا في الدرج؟', choices: ['فستانها', 'حذاء من زجاج', 'عصاها'], correct: 1 },
      },
    },
    {
      id: 10, clip: [362, 432], poster: P(400),
      where: { fr: 'Au palais, les jeunes filles essaient la pantoufle', ar: 'في القصر، الفتيات يجربن الحذاء' },
      characters: [
        { id: 'soeurs', reveal: { fr: 'Les sœurs sont vexées. Elles pensent : « Cette pantoufle est bien trop petite ! »', ar: 'الأختان منزعجتان. تفكران: «هذا الحذاء صغير جدا!»' } },
        { id: 'belle_mere', reveal: { fr: 'La belle-mère a peur d’être découverte. Elle pense : « Cendrillon ne doit pas y aller ! »', ar: 'زوجة الأب تخاف أن ينكشف أمرها. تفكر: «يجب ألا تذهب سندريلا!»' } },
      ],
      fr: {
        sentences: [
          { t: 'Toutes les jeunes filles du royaume vinrent essayer la pantoufle, mais elle n’allait à personne.', simple: 'Beaucoup de filles essayèrent la chaussure. Elle n’allait à personne.', explain: 'Le prince fait essayer la pantoufle à toutes les jeunes filles. Les sœurs essaient aussi, mais leur pied est trop grand.' },
          { t: 'La belle-mère voulut garder Cendrillon à la maison, mais le soir venu, elle partit vers le palais.', simple: 'La belle-mère voulait la garder. Le soir, Cendrillon alla au palais.', explain: 'La belle-mère essaie encore de l’empêcher, mais Cendrillon ose partir. Elle a du courage.' },
        ],
        definitions: {
          royaume: 'Le pays gouverné par un roi.',
          essayer: 'Mettre pour voir si ça va.',
          'vinrent': 'Arrivèrent.',
        },
      },
      ar: {
        sentences: [
          { t: 'جاءت كل فتيات المملكة لتجربة الحذاء، لكنه لم يناسب أحدا.', simple: 'جربت فتيات كثيرات الحذاء. لم يناسب أحدا.', explain: 'الأمير يجعل كل الفتيات يجربن الحذاء. الأختان أيضا تجربان، لكن قدميهما كبيرتان.' },
          { t: 'أرادت زوجة الأب أن تبقي سندريلا في البيت، لكن في المساء ذهبت إلى القصر.', simple: 'أرادت زوجة الأب أن تحبسها. في المساء ذهبت سندريلا إلى القصر.', explain: 'زوجة الأب تحاول مرة أخرى منعها، لكن سندريلا تتجرأ وتذهب. إنها شجاعة.' },
        ],
        definitions: {
          'المملكة': 'البلد الذي يحكمه ملك.',
          'لتجربة': 'للبس الشيء ومعرفة إن كان مناسبا.',
          'يناسب': 'يكون على المقاس الصحيح.',
        },
      },
      question: null,
    },
    {
      id: 11, clip: [432, 488], poster: P(460),
      where: { fr: 'Dans la grande salle du palais', ar: 'في القاعة الكبيرة للقصر' },
      characters: [
        { id: 'prince', reveal: { fr: 'Le prince est fou de joie. Il pense : « C’est elle ! Je l’ai retrouvée ! »', ar: 'الأمير فرح جدا. يفكر: «إنها هي! لقد وجدتها!»' } },
        { id: 'cendrillon', reveal: { fr: 'Cendrillon est heureuse et fière. Elle pense : « J’ai eu raison de garder espoir. »', ar: 'سندريلا سعيدة وفخورة. تفكر: «كنت على حق عندما لم أفقد الأمل».' } },
      ],
      fr: {
        sentences: [
          { t: 'Cendrillon montra l’autre pantoufle, et son pied entra parfaitement dans celle du prince.', simple: 'Cendrillon montra l’autre chaussure. La chaussure lui allait parfaitement.', explain: 'Voilà la preuve : Cendrillon a l’autre pantoufle, et celle du prince lui va. Le prince sait enfin qui elle est.' },
          { t: 'Le prince, fou de joie, l’invita à danser, et ils vécurent heureux.', simple: 'Le prince était très content. Ils vécurent heureux.', explain: 'L’histoire finit bien : la gentillesse et le courage de Cendrillon sont récompensés.' },
        ],
        definitions: {
          parfaitement: 'Très bien, sans aucun problème.',
          'vécurent': 'Passèrent leur vie.',
          joie: 'Un très grand bonheur.',
        },
      },
      ar: {
        sentences: [
          { t: 'أظهرت سندريلا الحذاء الآخر، ودخلت قدمها تماما في حذاء الأمير.', simple: 'أظهرت سندريلا الحذاء الآخر. الحذاء على مقاسها تماما.', explain: 'هذا هو الدليل: عند سندريلا الحذاء الآخر، وحذاء الأمير يناسبها. الأمير يعرف أخيرا من هي.' },
          { t: 'فرح الأمير كثيرا ودعاها إلى الرقص، وعاشا في سعادة.', simple: 'فرح الأمير كثيرا. وعاشا سعيدين.', explain: 'الحكاية تنتهي بخير: طيبة سندريلا وشجاعتها كوفئتا.' },
        ],
        definitions: {
          'تماما': 'بشكل كامل، دون أي مشكلة.',
          'سعادة': 'فرح كبير.',
          'أظهرت': 'جعلت الشيء يرى.',
        },
      },
      question: null,
    },
  ],
  finalQuestions: [
    {
      fr: { q: 'Pourquoi la fée aide-t-elle Cendrillon ?', choices: ['Parce qu’elle est gentille et courageuse', 'Parce qu’elle est riche', 'Parce qu’elle crie fort'], correct: 0 },
      ar: { q: 'لماذا ساعدت الجنية سندريلا؟', choices: ['لأنها طيبة وشجاعة', 'لأنها غنية', 'لأنها تصرخ بقوة'], correct: 0 },
    },
    {
      fr: { q: 'Comment le prince sait-il que c’est bien elle ?', choices: ['Grâce à la pantoufle de verre', 'Grâce à sa robe', 'Grâce aux souris'], correct: 0 },
      ar: { q: 'كيف عرف الأمير أنها هي؟', choices: ['بفضل الحذاء الزجاجي', 'بفضل فستانها', 'بفضل الفئران'], correct: 0 },
    },
  ],
};
