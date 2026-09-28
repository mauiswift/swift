import test from 'node:test';
import assert from 'node:assert/strict';
import { detectBrowserLanguage, normalizeLanguage, translations } from './i18n.ts';

const supportedLocales = ['zh', 'ko'] as const;

test('normalizeLanguage defaults invalid values to Korean', () => {
  assert.equal(normalizeLanguage('ko'), 'ko');
  assert.equal(normalizeLanguage('zh'), 'zh');
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage(null), 'ko');
  assert.equal(normalizeLanguage('fr'), 'ko');
});

test('detectBrowserLanguage maps browser preferences to supported locales', () => {
  assert.equal(detectBrowserLanguage('zh-CN'), 'zh');
  assert.equal(detectBrowserLanguage('ko-KR'), 'ko');
  assert.equal(detectBrowserLanguage('en-US'), 'en');
  assert.equal(detectBrowserLanguage('fr-FR'), 'ko');
  assert.equal(detectBrowserLanguage(['fr-FR', 'ko-KR']), 'ko');
});

test('all supported locales include every English translation key', () => {
  for (const locale of supportedLocales) {
    const missing = Object.keys(translations.en).filter((key) => !(key in translations[locale]));
    assert.deepEqual(missing, [], `${locale} missing keys: ${missing.join(', ')}`);
  }
});
