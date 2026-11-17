import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFullMushafOfflineCollections,
  searchOfflineQuranAyahs,
} from '../src/utils/offlineStorage';
import { parseInitialScreenFromSearch } from '../src/utils/pwaHelpers';
import {
  WRITTEN_DUA_CATEGORIES,
  COMPREHENSIVE_WRITTEN_DUAS,
} from '../src/data/duasAndRuqyahData';

describe('Offline Storage & Full Mushaf Collections', () => {
  it('buildFullMushafOfflineCollections builds Surahs & 604-page buckets with Basmalah hygiene and Tafsir', () => {
    const sampleUthmani = [
      {
        number: 1,
        name: 'سُورَةُ ٱلْفَاتِحَةِ',
        ayahs: [
          {
            number: 1,
            numberInSurah: 1,
            text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
            page: 1,
            juz: 1,
          },
          {
            number: 2,
            numberInSurah: 2,
            text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
            page: 1,
            juz: 1,
          },
        ],
      },
      {
        number: 2,
        name: 'سُورَةُ البَقَرَةِ',
        ayahs: [
          {
            number: 8,
            numberInSurah: 1,
            text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ',
            page: 2,
            juz: 1,
          },
        ],
      },
    ];

    const sampleMuyassar = [
      {
        number: 1,
        ayahs: [
          { numberInSurah: 1, text: 'أبتدئ قراءة القرآن باسم الله' },
          { numberInSurah: 2, text: 'الثناء الكامل لله وحده' },
        ],
      },
      {
        number: 2,
        ayahs: [{ numberInSurah: 1, text: 'حروف مقطعة في أوائل بعض السور' }],
      },
    ];

    const { surahsMap, pagesMap } = buildFullMushafOfflineCollections(sampleUthmani, sampleMuyassar);

    assert.equal(surahsMap.size, 2);
    assert.equal(pagesMap.size, 2);

    // Surah 1 Ayah 1 must KEEP Basmalah
    const fatihah = surahsMap.get(1)!;
    assert.ok(fatihah[0].text.includes('بِسْمِ'));
    assert.equal(fatihah[1].tafsir, 'الثناء الكامل لله وحده');

    // Surah 2 Ayah 1 must STRIP leading Basmalah so it does not duplicate banner
    const baqarah = surahsMap.get(2)!;
    assert.equal(baqarah[0].text, 'الٓمٓ');
    assert.equal(baqarah[0].tafsir, 'حروف مقطعة في أوائل بعض السور');

    // Page 2 metadata check
    const page2 = pagesMap.get(2)!;
    assert.equal(page2.length, 1);
    assert.equal(page2[0].surahNumber, 2);
    assert.equal(page2[0].surahNameArabic, 'البَقَرَة');
    assert.equal(page2[0].isFirstAyahOfSurah, true);
  });

  it('searchOfflineQuranAyahs finds verses from bundled offline Surahs regardless of diacritics', async () => {
    const hitsFatihah = await searchOfflineQuranAyahs('الحمد لله');
    assert.ok(hitsFatihah.length >= 1);
    assert.equal(hitsFatihah[0].surahNumber, 1);
    assert.equal(hitsFatihah[0].ayahNumber, 2);

    const hitsKawthar = await searchOfflineQuranAyahs('انا اعطيناك الكوثر');
    assert.ok(hitsKawthar.some((h) => h.surahNumber === 108 && h.ayahNumber === 1));
  });
});

describe('Offline Written Duas Encyclopedia & Deep Link Routing', () => {
  it('COMPREHENSIVE_WRITTEN_DUAS has valid unique entries across all categories', () => {
    assert.ok(COMPREHENSIVE_WRITTEN_DUAS.length >= 20);
    const validCatIds = new Set(WRITTEN_DUA_CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id));
    const seenIds = new Set<string>();

    for (const item of COMPREHENSIVE_WRITTEN_DUAS) {
      assert.ok(!seenIds.has(item.id), `Duplicate ID found: ${item.id}`);
      seenIds.add(item.id);
      assert.ok(validCatIds.has(item.categoryId), `Invalid categoryId: ${item.categoryId}`);
      assert.ok(item.titleArabic.trim().length > 3);
      assert.ok(item.text.trim().length > 5);
      assert.ok(item.benefitArabic.trim().length > 5);
      assert.ok(item.reference.trim().length > 3);
      assert.ok(item.repeatCount >= 1);
    }
  });

  it('parseInitialScreenFromSearch parses duas_text and ruqyah_text tabs cleanly', () => {
    assert.deepEqual(parseInitialScreenFromSearch('?screen=duas_ruqyah&tab=duas_text'), {
      screen: 'duas_ruqyah',
      tab: 'duas_text',
      category: undefined,
    });
    assert.deepEqual(parseInitialScreenFromSearch('?screen=duas_ruqyah&tab=ruqyah_text'), {
      screen: 'duas_ruqyah',
      tab: 'ruqyah_text',
      category: undefined,
    });
    assert.deepEqual(parseInitialScreenFromSearch('?screen=duas_ruqyah&tab=unknown'), {
      screen: 'duas_ruqyah',
      tab: undefined,
      category: undefined,
    });
  });
});
