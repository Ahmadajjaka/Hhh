import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HISN_MUSLIM_OCCASIONS,
  HISN_MUSLIM_ADHKAR,
  filterHisnAdhkar,
} from '../src/data/adhkarData.ts';

test('Hisn Al-Muslim occasions cover key daily events including waking, sleep, and leaving home', () => {
  const ids = new Set(HISN_MUSLIM_OCCASIONS.map((o) => o.id));
  assert.ok(ids.has('wake_up'));
  assert.ok(ids.has('sleep'));
  assert.ok(ids.has('leaving_home'));
  assert.ok(ids.has('entering_home'));
  assert.ok(ids.has('mosque'));
  assert.ok(HISN_MUSLIM_OCCASIONS.length >= 10);

  for (const occ of HISN_MUSLIM_OCCASIONS) {
    const countForOcc = HISN_MUSLIM_ADHKAR.filter((item) => item.occasionId === occ.id).length;
    assert.ok(countForOcc >= 1, `Occasion ${occ.id} must have at least 1 dhikr`);
  }
});

test('filterHisnAdhkar filters by occasion, favorites, and diacritic-insensitive Arabic query', () => {
  const allItems = filterHisnAdhkar(HISN_MUSLIM_ADHKAR, 'all', '', []);
  assert.equal(allItems.length, HISN_MUSLIM_ADHKAR.length);

  const leavingHome = filterHisnAdhkar(HISN_MUSLIM_ADHKAR, 'leaving_home', '', []);
  assert.ok(leavingHome.length >= 2);
  assert.ok(leavingHome.every((item) => item.occasionId === 'leaving_home'));

  const favoritesOnly = filterHisnAdhkar(
    HISN_MUSLIM_ADHKAR,
    'favorites',
    '',
    ['hisn_wake_1', 'hisn_leave_1']
  );
  assert.equal(favoritesOnly.length, 2);
  assert.deepEqual(
    favoritesOnly.map((i) => i.id),
    ['hisn_wake_1', 'hisn_leave_1']
  );

  // Diacritic-insensitive search without tashkeel matches vocalized text
  const searchMatches = filterHisnAdhkar(HISN_MUSLIM_ADHKAR, 'all', 'توكلت على الله', []);
  assert.ok(searchMatches.some((item) => item.id === 'hisn_leave_1'));
});
