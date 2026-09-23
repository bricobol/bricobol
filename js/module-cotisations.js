// ============================================================
// MODULE : COTISATIONS — modales cliquables + verrouillage
// ============================================================

const Cotisations = {

  getAll() { return Storage.get('cotisations', []); },
  saveAll(list) { return Storage.set('cotisations', list); },

  getMontant() {
    const p = Storage.getParametres();
    return p.cotisationAnnuelle || 10;
  },

  getByAdherent(adherentId) {
    return this.getAll()
      .filter(c => c.adherentId === adherentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  isPaidForYear(adherentId, year) {
    const y = year || new Date().getFullYear();
    return this.getAll().some(c => 
      c.adherentId === adherentId && 
      c.exercice === y && 
      c.statut !== 'en_attente'
    );
  },

  getEnAttente() {
    return this.getAll().filter(c => c.statut === 'en_attente');
  },

  getValidees() {
    return this.getAll().filter(c => c.statut !== 'en_attente');
  },

  countEnAttente() {
    return this.getEnAttente().length;
  },

  creerEnAttente(adherentId, adherentNom, options = {}) {
    const list = this.getAll();
    const cotis = {
      id: Date.now() + Math.random(),
      adherentId,
      adherentNom,
      date: options.date || Utils.todayISO(),
      montant: options.montant || 0,
      mode: options.mode || 'à définir',
      exercice: options.exercice || new Date().getFullYear(),
      statut: 'en_attente',
      source: options.source || 'manuelle',
      note: options.note || '',
      comptaId: null,
      comptaPiece: null,
      dateCreation: new Date().toISOString(),
      verrouille: options.source !== 'import-yapla'
    };
    list.push(cotis);
    this.saveAll(list);
    return cotis;
  },

  valider(id, options = {}) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const c = list[idx];
    if (c.statut !== 'en_attente') return false;

    const montant = options.montant !== undefined ? options.montant : c.montant;
    const mode = options.mode || c.mode || 'Espèces';
    const dateValidation = options.date || Utils.todayISO();
    const note = options.note !== undefined ? options.note : c.note;

    const comptaList = (typeof Compta !== 'undefined') ? Compta.getAll() : Storage.getEntries();
    const comptaId = Date.now() + Math.random();
    const pieceCount = comptaList.filter(e => e.type === 'recette').length + 1;
    const piece = 'REC-' + String(pieceCount).padStart(3, '0');

    const entry = {
      id: comptaId,
      type: 'recette',
      date: dateValidation,
      piece,
      yapla: '-',
      tiers: c.adherentNom,
      intervention: 'Aucune / Autre',
      paiement: mode,
      items: [{ name: `🎫 Adhésion (${montant.toFixed(2)} € / an)`, amount: montant, category: '' }],
      total: montant,
      source: 'cotisation'
    };
    comptaList.push(entry);
    if (typeof Compta !== 'undefined') Compta.saveAll(comptaList);
    else Storage.saveEntries(comptaList);

    list[idx] = {
      ...c,
      montant,
      mode,
      date: dateValidation,
      note,
      statut: 'validee',
      comptaId,
      comptaPiece: piece,
      dateValidation: new Date().toISOString(),
      verrouille: true
    };
    this.saveAll(list);

    const adhList = Storage.getAdherents();
    const adhIdx = adhList.findIndex(a => a.id === c.adherentId);
    if (adhIdx !== -1) {
      const baseDate = adhList[adhIdx].dateExpiration || dateValidation;
      adhList[adhIdx].dateExpiration = Utils.addOneYear(baseDate);
      adhList[adhIdx].dateCreation = adhList[adhIdx].dateCreation || dateValidation;
      Storage.saveAdherents(adhList);
    }

    if (typeof Compta !== 'undefined') Compta.render();
    if (typeof Adherents !== 'undefined') Adherents.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    this.render();
    BricoBol.updateStorageInfo();

    return true;
  },

  annuler(id) {
    const c = this.getAll().find(x => x.id === id);
    if (!c) return;
    if (c.statut !== 'en_attente') { alert('Seules les cotisations en attente peuvent être annulées.'); return; }
    if (!confirm(`Annuler la cotisation en attente de ${c.adherentNom} ?\n\nElle sera supprimée définitivement.`)) return;
    this.saveAll(this.getAll().filter(x => x.id !== id));
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  enregistrer(adherentId, options = {}) {
    const adh = Storage.getAdherents().find(a => a.id === adherentId);
    if (!adh) { alert('Adhérent introuvable'); return; }

    const exercice = options.exercice || new Date().getFullYear();
    if (this.isPaidForYear(adherentId, exercice)) {
      if (!confirm(`${adh.prenom} ${adh.nom} a déjà payé pour ${exercice}.\n\nEnregistrer quand même ?`)) return;
    }

    const montant = options.montant || this.getMontant();
    const date = options.date || Utils.todayISO();
    const mode = options.mode || 'Espèces';
    const notes = options.notes || '';

    const cotis = this._creer(adherentId, `${adh.prenom} ${adh.nom}`, {
      date, montant, mode, exercice, notes,
      statut: 'validee',
      source: 'manuelle'
    });

    const adhList = Storage.getAdherents();
    const idx = adhList.findIndex(a => a.id === adherentId);
    if (idx !== -1) {
      const baseDate = adhList[idx].dateExpiration || date;
      adhList[idx].dateExpiration = Utils.addOneYear(baseDate);
      adhList[idx].dateCreation = adhList[idx].dateCreation || date;
      Storage.saveAdherents(adhList);
    }

    if (typeof Compta !== 'undefined') Compta.render();
    if (typeof Adherents !== 'undefined') Adherents.render();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();

    return cotis;
  },

  _creer(adherentId, adherentNom, data) {
    const comptaList = (typeof Compta !== 'undefined') ? Compta.getAll() : Storage.getEntries();
    const comptaId = Date.now() + Math.random();
    const pieceCount = comptaList.filter(e => e.type === 'recette').length + 1;
    const piece = data.numPiece || ('REC-' + String(pieceCount).padStart(3, '0'));

    const entry = {
      id: comptaId,
      type: 'recette',
      date: data.date,
      piece,
      yapla: data.yaplaId || '-',
      tiers: adherentNom,
      intervention: 'Aucune / Autre',
      paiement: data.mode,
      items: [{ name: `🎫 Adhésion (${data.montant} € / an)`, amount: data.montant, category: '' }],
      total: data.montant,
      source: 'cotisation'
    };
    comptaList.push(entry);
    if (typeof Compta !== 'undefined') Compta.saveAll(comptaList);
    else Storage.saveEntries(comptaList);

    const cotisList = this.getAll();
    const cotis = {
      id: Date.now() + Math.random(),
      adherentId,
      adherentNom,
      date: data.date,
      montant: data.montant,
      mode: data.mode,
      exercice: data.exercice,
      statut: 'validee',
      comptaId,
      comptaPiece: piece,
      notes: data.notes || '',
      source: data.source || 'manuelle',
      yaplaAdhesionNumero: data.yaplaAdhesionNumero || null,
      dateEnregistrement: new Date().toISOString(),
      verrouille: data.source !== 'import-yapla'
    };
    cotisList.push(cotis);
    this.saveAll(cotisList);

    return cotis;
  },

  creerPourImport(adherentId, adherentNom, data) {
    if (data.yaplaAdhesionNumero) {
      const exist = this.getAll().find(c => c.yaplaAdhesionNumero === data.yaplaAdhesionNumero);
      if (exist) return null;
    }
    if (this.isPaidForYear(adherentId, data.exercice)) return null;

    return this._creer(adherentId, adherentNom, {
      ...data,
      statut: 'validee',
      source: 'import-yapla'
    });
  },

  // ✅ Met à jour une cotisation existante issue d'un import (montant, mode)
  majImport(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const c = list[idx];

    // Si verrouillée par l'utilisateur → on ne touche pas
    if (c.verrouille) return false;

    list[idx] = {
      ...c,
      montant: data.montant !== undefined ? data.montant : c.montant,
      mode: data.mode !== undefined ? data.mode : c.mode,
      date: data.date !== undefined ? data.date : c.date,
      note: data.note !== undefined ? data.note : c.note,
      yaplaAdhesionNumero: data.yaplaAdhesionNumero || c.yaplaAdhesionNumero,
      source: 'import-yapla',
      dateMajImport: new Date().toISOString()
    };
    this.saveAll(list);
    return true;
  },

  remove(id) {
    const c = this.getAll().find(x => x.id === id);
    if (!c) return;
    if (c.statut === 'en_attente') {
      this.annuler(id);
      return;
    }
    if (!confirm(`Supprimer la cotisation de ${c.adherentNom} (${c.exercice}) ?\n\nLa recette comptable associée sera aussi supprimée.`)) return;

    if (c.comptaId && typeof Compta !== 'undefined') {
      const comptaList = Compta.getAll().filter(e => e.id !== c.comptaId);
      Compta.saveAll(comptaList);
      Compta.render();
    }

    this.saveAll(this.getAll().filter(x => x.id !== id));
    this.render();
    if (typeof Adherents !== 'undefined') Adherents.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  // ============================================================
  // MODALES DÉTAIL (cartes cliquables)
  // ============================================================

  openCollecteModal() {
    const year = parseInt(document.getElementById('cotisFilterYear')?.value) || new Date().getFullYear();
    const list = this.getAll()
      .filter(c => c.exercice === year && c.statut !== 'en_attente')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = list.reduce((s, c) => s + (c.montant || 0), 0);

    document.getElementById('cotisModalTitle').textContent = `💶 Collecté ${year}`;
    document.getElementById('cotisModalBody').innerHTML = `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
        <div style="font-size:.75rem;color:#166534;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Total collecté</div>
        <div style="font-size:2.2rem;font-weight:800;color:#166534;">${total.toFixed(2)} €</div>
        <div style="font-size:.85rem;color:var(--text-light);margin-top:6px;">${list.length} cotisation${list.length > 1 ? 's' : ''} validée${list.length > 1 ? 's' : ''}</div>
      </div>

      ${list.length === 0
        ? '<div class="empty-state">Aucune cotisation pour ' + year + '.</div>'
        : `<div style="max-height:420px;overflow-y:auto;">
            ${list.map(c => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:.88rem;">${Utils.escapeHtml(c.adherentNom)}</div>
                  <div style="font-size:.76rem;color:var(--text-light);">
                    📅 ${Utils.formatDate(c.date)} · ${Utils.escapeHtml(c.mode || '?')}
                    ${c.comptaPiece ? ' · ' + Utils.escapeHtml(c.comptaPiece) : ''}
                    ${c.source === 'import-yapla' ? ' · <span class="badge badge-info" style="font-size:.65rem;">Yapla</span>' : ''}
                  </div>
                </div>
                <div style="font-weight:800;color:var(--success);font-size:1rem;flex-shrink:0;">
                  ${c.montant.toFixed(2)} €
                </div>
              </div>`).join('')}
          </div>`}
    `;
    document.getElementById('cotisDetailModal').classList.add('active');
  },

  openPayeModal() {
    const year = parseInt(document.getElementById('cotisFilterYear')?.value) || new Date().getFullYear();
    const adhActifs = Storage.getAdherents().filter(a => 
      a.type === 'Adhérent bénéficiaire' || a.type === 'Bénévole'
    );
    const payants = adhActifs.filter(a => this.isPaidForYear(a.id, year))
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

    document.getElementById('cotisModalTitle').textContent = `✅ Ont payé ${year}`;
    document.getElementById('cotisModalBody').innerHTML = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
        <div style="font-size:.75rem;color:#1e40af;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Adhérents à jour</div>
        <div style="font-size:2.2rem;font-weight:800;color:#1e40af;">${payants.length}</div>
      </div>

      ${payants.length === 0
        ? '<div class="empty-state">Personne n\'a encore payé pour ' + year + '.</div>'
        : `<div style="max-height:420px;overflow-y:auto;">
            ${payants.map(a => {
              const cotis = this.getByAdherent(a.id).find(c => c.exercice === year && c.statut !== 'en_attente');
              const aussiBenevoleBadge = (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole)
                ? ' <span class="badge badge-info" style="font-size:.65rem;">🤝</span>' : '';
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;"
                     onclick="Cotisations.closeDetailModal();Adherents.openDetail(${a.id});">
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:.88rem;">
                      <span style="color:var(--accent);font-size:.72rem;font-weight:700;">${Utils.escapeHtml(a.numero)}</span>
                      ${Utils.escapeHtml(a.prenom)} ${Utils.escapeHtml(a.nom)}${aussiBenevoleBadge}
                    </div>
                    <div style="font-size:.76rem;color:var(--text-light);">
                      📅 ${cotis ? Utils.formatDate(cotis.date) : '—'} · ${cotis ? Utils.escapeHtml(cotis.mode || '?') : ''}
                    </div>
                  </div>
                  <div style="font-weight:800;color:var(--success);font-size:.95rem;flex-shrink:0;">
                    ${cotis ? cotis.montant.toFixed(2) + ' €' : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>`}
    `;
    document.getElementById('cotisDetailModal').classList.add('active');
  },

  openARenouvelerModal() {
    const year = parseInt(document.getElementById('cotisFilterYear')?.value) || new Date().getFullYear();
    const adhActifs = Storage.getAdherents().filter(a => 
      a.type === 'Adhérent bénéficiaire' || a.type === 'Bénévole'
    );
    const nonPayants = adhActifs.filter(a => !this.isPaidForYear(a.id, year))
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

    document.getElementById('cotisModalTitle').textContent = `⚠️ À encaisser ${year}`;
    document.getElementById('cotisModalBody').innerHTML = `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
        <div style="font-size:.75rem;color:#92400e;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Adhérents à recontacter</div>
        <div style="font-size:2.2rem;font-weight:800;color:#92400e;">${nonPayants.length}</div>
      </div>

      ${nonPayants.length === 0
        ? '<div class="empty-state">🎉 Tous les adhérents sont à jour pour ' + year + ' !</div>'
        : `<div style="max-height:420px;overflow-y:auto;">
            ${nonPayants.map(a => {
              const exp = a.dateExpiration ? Utils.formatDate(a.dateExpiration) : '—';
              const statut = Utils.statutAdherent(a.dateExpiration);
              const aussiBenevoleBadge = (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole)
                ? ' <span class="badge badge-info" style="font-size:.65rem;">🤝</span>' : '';
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
                  <div style="flex:1;min-width:0;cursor:pointer;" onclick="Cotisations.closeDetailModal();Adherents.openDetail(${a.id});">
                    <div style="font-weight:600;font-size:.88rem;">
                      <span style="color:var(--accent);font-size:.72rem;font-weight:700;">${Utils.escapeHtml(a.numero)}</span>
                      ${Utils.escapeHtml(a.prenom)} ${Utils.escapeHtml(a.nom)}${aussiBenevoleBadge}
                    </div>
                    <div style="font-size:.76rem;color:var(--text-light);">
                      Exp: ${exp} ${Utils.statutBadge(statut)}
                    </div>
                  </div>
                  <button class="btn btn-success" style="padding:6px 12px;font-size:.78rem;flex-shrink:0;"
                          onclick="Cotisations.closeDetailModal();Cotisations.openPaiementModal(${a.id});">
                    💶 Encaisser
                  </button>
                </div>`;
            }).join('')}
          </div>`}
    `;
    document.getElementById('cotisDetailModal').classList.add('active');
  },

  openAValiderModal() {
    const enAttente = this.getEnAttente()
      .sort((a, b) => new Date(b.dateCreation || b.date) - new Date(a.dateCreation || a.date));

    document.getElementById('cotisModalTitle').textContent = '⏳ À valider';
    document.getElementById('cotisModalBody').innerHTML = `
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
        <div style="font-size:.75rem;color:#9a3412;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Paiements en attente</div>
        <div style="font-size:2.2rem;font-weight:800;color:#9a3412;">${enAttente.length}</div>
        <div style="font-size:.85rem;color:var(--text-light);margin-top:6px;">
          Total : ${enAttente.reduce((s, c) => s + (c.montant || 0), 0).toFixed(2)} €
        </div>
      </div>

      ${enAttente.length === 0
        ? '<div class="empty-state">Aucune cotisation en attente.</div>'
        : `<div style="max-height:420px;overflow-y:auto;">
            ${enAttente.map(c => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:6px;">
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:.88rem;">${Utils.escapeHtml(c.adherentNom)}</div>
                  <div style="font-size:.76rem;color:var(--text-light);">
                    💶 ${(c.montant || 0).toFixed(2)} € · Exercice ${c.exercice}
                    ${c.source === 'formulaire-benevole' ? ' · <span class="badge badge-info" style="font-size:.65rem;">Formulaire</span>' : ''}
                    ${c.source === 'import-yapla' ? ' · <span class="badge badge-info" style="font-size:.65rem;">Yapla</span>' : ''}
                    ${c.note ? '<br>📝 ' + Utils.escapeHtml(c.note) : ''}
                  </div>
                </div>
                <button class="btn btn-success" style="padding:6px 12px;font-size:.78rem;flex-shrink:0;"
                        onclick="Cotisations.closeDetailModal();Cotisations.openValidationModal(${c.id});">
                  ✅ Valider
                </button>
              </div>`).join('')}
          </div>`}
    `;
    document.getElementById('cotisDetailModal').classList.add('active');
  },

  closeDetailModal() {
    document.getElementById('cotisDetailModal').classList.remove('active');
  },

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  render() {
    const container = document.getElementById('cotisListContainer');
    if (!container) return;

    const all = this.getAll();
    const year = parseInt(document.getElementById('cotisFilterYear')?.value) || new Date().getFullYear();
    const statut = document.getElementById('cotisFilterStatut')?.value || '';
    const q = (document.getElementById('cotisSearch')?.value || '').toLowerCase();
    const mode = document.getElementById('cotisMode')?.value || 'adherents';

    const cotisYear = all.filter(c => c.exercice === year && c.statut !== 'en_attente');
    const totalYear = cotisYear.reduce((s, c) => s + (c.montant || 0), 0);
    const nbPaye = new Set(cotisYear.map(c => c.adherentId)).size;

    const adhActifs = Storage.getAdherents().filter(a => 
      a.type === 'Adhérent bénéficiaire' || a.type === 'Bénévole'
    );
    const nbAttendu = adhActifs.length;
    const nbRestant = Math.max(0, nbAttendu - nbPaye);
    const nbEnAttente = this.countEnAttente();

    const elTotal = document.getElementById('cotisStatTotal');
    const elPaye = document.getElementById('cotisStatPaye');
    const elRestant = document.getElementById('cotisStatRestant');
    const elAttente = document.getElementById('cotisStatAttente');
    if (elTotal) elTotal.textContent = totalYear.toFixed(2) + ' €';
    if (elPaye) elPaye.textContent = nbPaye;
    if (elRestant) elRestant.textContent = nbRestant;
    if (elAttente) elAttente.textContent = nbEnAttente;

    if (mode === 'adherents') {
      let list = adhActifs.slice();
      if (q) list = list.filter(a => `${a.prenom} ${a.nom}`.toLowerCase().includes(q));
      if (statut === 'paye') list = list.filter(a => this.isPaidForYear(a.id, year));
      if (statut === 'non_paye') list = list.filter(a => !this.isPaidForYear(a.id, year));
      if (statut === 'en_attente') {
        list = list.filter(a => 
          this.getByAdherent(a.id).some(c => c.exercice === year && c.statut === 'en_attente')
        );
      }
      list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

      if (list.length === 0) {
        container.innerHTML = '<div class="card"><div class="empty-state">Aucun adhérent dans cette catégorie.</div></div>';
        return;
      }
      container.innerHTML = list.map(a => {
        const paid = this.isPaidForYear(a.id, year);
        const cotis = this.getByAdherent(a.id).find(c => c.exercice === year && c.statut !== 'en_attente');
        const enAttente = this.getByAdherent(a.id).find(c => c.exercice === year && c.statut === 'en_attente');
        const aussiBenevoleBadge = (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole)
          ? ' <span class="badge badge-info" style="font-size:.65rem;">🤝</span>' : '';
        let badge = '';
        if (paid) {
          const montantTxt = cotis ? cotis.montant.toFixed(2).replace('.', ',') + ' € ' : '';
          badge = `<span class="badge badge-success">✓ Payé ${montantTxt}${cotis ? 'le ' + Utils.formatDate(cotis.date) : ''}</span>`;
        } else if (enAttente) {
          badge = `<span class="badge badge-warning">⏳ En attente (${(enAttente.montant || 0).toFixed(2)} €)</span>`;
        } else {
          badge = `<span class="badge badge-warning">À encaisser</span>`;
        }
        const borderColor = paid ? 'var(--success)' : (enAttente ? 'var(--warning)' : 'var(--warning)');

        return `
          <div class="adh-card" style="border-left-color:${borderColor};" onclick="Adherents.openDetail(${a.id})">
            <div class="adh-card-info">
              <div class="adh-card-name"><span class="adh-card-numero">${Utils.escapeHtml(a.numero)}</span>${Utils.escapeHtml(a.prenom)} ${Utils.escapeHtml(a.nom)}${aussiBenevoleBadge}</div>
              <div class="adh-card-details">${badge} · Exp: ${Utils.formatDate(a.dateExpiration)}</div>
            </div>
            <div class="adh-card-actions" onclick="event.stopPropagation();">
              ${!paid && !enAttente ? `<button class="btn" style="padding:8px 12px;font-size:.8rem;background:var(--success);" onclick="Cotisations.openPaiementModal(${a.id})">💶 Encaisser ${this.getMontant().toFixed(2)} €</button>` : ''}
              ${enAttente ? `<button class="btn" style="padding:8px 12px;font-size:.8rem;background:var(--success);" onclick="Cotisations.openValidationModal(${enAttente.id})">✅ Valider</button>` : ''}
            </div>
          </div>`;
      }).join('');
      return;
    }

    let histo = all.filter(c => c.exercice === year);
    if (q) histo = histo.filter(c => (c.adherentNom || '').toLowerCase().includes(q));
    if (statut === 'en_attente') histo = histo.filter(c => c.statut === 'en_attente');
    else if (statut === 'validee') histo = histo.filter(c => c.statut !== 'en_attente');
    histo.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (histo.length === 0) {
      container.innerHTML = '<div class="card"><div class="empty-state">Aucune cotisation pour ' + year + '.</div></div>';
      return;
    }
    container.innerHTML = histo.map(c => {
      const enAttente = c.statut === 'en_attente';
      const borderColor = enAttente ? 'var(--warning)' : 'var(--success)';
      const bgColor = enAttente ? '#fffbeb' : '#fff';
      return `
        <div class="adh-card" style="border-left-color:${borderColor};background:${bgColor};">
          <div class="adh-card-info">
            <div class="adh-card-name">
              ${Utils.escapeHtml(c.adherentNom)}
              ${enAttente ? '<span class="badge badge-warning" style="font-size:.65rem;margin-left:6px;">⏳ En attente</span>' : ''}
            </div>
            <div class="adh-card-details">
              📅 ${Utils.formatDate(c.date)} · 💶 <strong>${c.montant.toFixed(2)} €</strong> · ${Utils.escapeHtml(c.mode || '?')}<br>
              Exercice ${c.exercice}${c.comptaPiece ? ' · Pièce ' + Utils.escapeHtml(c.comptaPiece) : ''}
              ${c.source === 'import-yapla' ? ' <span class="badge badge-info" style="font-size:.65rem;">Import Yapla</span>' : ''}
              ${c.source === 'formulaire-benevole' ? ' <span class="badge badge-info" style="font-size:.65rem;">Formulaire</span>' : ''}
              ${c.note ? '<br>📝 ' + Utils.escapeHtml(c.note) : ''}
            </div>
          </div>
          <div class="adh-card-actions">
            ${enAttente ? `<button class="btn" style="padding:8px 12px;font-size:.8rem;background:var(--success);" onclick="Cotisations.openValidationModal(${c.id})">✅ Valider</button>` : ''}
            <button class="adh-btn-del" onclick="Cotisations.remove(${c.id})" title="Supprimer">🗑️</button>
          </div>
        </div>`;
    }).join('');
  },

  // ============================================================
  // MODALES DE PAIEMENT / VALIDATION
  // ============================================================

  openPaiementModal(adherentId) {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['cotisations']) {
      Router.mountIfNeeded('cotisations', Router.registry['cotisations']);
    }
    const adh = Storage.getAdherents().find(a => a.id === adherentId);
    if (!adh) return;

    document.getElementById('cotisModalAdhId').value = adherentId;
    document.getElementById('cotisModalAdhNom').textContent = `${adh.prenom} ${adh.nom}`;
    document.getElementById('cotisModalDate').value = Utils.todayISO();
    document.getElementById('cotisModalMontant').value = this.getMontant();
    document.getElementById('cotisModalMode').value = 'Espèces';
    document.getElementById('cotisModalExercice').value = new Date().getFullYear();
    document.getElementById('cotisModalNotes').value = '';

    document.getElementById('cotisPaiementModal').classList.add('active');
  },

  closePaiementModal() {
    document.getElementById('cotisPaiementModal').classList.remove('active');
  },

  validerPaiement(event) {
    event.preventDefault();
    const id = Number(document.getElementById('cotisModalAdhId').value);
    const options = {
      date: document.getElementById('cotisModalDate').value,
      montant: parseFloat(document.getElementById('cotisModalMontant').value) || this.getMontant(),
      mode: document.getElementById('cotisModalMode').value,
      exercice: parseInt(document.getElementById('cotisModalExercice').value),
      notes: document.getElementById('cotisModalNotes').value.trim()
    };
    const r = this.enregistrer(id, options);
    if (r) {
      this.closePaiementModal();
      alert('✅ Cotisation enregistrée et validée.');
    }
  },

  openValidationModal(cotisId) {
    if (typeof Router !== 'undefined' && Router.mountIfNeeded && Router.registry['cotisations']) {
      Router.mountIfNeeded('cotisations', Router.registry['cotisations']);
    }
    const c = this.getAll().find(x => x.id === cotisId);
    if (!c) return;
    if (c.statut !== 'en_attente') { alert('Cette cotisation est déjà validée.'); return; }

    document.getElementById('cotisValidId').value = cotisId;
    document.getElementById('cotisValidNom').textContent = c.adherentNom;
    document.getElementById('cotisValidMontantInit').textContent = (c.montant || 0).toFixed(2) + ' €';
    document.getElementById('cotisValidSource').textContent = 
      c.source === 'formulaire-benevole' ? 'Formulaire bénévole' :
      c.source === 'import-yapla' ? 'Import Yapla' : 'Saisie manuelle';
    document.getElementById('cotisValidNote').textContent = c.note || '—';

    document.getElementById('cotisValidMontant').value = c.montant || 0;
    document.getElementById('cotisValidMode').value = (c.mode && c.mode !== 'à définir') ? c.mode : 'Espèces';
    document.getElementById('cotisValidDate').value = Utils.todayISO();
    document.getElementById('cotisValidNotes').value = '';

    document.getElementById('cotisValidationModal').classList.add('active');
  },

  closeValidationModal() {
    document.getElementById('cotisValidationModal').classList.remove('active');
  },

  confirmerValidation(event) {
    event.preventDefault();
    const id = Number(document.getElementById('cotisValidId').value);
    const options = {
      montant: parseFloat(document.getElementById('cotisValidMontant').value) || 0,
      mode: document.getElementById('cotisValidMode').value,
      date: document.getElementById('cotisValidDate').value,
      note: document.getElementById('cotisValidNotes').value.trim()
    };
    const ok = this.valider(id, options);
    if (ok) {
      this.closeValidationModal();
      alert('✅ Cotisation validée. Une recette a été créée en comptabilité et la date d\'expiration de l\'adhérent a été mise à jour (+1 an).');
    } else {
      alert('Erreur lors de la validation.');
    }
  },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucune cotisation.'); return; }
    const headers = ['Date', 'Adhérent', 'Montant', 'Mode', 'Exercice', 'Statut', 'Pièce compta', 'Source', 'Verrouillée', 'Notes'];
    let csv = headers.join(';') + '\n';
    list.forEach(c => {
      const statutTxt = c.statut === 'en_attente' ? 'En attente' : 'Validée';
      const row = [c.date, c.adherentNom, c.montant, c.mode, c.exercice, statutTxt, c.comptaPiece || '', c.source || 'manuelle', c.verrouille ? 'Oui' : 'Non', c.notes || c.note || '']
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
      csv += row + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cotisations_bricobol.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  },

  getViewHTML() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) years.push(y);
    const optionsYears = years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('');

    return `
      <section class="view" id="view-cotisations">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Cotisations</h1><p>Suivi des adhésions annuelles</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Cotisations.exportCSV()">📥 Export CSV</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card success clickable" onclick="Cotisations.openCollecteModal()" title="Voir le détail">
            <div class="stat-label">Collecté ${currentYear}</div>
            <div class="stat-value" id="cotisStatTotal">0,00 €</div>
            <div class="stat-sub">Cotisations validées</div>
          </div>
          <div class="stat-card clickable" onclick="Cotisations.openPayeModal()" title="Voir les adhérents à jour">
            <div class="stat-label">Ont payé</div>
            <div class="stat-value" id="cotisStatPaye">0</div>
            <div class="stat-sub">Adhérents</div>
          </div>
          <div class="stat-card warning clickable" onclick="Cotisations.openARenouvelerModal()" title="Voir les adhérents à recontacter">
            <div class="stat-label">À encaisser</div>
            <div class="stat-value" id="cotisStatRestant">0</div>
            <div class="stat-sub">En attente</div>
          </div>
          <div class="stat-card orange clickable" onclick="Cotisations.openAValiderModal()" title="Voir les paiements en attente">
            <div class="stat-label">À valider</div>
            <div class="stat-value" id="cotisStatAttente">0</div>
            <div class="stat-sub">Paiements en attente</div>
          </div>
        </div>

        <div class="card" style="padding:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            <select id="cotisMode" onchange="Cotisations.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              <option value="adherents">Vue adhérents</option>
              <option value="historique">Historique des paiements</option>
            </select>
            <select id="cotisFilterYear" onchange="Cotisations.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              ${optionsYears}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;">
            <input type="text" id="cotisSearch" placeholder="🔍 Rechercher un adhérent" oninput="Cotisations.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
            <select id="cotisFilterStatut" onchange="Cotisations.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              <option value="">Tous</option>
              <option value="paye">Payé</option>
              <option value="non_paye">Non payé</option>
              <option value="en_attente">En attente</option>
              <option value="validee">Validées uniquement</option>
            </select>
          </div>
        </div>

        <div id="cotisListContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="cotisDetailModal">
        <div class="modal-content" style="max-width:640px;">
          <div class="modal-header">
            <h2 id="cotisModalTitle">Détail</h2>
            <button class="close-btn" onclick="Cotisations.closeDetailModal()">&times;</button>
          </div>
          <div class="modal-body" id="cotisModalBody"></div>
        </div>
      </div>

      <div class="modal" id="cotisPaiementModal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h2>💶 Encaisser une cotisation</h2>
            <button class="close-btn" onclick="Cotisations.closePaiementModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Cotisations.validerPaiement(event)">
              <input type="hidden" id="cotisModalAdhId">
              <div style="background:#f0fdf4;padding:14px;border-radius:10px;margin-bottom:14px;">
                <div style="font-size:.75rem;color:var(--text-light);text-transform:uppercase;">Adhérent</div>
                <div style="font-size:1.1rem;font-weight:700;" id="cotisModalAdhNom">—</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Date d'encaissement</label><input type="date" id="cotisModalDate" required></div>
                <div class="form-group"><label>Montant (€)</label><input type="number" step="0.01" id="cotisModalMontant" required></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group">
                  <label>Mode de paiement</label>
                  <select id="cotisModalMode">
                    <option value="Espèces">Espèces</option>
                    <option value="Virement">Virement</option>
                    <option value="CB">CB</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
                <div class="form-group"><label>Exercice</label><input type="number" id="cotisModalExercice" required></div>
              </div>
              <div class="form-group"><label>Notes (optionnel)</label><textarea id="cotisModalNotes" rows="2"></textarea></div>
              <div style="background:#fef3c7;padding:10px;border-radius:8px;font-size:.82rem;margin-bottom:14px;">
                ℹ️ Une recette sera créée en comptabilité et la date d'expiration sera avancée d'un an.
              </div>
              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn btn-success" style="flex:1;">💾 Encaisser</button>
                <button type="button" class="btn btn-ghost" onclick="Cotisations.closePaiementModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal" id="cotisValidationModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>✅ Valider une cotisation en attente</h2>
            <button class="close-btn" onclick="Cotisations.closeValidationModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Cotisations.confirmerValidation(event)">
              <input type="hidden" id="cotisValidId">

              <div style="background:#fffbeb;border:1px solid #fcd34d;padding:14px;border-radius:10px;margin-bottom:14px;">
                <div style="font-size:.75rem;color:#92400e;text-transform:uppercase;font-weight:700;">Paiement à valider</div>
                <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;" id="cotisValidNom">—</div>
                <div style="font-size:.85rem;color:#92400e;">
                  Montant initial : <strong id="cotisValidMontantInit">0,00 €</strong><br>
                  Source : <span id="cotisValidSource">—</span><br>
                  Note : <span id="cotisValidNote">—</span>
                </div>
              </div>

              <p style="font-size:.85rem;color:var(--text-light);margin-bottom:14px;">
                Vérifiez que vous avez bien reçu le paiement avant de valider. Une recette sera créée en comptabilité et la date d'expiration de l'adhérent sera mise à jour (+1 an).
              </p>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group">
                  <label>Montant reçu (€)</label>
                  <input type="number" step="0.01" id="cotisValidMontant" required>
                  <small style="color:var(--text-light);font-size:.72rem;">Modifiable si différent</small>
                </div>
                <div class="form-group">
                  <label>Mode de paiement</label>
                  <select id="cotisValidMode">
                    <option value="Espèces">Espèces</option>
                    <option value="Virement">Virement</option>
                    <option value="CB">CB</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Date de réception</label>
                <input type="date" id="cotisValidDate" required>
              </div>

              <div class="form-group">
                <label>Notes internes (optionnel)</label>
                <textarea id="cotisValidNotes" rows="2" placeholder="Ex : chèque n° 1234 reçu le 15/03"></textarea>
              </div>

              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn btn-success" style="flex:1;">✅ Valider le paiement</button>
                <button type="button" class="btn btn-ghost" onclick="Cotisations.closeValidationModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  },

  onShow() { this.render(); }
};

Router.register({
  view: 'cotisations',
  title: 'Cotisations',
  icon: '💶',
  section: 'Activité',
  order: 4,
  getViewHTML: () => Cotisations.getViewHTML(),
  getModalsHTML: () => Cotisations.getModalsHTML(),
  onShow: () => Cotisations.onShow()
});
