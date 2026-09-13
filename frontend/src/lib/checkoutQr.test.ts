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
    hasQrPayload: true,
    paymentMethod: 'gcash',
    gcashDeepLink: null,
  }), 'gcash');
});

test('resolveCheckoutQrPanelMode returns qrph for qrph payment method without gcash deep link', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: true,
    hasQrPayload: true,
    paymentMethod: 'qrph',
    gcashDeepLink: null,
  }), 'qrph');
});

test('resolveCheckoutQrPanelMode returns none when no QR is available', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: false,
    hasQrPayload: false,
    paymentMethod: 'gcash',
    gcashDeepLink: 'gcash://com.mynt.gcash/app/006300000700',
  }), 'none');
});

test('resolveCheckoutQrPanelMode prioritizes gcash when deep link exists', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: true,
    hasQrPayload: true,
    paymentMethod: 'qrph',
    gcashDeepLink: 'gcash://com.mynt.gcash/app/006300000700',
  }), 'gcash');
});

test('resolveCheckoutQrPanelMode falls back to default for gcash without QR payload', () => {
  assert.equal(resolveCheckoutQrPanelMode({
    hasQR: true,
    hasQrPayload: false,
    paymentMethod: 'gcash',
    gcashDeepLink: null,
  }), 'default');
});
