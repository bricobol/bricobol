// ============================================================
// decouper.js v3 - Découpe index.html monolithique en modules
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const JS_DIR = path.join(ROOT, 'js');
const CSS_DIR = path.join(ROOT, 'css');

if (!fs.existsSync(INDEX)) {
  console.error('❌ index.html introuvable.');
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');

fs.writeFileSync(path.join(ROOT, 'index-monolithe-BACKUP.html'), html);
console.log('💾 Backup : index-monolithe-BACKUP.html');

if (!fs.existsSync(JS_DIR)) fs.mkdirSync(JS_DIR);
if (!fs.existsSync(CSS_DIR)) fs.mkdirSync(CSS_DIR);

// ===== 1. EXTRAIRE LE CSS =====
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) {
  console.error('❌ Pas de <style> trouve.');
  process.exit(1);
}
const css = cssMatch[1].trim();
fs.writeFileSync(path.join(CSS_DIR, 'style.css'), css + '\n');
console.log(`✅ CSS extrait : css/style.css (${css.length} car.)`);
html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="css/style.css">');

// ===== 2. EXTRAIRE LES SCRIPTS =====
// Patterns sans accents, on normalise l'entete avant de tester
const MODULE_MAP = [
  { pattern: /MODULE\s*:\s*STORAGE/i, file: 'storage.js', nom: 'STORAGE' },
  { pattern: /MODULE\s*:\s*UTILS/i, file: 'utils.js', nom: 'UTILS' },
  { pattern: /MODULE\s*:\s*ROUTER/i, file: 'router.js', nom: 'ROUTER' },
  { pattern: /MODULE\s*:\s*SUPA-CLIENT/i, file: 'supabase-client.js', nom: 'SUPA-CLIENT' },
  { pattern: /MODULE\s*:\s*APP/i, file: 'app.js', nom: 'APP' },
  { pattern: /MODULE\s*:\s*DASHBOARD/i, file: 'module-dashboard.js', nom: 'DASHBOARD' },
  { pattern: /MODULE\s*:\s*TOURNEE/i, file: 'module-tournee.js', nom: 'TOURNEE' },
  { pattern: /MODULE\s*:\s*MISSIONS/i, file: 'module-missions.js', nom: 'MISSIONS' },
  { pattern: /MODULE\s*:\s*ADHERENTS/i, file: 'module-adherents.js', nom: 'ADHERENTS' },
  { pattern: /MODULE\s*:\s*FORMULAIRE/i, file: 'module-formulaire.js', nom: 'FORMULAIRE' },
  { pattern: /MODULE\s*:\s*INTERVENTIONS/i, file: 'module-interventions.js', nom: 'INTERVENTIONS' },
  { pattern: /MODULE\s*:\s*AGENDA/i, file: 'module-agenda.js', nom: 'AGENDA' },
  { pattern: /MODULE\s*:\s*BENEVOLES/i, file: 'module-frais.js', nom: 'FRAIS' },
  { pattern: /MODULE\s*:\s*COTISATIONS/i, file: 'module-cotisations.js', nom: 'COTISATIONS' },
  { pattern: /MODULE\s*:\s*DONS/i, file: 'module-dons.js', nom: 'DONS' },
  { pattern: /MODULE\s*:\s*COMPTABILITE/i, file: 'module-comptabilite.js', nom: 'COMPTABILITE' },
  { pattern: /MODULE\s*:\s*DOCUMENTS/i, file: 'module-documents.js', nom: 'DOCUMENTS' },
  { pattern: /MODULE\s*:\s*PARAMETRES/i, file: 'module-parametres.js', nom: 'PARAMETRES' }
];

function normaliser(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

let compteur = 0;
let extraits = 0;
let inline = 0;
const fichiersEcrits = {};

html = html.replace(/<script>([\s\S]*?)<\/script>/g, (match, contenu) => {
  compteur++;
  const trimmed = contenu.trim();
  const entete = normaliser(trimmed.substring(0, 300));

  if (trimmed.includes('navigator.serviceWorker.register') && trimmed.length < 500) {
    console.log(`⏭️  Script ${compteur} : laisse inline (service worker)`);
    inline++;
    return match;
  }

  let mod = null;
  for (const m of MODULE_MAP) {
    if (m.pattern.test(entete)) { mod = m; break; }
  }

  if (!mod) {
    console.warn(`⚠️  Script ${compteur} non reconnu — laisse inline`);
    console.warn(`   Entete : ${entete.substring(0, 120).replace(/\n/g, ' ')}...`);
    inline++;
    return match;
  }

  if (fichiersEcrits[mod.file]) {
    console.error(`❌ DOUBLON : ${mod.file} deja ecrit. Ignore.`);
    return match;
  }

  fs.writeFileSync(path.join(JS_DIR, mod.file), trimmed + '\n');
  console.log(`✅ Script ${compteur} -> js/${mod.file}  [${mod.nom}] (${trimmed.length} car.)`);
  fichiersEcrits[mod.file] = mod.nom;
  extraits++;
  return `<script src="js/${mod.file}"></script>`;
});

fs.writeFileSync(INDEX, html);
console.log(`\n📝 index.html regenere (${html.length} car.)`);

console.log('\n' + '='.repeat(50));
console.log(`📦 Decoupage termine`);
console.log(`   ${extraits} modules extraits dans js/`);
console.log(`   ${inline} script(s) laisse(s) inline`);
console.log(`   1 fichier CSS dans css/`);
console.log('='.repeat(50));
console.log('\n✨ Verifie avec : node build.js');
