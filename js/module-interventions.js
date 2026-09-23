// ============================================================
// MODULE : INTERVENTIONS — Carnet de mission + cartes cliquables
// ============================================================

const Interventions = {

  STATUTS: {
    demande:   { label: 'À prendre en charge', badge: 'badge-neutral', color: '#64748b' },
    prise:     { label: 'Prise en charge',     badge: 'badge-warning', color: '#f59e0b' },
    planifiee: { label: 'Planifiée',           badge: 'badge-warning', color: '#f59e0b' },
    en_cours:  { label: 'En cours',            badge: 'badge-info',    color: '#0ea5e9' },
    a_valider: { label: 'À valider',           badge: 'badge-warning', color: '#eab308' },
    relancer:  { label: 'À relancer',          badge: 'badge-warning', color: '#8b5cf6' },
    validee:   { label: 'Validée',             badge: 'badge-success', color: '#16a34a' },
    terminee:  { label: 'Validée',             badge: 'badge-success', color: '#16a34a' },
    annulee:   { label: 'Annulée',             badge: 'badge-danger',  color: '#dc2626' }
  },

  getAll() { return Storage.getInterventions(); },
  saveAll(list) { Storage.saveInterventions(list); },

  nextNumero() {
    const list = this.getAll();
    const n = list.length + 1;
    return 'INT-' + String(n).padStart(3, '0');
  },

  getFraisForIntervention(numero) {
    if (typeof Frais === 'undefined' || !Frais.getAll) return null;
    const deplacements = Frais.getAll();
    for (const d of deplacements) {
      if (!Array.isArray(d.interventions)) continue;
      const inter = d.interventions.find(i => {
        if (typeof i === 'string') return i === numero;
        return i.numero === numero;
      });
      if (!inter) continue;
      if (typeof inter === 'object' && inter.part !== undefined) {
        const bareme = d.bareme || 0.40;
        const coutVirtuel = (inter.kmIndividuel || 0) * bareme;
        const economie = coutVirtuel - (inter.part || 0);
        return {
          part: inter.part || 0, kmIndividuel: inter.kmIndividuel || 0, coutVirtuel, economie, bareme,
          benevole: d.benevole, date: d.date, numeroDeplacement: d.numero,
          deplacementId: d.id, totalTournee: d.montant || 0, kmTotal: d.km || 0,
          nbInterventions: d.interventions.length
        };
      }
      return { part: 0, kmIndividuel: 0, coutVirtuel: 0, economie: 0, bareme: 0.40,
        benevole: d.benevole, date: d.date, numeroDeplacement: d.numero,
        deplacementId: d.id, totalTournee: d.montant || 0, kmTotal: d.km || 0,
        nbInterventions: d.interventions.length, incomplet: true };
    }
    return null;
  },

  getDonsForIntervention(numero) {
    if (typeof Dons === 'undefined' || !Dons.getAll) return [];
    return Dons.getAll().filter(d => d.interventionNumero === numero);
  },

  getFiltered() {
    const q = (document.getElementById('intSearch').value || '').toLowerCase();
    const type = document.getElementById('intFilterType').value;
    const statut = document.getElementById('intFilterStatut').value;
    return this.getAll().filter(i => {
      if (q) {
        const hay = [i.numero, i.demandeur, i.benevole, i.description, i.type].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type && i.type !== type) return false;
      if (statut && i.statut !== statut) return false;
      return true;
    });
  },

  render() {
    const container = document.getElementById('interventionsListContainer');
    if (!container) return;
    const all = this.getAll();
    const list = this.getFiltered();

    const elEC = document.getElementById('intStatEnCours');
    const elPl = document.getElementById('intStatPlanifiees');
    const elTe = document.getElementById('intStatTerminees');
    const elTo = document.getElementById('intStatTotal');
    if (elEC) elEC.textContent = all.filter(i => i.statut === 'en_cours').length;
    if (elPl) elPl.textContent = all.filter(i => i.statut === 'planifiee').length;
    if (elTe) elTe.textContent = all.filter(i => i.statut === 'terminee').length;
    if (elTo) elTo.textContent = all.length;

    const cnt = document.getElementById('intCount');
    if (cnt) cnt.textContent = `${list.length} intervention${list.length > 1 ? 's' : ''}`;

    if (list.length === 0) {
      container.innerHTML = '<div class="card"><div class="empty-state">Aucune intervention.</div></div>';
      return;
    }

    const ordre = { en_cours: 0, planifiee: 1, demande: 2, terminee: 3, annulee: 4 };
    list.sort((a, b) => (ordre[a.statut] || 9) - (ordre[b.statut] || 9));
    container.innerHTML = list.map(i => this.renderCard(i)).join('');
  },

  renderCard(i) {
    const st = this.STATUTS[i.statut] || this.STATUTS.demande;
    const prio = i.priorite === 'urgente' ? ' · <span class="badge badge-danger">Urgent</span>' : '';
    const benev = i.benevole ? `👤 ${Utils.escapeHtml(i.benevole)}` : '<em style="color:var(--text-light);">Non assigné</em>';
    const dateP = i.datePrevue
      ? `📅 ${Utils.formatDate(i.datePrevue)}${i.heurePrevue ? ' à ' + Utils.escapeHtml(i.heurePrevue) : ''}`
      : '';

    const frais = this.getFraisForIntervention(i.numero);
    let fraisInline = '';
    if (frais && frais.part > 0) {
      fraisInline = `<div style="margin-top:6px;padding:6px 8px;background:#fef3c7;border-radius:6px;font-size:.78rem;">
        💶 <strong>${frais.part.toFixed(2)} €</strong>
        ${frais.economie > 0 ? ` · 💰 Économie : ${frais.economie.toFixed(2)} €` : ''}
      </div>`;
    }

    const dons = this.getDonsForIntervention(i.numero);
    const donsInline = dons.length > 0
      ? `<div style="margin-top:6px;padding:6px 8px;background:#f3e8ff;border-radius:6px;font-size:.78rem;">
          🎁 <strong>Don : ${dons.reduce((s, d) => s + d.montantTotal, 0).toFixed(2)} €</strong>
        </div>`
      : '';

    return `
      <div class="adh-card" style="border-left-color:${st.color};" onclick="Interventions.openDetail(${i.id})">
        <div class="adh-card-info">
          <div class="adh-card-name">
            <span class="adh-card-numero">${Utils.escapeHtml(i.numero)}</span>
            ${Utils.escapeHtml(i.demandeur)} — ${Utils.escapeHtml(i.type)}${prio}
          </div>
          <div class="adh-card-details">
            👤 ${Utils.escapeHtml(i.demandeur)}<br>
            ${benev} ${dateP ? '· ' + dateP : ''}<br>
            <span class="badge ${st.badge}">${st.label}</span>
            <span style="color:var(--text-light);">· ${Utils.escapeHtml((i.description || '').substring(0, 50))}${i.description && i.description.length > 50 ? '…' : ''}</span>
          </div>
          ${fraisInline}${donsInline}
        </div>
        <div class="adh-card-actions">
          <button class="adh-btn-edit" onclick="event.stopPropagation();Interventions.openForm(${i.id})">✏️</button>
          <button class="adh-btn-del" onclick="event.stopPropagation();Interventions.remove(${i.id})">🗑️</button>
        </div>
      </div>`;
  },

  openForm(id = null) {
    const form = document.getElementById('interventionForm');
    form.reset();
    document.getElementById('intEditId').value = '';
    document.getElementById('intAdherentId').value = '';
    this.refreshBenevolesList();
    this.refreshDemandeursList();

    if (id) {
      const i = this.getAll().find(x => x.id === id);
      if (!i) return;
      document.getElementById('interventionFormTitle').textContent = 'Modifier ' + i.numero;
      document.getElementById('intEditId').value = i.id;
      document.getElementById('intAdherentId').value = i.adherentId || '';
      document.getElementById('intType').value = i.type || '🛠️ Petit Bricolage';
      document.getElementById('intPriorite').value = i.priorite || 'normale';
      document.getElementById('intDemandeur').value = i.demandeur || '';
      document.getElementById('intDescription').value = i.description || '';
      document.getElementById('intBenevole').value = i.benevole || '';
      document.getElementById('intStatut').value = i.statut || 'demande';
      document.getElementById('intDatePrevue').value = i.datePrevue || '';
      document.getElementById('intHeurePrevue').value = i.heurePrevue || '';
      document.getElementById('intDateRealisee').value = i.dateRealisee || '';
      document.getElementById('intHeureRealisee').value = i.heureRealisee || '';
      document.getElementById('intNotes').value = i.notes || '';
    } else {
      document.getElementById('interventionFormTitle').textContent = 'Nouvelle intervention';
      document.getElementById('intDatePrevue').value = Utils.todayISO();
      document.getElementById('intStatut').value = 'demande';
    }
    document.getElementById('interventionFormModal').classList.add('active');
  },

  openFormFromAdherent(adherentId) {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['interventions']) {
      Router.mountIfNeeded('interventions', Router.registry['interventions']);
    }
    const adh = Storage.getAdherents().find(a => a.id === adherentId);
    if (!adh) { alert('Contact introuvable'); return; }
    this.openForm();
    document.getElementById('intAdherentId').value = adh.id;
    document.getElementById('intDemandeur').value = `${adh.prenom} ${adh.nom}`;
    const adresse = [adh.adresse, adh.cp, adh.ville].filter(Boolean).join(', ');
    const tel = adh.tel ? `Tél : ${adh.tel}` : '';
    if (adresse) {
      document.getElementById('intDescription').value = `Adresse : ${adresse}${tel ? '\n' + tel : ''}\n\nDécrire la demande...`;
    }
    document.getElementById('interventionFormTitle').textContent = `Nouvelle intervention — ${adh.prenom} ${adh.nom}`;
    document.getElementById('intType').focus();
  },

  openFormFromAgenda(date, heure) {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['interventions']) {
      Router.mountIfNeeded('interventions', Router.registry['interventions']);
    }
    this.openForm();
    document.getElementById('intDatePrevue').value = date || Utils.todayISO();
    if (heure) document.getElementById('intHeurePrevue').value = heure;
    document.getElementById('intStatut').value = 'planifiee';
    document.getElementById('interventionFormTitle').textContent = `Nouvelle intervention — ${Utils.formatDate(date)}${heure ? ' à ' + heure : ''}`;
  },

  closeForm() { document.getElementById('interventionFormModal').classList.remove('active'); },
  refreshDemandeursList() {
    const dl = document.getElementById('demandeursList');
    if (!dl) return;
    const contacts = Storage.getAdherents()
      .filter(a => a.prenom && a.nom)
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    dl.innerHTML = contacts.map(c => 
      `<option value="${Utils.escapeHtml(c.prenom + ' ' + c.nom)}"></option>`
    ).join('');
  },

  refreshBenevolesList() {
    const dl = document.getElementById('benevolesList');
    if (!dl) return;
    const benevoles = Storage.getAdherents().filter(a => 
      a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole === true)
    );
    dl.innerHTML = benevoles.map(b => `<option value="${Utils.escapeHtml(b.prenom + ' ' + b.nom)}"></option>`).join('');
  },

  save(event) {
    event.preventDefault();
    const id = document.getElementById('intEditId').value;
    const data = {
      type: document.getElementById('intType').value,
      priorite: document.getElementById('intPriorite').value,
      demandeur: document.getElementById('intDemandeur').value.trim(),
      description: document.getElementById('intDescription').value.trim(),
      benevole: document.getElementById('intBenevole').value.trim(),
      statut: document.getElementById('intStatut').value,
      datePrevue: document.getElementById('intDatePrevue').value,
      heurePrevue: document.getElementById('intHeurePrevue').value,
      dateRealisee: document.getElementById('intDateRealisee').value,
      heureRealisee: document.getElementById('intHeureRealisee').value,
      notes: document.getElementById('intNotes').value.trim(),
      adherentId: document.getElementById('intAdherentId').value || null
    };
    if (!data.demandeur || !data.description) { alert('Demandeur et description obligatoires.'); return; }

    const list = this.getAll();
    if (id) {
      const idx = list.findIndex(i => String(i.id) === String(id));
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: Date.now(), numero: this.nextNumero(), dateCreation: Utils.todayISO(), ...data });
    }
    this.saveAll(list);
    this.closeForm();
    this.render();
    if (typeof Agenda !== 'undefined') Agenda.render();
    BricoBol.updateStorageInfo();
  },

  remove(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    if (!confirm(`Supprimer l'intervention ${i.numero} ?`)) return;
    this.saveAll(this.getAll().filter(x => x.id !== id));
    this.render();
    this.closeDetail();
    if (typeof Agenda !== 'undefined') Agenda.render();
    BricoBol.updateStorageInfo();
  },

  openDetail(id) {
    const i = this.getAll().find(x => x.id === id);
    if (!i) return;
    const st = this.STATUTS[i.statut] || this.STATUTS.demande;
    const prio = i.priorite === 'urgente' ? '<span class="badge badge-danger">Urgent</span>' : '';
    const autres = this.getAll().filter(x => x.id !== i.id && x.demandeur.toLowerCase() === i.demandeur.toLowerCase());
       this._interventionCourante = i;

    const histo = autres.length > 0
      ? `<div class="adh-detail-section"><h4>Historique du demandeur (${autres.length})</h4>${autres.slice(0, 3).map(a => `<p>${Utils.escapeHtml(a.numero)} · ${Utils.formatDate(a.dateCreation)} · ${a.type} · <span class="badge ${this.STATUTS[a.statut].badge}">${this.STATUTS[a.statut].label}</span></p>`).join('')}</div>`
      : '';

    const frais = this.getFraisForIntervention(i.numero);
    let fraisHTML = '';
    if (frais && frais.part > 0 && !frais.incomplet) {
      fraisHTML = `
        <div class="adh-detail-section" style="background:#fffbeb;border:1px solid #fcd34d;">
          <h4 style="color:#92400e;">💶 Frais de route</h4>
          <div style="background:#fff;border-radius:8px;padding:12px;margin-top:8px;">
            <div style="font-size:1.1rem;font-weight:800;color:#b45309;margin-bottom:4px;">À demander : ${frais.part.toFixed(2)} €</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
            <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;">Km seul</div>
              <div style="font-size:1rem;font-weight:700;">${frais.kmIndividuel} km</div>
            </div>
            <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;">Économie</div>
              <div style="font-size:1rem;font-weight:700;color:#16a34a;">${frais.economie.toFixed(2)} €</div>
            </div>
          </div>
          <div style="margin-top:10px;font-size:.8rem;color:var(--text-light);border-top:1px dashed #fcd34d;padding-top:8px;">
            👤 ${Utils.escapeHtml(frais.benevole)} · 📅 ${Utils.formatDate(frais.date)}<br>
            🔢 ${Utils.escapeHtml(frais.numeroDeplacement)} (${frais.kmTotal} km · ${frais.totalTournee.toFixed(2)} €)
          </div>
        </div>`;
    } else if (frais && frais.incomplet) {
      fraisHTML = `<div class="adh-detail-section" style="background:#fef3c7;"><h4>💶 Frais de route</h4><p style="font-size:.85rem;">Répartition non calculée.</p></div>`;
    } else {
      fraisHTML = `<div class="adh-detail-section" style="background:#f8fafc;"><h4>💶 Frais de route</h4><p style="font-size:.85rem;color:var(--text-light);">Aucun frais lié.</p></div>`;
    }

    const dons = this.getDonsForIntervention(i.numero);
    let donsHTML = '';
    if (dons.length > 0) {
      const totalDons = dons.reduce((s, d) => s + d.montantTotal, 0);
      donsHTML = `
        <div class="adh-detail-section" style="background:#f3e8ff;border:1px solid #c4b5fd;">
          <h4 style="color:#7c3aed;">🎁 Dons de soutien</h4>
          ${dons.map(d => `
            <p style="font-size:.85rem;margin-bottom:4px;display:flex;justify-content:space-between;">
              <span>${Utils.formatDate(d.versements[0]?.date || '')} · ${d.versements.length} versement(s)${d.recuGenere ? ' · 📄 Reçu ' + d.recuNumero : ''}</span>
              <span style="color:#7c3aed;font-weight:700;">${d.montantTotal.toFixed(2)} €</span>
            </p>
          `).join('')}
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #c4b5fd;font-size:.85rem;">
            Total dons : <strong style="color:#7c3aed;">${totalDons.toFixed(2)} €</strong>
          </div>
        </div>`;
    }

    const boutonDon = i.adherentId
      ? `<button class="btn" style="background:var(--purple);" onclick="Interventions.saisirDon(${i.id})">🎁 Don reçu</button>`
      : '';

    const datePrevueAffiche = i.datePrevue
      ? `📅 Prévenue : ${Utils.formatDate(i.datePrevue)}${i.heurePrevue ? ' à ' + Utils.escapeHtml(i.heurePrevue) : ''}`
      : '';
    const dateRealiseeAffiche = i.dateRealisee
      ? `✅ Réalisée le : ${Utils.formatDate(i.dateRealisee)}${i.heureRealisee ? ' à ' + Utils.escapeHtml(i.heureRealisee) : ''}`
      : '';

    document.getElementById('interventionDetailBody').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div>
          <div style="font-size:1.25rem;font-weight:800;">${Utils.escapeHtml(i.numero)} · ${Utils.escapeHtml(i.demandeur)}</div>
          <div style="color:var(--text-light);font-size:.85rem;">${Utils.escapeHtml(i.type)} · Créée le ${Utils.formatDate(i.dateCreation)}</div>
        </div>
        <div style="text-align:right;">
          <div class="badge ${st.badge}" style="font-size:.85rem;padding:5px 12px;">${st.label}</div>
          <div style="margin-top:4px;">${prio}</div>
        </div>
      </div>
      ${fraisHTML}
      ${donsHTML}
      <div class="adh-detail-section"><h4>Service</h4><p><strong>${Utils.escapeHtml(i.type)}</strong></p></div>
      <div class="adh-detail-section"><h4>Demandeur</h4><p>👤 ${Utils.escapeHtml(i.demandeur)} <button class="btn" style="padding:2px 8px;font-size:.75rem;background:var(--info);margin-left:6px;" onclick="Interventions.messageContact('${Utils.escapeHtml(i.demandeur)}', Interventions._interventionCourante)" title="Envoyer un message">✉️</button></p></div>
      <div class="adh-detail-section"><h4>Description</h4><p style="white-space:pre-wrap;">${Utils.escapeHtml(i.description)}</p></div>
      <div class="adh-detail-section">
        <h4>Assignation</h4>
        <p>Bénévole : ${i.benevole ? Utils.escapeHtml(i.benevole) : '<em>Non assigné</em>'}${i.benevole ? ` <button class="btn" style="padding:2px 8px;font-size:.75rem;background:var(--info);margin-left:6px;" onclick="Interventions.messageContact('${Utils.escapeHtml(i.benevole)}', Interventions._interventionCourante)" title="Envoyer un message">✉️</button>` : ''}</p>
        ${datePrevueAffiche ? `<p>${datePrevueAffiche}</p>` : ''}
        ${dateRealiseeAffiche ? `<p>${dateRealiseeAffiche}</p>` : ''}
      </div>
      ${i.notes ? `<div class="adh-detail-section"><h4>Notes</h4><p style="white-space:pre-wrap;">${Utils.escapeHtml(i.notes)}</p></div>` : ''}
      ${histo}
      <div class="adh-detail-actions">
        ${boutonDon}
        <button class="btn btn-secondary" onclick="Interventions.closeDetail();Interventions.openForm(${i.id});">✏️ Modifier</button>
        ${i.statut !== 'terminee' ? `<button class="btn btn-success" onclick="Interventions.changerStatut(${i.id}, 'terminee')">✅ Terminée</button>` : ''}
        ${i.statut === 'demande' ? `<button class="btn" style="background:var(--warning);" onclick="Interventions.changerStatut(${i.id}, 'planifiee')">📅 Planifier</button>` : ''}
        ${i.statut === 'planifiee' ? `<button class="btn" style="background:var(--accent);" onclick="Interventions.changerStatut(${i.id}, 'en_cours')">▶️ Démarrer</button>` : ''}
        <button class="btn btn-danger" onclick="Interventions.remove(${i.id})">🗑️ Supprimer</button>
      </div>`;
    document.getElementById('interventionDetailModal').classList.add('active');
  },

  // ============================================================
  // MODALES DÉTAIL (cartes cliquables)
  // ============================================================

  _openStatutModal(statut, titre, color, bg, border) {
    const all = this.getAll();
    const list = statut === 'total'
      ? all.slice().sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
      : all.filter(i => i.statut === statut).sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    document.getElementById('intModalTitle').textContent = titre;
    document.getElementById('intModalBody').innerHTML = `
      <div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
        <div style="font-size:.75rem;color:${color};text-transform:uppercase;font-weight:700;margin-bottom:4px;">${titre}</div>
        <div style="font-size:2.2rem;font-weight:800;color:${color};">${list.length}</div>
      </div>

      ${list.length === 0
        ? '<div class="empty-state">Aucune intervention dans cette catégorie.</div>'
        : `<div style="max-height:440px;overflow-y:auto;">
            ${list.map(i => {
              const st = this.STATUTS[i.statut] || { label: i.statut, color: '#64748b' };
              const prio = i.priorite === 'urgente' ? ' <span class="badge badge-danger" style="font-size:.6rem;">URGENT</span>' : '';
              const dateP = i.datePrevue ? Utils.formatDate(i.datePrevue) : '—';
              const benev = i.benevole || '<em style="color:var(--text-light);">Non assigné</em>';
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fff;border:1px solid var(--border);border-left:4px solid ${st.color};border-radius:8px;margin-bottom:6px;cursor:pointer;"
                     onclick="Interventions.closeStatutModal();Interventions.openDetail(${i.id});">
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:.88rem;">
                      <span style="color:var(--accent);font-size:.72rem;">${Utils.escapeHtml(i.numero)}</span>
                      ${Utils.escapeHtml(i.type)}${prio}
                    </div>
                    <div style="font-size:.76rem;color:var(--text-light);margin-top:2px;">
                      👤 ${Utils.escapeHtml(i.demandeur)} · 🤝 ${benev}<br>
                      📅 ${dateP}
                    </div>
                  </div>
                  <span class="badge" style="background:${st.color}22;color:${st.color};font-size:.68rem;flex-shrink:0;">${st.label}</span>
                </div>`;
            }).join('')}
          </div>`}
    `;
    document.getElementById('intStatutModal').classList.add('active');
  },

  openEnCoursModal() { this._openStatutModal('en_cours', '▶️ En cours', '#f59e0b', '#fffbeb', '#fcd34d'); },
  openPlanifieesModal() { this._openStatutModal('planifiee', '📅 Planifiées', '#f59e0b', '#fffbeb', '#fcd34d'); },
  openTermineesModal() { this._openStatutModal('terminee', '✅ Terminées', '#16a34a', '#f0fdf4', '#86efac'); },
  openTotalModal() { this._openStatutModal('total', '📊 Toutes les interventions', '#8b5cf6', '#faf5ff', '#c4b5fd'); },

  closeStatutModal() {
    document.getElementById('intStatutModal').classList.remove('active');
  },

  saisirDon(interventionId) {
    const i = this.getAll().find(x => x.id === interventionId);
    if (!i || !i.adherentId) { alert('Cette intervention n\'est pas liée à un contact.'); return; }
    if (typeof Dons === 'undefined') { alert('Module Dons non disponible.'); return; }
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['dons']) {
      Router.mountIfNeeded('dons', Router.registry['dons']);
    }
    this.closeDetail();
    Dons.openForm(null, { adherentId: i.adherentId, interventionNumero: i.numero });
  },
  messageContact(nom, intervention) {
    if (!nom) { alert('Aucun nom à rechercher.'); return; }
    let ctx = null;
    if (intervention) {
      const num = intervention.numero || '';
      const dem = intervention.demandeur || '';
      const typ = intervention.type || '';
      ctx = {
        datePrevue: intervention.datePrevue || '',
        heurePrevue: intervention.heurePrevue || '',
        intervention: num + (dem ? ' · ' + dem : '') + (typ ? ' · ' + typ : ''),
        type: typ
      };
    }
    if (typeof Adherents === 'undefined' || !Adherents.ouvrirMessageModal) {
      alert('Module Annuaire indisponible.');
      return;
    }
    const nomCherche = nom.toLowerCase().trim();
    const contact = Adherents.getAll().find(a => {
      const complet = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase().trim();
      const inverse = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase().trim();
      return complet === nomCherche || inverse === nomCherche;
    });
    if (!contact) {
      alert('Aucun contact trouvé dans l\'annuaire pour : ' + nom);
      return;
    }
    if (!contact.email && !contact.tel) {
      alert('Ce contact n\'a ni email ni téléphone.');
      return;
    }
        this.closeDetail();
    Adherents.ouvrirMessageModal(contact.id, ctx);
  },

  closeDetail() { document.getElementById('interventionDetailModal').classList.remove('active'); },

  changerStatut(id, statut) {
    const list = this.getAll();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return;
    list[idx].statut = statut;
    if (statut === 'terminee' && !list[idx].dateRealisee) {
      list[idx].dateRealisee = Utils.todayISO();
    }
    this.saveAll(list);
    this.openDetail(id);
    this.render();
    if (typeof Agenda !== 'undefined') Agenda.render();
  },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucune intervention.'); return; }
    const headers = ['Numéro','Date création','Type','Priorité','Statut','Demandeur','Bénévole','Date prévue','Heure prévue','Date réalisée','Heure réalisée','Description','Notes','Frais bénéficiaire','Économie','Dons reçus'];
    let csv = headers.join(';') + '\n';
    list.forEach(i => {
      const st = this.STATUTS[i.statut] || { label: i.statut };
      const frais = this.getFraisForIntervention(i.numero);
      const fraisPart = frais && !frais.incomplet ? frais.part.toFixed(2) : '';
      const fraisEco = frais && !frais.incomplet ? frais.economie.toFixed(2) : '';
      const dons = this.getDonsForIntervention(i.numero);
      const totalDons = dons.reduce((s, d) => s + d.montantTotal, 0);
      const row = [i.numero, i.dateCreation, i.type, i.priorite, st.label, i.demandeur, i.benevole, i.datePrevue, i.heurePrevue || '', i.dateRealisee, i.heureRealisee || '', i.description, i.notes, fraisPart, fraisEco, totalDons > 0 ? totalDons.toFixed(2) : '']
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
      csv += row + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'interventions_bricobol.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  },

  getViewHTML() {
    return `
      <section class="view" id="view-interventions">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Interventions</h1><p>Carnet de mission</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Interventions.exportCSV()">📥 Export CSV</button>
            <button class="btn" onclick="Missions.nouvelleIntervention()">➕ Nouvelle intervention</button>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card clickable" onclick="Interventions.openEnCoursModal()" title="Voir les interventions en cours">
            <div class="stat-label">En cours</div>
            <div class="stat-value" id="intStatEnCours">0</div>
            <div class="stat-sub">Missions actives</div>
          </div>
          <div class="stat-card orange clickable" onclick="Interventions.openPlanifieesModal()" title="Voir les interventions planifiées">
            <div class="stat-label">Planifiées</div>
            <div class="stat-value" id="intStatPlanifiees">0</div>
            <div class="stat-sub">À venir</div>
          </div>
          <div class="stat-card success clickable" onclick="Interventions.openTermineesModal()" title="Voir les interventions terminées">
            <div class="stat-label">Terminées</div>
            <div class="stat-value" id="intStatTerminees">0</div>
            <div class="stat-sub">Toutes</div>
          </div>
          <div class="stat-card purple clickable" onclick="Interventions.openTotalModal()" title="Voir toutes les interventions">
            <div class="stat-label">Total</div>
            <div class="stat-value" id="intStatTotal">0</div>
            <div class="stat-sub">Toutes</div>
          </div>
        </div>
        <div class="card" style="padding:14px;">
          <input type="text" id="intSearch" placeholder="🔍 Rechercher" oninput="Interventions.render()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
            <select id="intFilterType" onchange="Interventions.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              <option value="">Tous types</option>
              <option value="🛠️ Petit Bricolage">🛠️ Petit Bricolage</option>
              <option value="🌿 Entretien des accès">🌿 Entretien des accès</option>
              <option value="📦 Manutention & Livraison">📦 Manutention & Livraison</option>
              <option value="💻 Numérique">💻 Numérique</option>
              <option value="⚡ Électroménager">⚡ Électroménager</option>
              <option value="🍎 Cueillette solidaire">🍎 Cueillette solidaire</option>
              <option value="Autre">Autre</option>
            </select>
            <select id="intFilterStatut" onchange="Interventions.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              <option value="">Tous statuts</option>
              <option value="demande">Demandes</option>
              <option value="planifiee">Planifiées</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>
          <div style="margin-top:10px;font-size:.82rem;color:var(--text-light);" id="intCount">0 intervention</div>
        </div>
        <div id="interventionsListContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="interventionFormModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="interventionFormTitle">Nouvelle intervention</h2>
            <button class="close-btn" onclick="Interventions.closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="interventionForm" onsubmit="Interventions.save(event)">
              <input type="hidden" id="intEditId">
              <input type="hidden" id="intAdherentId">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group">
                  <label>Type *</label>
                  <select id="intType" required>
                    <option value="🛠️ Petit Bricolage">🛠️ Petit Bricolage</option>
                    <option value="🌿 Entretien des accès">🌿 Entretien des accès</option>
                    <option value="📦 Manutention & Livraison">📦 Manutention & Livraison</option>
                    <option value="💻 Numérique">💻 Numérique</option>
                    <option value="⚡ Électroménager">⚡ Électroménager</option>
                    <option value="🍎 Cueillette solidaire">🍎 Cueillette solidaire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Priorité</label>
                  <select id="intPriorite">
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Demandeur *</label>
                <input type="text" id="intDemandeur" list="demandeursList" placeholder="Nom" required>
                <datalist id="demandeursList"></datalist>
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea id="intDescription" rows="4" required></textarea>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group">
                  <label>Bénévole</label>
                  <input type="text" id="intBenevole" list="benevolesList" placeholder="Nom">
                  <datalist id="benevolesList"></datalist>
                </div>
                <div class="form-group">
                  <label>Statut</label>
                  <select id="intStatut">
                    <option value="demande">Demande</option>
                    <option value="planifiee">Planifiée</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminee">Terminée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Date prévue</label><input type="date" id="intDatePrevue"></div>
                <div class="form-group"><label>Heure prévue</label><input type="time" id="intHeurePrevue"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Date réalisée</label><input type="date" id="intDateRealisee"></div>
                <div class="form-group"><label>Heure réalisée</label><input type="time" id="intHeureRealisee"></div>
              </div>
              <div class="form-group"><label>Notes</label><textarea id="intNotes" rows="2"></textarea></div>
              <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="submit" class="btn" style="flex:1;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" onclick="Interventions.closeForm()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal" id="interventionDetailModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Fiche intervention</h2>
            <button class="close-btn" onclick="Interventions.closeDetail()">&times;</button>
          </div>
          <div class="modal-body" id="interventionDetailBody"></div>
        </div>
      </div>

      <div class="modal" id="intStatutModal">
        <div class="modal-content" style="max-width:640px;">
          <div class="modal-header">
            <h2 id="intModalTitle">Détail</h2>
            <button class="close-btn" onclick="Interventions.closeStatutModal()">&times;</button>
          </div>
          <div class="modal-body" id="intModalBody"></div>
        </div>
      </div>`;
  },

  onShow() { this.render(); }
};

Router.register({
  view: 'interventions',
  title: 'Interventions',
  icon: '🛠️',
  section: 'Activité',
  order: 2,
  getViewHTML: () => Interventions.getViewHTML(),
  getModalsHTML: () => Interventions.getModalsHTML(),
  onShow: () => Interventions.onShow()
});
