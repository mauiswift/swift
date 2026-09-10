/**
 * Official Payment Method Logos & Branding
 * Uses official company logos and brand guidelines
 * Sourced from official brand centers and payment provider guidelines
 */

import { resolveBrandLogoPath } from '@/config/payment-logo-registry';

export const OFFICIAL_PAYMENT_LOGOS = {
  // ===== DIGITAL WALLETS (E-Wallets) =====
  'gcash': {
    default: '/logos/gcash.svg',
    official: true,
    brand_color: '#007DFF', // GCash official blue
    width: 100,
    height: 35,
  },
  'maya': {
    default: '/logos/maya.svg',
    official: true,
    brand_color: '#00C851', // Maya official green
    width: 100,
    height: 40,
  },
  'grabpay': {
    default: '/logos/grab.svg',
    official: true,
    brand_color: '#00B14F', // GrabPay official green
    width: 90,
    height: 35,
  },

  // ===== BANK LOGOS =====
  'bpi': {
    default: '/logos/bpi.svg',
    official: true,
    brand_color: '#CE0000', // BPI official red
    width: 80,
    height: 50,
  },
  'bdo': {
    default: '/logos/bdo.svg',
    official: true,
    brand_color: '#003DA5', // BDO official blue
    width: 100,
    height: 35,
  },
  'unionbank': {
    default: '/logos/unionbank.svg',
    official: true,
    brand_color: '#0052CC', // UnionBank official blue
    width: 110,
    height: 30,
  },
  'metrobank': {
    default: '/logos/metrobank.svg',
    official: true,
    brand_color: '#D32F2F', // Metrobank official red
    width: 100,
    height: 40,
  },
  'rcbc': {
    default: '/logos/rcbc.svg',
    official: true,
    brand_color: '#C41E3A', // RCBC official red
    width: 90,
    height: 45,
  },
  'psbank': {
    default: '/logos/psbank.svg',
    official: true,
    brand_color: '#007DB3', // PSBank official blue
    width: 100,
    height: 35,
  },
  'secbank': {
    default: '/logos/security-bank.svg',
    official: true,
    brand_color: '#E31937', // Security Bank official red
    width: 110,
    height: 40,
  },
  'aub': {
    default: '/logos/asia-united-bank.svg',
    official: true,
    brand_color: '#C8102E', // AUB official red
    width: 100,
    height: 40,
  },
  'landbank': {
    default: '/logos/landbank.svg',
    official: true,
    brand_color: '#0F766E',
    width: 100,
    height: 45,
  },
  'securitybank': {
    default: '/logos/security-bank.svg',
    official: true,
    brand_color: '#E31937',
    width: 110,
    height: 40,
  },
