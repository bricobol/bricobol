// ============================================================
// MODULE : ADHÉRENTS — Import Yapla unifié + badge en attente
// ============================================================

const Adherents = {

  TYPES: [
    { val: 'Adhérent bénéficiaire', label: 'Adhérent bénéficiaire', icon: '👤' },
    { val: 'Bénévole', label: 'Bénévole', icon: '🤝' },
    { val: 'Donateur', label: 'Donateur', icon: '🎁' },
    { val: 'Mécène', label: 'Mécène', icon: '💎' },
    { val: 'Institution', label: 'Institution', icon: '🏛️' }
  ],

  INSTITUTIONS: ['MSA', 'Département', 'Région', 'Commune', 'État', 'CCAS', 'Autre'],

  NIVEAUX: [
    { val: 1, label: 'Débutant', color: '#94a3b8' },
    { val: 2, label: 'Intermédiaire', color: '#f59e0b' },
    { val: 3, label: 'Expert', color: '#16a34a' }
  ],

  FREQUENCES: [
    { val: 'tres_dispo', label: '🟢 Très disponible', desc: 'Plusieurs fois par semaine' },
    { val: 'dispo',      label: '🟡 Disponible',       desc: 'Environ une fois par semaine' },
    { val: 'occasionnel',label: '🟠 Occasionnel',      desc: 'Environ une fois par mois' },
    { val: 'rare',       label: '🔴 Rare',             desc: 'Quelques fois par an' }
  ],

  ZONES: [
    { val: 'commune',  label: '🏠 Seulement ma commune' },
    { val: '15km',     label: '🚗 Rayon de 15 km' },
    { val: '30km',     label: '🚗 Rayon de 30 km' },
    { val: 'illimite', label: '🚗 Peu importe' }
  ],

  JOURS: [
    { val: 'lun', label: 'Lundi' },
    { val: 'mar', label: 'Mardi' },
    { val: 'mer', label: 'Mercredi' },
    { val: 'jeu', label: 'Jeudi' },
    { val: 'ven', label: 'Vendredi' },
    { val: 'sam', label: 'Samedi' },
    { val: 'dim', label: 'Dimanche' }
  ],

  MOMENTS: [
    { val: 'matin', label: 'Matin' },
    { val: 'aprem', label: 'Après-midi' },
    { val: 'soir',  label: 'Soir' }
  ],

  CONDITIONS_SEUL: [
    { val: 'jamais_seul', label: '⚠️ Ne jamais seul', desc: 'Impératif : toujours accompagné', color: '#dc2626' },
    { val: 'prefere_accompagne', label: '👥 Préfère accompagné', desc: 'Préférence, peut être seul si besoin', color: '#f59e0b' }
  ],

  getAll() { return Storage.getAdherents(); },
  saveAll(list) { Storage.saveAdherents(list); },

  nextNumero() {
    const n = Storage.getCounter();
    Storage.saveCounter(n + 1);
    return 'ADH-' + String(n).padStart(3, '0');
  },

  estBenevole(a) {
    return a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole === true);
  },

  getTypeBadge(type) {
    const map = {
      'Bénévole': ' <span class="badge badge-info" style="font-size:.65rem;">🤝 Bénévole</span>',
      'Donateur': ' <span class="badge" style="font-size:.65rem;background:#f3e8ff;color:#7c3aed;">🎁 Donateur</span>',
      'Mécène': ' <span class="badge" style="font-size:.65rem;background:#fef3c7;color:#92400e;">💎 Mécène</span>',
      'Institution': ' <span class="badge" style="font-size:.65rem;background:#dbeafe;color:#1e40af;">🏛️ Institution</span>'
    };
    return map[type] || '';
  },

  getNom(a) {
    if (a.type === 'Institution') {
      const nomInst = a.nom || 'Institution';
      const represent = a.prenom ? ` (${a.prenom})` : '';
      const typeInst = a.institutionType ? ` — ${a.institutionType}` : '';
      return `${nomInst}${represent}${typeInst}`;
    }
    return `${a.prenom} ${a.nom}`;
  },

  restrictionActive(a) {
    if (!a.restriction || !a.restriction.texte) return null;
    if (!a.restriction.dateFin) return a.restriction;
    const today = Utils.todayISO();
    if (a.restriction.dateFin >= today) return a.restriction;
    return null;
  },

  accEtat: { eng: false, comp: false, dispo: false, rem: false },
  accEtatDetail: { eng: false, comp: false, dispo: false, rem: false },

  toggleAcc(section, prefix = '') {
    const key = prefix + section;
    this.accEtat[key] = !this.accEtat[key];
    if (prefix === '') this.renderAccordeonsForm();
    else this.renderAccordeonsDetail();
  },

  toutDeplier() {
    this.accEtat = { eng: true, comp: true, dispo: true, rem: true };
    this.renderBenevoleSections();
  },

  toutReplier() {
    this.accEtat = { eng: false, comp: false, dispo: false, rem: false };
    this.renderBenevoleSections();
  },

  renderAccordeonsForm() { this.renderBenevoleSections(); },

  renderAccordeonsDetail() {
    const id = this._detailIdCourant;
    if (id) this.openDetail(id);
  },

  renderBenevoleSections() {
    const container = document.getElementById('adhBenevoleGroup');
    if (!container) return;

    const engs = Parametres.getEngagements(true);
    const nbEngChecked = this.engagementsTemp.length;
    const compCats = Parametres.getCompetences(true);
    const nbCompChecked = Object.keys(this.competencesTemp).length;
    const d = this.disponibilitesTemp;
    const nbCreneaux = (d.creneaux || []).length;

    const engContent = engs.length === 0
      ? '<p style="color:var(--text-light);font-size:.85rem;">Aucune option configurée.</p>'
      : engs.map(e => {
          const checked = this.engagementsTemp.includes(e.id);
          return `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${checked ? '#eff6ff' : 'var(--bg-alt)'};border:1px solid ${checked ? 'var(--accent)' : 'var(--border)'};border-radius:8px;margin-bottom:6px;cursor:pointer;">
              <input type="checkbox" ${checked ? 'checked' : ''} onchange="Adherents.toggleEngagement('${e.id}', this.checked)" style="width:auto;">
              <span style="font-size:1.1rem;">${e.icon}</span>
              <span style="flex:1;font-size:.85rem;">
                <strong>${Utils.escapeHtml(e.label)}</strong>
                ${e.desc ? `<br><small style="color:var(--text-light);">${Utils.escapeHtml(e.desc)}</small>` : ''}
              </span>
            </label>`;
        }).join('');

    const compContent = compCats.length === 0
      ? '<p style="color:var(--text-light);font-size:.85rem;">Aucune compétence configurée.</p>'
      : compCats.map(cat => {
          const nbChecked = (cat.items || []).filter(it => this.competencesTemp[it.id]).length;
          const open = nbChecked > 0;
          return `
            <div class="acc-sub ${nbChecked > 0 ? 'avec-selection' : ''}">
              <div class="acc-sub-header" onclick="Adherents.toggleCat('${cat.id}')">
                <span class="acc-sub-icon">${cat.icon}</span>
                <span class="acc-sub-title">${Utils.escapeHtml(cat.label)}</span>
                ${nbChecked > 0 ? `<span class="acc-sub-badge">${nbChecked}</span>` : ''}
                <span id="adhCatArrow_${cat.id}" class="acc-sub-arrow">${open ? '▲' : '▼'}</span>
              </div>
              <div id="adhCatBody_${cat.id}" class="acc-sub-body" style="display:${open ? 'block' : 'none'};">
                ${(cat.items || []).map(it => {
                  const sel = this.competencesTemp[it.id];
                  const checked = !!sel;
                  const niveau = sel ? sel.niveau : 0;
                  const noteLibre = sel && sel.note ? sel.note : '';
                  return `
                    <div style="padding:6px 0;border-bottom:1px dashed var(--border);">
                      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;">
                        <input type="checkbox" ${checked ? 'checked' : ''} onchange="Adherents.toggleCompetence('${it.id}', this.checked)" style="width:auto;">
                        <span style="flex:1;">${Utils.escapeHtml(it.label)}</span>
                      </label>
                      ${checked ? `
                        <div style="margin-left:22px;margin-top:4px;display:flex;gap:4px;flex-wrap:wrap;">
                          ${this.NIVEAUX.map(n => `
                            <button type="button" onclick="Adherents.setNiveau('${it.id}', ${n.val})" style="padding:3px 8px;font-size:.72rem;border-radius:6px;border:1px solid ${niveau === n.val ? n.color : 'var(--border)'};background:${niveau === n.val ? n.color : '#fff'};color:${niveau === n.val ? '#fff' : 'var(--text)'};cursor:pointer;">${n.label}</button>
                          `).join('')}
                        </div>
                        ${it.libre && checked ? `
                          <div style="margin-left:22px;margin-top:4px;">
                            <input type="text" placeholder="Précisez…" value="${Utils.escapeHtml(noteLibre)}" onchange="Adherents.setNoteLibre('${it.id}', this.value)" style="width:100%;padding:6px;font-size:.82rem;border:1px solid var(--border);border-radius:6px;">
                          </div>` : ''}
                      ` : ''}
                    </div>`;
                }).join('')}
              </div>
            </div>`;
        }).join('');

    const freqContent = `
      <div style="margin-bottom:16px;">
        <div class="acc-inner-title">📊 Fréquence globale</div>
        <div style="display:grid;gap:6px;">
          ${this.FREQUENCES.map(f => `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${d.frequence === f.val ? '#eff6ff' : 'var(--bg-alt)'};border:1px solid ${d.frequence === f.val ? 'var(--accent)' : 'var(--border)'};border-radius:8px;cursor:pointer;">
              <input type="radio" name="adhFreq" ${d.frequence === f.val ? 'checked' : ''} onchange="Adherents.setFrequence('${f.val}')" style="width:auto;">
              <span style="flex:1;font-size:.85rem;"><strong>${f.label}</strong><br><small style="color:var(--text-light);">${f.desc}</small></span>
            </label>
          `).join('')}
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <div class="acc-inner-title">🗓️ Créneaux habituels</div>
        <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:.72rem;" onclick="Adherents.toutCocher('matin')">Tous matins</button>
          <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:.72rem;" onclick="Adherents.toutCocher('aprem')">Tous après-midi</button>
          <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:.72rem;" onclick="Adherents.toutCocher('soir')">Tous soirs</button>
          <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:.72rem;color:var(--danger);" onclick="Adherents.toutDecocher()">Décocher</button>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
            <thead><tr><th style="text-align:left;padding:4px;"></th>${this.MOMENTS.map(m => `<th style="padding:4px;text-align:center;font-size:.72rem;color:var(--text-light);">${m.label}</th>`).join('')}</tr></thead>
            <tbody>
              ${this.JOURS.map(j => `
                <tr>
                  <td style="padding:4px;font-weight:600;">${j.label}</td>
                  ${this.MOMENTS.map(m => {
                    const key = j.val + '_' + m.val;
                    const checked = d.creneaux.includes(key);
                    return `<td style="text-align:center;padding:4px;"><input type="checkbox" ${checked ? 'checked' : ''} onchange="Adherents.toggleCreneau('${key}', this.checked)" style="width:20px;height:20px;cursor:pointer;"></td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="acc-inner-title">🚗 Zone d'intervention</div>
        <div style="display:grid;gap:6px;">
          ${this.ZONES.map(z => `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${d.zone === z.val ? '#eff6ff' : 'var(--bg-alt)'};border:1px solid ${d.zone === z.val ? 'var(--accent)' : 'var(--border)'};border-radius:8px;cursor:pointer;">
              <input type="radio" name="adhZone" ${d.zone === z.val ? 'checked' : ''} onchange="Adherents.setZone('${z.val}')" style="width:auto;">
              <span style="font-size:.85rem;"><strong>${z.label}</strong></span>
            </label>
          `).join('')}
        </div>
      </div>`;

    const r = this.remarquesTemp || { general: '', restrictionTexte: '', restrictionFin: '', conditionSeul: '' };
    const remContent = `
      <div style="margin-bottom:14px;">
        <div class="acc-inner-title">📝 Remarque générale</div>
        <textarea id="adhRemarqueGenerale" rows="3" placeholder="Ex : Je peux aider mais j'ai mal à l'épaule en ce moment…" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;font-family:inherit;" onchange="Adherents.setRemarque('general', this.value)">${Utils.escapeHtml(r.general)}</textarea>
      </div>

      <div style="margin-bottom:14px;padding:12px;background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;">
        <div class="acc-inner-title" style="color:#92400e;">⚠️ Restriction temporaire</div>
        <div style="font-size:.78rem;color:#92400e;margin-bottom:8px;">Une limitation avec une date de fin. Disparaît automatiquement une fois la date passée.</div>
        <input type="text" placeholder="Ex : Mal à l'épaule" value="${Utils.escapeHtml(r.restrictionTexte)}" onchange="Adherents.setRemarque('restrictionTexte', this.value)" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:.85rem;margin-bottom:6px;">
        <label style="font-size:.78rem;color:#92400e;">Fin de la restriction :</label>
        <input type="date" value="${r.restrictionFin || ''}" onchange="Adherents.setRemarque('restrictionFin', this.value)" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:.85rem;margin-top:4px;">
      </div>

      <div style="padding:12px;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;">
        <div class="acc-inner-title" style="color:#1e40af;">👥 Conditions d'intervention</div>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px;">
          <input type="checkbox" ${r.conditionSeul ? 'checked' : ''} onchange="Adherents.setConditionSeul(this.checked)" style="width:auto;">
          <span style="font-size:.85rem;"><strong>Préfère ne pas intervenir seul(e)</strong></span>
        </label>
        ${r.conditionSeul ? `
          <div style="margin-left:20px;display:grid;gap:6px;">
            ${this.CONDITIONS_SEUL.map(c => `
              <label style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#fff;border:1px solid ${r.conditionSeul === c.val ? c.color : 'var(--border)'};border-radius:6px;cursor:pointer;">
                <input type="radio" name="adhConditionSeul" ${r.conditionSeul === c.val ? 'checked' : ''} onchange="Adherents.setRemarque('conditionSeul', '${c.val}')" style="width:auto;">
                <span style="font-size:.82rem;"><strong>${c.label}</strong><br><small style="color:var(--text-light);">${c.desc}</small></span>
              </label>
            `).join('')}
          </div>
        ` : ''}
      </div>`;

    const renderAccMain = (section, icon, titre, sousTitre, contenuHTML, compteur) => {
      const ouvert = this.accEtat[section];
      return `
        <div class="acc-main">
          <div class="acc-main-header ${ouvert ? 'open' : ''}" onclick="Adherents.toggleAcc('${section}','')">
            <span class="acc-main-icon">${icon}</span>
            <div style="flex:1;min-width:0;">
              <div class="acc-main-title">${titre}</div>
              <div class="acc-main-subtitle">${sousTitre}</div>
            </div>
            ${compteur !== null ? `<span class="acc-main-badge ${compteur > 0 ? '' : 'vide'}">${compteur}</span>` : ''}
            <span class="acc-main-arrow">${ouvert ? '▲' : '▼'}</span>
          </div>
          <div class="acc-main-body" id="adhAccBody_${section}" style="display:${ouvert ? 'block' : 'none'};">
            ${contenuHTML}
          </div>
        </div>`;
    };

    container.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.75rem;flex:1;" onclick="Adherents.toutDeplier()">📂 Tout déplier</button>
        <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.75rem;flex:1;" onclick="Adherents.toutReplier()">📁 Tout replier</button>
      </div>
      ${renderAccMain('eng', '🤝', 'Comment je peux aider', 'Choisir les façons de participer', engContent, nbEngChecked)}
      ${renderAccMain('comp', '📚', 'Mes compétences', 'Ce que je sais faire et à quel niveau', compContent, nbCompChecked)}
      ${renderAccMain('dispo', '📅', 'Mes disponibilités', 'Quand et où je suis disponible', freqContent, nbCreneaux)}
      ${renderAccMain('rem', '📝', 'Mes remarques', 'Limitations, restrictions, conditions', remContent, null)}
    `;
  },

  setFrequence(val) { this.disponibilitesTemp.frequence = val; this.renderBenevoleSections(); },
  setZone(val) { this.disponibilitesTemp.zone = val; this.renderBenevoleSections(); },

  toggleCreneau(key, checked) {
    if (checked) {
      if (!this.disponibilitesTemp.creneaux.includes(key)) this.disponibilitesTemp.creneaux.push(key);
    } else {
      this.disponibilitesTemp.creneaux = this.disponibilitesTemp.creneaux.filter(c => c !== key);
    }
    const compteurEl = document.querySelector('#adhAccBody_dispo').previousElementSibling.querySelector('.acc-main-badge');
    if (compteurEl) compteurEl.textContent = this.disponibilitesTemp.creneaux.length;
  },

  toutCocher(moment) {
    this.JOURS.forEach(j => {
      const key = j.val + '_' + moment;
      if (!this.disponibilitesTemp.creneaux.includes(key)) this.disponibilitesTemp.creneaux.push(key);
    });
    this.renderBenevoleSections();
  },

  toutDecocher() {
    this.disponibilitesTemp.creneaux = [];
    this.renderBenevoleSections();
  },

  setRemarque(field, value) {
    if (!this.remarquesTemp) this.remarquesTemp = { general: '', restrictionTexte: '', restrictionFin: '', conditionSeul: '' };
    this.remarquesTemp[field] = value;
    if (field === 'conditionSeul') this.renderBenevoleSections();
  },

  setConditionSeul(checked) {
    if (!this.remarquesTemp) this.remarquesTemp = { general: '', restrictionTexte: '', restrictionFin: '', conditionSeul: '' };
    this.remarquesTemp.conditionSeul = checked ? 'prefere_accompagne' : '';
    this.renderBenevoleSections();
  },

  toggleEngagement(id, checked) {
    if (checked) {
      if (!this.engagementsTemp.includes(id)) this.engagementsTemp.push(id);
    } else {
      this.engagementsTemp = this.engagementsTemp.filter(x => x !== id);
    }
    this.renderBenevoleSections();
  },

  toggleCompetence(itemId, checked) {
    if (checked) this.competencesTemp[itemId] = { niveau: 1, note: '' };
    else delete this.competencesTemp[itemId];
    const info = Parametres.getCompetenceItem(itemId);
    if (info) {
      const body = document.getElementById('adhCatBody_' + info.cat.id);
      if (body) body.style.display = 'block';
      const arrow = document.getElementById('adhCatArrow_' + info.cat.id);
      if (arrow) arrow.textContent = '▲';
    }
    this.renderBenevoleSections();
  },

  setNiveau(itemId, niveau) {
    if (!this.competencesTemp[itemId]) return;
    this.competencesTemp[itemId].niveau = niveau;
    this.renderBenevoleSections();
  },

  setNoteLibre(itemId, note) {
    if (!this.competencesTemp[itemId]) return;
    this.competencesTemp[itemId].note = note.trim();
  },

  toggleCat(catId) {
    const body = document.getElementById('adhCatBody_' + catId);
    const arrow = document.getElementById('adhCatArrow_' + catId);
    if (!body) return;
    const visible = body.style.display !== 'none';
    body.style.display = visible ? 'none' : 'block';
    if (arrow) arrow.textContent = visible ? '▼' : '▲';
  },

  toggleAussiBenevole(checked) {
    const grpBenevole = document.getElementById('adhBenevoleGroup');
    if (grpBenevole) grpBenevole.style.display = checked ? 'block' : 'none';
    if (checked) this.renderBenevoleSections();
  },

  toggleTypeFields() {
    const type = document.getElementById('adhType').value;
    const grpAdresseDepart = document.getElementById('adhAdresseDepartGroup');
    const grpInstitution = document.getElementById('adhInstitutionGroup');
    const grpBenevole = document.getElementById('adhBenevoleGroup');
    const grpAussiBenevole = document.getElementById('adhAussiBenevoleGroup');
    const cbAussiBenevole = document.getElementById('adhAussiBenevole');
    const lblPrenom = document.querySelector('label[for="adhPrenom"]');
    const lblNom = document.querySelector('label[for="adhNom"]');

    if (grpInstitution) grpInstitution.style.display = type === 'Institution' ? 'block' : 'none';
    if (grpAdresseDepart) grpAdresseDepart.style.display = type === 'Bénévole' ? 'block' : 'none';

    if (grpAussiBenevole) {
      grpAussiBenevole.style.display = (type === 'Adhérent bénéficiaire') ? 'block' : 'none';
    }
    if (cbAussiBenevole && type !== 'Adhérent bénéficiaire') cbAussiBenevole.checked = false;

    const showBenevole = (type === 'Bénévole') || (type === 'Adhérent bénéficiaire' && cbAussiBenevole && cbAussiBenevole.checked);
    if (grpBenevole) grpBenevole.style.display = showBenevole ? 'block' : 'none';
    if (showBenevole) this.renderBenevoleSections();

    if (type === 'Institution') {
      if (lblPrenom) lblPrenom.textContent = 'Représentant (Prénom)';
      if (lblNom) lblNom.textContent = 'Nom de l\'institution *';
    } else {
      if (lblPrenom) lblPrenom.textContent = 'Prénom *';
      if (lblNom) lblNom.textContent = 'Nom *';
    }
  },

  openForm(id = null) {
    const form = document.getElementById('adherentForm');
    form.reset();
    document.getElementById('adhEditId').value = '';
    this.updateTypeOptions();
    this.updateInstitutionOptions();

    this.engagementsTemp = [];
    this.competencesTemp = {};
    this.disponibilitesTemp = { frequence: '', creneaux: [], zone: '' };
    this.remarquesTemp = { general: '', restrictionTexte: '', restrictionFin: '', conditionSeul: '' };
    this.accEtat = { eng: false, comp: false, dispo: false, rem: false };

    const cbAussi = document.getElementById('adhAussiBenevole');
    if (cbAussi) cbAussi.checked = false;

    if (id) {
      const a = this.getAll().find(x => x.id === id);
      if (!a) return;
      document.getElementById('adherentFormTitle').textContent = 'Modifier ' + this.getNom(a);
      document.getElementById('adhEditId').value = a.id;
      document.getElementById('adhPrenom').value = a.prenom || '';
      document.getElementById('adhNom').value = a.nom || '';
      document.getElementById('adhEmail').value = a.email || '';
      document.getElementById('adhTel').value = a.tel || '';
      document.getElementById('adhAdresse').value = a.adresse || '';
      document.getElementById('adhCP').value = a.cp || '';
      document.getElementById('adhVille').value = a.ville || '';
      document.getElementById('adhPays').value = a.pays || 'France';
      document.getElementById('adhType').value = a.type || 'Adhérent bénéficiaire';
      document.getElementById('adhSituation').value = a.situation || '';
      document.getElementById('adhDateCreation').value = a.dateCreation || Utils.todayISO();
      document.getElementById('adhDateExpiration').value = a.dateExpiration || Utils.addOneYear(a.dateCreation || Utils.todayISO());
      document.getElementById('adhYaplaId').value = a.yaplaId || '';
      document.getElementById('adhNotes').value = a.notes || '';
      document.getElementById('adhAdresseDepart').value = a.adresseDepart || '';
      document.getElementById('adhSiret').value = a.siret || '';
      document.getElementById('adhInstitutionType').value = a.institutionType || '';
      if (cbAussi) cbAussi.checked = !!a.aussiBenevole;
      this.engagementsTemp = (a.engagements || []).slice();
      this.competencesTemp = { ...(a.competences || {}) };
      this.disponibilitesTemp = {
        frequence: (a.disponibilites && a.disponibilites.frequence) || '',
        creneaux: ((a.disponibilites && a.disponibilites.creneaux) || []).slice(),
        zone: (a.disponibilites && a.disponibilites.zone) || ''
      };
      this.remarquesTemp = {
        general: a.remarqueGenerale || '',
        restrictionTexte: (a.restriction && a.restriction.texte) || '',
        restrictionFin: (a.restriction && a.restriction.dateFin) || '',
        conditionSeul: a.conditionSeul || ''
      };
      if (this.engagementsTemp.length > 0) this.accEtat.eng = true;
      if (Object.keys(this.competencesTemp).length > 0) this.accEtat.comp = true;
      if (this.disponibilitesTemp.frequence || this.disponibilitesTemp.creneaux.length > 0) this.accEtat.dispo = true;
      if (this.remarquesTemp.general || this.remarquesTemp.restrictionTexte || this.remarquesTemp.conditionSeul) this.accEtat.rem = true;

      if (a.aMettreAJour) {
        const list = this.getAll();
        const idx = list.findIndex(x => x.id === id);
        if (idx !== -1) { delete list[idx].aMettreAJour; this.saveAll(list); }
      }
    } else {
      document.getElementById('adherentFormTitle').textContent = 'Nouvelle personne';
      document.getElementById('adhDateCreation').value = Utils.todayISO();
      document.getElementById('adhDateExpiration').value = Utils.addOneYear(Utils.todayISO());
    }
    this.toggleTypeFields();
    document.getElementById('adherentFormModal').classList.add('active');
  },

  updateTypeOptions() {
    const sel = document.getElementById('adhType');
    if (!sel) return;
    sel.innerHTML = this.TYPES.map(t => `<option value="${t.val}">${t.icon} ${t.label}</option>`).join('');
  },

  updateInstitutionOptions() {
    const sel = document.getElementById('adhInstitutionType');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Choisir —</option>' + this.INSTITUTIONS.map(i => `<option value="${i}">${i}</option>`).join('');
  },

  closeForm() { document.getElementById('adherentFormModal').classList.remove('active'); },

      save(event) {
    event.preventDefault();
console.log('🔥 SAVE — prenom lu =', document.getElementById('adhPrenom').value, '| id =', document.getElementById('adhEditId').value);
    const id = document.getElementById('adhEditId').value;
    const type = document.getElementById('adhType').value;
    const cbAussi = document.getElementById('adhAussiBenevole');
    const aussiBenevole = type === 'Adhérent bénéficiaire' && cbAussi && cbAussi.checked;

    const data = {
      prenom: document.getElementById('adhPrenom').value.trim(),
      nom: document.getElementById('adhNom').value.trim(),
      email: document.getElementById('adhEmail').value.trim(),
      tel: document.getElementById('adhTel').value.trim(),
      adresse: document.getElementById('adhAdresse').value.trim(),
      cp: document.getElementById('adhCP').value.trim(),
      ville: document.getElementById('adhVille').value.trim(),
      pays: document.getElementById('adhPays').value.trim(),
      type,
      aussiBenevole,
      situation: document.getElementById('adhSituation').value,
      dateCreation: document.getElementById('adhDateCreation').value,
      dateExpiration: document.getElementById('adhDateExpiration').value,
      yaplaId: document.getElementById('adhYaplaId').value.trim(),
      notes: document.getElementById('adhNotes').value.trim(),
      adresseDepart: document.getElementById('adhAdresseDepart').value.trim() || null,
      siret: document.getElementById('adhSiret').value.trim() || null,
      institutionType: type === 'Institution' ? (document.getElementById('adhInstitutionType').value || '') : null
    };

    if (type === 'Institution') {
      if (!data.nom) { alert('Nom de l\'institution obligatoire.'); return; }
    } else {
      if (!data.prenom || !data.nom) { alert('Prénom et nom obligatoires.'); return; }
    }

    const estBenevoleData = (type === 'Bénévole') || aussiBenevole;
    
    if (estBenevoleData) {
      if (this.engagementsTemp.length === 0) {
        alert('Un bénévole doit choisir au moins une façon d\'aider.');
        this.accEtat.eng = true;
        this.renderBenevoleSections();
        return;
      }
      data.engagements = this.engagementsTemp.slice();
      data.competences = { ...this.competencesTemp };
      data.disponibilites = {
        frequence: this.disponibilitesTemp.frequence || '',
        creneaux: this.disponibilitesTemp.creneaux.slice(),
        zone: this.disponibilitesTemp.zone || ''
      };
      data.remarqueGenerale = (this.remarquesTemp.general || '').trim();
      data.restriction = (this.remarquesTemp.restrictionTexte || '').trim()
        ? { texte: this.remarquesTemp.restrictionTexte.trim(), dateFin: this.remarquesTemp.restrictionFin || null }
        : null;
      data.conditionSeul = this.remarquesTemp.conditionSeul || '';
    } else {
      data.engagements = [];
      data.competences = {};
      data.disponibilites = null;
      data.remarqueGenerale = '';
      data.restriction = null;
      data.conditionSeul = '';
    }

    if (type === 'Bénévole' || type === 'Adhérent bénéficiaire') {
      data.dateExpiration = Utils.addOneYear(data.dateCreation);
    } else {
      data.dateExpiration = null;
    }

    const list = this.getAll();
    if (id) {
      const idx = list.findIndex(a => String(a.id) === String(id));
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: Date.now(), numero: this.nextNumero(), ...data, dateAjout: new Date().toISOString() });
    }
    this.saveAll(list);
    this.closeForm();
    this.render();
    BricoBol.updateStorageInfo();
  },

  remove(id) {
    const a = this.getAll().find(x => x.id === id);
    if (!a) return;
    if (!confirm(`Supprimer ${this.getNom(a)} ?`)) return;
    this.saveAll(this.getAll().filter(x => x.id !== id));
    this.render();
    this.closeDetail();
    BricoBol.updateStorageInfo();
  },

  getFiltered() {
    const q = (document.getElementById('adhSearch').value || '').toLowerCase();
    const type = document.getElementById('adhFilterType').value;
    const statut = document.getElementById('adhFilterStatut').value;
    return this.getAll().filter(a => {
      if (q) {
        const hay = [a.numero, a.prenom, a.nom, a.email, a.tel, a.yaplaId, a.siret, a.institutionType].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type === 'Bénévole') {
        if (!this.estBenevole(a)) return false;
      } else if (type && a.type !== type) {
        return false;
      }
      if (statut === 'a_maj') {
        if (!a.aMettreAJour) return false;
      } else if (statut) {
        const s = Utils.statutAdherent(a.dateExpiration);
        if (statut === 'actif' && s !== 'actif') return false;
        if (statut === 'bientot' && s !== 'bientot') return false;
        if (statut === 'expire' && s !== 'expire') return false;
      }
      return true;
    });
  },

  render() {
    const container = document.getElementById('adherentsListContainer');
    if (!container) return;
    const list = this.getFiltered();
    const cnt = document.getElementById('adhCount');
    if (cnt) cnt.textContent = `${list.length} personne${list.length > 1 ? 's' : ''}`;
    if (list.length === 0) {
      container.innerHTML = '<div class="card"><div class="empty-state">Aucun résultat.</div></div>';
      return;
    }
    container.innerHTML = list.map(a => this.renderCard(a)).join('');
  },

  renderCard(a) {
    const statut = Utils.statutAdherent(a.dateExpiration);
    const nomAffiche = Utils.escapeHtml(this.getNom(a));
    const tel = a.tel ? `<a href="tel:${Utils.escapeHtml(a.tel)}" class="adh-btn-call" onclick="event.stopPropagation();" title="Appeler">📞</a>` : '';
    const sms = a.tel ? `<a href="sms:${Utils.escapeHtml(a.tel)}" class="adh-btn-sms" onclick="event.stopPropagation();" title="SMS">💬</a>` : '';
        const msg = (a.email || a.tel) ? `<button class="adh-btn-msg" onclick="event.stopPropagation();Adherents.ouvrirMessageModal(${a.id})" title="Envoyer un message">✉️</button>` : '';
    const gps = a.adresse ? `<button class="adh-btn-gps" onclick="event.stopPropagation();BricoBol.openGpsPopup('${Utils.escapeHtml(a.adresse + ', ' + (a.cp||'') + ' ' + (a.ville||''))}')" title="GPS">📍</button>` : '';
    const exp = a.dateExpiration ? `Exp: ${Utils.formatDate(a.dateExpiration)}` : '';
    const yapla = a.yaplaId ? ` · Yapla ${Utils.escapeHtml(a.yaplaId)}` : '';
    const typeBadge = this.getTypeBadge(a.type);
    const sit = a.situation ? ' · ' + Utils.escapeHtml(a.situation) : '';
    const siret = a.siret ? ` · SIRET ${Utils.escapeHtml(a.siret)}` : '';

    const noteMAJ = a.aMettreAJour
      ? ' <span class="badge badge-warning" style="font-size:.65rem;">📝 À mettre à jour</span>' : '';

    const aussiBenevoleBadge = (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole)
      ? ' <span class="badge badge-info" style="font-size:.65rem;">🤝 Aussi bénévole</span>' : '';

    const restriction = this.restrictionActive(a);
    const restBadge = restriction
      ? ` <span class="badge" style="font-size:.65rem;background:#fee2e2;color:#991b1b;" title="${Utils.escapeHtml(restriction.texte)}${restriction.dateFin ? ' (jusqu\'au ' + Utils.formatDate(restriction.dateFin) + ')' : ''}">⚠️ ${Utils.escapeHtml(restriction.texte.substring(0, 20))}</span>` : '';

    const condBadge = (this.estBenevole(a) && a.conditionSeul === 'jamais_seul')
      ? ' <span class="badge" style="font-size:.65rem;background:#fef3c7;color:#92400e;">👥 Jamais seul</span>' : '';

    let cotisBadge = '';
    if (a.type === 'Adhérent bénéficiaire' && typeof Cotisations !== 'undefined') {
      const paid = Cotisations.isPaidForYear(a.id);
      const cotis = Cotisations.getByAdherent(a.id).find(c => c.exercice === new Date().getFullYear() && c.statut !== 'en_attente');
      const enAttente = Cotisations.getByAdherent(a.id).find(c => c.exercice === new Date().getFullYear() && c.statut === 'en_attente');
      if (paid) {
        cotisBadge = ` <span class="badge badge-success" style="font-size:.65rem;">💶 Payé ${cotis ? cotis.montant.toFixed(2).replace('.', ',') + ' €' : ''}</span>`;
      } else if (enAttente) {
        cotisBadge = ` <span class="badge badge-warning" style="font-size:.65rem;">⏳ En attente (${(enAttente.montant || 0).toFixed(2)} €)</span>`;
      } else {
        cotisBadge = ' <span class="badge badge-warning" style="font-size:.65rem;">💶 À encaisser</span>';
      }
    }

    let benevInfos = '';
    if (this.estBenevole(a)) {
      const nbEng = (a.engagements || []).length;
      const nbComp = Object.keys(a.competences || {}).length;
      const dispo = a.disponibilites || {};
      const nbCreneaux = (dispo.creneaux || []).length;
      benevInfos = `<br>🤝 ${nbEng} · 📚 ${nbComp} · 📅 ${nbCreneaux}`;
    }

    return `
      <div class="adh-card statut-${statut}" onclick="Adherents.openDetail(${a.id})">
        <div class="adh-card-info">
          <div class="adh-card-name">
            <span class="adh-card-numero">${Utils.escapeHtml(a.numero)}</span>${nomAffiche}${typeBadge}${aussiBenevoleBadge}${cotisBadge}${noteMAJ}${restBadge}${condBadge}
          </div>
          <div class="adh-card-details">
            ${a.type ? Utils.escapeHtml(a.type) : ''}${sit} ${Utils.statutBadge(statut)}<br>
            ${a.tel ? '📞 ' + Utils.escapeHtml(a.tel) + ' ' : ''}
            ${a.email ? '📧 ' + Utils.escapeHtml(a.email) : ''}
            ${exp ? ' · ' + exp : ''}${yapla}${siret}${benevInfos}
          </div>
        </div>
        <div class="adh-card-actions">
          ${tel}${sms}${msg}${gps}
          <button class="adh-btn-edit" onclick="event.stopPropagation();Adherents.openForm(${a.id})" title="Modifier">✏️</button>
          <button class="adh-btn-del" onclick="event.stopPropagation();Adherents.remove(${a.id})" title="Supprimer">🗑️</button>
        </div>
      </div>`;
  },

  _detailIdCourant: null,

  openDetail(id) {
    this._detailIdCourant = id;
    const a = this.getAll().find(x => x.id === id);
    if (!a) return;
    const statut = a.dateExpiration ? Utils.statutAdherent(a.dateExpiration) : 'actif';
    const initiale = (a.nom || a.prenom || '?').charAt(0).toUpperCase();
    const fullAddr = [a.adresse, a.cp, a.ville, a.pays].filter(Boolean).join(', ');

    const typeInfo = this.TYPES.find(t => t.val === a.type);
    const typeLabel = typeInfo ? `${typeInfo.icon} ${typeInfo.label}` : (a.type || 'Contact');
    const showBenevole = this.estBenevole(a);

    if (!this.accEtatDetail) this.accEtatDetail = { eng: false, comp: false, dispo: false, rem: false };

    let engContent = '';
    let nbEng = 0;
    if (showBenevole && (a.engagements || []).length > 0) {
      const engs = Parametres.getEngagements(false);
      const listEngs = (a.engagements || []).map(id => engs.find(e => e.id === id)).filter(Boolean);
      nbEng = listEngs.length;
      engContent = listEngs.map(e => `<p style="font-size:.88rem;margin-bottom:6px;">${e.icon} <strong>${Utils.escapeHtml(e.label)}</strong>${e.desc ? `<br><small style="color:var(--text-light);">${Utils.escapeHtml(e.desc)}</small>` : ''}</p>`).join('');
    }

    let compContent = '';
    let nbComp = 0;
    if (showBenevole && Object.keys(a.competences || {}).length > 0) {
      const cats = Parametres.getCompetences(false);
      const parCat = {};
      cats.forEach(cat => {
        const itemsAvecSel = (cat.items || []).filter(it => a.competences[it.id]);
        if (itemsAvecSel.length > 0) parCat[cat.id] = { cat, items: itemsAvecSel };
      });
      nbComp = Object.keys(a.competences).length;
      compContent = Object.values(parCat).map(({ cat, items }) => `
        <div class="acc-sub avec-selection" style="margin-bottom:8px;">
          <div class="acc-sub-header" style="cursor:default;">
            <span class="acc-sub-icon">${cat.icon}</span>
            <span class="acc-sub-title">${Utils.escapeHtml(cat.label)}</span>
            <span class="acc-sub-badge">${items.length}</span>
          </div>
          <div class="acc-sub-body">
            ${items.map(it => {
              const sel = a.competences[it.id];
              const niv = this.NIVEAUX.find(n => n.val === sel.niveau);
              const noteTxt = sel.note ? ` — « ${Utils.escapeHtml(sel.note)} »` : '';
              return `<p style="font-size:.82rem;margin-bottom:4px;">• ${Utils.escapeHtml(it.label)}${niv ? ` <span class="badge" style="background:${niv.color}22;color:${niv.color};font-size:.65rem;">${niv.label}</span>` : ''}${noteTxt}</p>`;
            }).join('')}
          </div>
        </div>`).join('');
    }

    let dispoContent = '';
    let nbCreneaux = 0;
    if (showBenevole && a.disponibilites && (a.disponibilites.frequence || (a.disponibilites.creneaux || []).length > 0 || a.disponibilites.zone)) {
      const d = a.disponibilites;
      const freq = this.FREQUENCES.find(f => f.val === d.frequence);
      const zone = this.ZONES.find(z => z.val === d.zone);
      nbCreneaux = (d.creneaux || []).length;
      dispoContent = `
        ${freq ? `<div class="acc-inner-title">📊 Fréquence</div><p style="font-size:.88rem;margin-bottom:12px;"><strong>${freq.label}</strong><br><small style="color:var(--text-light);">${freq.desc}</small></p>` : ''}
        ${zone ? `<div class="acc-inner-title">🚗 Zone</div><p style="font-size:.88rem;margin-bottom:12px;"><strong>${zone.label}</strong></p>` : ''}
        ${nbCreneaux > 0 ? `
          <div class="acc-inner-title">🗓️ Créneaux (${nbCreneaux})</div>
          ${this.JOURS.map(j => {
            const cr = this.MOMENTS.filter(m => (d.creneaux || []).includes(j.val + '_' + m.val));
            if (cr.length === 0) return '';
            return `<p style="font-size:.85rem;margin-bottom:2px;"><strong>${j.label} :</strong> ${cr.map(m => m.label).join(', ')}</p>`;
          }).join('')}` : ''}`;
    }

    let remContent = '';
    let hasRem = false;
    if (showBenevole) {
      const parts = [];
      if (a.remarqueGenerale) {
        hasRem = true;
        parts.push(`<div class="acc-inner-title">📝 Remarque générale</div><p style="font-size:.88rem;white-space:pre-wrap;margin-bottom:12px;">${Utils.escapeHtml(a.remarqueGenerale)}</p>`);
      }
      const rest = this.restrictionActive(a);
      if (rest) {
        hasRem = true;
        parts.push(`<div style="margin-bottom:12px;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"><div class="acc-inner-title" style="color:#991b1b;">⚠️ Restriction active</div><p style="font-size:.88rem;color:#991b1b;"><strong>${Utils.escapeHtml(rest.texte)}</strong>${rest.dateFin ? `<br><small>Jusqu'au ${Utils.formatDate(rest.dateFin)}</small>` : ''}</p></div>`);
      }
      if (a.conditionSeul) {
        hasRem = true;
        const c = this.CONDITIONS_SEUL.find(x => x.val === a.conditionSeul);
        if (c) parts.push(`<div style="padding:10px;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;"><div class="acc-inner-title" style="color:#1e40af;">👥 Conditions d'intervention</div><p style="font-size:.88rem;"><strong>${c.label}</strong><br><small style="color:var(--text-light);">${c.desc}</small></p></div>`);
      }
      remContent = parts.join('');
    }

    const noteMAJ = a.aMettreAJour
      ? `<div class="adh-detail-section" style="background:#fef3c7;border:1px solid #fcd34d;"><h4>📝 À mettre à jour</h4><p style="font-size:.85rem;">Ce bénévole a été importé sans ses informations complètes.</p></div>` : '';

    let interventionsHTML = '';
    if (typeof Interventions !== 'undefined' && Interventions.getAll) {
      const mesInter = Interventions.getAll().filter(i => i.adherentId === a.id);
      if (mesInter.length > 0) {
        const statuts = Interventions.STATUTS || {};
        interventionsHTML = `<div class="adh-detail-section"><h4>Interventions (${mesInter.length})</h4>${mesInter.slice(0, 5).map(i => {
          const st = statuts[i.statut] || { badge: 'badge-neutral', label: i.statut };
          return `<p style="font-size:.85rem;margin-bottom:4px;"><strong>${Utils.escapeHtml(i.numero)}</strong> · ${Utils.escapeHtml(i.type)} <span class="badge ${st.badge}" style="font-size:.65rem;">${st.label}</span></p>`;
        }).join('')}</div>`;
      }
    }

    let cotisationsHTML = '';
    let boutonCotisation = '';
    if (a.type === 'Adhérent bénéficiaire' && typeof Cotisations !== 'undefined') {
      const histo = Cotisations.getByAdherent(a.id);
      const paidThisYear = Cotisations.isPaidForYear(a.id);
      const montant = Cotisations.getMontant();
      boutonCotisation = paidThisYear
        ? `<button class="btn" style="background:var(--info);" onclick="Adherents.closeDetail();Cotisations.openPaiementModal(${a.id});">💶 Payer une autre année</button>`
        : `<button class="btn btn-success" onclick="Adherents.closeDetail();Cotisations.openPaiementModal(${a.id});">💶 Encaisser ${montant.toFixed(2)} €</button>`;
      if (histo.length > 0) {
        cotisationsHTML = `<div class="adh-detail-section"><h4>💶 Cotisations (${histo.length})</h4>${histo.map(c => `<p style="font-size:.85rem;">${c.exercice} · ${Utils.formatDate(c.date)} · ${c.mode} · <strong>${c.montant.toFixed(2)} €</strong>${c.statut === 'en_attente' ? ' <span class="badge badge-warning" style="font-size:.65rem;">⏳ En attente</span>' : ''}</p>`).join('')}</div>`;
      }
    }

    let donsHTML = '';
    if (typeof Dons !== 'undefined' && Dons.getAll) {
      const mesDons = Dons.getAll().filter(d => d.adherentId === a.id);
      if (mesDons.length > 0) {
        const totalDons = mesDons.reduce((s, d) => s + d.montantTotal, 0);
        donsHTML = `<div class="adh-detail-section" style="background:#f3e8ff;border:1px solid #c4b5fd;"><h4 style="color:#7c3aed;">🎁 Dons (${mesDons.length})</h4>${mesDons.map(d => `<p style="font-size:.85rem;">${d.exercice} · ${(d.versements || []).length} versement(s) · <strong>${d.montantTotal.toFixed(2)} €</strong></p>`).join('')}<p style="margin-top:6px;font-size:.85rem;">Total : <strong>${totalDons.toFixed(2)} €</strong></p></div>`;
      }
    }

    const boutonIntervention = a.type === 'Adhérent bénéficiaire'
      ? `<button class="btn" style="background:var(--orange);" onclick="Adherents.closeDetail();Interventions.openFormFromAdherent(${a.id});">🛠️ Nouvelle intervention</button>`
      : '';

    const adresseDepartHTML = showBenevole
      ? `<div class="adh-detail-section"><h4>Adresse de départ</h4><p>🚗 ${Utils.escapeHtml(a.adresseDepart || fullAddr || '—')}</p></div>`
      : '';

    const institutionHTML = a.type === 'Institution'
      ? `<div class="adh-detail-section"><h4>Institution</h4>${a.institutionType ? `<p>Type : ${Utils.escapeHtml(a.institutionType)}</p>` : ''}${a.siret ? `<p>SIRET : ${Utils.escapeHtml(a.siret)}</p>` : ''}${a.prenom ? `<p>Représentant : ${Utils.escapeHtml(a.prenom)}</p>` : ''}</div>`
      : '';

    const renderAccMainDetail = (section, icon, titre, sousTitre, contenuHTML, compteur) => {
      const ouvert = this.accEtatDetail[section];
      return `
        <div class="acc-main">
          <div class="acc-main-header ${ouvert ? 'open' : ''}" onclick="Adherents.accEtatDetail.${section}=!Adherents.accEtatDetail.${section};Adherents.openDetail(${id});">
            <span class="acc-main-icon">${icon}</span>
            <div style="flex:1;min-width:0;">
              <div class="acc-main-title">${titre}</div>
              <div class="acc-main-subtitle">${sousTitre}</div>
            </div>
            ${compteur !== null ? `<span class="acc-main-badge ${compteur > 0 ? '' : 'vide'}">${compteur}</span>` : ''}
            <span class="acc-main-arrow">${ouvert ? '▲' : '▼'}</span>
          </div>
          <div class="acc-main-body" style="display:${ouvert ? 'block' : 'none'};">
            ${contenuHTML}
          </div>
        </div>`;
    };

    let accordeonsBenevole = '';
    if (showBenevole) {
      accordeonsBenevole = `
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.75rem;flex:1;" onclick="Adherents.accEtatDetail={eng:true,comp:true,dispo:true,rem:true};Adherents.openDetail(${id});">📂 Tout déplier</button>
          <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.75rem;flex:1;" onclick="Adherents.accEtatDetail={eng:false,comp:false,dispo:false,rem:false};Adherents.openDetail(${id});">📁 Tout replier</button>
        </div>
        ${renderAccMainDetail('eng', '🤝', 'Comment je peux aider', 'Façons de participer', engContent || '<p style="color:var(--text-light);font-size:.85rem;">Non renseigné.</p>', nbEng)}
        ${renderAccMainDetail('comp', '📚', 'Mes compétences', 'Savoir-faire et niveaux', compContent || '<p style="color:var(--text-light);font-size:.85rem;">Non renseigné.</p>', nbComp)}
        ${renderAccMainDetail('dispo', '📅', 'Mes disponibilités', 'Fréquence et créneaux', dispoContent || '<p style="color:var(--text-light);font-size:.85rem;">Non renseigné.</p>', nbCreneaux)}
        ${hasRem ? renderAccMainDetail('rem', '📝', 'Mes remarques', 'Restrictions et conditions', remContent, null) : ''}
      `;
    }

    const aussiBenevoleBadge = (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole)
      ? ' <span class="badge badge-info" style="font-size:.65rem;">🤝 Aussi bénévole</span>' : '';

    document.getElementById('adherentDetailBody').innerHTML = `
      <div class="adh-detail-header">
        <div class="adh-detail-avatar">${initiale}</div>
        <div style="flex:1;">
          <div class="adh-detail-name">${Utils.escapeHtml(this.getNom(a))}</div>
          <div class="adh-detail-type">${Utils.escapeHtml(typeLabel)}${aussiBenevoleBadge}</div>
          <div style="margin-top:6px;">
            ${a.dateExpiration ? Utils.statutBadge(statut) : ''}
            <span class="badge badge-neutral">${Utils.escapeHtml(a.numero)}</span>
          </div>
        </div>
      </div>
      ${noteMAJ}
      <div class="adh-detail-section">
        <h4>Coordonnées</h4>
        <p>📧 ${Utils.escapeHtml(a.email || '—')}</p>
        <p>📞 ${Utils.escapeHtml(a.tel || '—')}</p>
        <p>📍 ${Utils.escapeHtml(fullAddr || '—')}</p>
      </div>
      ${institutionHTML}
      ${adresseDepartHTML}
      <div class="adh-detail-section">
        <h4>Informations</h4>
        <p>Type : ${Utils.escapeHtml(typeLabel)}</p>
        <p>Date de création : ${Utils.formatDate(a.dateCreation)}</p>
        ${a.dateExpiration ? `<p>Expiration : ${Utils.formatDate(a.dateExpiration)}</p>` : ''}
        ${a.situation ? `<p>Situation : ${Utils.escapeHtml(a.situation)}</p>` : ''}
        ${a.yaplaId ? `<p>N° Yapla : ${Utils.escapeHtml(a.yaplaId)}</p>` : ''}
      </div>
      ${a.notes ? `<div class="adh-detail-section"><h4>Notes internes (bureau)</h4><p>${Utils.escapeHtml(a.notes)}</p></div>` : ''}
      ${accordeonsBenevole}
      ${donsHTML}
      ${cotisationsHTML}
      ${interventionsHTML}
      <div class="adh-detail-actions">
        ${boutonCotisation}
        ${boutonIntervention}
        <button class="btn btn-secondary" onclick="Adherents.closeDetail();Adherents.openForm(${a.id});">✏️ Modifier</button>
        ${a.tel ? `<a class="btn" style="background:var(--info);" href="tel:${Utils.escapeHtml(a.tel)}">📞 Appeler</a>` : ''}
        ${a.tel ? `<a class="btn" style="background:var(--purple);" href="sms:${Utils.escapeHtml(a.tel)}">💬 SMS</a>` : ''}
                ${(a.email || a.tel) ? `<button class="btn" style="background:var(--info);" onclick="Adherents.closeDetail();Adherents.ouvrirMessageModal(${a.id});">✉️ Message</button>` : ''}
        ${fullAddr ? `<button class="btn" style="background:var(--accent);" onclick="BricoBol.openGpsPopup('${Utils.escapeHtml(fullAddr)}')">📍 GPS</button>` : ''}
        <button class="btn btn-danger" onclick="Adherents.remove(${a.id})">🗑️ Supprimer</button>
      </div>`;
    document.getElementById('adherentDetailModal').classList.add('active');
  },

  closeDetail() {
    document.getElementById('adherentDetailModal').classList.remove('active');
    this._detailIdCourant = null;
  },

  openImport() {
    document.getElementById('importExcelModal').classList.add('active');
    document.getElementById('importForceType').value = 'auto';
    document.getElementById('importDetectInfo').innerHTML = '';
    document.getElementById('importAdhFile').value = '';
  },

  closeImport() { document.getElementById('importExcelModal').classList.remove('active'); },

  // ============================================================
  // ✉️ ENVOI DE MESSAGES
  // ============================================================

  ouvrirMessageModal(adherentId, contexte) {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['adherents']) {
      Router.mountIfNeeded('adherents', Router.registry['adherents']);
    }
    const adh = this.getAll().find(a => String(a.id) === String(adherentId));
    if (!adh) { alert('Contact introuvable.'); return; }

    document.getElementById('messageAdhId').value = adh.id;
    document.getElementById('messageDestinataire').textContent = this.getNom(adh);

    const coords = [];
    if (adh.email) coords.push('📧 ' + adh.email);
    if (adh.tel) coords.push('📞 ' + adh.tel);
    document.getElementById('messageCoordonnees').textContent = coords.length > 0 ? coords.join(' · ') : '⚠️ Aucun email ni téléphone renseigné';

    // Remplir la liste des modèles
    const p = Parametres.getParam();
    const ms = p.modelesMessages || [];
    const sel = document.getElementById('messageModele');
    sel.innerHTML = ms.map((m, i) => `<option value="${i}">${Utils.escapeHtml(m.label)}</option>`).join('');

    // Canal par défaut : email si dispo, sinon SMS
    const canalSel = document.getElementById('messageCanal');
    if (adh.email) canalSel.value = 'email';
    else if (adh.tel) canalSel.value = 'sms';
    else canalSel.value = 'email';

    this._messageAdhCourant = adh;
    this._messageContexte = contexte || null;
    this._majMessagePreview();
    document.getElementById('messageModal').classList.add('active');
  },

  fermerMessageModal() {
    document.getElementById('messageModal').classList.remove('active');
    this._messageAdhCourant = null;
  },

  _appliquerVariables(texte, adh, ctx) {
    if (!texte) return '';
    const p = Parametres.getParam();
    const c = ctx || {};
    const map = {
      '{prenom}': adh.prenom || '',
      '{nom}': adh.nom || '',
      '{date}': c.datePrevue ? Utils.formatDate(c.datePrevue) : '',
      '{heure}': c.heurePrevue || '',
      '{asso}': p.nomAssociation || 'BricoBol',
      '{site}': p.lienSiteMessage || 'https://sites.google.com/view/bricobol',
      '{intervention}': c.intervention || '',
      '{type}': c.type || ''
    };
    let out = texte;
    Object.keys(map).forEach(k => {
      out = out.split(k).join(map[k]);
    });
    return out;
  },

  _majMessagePreview() {
    const adh = this._messageAdhCourant;
    if (!adh) return;

    const p = Parametres.getParam();
    const ms = p.modelesMessages || [];
    const idx = parseInt(document.getElementById('messageModele').value) || 0;
    const modele = ms[idx];
    const canal = document.getElementById('messageCanal').value;

    // Objet (masqué si SMS seul)
    const objetGroup = document.getElementById('messageObjetGroup');
    objetGroup.style.display = canal === 'sms' ? 'none' : 'block';

    // Corps
    const signature = p.signatureMessage || "L'équipe BricoBol – aide solidaire";
    const lienSite = p.lienSiteMessage || 'https://sites.google.com/view/bricobol';
    const corpsModele = this._appliquerVariables(modele ? modele.corps : '', adh, this._messageContexte);
    const signatureComplete = '\n\n' + signature + '\n' + lienSite;
    document.getElementById('messageCorps').value = corpsModele + signatureComplete;

    // Objet
    if (modele && modele.sujet) {
      document.getElementById('messageObjet').value = this._appliquerVariables(modele.sujet, adh, this._messageContexte);
    } else {
      document.getElementById('messageObjet').value = '';
    }

    // Aperçu + avertissements
    const apercu = document.getElementById('messageApercu');
    const avert = [];
    if ((canal === 'email' || canal === 'both') && !adh.email) avert.push('⚠️ Pas d\'email renseigné');
    if ((canal === 'sms' || canal === 'both') && !adh.tel) avert.push('⚠️ Pas de téléphone renseigné');
    const corps = document.getElementById('messageCorps').value;
    const nbCar = corps.length;
    apercu.innerHTML = avert.length > 0
      ? '<span style="color:var(--danger);">' + avert.join(' · ') + '</span>'
      : (canal === 'sms' || canal === 'both'
        ? '📏 ' + nbCar + ' caractères (' + Math.ceil(nbCar / 160) + ' SMS)'
        : '📏 ' + nbCar + ' caractères');
  },

  envoyerMessage() {
    const adh = this._messageAdhCourant;
    if (!adh) return;
    const canal = document.getElementById('messageCanal').value;
    const objet = document.getElementById('messageObjet').value.trim();
    const corps = document.getElementById('messageCorps').value;

    if (!corps.trim()) { alert('Le message est vide.'); return; }

    let emailEnvoye = false;
    let smsEnvoye = false;

    if ((canal === 'email' || canal === 'both') && adh.email) {
      const url = 'mailto:' + encodeURIComponent(adh.email)
        + '?subject=' + encodeURIComponent(objet)
        + '&body=' + encodeURIComponent(corps);
      window.open(url, '_blank');
      emailEnvoye = true;
    }

    if (canal === 'sms' || canal === 'both') {
      if (adh.tel) {
        if (emailEnvoye) {
          // Canal "both" : on attend un peu pour laisser l'email s'ouvrir
          setTimeout(() => {
            const tel = String(adh.tel).replace(/[^+0-9]/g, '');
            const url = 'sms:' + tel + '?body=' + encodeURIComponent(corps);
            window.open(url, '_blank');
          }, 800);
        } else {
          const tel = String(adh.tel).replace(/[^+0-9]/g, '');
          const url = 'sms:' + tel + '?body=' + encodeURIComponent(corps);
          window.open(url, '_blank');
        }
        smsEnvoye = true;
      }
    }

    if (!emailEnvoye && !smsEnvoye) {
      alert('Aucun canal disponible : le contact n\'a ni email ni téléphone.');
      return;
    }

    this.fermerMessageModal();
  },

  _detecterType(headers) {
    const h = headers.join(' ').toLowerCase();
    if (h.includes('numéro de donateur') && h.includes('montant total des dons')) return 'donateurs';
    if (h.includes('adhésion - montant de l\'adhésion') || h.includes('adhésion - montant de l\'adhesion')) return 'adhesions';
    if (h.includes('membre - n° de membre') && h.includes('adhésion - statut')) return 'membres';
    return 'inconnu';
  },

  _preparerImport() {
    const file = document.getElementById('importAdhFile').files[0];
    if (!file) return;
    if (typeof XLSX === 'undefined') { alert('SheetJS non chargé.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        if (rows.length < 2) { alert('Fichier vide.'); return; }
        const headers = rows[0].map(h => String(h).toLowerCase().trim());
        const type = this._detecterType(headers);
        const info = document.getElementById('importDetectInfo');
        const labels = {
          'donateurs': '🎁 Liste des donateurs',
          'adhesions': '💶 Liste des adhésions',
          'membres': '👥 Liste des inscriptions de membres',
          'inconnu': '❓ Type non reconnu'
        };
        const colors = {
          'donateurs': '#7c3aed',
          'adhesions': '#0ea5e9',
          'membres': '#16a34a',
          'inconnu': '#dc2626'
        };
        info.innerHTML = `<div style="padding:10px;background:${colors[type]}15;border:1px solid ${colors[type]}40;border-radius:8px;font-size:.85rem;">
          <strong style="color:${colors[type]};">${labels[type]}</strong><br>
          <small style="color:var(--text-light);">${rows.length - 1} ligne(s) détectée(s)</small>
        </div>`;
      } catch (err) {
        console.error(err);
        document.getElementById('importDetectInfo').innerHTML = `<div style="color:var(--danger);font-size:.85rem;">Erreur de lecture : ${err.message}</div>`;
      }
    };
    reader.readAsArrayBuffer(file);
  },

  importerYapla() {
    const file = document.getElementById('importAdhFile').files[0];
    if (!file) { alert('Choisissez un fichier .xlsx'); return; }
    if (typeof XLSX === 'undefined') { alert('SheetJS non chargé.'); return; }

    const forceType = document.getElementById('importForceType').value;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        if (rows.length < 2) { alert('Fichier vide.'); return; }

        const headers = rows[0].map(h => String(h).toLowerCase().trim());
        const typeAuto = this._detecterType(headers);
        const type = (forceType !== 'auto') ? forceType : typeAuto;

        if (type === 'inconnu') {
          alert('❌ Type de fichier non reconnu.\n\nUtilisez la case « Forcer le type » pour choisir manuellement.');
          return;
        }

        if (type === 'donateurs') {
          if (typeof Dons === 'undefined' || !Dons.importerDonateurs) {
            alert('Module Dons non disponible pour l\'import donateurs.');
            return;
          }
          const result = Dons.importerDonateurs(rows);
          this.closeImport();
          if (result) this._afficherResultat(result);
          return;
        }

        if (type === 'membres') {
          const result = this._importerMembres(rows, headers);
          this.closeImport();
          this._afficherResultat(result);
          return;
        }

        if (type === 'adhesions') {
          const result = this._importerAdhesions(rows, headers);
          this.closeImport();
          this._afficherResultat(result);
          return;
        }
      } catch (err) {
        console.error(err);
        alert('Erreur : ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  _afficherResultat(r) {
    let msg = `✅ Import ${r.typeLabel} terminé.\n\n`;
    if (r.ajoutes !== undefined) msg += `👥 Ajoutés : ${r.ajoutes}\n`;
    if (r.maj !== undefined) msg += `🔄 Mis à jour : ${r.maj}\n`;
    if (r.ignores !== undefined) msg += `⏭️ Ignorés : ${r.ignores}\n`;
    if (r.cotisValidees !== undefined) msg += `💶 Cotisations validées : ${r.cotisValidees}\n`;
    if (r.cotisAttente !== undefined) msg += `⏳ Cotisations en attente : ${r.cotisAttente}\n`;
    if (r.cotisMaj !== undefined) msg += `✏️ Cotisations mises à jour : ${r.cotisMaj}\n`;
    if (r.cotisVerrouillees !== undefined) msg += `🔒 Cotisations protégées : ${r.cotisVerrouillees}\n`;
    if (r.benevolesMAJ !== undefined) msg += `📝 Bénévoles à mettre à jour : ${r.benevolesMAJ}\n`;
    if (r.aussiBenevoles !== undefined) msg += `🤝 Aussi bénévoles : ${r.aussiBenevoles}\n`;
    if (r.donateurs !== undefined) msg += `🎁 Donateurs traités : ${r.donateurs}\n`;
    if (r.contactsCrees !== undefined) msg += `👥 Contacts créés : ${r.contactsCrees}\n`;
    if (r.promuesMecene !== undefined) msg += `💎 Mécènes promus : ${r.promuesMecene}\n`;
    if (r.total !== undefined) msg += `\n💰 Total : ${r.total.toFixed(2)} €`;
    alert(msg);
  },

  _importerMembres(rows, headers) {
    const findCol = (names) => { for (let i = 0; i < headers.length; i++) if (names.includes(headers[i])) return i; return -1; };

    const cNum = findCol(['membre - n° de membre', 'membre - numero de membre']);
    const cPrenom = findCol(['membre - prénom', 'membre - prenom']);
    const cNom = findCol(['membre - nom']);
    const cEmail = findCol(['membre - email', 'membre - courriel']);
    const cTel = findCol(['membre - téléphone', 'membre - telephone', 'membre - tél']);
    const cAdr = findCol(['membre - adresse']);
    const cCP = findCol(['membre - code postal']);
    const cVille = findCol(['membre - ville']);
    const cPays = findCol(['membre - pays']);
    const cType = findCol(['adhésion - type d\'adhesion', 'adhesion - type d\'adhesion', 'adhésion - type d\'adhésion', 'adhesion - type d\'adhésion']);
    const cSituation = findCol(['membre - situation', 'membre - situation familiale']);
    const cAussiBenevole = findCol(['membre - souhaitez-vous aussi devenir bénévole ?', 'membre - souhaitez-vous aussi devenir benevole ?']);
    const cAdhStatut = findCol(['adhésion - statut d\'adhésion', 'adhesion - statut d\'adhesion']);
    const cAdhDateSous = findCol(['adhésion - date de souscription', 'adhesion - date de souscription']);
    const cAdhDebut = findCol(['adhésion - début de l\'adhésion', 'adhésion - debut de l\'adhesion', 'adhesion - debut de l\'adhesion']);
    const cAdhExpiration = findCol(['adhésion - expiration de l\'adhésion', 'adhesion - expiration de l\'adhesion']);
    const cAdhNumero = findCol(['adhésion - # adhésion', 'adhesion - # adhesion', 'adhésion - #adhesion']);

    if (cPrenom === -1 || cNom === -1) { alert('Colonnes "Prénom" et "Nom" introuvables.'); return; }

    const extractDate = (s) => {
      if (!s) return '';
      const m = String(s).match(/(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : s;
    };

    const montantCotis = (typeof Cotisations !== 'undefined') ? Cotisations.getMontant() : 10;
    const list = this.getAll();
    let ajoutes = 0, maj = 0, ignores = 0, cotisValidees = 0, cotisAttente = 0, benevolesMAJ = 0, aussiBenevoles = 0;

    // Identifier les lignes à traiter (ignorer celles avec adhésion Annulée)
    const lignes = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const prenom = String(r[cPrenom] || '').trim();
      const nom = String(r[cNom] || '').trim();
      if (!prenom && !nom) { ignores++; continue; }

      const statutAdh = cAdhStatut !== -1 ? String(r[cAdhStatut] || '').trim().toLowerCase() : '';
      const estAnnulee = statutAdh.includes('annul');
      if (estAnnulee) { ignores++; continue; }

      lignes.push({ r, prenom, nom, statutAdh });
    }

    lignes.forEach(({ r, prenom, nom, statutAdh }) => {
      const yaplaId = cNum !== -1 ? String(r[cNum] || '').trim() : '';
      let type = 'Adhérent bénéficiaire';
      const typeBrut = cType !== -1 ? String(r[cType] || '').toLowerCase() : '';
      if (typeBrut.includes('benevole') || typeBrut.includes('bénévole')) type = 'Bénévole';

      const situation = cSituation !== -1 ? String(r[cSituation] || '').trim() : '';
      const veutAussiBenevole = cAussiBenevole !== -1 &&
        String(r[cAussiBenevole] || '').trim().toLowerCase().startsWith('oui');
      const aussiBenevole = (type === 'Adhérent bénéficiaire') && veutAussiBenevole;

      const dateSous = cAdhDateSous !== -1 ? String(r[cAdhDateSous] || '').trim() : '';
      const dateDebut = cAdhDebut !== -1 ? String(r[cAdhDebut] || '').trim() : '';
      const dateExpYapla = cAdhExpiration !== -1 ? String(r[cAdhExpiration] || '').trim() : '';
      const dateCreation = dateSous || dateDebut || Utils.todayISO();

      const rec = {
        prenom, nom,
        email: cEmail !== -1 ? String(r[cEmail] || '').trim() : '',
        tel: cTel !== -1 ? String(r[cTel] || '').trim() : '',
        adresse: cAdr !== -1 ? String(r[cAdr] || '').trim() : '',
        cp: cCP !== -1 ? String(r[cCP] || '').trim() : '',
        ville: cVille !== -1 ? String(r[cVille] || '').trim() : '',
        pays: cPays !== -1 ? String(r[cPays] || '').trim() : 'France',
        type, situation, yaplaId, aussiBenevole,
        dateCreation: extractDate(dateCreation),
        dateExpiration: extractDate(dateExpYapla) || Utils.addOneYear(extractDate(dateCreation))
      };

      let existing = null;
      if (yaplaId) existing = list.find(a => a.yaplaId === yaplaId);
      if (!existing) existing = list.find(a => a.prenom.toLowerCase() === prenom.toLowerCase() && a.nom.toLowerCase() === nom.toLowerCase());

      let adherentId;
      if (existing) {
        Object.assign(existing, {
          prenom: rec.prenom, nom: rec.nom, email: rec.email, tel: rec.tel,
          adresse: rec.adresse, cp: rec.cp, ville: rec.ville, pays: rec.pays,
          yaplaId: rec.yaplaId
        });
        if (type === 'Bénévole' && existing.type !== 'Bénévole') {
          existing.type = 'Bénévole';
          existing.engagements = ['sympathisant'];
          existing.competences = {};
          existing.disponibilites = { frequence: '', creneaux: [], zone: '' };
          existing.aMettreAJour = true;
          benevolesMAJ++;
        } else if (aussiBenevole && !existing.aussiBenevole) {
          existing.aussiBenevole = true;
          if (!existing.engagements || existing.engagements.length === 0) {
            existing.engagements = ['sympathisant'];
            existing.competences = existing.competences || {};
            existing.disponibilites = existing.disponibilites || { frequence: '', creneaux: [], zone: '' };
            existing.aMettreAJour = true;
            benevolesMAJ++;
          }
          aussiBenevoles++;
        }
        if (existing.type === 'Adhérent bénéficiaire') {
          if (rec.dateCreation) existing.dateCreation = rec.dateCreation;
          if (rec.dateExpiration) existing.dateExpiration = rec.dateExpiration;
        }
        adherentId = existing.id;
        maj++;
      } else {
        adherentId = Date.now() + Math.random();
        const newRec = { id: adherentId, numero: this.nextNumero(), ...rec };
        if (type === 'Bénévole') {
          newRec.engagements = ['sympathisant'];
          newRec.competences = {};
          newRec.disponibilites = { frequence: '', creneaux: [], zone: '' };
          newRec.aMettreAJour = true;
          benevolesMAJ++;
        } else if (aussiBenevole) {
          newRec.engagements = ['sympathisant'];
          newRec.competences = {};
          newRec.disponibilites = { frequence: '', creneaux: [], zone: '' };
          newRec.aMettreAJour = true;
          benevolesMAJ++;
          aussiBenevoles++;
        }
        list.push(newRec);
        ajoutes++;
      }

      const numAdhesion = cAdhNumero !== -1 ? String(r[cAdhNumero] || '').trim() : '';
      const exercice = parseInt(rec.dateCreation.substring(0, 4)) || new Date().getFullYear();

      const cotisExistante = (typeof Cotisations !== 'undefined') ? Cotisations.getAll().find(c =>
        c.adherentId === adherentId && c.exercice === exercice
      ) : null;

      if (cotisExistante) return;

      if (typeof Cotisations !== 'undefined' && type === 'Adhérent bénéficiaire') {
        if (statutAdh.includes('valid')) {
          const cree = Cotisations.creerPourImport(adherentId, `${prenom} ${nom}`, {
            date: rec.dateCreation, montant: montantCotis, mode: 'CB', exercice,
            notes: numAdhesion ? `N° adhésion ${numAdhesion}` : '',
            yaplaAdhesionNumero: numAdhesion || null, yaplaId
          });
          if (cree) cotisValidees++;
        } else if (statutAdh.includes('attente')) {
          Cotisations.creerEnAttente(adherentId, `${prenom} ${nom}`, {
            date: rec.dateCreation,
            montant: montantCotis,
            mode: 'à définir',
            exercice,
            source: 'import-yapla',
            note: numAdhesion ? `N° adhésion ${numAdhesion}` : ''
          });
          cotisAttente++;
        }
      }
    });

    this.saveAll(list);
    if (typeof Compta !== 'undefined') Compta.render();
    if (typeof Cotisations !== 'undefined') Cotisations.render();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();

    return {
      typeLabel: 'Membres',
      ajoutes, maj, ignores,
      cotisValidees, cotisAttente, benevolesMAJ, aussiBenevoles
    };
  },

  _importerAdhesions(rows, headers) {
    const findCol = (names) => { for (let i = 0; i < headers.length; i++) if (names.includes(headers[i])) return i; return -1; };

    const cNum = findCol(['membre - n° de membre', 'membre - numero de membre']);
    const cPrenom = findCol(['membre - prénom', 'membre - prenom']);
    const cNom = findCol(['membre - nom']);
    const cEmail = findCol(['membre - email', 'membre - courriel']);
    const cType = findCol(['adhésion - type d\'adhesion', 'adhesion - type d\'adhesion', 'adhésion - type d\'adhésion', 'adhesion - type d\'adhésion']);
    const cAdhStatut = findCol(['adhésion - statut d\'adhésion', 'adhesion - statut d\'adhesion']);
    const cAdhDateSous = findCol(['adhésion - date de souscription', 'adhesion - date de souscription']);
    const cAdhDebut = findCol(['adhésion - début de l\'adhésion', 'adhésion - debut de l\'adhesion', 'adhesion - debut de l\'adhesion']);
    const cAdhExpiration = findCol(['adhésion - expiration de l\'adhésion', 'adhesion - expiration de l\'adhesion']);
    const cAdhNumero = findCol(['adhésion - # adhésion', 'adhesion - # adhesion', 'adhésion - #adhesion']);
    const cAdhPaiement = findCol(['paiement - mode de paiement', 'adhésion - mode de paiement', 'adhesion - mode de paiement', 'adhésion - paiement']);
    const cAdhMontant = findCol(['adhésion - montant de l\'adhésion', 'adhesion - montant de l\'adhesion', 'adhésion - montant']);
    const cAdhTraitement = findCol(['adhésion - traitement de l\'adhésion', 'adhesion - traitement de l\'adhesion']);

    if (cPrenom === -1 || cNom === -1) { alert('Colonnes "Prénom" et "Nom" introuvables.'); return; }

    const devinerMode = (typeAdh, traitement) => {
      const t = `${typeAdh} ${traitement}`.toLowerCase();
      if (t.includes('virement')) return 'Virement';
      if (t.includes('chèque') || t.includes('cheque')) return 'Chèque';
      if (t.includes('cb') || t.includes('carte') || t.includes('stripe') || t.includes('paypal') || t.includes('ligne')) return 'CB';
      if (t.includes('espèce') || t.includes('espece')) return 'Espèces';
      return 'Espèces';
    };

    const extractDate = (s) => {
      if (!s) return '';
      const m = String(s).match(/(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : s;
    };

    const montantCotis = (typeof Cotisations !== 'undefined') ? Cotisations.getMontant() : 10;
    const list = this.getAll();
    let maj = 0, ignores = 0, cotisValidees = 0, cotisMaj = 0, cotisVerrouillees = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const prenom = String(r[cPrenom] || '').trim();
      const nom = String(r[cNom] || '').trim();
      if (!prenom && !nom) { ignores++; continue; }

      const statutAdh = cAdhStatut !== -1 ? String(r[cAdhStatut] || '').trim().toLowerCase() : '';
      if (statutAdh.includes('annul')) { ignores++; continue; }

      const yaplaId = cNum !== -1 ? String(r[cNum] || '').trim() : '';
      const email = cEmail !== -1 ? String(r[cEmail] || '').trim() : '';

      let existing = null;
      if (yaplaId) existing = list.find(a => a.yaplaId === yaplaId);
      if (!existing && email) existing = list.find(a => (a.email || '').toLowerCase() === email.toLowerCase());
      if (!existing) existing = list.find(a => a.prenom.toLowerCase() === prenom.toLowerCase() && a.nom.toLowerCase() === nom.toLowerCase());

      if (!existing) { ignores++; continue; }

      const dateSous = cAdhDateSous !== -1 ? String(r[cAdhDateSous] || '').trim() : '';
      const dateDebut = cAdhDebut !== -1 ? String(r[cAdhDebut] || '').trim() : '';
      const dateExpYapla = cAdhExpiration !== -1 ? String(r[cAdhExpiration] || '').trim() : '';
      const dateCreation = extractDate(dateSous || dateDebut || Utils.todayISO());
      const dateExpiration = extractDate(dateExpYapla);

      if (dateCreation) existing.dateCreation = dateCreation;
      if (dateExpiration) existing.dateExpiration = dateExpiration;
      maj++;

      const exercice = parseInt(dateCreation.substring(0, 4)) || new Date().getFullYear();
      const numAdhesion = cAdhNumero !== -1 ? String(r[cAdhNumero] || '').trim() : '';
      const montantLigne = cAdhMontant !== -1
        ? (parseFloat(String(r[cAdhMontant] || '').replace(',', '.')) || montantCotis)
        : montantCotis;
      const typeAdh = cType !== -1 ? String(r[cType] || '').trim() : '';
      const traitement = cAdhTraitement !== -1 ? String(r[cAdhTraitement] || '').trim() : '';
      const modeExplicite = cAdhPaiement !== -1 ? String(r[cAdhPaiement] || '').trim() : '';
      const mode = modeExplicite || devinerMode(typeAdh, traitement);

      const cotisExistante = (typeof Cotisations !== 'undefined') ? Cotisations.getAll().find(c =>
        c.adherentId === existing.id && c.exercice === exercice
      ) : null;

      if (cotisExistante) {
        if (cotisExistante.verrouille) {
          cotisVerrouillees++;
          continue;
        }
        const ok = Cotisations.majImport(cotisExistante.id, {
          montant: montantLigne,
          mode,
          date: dateCreation,
          note: numAdhesion ? `N° adhésion ${numAdhesion}` : '',
          yaplaAdhesionNumero: numAdhesion || null
        });
        if (ok) cotisMaj++;
      } else {
        if (typeof Cotisations !== 'undefined' && statutAdh.includes('valid')) {
          const cree = Cotisations.creerPourImport(existing.id, `${prenom} ${nom}`, {
            date: dateCreation, montant: montantLigne, mode, exercice,
            notes: numAdhesion ? `N° adhésion ${numAdhesion}` : '',
            yaplaAdhesionNumero: numAdhesion || null, yaplaId
          });
          if (cree) cotisValidees++;
        }
      }
    }

    this.saveAll(list);
    if (typeof Compta !== 'undefined') Compta.render();
    if (typeof Cotisations !== 'undefined') Cotisations.render();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();

    return {
      typeLabel: 'Adhésions',
      maj, ignores,
      cotisValidees, cotisMaj, cotisVerrouillees
    };
  },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucun contact.'); return; }
    const headers = ['Numéro','Type','Aussi bénévole','Prénom/Représentant','Nom','Situation','Email','Téléphone','Adresse','CP','Ville','Pays','SIRET','Type institution','Date création','Date expiration','N° Yapla','Façons d\'aider','Nb compétences','Fréquence dispo','Nb créneaux','Zone','Remarque','Restriction','Fin restriction','Condition seul','Notes'];
    let csv = headers.join(';') + '\n';
    list.forEach(a => {
      let engStr = '', freq = '', nbCreneaux = '', zone = '', restriction = '', finRestriction = '';
      if (this.estBenevole(a)) {
        const engs = Parametres.getEngagements(false);
        engStr = (a.engagements || []).map(id => (engs.find(e => e.id === id) || {}).label || id).join(', ');
        if (a.disponibilites) {
          const f = this.FREQUENCES.find(x => x.val === a.disponibilites.frequence);
          const z = this.ZONES.find(x => x.val === a.disponibilites.zone);
          freq = f ? f.label : '';
          nbCreneaux = (a.disponibilites.creneaux || []).length;
          zone = z ? z.label : '';
        }
        if (a.restriction && a.restriction.texte) {
          restriction = a.restriction.texte;
          finRestriction = a.restriction.dateFin || '';
        }
      }
      const nbComp = a.competences ? Object.keys(a.competences).length : 0;
      const row = [a.numero, a.type, a.aussiBenevole ? 'Oui' : '', a.prenom, a.nom, a.situation, a.email, a.tel, a.adresse, a.cp, a.ville, a.pays, a.siret, a.institutionType, a.dateCreation, a.dateExpiration, a.yaplaId, engStr, nbComp, freq, nbCreneaux, zone, a.remarqueGenerale || '', restriction, finRestriction, a.conditionSeul || '', a.notes]
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
      csv += row + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contacts_bricobol.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  },

  getViewHTML() {
    return `
      <section class="view" id="view-adherents">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Annuaire</h1><p>Adhérents, bénévoles, donateurs, mécènes et institutions</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Adherents.openImport()">📂 Importer Yapla</button>
            <button class="btn btn-ghost" onclick="Adherents.exportCSV()">📥 Export CSV</button>
            <button class="btn" onclick="Adherents.openForm()">➕ Nouvelle personne</button>
          </div>
        </div>
        <div class="card" style="padding:14px;">
          <input type="text" id="adhSearch" placeholder="🔍 Rechercher" oninput="Adherents.render()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
            <select id="adhFilterType" onchange="Adherents.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              <option value="">Tous les types</option>
              <option value="Adhérent bénéficiaire">👤 Adhérents</option>
              <option value="Bénévole">🤝 Bénévoles</option>
              <option value="Donateur">🎁 Donateurs</option>
              <option value="Mécène">💎 Mécènes</option>
              <option value="Institution">🏛️ Institutions</option>
            </select>
            <select id="adhFilterStatut" onchange="Adherents.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              <option value="">Tous statuts</option>
              <option value="actif">À jour</option>
              <option value="bientot">Bientôt expirés</option>
              <option value="expire">Expirés</option>
              <option value="a_maj">📝 À mettre à jour</option>
            </select>
          </div>
          <div style="margin-top:10px;font-size:.82rem;color:var(--text-light);" id="adhCount">0 personne</div>
        </div>
        <div id="adherentsListContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="adherentFormModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="adherentFormTitle">Nouvelle personne</h2>
            <button class="close-btn" onclick="Adherents.closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="adherentForm" onsubmit="Adherents.save(event)">
              <input type="hidden" id="adhEditId">
              <div class="form-group">
                <label>Type</label>
                <select id="adhType" onchange="Adherents.toggleTypeFields()"></select>
              </div>

              <div class="form-group" id="adhAussiBenevoleGroup" style="display:none;padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
                  <input type="checkbox" id="adhAussiBenevole" onchange="Adherents.toggleAussiBenevole(this.checked)" style="width:auto;">
                  <span><strong>🤝 Aussi bénévole</strong><br><small style="color:var(--text-light);font-weight:400;">Ce contact participe aussi comme bénévole</small></span>
                </label>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label for="adhPrenom">Prénom *</label><input type="text" id="adhPrenom"></div>
                <div class="form-group"><label for="adhNom">Nom *</label><input type="text" id="adhNom"></div>
              </div>
              <div id="adhInstitutionGroup" style="display:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                  <div class="form-group"><label>Type d'institution</label><select id="adhInstitutionType"></select></div>
                  <div class="form-group"><label>SIRET</label><input type="text" id="adhSiret" placeholder="Optionnel"></div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Email</label><input type="email" id="adhEmail"></div>
                <div class="form-group"><label>Téléphone</label><input type="tel" id="adhTel"></div>
              </div>
              <div class="form-group"><label>Adresse</label><input type="text" id="adhAdresse"></div>
              <div style="display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:10px;">
                <div class="form-group"><label>Code postal</label><input type="text" id="adhCP"></div>
                <div class="form-group"><label>Ville</label><input type="text" id="adhVille"></div>
                <div class="form-group"><label>Pays</label><input type="text" id="adhPays" value="France"></div>
              </div>
              <div class="form-group"><label>Situation</label>
                <select id="adhSituation">
                  <option value="">— Non précisé —</option>
                  <option value="Retraité">Retraité</option>
                  <option value="Actif">Actif</option>
                  <option value="Isolé">Isolé</option>
                  <option value="Handicap">Handicap</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div class="form-group" id="adhAdresseDepartGroup" style="display:none;">
                <label>Adresse de départ <small style="color:var(--text-light);font-weight:400;">— si différente</small></label>
                <input type="text" id="adhAdresseDepart" placeholder="Laisser vide pour utiliser l'adresse personnelle">
              </div>

              <div id="adhBenevoleGroup" style="display:none;margin-top:16px;"></div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
                <div class="form-group"><label>Date de création</label><input type="date" id="adhDateCreation"></div>
                <div class="form-group"><label>N° Yapla</label><input type="text" id="adhYaplaId" placeholder="Optionnel"></div>
              </div>
              <div class="form-group"><label>Expiration (auto pour bénéficiaires/bénévoles)</label><input type="date" id="adhDateExpiration" readonly style="background:var(--bg);"></div>
              <div class="form-group"><label>Notes internes (bureau)</label><textarea id="adhNotes" rows="2"></textarea></div>
              <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="submit" class="btn" style="flex:1;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" onclick="Adherents.closeForm()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal" id="adherentDetailModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Fiche</h2>
            <button class="close-btn" onclick="Adherents.closeDetail()">&times;</button>
          </div>
          <div class="modal-body" id="adherentDetailBody"></div>
        </div>
      </div>

            <!-- Modale MESSAGE -->
      <div class="modal" id="messageModal">
        <div class="modal-content" style="max-width:620px;">
          <div class="modal-header">
            <h2>✉️ Envoyer un message</h2>
            <button class="close-btn" onclick="Adherents.fermerMessageModal()">&times;</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="messageAdhId">

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-bottom:14px;">
              <div style="font-size:.75rem;color:#1e40af;text-transform:uppercase;font-weight:700;">Destinataire</div>
              <div style="font-size:1rem;font-weight:800;margin-top:4px;" id="messageDestinataire">—</div>
              <div style="font-size:.82rem;color:var(--text-light);margin-top:4px;" id="messageCoordonnees">—</div>
            </div>

            <div class="form-group">
              <label>Modèle</label>
              <select id="messageModele" onchange="Adherents._majMessagePreview()"></select>
            </div>

            <div class="form-group">
              <label>Canal</label>
              <select id="messageCanal" onchange="Adherents._majMessagePreview()">
                <option value="email">📧 Email</option>
                <option value="sms">💬 SMS</option>
                <option value="both">📧💬 Les deux</option>
              </select>
            </div>

            <div class="form-group" id="messageObjetGroup">
              <label>Objet</label>
              <input type="text" id="messageObjet" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;font-family:inherit;">
            </div>

            <div class="form-group">
              <label>Message</label>
              <textarea id="messageCorps" rows="8" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.88rem;"></textarea>
              <div id="messageApercu" style="font-size:.78rem;color:var(--text-light);margin-top:6px;"></div>
            </div>

            <div style="display:flex;gap:10px;margin-top:14px;">
              <button type="button" class="btn" style="flex:1;background:var(--accent);" onclick="Adherents.envoyerMessage()">📤 Envoyer</button>
              <button type="button" class="btn btn-ghost" onclick="Adherents.fermerMessageModal()">Annuler</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal" id="importExcelModal">
        <div class="modal-content" style="max-width:560px;">
          <div class="modal-header">
            <h2>📂 Importer Yapla</h2>
            <button class="close-btn" onclick="Adherents.closeImport()">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:14px;color:var(--text-light);font-size:.88rem;">
              Sélectionnez un fichier <strong>.xlsx</strong> exporté depuis Yapla :<br>
              • 👥 Liste des inscriptions de membres<br>
              • 💶 Liste des adhésions<br>
              • 🎁 Liste des donateurs
            </p>
            <p style="margin-bottom:14px;color:var(--text-light);font-size:.82rem;font-style:italic;">
              Le type est détecté automatiquement. Vous pouvez le forcer si besoin.
            </p>

            <div class="form-group">
              <label>Fichier</label>
              <input type="file" id="importAdhFile" accept=".xlsx, .xls" onchange="Adherents._preparerImport()">
            </div>

            <div id="importDetectInfo" style="margin-bottom:14px;"></div>

            <div class="form-group">
              <label>Type</label>
              <select id="importForceType">
                <option value="auto">🤖 Détection automatique</option>
                <option value="membres">👥 Forcer : Inscriptions de membres</option>
                <option value="adhesions">💶 Forcer : Adhésions</option>
                <option value="donateurs">🎁 Forcer : Donateurs</option>
              </select>
            </div>

            <div style="display:flex;gap:10px;margin-top:14px;">
              <button class="btn" style="flex:1;" onclick="Adherents.importerYapla()">📂 Lancer l'import</button>
              <button class="btn btn-ghost" onclick="Adherents.closeImport()">Annuler</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  mount() {
    const d = document.getElementById('adhDateCreation');
    if (d) {
      d.addEventListener('change', () => {
        document.getElementById('adhDateExpiration').value = Utils.addOneYear(d.value);
      });
    }
    this.updateTypeOptions();
    this.updateInstitutionOptions();
    this.engagementsTemp = [];
    this.competencesTemp = {};
    this.disponibilitesTemp = { frequence: '', creneaux: [], zone: '' };
    this.remarquesTemp = { general: '', restrictionTexte: '', restrictionFin: '', conditionSeul: '' };
  },

  onShow(params) {
    if (params && params.adhFilter) {
      const sel = document.getElementById('adhFilterStatut');
      if (sel) sel.value = params.adhFilter;
    }
    this.render();
  }
};

Router.register({
  view: 'adherents',
  title: 'Annuaire',
  icon: '👥',
  section: 'Activité',
  order: 1,
  getViewHTML: () => Adherents.getViewHTML(),
  getModalsHTML: () => Adherents.getModalsHTML(),
  mount: () => Adherents.mount(),
  onShow: (params) => Adherents.onShow(params)
});
