// ============================================================
// MODULE : DOCUMENTS — Attestations, récapitulatifs, reçus
// ============================================================

const Documents = {

  getAll() { return Storage.get('documents', []); },
  saveAll(list) { return Storage.set('documents', list); },

  // ---------- Enregistrer un document dans l'historique ----------
  enregistrer(type, destinataire, ref) {
    const list = this.getAll();
    const doc = {
      id: Date.now() + Math.random(),
      type,
      destinataire,
      ref: ref || '',
      date: new Date().toISOString()
    };
    list.push(doc);
    this.saveAll(list);
    return doc;
  },

  // ---------- Attestation de bénévolat ----------
  openAttestationBenevole(id = null) {
    const contacts = Storage.getAdherents();
    // Récupérer tous les noms assignés sur au moins une intervention terminée
    const nomsInter = new Set();
    Interventions.getAll().filter(i => i.statut === 'terminee' && i.benevole).forEach(i => {
      nomsInter.add(i.benevole.toLowerCase().trim());
    });

    // Garder les contacts qui sont Bénévoles OU qui apparaissent comme bénévole sur une intervention
    const benevoles = contacts.filter(a => {
      if (a.type === 'Bénévole') return true;
      const nomComplet = `${a.prenom} ${a.nom}`.toLowerCase().trim();
      const nomInverse = `${a.nom} ${a.prenom}`.toLowerCase().trim();
      return nomsInter.has(nomComplet) || nomsInter.has(nomInverse);
    });

    const sel = document.getElementById('docBenevoleSelect');
    if (benevoles.length === 0) {
      sel.innerHTML = '<option value="">— Aucun bénévole trouvé —</option>';
    } else {
      sel.innerHTML = '<option value="">— Choisir —</option>' +
        benevoles.map(b => {
          const typeInfo = b.type === 'Bénévole' ? '' : ` [${Utils.escapeHtml(b.type)}]`;
          return `<option value="${b.id}">${Utils.escapeHtml(b.prenom)} ${Utils.escapeHtml(b.nom)} (${Utils.escapeHtml(b.numero)})${typeInfo}</option>`;
        }).join('');
    }
    document.getElementById('docBenevoleInterventions').innerHTML = '';
    document.getElementById('docBenevolePeriode').value = '';
    document.getElementById('docBenevoleObjets').value = 'Démarches administratives (Pôle Emploi, VAE, CEC)';
    document.getElementById('docBenevoleModal').classList.add('active');
  },

  closeAttestationBenevole() { document.getElementById('docBenevoleModal').classList.remove('active'); },

  chargerInterventionsBenevole() {
    const id = parseInt(document.getElementById('docBenevoleSelect').value);
    const container = document.getElementById('docBenevoleInterventions');
    if (!id) { container.innerHTML = ''; return; }
    const adh = Storage.getAdherents().find(a => a.id === id);
    if (!adh) return;

    // Comparaison souple : on cherche si le prénom ET le nom apparaissent dans le champ bénévole
    const prenom = (adh.prenom || '').toLowerCase().trim();
    const nom = (adh.nom || '').toLowerCase().trim();

    const inter = Interventions.getAll().filter(i => {
      if (i.statut !== 'terminee') return false;
      if (!i.benevole) return false;
      const b = i.benevole.toLowerCase().trim();
      // Match si les deux mots sont présents (ordre indifférent)
      return b.includes(prenom) && b.includes(nom);
    });

    if (inter.length === 0) {
      // Message d'aide avec info de débogage
      const totalInter = Interventions.getAll().filter(i => i.statut === 'terminee').length;
      const nomsBenevoles = [...new Set(Interventions.getAll()
        .filter(i => i.statut === 'terminee' && i.benevole)
        .map(i => i.benevole))];

      container.innerHTML = `
        <div style="padding:10px;background:#fef3c7;border-radius:8px;font-size:.85rem;">
          <strong>⚠️ Aucune intervention terminée trouvée pour ce bénévole.</strong>
          <p style="margin-top:8px;font-size:.8rem;">
            <strong>Vérifiez :</strong><br>
            • Le nom dans l'annuaire : <em>${Utils.escapeHtml(adh.prenom)} ${Utils.escapeHtml(adh.nom)}</em><br>
            • Les noms assignés sur des interventions terminées :<br>
            ${nomsBenevoles.length > 0
              ? nomsBenevoles.map(n => `&nbsp;&nbsp;→ « ${Utils.escapeHtml(n)} »`).join('<br>')
              : '&nbsp;&nbsp;(aucune intervention terminée pour l\'instant)'}
            <br><br>
            <strong>Total interventions terminées dans l'app :</strong> ${totalInter}
          </p>
          <p style="margin-top:8px;font-size:.78rem;color:var(--text-light);">
            Si le nom est légèrement différent (majuscules, ordre, accents), corrigez l'intervention ou le contact.
          </p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="font-size:.82rem;color:var(--text-light);margin-bottom:6px;">Décochez ce que vous ne voulez pas faire apparaître :</div>
      ${inter.map(i => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px;background:var(--bg-alt);border-radius:6px;margin-bottom:4px;cursor:pointer;">
          <input type="checkbox" class="docInterCheck" data-numero="${Utils.escapeHtml(i.numero)}" data-type="${Utils.escapeHtml(i.type)}" data-date="${i.dateRealisee || i.dateCreation}" data-desc="${Utils.escapeHtml(i.description || '')}" checked style="width:auto;">
          <span style="font-size:.85rem;">
            <strong>${Utils.escapeHtml(i.numero)}</strong> · ${Utils.escapeHtml(i.type)}<br>
            <small style="color:var(--text-light);">${Utils.formatDate(i.dateRealisee || i.dateCreation)} · ${Utils.escapeHtml((i.description || '').substring(0, 50))}</small>
          </span>
        </label>
      `).join('')}
    `;
  },

  genererAttestationBenevole() {
    const id = parseInt(document.getElementById('docBenevoleSelect').value);
    if (!id) { alert('Choisissez un bénévole.'); return; }
    const adh = Storage.getAdherents().find(a => a.id === id);
    if (!adh) return;

    const checks = Array.from(document.querySelectorAll('.docInterCheck:checked'));
    if (checks.length === 0) { alert('Sélectionnez au moins une intervention.'); return; }

    const missions = checks.map(c => ({
      numero: c.dataset.numero,
      type: c.dataset.type,
      date: c.dataset.date,
      description: c.dataset.desc
    }));

    // Trier par date
    missions.sort((a, b) => new Date(a.date) - new Date(b.date));

    const periode = document.getElementById('docBenevolePeriode').value.trim();
    const objets = document.getElementById('docBenevoleObjets').value.trim() || 'Démarches administratives (Pôle Emploi, VAE, CEC)';

    const html = this._buildAttestationBenevoleHTML(adh, missions, periode, objets);
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les popups.'); return; }
    w.document.write(html);
    w.document.close();

    this.enregistrer('attestation-benevole', `${adh.prenom} ${adh.nom}`, `${missions.length} interventions`);
    this.closeAttestationBenevole();
    this.render();
  },

  _buildAttestationBenevoleHTML(adh, missions, periode, objets) {
    const params = Storage.getParametres();
    const nomAsso = params.nomAssociation || 'Bricobol Aide Solidaire';
    const adresseAsso = [params.adresseAsso, params.cpAsso, params.villeAsso].filter(Boolean).join(', ');
    const dateJour = new Date().toLocaleDateString('fr-FR');
    const adresseBenevole = [adh.adresse, adh.cp, adh.ville].filter(Boolean).join(', ');
    const periodeAffichee = periode || (missions.length > 0
      ? `Du ${Utils.formatDate(missions[0].date)} au ${Utils.formatDate(missions[missions.length - 1].date)}`
      : '—');

    return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Attestation de bénévolat</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, serif; max-width: 800px; margin: 30px auto; padding: 30px; color: #000; line-height: 1.6; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
  .asso strong { font-size: 15px; }
  .titre { font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; text-transform: uppercase; letter-spacing: 2px; }
  .infos { background: #f8f8f8; border: 1px solid #ccc; padding: 20px; margin-bottom: 24px; }
  .infos-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 6px 0; border-bottom: 1px dotted #999; }
  .infos-row:last-child { border-bottom: none; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; }
  .contenu { margin: 24px 0; text-align: justify; }
  .signature { margin-top: 60px; display: flex; justify-content: space-between; }
  .signature-box { border-top: 1px solid #000; padding-top: 8px; width: 250px; text-align: center; font-size: 12px; }
  @media print { body { margin: 0; } .no-print { display: none !important; } }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; }
</style></head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / PDF</button>
  <div class="header">
    <div class="asso">
      <strong>${nomAsso}</strong><br>
      ${adresseAsso ? adresseAsso + '<br>' : ''}
      ${params.siretAsso ? 'SIRET : ' + params.siretAsso + '<br>' : ''}
      ${params.rnaAsso ? 'RNA : ' + params.rnaAsso + '<br>' : ''}
      Association loi 1901
    </div>
    <div style="text-align: right; font-size: 12px;">Fait le ${dateJour}</div>
  </div>

  <div class="titre">Attestation de bénévolat</div>

  <div class="infos">
    <div class="infos-row"><span>Bénévole :</span><strong>${adh.prenom} ${adh.nom}</strong></div>
    ${adresseBenevole ? `<div class="infos-row"><span>Adresse :</span><span>${adresseBenevole}</span></div>` : ''}
    <div class="infos-row"><span>Numéro de membre :</span><span>${adh.numero}</span></div>
    <div class="infos-row"><span>Période d'engagement :</span><strong>${periodeAffichee}</strong></div>
  </div>

  <div class="contenu">
    Je soussigné(e), représentant(e) légal(e) de l'association <strong>${nomAsso}</strong>,
    atteste que <strong>${adh.prenom} ${adh.nom}</strong> participe bénévolement aux activités de l'association
    et a réalisé les missions suivantes :
  </div>

  <table>
    <thead><tr><th>Réf.</th><th>Date</th><th>Mission</th></tr></thead>
    <tbody>
      ${missions.map(m => `<tr><td>${m.numero}</td><td>${Utils.formatDate(m.date)}</td><td>${Utils.escapeHtml(m.type)}</td></tr>`).join('')}
    </tbody>
  </table>

  <div class="contenu">
    Cette attestation est délivrée à la demande du bénévole pour : <strong>${Utils.escapeHtml(objets)}</strong>.
  </div>

  <div class="signature">
    <div class="signature-box">Le bénévole</div>
    <div class="signature-box">Pour l'association :<br>Le Président</div>
  </div>
</body></html>`;
  },

  // ---------- Récapitulatif annuel pour l'AG ----------
  openRecapAG() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) years.push(y);
    document.getElementById('docRecapYear').innerHTML = years.map(y =>
      `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`
    ).join('');
    document.getElementById('docRecapVisuel').checked = false;
    document.getElementById('docRecapModal').classList.add('active');
  },

  closeRecapAG() { document.getElementById('docRecapModal').classList.remove('active'); },

  genererRecapAG() {
    const year = parseInt(document.getElementById('docRecapYear').value);
    const visuel = document.getElementById('docRecapVisuel').checked;
    const html = this._buildRecapAGHTML(year, visuel);
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les popups.'); return; }
    w.document.write(html);
    w.document.close();
    this.enregistrer('recap-ag', 'Assemblée Générale', `Exercice ${year}${visuel ? ' (visuel)' : ''}`);
    this.closeRecapAG();
    this.render();
  },

  _buildRecapAGHTML(year, visuel) {
    const params = Storage.getParametres();
    const nomAsso = params.nomAssociation || 'Bricobol Aide Solidaire';
    const adresseAsso = [params.adresseAsso, params.cpAsso, params.villeAsso].filter(Boolean).join(', ');
    const dateJour = new Date().toLocaleDateString('fr-FR');

    const contacts = Storage.getAdherents();
    const byType = {};
    contacts.forEach(c => { byType[c.type] = (byType[c.type] || 0) + 1; });

    const entries = Compta.getAll().filter(e => e.date && e.date.startsWith(year.toString()));
    const recettes = entries.filter(e => e.type === 'recette');
    const depenses = entries.filter(e => e.type === 'depense');
    const totalRecettes = recettes.reduce((s, e) => s + e.total, 0);
    const totalDepenses = depenses.reduce((s, e) => s + e.total, 0);
    const solde = totalRecettes - totalDepenses;

    const natureRec = {};
    recettes.forEach(e => e.items.forEach(it => {
      const key = it.name.replace(/\s*\(.*\)$/, '').trim();
      natureRec[key] = (natureRec[key] || 0) + it.amount;
    }));
    const natureDep = {};
    depenses.forEach(e => e.items.forEach(it => {
      const key = it.name.replace(/\s*\(.*\)$/, '').trim();
      natureDep[key] = (natureDep[key] || 0) + it.amount;
    }));

    const inter = Interventions.getAll().filter(i => (i.dateCreation || '').startsWith(year.toString()));
    const interTerminees = inter.filter(i => i.statut === 'terminee').length;

    const frais = Frais.getAll().filter(f => (f.date || '').startsWith(year.toString()));
    const totalKm = frais.reduce((s, f) => s + (f.km || 0), 0);
    const totalFrais = frais.reduce((s, f) => s + (f.montant || 0), 0);

    const dons = Dons.getAll().filter(d => d.exercice === year);
    const totalDons = dons.reduce((s, d) => s + d.montantTotal, 0);
    const nbDons = dons.length;

    const cotis = (Storage.get('cotisations', []) || []).filter(c => c.exercice === year);
    const totalCotis = cotis.reduce((s, c) => s + c.montant, 0);

    const maxRec = Math.max(...Object.values(natureRec), 1);
    const maxDep = Math.max(...Object.values(natureDep), 1);

    const barresRec = Object.entries(natureRec).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `<div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:.85rem;"><span>${k}</span><strong>${v.toFixed(2)} €</strong></div>
        <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;"><div style="height:100%;width:${(v / maxRec * 100).toFixed(1)}%;background:#16a34a;"></div></div>
      </div>`
    ).join('');

    const barresDep = Object.entries(natureDep).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `<div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:.85rem;"><span>${k}</span><strong>${v.toFixed(2)} €</strong></div>
        <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;"><div style="height:100%;width:${(v / maxDep * 100).toFixed(1)}%;background:#dc2626;"></div></div>
      </div>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Récapitulatif AG ${year}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, serif; max-width: 850px; margin: 30px auto; padding: 30px; color: #000; line-height: 1.5; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
  .titre { font-size: 22px; font-weight: bold; text-align: center; margin: 30px 0 10px; text-transform: uppercase; letter-spacing: 2px; }
  .sous-titre { text-align: center; font-size: 13px; font-style: italic; margin-bottom: 40px; }
  h2 { font-size: 15px; border-bottom: 1px solid #000; padding-bottom: 6px; margin: 30px 0 14px; text-transform: uppercase; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .kpi { border: 1px solid #ccc; padding: 12px; text-align: center; border-radius: 6px; }
  .kpi-label { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 4px; letter-spacing: .5px; }
  .kpi-value { font-size: 18px; font-weight: bold; }
  .kpi.rec { background: #f0fdf4; }
  .kpi.dep { background: #fef2f2; }
  .kpi.solde { background: #eff6ff; }
  @media print { body { margin: 0; } .no-print { display: none !important; } }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; }
</style></head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / PDF</button>
  <div class="header">
    <div>
      <strong style="font-size:16px;">${nomAsso}</strong><br>
      ${adresseAsso ? adresseAsso + '<br>' : ''}
      ${params.siretAsso ? 'SIRET : ' + params.siretAsso + '<br>' : ''}
      ${params.rnaAsso ? 'RNA : ' + params.rnaAsso + '<br>' : ''}
      Association loi 1901
    </div>
    <div style="text-align:right;font-size:12px;">Édité le ${dateJour}</div>
  </div>

  <div class="titre">Récapitulatif annuel</div>
  <div class="sous-titre">Exercice ${year}</div>

  <h2>Identité de l'association</h2>
  <table>
    <tr><th style="width:40%;">Nom</th><td>${nomAsso}</td></tr>
    ${adresseAsso ? `<tr><th>Siège social</th><td>${adresseAsso}</td></tr>` : ''}
    ${params.siretAsso ? `<tr><th>SIRET</th><td>${params.siretAsso}</td></tr>` : ''}
    ${params.rnaAsso ? `<tr><th>N° RNA</th><td>${params.rnaAsso}</td></tr>` : ''}
    <tr><th>Objet</th><td>Aide solidaire et entraide de proximité</td></tr>
  </table>

  <h2>Bilan des adhérents</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Total contacts</div><div class="kpi-value">${contacts.length}</div></div>
    <div class="kpi"><div class="kpi-label">Adhérents</div><div class="kpi-value">${byType['Adhérent bénéficiaire'] || 0}</div></div>
    <div class="kpi"><div class="kpi-label">Bénévoles</div><div class="kpi-value">${byType['Bénévole'] || 0}</div></div>
    <div class="kpi"><div class="kpi-label">Donateurs/Mécènes</div><div class="kpi-value">${(byType['Donateur'] || 0) + (byType['Mécène'] || 0)}</div></div>
  </div>
  <table>
    <thead><tr><th>Type</th><th style="text-align:right;">Nombre</th></tr></thead>
    <tbody>
      ${Object.entries(byType).map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;">${v}</td></tr>`).join('')}
      <tr style="font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${contacts.length}</td></tr>
    </tbody>
  </table>

  <h2>Activité de l'année</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Interventions créées</div><div class="kpi-value">${inter.length}</div></div>
    <div class="kpi"><div class="kpi-label">Terminées</div><div class="kpi-value">${interTerminees}</div></div>
    <div class="kpi"><div class="kpi-label">Déplacements</div><div class="kpi-value">${frais.length}</div></div>
    <div class="kpi"><div class="kpi-label">Km parcourus</div><div class="kpi-value">${totalKm}</div></div>
  </div>

  <h2>Bilan financier</h2>
  <div class="kpi-grid">
    <div class="kpi rec"><div class="kpi-label">Recettes</div><div class="kpi-value" style="color:#16a34a;">${totalRecettes.toFixed(2)} €</div></div>
    <div class="kpi dep"><div class="kpi-label">Dépenses</div><div class="kpi-value" style="color:#dc2626;">${totalDepenses.toFixed(2)} €</div></div>
    <div class="kpi solde"><div class="kpi-label">Solde</div><div class="kpi-value" style="color:${solde >= 0 ? '#2563eb' : '#dc2626'};">${solde.toFixed(2)} €</div></div>
    <div class="kpi"><div class="kpi-label">Opérations</div><div class="kpi-value">${entries.length}</div></div>
  </div>

  <h2>Détail des recettes</h2>
  ${visuel && Object.keys(natureRec).length > 0 ? barresRec : ''}
  <table>
    <thead><tr><th>Nature</th><th style="text-align:right;">Montant</th></tr></thead>
    <tbody>
      ${Object.entries(natureRec).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;">${v.toFixed(2)} €</td></tr>`).join('')}
      <tr style="font-weight:bold;"><td>TOTAL RECETTES</td><td style="text-align:right;">${totalRecettes.toFixed(2)} €</td></tr>
    </tbody>
  </table>
  <p style="font-size:12px;color:#666;margin-top:-8px;">Dont ${totalCotis.toFixed(2)} € de cotisations et ${totalDons.toFixed(2)} € de dons.</p>

  <h2>Détail des dépenses</h2>
  ${visuel && Object.keys(natureDep).length > 0 ? barresDep : ''}
  <table>
    <thead><tr><th>Nature</th><th style="text-align:right;">Montant</th></tr></thead>
    <tbody>
      ${Object.entries(natureDep).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;">${v.toFixed(2)} €</td></tr>`).join('')}
      <tr style="font-weight:bold;"><td>TOTAL DÉPENSES</td><td style="text-align:right;">${totalDepenses.toFixed(2)} €</td></tr>
    </tbody>
  </table>

  <h2>Dons et frais bénévoles</h2>
  <table>
    <tr><th style="width:60%;">Dons reçus (${nbDons} donateur(s))</th><td style="text-align:right;">${totalDons.toFixed(2)} €</td></tr>
    <tr><th>Frais bénévoles remboursés</th><td style="text-align:right;">${totalFrais.toFixed(2)} €</td></tr>
    <tr><th>Kilométrage bénévole</th><td style="text-align:right;">${totalKm} km</td></tr>
  </table>

  <h2>Conclusion</h2>
  <p>Le solde de l'exercice ${year} s'établit à <strong>${solde.toFixed(2)} €</strong>.</p>

  <div style="margin-top:60px;display:flex;justify-content:space-between;">
    <div style="border-top:1px solid #000;padding-top:8px;width:250px;text-align:center;font-size:12px;">Le Trésorier</div>
    <div style="border-top:1px solid #000;padding-top:8px;width:250px;text-align:center;font-size:12px;">Le Président</div>
  </div>
</body></html>`;
  },

  // ---------- Reçu de cotisation ----------
  openRecuCotisation() {
    const cotis = (Storage.get('cotisations', []) || []);
    const container = document.getElementById('docRecuCotisList');
    if (cotis.length === 0) {
      container.innerHTML = '<p style="color:var(--text-light);padding:8px;">Aucune cotisation enregistrée.</p>';
    } else {
      const sorted = cotis.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      container.innerHTML = sorted.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-alt);border:1px solid var(--border);border-radius:6px;margin-bottom:6px;">
          <span style="font-size:.85rem;">
            <strong>${Utils.escapeHtml(c.adherentNom)}</strong><br>
            <small style="color:var(--text-light);">${c.exercice} · ${Utils.formatDate(c.date)} · ${c.montant.toFixed(2)} €</small>
          </span>
          <button class="btn" style="padding:6px 10px;font-size:.78rem;" onclick="Documents.genererRecuCotisation(${c.id})">📄 Générer</button>
        </div>
      `).join('');
    }
    document.getElementById('docRecuCotisModal').classList.add('active');
  },

  closeRecuCotisation() { document.getElementById('docRecuCotisModal').classList.remove('active'); },

  genererRecuCotisation(id) {
    const c = (Storage.get('cotisations', []) || []).find(x => x.id === id);
    if (!c) return;
    const params = Storage.getParametres();
    const nomAsso = params.nomAssociation || 'Bricobol Aide Solidaire';
    const adresseAsso = [params.adresseAsso, params.cpAsso, params.villeAsso].filter(Boolean).join(', ');
    const dateJour = new Date().toLocaleDateString('fr-FR');
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Reçu de cotisation</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 30px auto; padding: 30px; color:#000; line-height:1.5; font-size:14px; }
  .header { border-bottom: 2px solid #000; padding-bottom: 14px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-start; }
  .titre { font-size:20px; font-weight:bold; text-align:center; margin:30px 0; text-transform:uppercase; letter-spacing:2px; }
  table { width:100%; border-collapse:collapse; margin:20px 0; }
  td { padding:8px 10px; border-bottom:1px solid #ccc; }
  .montant { font-size:28px; font-weight:bold; text-align:center; padding:20px; border:2px solid #000; margin:20px 0; }
  .signature { margin-top:60px; display:flex; justify-content:flex-end; }
  .signature-box { border-top:1px solid #000; padding-top:8px; width:250px; text-align:center; font-size:12px; }
  @media print { body { margin:0; } .no-print { display:none !important; } }
  .print-btn { position:fixed; top:20px; right:20px; padding:12px 24px; background:#2563eb; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:bold; cursor:pointer; }
</style></head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / PDF</button>
  <div class="header">
    <div>
      <strong style="font-size:15px;">${nomAsso}</strong><br>
      ${adresseAsso ? adresseAsso + '<br>' : ''}
      ${params.siretAsso ? 'SIRET : ' + params.siretAsso + '<br>' : ''}
      ${params.rnaAsso ? 'RNA : ' + params.rnaAsso : ''}
    </div>
    <div style="text-align:right;font-size:12px;">Le ${dateJour}</div>
  </div>
  <div class="titre">Reçu de cotisation</div>
  <table>
    <tr><td style="width:40%;">Adhérent</td><td><strong>${Utils.escapeHtml(c.adherentNom)}</strong></td></tr>
    <tr><td>Exercice</td><td>${c.exercice}</td></tr>
    <tr><td>Date du paiement</td><td>${Utils.formatDate(c.date)}</td></tr>
    <tr><td>Mode de paiement</td><td>${Utils.escapeHtml(c.mode)}</td></tr>
    ${c.comptaPiece ? `<tr><td>Référence comptable</td><td>${Utils.escapeHtml(c.comptaPiece)}</td></tr>` : ''}
  </table>
  <div class="montant">${c.montant.toFixed(2).replace('.', ',')} €</div>
  <p>Reçu pour paiement de la cotisation annuelle à l'association <strong>${nomAsso}</strong>.</p>
  <p style="font-size:12px;color:#555;margin-top:30px;">Ce reçu n'ouvre pas droit à réduction d'impôt. Il atteste uniquement du paiement de la cotisation.</p>
  <div class="signature">
    <div class="signature-box">Pour l'association :<br>Le Président</div>
  </div>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les popups.'); return; }
    w.document.write(html);
    w.document.close();
    this.enregistrer('recu-cotisation', c.adherentNom, `Exercice ${c.exercice}`);
    this.closeRecuCotisation();
    this.render();
  },

  // ---------- Historique ----------
  remove(id) {
    if (!confirm('Supprimer cette entrée de l\'historique ?\n\nCela ne supprime PAS le document original.')) return;
    this.saveAll(this.getAll().filter(d => d.id !== id));
    this.render();
  },

  resetHistorique() {
    if (!confirm('Vider tout l\'historique des documents générés ?')) return;
    this.saveAll([]);
    this.render();
  },

  render() {
    const container = document.getElementById('docsHistorique');
    if (!container) return;
    const list = this.getAll().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (list.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucun document généré pour l\'instant.</div>';
      return;
    }
    const labels = {
      'attestation-benevole': '📄 Attestation de bénévolat',
      'recap-ag': '📊 Récapitulatif AG',
      'recu-cotisation': '💶 Reçu de cotisation'
    };
    container.innerHTML = list.map(d => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg-alt);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
        <div>
          <div style="font-weight:600;font-size:.9rem;">${labels[d.type] || d.type}</div>
          <div style="font-size:.8rem;color:var(--text-light);">
            ${Utils.escapeHtml(d.destinataire)}${d.ref ? ' · ' + Utils.escapeHtml(d.ref) : ''}<br>
            ${new Date(d.date).toLocaleString('fr-FR')}
          </div>
        </div>
        <button class="adh-btn-del" onclick="Documents.remove(${d.id})" title="Supprimer de l'historique">🗑️</button>
      </div>
    `).join('');
  },

  getViewHTML() {
    return `
      <section class="view" id="view-documents">
        <div class="view-header"><h1>Documents</h1><p>Attestations, reçus et récapitulatifs</p></div>

        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">📄 Générer un document</h3>
          <div style="display:grid;gap:10px;">
            <button class="btn" style="width:100%;text-align:left;justify-content:flex-start;padding:16px;background:var(--accent);" onclick="Documents.openAttestationBenevole()">
              <span style="font-size:1.3rem;margin-right:12px;">🤝</span>
              <span>
                <strong>Attestation de bénévolat</strong><br>
                <small style="opacity:.8;">Pour Pôle Emploi, VAE, CEC ou dossier administratif</small>
              </span>
            </button>
            <button class="btn" style="width:100%;text-align:left;justify-content:flex-start;padding:16px;background:var(--primary);" onclick="Documents.openRecapAG()">
              <span style="font-size:1.3rem;margin-right:12px;">📊</span>
              <span>
                <strong>Récapitulatif annuel pour l'AG</strong><br>
                <small style="opacity:.8;">Bilan chiffré complet de l'exercice</small>
              </span>
            </button>
            <button class="btn" style="width:100%;text-align:left;justify-content:flex-start;padding:16px;background:var(--success);" onclick="Documents.openRecuCotisation()">
              <span style="font-size:1.3rem;margin-right:12px;">💶</span>
              <span>
                <strong>Reçu de cotisation</strong><br>
                <small style="opacity:.8;">Justificatif de paiement de cotisation</small>
              </span>
            </button>
            <button class="btn btn-ghost" style="width:100%;text-align:left;justify-content:flex-start;padding:16px;opacity:.6;" disabled>
              <span style="font-size:1.3rem;margin-right:12px;">📋</span>
              <span>
                <strong>Attestation de don (reçu fiscal Cerfa 11580)</strong><br>
                <small>Disponible dans le module 🎁 Dons → bouton 📄</small>
              </span>
            </button>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-size:1rem;color:var(--primary);font-weight:700;margin:0;">📚 Historique des documents générés</h3>
            <button class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem;" onclick="Documents.resetHistorique()">🗑️ Vider</button>
          </div>
          <div id="docsHistorique"></div>
        </div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="docBenevoleModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Attestation de bénévolat</h2>
            <button class="close-btn" onclick="Documents.closeAttestationBenevole()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Bénévole *</label>
              <select id="docBenevoleSelect" onchange="Documents.chargerInterventionsBenevole()">
                <option value="">— Choisir —</option>
              </select>
            </div>
            <div class="form-group">
              <label>Période d'engagement (optionnel)</label>
              <input type="text" id="docBenevolePeriode" placeholder="Ex : Janvier 2025 - Décembre 2026">
            </div>
            <div class="form-group">
              <label>Objet de l'attestation</label>
              <input type="text" id="docBenevoleObjets" placeholder="Ex : Démarches Pôle Emploi, VAE, CEC..." value="Démarches administratives (Pôle Emploi, VAE, CEC)">
            </div>
            <div class="form-group">
              <label>Missions à faire figurer (décochez si besoin) :</label>
              <div id="docBenevoleInterventions" style="max-height:280px;overflow-y:auto;padding:6px;border:1px solid var(--border);border-radius:8px;background:#fff;"></div>
            </div>
            <div style="background:#fef3c7;padding:10px;border-radius:8px;font-size:.82rem;margin-bottom:14px;">
              ℹ️ Le document généré est conforme pour un usage Pôle Emploi / VAE / CEC : identité, missions, période, signataire.
            </div>
            <div style="display:flex;gap:10px;">
              <button class="btn" style="flex:1;" onclick="Documents.genererAttestationBenevole()">📄 Générer l'attestation</button>
              <button class="btn btn-ghost" onclick="Documents.closeAttestationBenevole()">Annuler</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal" id="docRecapModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>Récapitulatif AG</h2>
            <button class="close-btn" onclick="Documents.closeRecapAG()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Exercice</label>
              <select id="docRecapYear"></select>
            </div>
            <div class="form-group" style="padding:12px;background:#f0f9ff;border-radius:10px;border:1px solid #bfdbfe;">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
                <input type="checkbox" id="docRecapVisuel" style="width:auto;">
                <span><strong>Ajouter des graphiques visuels</strong><br>
                <small style="color:var(--text-light);font-weight:400;">Barres horizontales pour les recettes et dépenses par nature.</small></span>
              </label>
            </div>
            <div style="display:flex;gap:10px;margin-top:14px;">
              <button class="btn" style="flex:1;" onclick="Documents.genererRecapAG()">📊 Générer le récapitulatif</button>
              <button class="btn btn-ghost" onclick="Documents.closeRecapAG()">Annuler</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal" id="docRecuCotisModal">
        <div class="modal-content" style="max-width:560px;">
          <div class="modal-header">
            <h2>Reçu de cotisation</h2>
            <button class="close-btn" onclick="Documents.closeRecuCotisation()">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size:.88rem;color:var(--text-light);margin-bottom:14px;">
              Sélectionnez une cotisation pour générer son reçu (justificatif simple, sans mention fiscale).
            </p>
            <div id="docRecuCotisList" style="max-height:400px;overflow-y:auto;"></div>
          </div>
        </div>
      </div>`;
  },

  onShow() { this.render(); }
};

Router.register({
  view: 'documents',
  title: 'Documents',
  icon: '📄',
  section: 'Gestion',
  order: 4,
  getViewHTML: () => Documents.getViewHTML(),
  getModalsHTML: () => Documents.getModalsHTML(),
  onShow: () => Documents.onShow()
});
