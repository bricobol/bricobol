// ============================================================
// MODULE : FORMULAIRE — Fiche papier, formulaire à envoyer, import
// ============================================================

const Formulaire = {

  getViewHTML() {
    return `
      <section class="view" id="view-formulaire">
        <div class="view-header"><h1>Recrutement bénévole</h1><p>Faire remplir une fiche à un nouveau bénévole</p></div>

        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">🖨️ Pour les moins à l'aise avec le numérique</h3>
          <button class="btn" style="width:100%;background:var(--primary);" onclick="Formulaire.genererFichePapier()">🖨️ Générer la fiche papier</button>
        </div>

        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">📄 Pour ceux qui sont à l'aise</h3>
          <button class="btn" style="width:100%;background:var(--accent);" onclick="Formulaire.genererFormulaireEnvoyer()">📄 Générer le formulaire à envoyer</button>
        </div>

        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">📥 Importer une fiche remplie</h3>
          <input type="file" id="formImportFile" accept=".json" style="margin-bottom:10px;">
          <button class="btn" style="width:100%;background:var(--success);" onclick="Formulaire.importerFiche()">📥 Importer la fiche remplie</button>
        </div>
      </section>`;
  },

  getModalsHTML() { return ""; },

  // ============================================================
  // FICHE PAPIER
  // ============================================================
  genererFichePapier() {
    const params = Storage.getParametres();
    const nomAsso = params.nomAssociation || "Bricobol Aide Solidaire";
    const adresseAsso = [params.adresseAsso, params.cpAsso, params.villeAsso].filter(Boolean).join(", ");
    const engs = Parametres.getEngagements(true);
    const cats = Parametres.getCompetences(true);
    const paie = Parametres.getPaiements();
    const montantSugg = params.cotisationBenevoleSuggeree || 5;

    const engagementLignes = engs.map(e => `
      <tr><td style="width:30px;text-align:center;">☐</td><td><strong>${e.icon} ${Utils.escapeHtml(e.label)}</strong>${e.desc ? ' <small style="color:#666;">— ' + Utils.escapeHtml(e.desc) + '</small>' : ''}</td></tr>`).join("");

    const compSections = cats.map(cat => `
      <div style="page-break-inside:avoid;margin-bottom:12px;">
        <div style="font-weight:bold;font-size:13px;background:#f0f0f0;padding:4px 8px;border:1px solid #ccc;">${cat.icon} ${Utils.escapeHtml(cat.label)}</div>
        <div style="border:1px solid #ccc;border-top:none;padding:6px 10px;">
          ${(cat.items || []).map(it => `<div style="margin-bottom:3px;font-size:12px;">☐ ${Utils.escapeHtml(it.label)} ${!it.libre ? ' <span style="color:#666;font-size:10px;">(niveau : D / I / E à entourer)</span>' : ''}</div>`).join("")}
        </div>
      </div>`).join("");

    const jours = this._joursPapier();

    let lienPaiementTxt = "";
    if (paie.cb.actif && paie.cb.lien) {
      lienPaiementTxt = `<p style="margin-top:8px;font-size:11px;">💳 Paiement en ligne : ${Utils.escapeHtml(paie.cb.lien)}</p>`;
    }

    const adhesionBlock = `
      <h2>💙 Adhésion annuelle (participation libre)</h2>
      <div style="border:1px solid #ccc;padding:10px;font-size:12px;">
        <p style="margin-bottom:8px;font-style:italic;">${Utils.escapeHtml(params.texteAdhesion || "")}</p>
        <p style="margin-bottom:8px;"><strong>Vous êtes adhérent d'office en tant que bénévole.</strong></p>
        <p style="margin-bottom:8px;">Participation libre — montant suggéré : ${montantSugg.toFixed(2)} €. Vous pouvez donner plus, moins, ou mettre 0 pour ne rien donner.</p>
        <p style="margin-bottom:4px;">Montant que je souhaite donner : ____________ € <em style="color:#666;">(0 accepté)</em></p>
        <p style="font-size:11px;color:#666;">L'équipe vous recontactera pour le règlement (espèces, chèque, virement ou en ligne).</p>
        ${lienPaiementTxt}
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Fiche bénévole — ${Utils.escapeHtml(nomAsso)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; max-width: 21cm; margin: 10mm auto; padding: 10mm; color:#000; font-size:13px; line-height:1.4; }
  .header { border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start; }
  .header strong { font-size:16px; }
  h1 { font-size:18px; text-align:center; margin:16px 0; text-transform:uppercase; letter-spacing:2px; }
  h2 { font-size:14px; background:#1e293b; color:#fff; padding:6px 10px; margin:16px 0 8px; text-transform:uppercase; letter-spacing:1px; }
  table { width:100%; border-collapse:collapse; }
  td { padding:4px 8px; border-bottom:1px solid #ccc; font-size:12px; }
  .field { margin-bottom:8px; }
  .field label { display:block; font-weight:bold; font-size:12px; margin-bottom:2px; }
  .field .ligne { border-bottom:1px solid #000; padding-bottom:4px; min-height:18px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .rgpd { background:#fef3c7; border:1px solid #fcd34d; padding:10px; margin-top:16px; font-size:11px; }
  .signature { display:flex; justify-content:space-between; margin-top:24px; }
  .signature div { border-top:1px solid #000; padding-top:4px; width:40%; text-align:center; font-size:11px; }
  .footer { text-align:center; font-size:10px; color:#666; margin-top:16px; border-top:1px solid #ccc; padding-top:8px; }
  @media print { body { margin:0; padding:5mm; } h2 { background:#000 !important; color:#fff !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body>

<div class="header">
  <div>
    <strong>${Utils.escapeHtml(nomAsso)}</strong><br>
    ${adresseAsso ? adresseAsso + '<br>' : ''}
    ${params.siretAsso ? 'SIRET : ' + params.siretAsso + '<br>' : ''}
    ${params.rnaAsso ? 'RNA : ' + params.rnaAsso : ''}
  </div>
  <div style="text-align:right;font-size:11px;">Fiche à remplir<br>et à retourner</div>
</div>

<h1>Fiche de bénévole</h1>

<h2>👤 Identité</h2>
<div class="grid-2">
  <div class="field"><label>Prénom</label><div class="ligne"></div></div>
  <div class="field"><label>Nom</label><div class="ligne"></div></div>
</div>
<div class="field"><label>Adresse</label><div class="ligne"></div></div>
<div class="grid-2">
  <div class="field"><label>Code postal</label><div class="ligne"></div></div>
  <div class="field"><label>Ville</label><div class="ligne"></div></div>
</div>
<div class="grid-2">
  <div class="field"><label>Téléphone</label><div class="ligne"></div></div>
  <div class="field"><label>Email</label><div class="ligne"></div></div>
</div>

<h2>🤝 Comment je peux aider</h2>
<table>${engagementLignes}</table>

<h2>📚 Mes compétences</h2>
<p style="font-size:11px;color:#666;margin-bottom:8px;">Cocher ce que vous savez faire. Niveaux : <strong>D</strong>ébutant / <strong>I</strong>ntermédiaire / <strong>E</strong>xpert.</p>
${compSections}

<h2>📅 Mes disponibilités</h2>
<div style="margin-bottom:10px;">
  <div style="font-size:12px;"><strong>Fréquence :</strong> ☐ 🟢 Très disponible ☐ 🟡 Disponible ☐ 🟠 Occasionnel ☐ 🔴 Rare</div>
</div>
<table style="margin-bottom:10px;">
  <tr style="background:#f0f0f0;">
    <th style="text-align:left;padding:4px;font-size:12px;">Jour</th>
    <th style="padding:4px;font-size:12px;">Matin</th>
    <th style="padding:4px;font-size:12px;">Après-midi</th>
    <th style="padding:4px;font-size:12px;">Soir</th>
  </tr>
  ${jours}
</table>
<div style="font-size:12px;">
  <strong>Zone d'intervention :</strong> ☐ Seulement ma commune ☐ Rayon 15 km ☐ Rayon 30 km ☐ Peu importe
</div>

<h2>📝 Remarques</h2>
<div class="field"><label>Remarque générale</label><div class="ligne" style="min-height:40px;"></div></div>
<div class="grid-2">
  <div class="field"><label>Restriction temporaire</label><div class="ligne"></div></div>
  <div class="field"><label>Jusqu'au</label><div class="ligne"></div></div>
</div>
<div style="font-size:12px;margin-top:8px;">
  <strong>Condition d'intervention :</strong> ☐ Préfère ne pas intervenir seul(e)<br>
  <span style="font-size:11px;color:#666;margin-left:16px;">Si oui : ☐ Ne jamais seul (impératif) &nbsp;&nbsp; ☐ Préfère accompagné</span>
</div>

${adhesionBlock}

<div class="rgpd">
  <strong>🔒 Protection des données (RGPD)</strong><br>
  ☐ J'accepte que mes données soient conservées par <strong>${Utils.escapeHtml(nomAsso)}</strong> dans le cadre de son activité bénévole. Elles ne seront jamais transmises à des tiers.
</div>

<div class="signature">
  <div>Date et signature du bénévole</div>
  <div>Pour l'association</div>
</div>

<div class="footer">
  Fiche à retourner à : ${Utils.escapeHtml(nomAsso)} ${adresseAsso ? '— ' + adresseAsso : ''}
</div>

</body></html>`;

    const w = window.open("", "_blank");
    if (!w) { alert("Autorisez les popups."); return; }
    w.document.write(html);
    w.document.close();
  },

  _joursPapier() {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    return jours.map(j => `<tr><td style="padding:4px;font-size:12px;font-weight:bold;">${j}</td><td style="text-align:center;padding:4px;">☐</td><td style="text-align:center;padding:4px;">☐</td><td style="text-align:center;padding:4px;">☐</td></tr>`).join("");
  },
  
  // ============================================================
  // FORMULAIRE HTML À ENVOYER
  // ============================================================
  genererFormulaireEnvoyer() {
    const params = Storage.getParametres();
    const nomAsso = params.nomAssociation || "Bricobol Aide Solidaire";
    const emailContact = params.emailContact || "bricobol.asso@proton.me";
    const engs = Parametres.getEngagements(true);
    const cats = Parametres.getCompetences(true);
    const paie = Parametres.getPaiements();
    const message = Parametres.getMessageBienvenue();
    const texteAdhesion = params.texteAdhesion || "Votre adhésion annuelle est à prix libre. Elle est automatique en tant que bénévole et votre statut de membre est acquis.\n\nMontant suggéré : 5 €. Vous pouvez donner plus, moins, ou mettre 0 pour ne rien donner — aucun jugement, donner de son temps est déjà énorme. C'est vous qui voyez.";
    const montantSugg = params.cotisationBenevoleSuggeree || 5;

    const messageHTML = Utils.escapeHtml(message).replace(/\n/g, "<br>");
    const texteAdhesionHTML = Utils.escapeHtml(texteAdhesion).replace(/\n/g, "<br>");

    const config = {
      nomAsso, engs, cats,
      emailContact,
      frequences: this._getFrequencesJS(),
      zones: this._getZonesJS(),
      jours: this._getJoursJS(),
      moments: this._getMomentsJS(),
      montantSuggere: montantSugg,
      lienYapla: (paie.cb.actif && paie.cb.lien) ? paie.cb.lien : "",
      nomPlateforme: paie.cb.plateforme || "Yapla"
    };

    const boutonYaplaHTML = config.lienYapla
      ? `<a href="${Utils.escapeHtml(config.lienYapla)}" target="_blank" class="pay-btn">💳 Payer en ligne (${Utils.escapeHtml(config.nomPlateforme)})</a>
         <p style="font-size:.75rem;color:#64748b;margin-top:6px;text-align:center;">Ouverture dans un nouvel onglet. Revenez ensuite sur cette page.</p>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fiche bénévole — ${Utils.escapeHtml(nomAsso)}</title>
<style>
  :root { --accent: #2563eb; --accent-light: #dbeafe; --border: #e2e8f0; --text: #1e293b; --text-light: #64748b; --bg: #f1f5f9; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 12px; background: var(--bg); color: var(--text); line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #fff; padding: 24px 20px; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(37,99,235,.25); }
  .header h1 { font-size: 1.4rem; margin-bottom: 6px; font-weight: 800; }
  .welcome-box { background: rgba(255,255,255,.15); border-radius: 12px; padding: 14px; margin-top: 14px; font-size: .9rem; line-height: 1.7; }
  .card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 18px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
  .card h2 { font-size: 1rem; font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
  .card-desc { font-size: .82rem; color: var(--text-light); margin-bottom: 14px; }
  .form-group { margin-bottom: 14px; }
  label.lbl { display: block; font-weight: 600; font-size: .82rem; margin-bottom: 6px; }
  input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"], textarea, select { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: .95rem; font-family: inherit; background: #fff; color: var(--text); }
  input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px rgba(37,99,235,.1); }
  input[type="checkbox"], input[type="radio"] { width: 20px !important; height: 20px !important; min-width: 20px; margin: 0; padding: 0; cursor: pointer; accent-color: var(--accent); flex-shrink: 0; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .choice { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; margin-bottom: 8px; cursor: pointer; font-size: .9rem; background: #fff; transition: all .15s; }
  .choice:hover { border-color: var(--accent); background: #f8fafc; }
  .choice input { margin-top: 2px; }
  .choice span { flex: 1; min-width: 0; }
  .cat { border: 1.5px solid var(--border); border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: #fff; transition: all .15s; }
  .cat.open { border-color: var(--accent); }
  .cat-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; font-weight: 700; font-size: .9rem; background: #f8fafc; }
  .cat-header:hover { background: #eff6ff; }
  .cat.open .cat-header { background: var(--accent-light); }
  .cat-icon { font-size: 1.15rem; }
  .cat-title { flex: 1; min-width: 0; }
  .cat-badge { background: var(--accent); color: #fff; font-size: .7rem; font-weight: 800; padding: 3px 9px; border-radius: 12px; min-width: 22px; text-align: center; }
  .cat-arrow { font-size: .8rem; color: var(--text-light); transition: transform .2s; }
  .cat.open .cat-arrow { transform: rotate(180deg); }
  .cat-body { display: none; padding: 6px 14px 10px; border-top: 1px solid var(--border); }
  .cat.open .cat-body { display: block; }
  .item { padding: 8px 0; border-bottom: 1px dashed var(--border); }
  .item:last-child { border-bottom: none; }
  .item-label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: .88rem; }
  .item-label input { margin-top: 2px; }
  .item-label span { flex: 1; }
  .niveaux { margin-left: 30px; margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
  .niv-btn { padding: 5px 12px; font-size: .75rem; font-weight: 600; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; color: var(--text); font-family: inherit; }
  .niv-btn:hover { border-color: var(--accent); }
  .niv-btn.active-1 { background: #94a3b8; color: #fff; border-color: #94a3b8; }
  .niv-btn.active-2 { background: #f59e0b; color: #fff; border-color: #f59e0b; }
  .niv-btn.active-3 { background: #16a34a; color: #fff; border-color: #16a34a; }
  .grille { width: 100%; border-collapse: collapse; font-size: .85rem; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
  .grille th { background: #f1f5f9; padding: 10px 6px; font-size: .7rem; text-transform: uppercase; color: var(--text-light); font-weight: 700; }
  .grille td { padding: 8px 6px; text-align: center; border-top: 1px solid var(--border); }
  .grille td:first-child { text-align: left; font-weight: 600; padding-left: 12px; }
  .grille input[type="checkbox"] { width: 22px !important; height: 22px !important; }
  .rgpd { background: #fef3c7; border: 1.5px solid #fcd34d; border-radius: 12px; padding: 14px; font-size: .85rem; }
  .rgpd label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
  .rgpd strong { color: #92400e; }
  .btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #fff; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 8px; box-shadow: 0 4px 12px rgba(37,99,235,.3); font-family: inherit; }
  .btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }
  .btn-mail { background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16,185,129,.3); color: #fff; text-decoration: none; text-align: center; display: block; }
  .footer { text-align: center; font-size: .78rem; color: var(--text-light); margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); line-height: 1.6; }
  .adhesion-box { background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 14px; margin-bottom: 12px; font-size: .85rem; line-height: 1.6; }
  .pay-btn { display: block; padding: 14px; border-radius: 10px; text-decoration: none; color: #fff; font-weight: 700; text-align: center; margin-top: 12px; background: linear-gradient(135deg, #2563eb, #1e40af); box-shadow: 0 4px 12px rgba(37,99,235,.3); }
  .pay-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,.4); }
  .montant-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
  .montant-row input { flex: 1; min-width: 100px; font-size: 1.1rem; font-weight: 700; text-align: center; }
  .montant-unite { font-weight: 800; font-size: 1.2rem; color: #1e40af; }
  .libre-tag { display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 10px; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-left: 8px; }
  .zero-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 10px; font-size: .75rem; font-weight: 700; white-space: nowrap; }
  .info-adherent { background: #dcfce7; color: #166534; padding: 10px 14px; border-radius: 10px; font-size: .85rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .help-card { background: #f0f9ff; border: 1.5px solid #bfdbfe; }
  .help-card h2 { color: #1e40af; }
  .help-card ol { padding-left: 20px; font-size: .88rem; line-height: 1.8; margin: 10px 0; }
  .help-card ol li { margin-bottom: 6px; }
  .help-card code { background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 6px; font-size: .82rem; font-family: monospace; }
  .email-link { display: inline-block; margin-top: 6px; padding: 6px 12px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; }
  .email-link:hover { background: #1d4ed8; }
  .help-note { font-size: .78rem; color: #64748b; line-height: 1.6; margin-top: 10px; padding-top: 10px; border-top: 1px solid #bfdbfe; }
  .warn-join { background: #fef3c7; border: 1.5px solid #fcd34d; border-radius: 10px; padding: 14px; margin-top: 12px; font-size: .85rem; color: #92400e; }
  @media (max-width: 600px) {
    body { padding: 8px; }
    .header { padding: 20px 16px; }
    .header h1 { font-size: 1.2rem; }
    .card { padding: 14px; }
    .grid-2 { grid-template-columns: 1fr; gap: 8px; }
    .choice { padding: 10px 12px; font-size: .85rem; }
    .cat-header { padding: 10px 12px; font-size: .85rem; }
    .niveaux { margin-left: 26px; gap: 4px; }
    .grille th, .grille td { padding: 6px 4px; font-size: .8rem; }
    .grille input[type="checkbox"] { width: 20px !important; height: 20px !important; }
    .btn { padding: 14px; font-size: .95rem; }
    .zero-badge { font-size: .7rem; padding: 4px 8px; }
  }
</style></head>
<body>

<div class="header">
  <h1>👋 Bienvenue chez ${Utils.escapeHtml(nomAsso)} !</h1>
  <div class="welcome-box">${messageHTML}</div>
</div>

<div class="card">
  <h2>👤 Mes coordonnées</h2>
  <div class="grid-2">
    <div class="form-group"><label class="lbl">Prénom *</label><input type="text" id="fPrenom"></div>
    <div class="form-group"><label class="lbl">Nom *</label><input type="text" id="fNom"></div>
  </div>
  <div class="form-group"><label class="lbl">Adresse</label><input type="text" id="fAdresse"></div>
  <div class="grid-2">
    <div class="form-group"><label class="lbl">Code postal</label><input type="text" id="fCP"></div>
    <div class="form-group"><label class="lbl">Ville</label><input type="text" id="fVille"></div>
  </div>
  <div class="grid-2">
    <div class="form-group"><label class="lbl">Téléphone</label><input type="tel" id="fTel"></div>
    <div class="form-group"><label class="lbl">Email</label><input type="email" id="fEmail"></div>
  </div>
  <div class="form-group">
    <label class="lbl">Situation (optionnel)</label>
    <select id="fSituation">
      <option value="">— Non précisé —</option>
      <option value="Retraité">Retraité(e)</option>
      <option value="Actif">Actif(ve)</option>
      <option value="Isolé">Isolé(e)</option>
      <option value="Handicap">En situation de handicap</option>
      <option value="Autre">Autre</option>
    </select>
  </div>
</div>

<div class="card">
  <h2>🤝 Comment je peux aider *</h2>
  <p class="card-desc">Cochez au moins une case.</p>
  <div id="engList"></div>
</div>

<div class="card">
  <h2>📚 Mes compétences</h2>
  <p class="card-desc">Cochez ce que vous savez faire et précisez votre niveau.</p>
  <div id="compList"></div>
</div>

<div class="card">
  <h2>📅 Mes disponibilités</h2>
  <div class="form-group">
    <label class="lbl">Fréquence globale</label>
    <div id="freqList"></div>
  </div>
  <div class="form-group">
    <label class="lbl">Créneaux habituels</label>
    <div style="overflow-x:auto;">
      <table class="grille">
        <thead><tr><th></th><th>Matin</th><th>Après-midi</th><th>Soir</th></tr></thead>
        <tbody id="joursList"></tbody>
      </table>
    </div>
  </div>
  <div class="form-group" style="margin-top:14px;">
    <label class="lbl">Zone d'intervention</label>
    <div id="zoneList"></div>
  </div>
</div>

<div class="card">
  <h2>📝 Mes remarques</h2>
  <div class="form-group">
    <label class="lbl">Remarque générale</label>
    <textarea id="fRemarque" rows="3" placeholder="Ex : Je peux aider mais j'ai mal à l'épaule en ce moment…"></textarea>
  </div>
  <div class="grid-2">
    <div class="form-group"><label class="lbl">Restriction temporaire</label><input type="text" id="fRestriction" placeholder="Ex : Mal à l'épaule"></div>
    <div class="form-group"><label class="lbl">Jusqu'au</label><input type="date" id="fRestrictionFin"></div>
  </div>
  <div class="form-group">
    <label class="lbl">Conditions d'intervention</label>
    <label class="choice"><input type="checkbox" id="fConditionSeul"> Je préfère ne pas intervenir seul(e)</label>
    <div id="conditionOptions" style="display:none;margin-left:22px;margin-top:6px;">
      <label class="choice"><input type="radio" name="fCond" value="jamais_seul"> ⚠️ Ne jamais seul (impératif)</label>
      <label class="choice"><input type="radio" name="fCond" value="prefere_accompagne"> 👥 Préfère accompagné</label>
    </div>
  </div>
</div>

<div class="card">
  <h2>💙 Adhésion annuelle — participation libre</h2>
  <div class="info-adherent">
    ✅ <strong>Vous êtes adhérent d'office en tant que bénévole.</strong>
  </div>
  <div class="adhesion-box">
    <p>${texteAdhesionHTML}</p>
  </div>
  <div class="form-group" style="margin-top:12px;">
    <label class="lbl">Ma participation — <span class="libre-tag">Montant libre</span></label>
    <div class="montant-row">
      <input type="number" id="fMontantAdh" step="0.5" min="0" value="${montantSugg}" placeholder="${montantSugg}">
      <span class="montant-unite">€</span>
      <span class="zero-badge">0 € accepté</span>
    </div>
    <p style="font-size:.78rem;color:#64748b;margin-top:6px;">💡 Exemple : ${montantSugg.toFixed(2)} €. Vous pouvez donner plus, moins, ou <strong>mettre 0 pour ne rien donner</strong>. Votre statut de membre reste acquis.</p>
  </div>
  <p style="font-size:.85rem;color:#1e40af;margin-top:8px;padding:10px;background:#eff6ff;border-radius:8px;">
    📞 Si vous souhaitez régler, l'équipe vous recontactera (espèces, chèque, virement ou en ligne).
  </p>
  ${boutonYaplaHTML}
</div>

<div class="card rgpd">
  <label>
    <input type="checkbox" id="fRGPD">
    <span><strong>🔒 Protection des données (RGPD)</strong><br>
    J'accepte que mes données soient conservées par <strong>${Utils.escapeHtml(nomAsso)}</strong> dans le cadre de son activité bénévole. Elles ne seront jamais transmises à des tiers.</span>
  </label>
</div>

<div class="card help-card">
  <h2>📮 Comment me renvoyer le fichier ?</h2>
  <ol>
    <li>Cliquez sur le bouton bleu <strong>« 📥 Générer mon retour »</strong> ci-dessous.</li>
    <li>Un fichier <code>benevole-votrenom.json</code> va se télécharger sur votre appareil.</li>
    <li>Envoyez ce fichier par mail à :<br>
      <a href="mailto:${Utils.escapeHtml(config.emailContact)}" class="email-link">📧 ${Utils.escapeHtml(config.emailContact)}</a>
    </li>
  </ol>
  <p class="help-note">
    💡 <strong>Sur smartphone :</strong> après avoir cliqué sur « Générer mon retour », un bouton <strong>« 📧 Envoyer par mail »</strong> apparaîtra. Il ouvrira votre application mail avec notre adresse déjà remplie.<br><br>
    ⚠️ <strong>Important :</strong> il faudra joindre le fichier téléchargé à la main dans le mail (appuyez sur l'icône 📎 ou « Joindre un fichier »). Les navigateurs ne peuvent pas le faire automatiquement pour des raisons de sécurité.
  </p>
</div>

<button class="btn" id="btnGenerate" onclick="genererRetour()">📥 Générer mon retour</button>

<div id="apresGeneration" style="display:none;">
  <a id="btnMailto" href="#" class="btn btn-mail" style="margin-top:12px;">📧 Envoyer par mail à l'association</a>
  <div class="warn-join">
    <strong>⚠️ N'oubliez pas de joindre le fichier !</strong><br>
    Dans votre application mail, appuyez sur l'icône 📎 ou « Joindre un fichier » et sélectionnez le fichier <code>benevole-...json</code> qui vient d'être téléchargé.
  </div>
</div>

<div class="footer">
  <strong>${Utils.escapeHtml(nomAsso)}</strong><br>
  <span style="display:block;margin-top:6px;color:#2563eb;font-weight:600;">💙 Merci pour votre engagement bénévole !</span>
</div>

<script>
var CONFIG = ${JSON.stringify(config)};
var state = { engagements: [], competences: {}, frequence: "", creneaux: [], zone: "", conditionSeul: "" };

function esc(s) { return String(s || "").replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\"": "&quot;", "'": "&#39;" }[c]; }); }

function renderEngs() {
  document.getElementById("engList").innerHTML = CONFIG.engs.map(function(e) {
    return '<label class="choice"><input type="checkbox" onchange="toggleEng(\\'' + e.id + '\\', this.checked)"><span>' + e.icon + ' <strong>' + esc(e.label) + '</strong>' + (e.desc ? '<br><small style="color:#64748b;">' + esc(e.desc) + '</small>' : '') + '</span></label>';
  }).join("");
}
function toggleEng(id, c) { if (c) { if (state.engagements.indexOf(id) === -1) state.engagements.push(id); } else state.engagements = state.engagements.filter(function(x) { return x !== id; }); }

function renderComps() {
  document.getElementById("compList").innerHTML = CONFIG.cats.map(function(cat) {
    return '<div class="cat" data-cat="' + cat.id + '"><div class="cat-header" onclick="toggleCat(\\'' + cat.id + '\\')"><span class="cat-icon">' + cat.icon + '</span><span class="cat-title">' + esc(cat.label) + '</span><span class="cat-badge" id="badge_' + cat.id + '" style="display:none;">0</span><span class="cat-arrow">▼</span></div><div class="cat-body">' + (cat.items || []).map(function(it) {
      return '<div class="item"><label class="item-label"><input type="checkbox" onchange="toggleComp(\\'' + it.id + '\\', this.checked)"><span>' + esc(it.label) + '</span></label><div class="niveaux" id="niv_' + it.id + '" style="display:none;"><button type="button" class="niv-btn" data-niv="1" onclick="setNiv(\\'' + it.id + '\\',1)">Débutant</button><button type="button" class="niv-btn" data-niv="2" onclick="setNiv(\\'' + it.id + '\\',2)">Intermédiaire</button><button type="button" class="niv-btn" data-niv="3" onclick="setNiv(\\'' + it.id + '\\',3)">Expert</button></div></div>';
    }).join("") + '</div></div>';
  }).join("");
}
function toggleCat(catId) { var el = document.querySelector('.cat[data-cat="' + catId + '"]'); if (el) el.classList.toggle("open"); }
function toggleComp(id, c) { if (c) state.competences[id] = { niveau: 1, note: "" }; else delete state.competences[id]; var niv = document.getElementById("niv_" + id); if (niv) niv.style.display = c ? "flex" : "none"; if (c) setNiv(id, 1); updateBadges(); }
function setNiv(id, n) { if (!state.competences[id]) return; state.competences[id].niveau = n; var niv = document.getElementById("niv_" + id); if (niv) { var btns = niv.querySelectorAll(".niv-btn"); for (var i = 0; i < btns.length; i++) { btns[i].classList.remove("active-1", "active-2", "active-3"); if (parseInt(btns[i].dataset.niv) === n) btns[i].classList.add("active-" + n); } } }
function updateBadges() { CONFIG.cats.forEach(function(cat) { var nb = (cat.items || []).filter(function(it) { return state.competences[it.id]; }).length; var badge = document.getElementById("badge_" + cat.id); if (badge) { if (nb > 0) { badge.textContent = nb; badge.style.display = "inline-block"; } else badge.style.display = "none"; } }); }

function renderFreqs() { document.getElementById("freqList").innerHTML = CONFIG.frequences.map(function(f) { return '<label class="choice"><input type="radio" name="freq" onchange="state.frequence=\\'' + f.val + '\\'"><span><strong>' + f.label + '</strong><br><small style="color:#64748b;">' + f.desc + '</small></span></label>'; }).join(""); }
function renderJours() { document.getElementById("joursList").innerHTML = CONFIG.jours.map(function(j) { return '<tr><td>' + j.label + '</td>' + CONFIG.moments.map(function(m) { return '<td><input type="checkbox" onchange="toggleCreneau(\\'' + j.val + '_' + m.val + '\\', this.checked)"></td>'; }).join("") + '</tr>'; }).join(""); }
function toggleCreneau(key, c) { if (c) { if (state.creneaux.indexOf(key) === -1) state.creneaux.push(key); } else state.creneaux = state.creneaux.filter(function(x) { return x !== key; }); }
function renderZones() { document.getElementById("zoneList").innerHTML = CONFIG.zones.map(function(z) { return '<label class="choice"><input type="radio" name="zone" onchange="state.zone=\\'' + z.val + '\\'"><span>' + z.label + '</span></label>'; }).join(""); }

document.getElementById("fConditionSeul").addEventListener("change", function() { document.getElementById("conditionOptions").style.display = this.checked ? "block" : "none"; if (!this.checked) state.conditionSeul = ""; });
var condRadios = document.querySelectorAll('input[name="fCond"]');
for (var i = 0; i < condRadios.length; i++) { condRadios[i].addEventListener("change", function() { state.conditionSeul = this.value; }); }

function genererRetour() {
  var prenom = document.getElementById("fPrenom").value.trim();
  var nom = document.getElementById("fNom").value.trim();
  if (!prenom || !nom) { alert("Prénom et nom obligatoires."); return; }
  if (state.engagements.length === 0) { alert("Cochez au moins une façon d\\'aider."); return; }
  if (!document.getElementById("fRGPD").checked) { alert("Merci de cocher la case RGPD."); return; }
  var montantAdh = parseFloat(document.getElementById("fMontantAdh").value);
  if (isNaN(montantAdh) || montantAdh < 0) { alert("Le montant doit être un nombre positif (0 accepté)."); return; }
  var data = {
    version: "1.0", type: "fiche-benevole", dateRemplissage: new Date().toISOString(),
    prenom: prenom, nom: nom,
    email: document.getElementById("fEmail").value.trim(),
    tel: document.getElementById("fTel").value.trim(),
    adresse: document.getElementById("fAdresse").value.trim(),
    cp: document.getElementById("fCP").value.trim(),
    ville: document.getElementById("fVille").value.trim(),
    pays: "France",
    situation: document.getElementById("fSituation").value,
    engagements: state.engagements,
    competences: state.competences,
    disponibilites: { frequence: state.frequence, creneaux: state.creneaux, zone: state.zone },
    remarqueGenerale: document.getElementById("fRemarque").value.trim(),
    restriction: document.getElementById("fRestriction").value.trim() ? { texte: document.getElementById("fRestriction").value.trim(), dateFin: document.getElementById("fRestrictionFin").value || null } : null,
    conditionSeul: state.conditionSeul,
    adherantAuto: true,
    montantAdhesion: montantAdh,
    rgpdAccepte: true
  };
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  var safeName = (prenom + "-" + nom).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  a.download = "benevole-" + safeName + ".json";
  a.click();
  URL.revokeObjectURL(a.href);

  var subject = "Fiche bénévole - " + prenom + " " + nom;
  var body = "Bonjour,\\n\\nVeuillez trouver ci-joint ma fiche bénévole.\\n\\nNom : " + prenom + " " + nom + "\\n\\n(Pensez à joindre le fichier benevole-" + safeName + ".json téléchargé)\\n\\nMerci !";
  var mailto = "mailto:" + CONFIG.emailContact + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  document.getElementById("btnMailto").href = mailto;
  document.getElementById("apresGeneration").style.display = "block";
  document.getElementById("btnGenerate").textContent = "✅ Fichier téléchargé !";
  document.getElementById("btnGenerate").disabled = true;
  document.getElementById("apresGeneration").scrollIntoView({ behavior: "smooth", block: "center" });
}

renderEngs();
renderComps();
renderFreqs();
renderJours();
renderZones();
<\/script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "benevole-formulaire-a-remplir.html";
    link.click();
    URL.revokeObjectURL(link.href);

    alert("✅ Formulaire généré !\n\nUn fichier vient d'être téléchargé.\n\n👉 Envoyez-le au bénévole.\n👉 Il le remplit et vous renvoie le JSON.");
  },

  _getFrequencesJS() { return [
    { val: "tres_dispo", label: "🟢 Très disponible", desc: "Plusieurs fois par semaine" },
    { val: "dispo", label: "🟡 Disponible", desc: "Environ une fois par semaine" },
    { val: "occasionnel", label: "🟠 Occasionnel", desc: "Environ une fois par mois" },
    { val: "rare", label: "🔴 Rare", desc: "Quelques fois par an" }
  ]; },
  _getZonesJS() { return [
    { val: "commune", label: "🏠 Seulement ma commune" },
    { val: "15km", label: "🚗 Rayon de 15 km" },
    { val: "30km", label: "🚗 Rayon de 30 km" },
    { val: "illimite", label: "🚗 Peu importe" }
  ]; },
  _getJoursJS() { return [
    { val: "lun", label: "Lundi" }, { val: "mar", label: "Mardi" },
    { val: "mer", label: "Mercredi" }, { val: "jeu", label: "Jeudi" },
    { val: "ven", label: "Vendredi" }, { val: "sam", label: "Samedi" },
    { val: "dim", label: "Dimanche" }
  ]; },
  _getMomentsJS() { return [
    { val: "matin", label: "Matin" },
    { val: "aprem", label: "Après-midi" },
    { val: "soir", label: "Soir" }
  ]; },

  // ============================================================
  // IMPORT D'UNE FICHE REMPLIE
  // ============================================================
  importerFiche() {
    const file = document.getElementById("formImportFile").files[0];
    if (!file) { alert("Choisissez le fichier .json."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.type !== "fiche-benevole") { alert("Ce fichier n'est pas une fiche bénévole reconnue."); return; }
        if (!data.prenom || !data.nom) { alert("Fichier incomplet."); return; }

        const list = Storage.getAdherents();
        const existing = list.find(a =>
          a.prenom.toLowerCase() === data.prenom.toLowerCase() &&
          a.nom.toLowerCase() === data.nom.toLowerCase()
        );

        let infoAdh = "";
        if (data.montantAdhesion > 0) {
          infoAdh = "\n\n💙 Cotisation : " + data.montantAdhesion.toFixed(2) + " € (adhérent d'office). Une cotisation en attente sera créée.";
        } else {
          infoAdh = "\n\n💙 Cotisation : 0 € (adhérent d'office, aucune somme à régler).";
        }

        const msg = (existing
          ? "Un contact existe déjà : " + existing.prenom + " " + existing.nom + " (" + existing.numero + ").\n\nMettre à jour sa fiche ?"
          : "Créer un nouveau bénévole : " + data.prenom + " " + data.nom + " ?") + infoAdh;

        if (!confirm(msg)) return;

        let adherentId, numFinal;
        if (existing) {
          Object.assign(existing, {
            prenom: data.prenom, nom: data.nom,
            email: data.email || existing.email, tel: data.tel || existing.tel,
            adresse: data.adresse || existing.adresse, cp: data.cp || existing.cp,
            ville: data.ville || existing.ville, pays: data.pays || existing.pays || "France",
            situation: data.situation || existing.situation,
            type: "Bénévole",
            engagements: data.engagements || [],
            competences: data.competences || {},
            disponibilites: data.disponibilites || { frequence: "", creneaux: [], zone: "" },
            remarqueGenerale: data.remarqueGenerale || "",
            restriction: data.restriction || null,
            conditionSeul: data.conditionSeul || "",
            adherantAuto: true,
            dateExpiration: Utils.addOneYear(existing.dateCreation || Utils.todayISO()),
            aMettreAJour: false
          });
          adherentId = existing.id;
          numFinal = existing.numero;
        } else {
          const n = Storage.getCounter();
          Storage.saveCounter(n + 1);
          numFinal = "ADH-" + String(n).padStart(3, "0");
          adherentId = Date.now();
          list.push({
            id: adherentId, numero: numFinal,
            prenom: data.prenom, nom: data.nom,
            email: data.email || "", tel: data.tel || "",
            adresse: data.adresse || "", cp: data.cp || "", ville: data.ville || "",
            pays: data.pays || "France", situation: data.situation || "",
            type: "Bénévole",
            engagements: data.engagements || [],
            competences: data.competences || {},
            disponibilites: data.disponibilites || { frequence: "", creneaux: [], zone: "" },
            remarqueGenerale: data.remarqueGenerale || "",
            restriction: data.restriction || null,
            conditionSeul: data.conditionSeul || "",
            adherantAuto: true,
            dateCreation: Utils.todayISO(),
            dateExpiration: Utils.addOneYear(Utils.todayISO()),
            yaplaId: null,
            notes: "Fiche importée le " + new Date().toLocaleDateString("fr-FR"),
            adresseDepart: null,
            dateAjout: new Date().toISOString()
          });
        }
        Storage.saveAdherents(list);

        let msgCotis = "";
        if (data.montantAdhesion > 0 && typeof Cotisations !== "undefined" && typeof Cotisations.creerEnAttente === "function") {
          const cree = Cotisations.creerEnAttente(adherentId, data.prenom + " " + data.nom, {
            montant: data.montantAdhesion,
            mode: "à définir",
            date: Utils.todayISO(),
            exercice: new Date().getFullYear(),
            source: "formulaire-benevole",
            note: "Cotisation libre (formulaire bénévole)"
          });
          if (cree) msgCotis = "\n\n💶 Cotisation en attente créée (" + data.montantAdhesion.toFixed(2) + " €). À valider dans le module Cotisations.";
        } else if (data.montantAdhesion === 0) {
          msgCotis = "\n\n✅ Bénévole adhérent enregistré (0 €). Aucune cotisation à régler.";
        }

        document.getElementById("formImportFile").value = "";
        if (typeof Adherents !== "undefined") Adherents.render();
        if (typeof Cotisations !== "undefined") Cotisations.render();
        if (typeof Dashboard !== "undefined" && Dashboard.render) Dashboard.render();
        BricoBol.updateStorageInfo();

        alert("✅ Fiche importée !\n\n" + (existing ? "Mise à jour effectuée." : "Nouveau bénévole créé.") + "\n\nN° : " + numFinal + "\nNom : " + data.prenom + " " + data.nom + infoAdh + msgCotis);
      } catch (err) { console.error(err); alert("Erreur : " + err.message); }
    };
    reader.readAsText(file);
  },

  onShow() {}
};

Router.register({
  view: "formulaire",
  title: "Recrutement",
  icon: "📨",
  section: "Activité",
  order: 4,
  getViewHTML: () => Formulaire.getViewHTML(),
  getModalsHTML: () => Formulaire.getModalsHTML(),
  onShow: () => Formulaire.onShow()
});
