// ============================================================
// MODULE : MISSIONS — Workflow prise en charge / validation
// ============================================================

const Missions = {

  currentTab: 'toutes',

  getAll() {
    return (typeof Interventions !== 'undefined') ? Interventions.getAll() : [];
  },

  _statutsToutes() {
    return ['demande', 'prise', 'planifiee', 'en_cours', 'a_valider', 'relancer', 'validee', 'terminee'];
  },

  _statutsValidees() {
    return ['validee', 'terminee'];
  },

  getMissions() {
    const tab = this.currentTab;
    let list = this.getAll();

    if (tab === 'aujourdhui') {
      list = [];
    } else if (tab === 'toutes') {
      list = list.filter(i => this._statutsToutes().includes(i.statut));
    } else if (tab === 'a_prendre') {
      list = list.filter(i => i.statut === 'demande');
    } else if (tab === 'en_cours') {
      list = list.filter(i => i.statut === 'prise' || i.statut === 'en_cours' || i.statut === 'planifiee');
    } else if (tab === 'a_valider') {
      list = list.filter(i => i.statut === 'a_valider');
    } else if (tab === 'validees') {
      list = list.filter(i => this._statutsValidees().includes(i.statut));
    }

    list.sort((a, b) => {
      const da = `${a.datePrevue || '9999-12-31'} ${a.heurePrevue || '99:99'}`;
      const db = `${b.datePrevue || '9999-12-31'} ${b.heurePrevue || '99:99'}`;
      return da.localeCompare(db);
    });

    return list;
  },

  _compterParTab() {
    const all = this.getAll();
    return {
      aujourdhui: (() => {
        const ids = new Set();
        this.getJour().forEach(i => ids.add(i.id));
        this.getEnRetard().forEach(i => ids.add(i.id));
        this.getARelancer().forEach(i => ids.add(i.id));
        return ids.size;
      })(),
      toutes: all.filter(i => this._statutsToutes().includes(i.statut)).length,
      a_prendre: all.filter(i => i.statut === 'demande').length,
      en_cours: all.filter(i => i.statut === 'prise' || i.statut === 'en_cours' || i.statut === 'planifiee').length,
      a_valider: all.filter(i => i.statut === 'a_valider').length,
      validees: all.filter(i => this._statutsValidees().includes(i.statut)).length
    };
  },

  setTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  // ============================================================
  // 📅 ONGLET AUJOURD'HUI — Fonctions utilitaires
  // ============================================================

  _statutsActifs() {
    return ['demande', 'prise', 'planifiee', 'en_cours', 'relancer'];
  },

  getJour() {
    const today = Utils.todayISO();
    return this.getAll()
      .filter(i => i.datePrevue === today && this._statutsActifs().includes(i.statut))
      .sort((a, b) => (a.heurePrevue || '00:00').localeCompare(b.heurePrevue || '00:00'));
  },

  getEnRetard() {
    const today = Utils.todayISO();
    return this.getAll()
      .filter(i => i.datePrevue && i.datePrevue < today && this._statutsActifs().includes(i.statut))
      .sort((a, b) => (a.datePrevue || '').localeCompare(b.datePrevue || ''));
  },

  getARelancer() {
    const today = Utils.todayISO();
    return this.getAll()
      .filter(i => {
        if (!i.aRelancer || !i.aRelancer.dateRelance) return false;
        return i.aRelancer.dateRelance <= today && this._statutsActifs().includes(i.statut);
      })
      .sort((a, b) => (a.aRelancer.dateRelance || '').localeCompare(b.aRelancer.dateRelance || ''));
  },

  _grouperParMoment(list) {
    const matin = [], aprem = [], soir = [];
    list.forEach(i => {
      const h = i.heurePrevue || '00:00';
      const hh = parseInt(h.split(':')[0]) || 0;
      if (hh < 12) matin.push(i);
      else if (hh < 18) aprem.push(i);
      else soir.push(i);
    });
    return { matin, aprem, soir };
  },

  _compterBenevoles(list) {
    const set = new Set();
    list.forEach(i => {
      if (i.benevole) set.add(i.benevole.toLowerCase().trim());
      if (i.benevole2) set.add(i.benevole2.toLowerCase().trim());
    });
    return set.size;
  },

  _trouverBenevole(nom) {
    if (!nom) return null;
    const nomCherche = nom.toLowerCase().trim();
    return Storage.getAdherents().find(a => {
      const complet = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase().trim();
      const inverse = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase().trim();
      return complet === nomCherche || inverse === nomCherche;
    }) || null;
  },

  // ---------- Rendu ----------

  render() {
    const container = document.getElementById('missionsContainer');
    if (!container) return;

    const compteurs = this._compterParTab();
    const list = this.getMissions();

    const tabs = [
      { val: 'aujourdhui', label: '📅 Aujourd\'hui', count: compteurs.aujourdhui },
      { val: 'toutes',     label: 'Toutes',         count: compteurs.toutes },
      { val: 'a_prendre',  label: '🔵 À prendre',   count: compteurs.a_prendre },
      { val: 'en_cours',   label: '🟠 En cours',    count: compteurs.en_cours },
      { val: 'a_valider',  label: '🟡 À valider',   count: compteurs.a_valider },
      { val: 'validees',   label: '✅ Validées',    count: compteurs.validees }
    ];

    let html = `
      <div class="param-tabs" style="margin-bottom:16px;">
        ${tabs.map(t => `
          <button type="button" class="param-tab ${this.currentTab === t.val ? 'active' : ''}" onclick="Missions.setTab('${t.val}')">
            ${t.label}
            <span style="background:rgba(255,255,255,.25);padding:1px 7px;border-radius:10px;font-size:.7rem;margin-left:6px;">${t.count}</span>
          </button>
        `).join('')}
      </div>
    `;

    if (this.currentTab === 'aujourdhui') {
      this._renderAujourdhui(container, html);
      return;
    }
    if (list.length === 0) {
      html += `
        <div class="card" style="text-align:center;padding:60px 24px;">
          <div style="font-size:3rem;margin-bottom:16px;">📋</div>
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:8px;">Aucune mission dans cet onglet</h3>
          <p style="color:var(--text-light);font-size:.9rem;">Rien à afficher pour l'instant.</p>
        </div>
      `;
    } else {
      html += list.map(i => this._renderCarte(i)).join('');
    }

    container.innerHTML = html;
  },

  nouvelleIntervention() {
    BricoBol.ensureModuleMounted('interventions');
    if (typeof Interventions !== 'undefined') Interventions.openForm();
  },

  ouvrirDetail(id) {
    BricoBol.ensureModuleMounted('interventions');
    if (typeof Interventions !== 'undefined') Interventions.openDetail(id);
  },

  ouvrirCalculFrais(idOptionnel) {
    if (typeof Tournee === 'undefined') { alert('Module Tournée indisponible.'); return; }
    if (!document.getElementById('tourneeFraisModal') && Tournee.getModalsHTML) {
      const html = Tournee.getModalsHTML();
      if (html) document.getElementById('modalsContainer').insertAdjacentHTML('beforeend', html);
    }
    Tournee.ouvrirCalculFrais(idOptionnel);
  },

  _renderAujourdhui(container, tabsHTML) {
    const jour = this.getJour();
    const enRetard = this.getEnRetard();
    const aRelancer = this.getARelancer();
    const total = jour.length;

    const idsAffiches = new Set([...enRetard.map(i => i.id), ...aRelancer.map(i => i.id)]);
    const jourFiltre = jour.filter(i => !idsAffiches.has(i.id));

    const nbBenevoles = this._compterBenevoles([...jour, ...enRetard, ...aRelancer]);

    const dateLongue = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const dateCapitalisee = dateLongue.charAt(0).toUpperCase() + dateLongue.slice(1);

    let body = `
      <div class="card" style="padding:16px;margin-bottom:16px;background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);color:#fff;border:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:.78rem;opacity:.85;text-transform:uppercase;letter-spacing:.05em;font-weight:700;">📅 Aujourd'hui</div>
            <div style="font-size:1.3rem;font-weight:800;margin-top:4px;">${dateCapitalisee}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.6rem;font-weight:800;">${total} intervention${total > 1 ? 's' : ''}</div>
            <div style="font-size:.85rem;opacity:.9;">${nbBenevoles} bénévole${nbBenevoles > 1 ? 's' : ''} mobilisé${nbBenevoles > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
    `;

    if (enRetard.length > 0) body += this._renderSectionJour('⚠️ En retard', enRetard, '#dc2626', '#fef2f2', '#fecaca');
    if (aRelancer.length > 0) body += this._renderSectionJour('🔔 À relancer', aRelancer, '#8b5cf6', '#faf5ff', '#c4b5fd', true);

    const groupes = this._grouperParMoment(jourFiltre);

    if (jourFiltre.length === 0 && enRetard.length === 0 && aRelancer.length === 0) {
      body += `
        <div class="card" style="text-align:center;padding:60px 24px;">
          <div style="font-size:3rem;margin-bottom:16px;">🎉</div>
          <h3 style="font-size:1.15rem;font-weight:800;margin-bottom:8px;">Aucune intervention prévue aujourd'hui</h3>
          <p style="color:var(--text-light);font-size:.9rem;max-width:400px;margin:0 auto 20px;">Profitez-en pour souffler, ou créez une intervention si besoin.</p>
          <button class="btn" onclick="Missions.nouvelleIntervention()">➕ Nouvelle intervention</button>
        </div>
      `;
    } else {
      if (groupes.matin.length > 0) body += this._renderSectionJour('🌅 Matin', groupes.matin, '#0ea5e9', '#f0f9ff', '#bfdbfe');
      if (groupes.aprem.length > 0) body += this._renderSectionJour('🌞 Après-midi', groupes.aprem, '#f59e0b', '#fffbeb', '#fcd34d');
      if (groupes.soir.length > 0) body += this._renderSectionJour('🌙 Soir', groupes.soir, '#8b5cf6', '#faf5ff', '#c4b5fd');
    }

    container.innerHTML = tabsHTML + body;
  },

  _renderSectionJour(titre, list, color, bg, border, afficherRelance) {
    return `
      <div class="card" style="padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:.95rem;font-weight:800;color:${color};margin:0;">${titre}</h3>
          <span style="background:${bg};color:${color};border:1px solid ${border};padding:2px 10px;border-radius:12px;font-size:.72rem;font-weight:700;">${list.length}</span>
        </div>
        ${list.map(i => this._renderLigneJour(i, color, afficherRelance)).join('')}
      </div>
    `;
  },

  _renderLigneJour(i, color, afficherRelance) {
    const heure = i.heurePrevue ? `⏰ ${Utils.escapeHtml(i.heurePrevue)}` : '⏰ (heure libre)';
    const dateAffichee = i.datePrevue !== Utils.todayISO() ? `📅 ${Utils.formatDate(i.datePrevue)} · ` : '';
    const statutInfo = (Interventions.STATUTS[i.statut] || { label: i.statut, badge: 'badge-neutral' });
    const benevListe = (typeof Storage !== 'undefined' && Storage.getBenevoles) ? Storage.getBenevoles(i) : [];
    const benev = benevListe.length > 0 ? benevListe.map(b => `🤝 ${Utils.escapeHtml(b)}`).join(' · ') : '<em style="color:var(--text-light);">Pas de bénévole</em>';
    const benev2 = '';
    const relance = (afficherRelance && i.aRelancer)
      ? `<div style="margin-top:6px;padding:6px 10px;background:#fef3c7;border-radius:6px;font-size:.78rem;color:#92400e;">
          🔔 <strong>${Utils.escapeHtml(i.aRelancer.quoi || 'À relancer')}</strong>
          ${i.aRelancer.dateRelance ? ' · prévu le ' + Utils.formatDate(i.aRelancer.dateRelance) : ''}
        </div>`
      : '';

    return `
      <div style="border-left:4px solid ${color};background:#fff;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:.92rem;margin-bottom:4px;">
              <span style="color:${color};">${heure}</span>
              ${dateAffichee}
              · ${Utils.escapeHtml(i.type)}
            </div>
            <div style="font-size:.82rem;color:var(--text-light);">
              👤 ${Utils.escapeHtml(i.demandeur)}<br>
              ${benev}${benev2}
            </div>
          </div>
          <span class="badge ${statutInfo.badge}" style="font-size:.65rem;flex-shrink:0;">${statutInfo.label}</span>
        </div>
        ${relance}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
          <button class="btn btn-success" style="padding:6px 12px;font-size:.78rem;flex:1;" onclick="Missions.openFaitModal(${i.id})">✅ Fait</button>
          <button class="btn" style="padding:6px 12px;font-size:.78rem;background:var(--accent);flex:1;" onclick="Missions.openReporterModal(${i.id})">📅 Reporter</button>
          <button class="btn" style="padding:6px 12px;font-size:.78rem;background:#8b5cf6;flex:1;" onclick="Missions.openRelancerModal(${i.id})">🔔 Relancer</button>
          <button class="btn" style="padding:6px 12px;font-size:.78rem;background:#f97316;flex:1;" onclick="Missions.openAssignerModal(${i.id})">👤 Assigner</button>
          <button class="btn" style="padding:6px 10px;font-size:.78rem;background:#0ea5e9;" onclick="Missions.ouvrirCalculFrais(${i.id})" title="Calculer les frais">🚗</button>
          <button class="btn btn-ghost" style="padding:6px 10px;font-size:.85rem;" onclick="Missions.ouvrirDetail(${i.id})" title="Voir la fiche">👁️</button>
        </div>
      </div>
    `;
  },

  _renderCarte(i) {
    const st = (Interventions.STATUTS[i.statut] || { label: i.statut, badge: 'badge-neutral', color: '#64748b' });

    const num = Utils.escapeHtml(i.numero);
    const demandeur = Utils.escapeHtml(i.demandeur || '—');
    const type = Utils.escapeHtml(i.type || '—');

    let dateStr = '';
    if (i.datePrevue) {
      dateStr = `📅 ${Utils.formatDate(i.datePrevue)}`;
      if (i.heurePrevue) dateStr += ` · ⏰ ${Utils.escapeHtml(i.heurePrevue)}`;
    }

    const benevListe = (typeof Storage !== 'undefined' && Storage.getBenevoles) ? Storage.getBenevoles(i) : [];
    let benevStr = '<em style="color:var(--text-light);">Non assigné</em>';
    if (benevListe.length > 0) {
      benevStr = benevListe.map(b => `🤝 ${Utils.escapeHtml(b)}`).join(' · ');
    }

    let boutonPrincipal = '';
    if (i.statut === 'demande') {
      boutonPrincipal = `<button class="btn btn-secondary" style="padding:8px 14px;font-size:.82rem;background:#64748b;" onclick="Missions.openPrendreModal(${i.id})">🔵 Prendre la mission</button>`;
    } else if (i.statut === 'prise') {
      boutonPrincipal = `<button class="btn" style="padding:8px 14px;font-size:.82rem;background:#16a34a;" onclick="Missions.demarrerMission(${i.id})">🟢 Démarrer la mission</button>`;
    } else if (i.statut === 'en_cours') {
      boutonPrincipal = `<button class="btn" style="padding:8px 14px;font-size:.82rem;background:#eab308;" onclick="Missions.openTerminerModal(${i.id})">✅ Mission terminée</button>`;
    } else if (i.statut === 'a_valider') {
      boutonPrincipal = `<button class="btn" style="padding:8px 14px;font-size:.82rem;background:#16a34a;" onclick="Missions.openValiderModal(${i.id})">✔️ Valider la mission</button>`;
    }

    let extra = '';
    if (i.prisEnChargeLe) {
      extra += `<div style="font-size:.75rem;color:var(--text-light);margin-top:4px;">🔵 Prise en charge : ${new Date(i.prisEnChargeLe).toLocaleDateString('fr-FR')}</div>`;
    }
    if (i.finiLe) {
      extra += `<div style="font-size:.75rem;color:var(--text-light);margin-top:4px;">✅ Fini le : ${new Date(i.finiLe).toLocaleDateString('fr-FR')}</div>`;
    }
    if (i.kmDeclares !== undefined && i.kmDeclares !== null) {
      extra += `<div style="font-size:.75rem;color:var(--text-light);margin-top:4px;">📏 Km déclarés : ${i.kmDeclares} km</div>`;
    }
    if (i.remarqueBenevole) {
      extra += `<div style="font-size:.75rem;color:var(--text-light);margin-top:4px;font-style:italic;">📝 "${Utils.escapeHtml(i.remarqueBenevole.substring(0, 60))}${i.remarqueBenevole.length > 60 ? '…' : ''}"</div>`;
    }
    if (i.valideeLe) {
      extra += `<div style="font-size:.75rem;color:var(--success);margin-top:4px;font-weight:700;">✔️ Validée le : ${new Date(i.valideeLe).toLocaleDateString('fr-FR')}</div>`;
    }

    return `
      <div class="adh-card" style="border-left-color:${st.color};margin-bottom:10px;">
        <div class="adh-card-info" style="flex:1;">
          <div class="adh-card-name" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="adh-card-numero">${num}</span>
            ${demandeur} — ${type}
            <span class="badge ${st.badge}" style="font-size:.65rem;">${st.label}</span>
          </div>
          <div class="adh-card-details">
            ${dateStr ? dateStr + '<br>' : ''}
            ${benevStr}
            ${extra}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            ${boutonPrincipal}
            <button class="btn btn-ghost" style="padding:8px 12px;font-size:.82rem;" onclick="Missions.openDetail(${i.id})">👁️ Fiche</button>
          </div>
        </div>
      </div>
    `;
  },

  openDetail(id) {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['interventions']) {
      Router.mountIfNeeded('interventions', Router.registry['interventions']);
    }
    if (typeof Interventions !== 'undefined') Interventions.openDetail(id);
  },

  // ---------- Modale PRENDRE LA MISSION ----------

  openPrendreModal(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;

    document.getElementById('missionsPrendreId').value = id;
    document.getElementById('missionsPrendreTitre').textContent = `${i.numero} · ${i.demandeur || '—'}`;
    document.getElementById('missionsPrendreInfos').innerHTML = `
      <strong>${Utils.escapeHtml(i.type || '—')}</strong>
      ${i.datePrevue ? `<br>📅 ${Utils.formatDate(i.datePrevue)}${i.heurePrevue ? ' · ⏰ ' + Utils.escapeHtml(i.heurePrevue) : ''}` : ''}
    `;

    const benevoles = Storage.getAdherents()
      .filter(a => a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole))
      .map(a => `${a.prenom} ${a.nom}`)
      .sort();

    const sel1 = document.getElementById('missionsPrendreBenevole1');
    const sel2 = document.getElementById('missionsPrendreBenevole2');

    sel1.innerHTML = '<option value="">— Choisir un bénévole —</option>' +
      benevoles.map(b => `<option value="${Utils.escapeHtml(b)}" ${i.benevole === b ? 'selected' : ''}>${Utils.escapeHtml(b)}</option>`).join('');

    sel2.innerHTML = '<option value="">— Aucun —</option>' +
      benevoles.map(b => `<option value="${Utils.escapeHtml(b)}" ${i.benevole2 === b ? 'selected' : ''}>${Utils.escapeHtml(b)}</option>`).join('');

    document.getElementById('missionsPrendreModal').classList.add('active');
  },

  fermerPrendreModal() {
    document.getElementById('missionsPrendreModal').classList.remove('active');
  },

  confirmerPrendre(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsPrendreId').value);
    const b1 = document.getElementById('missionsPrendreBenevole1').value.trim();
    const b2 = document.getElementById('missionsPrendreBenevole2').value.trim();

    if (!b1) { alert('Choisissez un bénévole principal.'); return; }
    if (b1 && b2 && b1 === b2) { alert('Le bénévole principal et secondaire sont identiques.'); return; }

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    list[idx].statut = 'prise';
    list[idx].benevole = b1;
    list[idx].benevole2 = b2 || '';
    list[idx].prisEnChargeLe = new Date().toISOString();

    Interventions.saveAll(list);
    this.fermerPrendreModal();
    this.render();
    if (typeof Tournee !== 'undefined' && Tournee.render) Tournee.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  // ---------- Démarrer une mission ----------

  demarrerMission(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    if (i.statut !== 'prise') { alert('Cette mission n\'est pas en statut "Prise en charge".'); return; }
    if (!confirm(`Démarrer la mission ${i.numero} ?\n\n${i.demandeur || ''}`)) return;

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return;

    list[idx].statut = 'en_cours';
    list[idx].demarreeLe = new Date().toISOString();

    Interventions.saveAll(list);
    this.render();
    if (typeof Tournee !== 'undefined' && Tournee.render) Tournee.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  // ---------- Modale TERMINER ----------

  openTerminerModal(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    if (i.statut !== 'en_cours') { alert('Cette mission n\'est pas "En cours".'); return; }

    document.getElementById('missionsTerminerId').value = id;
    document.getElementById('missionsTerminerTitre').textContent = `${i.numero} · ${i.demandeur || '—'}`;
    document.getElementById('missionsTerminerInfos').innerHTML = `
      <strong>${Utils.escapeHtml(i.type || '—')}</strong>
      ${i.benevole ? `<br>🤝 Bénévole : ${Utils.escapeHtml(i.benevole)}` : ''}
    `;
    document.getElementById('missionsTerminerKm').value = '';
    document.getElementById('missionsTerminerRemarque').value = '';
    document.getElementById('missionsTerminerCertif').checked = false;

    document.getElementById('missionsTerminerModal').classList.add('active');
  },

  fermerTerminerModal() {
    document.getElementById('missionsTerminerModal').classList.remove('active');
  },

  confirmerTerminer(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsTerminerId').value);
    const kmStr = document.getElementById('missionsTerminerKm').value.trim();
    const km = kmStr === '' ? null : parseFloat(kmStr);
    const remarque = document.getElementById('missionsTerminerRemarque').value.trim();
    const certif = document.getElementById('missionsTerminerCertif').checked;

    if (km !== null && (isNaN(km) || km < 0)) { alert('Indiquez un nombre de km valide.'); return; }
    if (!certif) { alert('Merci de cocher la case pour certifier que la mission est terminée.'); return; }

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    list[idx].statut = 'a_valider';
    list[idx].finiLe = new Date().toISOString();
    list[idx].kmDeclares = km;
    list[idx].remarqueBenevole = remarque;

    Interventions.saveAll(list);
    this.fermerTerminerModal();
    this.render();
    if (typeof Tournee !== 'undefined' && Tournee.render) Tournee.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();

    alert('✅ Mission marquée terminée.\n\nElle est maintenant en attente de validation par le bureau.');
  },

  // ---------- Modale VALIDER (bureau) ----------

  async openValiderModal(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    if (i.statut !== 'a_valider') { alert('Cette mission n\'est pas en attente de validation.'); return; }

    document.getElementById('missionsValiderId').value = id;
    document.getElementById('missionsValiderTitre').textContent = `${i.numero} · ${i.demandeur || '—'}`;

    let recapHtml = `
      <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Bénévole</span><strong>${Utils.escapeHtml(i.benevole || '—')}</strong></div>
      ${i.benevole2 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Bénévole 2</span><strong>${Utils.escapeHtml(i.benevole2)}</strong></div>` : ''}
      ${i.finiLe ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Terminée le</span><strong>${new Date(i.finiLe).toLocaleString('fr-FR')}</strong></div>` : ''}
      ${(i.kmDeclares !== null && i.kmDeclares !== undefined) ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Km déclarés</span><strong>${i.kmDeclares} km</strong></div>` : `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#64748b;"><span>Km déclarés</span><em>— non saisis —</em></div>`}
      ${i.remarqueBenevole ? `<div style="margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px;font-size:.82rem;font-style:italic;color:#475569;">📝 "${Utils.escapeHtml(i.remarqueBenevole)}"</div>` : ''}
    `;
    document.getElementById('missionsValiderRecap').innerHTML = recapHtml;

    document.getElementById('missionsValiderKmAuto').value = '—';
    document.getElementById('missionsValiderEcart').innerHTML = '';
    document.getElementById('missionsValiderRadioDeclare').disabled = (i.kmDeclares === null || i.kmDeclares === undefined);
    document.getElementById('missionsValiderRadioDeclare').checked = false;
    document.getElementById('missionsValiderRadioAuto').checked = true;
    document.getElementById('missionsValiderRadioManuel').checked = false;
    document.getElementById('missionsValiderKmManuel').value = '';
    document.getElementById('missionsValiderKmManuel').disabled = true;
    document.getElementById('missionsValiderMontant').textContent = '0,00 €';
    document.getElementById('missionsValiderCalcStatut').innerHTML = '<div style="text-align:center;color:#2563eb;font-size:.82rem;padding:6px;">⏳ Calcul du trajet en cours…</div>';

    document.getElementById('missionsValiderModal').classList.add('active');

    await this._calculerKmAuto(id);
  },

  fermerValiderModal() {
    document.getElementById('missionsValiderModal').classList.remove('active');
  },

  _trouverBenevole(nom) {
    if (!nom) return null;
    const nomCherche = nom.toLowerCase().trim();
    return Storage.getAdherents().find(a => {
      const complet = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase().trim();
      const inverse = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase().trim();
      return complet === nomCherche || inverse === nomCherche;
    }) || null;
  },

  async _calculerKmAuto(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;

    const statutEl = document.getElementById('missionsValiderCalcStatut');
    const setStatut = (msg, color = '#2563eb') => {
      if (statutEl) statutEl.innerHTML = `<div style="text-align:center;color:${color};font-size:.82rem;padding:6px;">${msg}</div>`;
    };

    try {
      const benevole = this._trouverBenevole(i.benevole);
      if (!benevole) { setStatut('❌ Bénévole introuvable dans l\'annuaire', '#dc2626'); return; }

      const adresseDepart = benevole.adresseDepart || 
        [benevole.adresse, benevole.cp, benevole.ville, benevole.pays].filter(Boolean).join(', ');
      if (!adresseDepart) { setStatut('❌ Pas d\'adresse pour le bénévole', '#dc2626'); return; }

      let adh = null;
      if (i.adherentId) adh = Storage.getAdherents().find(a => a.id === i.adherentId);
      if (!adh && i.demandeur) adh = this._trouverBenevole(i.demandeur);

      let adresseArr = null;
      if (adh) adresseArr = [adh.adresse, adh.cp, adh.ville].filter(Boolean).join(', ');
      if (!adresseArr && i.description) {
        const m = i.description.match(/Adresse\s*:\s*([^\n]+)/i);
        if (m && m[1]) adresseArr = m[1].trim();
      }
      if (!adresseArr) { setStatut('❌ Adresse de l\'intervention introuvable', '#dc2626'); return; }

      setStatut('⏳ Géocodage du départ…');
      await new Promise(r => setTimeout(r, 200));
      const coordsDep = await Frais.geocode(adresseDepart);
      if (!coordsDep) { setStatut('❌ Géocodage départ échoué', '#dc2626'); return; }

      setStatut('⏳ Géocodage de l\'intervention…');
      await new Promise(r => setTimeout(r, 200));
      const coordsArr = await Frais.geocode(adresseArr);
      if (!coordsArr) { setStatut('❌ Géocodage intervention échoué', '#dc2626'); return; }

      setStatut('🚗 Calcul du trajet…');
      await new Promise(r => setTimeout(r, 200));
      const kmAuto = Math.round(await Frais.route([coordsDep, coordsArr, coordsDep]));
      if (kmAuto <= 0) { setStatut('❌ Trajet non calculable', '#dc2626'); return; }

      document.getElementById('missionsValiderKmAuto').value = kmAuto;

      const kmDeclares = (i.kmDeclares !== null && i.kmDeclares !== undefined) ? i.kmDeclares : null;
      if (kmDeclares !== null) {
        const ecart = kmDeclares - kmAuto;
        const signe = ecart > 0 ? '+' : '';
        document.getElementById('missionsValiderEcart').innerHTML = 
          `<div style="font-size:.82rem;color:${ecart === 0 ? '#16a34a' : (ecart > 0 ? '#f59e0b' : '#0ea5e9')};margin-top:4px;">
            Écart : <strong>${signe}${ecart} km</strong>
          </div>`;
      }

      setStatut('✅ Calcul terminé — choisissez le km à utiliser', '#16a34a');
      this._updateMontantValider();
    } catch (e) {
      console.error(e);
      setStatut('❌ Erreur : ' + e.message, '#dc2626');
    }
  },

  _updateMontantValider() {
    const i = this.getAll().find(x => x.id === Number(document.getElementById('missionsValiderId').value));
    if (!i) return;

    let kmChoisi = 0;
    const radioDeclare = document.getElementById('missionsValiderRadioDeclare');
    const radioAuto = document.getElementById('missionsValiderRadioAuto');
    const radioManuel = document.getElementById('missionsValiderRadioManuel');
    const kmAuto = parseFloat(document.getElementById('missionsValiderKmAuto').value) || 0;
    const kmManuel = parseFloat(document.getElementById('missionsValiderKmManuel').value) || 0;
    const kmDeclares = (i.kmDeclares !== null && i.kmDeclares !== undefined) ? i.kmDeclares : 0;

    if (radioDeclare.checked) kmChoisi = kmDeclares;
    else if (radioAuto.checked) kmChoisi = kmAuto;
    else if (radioManuel.checked) kmChoisi = kmManuel;

    const bareme = (typeof Frais !== 'undefined' && Frais.getBareme) ? Frais.getBareme() : 0.40;
    const montant = kmChoisi * bareme;

    document.getElementById('missionsValiderMontant').textContent = montant.toFixed(2) + ' €';
  },

  _toggleKmManuel() {
    const radioManuel = document.getElementById('missionsValiderRadioManuel');
    document.getElementById('missionsValiderKmManuel').disabled = !radioManuel.checked;
    this._updateMontantValider();
  },

  async confirmerValider(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsValiderId').value);
    const i = this.getAll().find(x => x.id === id);
    if (!i) { alert('Mission introuvable.'); return; }

    const radioDeclare = document.getElementById('missionsValiderRadioDeclare');
    const radioAuto = document.getElementById('missionsValiderRadioAuto');
    const radioManuel = document.getElementById('missionsValiderRadioManuel');
    const kmAuto = parseFloat(document.getElementById('missionsValiderKmAuto').value) || 0;
    const kmManuel = parseFloat(document.getElementById('missionsValiderKmManuel').value) || 0;
    const kmDeclares = (i.kmDeclares !== null && i.kmDeclares !== undefined) ? i.kmDeclares : 0;

    let kmChoisi = 0;
    if (radioDeclare.checked) kmChoisi = kmDeclares;
    else if (radioAuto.checked) kmChoisi = kmAuto;
    else if (radioManuel.checked) kmChoisi = kmManuel;

    if (kmChoisi < 0 || isNaN(kmChoisi)) { alert('Km invalide.'); return; }

    const bareme = (typeof Frais !== 'undefined' && Frais.getBareme) ? Frais.getBareme() : 0.40;
    const montant = kmChoisi * bareme;
    const creerRemb = document.getElementById('missionsValiderCreerRemb').checked;

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return;

    list[idx].statut = 'validee';
    list[idx].valideeLe = new Date().toISOString();
    list[idx].kmValides = kmChoisi;

    let deplacementId = null;
    let comptaPiece = null;

    if (creerRemb && kmChoisi > 0) {
      const depsList = Storage.getDeplacements();
      const n = depsList.length + 1;
      const numero = 'DEP-' + String(n).padStart(3, '0');

      deplacementId = Date.now() + Math.random();

      const deplacement = {
        id: deplacementId,
        numero: numero,
        date: Utils.todayISO(),
        benevole: i.benevole,
        km: kmChoisi,
        trajet: `Domicile → ${i.numero} → Retour`,
        motif: `Mission ${i.numero} · ${i.demandeur || ''}`,
        notes: '',
        rembourse: false,
        montant: montant,
        bareme: bareme,
        interventions: [{ numero: i.numero, kmIndividuel: kmChoisi, part: montant }]
      };
      depsList.push(deplacement);
      Storage.saveDeplacements(depsList);

      const comptaList = (typeof Compta !== 'undefined') ? Compta.getAll() : Storage.getEntries();
      const comptaId = Date.now() + Math.random();
      const pieceCount = comptaList.filter(e => e.type === 'depense').length + 1;
      comptaPiece = 'DEP-' + String(pieceCount).padStart(3, '0');

      const entry = {
        id: comptaId,
        type: 'depense',
        date: Utils.todayISO(),
        piece: comptaPiece,
        yapla: '-',
        tiers: i.benevole,
        intervention: i.numero,
        paiement: 'Espèces',
        items: [{ name: '🚗 Remboursement frais de route', amount: montant, category: 'variable' }],
        total: montant,
        source: 'frais-remboursement',
        notes: `Mission ${i.numero}`
      };
      comptaList.push(entry);
      if (typeof Compta !== 'undefined') Compta.saveAll(comptaList);
      else Storage.saveEntries(comptaList);

      list[idx].deplacementId = deplacementId;
    }

    Interventions.saveAll(list);

    if (typeof Frais !== 'undefined' && Frais.render) Frais.render();
    if (typeof Compta !== 'undefined' && Compta.render) Compta.render();
    if (typeof Tournee !== 'undefined' && Tournee.render) Tournee.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    this.render();
    BricoBol.updateStorageInfo();

    this.fermerValiderModal();

    if (creerRemb && kmChoisi > 0) {
      alert(`✅ Mission validée.\n\n💰 Déplacement créé : DEP-XXX\n📏 ${kmChoisi} km × ${bareme.toFixed(2)} € = ${montant.toFixed(2)} €\n📄 Écriture compta : ${comptaPiece}`);
    } else {
      alert('✅ Mission validée (sans remboursement).');
    }
  },

  // ---------- Vue ----------

    // ---------- Actions Aujourd'hui ----------

  openFaitModal(id) {
    const i = this.getAll().find(x => String(x.id) === String(id));
    if (!i) return;
    document.getElementById('missionsFaitId').value = id;
    document.getElementById('missionsFaitTitre').textContent = `${i.numero} · ${i.demandeur}`;
    document.getElementById('missionsFaitDate').value = Utils.todayISO();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('missionsFaitHeure').value = `${hh}:${mm}`;
    document.getElementById('missionsFaitNote').value = '';
    document.getElementById('missionsFaitModal').classList.add('active');
  },

  closeFaitModal() { document.getElementById('missionsFaitModal').classList.remove('active'); },

  confirmerFait(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsFaitId').value);
    const dateRealisee = document.getElementById('missionsFaitDate').value;
    const heureRealisee = document.getElementById('missionsFaitHeure').value;
    const note = document.getElementById('missionsFaitNote').value.trim();

    const list = this.getAll();
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    list[idx].statut = 'terminee';
    list[idx].dateRealisee = dateRealisee;
    if (heureRealisee) list[idx].heureRealisee = heureRealisee;
    if (note) {
      list[idx].notes = (list[idx].notes || '') ? list[idx].notes + '\n' + note : note;
    }

    Interventions.saveAll(list);
    this.closeFaitModal();
    this.render();
    if (typeof Agenda !== 'undefined' && Agenda.render) Agenda.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  openReporterModal(id) {
    const i = this.getAll().find(x => String(x.id) === String(id));
    if (!i) return;
    document.getElementById('missionsReportId').value = id;
    document.getElementById('missionsReportTitre').textContent = `${i.numero} · ${i.demandeur}`;
    document.getElementById('missionsReportDateActuelle').textContent = i.datePrevue ? Utils.formatDate(i.datePrevue) : '—';
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    document.getElementById('missionsReportDate').value = demain.toISOString().split('T')[0];
    document.getElementById('missionsReportRaison').value = '';
    document.getElementById('missionsReportModal').classList.add('active');
  },

  closeReporterModal() { document.getElementById('missionsReportModal').classList.remove('active'); },

  reporterRapide(nbJours) {
    const d = new Date();
    d.setDate(d.getDate() + nbJours);
    document.getElementById('missionsReportDate').value = d.toISOString().split('T')[0];
  },

  confirmerReporter(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsReportId').value);
    const nouvelleDate = document.getElementById('missionsReportDate').value;
    const raison = document.getElementById('missionsReportRaison').value.trim();
    if (!nouvelleDate) { alert('Choisissez une date.'); return; }

    const list = this.getAll();
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    const ancienneDate = list[idx].datePrevue;
    list[idx].datePrevue = nouvelleDate;

    if (raison) {
      const ligne = `[Report du ${Utils.formatDate(ancienneDate || '')} au ${Utils.formatDate(nouvelleDate)}] ${raison}`;
      list[idx].notes = (list[idx].notes || '') ? list[idx].notes + '\n' + ligne : ligne;
    }

    Interventions.saveAll(list);
    this.closeReporterModal();
    this.render();
    if (typeof Agenda !== 'undefined' && Agenda.render) Agenda.render();
    BricoBol.updateStorageInfo();
  },

  openRelancerModal(id) {
    const i = this.getAll().find(x => String(x.id) === String(id));
    if (!i) return;
    document.getElementById('missionsRelanceId').value = id;
    document.getElementById('missionsRelanceTitre').textContent = `${i.numero} · ${i.demandeur}`;

    const dejaRelance = !!i.aRelancer;
    document.getElementById('missionsRelanceQuoi').value = dejaRelance ? (i.aRelancer.quoi || '') : '';
    document.getElementById('missionsRelanceNote').value = dejaRelance ? (i.aRelancer.note || '') : '';

    const radioImmediat = document.getElementById('missionsRelanceImmediat');
    const radioDate = document.getElementById('missionsRelanceDateRadio');
    const inputDate = document.getElementById('missionsRelanceDate');

    if (dejaRelance && i.aRelancer.dateRelance) {
      radioDate.checked = true;
      radioImmediat.checked = false;
      inputDate.value = i.aRelancer.dateRelance;
      inputDate.disabled = false;
    } else {
      radioImmediat.checked = true;
      radioDate.checked = false;
      inputDate.value = Utils.todayISO();
      inputDate.disabled = true;
    }

    const btnSuppr = document.getElementById('missionsRelanceSupprBtn');
    if (btnSuppr) btnSuppr.style.display = dejaRelance ? 'block' : 'none';

    document.getElementById('missionsRelanceModal').classList.add('active');
  },

  closeRelancerModal() { document.getElementById('missionsRelanceModal').classList.remove('active'); },

  _toggleRelanceDate() {
    const radioDate = document.getElementById('missionsRelanceDateRadio');
    const inputDate = document.getElementById('missionsRelanceDate');
    if (inputDate) inputDate.disabled = !radioDate.checked;
  },

  confirmerRelancer(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsRelanceId').value);
    const quoi = document.getElementById('missionsRelanceQuoi').value.trim();
    const note = document.getElementById('missionsRelanceNote').value.trim();
    const radioDate = document.getElementById('missionsRelanceDateRadio');
    const inputDate = document.getElementById('missionsRelanceDate');

    if (!quoi) { alert('Indiquez ce qu\'il faut relancer.'); return; }

    let dateRelance = null;
    if (radioDate.checked) {
      dateRelance = inputDate.value;
      if (!dateRelance) { alert('Choisissez une date ou cochez "Dès que possible".'); return; }
    }

    const list = this.getAll();
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    list[idx].aRelancer = { quoi, dateRelance, note, dateCreation: new Date().toISOString() };
    list[idx].statut = 'relancer';

    Interventions.saveAll(list);
    this.closeRelancerModal();
    this.render();
    if (typeof Agenda !== 'undefined' && Agenda.render) Agenda.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  retirerRelance() {
    const id = Number(document.getElementById('missionsRelanceId').value);
    if (!id) return;
    if (!confirm('Retirer la relance ?')) return;

    const list = this.getAll();
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    delete list[idx].aRelancer;
    if (list[idx].statut === 'relancer') list[idx].statut = 'demande';

    Interventions.saveAll(list);
    this.closeRelancerModal();
    this.render();
    if (typeof Agenda !== 'undefined' && Agenda.render) Agenda.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  openAssignerModal(id) {
    const i = this.getAll().find(x => String(x.id) === String(id));
    if (!i) return;
    document.getElementById('missionsAssignId').value = id;
    document.getElementById('missionsAssignTitre').textContent = `${i.numero} · ${i.demandeur}`;

    // Reset recherche
    const rech = document.getElementById('missionsAssignRecherche');
    if (rech) rech.value = '';

    // Bénévoles disponibles (Bénévole + Adhérent bénéficiaire aussi bénévole)
    const benevoles = Storage.getAdherents()
      .filter(a => a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole))
      .map(a => `${a.prenom} ${a.nom}`)
      .sort();

    // Ceux déjà assignés à cette intervention
    const assignes = Storage.getBenevoles(i);

    this._renderAssignListe(benevoles, assignes);

    document.getElementById('missionsAssignerModal').classList.add('active');
  },

  _renderAssignListe(benevoles, assignes, filtre) {
    const container = document.getElementById('missionsAssignListe');
    if (!container) return;

    const f = (filtre || '').toLowerCase().trim();
    const liste = f ? benevoles.filter(b => b.toLowerCase().includes(f)) : benevoles;

    if (liste.length === 0) {
      container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-light);font-size:.85rem;">Aucun bénévole trouvé.</div>';
    } else {
      container.innerHTML = liste.map(b => {
        const checked = assignes.includes(b);
        return `
          <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${checked ? '#fff7ed' : '#fff'};border:1px solid ${checked ? '#f97316' : 'var(--border)'};border-radius:6px;margin-bottom:4px;cursor:pointer;">
            <input type="checkbox" class="missionsAssignCheck" value="${Utils.escapeHtml(b)}" ${checked ? 'checked' : ''} onchange="Missions._compterAssign()" style="width:auto;">
            <span style="font-size:.88rem;font-weight:500;">${Utils.escapeHtml(b)}</span>
          </label>
        `;
      }).join('');
    }

    this._compterAssign();
  },

  filtrerAssignListe(filtre) {
    const i = this.getAll().find(x => String(x.id) === String(document.getElementById('missionsAssignId').value));
    if (!i) return;
    const benevoles = Storage.getAdherents()
      .filter(a => a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole))
      .map(a => `${a.prenom} ${a.nom}`)
      .sort();
    // On garde les coches actuelles
    const assignes = Array.from(document.querySelectorAll('.missionsAssignCheck:checked')).map(cb => cb.value);
    this._renderAssignListe(benevoles, assignes, filtre);
  },

  _compterAssign() {
    const nb = document.querySelectorAll('.missionsAssignCheck:checked').length;
    const el = document.getElementById('missionsAssignCompteur');
    if (el) el.textContent = `${nb} bénévole${nb > 1 ? 's' : ''} sélectionné${nb > 1 ? 's' : ''}`;
  },

  closeAssignerModal() { document.getElementById('missionsAssignerModal').classList.remove('active'); },

  confirmerAssigner(event) {
    event.preventDefault();
    const id = Number(document.getElementById('missionsAssignId').value);

    // Récupérer les cases cochées dans l'ordre d'affichage
    const checks = Array.from(document.querySelectorAll('.missionsAssignCheck:checked'));
    const liste = checks.map(cb => cb.value);

    const list = this.getAll();
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    // Utiliser le helper qui synchronise benevoles + benevole/benevole2
    Storage.setBenevoles(list[idx], liste);

    Interventions.saveAll(list);
    this.closeAssignerModal();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  getViewHTML() {
    return `
      <section class="view" id="view-missions">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div>
            <h1>Missions</h1>
            <p>Prise en charge et validation des interventions</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Missions.render()">🔄 Rafraîchir</button>
          </div>
        </div>
        <div id="missionsContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <!-- Modale PRENDRE LA MISSION -->
      <div class="modal" id="missionsPrendreModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header" style="background:#64748b;">
            <h2>🔵 Prendre la mission</h2>
            <button class="close-btn" onclick="Missions.fermerPrendreModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerPrendre(event)">
              <input type="hidden" id="missionsPrendreId">

              <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:var(--text-light);text-transform:uppercase;font-weight:700;">Mission</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="missionsPrendreTitre">—</div>
                <div style="font-size:.85rem;color:var(--text-light);margin-top:6px;" id="missionsPrendreInfos">—</div>
              </div>

              <div class="form-group">
                <label>🤝 Bénévole principal *</label>
                <select id="missionsPrendreBenevole1" required style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.9rem;width:100%;"></select>
              </div>

              <div class="form-group">
                <label>🤝 Bénévole secondaire (optionnel)</label>
                <select id="missionsPrendreBenevole2" style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.9rem;width:100%;"></select>
              </div>

              <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;font-size:.82rem;color:#1e40af;margin-bottom:16px;">
                ℹ️ Le statut de la mission passera à <strong>Prise en charge</strong>.
              </div>

              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn btn-secondary" style="flex:1;background:#64748b;">🔵 Confirmer la prise en charge</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.fermerPrendreModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale TERMINER -->
      <div class="modal" id="missionsTerminerModal">
        <div class="modal-content" style="max-width:540px;">
          <div class="modal-header" style="background:#eab308;">
            <h2>✅ Marquer la mission terminée</h2>
            <button class="close-btn" onclick="Missions.fermerTerminerModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerTerminer(event)">
              <input type="hidden" id="missionsTerminerId">

              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#92400e;text-transform:uppercase;font-weight:700;">Mission</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="missionsTerminerTitre">—</div>
                <div style="font-size:.85rem;color:#92400e;margin-top:6px;" id="missionsTerminerInfos">—</div>
              </div>

              <div class="form-group">
                <label>📏 Kilométrage réel (optionnel)</label>
                <input type="number" step="0.1" min="0" id="missionsTerminerKm" placeholder="Ex : 38 (optionnel)" style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;width:100%;">
                <small style="color:var(--text-light);font-size:.75rem;">Laissez vide si vous ne connaissez pas le km exact — l'app calculera automatiquement.</small>
              </div>

              <div class="form-group">
                <label>📝 Remarque du bénévole (optionnel)</label>
                <textarea id="missionsTerminerRemarque" rows="3" placeholder="Ex : Mission terminée, tout s'est bien passé." style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;width:100%;font-family:inherit;"></textarea>
              </div>

              <div class="form-group" style="padding:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;">
                <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin:0;">
                  <input type="checkbox" id="missionsTerminerCertif" style="width:auto;margin-top:3px;">
                  <span style="font-size:.88rem;">
                    <strong>✅ Je certifie avoir effectué la mission</strong><br>
                    <small style="color:var(--text-light);">La mission passera en "À valider" pour le bureau.</small>
                  </span>
                </label>
              </div>

              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn" style="flex:1;background:#eab308;">✅ Envoyer pour validation</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.fermerTerminerModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale VALIDER (bureau) -->
      <div class="modal" id="missionsValiderModal">
        <div class="modal-content" style="max-width:560px;">
          <div class="modal-header" style="background:#16a34a;">
            <h2>✔️ Valider la mission</h2>
            <button class="close-btn" onclick="Missions.fermerValiderModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerValider(event)">
              <input type="hidden" id="missionsValiderId">

              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#166534;text-transform:uppercase;font-weight:700;">Mission</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;margin-bottom:10px;" id="missionsValiderTitre">—</div>
                <div id="missionsValiderRecap" style="font-size:.85rem;"></div>
              </div>

              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-weight:800;color:#1e40af;margin-bottom:10px;">🚗 Choix du kilométrage</div>

                <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.85rem;">
                  <span>📏 Km calculé auto</span>
                  <strong><input type="text" id="missionsValiderKmAuto" readonly style="border:none;background:transparent;text-align:right;font-weight:800;color:#1e40af;width:80px;"></strong>
                </div>
                <div id="missionsValiderEcart"></div>

                <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #bfdbfe;">
                  <label style="display:flex;align-items:center;gap:10px;padding:8px;background:#fff;border-radius:8px;cursor:pointer;margin-bottom:6px;">
                    <input type="radio" name="missionsValiderChoixKm" id="missionsValiderRadioDeclare" onchange="Missions._updateMontantValider()" style="width:auto;">
                    <span style="font-size:.85rem;">📏 Utiliser le <strong>km déclaré</strong> par le bénévole</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:10px;padding:8px;background:#fff;border-radius:8px;cursor:pointer;margin-bottom:6px;">
                    <input type="radio" name="missionsValiderChoixKm" id="missionsValiderRadioAuto" checked onchange="Missions._updateMontantValider()" style="width:auto;">
                    <span style="font-size:.85rem;">🚗 Utiliser le <strong>calcul auto</strong></span>
                  </label>
                  <label style="display:flex;align-items:center;gap:10px;padding:8px;background:#fff;border-radius:8px;cursor:pointer;margin-bottom:6px;">
                    <input type="radio" name="missionsValiderChoixKm" id="missionsValiderRadioManuel" onchange="Missions._toggleKmManuel()" style="width:auto;">
                    <span style="font-size:.85rem;">✏️ Saisir un km manuel</span>
                  </label>
                  <input type="number" step="0.1" min="0" id="missionsValiderKmManuel" oninput="Missions._updateMontantValider()" disabled placeholder="Ex : 38" style="margin-top:6px;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;width:100%;">
                </div>

                <div id="missionsValiderCalcStatut" style="margin-top:8px;"></div>

                <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #bfdbfe;font-size:1.05rem;display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-weight:700;color:#1e40af;">💰 Montant</span>
                  <strong id="missionsValiderMontant" style="color:#16a34a;font-size:1.3rem;">0,00 €</strong>
                </div>
              </div>

              <div class="form-group" style="padding:12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;">
                <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin:0;">
                  <input type="checkbox" id="missionsValiderCreerRemb" checked style="width:auto;margin-top:3px;">
                  <span style="font-size:.88rem;">
                    <strong>💶 Créer le remboursement</strong><br>
                    <small style="color:var(--text-light);">Un déplacement sera créé dans le module Frais et une écriture compta (dépense) sera ajoutée.</small>
                  </span>
                </label>
              </div>

              <div style="display:flex;gap:10px;margin-top:16px;">
                <button type="submit" class="btn" style="flex:1;background:#16a34a;">✔️ Valider et clôturer</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.fermerValiderModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale FAIT -->
      <div class="modal" id="missionsFaitModal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h2>✅ Marquer comme terminée</h2>
            <button class="close-btn" onclick="Missions.closeFaitModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerFait(event)">
              <input type="hidden" id="missionsFaitId">
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#166534;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="missionsFaitTitre">—</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Date *</label><input type="date" id="missionsFaitDate" required></div>
                <div class="form-group"><label>Heure</label><input type="time" id="missionsFaitHeure"></div>
              </div>
              <div class="form-group"><label>Note</label><textarea id="missionsFaitNote" rows="3"></textarea></div>
              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn btn-success" style="flex:1;">✅ Marquer terminée</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.closeFaitModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale REPORTER -->
      <div class="modal" id="missionsReportModal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h2>📅 Reporter</h2>
            <button class="close-btn" onclick="Missions.closeReporterModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerReporter(event)">
              <input type="hidden" id="missionsReportId">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#1e40af;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="missionsReportTitre">—</div>
                <div style="font-size:.82rem;color:#64748b;margin-top:4px;">
                  Date actuelle : <strong id="missionsReportDateActuelle">—</strong>
                </div>
              </div>
              <div class="form-group"><label>Nouvelle date *</label><input type="date" id="missionsReportDate" required></div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px;">
                <button type="button" class="btn btn-ghost" style="font-size:.78rem;padding:8px;" onclick="Missions.reporterRapide(1)">Demain</button>
                <button type="button" class="btn btn-ghost" style="font-size:.78rem;padding:8px;" onclick="Missions.reporterRapide(3)">+3 j</button>
                <button type="button" class="btn btn-ghost" style="font-size:.78rem;padding:8px;" onclick="Missions.reporterRapide(7)">+1 sem</button>
              </div>
              <div class="form-group"><label>Raison</label><textarea id="missionsReportRaison" rows="2"></textarea></div>
              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn" style="flex:1;background:var(--accent);">📅 Reporter</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.closeReporterModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale RELANCER -->
      <div class="modal" id="missionsRelanceModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>🔔 Relancer</h2>
            <button class="close-btn" onclick="Missions.closeRelancerModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerRelancer(event)">
              <input type="hidden" id="missionsRelanceId">
              <div style="background:#faf5ff;border:1px solid #c4b5fd;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#7c3aed;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="missionsRelanceTitre">—</div>
              </div>
              <div class="form-group"><label>Quoi ? *</label><input type="text" id="missionsRelanceQuoi" required></div>
              <div class="form-group">
                <label>Quand ?</label>
                <label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-alt);border-radius:8px;cursor:pointer;margin-bottom:6px;">
                  <input type="radio" name="missionsRelanceQuand" id="missionsRelanceImmediat" checked onchange="Missions._toggleRelanceDate()" style="width:auto;">
                  <span>Dès que possible</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-alt);border-radius:8px;cursor:pointer;margin-bottom:6px;">
                  <input type="radio" name="missionsRelanceQuand" id="missionsRelanceDateRadio" onchange="Missions._toggleRelanceDate()" style="width:auto;">
                  <span>Le</span>
                  <input type="date" id="missionsRelanceDate" disabled style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;">
                </label>
              </div>
              <div class="form-group"><label>Note</label><textarea id="missionsRelanceNote" rows="2"></textarea></div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button type="submit" class="btn" style="flex:1;background:#8b5cf6;">🔔 Marquer</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.closeRelancerModal()">Annuler</button>
              </div>
              <button type="button" id="missionsRelanceSupprBtn" class="btn btn-danger" style="width:100%;margin-top:10px;display:none;" onclick="Missions.retirerRelance()">🗑️ Retirer la relance</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale ASSIGNER -->
      <div class="modal" id="missionsAssignerModal">
        <div class="modal-content" style="max-width:560px;">
          <div class="modal-header">
            <h2>👤 Assigner les bénévoles</h2>
            <button class="close-btn" onclick="Missions.closeAssignerModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Missions.confirmerAssigner(event)">
              <input type="hidden" id="missionsAssignId">
              <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#9a3412;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="missionsAssignTitre">—</div>
              </div>

              <div class="form-group">
                <label>🔍 Rechercher un bénévole</label>
                <input type="text" id="missionsAssignRecherche" placeholder="Tapez un nom..." oninput="Missions.filtrerAssignListe(this.value)" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;">
              </div>

              <div class="form-group">
                <label>🤝 Cochez les bénévoles mobilisés</label>
                <div id="missionsAssignListe" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:6px;background:#f8fafc;"></div>
              </div>

              <div id="missionsAssignCompteur" style="padding:8px 12px;background:#fef3c7;border-radius:8px;font-size:.85rem;font-weight:700;color:#92400e;text-align:center;margin-bottom:14px;">
                0 bénévole sélectionné
              </div>

              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn" style="flex:1;background:#f97316;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" onclick="Missions.closeAssignerModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  },

  onShow(params) {
    if (params && params.tab) this.currentTab = params.tab;
    this.render();
  }
};

Router.register({
  view: 'missions',
  title: 'Missions',
  icon: '📋',
  section: 'Activité',
  order: 1,
  getViewHTML: () => Missions.getViewHTML(),
  getModalsHTML: () => Missions.getModalsHTML(),
  onShow: () => Missions.onShow()
});
