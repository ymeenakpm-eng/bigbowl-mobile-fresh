import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const DEFAULT_EXTERNAL_VEG_DIR = String(
  process.env.BB_EXTERNAL_VEG_DIR ??
    'D:/Family/Meenakshi/Software/Mobile Apps/Big Bowl/images/veg',
);
const DEFAULT_EXTERNAL_NON_VEG_DIR = String(
  process.env.BB_EXTERNAL_NON_VEG_DIR ??
    'D:/Family/Meenakshi/Software/Mobile Apps/Big Bowl/images/non-veg',
);

const validExt = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function normalizeKey(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listFilesRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...listFilesRecursive(p));
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (validExt.has(ext)) out.push(p);
    }
  }
  return out;
}

function buildExternalIndex(dir) {
  const files = listFilesRecursive(dir);
  const exact = new Map();
  for (const full of files) {
    const base = path.basename(full);
    const stem = path.basename(base, path.extname(base));
    const key = normalizeKey(stem);
    if (!key) continue;
    if (!exact.has(key)) exact.set(key, []);
    exact.get(key).push(full);
  }
  return { dir, exact, files };
}

function scoreCandidate(targetKey, candKey) {
  if (!targetKey || !candKey) return 0;
  if (targetKey === candKey) return 100000;

  if (candKey.includes(targetKey)) return 90000 + targetKey.length;
  if (targetKey.includes(candKey)) return 80000 + candKey.length;

  const t = targetKey.split('_').filter(Boolean);
  const c = candKey.split('_').filter(Boolean);
  const setC = new Set(c);
  const common = t.filter((x) => setC.has(x));
  if (common.length >= 2) return 70000 + common.length * 100 + candKey.length;
  if (common.length === 1) return 60000 + candKey.length;

  return 0;
}

function pickBestMatch(targetKey, index) {
  const exactMatches = index.exact.get(targetKey);
  if (exactMatches && exactMatches.length > 0) {
    return exactMatches[0];
  }

  let best = null;
  let bestScore = 0;
  for (const full of index.files) {
    const base = path.basename(full);
    const stem = path.basename(base, path.extname(base));
    const candKey = normalizeKey(stem);
    const score = scoreCandidate(targetKey, candKey);
    if (score > bestScore) {
      bestScore = score;
      best = full;
    }
  }

  if (bestScore >= 70000) return best;
  return null;
}

function readServerIndexJs() {
  const p = path.join(projectRoot, 'server', 'index.js');
  const raw = fs.readFileSync(p, 'utf8');
  return { path: p, raw };
}

function sliceBetween(raw, startMarker, endMarker) {
  const start = raw.indexOf(startMarker);
  if (start < 0) return null;
  const end = raw.indexOf(endMarker, start + startMarker.length);
  if (end < 0) return null;
  return raw.slice(start + startMarker.length, end);
}

function parsePartyBoxItems(raw) {
  const block = sliceBetween(raw, 'const PARTYBOX_MENU = [', '];');
  if (!block) return [];
  const re = /\{\s*id:\s*'[^']+'\s*,\s*name:\s*'([^']+)'\s*,\s*section:\s*'([^']+)'\s*,\s*isVeg:\s*(true|false)/g;
  const out = [];
  let m;
  while ((m = re.exec(block))) {
    out.push({
      name: m[1],
      section: m[2],
      isVeg: m[3] === 'true',
      screen: 'Party Box > Menu Builder',
      kind: 'partybox',
    });
  }
  return out;
}

function parseQuickMealBoxes(raw) {
  // Robust parse across Windows newlines by matching each object that has a title + isVeg.
  // Restrict to mb* ids so we don't accidentally match other blocks.
  const re = /\{[\s\S]*?id:\s*'mb[^']*'[\s\S]*?title:\s*'([^']+)'[\s\S]*?isVeg:\s*(true|false)[\s\S]*?\}/g;
  const out = [];
  let m;
  while ((m = re.exec(raw))) {
    out.push({
      name: m[1],
      section: 'Meal Box',
      isVeg: m[2] === 'true',
      screen: 'Meal Box > Listing',
      kind: 'mealbox',
    });
  }
  return out;
}

function parseQuickSnackBoxes(raw) {
  // Robust parse across Windows newlines by matching each object that has a title + isVeg.
  // Restrict to sb* ids so we don't accidentally match other blocks.
  const re = /\{[\s\S]*?id:\s*'sb[^']*'[\s\S]*?title:\s*'([^']+)'[\s\S]*?isVeg:\s*(true|false)[\s\S]*?\}/g;
  const out = [];
  let m;
  while ((m = re.exec(raw))) {
    out.push({
      name: m[1],
      section: 'Snack Box',
      isVeg: m[2] === 'true',
      screen: 'Snack Box > Listing',
      kind: 'snackbox',
    });
  }
  return out;
}

function partySectionToFolder(section) {
  const s = String(section);
  if (s === 'Starters') return 'starters';
  if (s === 'Main Course') return 'main-course';
  if (s === 'Rice / Biryani') return 'rice-biryani';
  if (s === 'Breads') return 'breads';
  if (s === 'Accompaniments') return 'accompaniments';
  if (s === 'Desserts') return 'desserts';
  return null;
}

function destFolderForItem(item) {
  if (item.kind === 'partybox') {
    const base = partySectionToFolder(item.section);
    if (!base) return null;
    return path.join(projectRoot, 'assets', 'images', base, item.isVeg ? 'veg' : 'non-veg');
  }
  if (item.kind === 'mealbox') {
    return path.join(projectRoot, 'assets', 'images', 'meal-box', item.isVeg ? 'veg' : 'non-veg');
  }
  if (item.kind === 'snackbox') {
    return path.join(projectRoot, 'assets', 'images', 'snack-box', item.isVeg ? 'veg' : 'non-veg');
  }
  return null;
}

function hasAssignedImage(destDir, key) {
  if (!destDir || !fs.existsSync(destDir)) return false;
  for (const ext of validExt) {
    const p = path.join(destDir, `${key}${ext}`);
    if (fs.existsSync(p)) return true;
  }
  return false;
}

function copyAsKey(srcPath, destDir, key) {
  const ext = path.extname(srcPath).toLowerCase();
  const safeExt = validExt.has(ext) ? ext : '.jpg';
  ensureDir(destDir);
  const destPath = path.join(destDir, `${key}${safeExt}`);
  if (fs.existsSync(destPath)) return { copied: false, destPath };
  fs.copyFileSync(srcPath, destPath);
  return { copied: true, destPath };
}

function toCategoryLabel(isVeg) {
  return isVeg ? 'Veg' : 'Non-Veg';
}

function printReport(autoAssigned, missing) {
  console.log('A. Auto-assigned images');
  console.log('Item Name | Category (Veg/Non-Veg) | Image Path Used');
  for (const r of autoAssigned) {
    console.log(`${r.name} | ${r.category} | ${r.imagePath}`);
  }
  if (autoAssigned.length === 0) console.log('(none)');

  console.log('\nB. Missing images (Action needed)');
  console.log('Item Name | Category | Screen/Page where shown');
  for (const r of missing) {
    console.log(`${r.name} | ${r.category} | ${r.screen}`);
  }
  if (missing.length === 0) console.log('(none)');
}

function main() {
  const vegDir = process.argv[2] ? String(process.argv[2]) : DEFAULT_EXTERNAL_VEG_DIR;
  const nonVegDir = process.argv[3] ? String(process.argv[3]) : DEFAULT_EXTERNAL_NON_VEG_DIR;

  const { raw } = readServerIndexJs();
  const items = [
    ...parsePartyBoxItems(raw),
    ...parseQuickMealBoxes(raw),
    ...parseQuickSnackBoxes(raw),
  ];

  const vegIndex = buildExternalIndex(vegDir);
  const nonVegIndex = buildExternalIndex(nonVegDir);

  const autoAssigned = [];
  const missing = [];

  for (const item of items) {
    const category = toCategoryLabel(item.isVeg);
    const key = normalizeKey(item.name);
    const destDir = destFolderForItem(item);

    if (!destDir || !key) {
      missing.push({ name: item.name, category, screen: item.screen });
      continue;
    }

    if (hasAssignedImage(destDir, key)) {
      continue;
    }

    const idx = item.isVeg ? vegIndex : nonVegIndex;
    const match = pickBestMatch(key, idx);

    if (match) {
      const { copied, destPath } = copyAsKey(match, destDir, key);
      if (copied) {
        autoAssigned.push({
          name: item.name,
          category,
          imagePath: path.relative(projectRoot, destPath).replace(/\\/g, '/'),
        });
      }
      continue;
    }

    missing.push({ name: item.name, category, screen: item.screen });
  }

  // Regenerate image maps after copying
  const generator = path.join(projectRoot, 'scripts', 'generate-image-map.mjs');
  spawnSync(process.execPath, [generator], { stdio: 'inherit' });

  printReport(autoAssigned, missing);

  // Non-zero exit if missing images remain
  process.exitCode = missing.length > 0 ? 2 : 0;
}

main();
