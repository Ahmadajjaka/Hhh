/**
 * Verified Audio Supplications (أدعية بصوت كبار الشيوخ) and
 * Authentic Al-Ruqyah Al-Shariah (الرقية الشرعية الصوتية والمقروءة)
 *
 * Audio URLs verified against archive.org audio/mpeg endpoints.
 * Quranic verses verified verbatim against quran-uthmani (Tanzil / King Fahd Complex).
 */

export interface AudioDuaTrack {
  id: string;
  titleArabic: string;
  sheikhNameArabic: string;
  categoryId: 'qunoot' | 'khatam' | 'tahajjud' | 'munajat';
  categoryArabic: string;
  durationSeconds: number;
  durationLabel: string;
  audioUrl: string;
  descriptionArabic: string;
}

export interface AudioRuqyahTrack {
  id: string;
  titleArabic: string;
  sheikhNameArabic: string;
  focusArabic: string;
  durationLabel: string;
  audioUrl: string;
  descriptionArabic: string;
}

export interface RuqyahAyahItem {
  surahNumber: number;
  surahNameArabic: string;
  ayahNumber: number;
  text: string;
}

export interface RuqyahQuranSection {
  id: string;
  titleArabic: string;
  benefitArabic: string;
  surahNumberForHeader?: number;
  showBasmalahHeader?: boolean;
  ayahs: RuqyahAyahItem[];
}

export interface RuqyahPropheticDua {
  id: string;
  titleArabic: string;
  text: string;
  repeatCount: number;
  instructionArabic: string;
  reference: string;
}

export const DUAS_OCCASION_FILTERS = [
  { id: 'all', labelArabic: 'جميع الأدعية' },
  { id: 'qunoot', labelArabic: 'دعاء القنوت' },
  { id: 'khatam', labelArabic: 'دعاء ختم القرآن' },
  { id: 'tahajjud', labelArabic: 'قيام الليل والتهجد' },
  { id: 'munajat', labelArabic: 'أدعية خاشعة ومناجاة' },
] as const;

export const SHEIKH_DUAS: AudioDuaTrack[] = [
  {
    id: 'dua_alafasy_qunoot',
    titleArabic: 'دعاء القنوت الخاشع',
    sheikhNameArabic: 'الشيخ مشاري راشد العفاسي',
    categoryId: 'qunoot',
    categoryArabic: 'دعاء القنوت',
    durationSeconds: 615,
    durationLabel: '10:15',
    audioUrl: 'https://archive.org/download/AlafasyQunutDua/AlafasyQunutDua.mp3',
    descriptionArabic: 'دعاء قنوت جامع بصوت ندي خاشع للشيخ مشاري العفاسي.',
  },
  {
    id: 'dua_sudais_khatam',
    titleArabic: 'دعاء ختم القرآن الكريم من المسجد الحرام',
    sheikhNameArabic: 'الشيخ عبد الرحمن السديس',
    categoryId: 'khatam',
    categoryArabic: 'دعاء ختم القرآن',
    durationSeconds: 1840,
    durationLabel: '30:40',
    audioUrl: 'https://archive.org/download/Do3a-Khatm-quran_mp3/03-duaKhatmulQuran2012BySheikhSudais1433.mp3',
    descriptionArabic: 'تسجيل رسمي لدعاء ختم القرآن الكريم في الحرم المكي الشريف.',
  },
  {
    id: 'dua_sudais_qunoot_makkah',
    titleArabic: 'دعاء القنوت في الحرم المكي الشريف',
    sheikhNameArabic: 'الشيخ عبد الرحمن السديس',
    categoryId: 'qunoot',
    categoryArabic: 'دعاء القنوت',
    durationSeconds: 780,
    durationLabel: '13:00',
    audioUrl: 'https://archive.org/download/MakkahDuaAlQunootAudio/MakkahDuaAlQunoot-Night1BySheikhSudais.mp3',
    descriptionArabic: 'قنوت مؤثر من رحاب المسجد الحرام بمكة المكرمة.',
  },
  {
    id: 'dua_maher_qunoot',
    titleArabic: 'دعاء القنوت والتضرع',
    sheikhNameArabic: 'الشيخ ماهر المعيقلي',
    categoryId: 'qunoot',
    categoryArabic: 'دعاء القنوت',
    durationSeconds: 816,
    durationLabel: '13:36',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/06704581435hd.mp3',
    descriptionArabic: 'دعاء قنوت مملوء بالسكينة والرجاء بصوت إمام الحرم المكي الشيخ ماهر المعيقلي.',
  },
  {
    id: 'dua_dosari_munajat',
    titleArabic: 'مناجاة مؤثرة: ربنا إن عصيناك فإننا نحبك',
    sheikhNameArabic: 'الشيخ ياسر الدوسري',
    categoryId: 'munajat',
    categoryArabic: 'أدعية خاشعة ومناجاة',
    durationSeconds: 1123,
    durationLabel: '18:43',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/00----00000.mp3',
    descriptionArabic: 'دعاء ومناجاة خاشعة تلامس القلوب بصوت إمام الحرم المكي الشيخ ياسر الدوسري.',
  },
  {
    id: 'dua_dosari_khatam',
    titleArabic: 'دعاء ختم القرآن الكريم ليلة التاسع والعشرين',
    sheikhNameArabic: 'الشيخ ياسر الدوسري',
    categoryId: 'khatam',
    categoryArabic: 'دعاء ختم القرآن',
    durationSeconds: 2497,
    durationLabel: '41:37',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/011006291435.mp3',
    descriptionArabic: 'دعاء ختم القرآن الكريم بأداء خاشع ومطوّل.',
  },
  {
    id: 'dua_qatami_munajat',
    titleArabic: 'دعاء مبكٍ في الثناء على الله وطلب المغفرة',
    sheikhNameArabic: 'الشيخ ناصر القطامي',
    categoryId: 'munajat',
    categoryArabic: 'أدعية خاشعة ومناجاة',
    durationSeconds: 660,
    durationLabel: '11:00',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/001.mp3',
    descriptionArabic: 'من أخشع الأدعية الرمضانية بصوت القارئ الشيخ ناصر القطامي.',
  },
  {
    id: 'dua_idrees_qunoot',
    titleArabic: 'دعاء القنوت من جامع الشيخ زايد الكبير',
    sheikhNameArabic: 'الشيخ إدريس أبكر',
    categoryId: 'qunoot',
    categoryArabic: 'دعاء القنوت',
    durationSeconds: 635,
    durationLabel: '10:35',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/0150008221435.mp3',
    descriptionArabic: 'دعاء القنوت والخشوع بصوت الشيخ إدريس أبكر.',
  },
  {
    id: 'dua_sudais_tahajjud_27',
    titleArabic: 'دعاء صلاة التهجد ليلة السابع والعشرين',
    sheikhNameArabic: 'الشيخ عبد الرحمن السديس',
    categoryId: 'tahajjud',
    categoryArabic: 'قيام الليل والتهجد',
    durationSeconds: 1160,
    durationLabel: '19:20',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/0130072714352014.mp3',
    descriptionArabic: 'دعاء مؤثر من صلاة القيام والتهجد بالحرم المكي الشريف.',
  },
  {
    id: 'dua_jalil_khatam',
    titleArabic: 'دعاء ختم القرآن الكريم وتفريج الكربات',
    sheikhNameArabic: 'الشيخ خالد الجليل',
    categoryId: 'khatam',
    categoryArabic: 'دعاء ختم القرآن',
    durationSeconds: 1627,
    durationLabel: '27:07',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/014008291435.mp3',
    descriptionArabic: 'دعاء جامع بالرحمة والشفاء والفرج بصوت الشيخ خالد الجليل.',
  },
  {
    id: 'dua_ghamdi_tahajjud',
    titleArabic: 'دعاء صلاة القيام والانكسار بين يدي الله',
    sheikhNameArabic: 'الشيخ سعد الغامدي',
    categoryId: 'tahajjud',
    categoryArabic: 'قيام الليل والتهجد',
    durationSeconds: 250,
    durationLabel: '04:10',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/236101435.mp3',
    descriptionArabic: 'دعاء قصير مؤثر وهادئ بصوت الشيخ سعد الغامدي.',
  },
  {
    id: 'dua_balilah_tahajjud',
    titleArabic: 'دعاء صلاة التهجد وطلب العفو والعافية',
    sheikhNameArabic: 'الشيخ بندر بليلة',
    categoryId: 'tahajjud',
    categoryArabic: 'قيام الليل والتهجد',
    durationSeconds: 890,
    durationLabel: '14:50',
    audioUrl: 'https://archive.org/download/all----years-----mp3--do3aa----traweeh--and--khatm---quran---and--laylat--alqa_717/040025261435.mp3',
    descriptionArabic: 'دعاء قيام الليل من المسجد الحرام بصوت الشيخ بندر بليلة.',
  },
];

export const RUQYAH_AUDIO_TRACKS: AudioRuqyahTrack[] = [
  {
    id: 'ruqyah_alafasy',
    titleArabic: 'الرقية الشرعية الشاملة للتحصين والشفاء',
    sheikhNameArabic: 'الشيخ مشاري راشد العفاسي',
    focusArabic: 'التحصين العام والسكينة',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20By%20Sheikh%20Mishary%20Rashid%20Al%20Fasy.mp3',
    descriptionArabic: 'الرقية الشرعية كاملة من الكتاب والسنة بأداء الشيخ مشاري العفاسي.',
  },
  {
    id: 'ruqyah_maher',
    titleArabic: 'الرقية الشرعية الكاملة بالصوت الهادئ',
    sheikhNameArabic: 'الشيخ ماهر المعيقلي',
    focusArabic: 'الطمأنينة ورفع الهم',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20By%20Sheikh%20Maher%20Al%20Muaiqly.mp3',
    descriptionArabic: 'آيات الشفاء والحفظ والسكينة بصوت إمام الحرم المكي الشيخ ماهر المعيقلي.',
  },
  {
    id: 'ruqyah_sudais',
    titleArabic: 'الرقية الشرعية المأثورة من القرآن الكريم',
    sheikhNameArabic: 'الشيخ عبد الرحمن السديس',
    focusArabic: 'الوقاية من العين والحسد',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20by%20Sheikh%20Abdel%20Rahman%20Al-Sudais.mp3',
    descriptionArabic: 'تسجيل نقي للرقية الشرعية الكاملة بصوت الشيخ عبد الرحمن السديس.',
  },
  {
    id: 'ruqyah_shuraim',
    titleArabic: 'الرقية الشرعية للبيت والأهل والنفس',
    sheikhNameArabic: 'الشيخ سعود الشريم',
    focusArabic: 'حفظ البيت والأبناء',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20By%20Sheikh%20Saood%20As%20Shuraim.mp3',
    descriptionArabic: 'تلاوة مؤثرة لآيات الرقية الشرعية بصوت الشيخ سعود الشريم.',
  },
  {
    id: 'ruqyah_abdulbasit',
    titleArabic: 'الرقية الشرعية بصوت الشيخ عبد الباسط عبد الصمد',
    sheikhNameArabic: 'الشيخ عبد الباسط عبد الصمد',
    focusArabic: 'آيات الشفاء والرحمة',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20by%20Sheikh%20Abdel%20Baset%20Abdel%20Samad.mp3',
    descriptionArabic: 'نخبة آيات الرقية الشرعية والشفاء بتلاوة خاشعة للشيخ عبد الباسط.',
  },
  {
    id: 'ruqyah_ajamy',
    titleArabic: 'الرقية الشرعية الشاملة للشفاء بإذن الله',
    sheikhNameArabic: 'الشيخ أحمد بن علي العجمي',
    focusArabic: 'الشفاء ودفع البلاء',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20by%20Sheikh%20Ahmed%20Bin%20Ali%20Al-Ajamy.mp3',
    descriptionArabic: 'رقية شرعية كاملة معروفة بتأثيرها السكيني بصوت الشيخ أحمد العجمي.',
  },
  {
    id: 'ruqyah_ghamdi',
    titleArabic: 'الرقية الشرعية الهادئة للنوم والسكينة',
    sheikhNameArabic: 'الشيخ سعد الغامدي',
    focusArabic: 'إزالة القلق والأرق',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20By%20Sheikh%20Saad%20Al%20Ghamdi.mp3',
    descriptionArabic: 'تلاوة متزنة للرقية الشرعية بصوت الشيخ سعد الغامدي.',
  },
  {
    id: 'ruqyah_idrees',
    titleArabic: 'الرقية الشرعية الخاشعة المطولة',
    sheikhNameArabic: 'الشيخ إدريس أبكر',
    focusArabic: 'التحصين الشامل',
    durationLabel: 'تلاوة كاملة',
    audioUrl: 'https://archive.org/download/al-ruqyah/Al%20Ruqyah%20Al%20Shariah%20Full%20By%20Sheikh%20Idrees%20Abkar.mp3',
    descriptionArabic: 'رقية شرعية كاملة بأداء روحاني خاشع للشيخ إدريس أبكر.',
  },
];

// Verbatim quran-uthmani Ayahs used in canonical Al-Ruqyah Al-Shariah
export const RUQYAH_QURAN_SECTIONS: RuqyahQuranSection[] = [
  {
    id: 'fatihah',
    titleArabic: '١. سورة الفاتحة (السبع المثاني والشفاء)',
    benefitArabic: 'أعظم سورة في القرآن وهي رقية وشفاء بإذن الله، ثبت في الصحيحين الرقية بها.',
    ayahs: [
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
      { surahNumber: 1, surahNameArabic: 'الفَاتِحَة', ayahNumber: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' },
    ],
  },
  {
    id: 'baqarah_start',
    titleArabic: '٢. فواتح سورة البقرة',
    benefitArabic: 'تثبيت الهداية واليقين وطمأنينة القلب في بداية الرقية.',
    surahNumberForHeader: 2,
    showBasmalahHeader: true,
    ayahs: [
      { surahNumber: 2, surahNameArabic: 'البَقَرَة', ayahNumber: 1, text: 'الٓمٓ' },
      { surahNumber: 2, surahNameArabic: 'البَقَرَة', ayahNumber: 2, text: 'ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًۭى لِّلْمُتَّقِينَ' },
      { surahNumber: 2, surahNameArabic: 'البَقَرَة', ayahNumber: 3, text: 'ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَٰهُمْ يُنفِقُونَ' },
      { surahNumber: 2, surahNameArabic: 'البَقَرَة', ayahNumber: 4, text: 'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْءَاخِرَةِ هُمْ يُوقِنُونَ' },
      { surahNumber: 2, surahNameArabic: 'البَقَرَة', ayahNumber: 5, text: 'أُو۟لَٰٓئِكَ عَلَىٰ هُدًۭى مِّن رَّبِّهِمْ ۖ وَأُو۟لَٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ' },
    ],
  },
  {
    id: 'kursi',
    titleArabic: '٣. آية الكرسي (سورة البقرة: ٢٥٥)',
    benefitArabic: 'أعظم آية في كتاب الله، من قرأها لم يزل عليه من الله حافظ ولا يقربه شيطان.',
    ayahs: [
      {
        surahNumber: 2,
        surahNameArabic: 'البَقَرَة',
        ayahNumber: 255,
        text: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ',
      },
    ],
  },
  {
    id: 'baqarah_end',
    titleArabic: '٤. خواتيم سورة البقرة (٢٨٥–٢٨٦)',
    benefitArabic: 'الآيتان من آخر سورة البقرة من قرأهما في ليلة كفتاه من كل شر وسوء.',
    ayahs: [
      {
        surahNumber: 2,
        surahNameArabic: 'البَقَرَة',
        ayahNumber: 285,
        text: 'ءَامَنَ ٱلرَّسُولُ بِمَآ أُنزِلَ إِلَيْهِ مِن رَّبِّهِۦ وَٱلْمُؤْمِنُونَ ۚ كُلٌّ ءَامَنَ بِٱللَّهِ وَمَلَٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ لَا نُفَرِّقُ بَيْنَ أَحَدٍۢ مِّن رُّسُلِهِۦ ۚ وَقَالُوا۟ سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ ٱلْمَصِيرُ',
      },
      {
        surahNumber: 2,
        surahNameArabic: 'البَقَرَة',
        ayahNumber: 286,
        text: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًۭا كَمَا حَمَلْتَهُۥ عَلَى ٱلَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِۦ ۖ وَٱعْفُ عَنَّا وَٱغْفِرْ لَنَا وَٱرْحَمْنَآ ۚ أَنتَ مَوْلَىٰنَا فَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَٰفِرِينَ',
      },
    ],
  },
  {
    id: 'shifa_hifz',
    titleArabic: '٥. آيات الشفاء والتوكل والتحصين من العين',
    benefitArabic: 'آيات قرآنية جامعة للشفاء واليقين بأن الضر والنفع بيد الله وحده.',
    ayahs: [
      {
        surahNumber: 9,
        surahNameArabic: 'التَّوْبَة',
        ayahNumber: 51,
        text: 'قُل لَّن يُصِيبَنَآ إِلَّا مَا كَتَبَ ٱللَّهُ لَنَا هُوَ مَوْلَىٰنَا ۚ وَعَلَى ٱللَّهِ فَلْيَتَوَكَّلِ ٱلْمُؤْمِنُونَ',
      },
      {
        surahNumber: 10,
        surahNameArabic: 'يُونُس',
        ayahNumber: 57,
        text: 'يَٰٓأَيُّهَا ٱلنَّاسُ قَدْ جَآءَتْكُم مَّوْعِظَةٌۭ مِّن رَّبِّكُمْ وَشِفَآءٌۭ لِّمَا فِى ٱلصُّدُورِ وَهُدًۭى وَرَحْمَةٌۭ لِّلْمُؤْمِنِينَ',
      },
      {
        surahNumber: 17,
        surahNameArabic: 'الإِسْرَاء',
        ayahNumber: 82,
        text: 'وَنُنَزِّلُ مِنَ ٱلْقُرْءَانِ مَا هُوَ شِفَآءٌۭ وَرَحْمَةٌۭ لِّلْمُؤْمِنِينَ ۙ وَلَا يَزِيدُ ٱلظَّٰلِمِينَ إِلَّا خَسَارًۭا',
      },
      {
        surahNumber: 26,
        surahNameArabic: 'الشُّعَرَاء',
        ayahNumber: 80,
        text: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ',
      },
      {
        surahNumber: 68,
        surahNameArabic: 'القَلَم',
        ayahNumber: 51,
        text: 'وَإِن يَكَادُ ٱلَّذِينَ كَفَرُوا۟ لَيُزْلِقُونَكَ بِأَبْصَٰرِهِمْ لَمَّا سَمِعُوا۟ ٱلذِّكْرَ وَيَقُولُونَ إِنَّهُۥ لَمَجْنُونٌۭ',
      },
      {
        surahNumber: 68,
        surahNameArabic: 'القَلَم',
        ayahNumber: 52,
        text: 'وَمَا هُوَ إِلَّا ذِكْرٌۭ لِّلْعَٰلَمِينَ',
      },
    ],
  },
  {
    id: 'ikhlas',
    titleArabic: '٦. سورة الإخلاص (تُقرأ ثلاث مرات)',
    benefitArabic: 'إفراد الله بالتوحيد والصمدية، وتُقرأ مع المعوذتين ثلاثاً في الرقية والصباح والمساء.',
    surahNumberForHeader: 112,
    showBasmalahHeader: true,
    ayahs: [
      { surahNumber: 112, surahNameArabic: 'الإِخْلَاص', ayahNumber: 1, text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' },
      { surahNumber: 112, surahNameArabic: 'الإِخْلَاص', ayahNumber: 2, text: 'ٱللَّهُ ٱلصَّمَدُ' },
      { surahNumber: 112, surahNameArabic: 'الإِخْلَاص', ayahNumber: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
      { surahNumber: 112, surahNameArabic: 'الإِخْلَاص', ayahNumber: 4, text: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ' },
    ],
  },
  {
    id: 'falaq',
    titleArabic: '٧. سورة الفلق (تُقرأ ثلاث مرات)',
    benefitArabic: 'الاستعاذة برب الفلق من شر المخلوقات والسحر والحسد.',
    surahNumberForHeader: 113,
    showBasmalahHeader: true,
    ayahs: [
      { surahNumber: 113, surahNameArabic: 'الفَلَق', ayahNumber: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ' },
      { surahNumber: 113, surahNameArabic: 'الفَلَق', ayahNumber: 2, text: 'مِن شَرِّ مَا خَلَقَ' },
      { surahNumber: 113, surahNameArabic: 'الفَلَق', ayahNumber: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ' },
      { surahNumber: 113, surahNameArabic: 'الفَلَق', ayahNumber: 4, text: 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ' },
      { surahNumber: 113, surahNameArabic: 'الفَلَق', ayahNumber: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ' },
    ],
  },
  {
    id: 'nas',
    titleArabic: '٨. سورة الناس (تُقرأ ثلاث مرات)',
    benefitArabic: 'الاستعاذة برب الناس وملكهم وإلههم من شر الوسواس الخناس.',
    surahNumberForHeader: 114,
    showBasmalahHeader: true,
    ayahs: [
      { surahNumber: 114, surahNameArabic: 'النَّاس', ayahNumber: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ' },
      { surahNumber: 114, surahNameArabic: 'النَّاس', ayahNumber: 2, text: 'مَلِكِ ٱلنَّاسِ' },
      { surahNumber: 114, surahNameArabic: 'النَّاس', ayahNumber: 3, text: 'إِلَٰهِ ٱلنَّاسِ' },
      { surahNumber: 114, surahNameArabic: 'النَّاس', ayahNumber: 4, text: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ' },
      { surahNumber: 114, surahNameArabic: 'النَّاس', ayahNumber: 5, text: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ' },
      { surahNumber: 114, surahNameArabic: 'النَّاس', ayahNumber: 6, text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ' },
    ],
  },
];

export const RUQYAH_PROPHETIC_DUAS: RuqyahPropheticDua[] = [
  {
    id: 'rp1',
    titleArabic: 'دعاء الشفاء النبوي العام',
    text: 'أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا.',
    repeatCount: 3,
    instructionArabic: 'يُقرأ مع المسح باليد اليمنى على موضع الألم أو على المريض.',
    reference: 'صحيح البخاري (5743) وصحيح مسلم (2191)',
  },
  {
    id: 'rp2',
    titleArabic: 'رقية جبريل عليه السلام للنبي ﷺ',
    text: 'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ.',
    repeatCount: 3,
    instructionArabic: 'من أجمع الأدعية النبوية للرقية من العين والحسد والأذى.',
    reference: 'صحيح مسلم (2186)',
  },
  {
    id: 'rp3',
    titleArabic: 'دعاء موضع الألم في الجسد',
    text: 'بِسْمِ اللَّهِ (ثلاثاً)، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ.',
    repeatCount: 7,
    instructionArabic: 'يضع المصاب يده على الذي يألم من جسده ويقول بسم الله ثلاثاً ثم الدعاء سبع مرات.',
    reference: 'صحيح مسلم (2202)',
  },
  {
    id: 'rp4',
    titleArabic: 'تعويذ الأبناء والأهل',
    text: 'أُعِيذُكُمَا بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ.',
    repeatCount: 3,
    instructionArabic: 'كان النبي ﷺ يعوّذ به الحسن والحسين رضي الله عنهما.',
    reference: 'صحيح البخاري (3371)',
  },
  {
    id: 'rp5',
    titleArabic: 'الاستعاذة بكلمات الله التامات',
    text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.',
    repeatCount: 3,
    instructionArabic: 'حصن عظيم عند نزول منزل أو الشعور بالوحشة أو الأذى.',
    reference: 'صحيح مسلم (2708)',
  },
  {
    id: 'rp6',
    titleArabic: 'الدعاء الجامع للحفظ من البلاء المفاجئ',
    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    repeatCount: 3,
    instructionArabic: 'يُقال ثلاث مرات صباحاً ومساءً وعند الرقية.',
    reference: 'سنن أبي داود (5088) والترمذي (3388)',
  },
  {
    id: 'rp7',
    titleArabic: 'الدعاء للمريض عند عيادته',
    text: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ.',
    repeatCount: 7,
    instructionArabic: 'من عاد مريضاً لم يحضر أجله فقالها سبع مرات عافاه الله من ذلك المرض.',
    reference: 'سنن أبي داود (3106) والترمذي (2083)',
  },
];

export type WrittenDuaCategory =
  | 'all'
  | 'jawami'
  | 'relief'
  | 'rizq'
  | 'forgiveness'
  | 'parents'
  | 'daily';

export interface WrittenDuaItem {
  id: string;
  categoryId: Exclude<WrittenDuaCategory, 'all'>;
  categoryArabic: string;
  titleArabic: string;
  text: string;
  benefitArabic: string;
  reference: string;
  repeatCount: number;
}

export const WRITTEN_DUA_CATEGORIES: Array<{ id: WrittenDuaCategory; labelArabic: string }> = [
  { id: 'all', labelArabic: 'جميع الأدعية' },
  { id: 'jawami', labelArabic: 'جوامع الدعاء' },
  { id: 'relief', labelArabic: 'الفرج والهم والكرب' },
  { id: 'forgiveness', labelArabic: 'المغفرة والتوبة' },
  { id: 'rizq', labelArabic: 'الرزق والبركة والعافية' },
  { id: 'parents', labelArabic: 'الوالدين والأهل والذرية' },
  { id: 'daily', labelArabic: 'الاستخارة والسفر والعبادة' },
];

export const COMPREHENSIVE_WRITTEN_DUAS: WrittenDuaItem[] = [
  {
    id: 'wd_1',
    categoryId: 'jawami',
    categoryArabic: 'جوامع الدعاء',
    titleArabic: 'أجمع دعاء في القرآن الكريم (ربنا آتنا في الدنيا حسنة)',
    text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
    benefitArabic: 'أكثر دعاء كان يدعو به النبي ﷺ لجمعه خيرَي الدنيا والآخرة.',
    reference: 'سورة البقرة: 201 · صحيح البخاري (6389)',
    repeatCount: 1,
  },
  {
    id: 'wd_2',
    categoryId: 'jawami',
    categoryArabic: 'جوامع الدعاء',
    titleArabic: 'دعاء الهداية والتقوى والعفاف والغنى',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى.',
    benefitArabic: 'سؤال الله الاستقامة، والبعد عن المحارم، وغنى النفس عن الناس.',
    reference: 'صحيح مسلم (2721)',
    repeatCount: 1,
  },
  {
    id: 'wd_3',
    categoryId: 'jawami',
    categoryArabic: 'جوامع الدعاء',
    titleArabic: 'دعاء إصلاح الدين والدنيا والآخرة',
    text: 'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.',
    benefitArabic: 'دعاء نبوي عظيم يشمل صلاح شأن المسلم كله في معاشه ومعاده.',
    reference: 'صحيح مسلم (2720)',
    repeatCount: 1,
  },
  {
    id: 'wd_4',
    categoryId: 'jawami',
    categoryArabic: 'جوامع الدعاء',
    titleArabic: 'دعاء جوامع الخير كله عاجله وآجله',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ عَبْدُكَ وَنَبِيُّكَ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا عَاذَ بِهِ عَبْدُكَ وَنَبِيُّكَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ قَضَاءٍ قَضَيْتَهُ لِي خَيْرًا.',
    benefitArabic: 'علّمه النبي ﷺ لأم المؤمنين عائشة رضي الله عنها وسمّاه بالجوامع الكوامل.',
    reference: 'سنن ابن ماجه (3846) وصححه الألباني',
    repeatCount: 1,
  },
  {
    id: 'wd_5',
    categoryId: 'jawami',
    categoryArabic: 'جوامع الدعاء',
    titleArabic: 'دعاء ثبات القلب على الدين',
    text: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ.',
    benefitArabic: 'أكثر دعاء كان النبي ﷺ يدعو به طلباً للثبات على الحق.',
    reference: 'سنن الترمذي (2140)',
    repeatCount: 3,
  },
  {
    id: 'wd_6',
    categoryId: 'relief',
    categoryArabic: 'الفرج والهم والكرب',
    titleArabic: 'دعاء ذي النون عليه السلام لتفريج الكروب',
    text: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ.',
    benefitArabic: 'لم يدعُ بها رجل مسلم في شيء قط إلا استجاب الله له.',
    reference: 'سورة الأنبياء: 87 · سنن الترمذي (3505)',
    repeatCount: 3,
  },
  {
    id: 'wd_7',
    categoryId: 'relief',
    categoryArabic: 'الفرج والهم والكرب',
    titleArabic: 'دعاء الهم والحزن وإبداله فرحاً',
    text: 'اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ، سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلَاءَ حُزْنِي، وَذَهَابَ هَمِّي.',
    benefitArabic: 'ما أصاب أحداً هم ولا حزن فقاله إلا أذهب الله همه وأبدله مكانه فرحاً.',
    reference: 'مسند أحمد (3712) وصححه الألباني',
    repeatCount: 1,
  },
  {
    id: 'wd_8',
    categoryId: 'relief',
    categoryArabic: 'الفرج والهم والكرب',
    titleArabic: 'دعاء الكرب الشديد',
    text: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ.',
    benefitArabic: 'كان رسول الله ﷺ يدعو به عند الكرب والشدة.',
    reference: 'صحيح البخاري (6346) وصحيح مسلم (2730)',
    repeatCount: 1,
  },
  {
    id: 'wd_9',
    categoryId: 'relief',
    categoryArabic: 'الفرج والهم والكرب',
    titleArabic: 'دعاء المكروب والرجاء التام',
    text: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَهَ إِلَّا أَنْتَ.',
    benefitArabic: 'دعوات المكروب بالانقطاع إلى الله وحده.',
    reference: 'سنن أبي داود (5090)',
    repeatCount: 3,
  },
  {
    id: 'wd_10',
    categoryId: 'relief',
    categoryArabic: 'الفرج والهم والكرب',
    titleArabic: 'دعاء تفويض الأمر إلى الله',
    text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ.',
    benefitArabic: 'ذكر عظيم عند الخوف والشدائد قاله إبراهيم ومحمد عليهما الصلاة والسلام.',
    reference: 'سورة آل عمران: 173 · صحيح البخاري (4563)',
    repeatCount: 7,
  },
  {
    id: 'wd_11',
    categoryId: 'forgiveness',
    categoryArabic: 'المغفرة والتوبة',
    titleArabic: 'سيد الاستغفار',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
    benefitArabic: 'أفضل صيغ الاستغفار، موجب للجنة لمن قاله موقناً في صباحه أو مسائه.',
    reference: 'صحيح البخاري (6306)',
    repeatCount: 1,
  },
  {
    id: 'wd_12',
    categoryId: 'forgiveness',
    categoryArabic: 'المغفرة والتوبة',
    titleArabic: 'الاستغفار الجامع للذنوب كلها',
    text: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ.',
    benefitArabic: 'يُقال في السجود وفي سائر الأوقات لطلب المغفرة الشاملة.',
    reference: 'صحيح مسلم (483)',
    repeatCount: 1,
  },
  {
    id: 'wd_13',
    categoryId: 'forgiveness',
    categoryArabic: 'المغفرة والتوبة',
    titleArabic: 'دعاء ليلة القدر والعفو',
    text: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي.',
    benefitArabic: 'علّمه النبي ﷺ لأم المؤمنين عائشة رضي الله عنها في ليلة القدر وكل وقت.',
    reference: 'سنن الترمذي (3513) وابن ماجه (3850)',
    repeatCount: 3,
  },
  {
    id: 'wd_14',
    categoryId: 'forgiveness',
    categoryArabic: 'المغفرة والتوبة',
    titleArabic: 'دعاء آدم وحواء عليهما السلام عند التوبة',
    text: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ.',
    benefitArabic: 'دعاء قرآني مأثور بالاعتراف والتوبة والإنابة إلى الله.',
    reference: 'سورة الأعراف: 23',
    repeatCount: 1,
  },
  {
    id: 'wd_15',
    categoryId: 'rizq',
    categoryArabic: 'الرزق والبركة والعافية',
    titleArabic: 'دعاء قضاء الدَّين والغنى بالحلال',
    text: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ.',
    benefitArabic: 'لو كان على المسلم مثل جبل صير دَيناً أدّاه الله عنه بهذا الدعاء الصادق.',
    reference: 'سنن الترمذي (3563)',
    repeatCount: 3,
  },
  {
    id: 'wd_16',
    categoryId: 'rizq',
    categoryArabic: 'الرزق والبركة والعافية',
    titleArabic: 'دعاء العلم النافع والرزق الطيب والعمل المتقبل',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.',
    benefitArabic: 'كان النبي ﷺ يدعو به بعد صلاة الفجر وفي كل صباح.',
    reference: 'سنن ابن ماجه (925)',
    repeatCount: 1,
  },
  {
    id: 'wd_17',
    categoryId: 'rizq',
    categoryArabic: 'الرزق والبركة والعافية',
    titleArabic: 'دعاء العافية في الدنيا والآخرة',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، وَاحْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.',
    benefitArabic: 'ما سُئل الله شيئاً أحب إليه من العافية؛ دعاء للحفظ من الجهات الست.',
    reference: 'سنن أبي داود (5074) وابن ماجه (3871)',
    repeatCount: 1,
  },
  {
    id: 'wd_18',
    categoryId: 'rizq',
    categoryArabic: 'الرزق والبركة والعافية',
    titleArabic: 'دعاء طلب الرزق ومفتاح الخير',
    text: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ.',
    benefitArabic: 'دعاء نبي الله موسى عليه السلام ففتح الله له به أبواب الرزق والمأوى.',
    reference: 'سورة القصص: 24',
    repeatCount: 3,
  },
  {
    id: 'wd_19',
    categoryId: 'parents',
    categoryArabic: 'الوالدين والأهل والذرية',
    titleArabic: 'الدعاء القرآني للوالدين بالرحمة',
    text: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا.',
    benefitArabic: 'أعظم بر بالوالدين حيين وميتين بالدعاء لهما بالرحمة الواسعة.',
    reference: 'سورة الإسراء: 24',
    repeatCount: 3,
  },
  {
    id: 'wd_20',
    categoryId: 'parents',
    categoryArabic: 'الوالدين والأهل والذرية',
    titleArabic: 'دعاء صلاح الزوج والذرية',
    text: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا.',
    benefitArabic: 'دعاء عباد الرحمن لصلاح الأهل والأبناء واستقامتهم.',
    reference: 'سورة الفرقان: 74',
    repeatCount: 1,
  },
  {
    id: 'wd_21',
    categoryId: 'parents',
    categoryArabic: 'الوالدين والأهل والذرية',
    titleArabic: 'دعاء إقامة الصلاة والذرية الصالحة',
    text: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ ۝ رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ.',
    benefitArabic: 'دعاء خليل الرحمن إبراهيم عليه السلام للمداومة على الصلاة والمغفرة للوالدين والمؤمنين.',
    reference: 'سورة إبراهيم: 40–41',
    repeatCount: 1,
  },
  {
    id: 'wd_22',
    categoryId: 'daily',
    categoryArabic: 'الاستخارة والسفر والعبادة',
    titleArabic: 'دعاء المعونة على الذكر والشكر وحسن العبادة',
    text: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ.',
    benefitArabic: 'أوصى النبي ﷺ معاذ بن جبل ألا يدع قولها دبر كل صلاة.',
    reference: 'سنن أبي داود (1522) والنسائي (1303)',
    repeatCount: 1,
  },
  {
    id: 'wd_23',
    categoryId: 'daily',
    categoryArabic: 'الاستخارة والسفر والعبادة',
    titleArabic: 'دعاء الاستخارة في الأمور كلها',
    text: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ، اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي بِهِ.',
    benefitArabic: 'يُقرأ بعد ركعتين غير الفريضة مع تسمية الحاجة.',
    reference: 'صحيح البخاري (1162)',
    repeatCount: 1,
  },
  {
    id: 'wd_24',
    categoryId: 'daily',
    categoryArabic: 'الاستخارة والسفر والعبادة',
    titleArabic: 'دعاء السفر والركوب',
    text: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ ۝ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ، اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ.',
    benefitArabic: 'سنة نبوية ثابتة عند استواء المسافر على راحلته أو مركبته.',
    reference: 'صحيح مسلم (1342)',
    repeatCount: 1,
  },
];

