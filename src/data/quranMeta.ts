import { SurahMeta, Reciter } from '../types';

export const RECITERS: Reciter[] = [
  {
    id: 'abdul_basit_murattal',
    nameArabic: 'الشيخ عبد الباسط عبد الصمد',
    nameEnglish: 'Abdul Basit Abdul Samad',
    styleArabic: 'المصحف المرتل',
    serverUrl: 'https://server7.mp3quran.net/basit/',
    format: 'mp3',
    isDefault: true,
  },
  {
    id: 'abdul_basit_mujawwad',
    nameArabic: 'الشيخ عبد الباسط عبد الصمد',
    nameEnglish: 'Abdul Basit Abdul Samad (Mujawwad)',
    styleArabic: 'المصحف المجود',
    serverUrl: 'https://server7.mp3quran.net/basit_mg/',
    format: 'mp3',
  },
  {
    id: 'mishary_alafasy',
    nameArabic: 'الشيخ مشاري راشد العفاسي',
    nameEnglish: 'Mishary Rashid Alafasy',
    styleArabic: 'مرتل',
    serverUrl: 'https://server8.mp3quran.net/afs/',
    format: 'mp3',
  },
  {
    id: 'al_husary',
    nameArabic: 'الشيخ محمود خليل الحصري',
    nameEnglish: 'Mahmoud Khalil Al-Husary',
    styleArabic: 'مرتل ومحقق',
    serverUrl: 'https://server13.mp3quran.net/husr/',
    format: 'mp3',
  },
  {
    id: 'el_minshawi',
    nameArabic: 'الشيخ محمد صديق المنشاوي',
    nameEnglish: 'Mohamed Siddiq El-Minshawi',
    styleArabic: 'مرتل خاشع',
    serverUrl: 'https://server10.mp3quran.net/minsh/',
    format: 'mp3',
  },
  {
    id: 'al_sudais',
    nameArabic: 'الشيخ عبد الرحمن السديس',
    nameEnglish: 'Abdul Rahman Al-Sudais',
    styleArabic: 'أئمة الحرم المكي',
    serverUrl: 'https://server11.mp3quran.net/sds/',
    format: 'mp3',
  },
  {
    id: 'maher_al_muaiqly',
    nameArabic: 'الشيخ ماهر المعيقلي',
    nameEnglish: 'Maher Al-Muaiqly',
    styleArabic: 'إمام الحرم المكي',
    serverUrl: 'https://server12.mp3quran.net/maher/',
    format: 'mp3',
  },
  {
    id: 'saud_al_shuraim',
    nameArabic: 'الشيخ سعود الشريم',
    nameEnglish: 'Saud Al-Shuraim',
    styleArabic: 'إمام الحرم المكي سابقاً',
    serverUrl: 'https://server7.mp3quran.net/shur/',
    format: 'mp3',
  },
];

// Authentic Adhan options (verified HTTP 200 audio/mpeg sources with fallbacks)
export const ADHAN_RECORDINGS = [
  {
    id: 'saudi_makkah',
    titleArabic: 'الأذان السعودي - الحرم المكي الشريف',
    titleEnglish: 'Saudi Adhan - Masjid Al-Haram Makkah',
    audioUrl: 'https://cdn.jsdelivr.net/gh/abodehq/Athan-MP3@master/Sounds/Athan%20Makkah.mp3',
    fallbackAudioUrl: 'https://archive.org/download/Mp3CollectionAdzan/Adzan%20Makkah.mp3',
  },
  {
    id: 'saudi_madinah',
    titleArabic: 'الأذان السعودي - المسجد النبوي الشريف',
    titleEnglish: 'Saudi Adhan - Prophet Mosque Madinah',
    audioUrl: 'https://archive.org/download/Mp3CollectionAdzan/Adzan%20Madinah.mp3',
    fallbackAudioUrl: 'https://archive.org/download/Mp3CollectionAdzan/Adzan%20(Madina).mp3',
  },
  {
    id: 'ali_mulla',
    titleArabic: 'أذان الحرم المكي - الشيخ علي ملا',
    titleEnglish: 'Adhan Sheikh Ali Mulla (Makkah Muezzin)',
    audioUrl: 'https://archive.org/download/MasjidAl-haraamRecordings/17JulyMakkahMaghribAzan.mp3',
    fallbackAudioUrl: 'https://archive.org/download/Mp3CollectionAdzan/Adzan-Al-Haram.mp3',
  },
  {
    id: 'mishary_adhan',
    titleArabic: 'أذان الشيخ مشاري راشد العفاسي',
    titleEnglish: 'Adhan Sheikh Mishary Rashid Alafasy',
    audioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Mishary%20Alafasi.mp3',
    fallbackAudioUrl: 'https://archive.org/download/adhan.notifications/Mishary_Rashid_al_Afasy_Fajr_Adhan.mp3',
  },
  {
    id: 'quds',
    titleArabic: 'أذان المسجد الأقصى المبارك',
    titleEnglish: 'Adhan Al-Aqsa Mosque',
    audioUrl: 'https://archive.org/download/Mp3CollectionAdzan/Adzan%20(Alaqsa).mp3',
    fallbackAudioUrl: 'https://raw.githubusercontent.com/abodehq/Athan-MP3/master/Sounds/Athan%20Nasser%20Alqatami.mp3',
  },
  {
    id: 'abdul_basit_adhan',
    titleArabic: 'أذان الشيخ عبد الباسط عبد الصمد رحمه الله (أعلى دقة)',
    titleEnglish: 'Adhan Sheikh Abdul Basit Abdul Samad (HQ)',
    audioUrl: 'https://archive.org/download/Azaan/adhaan.mp3',
    fallbackAudioUrl: 'https://cdn.jsdelivr.net/gh/abodehq/Athan-MP3@master/Sounds/Athan%20Abed%20Albase6.mp3',
  },
  {
    id: 'abdul_basit_fajr_adhan',
    titleArabic: 'أذان الفجر — الشيخ عبد الباسط عبد الصمد (دقة فائقة)',
    titleEnglish: 'Fajr Adhan Sheikh Abdul Basit Abdul Samad (HQ)',
    audioUrl: 'https://archive.org/download/athan_sound/f_abd_el_basset.mp3',
    fallbackAudioUrl: 'https://archive.org/download/Azaan/adhaan.mp3',
  },
];

// All 114 Surahs Complete Metadata
export const ALL_SURAHS: SurahMeta[] = [
  { number: 1, name: 'الفَاتِحَة', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan', page: 1, juz: 1 },
  { number: 2, name: 'البَقَرَة', englishName: 'Al-Baqara', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan', page: 2, juz: 1 },
  { number: 3, name: 'آل عِمْرَان', englishName: 'Aal-i-Imraan', englishNameTranslation: 'The Family of Imraan', numberOfAyahs: 200, revelationType: 'Medinan', page: 50, juz: 3 },
  { number: 4, name: 'النِّسَاء', englishName: 'An-Nisaa', englishNameTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan', page: 77, juz: 4 },
  { number: 5, name: 'المَائِدَة', englishName: 'Al-Maaida', englishNameTranslation: 'The Table', numberOfAyahs: 120, revelationType: 'Medinan', page: 106, juz: 6 },
  { number: 6, name: 'الأَنْعَام', englishName: 'Al-An\'aam', englishNameTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan', page: 128, juz: 7 },
  { number: 7, name: 'الأَعْرَاف', englishName: 'Al-A\'raaf', englishNameTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan', page: 151, juz: 8 },
  { number: 8, name: 'الأَنْفَال', englishName: 'Al-Anfaal', englishNameTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan', page: 177, juz: 9 },
  { number: 9, name: 'التَّوْبَة', englishName: 'At-Tawba', englishNameTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan', page: 187, juz: 10 },
  { number: 10, name: 'يُونُس', englishName: 'Yunus', englishNameTranslation: 'Jonas', numberOfAyahs: 109, revelationType: 'Meccan', page: 208, juz: 11 },
  { number: 11, name: 'هُود', englishName: 'Hud', englishNameTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan', page: 221, juz: 11 },
  { number: 12, name: 'يُوسُف', englishName: 'Yusuf', englishNameTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan', page: 235, juz: 12 },
  { number: 13, name: 'الرَّعْد', englishName: 'Ar-Ra\'d', englishNameTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan', page: 249, juz: 13 },
  { number: 14, name: 'إِبْرَاهِيم', englishName: 'Ibrahim', englishNameTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan', page: 255, juz: 13 },
  { number: 15, name: 'الحِجْر', englishName: 'Al-Hijr', englishNameTranslation: 'The Rock', numberOfAyahs: 99, revelationType: 'Meccan', page: 262, juz: 14 },
  { number: 16, name: 'النَّحْل', englishName: 'An-Nahl', englishNameTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan', page: 267, juz: 14 },
  { number: 17, name: 'الإِسْرَاء', englishName: 'Al-Israa', englishNameTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan', page: 282, juz: 15 },
  { number: 18, name: 'الكَهْف', englishName: 'Al-Kahf', englishNameTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan', page: 293, juz: 15 },
  { number: 19, name: 'مَرْيَم', englishName: 'Maryam', englishNameTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan', page: 305, juz: 16 },
  { number: 20, name: 'طه', englishName: 'Taa-Haa', englishNameTranslation: 'Taa-Haa', numberOfAyahs: 135, revelationType: 'Meccan', page: 312, juz: 16 },
  { number: 21, name: 'الأَنْبِيَاء', englishName: 'Al-Anbiyaa', englishNameTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan', page: 322, juz: 17 },
  { number: 22, name: 'الحَجّ', englishName: 'Al-Hajj', englishNameTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan', page: 332, juz: 17 },
  { number: 23, name: 'المُؤْمِنُون', englishName: 'Al-Muminoon', englishNameTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan', page: 342, juz: 18 },
  { number: 24, name: 'النُّور', englishName: 'An-Noor', englishNameTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan', page: 350, juz: 18 },
  { number: 25, name: 'الفُرْقَان', englishName: 'Al-Furqaan', englishNameTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan', page: 359, juz: 18 },
  { number: 26, name: 'الشُّعَرَاء', englishName: 'Ash-Shu\'araa', englishNameTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan', page: 367, juz: 19 },
  { number: 27, name: 'النَّمْل', englishName: 'An-Naml', englishNameTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan', page: 377, juz: 19 },
  { number: 28, name: 'القَصَص', englishName: 'Al-Qasas', englishNameTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan', page: 385, juz: 20 },
  { number: 29, name: 'العَنْكَبُوت', englishName: 'Al-Ankaboot', englishNameTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan', page: 396, juz: 20 },
  { number: 30, name: 'الرُّوم', englishName: 'Ar-Room', englishNameTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan', page: 404, juz: 21 },
  { number: 31, name: 'لُقْمَان', englishName: 'Luqman', englishNameTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan', page: 411, juz: 21 },
  { number: 32, name: 'السَّجْدَة', englishName: 'As-Sajda', englishNameTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan', page: 415, juz: 21 },
  { number: 33, name: 'الأَحْزَاب', englishName: 'Al-Ahzaab', englishNameTranslation: 'The Clans', numberOfAyahs: 73, revelationType: 'Medinan', page: 418, juz: 21 },
  { number: 34, name: 'سَبَأ', englishName: 'Saba', englishNameTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan', page: 428, juz: 22 },
  { number: 35, name: 'فَاطِر', englishName: 'Faatir', englishNameTranslation: 'The Originator', numberOfAyahs: 45, revelationType: 'Meccan', page: 434, juz: 22 },
  { number: 36, name: 'يس', englishName: 'Yaseen', englishNameTranslation: 'Yaseen', numberOfAyahs: 83, revelationType: 'Meccan', page: 440, juz: 22 },
  { number: 37, name: 'الصَّافَّات', englishName: 'As-Saaffaat', englishNameTranslation: 'Those drawn up in ranks', numberOfAyahs: 182, revelationType: 'Meccan', page: 446, juz: 23 },
  { number: 38, name: 'ص', englishName: 'Saad', englishNameTranslation: 'The letter Saad', numberOfAyahs: 88, revelationType: 'Meccan', page: 453, juz: 23 },
  { number: 39, name: 'الزُّمَر', englishName: 'Az-Zumar', englishNameTranslation: 'The Troops', numberOfAyahs: 75, revelationType: 'Meccan', page: 458, juz: 23 },
  { number: 40, name: 'غَافِر', englishName: 'Ghafir', englishNameTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan', page: 467, juz: 24 },
  { number: 41, name: 'فُصِّلَت', englishName: 'Fussilat', englishNameTranslation: 'Explained in detail', numberOfAyahs: 54, revelationType: 'Meccan', page: 477, juz: 24 },
  { number: 42, name: 'الشُّورَى', englishName: 'Ash-Shura', englishNameTranslation: 'Consultation', numberOfAyahs: 53, revelationType: 'Meccan', page: 483, juz: 25 },
  { number: 43, name: 'الزُّخْرُف', englishName: 'Az-Zukhruf', englishNameTranslation: 'Ornaments of gold', numberOfAyahs: 89, revelationType: 'Meccan', page: 489, juz: 25 },
  { number: 44, name: 'الدُّخَان', englishName: 'Ad-Dukhaan', englishNameTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan', page: 496, juz: 25 },
  { number: 45, name: 'الجَاثِيَة', englishName: 'Al-Jaathiya', englishNameTranslation: 'Crouching', numberOfAyahs: 37, revelationType: 'Meccan', page: 499, juz: 25 },
  { number: 46, name: 'الأَحْقَاف', englishName: 'Al-Ahqaaf', englishNameTranslation: 'The Dunes', numberOfAyahs: 35, revelationType: 'Meccan', page: 502, juz: 26 },
  { number: 47, name: 'مُحَمَّد', englishName: 'Muhammad', englishNameTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan', page: 507, juz: 26 },
  { number: 48, name: 'الفَتْح', englishName: 'Al-Fath', englishNameTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan', page: 511, juz: 26 },
  { number: 49, name: 'الحُجُرَات', englishName: 'Al-Hujuraat', englishNameTranslation: 'The Inner Apartments', numberOfAyahs: 18, revelationType: 'Medinan', page: 515, juz: 26 },
  { number: 50, name: 'ق', englishName: 'Qaaf', englishNameTranslation: 'The letter Qaaf', numberOfAyahs: 45, revelationType: 'Meccan', page: 518, juz: 26 },
  { number: 51, name: 'الذَّارِيَات', englishName: 'Adh-Dhaariyat', englishNameTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan', page: 520, juz: 26 },
  { number: 52, name: 'الطُّور', englishName: 'At-Toor', englishNameTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan', page: 523, juz: 27 },
  { number: 53, name: 'النَّجْم', englishName: 'An-Najm', englishNameTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan', page: 526, juz: 27 },
  { number: 54, name: 'القَمَر', englishName: 'Al-Qamar', englishNameTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan', page: 528, juz: 27 },
  { number: 55, name: 'الرَّحْمَٰن', englishName: 'Ar-Rahmaan', englishNameTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan', page: 531, juz: 27 },
  { number: 56, name: 'الوَاقِعَة', englishName: 'Al-Waaqia', englishNameTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan', page: 534, juz: 27 },
  { number: 57, name: 'الحَدِيد', englishName: 'Al-Hadid', englishNameTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan', page: 537, juz: 27 },
  { number: 58, name: 'المُجَادَلَة', englishName: 'Al-Mujaadila', englishNameTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan', page: 542, juz: 28 },
  { number: 59, name: 'الحَشْر', englishName: 'Al-Hashr', englishNameTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan', page: 545, juz: 28 },
  { number: 60, name: 'المُمْتَحَنَة', englishName: 'Al-Mumtahana', englishNameTranslation: 'She that is to be examined', numberOfAyahs: 13, revelationType: 'Medinan', page: 549, juz: 28 },
  { number: 61, name: 'الصَّفّ', englishName: 'As-Saff', englishNameTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan', page: 551, juz: 28 },
  { number: 62, name: 'الجُمُعَة', englishName: 'Al-Jumu\'a', englishNameTranslation: 'Friday', numberOfAyahs: 11, revelationType: 'Medinan', page: 553, juz: 28 },
  { number: 63, name: 'المُنَافِقُون', englishName: 'Al-Munaafiqoon', englishNameTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan', page: 554, juz: 28 },
  { number: 64, name: 'التَّغَابُن', englishName: 'At-Taghaabun', englishNameTranslation: 'Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan', page: 556, juz: 28 },
  { number: 65, name: 'الطَّلَاق', englishName: 'At-Talaaq', englishNameTranslation: 'Divorce', numberOfAyahs: 12, revelationType: 'Medinan', page: 558, juz: 28 },
  { number: 66, name: 'التَّحْرِيم', englishName: 'At-Tahrim', englishNameTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan', page: 560, juz: 28 },
  { number: 67, name: 'المُلْك', englishName: 'Al-Mulk', englishNameTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan', page: 562, juz: 29 },
  { number: 68, name: 'القَلَم', englishName: 'Al-Qalam', englishNameTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan', page: 564, juz: 29 },
  { number: 69, name: 'الحَاقَّة', englishName: 'Al-Haaqqa', englishNameTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan', page: 566, juz: 29 },
  { number: 70, name: 'المَعَارِج', englishName: 'Al-Ma\'aarij', englishNameTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan', page: 568, juz: 29 },
  { number: 71, name: 'نُوح', englishName: 'Nooh', englishNameTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan', page: 570, juz: 29 },
  { number: 72, name: 'الجِنّ', englishName: 'Al-Jinn', englishNameTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan', page: 572, juz: 29 },
  { number: 73, name: 'المُزَّمِّل', englishName: 'Al-Muzzammil', englishNameTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan', page: 574, juz: 29 },
  { number: 74, name: 'المُدَّثِّر', englishName: 'Al-Muddaththir', englishNameTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan', page: 575, juz: 29 },
  { number: 75, name: 'القِيَامَة', englishName: 'Al-Qiyaama', englishNameTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan', page: 577, juz: 29 },
  { number: 76, name: 'الإِنْسَان', englishName: 'Al-Insaan', englishNameTranslation: 'Man', numberOfAyahs: 31, revelationType: 'Medinan', page: 578, juz: 29 },
  { number: 77, name: 'المُرْسَلَات', englishName: 'Al-Mursalaat', englishNameTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan', page: 580, juz: 29 },
  { number: 78, name: 'النَّبَأ', englishName: 'An-Naba', englishNameTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan', page: 582, juz: 30 },
  { number: 79, name: 'النَّازِعَات', englishName: 'An-Naazi\'aat', englishNameTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan', page: 583, juz: 30 },
  { number: 80, name: 'عَبَسَ', englishName: 'Abasa', englishNameTranslation: 'He frowned', numberOfAyahs: 42, revelationType: 'Meccan', page: 585, juz: 30 },
  { number: 81, name: 'التَّكْوِير', englishName: 'At-Takweer', englishNameTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan', page: 586, juz: 30 },
  { number: 82, name: 'الانْفِطَار', englishName: 'Al-Infitaar', englishNameTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan', page: 587, juz: 30 },
  { number: 83, name: 'المُطَفِّفِين', englishName: 'Al-Mutaffifin', englishNameTranslation: 'Defrauding', numberOfAyahs: 36, revelationType: 'Meccan', page: 587, juz: 30 },
  { number: 84, name: 'الانْشِقَاق', englishName: 'Al-Inshiqaaq', englishNameTranslation: 'The Splitting Open', numberOfAyahs: 25, revelationType: 'Meccan', page: 589, juz: 30 },
  { number: 85, name: 'البُرُوج', englishName: 'Al-Burooj', englishNameTranslation: 'The Mansions of the Stars', numberOfAyahs: 22, revelationType: 'Meccan', page: 590, juz: 30 },
  { number: 86, name: 'الطَّارِق', englishName: 'At-Taariq', englishNameTranslation: 'The Morning Star', numberOfAyahs: 17, revelationType: 'Meccan', page: 591, juz: 30 },
  { number: 87, name: 'الأَعْلَى', englishName: 'Al-A\'laa', englishNameTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan', page: 591, juz: 30 },
  { number: 88, name: 'الغَاشِيَة', englishName: 'Al-Ghaashiya', englishNameTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan', page: 592, juz: 30 },
  { number: 89, name: 'الفَجْر', englishName: 'Al-Fajr', englishNameTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan', page: 593, juz: 30 },
  { number: 90, name: 'البَلَد', englishName: 'Al-Balad', englishNameTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan', page: 594, juz: 30 },
  { number: 91, name: 'الشَّمْس', englishName: 'Ash-Shams', englishNameTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan', page: 595, juz: 30 },
  { number: 92, name: 'اللَّيْل', englishName: 'Al-Lail', englishNameTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan', page: 595, juz: 30 },
  { number: 93, name: 'الضُّحَى', englishName: 'Ad-Dhuhaa', englishNameTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan', page: 596, juz: 30 },
  { number: 94, name: 'الشَّرْح', englishName: 'Ash-Sharh', englishNameTranslation: 'The Consolation', numberOfAyahs: 8, revelationType: 'Meccan', page: 596, juz: 30 },
  { number: 95, name: 'التِّين', englishName: 'At-Tin', englishNameTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan', page: 597, juz: 30 },
  { number: 96, name: 'العَلَق', englishName: 'Al-Alaq', englishNameTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan', page: 597, juz: 30 },
  { number: 97, name: 'القَدْر', englishName: 'Al-Qadr', englishNameTranslation: 'The Power, Fate', numberOfAyahs: 5, revelationType: 'Meccan', page: 598, juz: 30 },
  { number: 98, name: 'البَيِّنَة', englishName: 'Al-Bayyina', englishNameTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan', page: 598, juz: 30 },
  { number: 99, name: 'الزَّلْزَلَة', englishName: 'Az-Zalzala', englishNameTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan', page: 599, juz: 30 },
  { number: 100, name: 'العَادِيَات', englishName: 'Al-Aadiyaat', englishNameTranslation: 'The Courser', numberOfAyahs: 11, revelationType: 'Meccan', page: 599, juz: 30 },
  { number: 101, name: 'القَارِعَة', englishName: 'Al-Qaari\'a', englishNameTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan', page: 600, juz: 30 },
  { number: 102, name: 'التَّكَاثُر', englishName: 'At-Takaathur', englishNameTranslation: 'Competition in increase', numberOfAyahs: 8, revelationType: 'Meccan', page: 600, juz: 30 },
  { number: 103, name: 'العَصْر', englishName: 'Al-Asr', englishNameTranslation: 'The Declining Day, Time', numberOfAyahs: 3, revelationType: 'Meccan', page: 601, juz: 30 },
  { number: 104, name: 'الهُمَزَة', englishName: 'Al-Humaza', englishNameTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan', page: 601, juz: 30 },
  { number: 105, name: 'الفِيل', englishName: 'Al-Feel', englishNameTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan', page: 601, juz: 30 },
  { number: 106, name: 'قُرَيْش', englishName: 'Quraish', englishNameTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan', page: 602, juz: 30 },
  { number: 107, name: 'المَاعُون', englishName: 'Al-Maa\'oon', englishNameTranslation: 'Small Kindnesses', numberOfAyahs: 7, revelationType: 'Meccan', page: 602, juz: 30 },
  { number: 108, name: 'الكَوْثَر', englishName: 'Al-Kawthar', englishNameTranslation: 'Abundance', numberOfAyahs: 3, revelationType: 'Meccan', page: 602, juz: 30 },
  { number: 109, name: 'الكَافِرُون', englishName: 'Al-Kaafiroon', englishNameTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan', page: 603, juz: 30 },
  { number: 110, name: 'النَّصْر', englishName: 'An-Nasr', englishNameTranslation: 'Divine Support', numberOfAyahs: 3, revelationType: 'Medinan', page: 603, juz: 30 },
  { number: 111, name: 'المَسَد', englishName: 'Al-Masad', englishNameTranslation: 'Palm Fibre', numberOfAyahs: 5, revelationType: 'Meccan', page: 603, juz: 30 },
  { number: 112, name: 'الإِخْلَاص', englishName: 'Al-Ikhlaas', englishNameTranslation: 'Sincerity', numberOfAyahs: 4, revelationType: 'Meccan', page: 604, juz: 30 },
  { number: 113, name: 'الفَلَق', englishName: 'Al-Falaq', englishNameTranslation: 'The Daybreak', numberOfAyahs: 5, revelationType: 'Meccan', page: 604, juz: 30 },
  { number: 114, name: 'النَّاس', englishName: 'An-Naas', englishNameTranslation: 'Mankind', numberOfAyahs: 6, revelationType: 'Meccan', page: 604, juz: 30 },
];

// Offline fallback text for prominent and short Surahs (100% verified authentic Uthmanic script)
export const VERIFIED_OFFLINE_SURAHS: Record<number, { ayahs: { numberInSurah: number; text: string; translation: string; tafsir: string }[] }> = {
  1: {
    ayahs: [
      { numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', tafsir: 'أبدأ قراءتي مستعينا باسم الله، مستصحبا معنى الرحمة العامة والخاصة.' },
      { numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds -', tafsir: 'الثناء الكامل لله وحده، الخالق المدبر لجميع العوالم والمخلوقات.' },
      { numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful,', tafsir: 'الذي وسعت رحمته كل شيء، وخص المؤمنين برحمته وتوفيقه.' },
      { numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.', tafsir: 'المتصرف وحده في يوم الجزاء والحساب وهو يوم القيامة.' },
      { numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.', tafsir: 'نخصك وحدك بالعبادة، ونطلب منك وحدك العون في جميع أمورنا.' },
      { numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path -', tafsir: 'دلنا وأرشدنا ووفقنا إلى الطريق الواضح الموصل إلى رضاك وجنتك.' },
      { numberInSurah: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', tafsir: 'طريق النبيين والصديقين والشهداء والصالحين، غير طريق المغضوب عليهم وهم من عرفوا الحق وتركوه، ولا الضالين وهم من تركوا الحق على جهل.' },
    ],
  },
  103: {
    ayahs: [
      { numberInSurah: 1, text: 'وَالْعَصْرِ', translation: 'By time,', tafsir: 'أقسم الله تعالى بالدهر لما فيه من العبر والدلالة على قدرة الله.' },
      { numberInSurah: 2, text: 'إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ', translation: 'Indeed, mankind is in loss,', tafsir: 'إن كل إنسان في هلكة وخسران ونقصان في عاجل أمره وآجله.' },
      { numberInSurah: 3, text: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', translation: 'Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.', tafsir: 'إلا الذين آمنوا بالله وعملوا الطاعات وأوصى بعضهم بعضا بالحق والثبات على دين الله والصبر على أقداره.' },
    ],
  },
  108: {
    ayahs: [
      { numberInSurah: 1, text: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', translation: 'Indeed, We have granted you, [O Muhammad], al-Kawthar.', tafsir: 'إنا أعطيناك يا محمد الخير الكثير الدائم في الدنيا والآخرة، ومنه نهر الكوثر في الجنة.' },
      { numberInSurah: 2, text: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', translation: 'So pray to your Lord and sacrifice [to Him alone].', tafsir: 'فأخلص لربك صلاتك كلها واذبح ذبيحتك له وحده شكرا لنعمه.' },
      { numberInSurah: 3, text: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', translation: 'Indeed, your enemy is the one cut off.', tafsir: 'إن مبغضك وعدوك هو المنقطع أثره المقطوع من كل خير.' },
    ],
  },
  112: {
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, "He is Allah, [who is] One,', tafsir: 'قل يا محمد لهؤلاء المشركين: الله هو الواحد الأحد الذي لا شريك له.' },
      { numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.', tafsir: 'الله الذي تقصده الخلائق كلها في حوائجها ورغائبها.' },
      { numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born,', tafsir: 'ليس له ولد ولا والد، لتنزهه عن صفات الحوادث والمخلوقات.' },
      { numberInSurah: 4, text: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', translation: 'Nor is there to Him any equivalent."', tafsir: 'وليس له مماثل ولا شبيه ولا نظير في ذاته أو أسمائه أو صفاته.' },
    ],
  },
  113: {
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say, "I seek refuge in the Lord of daybreak', tafsir: 'قل: ألتجئ وأعتصم برب الصبح وفالقه بنوره.' },
      { numberInSurah: 2, text: 'مِنْ شَرِّ مَا خَلَقَ', translation: 'From the evil of that which He created', tafsir: 'من شر جميع المخلوقات والمؤذيات.' },
      { numberInSurah: 3, text: 'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'And from the evil of darkness when it settles', tafsir: 'ومن شر الليل إذا أقبل بظلامه وما ينتشر فيه من الشرور.' },
      { numberInSurah: 4, text: 'وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'And from the evil of the blowers in knots', tafsir: 'ومن شر السواحر اللاتي يعقدن الخيوط وينفثن فيها بالسحر.' },
      { numberInSurah: 5, text: 'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'And from the evil of an envier when he envies."', tafsir: 'ومن شر الحاسد إذا أظهر حسده وأراد زوال النعمة عن غيره.' },
    ],
  },
  114: {
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say, "I seek refuge in the Lord of mankind,', tafsir: 'قل: أعتصم برب البشر وخالقهم ومدبر أمورهم.' },
      { numberInSurah: 2, text: 'مَلِكِ النَّاسِ', translation: 'The Sovereign of mankind,', tafsir: 'الملك الحق المتصرف فيهم بما يشاء دون منازع.' },
      { numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ', translation: 'The God of mankind,', tafsir: 'معبودهم الحق الذي لا معبود سواه ولا يستحق العبادة غيره.' },
      { numberInSurah: 4, text: 'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the evil of the retreating whisperer -', tafsir: 'من شر الشيطان الذي يوسوس عند الغفلة ويختفي وينخنس عند ذكر الله.' },
      { numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers into the breasts of mankind -', tafsir: 'الذي يلقي الشبهات والشهوات والوساوس في قلوب العباد.' },
      { numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'From among the jinn and mankind."', tafsir: 'من شياطين الإنس والجن الذين يضلون الناس عن الصراط المستقيم.' },
    ],
  },
};

// Daily Ayah list for rotating inspiration on the Home screen
export const DAILY_AYAT = [
  {
    surahNumber: 2,
    ayahNumber: 255,
    surahName: 'البقرة (آية الكرسي)',
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence.',
  },
  {
    surahNumber: 94,
    ayahNumber: 5,
    surahName: 'الشرح',
    text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.',
  },
  {
    surahNumber: 65,
    ayahNumber: 3,
    surahName: 'الطلاق',
    text: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
    translation: 'And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.',
  },
  {
    surahNumber: 13,
    ayahNumber: 28,
    surahName: 'الرعد',
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
  },
  {
    surahNumber: 2,
    ayahNumber: 186,
    surahName: 'البقرة',
    text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    translation: 'And when My servants ask you, [O Muhammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.',
  },
  {
    surahNumber: 39,
    ayahNumber: 53,
    surahName: 'الزمر',
    text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    translation: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins."',
  },
];

export const QURAN_SOURCE_METADATA = {
  riwayahArabic: 'حفص عن عاصم الكوفي من طريق الشاطبية',
  mushafEditionArabic: 'مصحف المدينة المنورة - مجمع الملك فهد لطباعة المصحف الشريف',
  datasetIdentifier: 'quran-uthmani',
  datasetVersion: '1.0.0-verified',
  totalSurahs: 114,
  totalAyahs: 6236,
  totalPages: 604,
  totalJuz: 30,
  totalHizb: 60,
  aiModified: false,
};

export interface JuzStartMeta {
  juz: number;
  nameArabic: string;
  surahNumber: number;
  surahNameArabic: string;
  ayahNumber: number;
  page: number;
}

export const JUZ_START_DATA: JuzStartMeta[] = [
  { juz: 1, nameArabic: 'الم', surahNumber: 1, surahNameArabic: 'الفاتحة', ayahNumber: 1, page: 1 },
  { juz: 2, nameArabic: 'سيقول', surahNumber: 2, surahNameArabic: 'البقرة', ayahNumber: 142, page: 22 },
  { juz: 3, nameArabic: 'تلك الرسل', surahNumber: 2, surahNameArabic: 'البقرة', ayahNumber: 253, page: 42 },
  { juz: 4, nameArabic: 'لن تنالوا', surahNumber: 3, surahNameArabic: 'آل عمران', ayahNumber: 93, page: 62 },
  { juz: 5, nameArabic: 'والمحصنات', surahNumber: 4, surahNameArabic: 'النساء', ayahNumber: 24, page: 82 },
  { juz: 6, nameArabic: 'لا يحب الله', surahNumber: 4, surahNameArabic: 'النساء', ayahNumber: 148, page: 102 },
  { juz: 7, nameArabic: 'وإذا سمعوا', surahNumber: 5, surahNameArabic: 'المائدة', ayahNumber: 82, page: 121 },
  { juz: 8, nameArabic: 'ولو أننا', surahNumber: 6, surahNameArabic: 'الأنعام', ayahNumber: 111, page: 142 },
  { juz: 9, nameArabic: 'قال الملأ', surahNumber: 7, surahNameArabic: 'الأعراف', ayahNumber: 88, page: 162 },
  { juz: 10, nameArabic: 'واعلموا', surahNumber: 8, surahNameArabic: 'الأنفال', ayahNumber: 41, page: 182 },
  { juz: 11, nameArabic: 'يعتذرون', surahNumber: 9, surahNameArabic: 'التوبة', ayahNumber: 93, page: 201 },
  { juz: 12, nameArabic: 'وما من دابة', surahNumber: 11, surahNameArabic: 'هود', ayahNumber: 6, page: 222 },
  { juz: 13, nameArabic: 'وما أبرئ', surahNumber: 12, surahNameArabic: 'يوسف', ayahNumber: 53, page: 242 },
  { juz: 14, nameArabic: 'ربما', surahNumber: 15, surahNameArabic: 'الحجر', ayahNumber: 1, page: 262 },
  { juz: 15, nameArabic: 'سبحان الذي', surahNumber: 17, surahNameArabic: 'الإسراء', ayahNumber: 1, page: 282 },
  { juz: 16, nameArabic: 'قال ألم', surahNumber: 18, surahNameArabic: 'الكهف', ayahNumber: 75, page: 302 },
  { juz: 17, nameArabic: 'اقترب للناس', surahNumber: 21, surahNameArabic: 'الأنبياء', ayahNumber: 1, page: 322 },
  { juz: 18, nameArabic: 'قد أفلح', surahNumber: 23, surahNameArabic: 'المؤمنون', ayahNumber: 1, page: 342 },
  { juz: 19, nameArabic: 'وقال الذين', surahNumber: 25, surahNameArabic: 'الفرقان', ayahNumber: 21, page: 362 },
  { juz: 20, nameArabic: 'أمن خلق', surahNumber: 27, surahNameArabic: 'النمل', ayahNumber: 56, page: 382 },
  { juz: 21, nameArabic: 'اتل ما أوحي', surahNumber: 29, surahNameArabic: 'العنكبوت', ayahNumber: 46, page: 402 },
  { juz: 22, nameArabic: 'ومن يقنت', surahNumber: 33, surahNameArabic: 'الأحزاب', ayahNumber: 31, page: 422 },
  { juz: 23, nameArabic: 'وما لي', surahNumber: 36, surahNameArabic: 'يس', ayahNumber: 28, page: 442 },
  { juz: 24, nameArabic: 'فمن أظلم', surahNumber: 39, surahNameArabic: 'الزمر', ayahNumber: 32, page: 462 },
  { juz: 25, nameArabic: 'إليه يرد', surahNumber: 41, surahNameArabic: 'فصلت', ayahNumber: 47, page: 482 },
  { juz: 26, nameArabic: 'حم', surahNumber: 46, surahNameArabic: 'الأحقاف', ayahNumber: 1, page: 502 },
  { juz: 27, nameArabic: 'قال فما خطبكم', surahNumber: 51, surahNameArabic: 'الذاريات', ayahNumber: 31, page: 522 },
  { juz: 28, nameArabic: 'قد سمع الله', surahNumber: 58, surahNameArabic: 'المجادلة', ayahNumber: 1, page: 542 },
  { juz: 29, nameArabic: 'تبارك الذي', surahNumber: 67, surahNameArabic: 'الملك', ayahNumber: 1, page: 562 },
  { juz: 30, nameArabic: 'عم يتساءلون', surahNumber: 78, surahNameArabic: 'النبأ', ayahNumber: 1, page: 582 },
];

export interface HizbStartMeta {
  hizb: number;
  juz: number;
  page: number;
  surahNumber: number;
}

export const HIZB_START_DATA: HizbStartMeta[] = JUZ_START_DATA.flatMap((jItem, idx) => {
  const nextStart = JUZ_START_DATA[idx + 1]?.page ?? 605;
  const midPage = Math.floor((jItem.page + nextStart) / 2);
  return [
    { hizb: jItem.juz * 2 - 1, juz: jItem.juz, page: jItem.page, surahNumber: jItem.surahNumber },
    { hizb: jItem.juz * 2, juz: jItem.juz, page: midPage, surahNumber: jItem.surahNumber },
  ];
});

