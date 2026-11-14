# Historique des changements

- **31/10/2026** : Compteur INT stable (int_counter)
  - Fichiers : storage.js, module-interventions.js, sw.js
  - Chargement de int_counter depuis Supabase et localStorage
  - Rattrapage auto si compteur < plus grand INT-XXX présent
  - Sauvegarde du compteur dans le cache local
  - Incrémentation Service Worker v42 → v43

- **31/10/2026** : Config Cline + nettoyage contexte
  - Fichiers : .gitignore, CONTEXTE.md, sw.js
  - Ajout des entrées manquantes dans .gitignore
  - Création du fichier CONTEXTE.md unifié
  - Incrémentation Service Worker v41 → v42

# Contexte projet BricoBol

Dernière mise à jour : 31/10/2026 (Compteur INT stable)

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

## Session du 14/11/2026 : tri, intitulés, mobile, reprise

### Fait
- **Annuaire** : liste déroulante de tri (A → Z par défaut / plus récents en haut), via `Adherents._trier()` et `#adhSort`. Script appliqué (3 remplacements, syntaxe OK). À revérifier visuellement dans l'appli.
- **Frais, déroulant des interventions** (`js/module-frais.js`) : intitulé uniforme `047 · Prénom NOM · 30/10/26 · PB · Saint-Étienne`.
- **Frais, version mobile** (écran < 600 px) : `047 · D. NOM · 30/10 · PB · St-Étienne` (initiale du prénom, Saint → St, Sainte → Ste, date sans l'année). Calculé au rendu : un changement d'orientation ne le recalcule pas.
- Dépôt : version du cache `sw.js` v47 avant ces deux modifications ; elles sont à commiter (voir « Premier geste »).

### Règles décidées (rappel)
- Tri « nouveau en haut » par défaut (Interventions, Missions Historique, Frais), avec liste de tri récent/ancien. Exceptions chronologiques : Agenda, Missions « À valider » et « À venir ».
- Intitulé uniforme partout : `INT-047 · Prénom NOM · date · type · commune` (fonction unique `Interventions.intitule(i)`, parties manquantes sautées). Seul le déroulant des Frais est fait.
- Déroulant « Nouveau déplacement » en 3 catégories : Planifiées (frais sûrs), Demandées (prévision), Passées sans frais créés. Exclues : annulées, passées avec déplacement déjà créé, passées avec `sansFrais` coché (champ existant `toggleSansFrais`).
- Véhicule (frais de route) : le remboursement va au **propriétaire du véhicule** (souvent le président) et le calcul des km part de **son** adresse. Paramètres : « Véhicule par défaut » (choix dans l'annuaire). Frais : sélecteur « Propriétaire du véhicule (à rembourser) » pré-rempli. Modale « Fait » : choix du véhicule à la validation. Affichage « Véhicule de : [Nom] » + colonne dans l'export CSV. SQL (pas encore exécuté) :
  ```sql
  ALTER TABLE deplacements ADD COLUMN IF NOT EXISTS vehicule_proprietaire_id TEXT;
  ALTER TABLE deplacements ADD COLUMN IF NOT EXISTS vehicule_proprietaire_nom TEXT;
  ALTER TABLE parametres ADD COLUMN IF NOT EXISTS vehicule_defaut_id TEXT;
  ALTER TABLE parametres ADD COLUMN IF NOT EXISTS vehicule_defaut_nom TEXT;
  ```
- Refonte modale « Fait » (`openFaitModal`, module-missions.js) : heure de début (pré-remplie, modifiable), heure de fin, case « Don reçu » (+ montant), véhicule utilisé ; enregistre `heures_benevoles` et crée le déplacement avec le bon propriétaire.

### Prochaines étapes (dans l'ordre)
0. **Premier geste** : tester le déroulant Frais en mode mobile (F12, Ctrl+Maj+M), puis commit + `git push` (voir la commande ci-dessous).
1. **Détail au toucher** dans Frais : sous la liste, afficher l'intitulé complet des interventions sélectionnées (`📌 INT-047 · Prénom NOM · type · date · commune`). Il faut d'abord lire le code actuel (la zone de la légende et la synchronisation de la sélection).
2. **Démarrage plus rapide** (`js/storage.js`) : `Promise.all` pour les 8 tables + paramètres + compteurs ; recharger au focus seulement après 90 s. Ensuite, si besoin, affichage immédiat depuis le cache local (stale-while-revalidate) sans redessiner une vue en cours de saisie.
3. **Fix du don** : vérifier `js/module-dons.js` (`parseInt` → `parseFloat` sur les IDs décimaux).
4. **Tâche A** : tri récent/ancien dans Missions et Frais.
5. **Tâche B** : `Interventions.intitule(i)` partout.
6. **Tâche C** : déroulant des frais en 3 catégories + commune à côté des km.
7. **Véhicule** (SQL, Paramètres, Frais, modale « Fait »).
8. Export documents Pôle Emploi (le clic ne fait rien), badge cotisation, montant manuel des frais.

### Pièges notés
- Les scripts générés par un autre assistant (DeepSeek) supposaient un code que le dépôt n'avait pas ; toujours vérifier l'état réel (`Select-String`, `git status -sb`) avant d'appliquer un script.
- `Get-Content` + `clip` affiche les accents en `??` : c'est un artefact du presse-papiers, pas un fichier abîmé. Pour contrôler : `Select-String -Encoding UTF8`.
- Un script de modification doit refuser d'agir si l'ancre n'est pas trouvée exactement 1 fois (modèle : `fix-annuaire-tri.ps1`, `fix-frais-mobile.ps1`).
- Les fichiers `.ps1` restent en ASCII ; le JS inséré utilise des échappements (`\u00B7`) pour les caractères spéciaux.


# Session du 14/11/2026 (suite) : detail tactile Frais multi-pages

## Fait
- **Frais, detail au toucher** (`js/module-frais.js`) : div bleue `#fraisInterventionDetail` sous la liste, affiche `\uD83D\uDCCC INT-XXX \u00B7 Nom \u00B7 Type \u00B7 Date \u00B7 Ville` pour chaque intervention sélectionnée. Se met à jour via `_majDetail()` appelé depuis `syncRepartitionFromSelect()` et `refreshInterventionsList()`.
- **Frais, selections multi-pages** : `syncRepartitionFromSelect` fait l'union entre les sélections des pages précédentes (`this.repartitionTemp`) et celles de la page courante. Re-applique `opt.selected = true` après `innerHTML` pour conserver le surlignage.
- **Frais, `_majDetail` lit `repartitionTemp`** et non `sel.selectedOptions` (sinon les selections des autres pages disparaissent de la div).
- Dépôt : commits `ab0fdc6` (intitulé compact) et `a46492c` (détail tactile multi-pages). Cache `sw.js` v48.

## État vérifié en base (14/11)
- adherents : 34
- cotisations : 31
- entries : 33
- interventions : 52
- deplacements : 22
- dons : 6
- evenements : 1
- documents : 0

## Prochaine session — refonte modale "Fait" (module-missions.js)
Décisions actées :
- Ajouter heure début + heure fin à la validation, enregistrer `interventions.heures_benevoles` (JSONB).
- Ajouter case "Don reçu" + montant à la validation, ouvrir la modale Don pré-remplie après fermeture (ne pas enregistrer automatiquement).
- Ajouter sélecteur "Véhicule utilisé (à rembourser)" : le remboursement va au propriétaire du véhicule (souvent le président), les km partent de son adresse. Pas de champ "conducteur".
- SQL à exécuter avant : voir section Véhicule ci-dessus.
- Travail prévu : Claude.ai + Supabase MCP pour l'audit schéma, puis scripts PowerShell pour les modifications. Prompt détaillé fourni séparément.

## Tournee du jour (14/11/2026 suite 3)

### Fait
- **Frais, preRemplirTournee(numeros, benevoleNom, vehiculeNom)** : methode dans `module-frais.js` qui ouvre la modale Nouveau deplacement pre-remplie avec plusieurs interventions, le benevole et le proprietaire du vehicule.
- **Missions, bouton "Tournee du jour"** (`module-missions.js`) : bouton en haut de Missions. Au clic :
  - Regroupe les missions du jour (Aujourd'hui + en retard) par benevole.
  - Garde uniquement les groupes avec 2+ interventions.
  - Si 1 seul groupe : ouvre directement la modale Frais pre-remplie.
  - Si plusieurs groupes : affiche une modale de choix (`#missionsTourneeModal`).
  - Si aucun groupe : alerte "Aucune tournee possible".
  - Fonctions : `ouvrirTourneeDuJour()`, `_renderTourneeListe()`, `_choisirTournee()`, `_lancerTournee()`, `closeTourneeModal()`.
- **Missions, bloc "Frais : X.XX EUR"** sur les cartes : insere apres les autres infos (`extra`), affiche `part` des frais calcules via `getFraisForIntervention`. Insere AVANT "// Boutons selon le statut/contexte" (ancre sure, ne touche pas `let extra`).

### Bug corrige
- Premier essai du bloc "Frais : X.XX EUR" a casse la declaration `let extra = '';` dans `_renderCarte` (remplacement du `let extra` par un bloc multi-lignes). Restaure depuis `.bak`, refait avec une ancre differente ("// Boutons selon le statut/contexte"). Le .bak2 est conserve en securite.

### Etat actuel
- Cache `sw.js` : a incrementer a chaque commit.
- Deux fichiers de contexte existent :
  - **CONTEXTE.md** : LE VRAI, a jour (14/11), a utiliser pour reprendre.
  - **contexte.txt** : ancien (30/10), obsolete. A ignorer. Peut etre supprime.
- Prochaines etapes inchangees (voir section precedente) : heures benevoles recap, stale-while-revalidate, prefiche, import Yapla, export Pole Emploi, badge cotisation, agenda v2.

# Prochaine session - Frais consommables + rappel achats

Decisions actees (Q1-Q4) :
- Q1 = B : plusieurs frais consommables par mission (lignes ajoutables)
- Q2 = A : champ fournisseur optionnel
- Q3 = A : rappel achats benevoles dans la MEME session
- Q4 = B : montant frais route affiche = deplacement.part si existe, sinon kmDeclares x bareme, sinon 'A calculer'

Plan en 8 etapes :
1. SQL : 6 ALTER TABLE entries (statut, benevole_rembourser, fournisseur, date_remboursement, mode_remboursement, note_remboursement) + 1 ALTER TABLE interventions (frais_consommables JSONB)
2. Modale Fait : bloc 'Frais route' (montant) + bloc 'Frais consommables' (multi-lignes + fournisseur optionnel + avance par asso/benevole)
3. openFaitModal : calcul du montant a afficher (Q4=B)
4. confirmerFait : enregistre frais_consommables JSONB + cree entry (statut en_attente si benevole, validee si asso)
5. Module Frais : carte stats 'Achats benevoles a rembourser' + filtre liste
6. Dashboard : bandeau 'X achats a rembourser'
7. Comptabilite : bouton 'Marquer rembourse' sur entree concernee
8. Test + commit + maj CONTEXTE.md

Emplacement du rappel : Dashboard (bandeau) + Module Frais (carte stats) + fiche entree comptable (bouton rembourse).

