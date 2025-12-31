import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const targets = [
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'starters', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'startersVeg.ts'),
    exportName: 'startersVegImages',
    relPrefix: '../../assets/images/starters/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'starters', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'startersNonVeg.ts'),
    exportName: 'startersNonVegImages',
    relPrefix: '../../assets/images/starters/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'main-course', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'mainCourseVeg.ts'),
    exportName: 'mainCourseVegImages',
    relPrefix: '../../assets/images/main-course/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'main-course', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'mainCourseNonVeg.ts'),
    exportName: 'mainCourseNonVegImages',
    relPrefix: '../../assets/images/main-course/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'rice-biryani', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'riceBiryaniVeg.ts'),
    exportName: 'riceBiryaniVegImages',
    relPrefix: '../../assets/images/rice-biryani/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'rice-biryani', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'riceBiryaniNonVeg.ts'),
    exportName: 'riceBiryaniNonVegImages',
    relPrefix: '../../assets/images/rice-biryani/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'breads', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'breadsVeg.ts'),
    exportName: 'breadsVegImages',
    relPrefix: '../../assets/images/breads/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'breads', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'breadsNonVeg.ts'),
    exportName: 'breadsNonVegImages',
    relPrefix: '../../assets/images/breads/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'accompaniments', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'accompanimentsVeg.ts'),
    exportName: 'accompanimentsVegImages',
    relPrefix: '../../assets/images/accompaniments/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'accompaniments', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'accompanimentsNonVeg.ts'),
    exportName: 'accompanimentsNonVegImages',
    relPrefix: '../../assets/images/accompaniments/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'desserts', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'dessertsVeg.ts'),
    exportName: 'dessertsVegImages',
    relPrefix: '../../assets/images/desserts/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'desserts', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'dessertsNonVeg.ts'),
    exportName: 'dessertsNonVegImages',
    relPrefix: '../../assets/images/desserts/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'meal-box', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'mealBoxVeg.ts'),
    exportName: 'mealBoxVegImages',
    relPrefix: '../../assets/images/meal-box/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'meal-box', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'mealBoxNonVeg.ts'),
    exportName: 'mealBoxNonVegImages',
    relPrefix: '../../assets/images/meal-box/non-veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'snack-box', 'veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'snackBoxVeg.ts'),
    exportName: 'snackBoxVegImages',
    relPrefix: '../../assets/images/snack-box/veg',
  },
  {
    inputDir: path.join(projectRoot, 'assets', 'images', 'snack-box', 'non-veg'),
    outputFile: path.join(projectRoot, 'src', 'imageMaps', 'snackBoxNonVeg.ts'),
    exportName: 'snackBoxNonVegImages',
    relPrefix: '../../assets/images/snack-box/non-veg',
  },
];

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

for (const target of targets) {
  const files = listFiles(target.inputDir);

  const lines = [];
  lines.push(`export const ${target.exportName}: Record<string, number> = {`);
  for (const f of files) {
    const key = filenameKey(f);
    if (key === 'default_placeholder' || key === 'default-placeholder') continue;
    const rel = `${target.relPrefix}/${f}`.replace(/\\/g, '/');
    lines.push(`  ${JSON.stringify(key)}: require(${JSON.stringify(rel)}),`);
  }
  lines.push('};');
  lines.push('');

  fs.mkdirSync(path.dirname(target.outputFile), { recursive: true });
  fs.writeFileSync(target.outputFile, lines.join('\n'), 'utf8');
  console.log(`Generated ${target.outputFile} with ${files.length} images.`);
}
