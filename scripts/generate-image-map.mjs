import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const target = {
  inputDir: path.join(projectRoot, 'assets', 'images', 'starters', 'veg'),
  outputFile: path.join(projectRoot, 'src', 'imageMaps', 'startersVeg.ts'),
};

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

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => validExt.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function filenameKey(filename) {
  return normalizeKey(path.basename(filename, path.extname(filename)));
}

const files = listFiles(target.inputDir);

const lines = [];
lines.push("export const startersVegImages: Record<string, number> = {");
for (const f of files) {
  const key = filenameKey(f);
  if (key === 'default_placeholder' || key === 'default-placeholder') continue;
  const rel = `../../assets/images/starters/veg/${f}`.replace(/\\/g, '/');
  lines.push(`  ${JSON.stringify(key)}: require(${JSON.stringify(rel)}),`);
}
lines.push('};');
lines.push('');

fs.mkdirSync(path.dirname(target.outputFile), { recursive: true });
fs.writeFileSync(target.outputFile, lines.join('\n'), 'utf8');

console.log(`Generated ${target.outputFile} with ${files.length} images.`);
