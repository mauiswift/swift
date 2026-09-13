import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCheckoutQrPanelMode, sanitizeCheckoutDeepLink } from './checkoutQr.ts';

test('sanitizeCheckoutDeepLink allows gcash scheme', () => {
  assert.equal(sanitizeCheckoutDeepLink('gcash://com.mynt.gcash/app/006300000700'), 'gcash://com.mynt.gcash/app/006300000700');
});

test('sanitizeCheckoutDeepLink allows https deep links and blocks unsafe schemes', () => {
  assert.equal(sanitizeCheckoutDeepLink('https://cashier.example.test/path'), 'https://cashier.example.test/path');
  assert.equal(sanitizeCheckoutDeepLink('javascript:alert(1)'), null);
});

test('resolveCheckoutQrPanelMode returns gcash for gcash payment method', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: true,
    paymentMethod: 'gcash',
    gcashDeepLink: null,
  }), 'gcash');
});

test('resolveCheckoutQrPanelMode returns qrph for qrph payment method without gcash deep link', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: true,
    paymentMethod: 'qrph',
    gcashDeepLink: null,
  }), 'qrph');
});

test('resolveCheckoutQrPanelMode returns none when no QR is available', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: false,
    paymentMethod: 'gcash',
    gcashDeepLink: 'gcash://com.mynt.gcash/app/006300000700',
  }), 'none');
});
