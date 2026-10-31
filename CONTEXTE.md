# Historique des changements

- **31/10/2026** : Config Cline + nettoyage contexte
  - Fichiers : .gitignore, CONTEXTE.md, sw.js
  - Ajout des entrées manquantes dans .gitignore
  - Création du fichier CONTEXTE.md unifié
  - Incrémentation Service Worker v41 → v42

# Contexte projet BricoBol

Dernière mise à jour : 31/10/2026 (Config Cline + nettoyage contexte)

## 🚨 CHANGEMENT MAJEUR — 23/09/2026

Le projet N'EST PLUS MONOLITHIQUE. Découpé en modules séparés.

## C'EST QUOI CE PROJET

Application de gestion pour l'association BricoBol.
- 100% web (HTML/CSS/JS vanilla)
- Base de données Supabase
- Fonctionne sur PC, tablette, smartphones (Android via APK)
- Hébergée sur GitHub Pages
- PWA installable (manifest + service worker)

## UTILISATEUR / CONTEXTE

- Association BricoBol (aide solidaire)
- 1 bureau, plusieurs bénévoles
- 2-4 appareils synchronisés
- Utilisation quotidienne
- Développement sur PC (Windows/Linux) — VSCodium / Cursor / terminal PowerShell/bash
- Développement mobile possible via Acode (terminal intégré Alpine) + agent OpenRouter

## STRUCTURE RÉELLE DU PROJET

Structure MODULAIRE :
```
bricobol/
├── index.html                 ← COQUILLE (6 Ko) — imports
├── css/style.css              ← TOUT le CSS (17 Ko)
├── js/
│   ├── storage.js             ← 16 Ko (mapping + helpers)
│   ├── utils.js               ← 2 Ko
│   ├── router.js              ← 4 Ko
│   ├── supabase-client.js     ← 15 Ko
│   ├── app.js                 ← 3 Ko
│   ├── module-dashboard.js    ← 12 Ko
│   ├── module-tournee.js      ← 62 Ko (DORMANCE)
│   ├── module-missions.js     ← ~830 lignes (REFONTE 01/10)
│   ├── module-adherents.js    ← 94 Ko
│   ├── module-formulaire.js   ← 43 Ko
│   ├── module-interventions.js ← ~740 lignes
│   ├── module-agenda.js       ← 30 Ko
│   ├── module-frais.js        ← 48 Ko
│   ├── module-cotisations.js  ← 43 Ko
│   ├── module-dons.js         ← 45 Ko
│   ├── module-comptabilite.js ← 32 Ko
│   ├── module-documents.js    ← 37 Ko
│   └── module-parametres.js   ← 65 Ko
├── build.js                   ← Génère bricobol-mobile.html
├── decouper.js                ← Outil de découpage (référence)
├── manifest.json
├── sw.js                      ← Service Worker v41
├── icon.svg
```

## WORKFLOW DE MODIFICATION

### Sur PC Windows — scripts PowerShell
```powershell
Clear-Host; $f="js/module-XXX.js"; $enc=New-Object System.Text.UTF8Encoding $false; $c=[System.IO.File]::ReadAllText((Resolve-Path $f).Path, $enc); $c=$c.Replace('OLD','NEW'); [System.IO.File]::WriteAllText((Resolve-Path $f).Path, $c, $enc); node --check $f; if ($LASTEXITCODE -eq 0) { "SYNTAX OK" | clip } else { "SYNTAX KO"; node --check $f 2>&1 | clip }
```

Sur Linux — bash
Sélection de texte = copie automatiquement.
Serveur local : `cd ~/bricobol && npx --yes http-server -p 8000 -c-1`

Sur smartphone — Acode + terminal Alpine
Éditer dans `/storage/emulated/0/bricobol-new/` ou `bricobol-dev/`

## PIÈGES À ÉVITER (GÉNÉRAL)

- **Backslashes dans les heredocs PowerShell.**
- **Modale derrière une autre : fermer la parente d'abord.**
- **Modules non montés : `ensureModuleMounted()`.**
- **NE PAS modifier `bricobol-mobile.html`.**
- **NE PAS relancer `decouper.js`.**
- **NE PAS oublier d'incrémenter `sw.js` avant commit.**
- **Mapping Storage : pas de self-mapping.**
- **`onShow: () => X.onShow()` perd les params → `(params) => X.onShow(params)`.**
- **Vérifier la hiérarchie DOM des modales (imbrication = invisible).**
- **Mobile Acode : ne PAS faire de copie croisée `~/bricobol → bricobol-dev`.**
- **Linux : `clip` n'existe pas → sélectionner à la souris copie automatiquement.**

## JOUSTE À VENIR (non notés dans les phases existantes)

- **Afficher la commune** à côté de l'intitulé mission/intervention.
- **Annuler n°INT dans mission annulée.**
- **Mapping / Graphique historiques déplacements ↔ n° intervention.**
