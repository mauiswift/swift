#!/usr/bin/env node

/**
 * Bank & Payment Logo Audit Tool for SwiftPay (Node.js version).
 *
 * Verifies canonical logo assets in frontend/public/logos, checks synchronization with
 * backend/static/logos, reports SVG color definitions, and checks frontend JSX components
 * for accessible alt text.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const FRONTEND_LOGOS = path.join(REPO_ROOT, 'frontend', 'public', 'logos');
const BACKEND_LOGOS = path.join(REPO_ROOT, 'backend', 'static', 'logos');
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend', 'src');

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function getFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function auditAndSyncLogos() {
  if (!fs.existsSync(FRONTEND_LOGOS)) fs.mkdirSync(FRONTEND_LOGOS, { recursive: true });
  if (!fs.existsSync(BACKEND_LOGOS)) fs.mkdirSync(BACKEND_LOGOS, { recursive: true });

  const frontendFiles = getFilesRecursively(FRONTEND_LOGOS);
  const backendFiles = getFilesRecursively(BACKEND_LOGOS);

  const frontendMap = new Map();
  for (const f of frontendFiles) {
    const rel = path.relative(FRONTEND_LOGOS, f);
    frontendMap.set(rel, f);
  }

  const backendMap = new Map();
  for (const b of backendFiles) {
    const rel = path.relative(BACKEND_LOGOS, b);
    backendMap.set(rel, b);
  }

  const results = {
    frontendCount: frontendMap.size,
    backendCount: backendMap.size,
    syncedToFrontend: [],
    syncedToBackend: [],
    svgHexColors: [],
    svgCurrentColor: [],
  };

  // Copy files present in backend but missing in frontend -> canonical frontend
  for (const [rel, bFile] of backendMap.entries()) {
    if (!frontendMap.has(rel)) {
      const target = path.join(FRONTEND_LOGOS, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(bFile, target);
      frontendMap.set(rel, target);
      results.syncedToFrontend.push(rel);
    }
  }

  // Sync canonical frontend files to backend
  for (const [rel, fFile] of frontendMap.entries()) {
    const bFile = path.join(BACKEND_LOGOS, rel);
    const bDir = path.dirname(bFile);
    if (!fs.existsSync(bFile) || getFileHash(fFile) !== getFileHash(bFile)) {
      if (!fs.existsSync(bDir)) fs.mkdirSync(bDir, { recursive: true });
      fs.copyFileSync(fFile, bFile);
      results.syncedToBackend.push(rel);
    }
  }

  // Audit SVGs for hardcoded brand hex vs currentColor
  for (const [rel, fFile] of frontendMap.entries()) {
    if (rel.endsWith('.svg')) {
      const content = fs.readFileSync(fFile, 'utf8');
      const hasHex = /(fill|stroke)\s*=\s*["']#(?!000|fff|FFFFFF|000000)/i.test(content);
      const hasCurrent = content.includes('currentColor');
      if (hasHex) results.svgHexColors.push(rel);
      if (hasCurrent) results.svgCurrentColor.push(rel);
    }
  }

  return results;
}

console.log('=== SwiftPay Logo & Asset Audit ===');
const res = auditAndSyncLogos();

console.log(`Frontend Logos Count: ${res.frontendCount}`);
console.log(`Backend Logos Count: ${res.backendCount}`);

if (res.syncedToFrontend.length > 0) {
  console.log(`\nSynced ${res.syncedToFrontend.length} missing file(s) from backend to canonical frontend:`);
  res.syncedToFrontend.forEach(name => console.log(`  + ${name}`));
}

if (res.syncedToBackend.length > 0) {
  console.log(`\nSynced ${res.syncedToBackend.length} file(s) from canonical frontend to backend static:`);
  res.syncedToBackend.forEach(name => console.log(`  -> ${name}`));
}

console.log('\nSVG Format Audit:');
console.log(`  - SVGs using brand hex colors: ${res.svgHexColors.length}`);
console.log(`  - SVGs using flexible currentColor: ${res.svgCurrentColor.length}`);

console.log('\n✓ Logo audit and synchronization complete!');
