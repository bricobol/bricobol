// ============================================================
// build.js — Compile l'app en un seul fichier HTML
// Usage : node build.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const OUTPUT = path.join(ROOT, 'bricobol-mobile.html');

console.log('🧰 Compilation de l\'application pour mobile...\n');

if (!fs.existsSync(INDEX)) {
  console.error('❌ index.html introuvable à la racine du projet.');
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');
let cssInlines = 0;
let jsInlines = 0;
let externes = 0;

html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
  if (/^(https?:)?\/\//i.test(href)) { externes++; return match; }
  const cssPath = path.join(ROOT, href);
  if (!fs.existsSync(cssPath)) { console.warn(`⚠️  CSS introuvable : ${href}`); return match; }
  const css = fs.readFileSync(cssPath, 'utf8');
  console.log(`  ✅ CSS inclus : ${href}`);
  cssInlines++;
  return `<style>\n${css}\n</style>`;
});

html = html.replace(/<script\s+src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (match, src, attrs) => {
  if (/^(https?:)?\/\//i.test(src)) { console.log(`  🌐 Script externe conservé : ${src}`); externes++; return match; }
  const jsPath = path.join(ROOT, src);
  if (!fs.existsSync(jsPath)) { console.warn(`⚠️  JS introuvable : ${src}`); return match; }
  const js = fs.readFileSync(jsPath, 'utf8');
  const cleanAttrs = attrs.replace(/\s*\b(defer|async|type=["']module["'])\b/gi, '').trim();
  console.log(`  ✅ JS inclus   : ${src}`);
  jsInlines++;
  return `<script${cleanAttrs ? ' ' + cleanAttrs : ''}>\n${js}\n</script>`;
});

fs.writeFileSync(OUTPUT, html, 'utf8');

const stats = fs.statSync(OUTPUT);
const taille = (stats.size / 1024).toFixed(1);

console.log('\n' + '='.repeat(50));
console.log(`📦 Fichier généré : bricobol-mobile.html`);
console.log(`📊 Taille : ${taille} Ko`);
console.log(`📄 ${cssInlines} fichier(s) CSS inclus`);
console.log(`📄 ${jsInlines} fichier(s) JS inclus`);
if (externes > 0) console.log(`🌐 ${externes} ressource(s) externe(s) conservée(s)`);
console.log('='.repeat(50));
console.log('\n✨ Prêt ! Envoie "bricobol-mobile.html" sur ton téléphone.\n');
