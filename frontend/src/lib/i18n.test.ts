import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from './i18n.ts';

test('ko locale includes every English translation key', () => {
  const missing = Object.keys(translations.en).filter((key) => !(key in translations.ko));
  assert.deepEqual(missing, []);
});
