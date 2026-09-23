// ============================================================
// MODULE : TOURNÉE DU JOUR — Vue quotidienne des interventions
// ============================================================

const Tournee = {

  _ensureInterventionsMounted() {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['interventions']) {
      Router.mountIfNeeded('interventions', Router.registry['interventions']);
    }
  },

  openIntervention(id) {
    this._ensureInterventionsMounted();
    if (typeof Interventions !== 'undefined') Interventions.openDetail(id);
  },

  nouvelleIntervention() {
    this._ensureInterventionsMounted();
    if (typeof Interventions !== 'undefined') Interventions.openForm();
  },

  // ---------- État du calcul de frais ----------
  _fraisEtat: {
    benevole: '',
    interventions: [],  // array d'ids dans l'ordre
    transitions: []     // array de { type: 'direct'|'domicile'|'autre', adresse: '' }
  },

  // ---------- Récupération ----------

  getAll() {
    return (typeof Interventions !== 'undefined') ? Interventions.getAll() : [];
  },

  _statutsActifs() {
    return ['demande', 'planifiee', 'en_cours', 'relancer'];
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

  // ---------- Rendu Tournée ----------

  render() {
    const container = document.getElementById('tourneeContainer');
    if (!container) return;

    const jour = this.getJour();
    const enRetard = this.getEnRetard();
    const aRelancer = this.getARelancer();
    const total = jour.length;

    const idsAffiches = new Set([...enRetard.map(i => i.id), ...aRelancer.map(i => i.id)]);
    const jourFiltre = jour.filter(i => !idsAffiches.has(i.id));

    const nbBenevoles = this._compterBenevoles([...jour, ...enRetard, ...aRelancer]);

    const dateLongue = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const dateCapitalisee = dateLongue.charAt(0).toUpperCase() + dateLongue.slice(1);

    let html = `
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

    if (enRetard.length > 0) {
      html += this._renderSection('⚠️ En retard', enRetard, '#dc2626', '#fef2f2', '#fecaca');
    }

    if (aRelancer.length > 0) {
      html += this._renderSection('🔔 À relancer', aRelancer, '#8b5cf6', '#faf5ff', '#c4b5fd', true);
    }

    const groupes = this._grouperParMoment(jourFiltre);

    if (jourFiltre.length === 0 && enRetard.length === 0 && aRelancer.length === 0) {
      html += `
        <div class="card" style="text-align:center;padding:60px 24px;">
          <div style="font-size:3rem;margin-bottom:16px;">🎉</div>
          <h3 style="font-size:1.15rem;font-weight:800;margin-bottom:8px;">Aucune intervention prévue aujourd'hui</h3>
          <p style="color:var(--text-light);font-size:.9rem;max-width:400px;margin:0 auto 20px;">Profitez-en pour souffler, ou créez une intervention si besoin.</p>
          <button class="btn" onclick="Tournee.nouvelleIntervention()">➕ Nouvelle intervention</button>
        </div>
      `;
    } else {
      if (groupes.matin.length > 0) html += this._renderSection('🌅 Matin', groupes.matin, '#0ea5e9', '#f0f9ff', '#bfdbfe');
      if (groupes.aprem.length > 0) html += this._renderSection('🌞 Après-midi', groupes.aprem, '#f59e0b', '#fffbeb', '#fcd34d');
      if (groupes.soir.length > 0) html += this._renderSection('🌙 Soir', groupes.soir, '#8b5cf6', '#faf5ff', '#c4b5fd');
    }

    container.innerHTML = html;
  },

  _renderSection(titre, list, color, bg, border, afficherRelance) {
    return `
      <div class="card" style="padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:.95rem;font-weight:800;color:${color};margin:0;">${titre}</h3>
          <span style="background:${bg};color:${color};border:1px solid ${border};padding:2px 10px;border-radius:12px;font-size:.72rem;font-weight:700;">${list.length}</span>
        </div>
        ${list.map(i => this._renderLigne(i, color, afficherRelance)).join('')}
      </div>
    `;
  },

  _renderLigne(i, color, afficherRelance) {
    const heure = i.heurePrevue ? `⏰ ${Utils.escapeHtml(i.heurePrevue)}` : '⏰ (heure libre)';
    const dateAffichee = i.datePrevue !== Utils.todayISO() ? `📅 ${Utils.formatDate(i.datePrevue)} · ` : '';
    const statutInfo = (Interventions.STATUTS[i.statut] || { label: i.statut, badge: 'badge-neutral' });
    const benev = i.benevole ? `🤝 ${Utils.escapeHtml(i.benevole)}` : '<em style="color:var(--text-light);">Pas de bénévole</em>';
    const benev2 = i.benevole2 ? ` · 🤝 ${Utils.escapeHtml(i.benevole2)}` : '';
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
          <button class="btn btn-success" style="padding:6px 12px;font-size:.78rem;flex:1;" onclick="Tournee.openFaitModal(${i.id})">✅ Fait</button>
          <button class="btn" style="padding:6px 12px;font-size:.78rem;background:var(--accent);flex:1;" onclick="Tournee.openReporterModal(${i.id})">📅 Reporter</button>
          <button class="btn" style="padding:6px 12px;font-size:.78rem;background:#8b5cf6;flex:1;" onclick="Tournee.openRelancerModal(${i.id})">🔔 Relancer</button>
          <button class="btn" style="padding:6px 12px;font-size:.78rem;background:#f97316;flex:1;" onclick="Tournee.openAssignerModal(${i.id})">👤 Assigner</button>
          <button class="btn" style="padding:6px 10px;font-size:.78rem;background:#0ea5e9;" onclick="Tournee.ouvrirCalculFrais(${i.id})" title="Calculer les frais">🚗</button>
          <button class="btn btn-ghost" style="padding:6px 10px;font-size:.85rem;" onclick="Tournee.openIntervention(${i.id})" title="Voir la fiche">👁️</button>
        </div>
      </div>
    `;
  },

  // ============================================================
  // 🚗 CALCUL DES FRAIS D'UNE TOURNÉE
  // ============================================================

  ouvrirCalculFrais(idOptionnel) {
    const jour = this.getJour();
    if (jour.length === 0) {
      alert('Aucune intervention prévue aujourd\'hui.');
      return;
    }

    // Reset état
    this._fraisEtat = { benevole: '', interventions: [], transitions: [] };

    // Si ouvert depuis une ligne, pré-remplir
    if (idOptionnel) {
      const inter = jour.find(x => x.id === idOptionnel);
      if (inter) {
        this._fraisEtat.benevole = inter.benevole || '';
        this._fraisEtat.interventions = [inter.id];
      }
    }

    this._rendreModaleCalcul();
    document.getElementById('tourneeFraisModal').classList.add('active');
  },

  fermerCalculFrais() {
    document.getElementById('tourneeFraisModal').classList.remove('active');
  },

  _rendreModaleCalcul() {
    const body = document.getElementById('tourneeFraisBody');
    if (!body) return;

    const jour = this.getJour();
    const etat = this._fraisEtat;

    // Bénévoles disponibles (Bénévole + Aussi bénévole)
    const benevoles = Storage.getAdherents()
      .filter(a => a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole))
      .map(a => `${a.prenom} ${a.nom}`)
      .sort();

    // HTML sélection bénévole
    let html = `
      <div class="form-group">
        <label>👤 Bénévole *</label>
        <select onchange="Tournee._changerBenevole(this.value)" style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;width:100%;">
          <option value="">— Choisir un bénévole —</option>
          ${benevoles.map(b => `<option value="${Utils.escapeHtml(b)}" ${etat.benevole === b ? 'selected' : ''}>${Utils.escapeHtml(b)}</option>`).join('')}
        </select>
      </div>
    `;

    // Si pas de bénévole sélectionné, on s'arrête là
    if (!etat.benevole) {
      html += `<p style="color:var(--text-light);text-align:center;padding:20px;font-size:.88rem;">
        Sélectionnez un bénévole pour voir ses interventions du jour.
      </p>`;
      body.innerHTML = html;
      return;
    }

    // Interventions du jour + celles déjà dans le déplacement en cours
    html += `
      <div class="form-group">
        <label>📅 Interventions à inclure dans la tournée</label>
        <div style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--bg-alt);">
          ${jour.map(i => {
            const checked = etat.interventions.includes(i.id);
            const autreBenev = i.benevole && i.benevole !== etat.benevole;
            const sansBenev = !i.benevole;
            let hint = '';
            if (autreBenev) hint = `<span style="color:#dc2626;font-size:.72rem;"> · assignée à ${Utils.escapeHtml(i.benevole)}</span>`;
            if (sansBenev) hint = `<span style="color:#f59e0b;font-size:.72rem;"> · pas de bénévole</span>`;
            return `
              <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#fff;border:1px solid ${checked ? 'var(--accent)' : 'var(--border)'};border-radius:6px;margin-bottom:6px;cursor:pointer;">
                <input type="checkbox" ${checked ? 'checked' : ''} onchange="Tournee._toggleIntervention(${i.id}, this.checked)" style="width:auto;">
                <span style="flex:1;font-size:.85rem;">
                  <strong>${Utils.escapeHtml(i.numero)}</strong>
                  ${i.heurePrevue ? `· ${Utils.escapeHtml(i.heurePrevue)}` : ''}
                  · ${Utils.escapeHtml(i.demandeur)}
                  ${hint}
                </span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Si interventions cochées, afficher les transitions
    if (etat.interventions.length > 0) {
      html += `<div class="form-group">
        <label>🚗 Enchaînement du trajet</label>
        <div style="padding:12px;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;font-size:.85rem;">
      `;

      // Départ
      html += this._renderEtapeDomicile('Départ', etat.benevole);

      etat.interventions.forEach((intId, idx) => {
        const inter = Interventions.getAll().find(x => x.id === intId);
        if (!inter) return;

        // Transition AVANT cette intervention (sauf pour la 1ère)
        if (idx > 0) {
          const transIdx = idx - 1;
          const trans = etat.transitions[transIdx] || { type: 'direct', adresse: '' };
          html += this._renderTransition(transIdx, trans, etat.benevole);
        }

        // L'intervention
        html += `
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#fff;border-left:3px solid var(--accent);border-radius:6px;margin:6px 0;">
            <span style="font-size:1.1rem;">🛠️</span>
            <div style="flex:1;min-width:0;font-size:.85rem;">
              <strong>${Utils.escapeHtml(inter.numero)}</strong>
              ${inter.heurePrevue ? `· ${Utils.escapeHtml(inter.heurePrevue)}` : ''}
              · ${Utils.escapeHtml(inter.demandeur)}
            </div>
          </div>
        `;
      });

      // Arrivée
      html += this._renderEtapeDomicile('Arrivée', etat.benevole);

      html += `</div></div>`;
    }

    // Boutons
    html += `
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button type="button" class="btn" id="tourneeFraisCalcBtn" style="flex:1;background:var(--accent);" onclick="Tournee.lancerCalculFrais()">
          🚗 Calculer et créer le déplacement
        </button>
        <button type="button" class="btn btn-ghost" onclick="Tournee.fermerCalculFrais()">Annuler</button>
      </div>
      <div id="tourneeFraisStatut" style="margin-top:10px;"></div>
    `;

    body.innerHTML = html;
  },

  _renderEtapeDomicile(libelle, benevole) {
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#fef3c7;border-radius:6px;margin:6px 0;font-size:.82rem;">
        <span style="font-size:1.1rem;">🏠</span>
        <strong>${libelle}</strong> · domicile de ${Utils.escapeHtml(benevole)}
      </div>
    `;
  },

  _renderTransition(idx, trans, benevole) {
    const selectOptions = `
      <option value="direct" ${trans.type === 'direct' ? 'selected' : ''}>⏩ Directement à la suivante</option>
      <option value="domicile" ${trans.type === 'domicile' ? 'selected' : ''}>🏠 Retour au domicile</option>
      <option value="autre" ${trans.type === 'autre' ? 'selected' : ''}>📍 Autre lieu (saisir)</option>
    `;
    return `
      <div style="padding:8px;background:#fffbeb;border:1px dashed #fcd34d;border-radius:6px;margin:6px 0;">
        <div style="font-size:.75rem;color:#92400e;font-weight:700;margin-bottom:4px;">↕️ Entre les deux interventions :</div>
        <select onchange="Tournee._changerTransition(${idx}, this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.82rem;width:100%;">
          ${selectOptions}
        </select>
        ${trans.type === 'autre' ? `
          <input type="text" placeholder="Adresse du lieu d'attente..." value="${Utils.escapeHtml(trans.adresse || '')}" onchange="Tournee._changerTransitionAdresse(${idx}, this.value)" style="margin-top:6px;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:.82rem;width:100%;">
        ` : ''}
      </div>
    `;
  },

  _changerBenevole(nom) {
    this._fraisEtat.benevole = nom;
    // Reset interventions et transitions (car le bénévole change)
    this._fraisEtat.interventions = [];
    this._fraisEtat.transitions = [];
    this._rendreModaleCalcul();
  },

  _toggleIntervention(id, checked) {
    const etat = this._fraisEtat;
    if (checked) {
      if (!etat.interventions.includes(id)) {
        etat.interventions.push(id);
        // Trier par heure
        etat.interventions.sort((a, b) => {
          const ia = Interventions.getAll().find(x => x.id === a);
          const ib = Interventions.getAll().find(x => x.id === b);
          const ha = (ia && ia.heurePrevue) || '99:99';
          const hb = (ib && ib.heurePrevue) || '99:99';
          return ha.localeCompare(hb);
        });
      }
    } else {
      etat.interventions = etat.interventions.filter(x => x !== id);
    }
    // Recaler les transitions (taille = interventions - 1)
    const cible = Math.max(0, etat.interventions.length - 1);
    while (etat.transitions.length < cible) {
      etat.transitions.push({ type: 'direct', adresse: '' });
    }
    while (etat.transitions.length > cible) {
      etat.transitions.pop();
    }
    this._rendreModaleCalcul();
  },

  _changerTransition(idx, type) {
    if (!this._fraisEtat.transitions[idx]) {
      this._fraisEtat.transitions[idx] = { type: 'direct', adresse: '' };
    }
    this._fraisEtat.transitions[idx].type = type;
    this._rendreModaleCalcul();
  },

  _changerTransitionAdresse(idx, adresse) {
    if (!this._fraisEtat.transitions[idx]) return;
    this._fraisEtat.transitions[idx].adresse = adresse;
  },

  _chercherDeplacementsExistants(interventionIds) {
    const numeros = interventionIds.map(id => {
      const i = Interventions.getAll().find(x => x.id === id);
      return i ? i.numero : null;
    }).filter(Boolean);

    const deps = Storage.getDeplacements();
    return deps.filter(d => 
      Array.isArray(d.interventions) && 
      d.interventions.some(it => {
        const num = (typeof it === 'string') ? it : it.numero;
        return numeros.includes(num);
      })
    );
  },

  async lancerCalculFrais() {
    const etat = this._fraisEtat;
    const statut = document.getElementById('tourneeFraisStatut');
    const btn = document.getElementById('tourneeFraisCalcBtn');

    if (!etat.benevole) { alert('Choisissez un bénévole.'); return; }
    if (etat.interventions.length === 0) { alert('Cochez au moins une intervention.'); return; }

    // 1) Vérifier anti-doublon
    const depsExistants = this._chercherDeplacementsExistants(etat.interventions);
    if (depsExistants.length > 0) {
      const nums = depsExistants.map(d => d.numero).join(', ');
      if (!confirm(`⚠️ ${depsExistants.length} déplacement(s) existant(s) (${nums}) contiennent certaines de ces interventions.\n\nIls seront SUPPRIMÉS et remplacés par le nouveau calcul.\n\nContinuer ?`)) return;
    }

    // 2) Vérifier les interventions sans bénévole ou assignées à un autre
    const soucis = [];
    etat.interventions.forEach(id => {
      const i = Interventions.getAll().find(x => x.id === id);
      if (!i) return;
      if (!i.benevole) soucis.push(`${i.numero} n'a pas de bénévole (sera assigné à ${etat.benevole})`);
      else if (i.benevole !== etat.benevole) soucis.push(`${i.numero} est assignée à ${i.benevole} (sera réassignée à ${etat.benevole})`);
    });
    if (soucis.length > 0) {
      if (!confirm(`⚠️ Attention :\n\n${soucis.join('\n')}\n\nContinuer ?`)) return;
    }

    // 3) Récupérer bénévole
    const benevole = this._trouverBenevole(etat.benevole);
    if (!benevole) { alert('Bénévole introuvable dans l\'annuaire.'); return; }

    const adresseDepart = benevole.adresseDepart || 
      [benevole.adresse, benevole.cp, benevole.ville, benevole.pays].filter(Boolean).join(', ');
    if (!adresseDepart) { alert('Le bénévole n\'a pas d\'adresse renseignée.'); return; }

    // 4) Lancer le calcul
    btn.disabled = true;
    btn.textContent = '⏳ Calcul en cours...';
    if (statut) statut.innerHTML = '';

    const setStatut = (msg, color = 'var(--accent)') => {
      if (statut) statut.innerHTML = `<div style="text-align:center;color:${color};font-size:.85rem;padding:6px;">${msg}</div>`;
    };

    try {
      // a) Géocoder domicile
      setStatut('⏳ Géocodage du domicile...');
      const coordsDom = await Frais.geocode(adresseDepart);
      if (!coordsDom) throw new Error('Impossible de géocoder le domicile : ' + adresseDepart);

      // b) Géocoder chaque intervention (adresse de l'adhérent ou "Adresse :" dans description)
      const arretsInterv = [];  // coords alignées avec etat.interventions
      const problemes = [];

      for (let k = 0; k < etat.interventions.length; k++) {
        const inter = Interventions.getAll().find(x => x.id === etat.interventions[k]);
        if (!inter) { arretsInterv.push(null); problemes.push(`Intervention ${k + 1} introuvable`); continue; }

        setStatut(`⏳ Géocodage ${k + 1}/${etat.interventions.length} : ${inter.numero}...`);

        let adresseArr = null;
        let adh = null;
        if (inter.adherentId) adh = Storage.getAdherents().find(a => a.id === inter.adherentId);
        if (!adh && inter.demandeur) adh = this._trouverBenevole(inter.demandeur);
        if (adh) adresseArr = [adh.adresse, adh.cp, adh.ville].filter(Boolean).join(', ');
        if (!adresseArr && inter.description) {
          const m = inter.description.match(/Adresse\s*:\s*([^\n]+)/i);
          if (m && m[1]) adresseArr = m[1].trim();
        }

        if (!adresseArr) {
          arretsInterv.push(null);
          problemes.push(`${inter.numero} : adresse introuvable pour "${inter.demandeur}"`);
          continue;
        }

        await new Promise(r => setTimeout(r, 300));
        const coords = await Frais.geocode(adresseArr);
        arretsInterv.push(coords);
        if (!coords) problemes.push(`${inter.numero} : géocodage échoué (${adresseArr})`);
      }

      // c) Géocoder les transitions "autre"
      const coordsTransitions = [];  // [idx] = { type, coordsLieu }
      for (let k = 0; k < etat.transitions.length; k++) {
        const t = etat.transitions[k];
        if (t.type === 'autre' && t.adresse) {
          setStatut(`⏳ Géocodage lieu intermédiaire ${k + 1}...`);
          await new Promise(r => setTimeout(r, 300));
          const coords = await Frais.geocode(t.adresse);
          coordsTransitions.push({ type: 'autre', coords });
          if (!coords) problemes.push(`Lieu intermédiaire ${k + 1} : géocodage échoué (${t.adresse})`);
        } else {
          coordsTransitions.push({ type: t.type, coords: null });
        }
      }

      // d) Construire la séquence de points
      // Points = [domicile, inter1, transition1?, inter2, transition2?, inter3, ..., domicile]
      const points = [coordsDom];
      for (let k = 0; k < etat.interventions.length; k++) {
        if (arretsInterv[k]) points.push(arretsInterv[k]);
        if (k < etat.transitions.length) {
          const t = coordsTransitions[k];
          if (t && t.type === 'autre' && t.coords) points.push(t.coords);
          else if (t && t.type === 'domicile') points.push(coordsDom);
          // Si 'direct' → rien entre les deux
        }
      }
      points.push(coordsDom);

      // e) Calculer la distance totale
      setStatut('🚗 Calcul de l\'itinéraire complet...');
      await new Promise(r => setTimeout(r, 200));
      const kmTotal = Math.round(await Frais.route(points));
      if (kmTotal <= 0) throw new Error('Trajet non calculable (km = 0)');

      const bareme = Frais.getBareme();
      const montant = kmTotal * bareme;

      // f) Calculer le prorata (comme dans Frais)
      // Pour chaque intervention : km individuel = domicile → interv → domicile
      const kmIndividuels = [];
      const problemesIndiv = [];
      for (let k = 0; k < etat.interventions.length; k++) {
        if (!arretsInterv[k]) { kmIndividuels.push(0); continue; }
        setStatut(`🚗 Trajet individuel ${k + 1}/${etat.interventions.length}...`);
        await new Promise(r => setTimeout(r, 200));
        const kmInd = Math.round(await Frais.route([coordsDom, arretsInterv[k], coordsDom]));
        kmIndividuels.push(kmInd || 0);
        if (!kmInd) problemesIndiv.push(`${etat.interventions[k]}`);
      }
      const totalKmInd = kmIndividuels.reduce((s, k) => s + k, 0);
      const parts = kmIndividuels.map(km => totalKmInd > 0 ? (km / totalKmInd) * montant : montant / etat.interventions.length);

      // g) Construire le tableau interventions du déplacement (format Frais)
      const interventionsArr = etat.interventions.map((intId, k) => {
        const i = Interventions.getAll().find(x => x.id === intId);
        return {
          numero: i ? i.numero : 'INT-???',
          nom: i ? i.demandeur : '',
          type: i ? i.type : '',
          kmIndividuel: kmIndividuels[k],
          part: parts[k]
        };
      });

      // h) Nettoyer les anciens déplacements (déjà validé par confirm)
      const depsList = Storage.getDeplacements();
      const depsAvecIds = new Set(depsExistants.map(d => d.id));
      const depsFinal = depsList.filter(d => !depsAvecIds.has(d.id));

      // i) Nom du déplacement
      const nomAffichage = etat.interventions.length > 1
        ? `${etat.benevole} (${etat.interventions.length} interventions)`
        : etat.benevole;

      // j) Créer le nouveau déplacement
      const n = depsFinal.length + 1;
      const numero = 'DEP-' + String(n).padStart(3, '0');
      const trajet = 'Domicile → ' + etat.interventions.map((intId) => {
        const i = Interventions.getAll().find(x => x.id === intId);
        return i ? i.numero : '?';
      }).join(' → ') + ' → Domicile';

      const deplacement = {
        id: Date.now() + Math.random(),
        numero: numero,
        date: Utils.todayISO(),
        benevole: nomAffichage,
        km: kmTotal,
        trajet: trajet,
        motif: etat.interventions.length > 1 
          ? `Tournée groupée (${etat.interventions.length} interventions)` 
          : `Intervention ${interventionsArr[0].numero}`,
        notes: '',
        rembourse: false,
        montant: montant,
        bareme: bareme,
        interventions: interventionsArr
      };
      depsFinal.push(deplacement);
      Storage.saveDeplacements(depsFinal);

      // k) Mettre à jour les interventions (assignation bénévole)
      const interList = Interventions.getAll();
      let assignationsMaj = 0;
      etat.interventions.forEach(id => {
        const idx = interList.findIndex(x => x.id === id);
        if (idx !== -1 && interList[idx].benevole !== etat.benevole) {
          interList[idx].benevole = etat.benevole;
          assignationsMaj++;
        }
      });
      if (assignationsMaj > 0) Interventions.saveAll(interList);

      // l) Rafraîchir tous les modules concernés
      if (typeof Frais !== 'undefined' && Frais.render) Frais.render();
      if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
      this.render();
      if (typeof Agenda !== 'undefined' && Agenda.render) Agenda.render();
      BricoBol.updateStorageInfo();

      // m) Afficher le résultat
      const totalVirtuel = totalKmInd * bareme;
      const economie = totalVirtuel - montant;
      const pctEco = totalVirtuel > 0 ? ((economie / totalVirtuel) * 100).toFixed(0) : 0;
      const sommeParts = interventionsArr.reduce((s, r) => s + r.part, 0);

      let msg = `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;font-size:.88rem;margin-top:10px;">
          <div style="font-weight:800;color:#166534;margin-bottom:8px;">✅ Déplacement créé : ${numero}</div>

          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #86efac;">
            <span>${Utils.escapeHtml(nomAffichage)}</span>
            <strong>${kmTotal} km · ${montant.toFixed(2)} €</strong>
          </div>

          <div style="margin-top:10px;padding:10px;background:#fff;border-radius:8px;font-size:.82rem;">
            <div style="font-weight:700;margin-bottom:6px;color:#1e40af;">📊 Détail du prorata</div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <th style="text-align:left;padding:4px 2px;font-size:.72rem;color:#64748b;">Intervention</th>
                  <th style="text-align:right;padding:4px 2px;font-size:.72rem;color:#64748b;">Km seul</th>
                  <th style="text-align:right;padding:4px 2px;font-size:.72rem;color:#64748b;">Prix seul</th>
                  <th style="text-align:right;padding:4px 2px;font-size:.72rem;color:#64748b;">Part</th>
                </tr>
              </thead>
              <tbody>
                ${interventionsArr.map(r => `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:6px 2px;font-weight:600;font-size:.78rem;">${Utils.escapeHtml(r.numero)}${r.nom ? ' · ' + Utils.escapeHtml(r.nom) : ''}${r.type ? '<br><span style="font-weight:400;color:#64748b;">' + Utils.escapeHtml(r.type) + '</span>' : ''}</td>
                    <td style="text-align:right;padding:6px 2px;">${r.kmIndividuel} km</td>
                    <td style="text-align:right;padding:6px 2px;color:#64748b;">${(r.kmIndividuel * bareme).toFixed(2)} €</td>
                    <td style="text-align:right;padding:6px 2px;color:#2563eb;font-weight:700;">${r.part.toFixed(2)} €</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="border-top:2px solid #86efac;font-weight:800;">
                  <td style="padding:6px 2px;">TOTAL</td>
                  <td style="text-align:right;padding:6px 2px;">${totalKmInd} km</td>
                  <td style="text-align:right;padding:6px 2px;color:#64748b;">${totalVirtuel.toFixed(2)} €</td>
                  <td style="text-align:right;padding:6px 2px;color:#166534;">${sommeParts.toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="margin-top:10px;padding:10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;font-size:.82rem;">
            <div style="font-weight:700;margin-bottom:6px;color:#92400e;">💰 Bilan de la tournée</div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span>Coût réel (tournée groupée)</span>
              <strong>${montant.toFixed(2)} €</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span>Coût virtuel (si séparés)</span>
              <strong>${totalVirtuel.toFixed(2)} €</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #fcd34d;margin-top:6px;font-size:.92rem;">
              <span style="color:#166534;font-weight:800;">💰 Économie réalisée</span>
              <strong style="color:#166534;">${economie.toFixed(2)} € (${pctEco} %)</strong>
            </div>
          </div>

          <div style="margin-top:8px;text-align:center;font-size:.75rem;color:#64748b;">
            ✓ Vérification : somme des parts = ${sommeParts.toFixed(2)} €
          </div>

          ${problemes.length > 0 ? `
            <div style="margin-top:10px;padding:8px;background:#fef2f2;border-radius:6px;font-size:.78rem;color:#991b1b;">
              ⚠️ Problèmes :<br>${problemes.join('<br>')}
            </div>
          ` : ''}
        </div>
      `;
      if (statut) statut.innerHTML = msg;

      btn.textContent = '✅ Fermer';
      btn.disabled = false;
      btn.onclick = () => Tournee.fermerCalculFrais();
    } catch (e) {
      console.error(e);
      setStatut('❌ Erreur : ' + e.message, 'var(--danger)');
      btn.disabled = false;
      btn.textContent = '🚗 Réessayer';
    }
  },

  // ---------- Actions ✅📅🔔👤 ----------

  openFaitModal(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    document.getElementById('tourneeFaitId').value = id;
    document.getElementById('tourneeFaitTitre').textContent = `${i.numero} · ${i.demandeur}`;
    document.getElementById('tourneeFaitDate').value = Utils.todayISO();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('tourneeFaitHeure').value = `${hh}:${mm}`;
    document.getElementById('tourneeFaitNote').value = '';
    document.getElementById('tourneeFaitModal').classList.add('active');
  },

  closeFaitModal() { document.getElementById('tourneeFaitModal').classList.remove('active'); },

  confirmerFait(event) {
    event.preventDefault();
    const id = Number(document.getElementById('tourneeFaitId').value);
    const dateRealisee = document.getElementById('tourneeFaitDate').value;
    const heureRealisee = document.getElementById('tourneeFaitHeure').value;
    const note = document.getElementById('tourneeFaitNote').value.trim();

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
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
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    document.getElementById('tourneeReportId').value = id;
    document.getElementById('tourneeReportTitre').textContent = `${i.numero} · ${i.demandeur}`;
    document.getElementById('tourneeReportDateActuelle').textContent = i.datePrevue ? Utils.formatDate(i.datePrevue) : '—';
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    document.getElementById('tourneeReportDate').value = demain.toISOString().split('T')[0];
    document.getElementById('tourneeReportRaison').value = '';
    document.getElementById('tourneeReportModal').classList.add('active');
  },

  closeReporterModal() { document.getElementById('tourneeReportModal').classList.remove('active'); },

  reporterRapide(nbJours) {
    const d = new Date();
    d.setDate(d.getDate() + nbJours);
    document.getElementById('tourneeReportDate').value = d.toISOString().split('T')[0];
  },

  confirmerReporter(event) {
    event.preventDefault();
    const id = Number(document.getElementById('tourneeReportId').value);
    const nouvelleDate = document.getElementById('tourneeReportDate').value;
    const raison = document.getElementById('tourneeReportRaison').value.trim();
    if (!nouvelleDate) { alert('Choisissez une date.'); return; }

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
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
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    document.getElementById('tourneeRelanceId').value = id;
    document.getElementById('tourneeRelanceTitre').textContent = `${i.numero} · ${i.demandeur}`;

    const dejaRelance = !!i.aRelancer;
    document.getElementById('tourneeRelanceQuoi').value = dejaRelance ? (i.aRelancer.quoi || '') : '';
    document.getElementById('tourneeRelanceNote').value = dejaRelance ? (i.aRelancer.note || '') : '';

    const radioImmediat = document.getElementById('tourneeRelanceImmediat');
    const radioDate = document.getElementById('tourneeRelanceDateRadio');
    const inputDate = document.getElementById('tourneeRelanceDate');

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

    const btnSuppr = document.getElementById('tourneeRelanceSupprBtn');
    if (btnSuppr) btnSuppr.style.display = dejaRelance ? 'block' : 'none';

    document.getElementById('tourneeRelanceModal').classList.add('active');
  },

  closeRelancerModal() { document.getElementById('tourneeRelanceModal').classList.remove('active'); },

  _toggleRelanceDate() {
    const radioDate = document.getElementById('tourneeRelanceDateRadio');
    const inputDate = document.getElementById('tourneeRelanceDate');
    if (inputDate) inputDate.disabled = !radioDate.checked;
  },

  confirmerRelancer(event) {
    event.preventDefault();
    const id = Number(document.getElementById('tourneeRelanceId').value);
    const quoi = document.getElementById('tourneeRelanceQuoi').value.trim();
    const note = document.getElementById('tourneeRelanceNote').value.trim();
    const radioDate = document.getElementById('tourneeRelanceDateRadio');
    const inputDate = document.getElementById('tourneeRelanceDate');

    if (!quoi) { alert('Indiquez ce qu\'il faut relancer.'); return; }

    let dateRelance = null;
    if (radioDate.checked) {
      dateRelance = inputDate.value;
      if (!dateRelance) { alert('Choisissez une date ou cochez "Dès que possible".'); return; }
    }

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
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
    const id = Number(document.getElementById('tourneeRelanceId').value);
    if (!id) return;
    if (!confirm('Retirer la relance ?')) return;

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
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
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    document.getElementById('tourneeAssignId').value = id;
    document.getElementById('tourneeAssignTitre').textContent = `${i.numero} · ${i.demandeur}`;

    const benevoles = Storage.getAdherents()
      .filter(a => a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole))
      .map(a => `${a.prenom} ${a.nom}`)
      .sort();

    const sel1 = document.getElementById('tourneeAssignBenevole1');
    const sel2 = document.getElementById('tourneeAssignBenevole2');

    sel1.innerHTML = '<option value="">— Aucun —</option>' + 
      benevoles.map(b => `<option value="${Utils.escapeHtml(b)}" ${i.benevole === b ? 'selected' : ''}>${Utils.escapeHtml(b)}</option>`).join('');

    sel2.innerHTML = '<option value="">— Aucun —</option>' + 
      benevoles.map(b => `<option value="${Utils.escapeHtml(b)}" ${i.benevole2 === b ? 'selected' : ''}>${Utils.escapeHtml(b)}</option>`).join('');

    document.getElementById('tourneeAssignerModal').classList.add('active');
  },

  closeAssignerModal() { document.getElementById('tourneeAssignerModal').classList.remove('active'); },

  confirmerAssigner(event) {
    event.preventDefault();
    const id = Number(document.getElementById('tourneeAssignId').value);
    const b1 = document.getElementById('tourneeAssignBenevole1').value.trim();
    const b2 = document.getElementById('tourneeAssignBenevole2').value.trim();

    if (b1 && b2 && b1 === b2) { alert('Le bénévole principal et secondaire sont identiques.'); return; }

    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) { alert('Intervention introuvable.'); return; }

    list[idx].benevole = b1 || '';
    list[idx].benevole2 = b2 || '';

    Interventions.saveAll(list);
    this.closeAssignerModal();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  // ---------- Vues HTML ----------

  getViewHTML() {
    return `
      <section class="view" id="view-tournee">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div>
            <h1>Aujourd'hui</h1>
            <p>Vue quotidienne des interventions</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Tournee.render()">🔄 Rafraîchir</button>
            <button class="btn" style="background:var(--accent);" onclick="Tournee.ouvrirCalculFrais()">🚗 Calculer les frais du jour</button>
            <button class="btn" onclick="Tournee.nouvelleIntervention()">➕ Nouvelle intervention</button>
          </div>
        </div>
        <div id="tourneeContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <!-- Modale FAIT -->
      <div class="modal" id="tourneeFaitModal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h2>✅ Marquer comme terminée</h2>
            <button class="close-btn" onclick="Tournee.closeFaitModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Tournee.confirmerFait(event)">
              <input type="hidden" id="tourneeFaitId">
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#166534;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="tourneeFaitTitre">—</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Date *</label><input type="date" id="tourneeFaitDate" required></div>
                <div class="form-group"><label>Heure</label><input type="time" id="tourneeFaitHeure"></div>
              </div>
              <div class="form-group"><label>Note</label><textarea id="tourneeFaitNote" rows="3"></textarea></div>
              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn btn-success" style="flex:1;">✅ Marquer terminée</button>
                <button type="button" class="btn btn-ghost" onclick="Tournee.closeFaitModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale REPORTER -->
      <div class="modal" id="tourneeReportModal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h2>📅 Reporter</h2>
            <button class="close-btn" onclick="Tournee.closeReporterModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Tournee.confirmerReporter(event)">
              <input type="hidden" id="tourneeReportId">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#1e40af;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="tourneeReportTitre">—</div>
                <div style="font-size:.82rem;color:#64748b;margin-top:4px;">
                  Date actuelle : <strong id="tourneeReportDateActuelle">—</strong>
                </div>
              </div>
              <div class="form-group"><label>Nouvelle date *</label><input type="date" id="tourneeReportDate" required></div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px;">
                <button type="button" class="btn btn-ghost" style="font-size:.78rem;padding:8px;" onclick="Tournee.reporterRapide(1)">Demain</button>
                <button type="button" class="btn btn-ghost" style="font-size:.78rem;padding:8px;" onclick="Tournee.reporterRapide(3)">+3 j</button>
                <button type="button" class="btn btn-ghost" style="font-size:.78rem;padding:8px;" onclick="Tournee.reporterRapide(7)">+1 sem</button>
              </div>
              <div class="form-group"><label>Raison</label><textarea id="tourneeReportRaison" rows="2"></textarea></div>
              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn" style="flex:1;background:var(--accent);">📅 Reporter</button>
                <button type="button" class="btn btn-ghost" onclick="Tournee.closeReporterModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale RELANCER -->
      <div class="modal" id="tourneeRelanceModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>🔔 Relancer</h2>
            <button class="close-btn" onclick="Tournee.closeRelancerModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Tournee.confirmerRelancer(event)">
              <input type="hidden" id="tourneeRelanceId">
              <div style="background:#faf5ff;border:1px solid #c4b5fd;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#7c3aed;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="tourneeRelanceTitre">—</div>
              </div>
              <div class="form-group"><label>Quoi ? *</label><input type="text" id="tourneeRelanceQuoi" required></div>
              <div class="form-group">
                <label>Quand ?</label>
                <label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-alt);border-radius:8px;cursor:pointer;margin-bottom:6px;">
                  <input type="radio" name="tourneeRelanceQuand" id="tourneeRelanceImmediat" checked onchange="Tournee._toggleRelanceDate()" style="width:auto;">
                  <span>Dès que possible</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-alt);border-radius:8px;cursor:pointer;margin-bottom:6px;">
                  <input type="radio" name="tourneeRelanceQuand" id="tourneeRelanceDateRadio" onchange="Tournee._toggleRelanceDate()" style="width:auto;">
                  <span>Le</span>
                  <input type="date" id="tourneeRelanceDate" disabled style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;">
                </label>
              </div>
              <div class="form-group"><label>Note</label><textarea id="tourneeRelanceNote" rows="2"></textarea></div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button type="submit" class="btn" style="flex:1;background:#8b5cf6;">🔔 Marquer</button>
                <button type="button" class="btn btn-ghost" onclick="Tournee.closeRelancerModal()">Annuler</button>
              </div>
              <button type="button" id="tourneeRelanceSupprBtn" class="btn btn-danger" style="width:100%;margin-top:10px;display:none;" onclick="Tournee.retirerRelance()">🗑️ Retirer la relance</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale ASSIGNER -->
      <div class="modal" id="tourneeAssignerModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>👤 Assigner les bénévoles</h2>
            <button class="close-btn" onclick="Tournee.closeAssignerModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Tournee.confirmerAssigner(event)">
              <input type="hidden" id="tourneeAssignId">
              <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:#9a3412;text-transform:uppercase;font-weight:700;">Intervention</div>
                <div style="font-size:1.05rem;font-weight:800;margin-top:4px;" id="tourneeAssignTitre">—</div>
              </div>
              <div class="form-group">
                <label>🤝 Bénévole principal</label>
                <select id="tourneeAssignBenevole1" style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.9rem;width:100%;"></select>
              </div>
              <div class="form-group">
                <label>🤝 Bénévole secondaire</label>
                <select id="tourneeAssignBenevole2" style="padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.9rem;width:100%;"></select>
              </div>
              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn" style="flex:1;background:#f97316;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" onclick="Tournee.closeAssignerModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modale CALCUL FRAIS -->
      <div class="modal" id="tourneeFraisModal">
        <div class="modal-content" style="max-width:720px;">
          <div class="modal-header">
            <h2>🚗 Calculer les frais d'une tournée</h2>
            <button class="close-btn" onclick="Tournee.fermerCalculFrais()">&times;</button>
          </div>
          <div class="modal-body" id="tourneeFraisBody"></div>
        </div>
      </div>`;
  },

  onShow() { this.render(); }
};

// ⚠️ Tournee en dormance — fusionné dans Missions > onglet Aujourd'hui
// Le code reste pour référence (calcul frais manuel à migrer)
// Router.register({
//   view: 'tournee',
//   title: "Aujourd'hui",
//   icon: '📅',
//   section: "Vue d'ensemble",
//   order: 2,
//   getViewHTML: () => Tournee.getViewHTML(),
//   getModalsHTML: () => Tournee.getModalsHTML(),
//   onShow: () => Tournee.onShow()
// });
