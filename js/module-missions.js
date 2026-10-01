// ============================================================
// MODULE : MISSIONS — Planning + Validation
// ============================================================

const Missions = {

  currentTab: 'aujourdhui',

  getAll() {
    return (typeof Interventions !== 'undefined') ? Interventions.getAll() : [];
  },

  // ---------- Helpers date ----------

  _ajouterJours(iso, n) {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  },

  _estPassee(i) {
    if (!i.datePrevue) return false;
    const now = new Date();
    const aujourdhui = Utils.todayISO();
    if (i.datePrevue < aujourdhui) return true;
    if (i.datePrevue > aujourdhui) return false;
    // Même jour : vérifier l'heure
    if (!i.heurePrevue) return false;
    const [h, m] = i.heurePrevue.split(':').map(Number);
    const heurePrevue = new Date();
    heurePrevue.setHours(h, m, 0, 0);
    return heurePrevue < now;
  },

  // ---------- Filtres ----------

  getJour() {
    const today = Utils.todayISO();
    return this.getAll()
      .filter(i => i.statut === 'planifiee' && i.datePrevue === today)
      .sort((a, b) => (a.heurePrevue || '00:00').localeCompare(b.heurePrevue || '00:00'));
  },

  getEnRetard() {
    const today = Utils.todayISO();
    return this.getAll()
      .filter(i => i.statut === 'planifiee' && i.datePrevue && i.datePrevue < today)
      .sort((a, b) => (a.datePrevue || '').localeCompare(b.datePrevue || ''));
  },

  getSemaine() {
    const today = Utils.todayISO();
    const limite = this._ajouterJours(today, 6);
    return this.getAll()
      .filter(i => i.statut === 'planifiee' && i.datePrevue && i.datePrevue >= today && i.datePrevue <= limite)
      .sort((a, b) => {
        const da = (a.datePrevue || '') + ' ' + (a.heurePrevue || '00:00');
        const db = (b.datePrevue || '') + ' ' + (b.heurePrevue || '00:00');
        return da.localeCompare(db);
      });
  },

  getAValider() {
    return this.getAll()
      .filter(i => i.statut === 'planifiee' && this._estPassee(i))
      .sort((a, b) => {
        const da = (a.datePrevue || '') + ' ' + (a.heurePrevue || '00:00');
        const db = (b.datePrevue || '') + ' ' + (b.heurePrevue || '00:00');
        return da.localeCompare(db);
      });
  },

  getHistorique() {
    const limite = this._ajouterJours(Utils.todayISO(), -30);
    return this.getAll()
      .filter(i => i.statut === 'terminee' && i.datePrevue && i.datePrevue >= limite)
      .sort((a, b) => {
        const da = (a.datePrevue || '') + ' ' + (a.heurePrevue || '00:00');
        const db = (b.datePrevue || '') + ' ' + (b.heurePrevue || '00:00');
        return db.localeCompare(da); // Récent en haut
      });
  },

  _compterParTab() {
    return {
      aujourdhui: this.getJour().length + this.getEnRetard().length,
      semaine: this.getSemaine().length,
      a_valider: this.getAValider().length,
      historique: this.getHistorique().length
    };
  },

  setTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  // ---------- Rendu ----------

  render() {
    const container = document.getElementById('missionsContainer');
    if (!container) return;

    const compteurs = this._compterParTab();

    const tabs = [
      { val: 'aujourdhui', label: '📅 Aujourd\'hui', count: compteurs.aujourdhui },
      { val: 'semaine',    label: '📋 À venir',      count: compteurs.semaine },
      { val: 'a_valider',  label: '⏳ À valider',    count: compteurs.a_valider },
      { val: 'historique', label: '📚 Historique',   count: compteurs.historique }
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

    let list = [];
    if (this.currentTab === 'aujourdhui') list = [...this.getEnRetard(), ...this.getJour()];
    else if (this.currentTab === 'semaine') list = this.getSemaine();
    else if (this.currentTab === 'a_valider') list = this.getAValider();
    else if (this.currentTab === 'historique') list = this.getHistorique();

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

    const estPassee = this._estPassee(i);
    const estAValider = i.statut === 'planifiee' && estPassee;

    let extra = '';
    if (i.statut === 'terminee' && !this._aFrais(i)) {
      extra += `<div style="margin-top:6px;padding:6px 10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;font-size:.78rem;color:#ea580c;font-weight:700;">⚠️ Frais à créer</div>`;
    }
    if (i.remarqueBenevole) {
      extra += `<div style="font-size:.75rem;color:var(--text-light);margin-top:4px;font-style:italic;">📝 "${Utils.escapeHtml(i.remarqueBenevole.substring(0, 60))}${i.remarqueBenevole.length > 60 ? '…' : ''}"</div>`;
    }
    if (i.valideeLe) {
      extra += `<div style="font-size:.75rem;color:var(--success);margin-top:4px;font-weight:700;">✔️ Validée le : ${new Date(i.valideeLe).toLocaleDateString('fr-FR')}</div>`;
    }

    // Boutons selon le statut/contexte
    let boutons = '';
    if (i.statut === 'planifiee' && estAValider) {
      boutons = `
        <button class="btn" style="padding:8px 14px;font-size:.82rem;background:#16a34a;flex:1;" onclick="Missions.openValiderModal(${i.id})">✔️ Valider</button>
      `;
    } else if (i.statut === 'planifiee') {
      boutons = `
        <button class="btn btn-success" style="padding:8px 14px;font-size:.82rem;flex:1;" onclick="Missions.openFaitModal(${i.id})">✅ Fait</button>
        <button class="btn" style="padding:8px 14px;font-size:.82rem;background:var(--accent);" onclick="Missions.openReporterModal(${i.id})">📅 Reporter</button>
      `;
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
            ${boutons}
            <button class="btn" style="padding:8px 12px;font-size:.82rem;background:#f97316;" onclick="event.stopPropagation();Missions.openAssignerModal(${i.id})">👤 Assigner</button>
            <button class="btn" style="padding:8px 12px;font-size:.82rem;background:#0ea5e9;" onclick="event.stopPropagation();Missions.ouvrirCalculFrais(${i.id})" title="Calculer les frais">🚗</button>
            <button class="btn btn-ghost" style="padding:8px 12px;font-size:.82rem;" onclick="Missions.ouvrirDetail(${i.id})">👁️ Fiche</button>
          </div>
        </div>
      </div>
    `;
  },

  _aFrais(i) {
    if (i.sansFrais) return true;
    if (typeof Interventions !== 'undefined' && Interventions.getFraisForIntervention) {
      return !!Interventions.getFraisForIntervention(i.numero);
    }
    return false;
  },

  // ---------- Actions ----------

  nouvelleIntervention() {
    BricoBol.ensureModuleMounted('interventions');
    if (typeof Interventions !== 'undefined') Interventions.openForm();
  },

  ouvrirDetail(id) {
    BricoBol.ensureModuleMounted('interventions');
    if (typeof Interventions !== 'undefined') setTimeout(() => Interventions.openDetail(id), 250);
  },

  ouvrirCalculFrais(idOptionnel) {
    if (typeof Tournee === 'undefined') { alert('Module Tournée indisponible.'); return; }
    if (!document.getElementById('tourneeFraisModal') && Tournee.getModalsHTML) {
      const html = Tournee.getModalsHTML();
      if (html) document.getElementById('modalsContainer').insertAdjacentHTML('beforeend', html);
    }
    Tournee.ouvrirCalculFrais(idOptionnel);
  },

  // ---------- Modale FAIT (marquer terminée) ----------

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

  // ---------- Modale REPORTER ----------

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
    list[idx].statut = 'planifiee';

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

  // ---------- Modale VALIDER (bureau) ----------

  async openValiderModal(id) {
    const i = this.getAll().find(x => String(x.id) === String(id));
    if (!i) return;

    document.getElementById('missionsValiderId').value = id;
    document.getElementById('missionsValiderTitre').textContent = `${i.numero} · ${i.demandeur || '—'}`;

    let recapHtml = `
      <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Bénévole</span><strong>${Utils.escapeHtml(i.benevole || '—')}</strong></div>
      ${i.benevole2 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Bénévole 2</span><strong>${Utils.escapeHtml(i.benevole2)}</strong></div>` : ''}
      ${i.datePrevue ? `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Date prévue</span><strong>${Utils.formatDate(i.datePrevue)}${i.heurePrevue ? ' · ' + i.heurePrevue : ''}</strong></div>` : ''}
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
      const det = await Frais.routeDetail([coordsDep, coordsArr, coordsDep]);
      const kmAuto = Math.round(det.kmApplique);
      const kmBrut = Math.round(det.kmBrut);
      const coef = det.coef;
      const dureeMin = det.dureeMin;
      if (kmAuto <= 0) { setStatut('❌ Trajet non calculable', '#dc2626'); return; }

      document.getElementById('missionsValiderKmAuto').value = kmAuto;

      const detailEl = document.getElementById('missionsValiderKmDetail');
      if (detailEl) {
        detailEl.innerHTML = `📐 Calcul brut : <strong>${kmBrut} km</strong> · appliqué ×${coef} = <strong>${kmAuto} km</strong>${dureeMin ? ' · ⏱️ ≈ ' + dureeMin + ' min' : ''}`;
      }

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

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return;

    list[idx].statut = 'terminee';
    list[idx].valideeLe = new Date().toISOString();
    list[idx].kmValides = kmChoisi;
    if (!list[idx].dateRealisee) list[idx].dateRealisee = Utils.todayISO();

    Interventions.saveAll(list);

    if (typeof Tournee !== 'undefined' && Tournee.render) Tournee.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    this.render();
    BricoBol.updateStorageInfo();

    this.fermerValiderModal();

    const depsExistants = (typeof Frais !== 'undefined' && Frais.getAll)
      ? Frais.getAll().filter(d => (d.interventions || []).some(it => it.numero === i.numero))
      : [];

    let msg = `✅ Mission validée.\n\n📏 Km validés : ${kmChoisi} km`;
    if (depsExistants.length > 0) {
      msg += `\n\n🚗 Déplacement(s) déjà créé(s) : ${depsExistants.map(d => d.numero).join(', ')}`;
    } else if (kmChoisi > 0) {
      msg += '\n\n💡 Pensez à créer les frais avec le bouton 🚗.';
    }
    alert(msg);
  },

  // ---------- Modale ASSIGNER ----------

  openAssignerModal(id) {
    const i = this.getAll().find(x => String(x.id) === String(id));
    if (!i) return;
    document.getElementById('missionsAssignId').value = id;
    document.getElementById('missionsAssignTitre').textContent = `${i.numero} · ${i.demandeur}`;

    const rech = document.getElementById('missionsAssignRecherche');
    if (rech) rech.value = '';

    const benevoles = Storage.getAdherents()
      .filter(a => a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole))
      .map(a => `${a.prenom} ${a.nom}`)
      .sort();

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

    const checks = Array.from(document.querySelectorAll('.missionsAssignCheck:checked'));
    const liste = checks.map(cb => cb.value);

    const list = this.getAll();
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    Storage.setBenevoles(list[idx], liste);

    Interventions.saveAll(list);
    this.closeAssignerModal();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  // ---------- Vues ----------

  getViewHTML() {
    return `
      <section class="view" id="view-missions">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div>
            <h1>Missions</h1>
            <p>Planning et validation</p>
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
                <div id="missionsValiderKmDetail" style="font-size:.75rem;color:#64748b;margin-top:6px;padding:6px 8px;background:#f8fafc;border-radius:6px;"></div>

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

              <div class="form-group" style="padding:12px;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;">
                <label style="display:flex;align-items:flex-start;gap:10px;margin:0;">
                  <span style="font-size:1.2rem;">💡</span>
                  <span style="font-size:.85rem;color:#1e40af;">
                    <strong>Les frais se créent via 🚗</strong><br>
                    <small>Utilisez le bouton 🚗 sur la carte pour créer les déplacements et remboursements.</small>
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
  onShow: (params) => Missions.onShow(params)
});