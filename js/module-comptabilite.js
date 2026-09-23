// ============================================================
// MODULE : COMPTABILITÉ — Recettes, dépenses, modales détail
// ============================================================

const Compta = {
  currentType: 'recette',
  editingId: null,
  selectedNatures: [],
  sortField: 'date',
  sortAsc: false,

  getAll() { return Storage.getEntries(); },
  saveAll(list) { Storage.saveEntries(list); },

  setType(type) {
    this.currentType = type;
    const btnR = document.getElementById('btnRecette');
    const btnD = document.getElementById('btnDepense');
    if (btnR) btnR.classList.toggle('active', type === 'recette');
    if (btnD) btnD.classList.toggle('active', type === 'depense');
    const grp = document.getElementById('comptaInterventionGroup');
    if (grp) grp.style.display = type === 'depense' ? 'none' : 'block';
    const lbl = document.getElementById('comptaNatureLabel');
    if (lbl) lbl.textContent = type === 'recette' ? 'Nature de la recette & montant' : 'Nature du remboursement / dépense & montant';
    this.selectedNatures = [];
    this.updateNatureSelect();
    this.renderNatures();
    if (!this.editingId) this.updatePieceNumber();
  },

  updateNatureSelect() {
    const select = document.getElementById('comptaNature');
    if (!select) return;
    let html = '<option value="" disabled selected>-- Sélectionner une nature --</option>';
    if (this.currentType === 'recette') {
      const opts = [
        { val: "🎫 Adhésion (10 € / an)", montant: 10 },
        { val: "🎁 Don libre (Tirelire)" },
        { val: "🚗 Frais de route" },
        { val: "🏛️ Subvention" },
        { val: "✏️ Autre recette" }
      ];
      opts.forEach(o => html += `<option value="${o.val}" data-montant="${o.montant || ''}">${o.val}</option>`);
    } else {
      html += '<optgroup label="Charges fixes">';
      ["📱 Abonnement téléphone portable","🏦 Frais bancaires mensuels","🛡️ Assurance annuelle"].forEach(v => html += `<option value="${v}" data-cat="fixe">${v}</option>`);
      html += '</optgroup><optgroup label="Charges variables">';
      ["💡 Frais de fonctionnement","🖨️ Impression communication","🚗 Remboursement frais de route","🧰 Consommable","🎪 Évènement","✏️ Autre dépense"].forEach(v => html += `<option value="${v}" data-cat="variable">${v}</option>`);
      html += '</optgroup>';
    }
    select.innerHTML = html;
  },

  updatePieceNumber() {
    if (this.editingId) return;
    const el = document.getElementById('comptaPiece');
    if (!el) return;
    const prefix = this.currentType === 'recette' ? 'REC-' : 'DEP-';
    const count = this.getAll().filter(e => e.type === this.currentType).length + 1;
    el.value = prefix + String(count).padStart(3, '0');
  },

  addNature() {
    const sel = document.getElementById('comptaNature');
    const opt = sel.options[sel.selectedIndex];
    const val = sel.value;
    const customBox = document.getElementById('comptaCustomNatureContainer');
    if (val.includes('Autre')) { customBox.style.display = 'flex'; sel.selectedIndex = 0; return; }
    if (!val) return;
    const montant = parseFloat(opt.dataset.montant || 0);
    if (!this.selectedNatures.some(n => n.name === val)) {
      this.selectedNatures.push({ name: val, amount: montant, category: opt.dataset.cat || '' });
      this.renderNatures();
    }
    sel.selectedIndex = 0;
    customBox.style.display = 'none';
  },

  addCustomNature() {
    const inp = document.getElementById('comptaCustomNature');
    const v = inp.value.trim();
    if (!v) return;
    if (!this.selectedNatures.some(n => n.name === v)) {
      this.selectedNatures.push({ name: v, amount: 0, category: 'Autre' });
      this.renderNatures();
    }
    inp.value = '';
    document.getElementById('comptaCustomNatureContainer').style.display = 'none';
  },

  renderNatures() {
    const c = document.getElementById('comptaSelectedNatures');
    if (!c) return;
    let total = 0;
    c.innerHTML = this.selectedNatures.map((n, i) => {
      total += n.amount;
      return `<div class="nature-item">
        <span>${Utils.escapeHtml(n.name)}${n.category ? `<br><small style="color:var(--text-light);font-weight:400;">${n.category}</small>` : ''}</span>
        <input type="number" step="0.01" value="${n.amount || ''}" placeholder="0.00" oninput="Compta.updateNatureAmount(${i}, this.value)">
        <button type="button" onclick="Compta.removeNature(${i})">✕</button>
      </div>`;
    }).join('');
    const tot = document.getElementById('comptaMontantTotal');
    if (tot) tot.value = total.toFixed(2);
  },

  updateNatureAmount(i, val) {
    this.selectedNatures[i].amount = parseFloat(val) || 0;
    const total = this.selectedNatures.reduce((s, n) => s + n.amount, 0);
    document.getElementById('comptaMontantTotal').value = total.toFixed(2);
  },

  removeNature(i) { this.selectedNatures.splice(i, 1); this.renderNatures(); },

  save(event) {
    event.preventDefault();
    if (this.selectedNatures.length === 0) { alert('Ajoutez au moins une nature.'); return; }
    const total = this.selectedNatures.reduce((s, n) => s + n.amount, 0);
    const data = {
      type: this.currentType,
      date: document.getElementById('comptaDate').value,
      piece: document.getElementById('comptaPiece').value,
      yapla: document.getElementById('comptaYapla').value.trim() || '-',
      tiers: document.getElementById('comptaTiers').value.trim(),
      intervention: this.currentType === 'recette' ? document.getElementById('comptaIntervention').value : '-',
      paiement: document.getElementById('comptaPaiement').value,
      items: this.selectedNatures.map(n => ({ ...n })),
      total
    };
    const list = this.getAll();
    if (this.editingId) {
      const idx = list.findIndex(e => e.id === this.editingId);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
      this.editingId = null;
    } else {
      list.push({ id: Date.now(), ...data });
    }
    this.saveAll(list);
    this.resetForm();
    this.render();
    BricoBol.updateStorageInfo();
    alert('Opération enregistrée.');
  },

  resetForm() {
    this.editingId = null;
    this.selectedNatures = [];
    const t = document.getElementById('comptaTiers'); if (t) t.value = '';
    const y = document.getElementById('comptaYapla'); if (y) y.value = '';
    const i = document.getElementById('comptaIntervention'); if (i) i.selectedIndex = 0;
    this.renderNatures();
    this.updatePieceNumber();
  },

  render() {
    const list = this.getAll();
    const recettes = list.filter(e => e.type === 'recette').reduce((s, e) => s + e.total, 0);
    const depenses = list.filter(e => e.type === 'depense').reduce((s, e) => s + e.total, 0);
    const elS = document.getElementById('comptaSolde');
    const elR = document.getElementById('comptaRecettes');
    const elD = document.getElementById('comptaDepenses');
    const elN = document.getElementById('comptaNbOps');
    if (elS) elS.textContent = (recettes - depenses).toFixed(2) + ' €';
    if (elR) elR.textContent = recettes.toFixed(2) + ' €';
    if (elD) elD.textContent = depenses.toFixed(2) + ' €';
    if (elN) elN.textContent = list.length;
    const dash = document.getElementById('dashSolde');
    if (dash) dash.textContent = (recettes - depenses).toFixed(2) + ' €';

    // Liste : 5 dernières opérations
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const c = document.getElementById('comptaHistory');
    if (!c) return;
    if (sorted.length === 0) { c.innerHTML = '<div class="empty-state">Aucune opération.</div>'; return; }
    c.innerHTML = sorted.map(e => `
      <div class="histo-item">
        <div class="info">
          <div>${Utils.escapeHtml(e.tiers)} — ${e.items.map(i => Utils.escapeHtml(i.name)).join(', ')}</div>
          <div>${Utils.formatDate(e.date)} · ${Utils.escapeHtml(e.piece)} · ${e.paiement}</div>
        </div>
        <div class="amount ${e.type}">${e.type === 'recette' ? '+' : '−'}${e.total.toFixed(2)} €</div>
      </div>`).join('');
  },

  // ============================================================
  // MODALES DÉTAIL
  // ============================================================
  openSoldeModal() {
    const list = this.getAll();
    const recettes = list.filter(e => e.type === 'recette').reduce((s, e) => s + e.total, 0);
    const depenses = list.filter(e => e.type === 'depense').reduce((s, e) => s + e.total, 0);
    const solde = recettes - depenses;
    const nbRec = list.filter(e => e.type === 'recette').length;
    const nbDep = list.filter(e => e.type === 'depense').length;

    document.getElementById('comptaSoldeModalBody').innerHTML = `
      <div style="background:${solde >= 0 ? '#f0fdf4' : '#fef2f2'};border:1.5px solid ${solde >= 0 ? '#86efac' : '#fca5a5'};border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
        <div style="font-size:.8rem;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:6px;">Solde actuel</div>
        <div style="font-size:2.5rem;font-weight:800;color:${solde >= 0 ? '#166534' : '#991b1b'};letter-spacing:-.02em;">${solde.toFixed(2)} €</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;">
          <div style="font-size:.72rem;color:#1e40af;text-transform:uppercase;font-weight:700;margin-bottom:6px;">💙 Recettes</div>
          <div style="font-size:1.5rem;font-weight:800;color:#1e40af;">${recettes.toFixed(2)} €</div>
          <div style="font-size:.78rem;color:var(--text-light);margin-top:4px;">${nbRec} opération${nbRec > 1 ? 's' : ''}</div>
        </div>
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px;">
          <div style="font-size:.72rem;color:#9a3412;text-transform:uppercase;font-weight:700;margin-bottom:6px;">🧡 Dépenses</div>
          <div style="font-size:1.5rem;font-weight:800;color:#9a3412;">${depenses.toFixed(2)} €</div>
          <div style="font-size:.78rem;color:var(--text-light);margin-top:4px;">${nbDep} opération${nbDep > 1 ? 's' : ''}</div>
        </div>
      </div>

      <div style="background:var(--bg-alt);border-radius:10px;padding:14px;font-size:.9rem;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--border);">
          <span>Total recettes</span><strong style="color:var(--success);">+${recettes.toFixed(2)} €</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--border);">
          <span>Total dépenses</span><strong style="color:var(--danger);">−${depenses.toFixed(2)} €</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:1.05rem;">
          <strong>Solde net</strong><strong style="color:${solde >= 0 ? 'var(--success)' : 'var(--danger)'};">${solde.toFixed(2)} €</strong>
        </div>
      </div>`;

    document.getElementById('comptaSoldeModal').classList.add('active');
  },

  openRecettesModal() {
    this._openTypeModal('recette');
  },

  openDepensesModal() {
    this._openTypeModal('depense');
  },

  _openTypeModal(type) {
    const isRecette = type === 'recette';
    const list = this.getAll().filter(e => e.type === type).sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = list.reduce((s, e) => s + e.total, 0);

    const title = isRecette ? '💙 Recettes' : '🧡 Dépenses';
    const color = isRecette ? '#1e40af' : '#9a3412';
    const bg = isRecette ? '#eff6ff' : '#fff7ed';
    const border = isRecette ? '#bfdbfe' : '#fdba74';

    document.getElementById('comptaTypeModalTitle').textContent = title;
    document.getElementById('comptaTypeModalBody').innerHTML = `
      <div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:.72rem;color:${color};text-transform:uppercase;font-weight:700;">Total</div>
          <div style="font-size:1.6rem;font-weight:800;color:${color};">${total.toFixed(2)} €</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;font-weight:700;">Opérations</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--text);">${list.length}</div>
        </div>
      </div>

      ${list.length === 0
        ? '<div class="empty-state">Aucune opération.</div>'
        : `<div style="max-height:400px;overflow-y:auto;">
            ${list.map(e => `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:.88rem;">${Utils.escapeHtml(e.tiers)}</div>
                  <div style="font-size:.76rem;color:var(--text-light);">
                    📅 ${Utils.formatDate(e.date)} · ${Utils.escapeHtml(e.piece)} · ${e.paiement}
                  </div>
                  <div style="font-size:.76rem;color:var(--text-light);margin-top:2px;">
                    ${e.items.map(i => Utils.escapeHtml(i.name)).join(', ')}
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                  <div style="font-weight:800;color:${isRecette ? 'var(--success)' : 'var(--danger)'};font-size:.95rem;">
                    ${isRecette ? '+' : '−'}${e.total.toFixed(2)} €
                  </div>
                </div>
              </div>`).join('')}
          </div>`}

      <div style="display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
        <button class="btn btn-ghost" style="flex:1;" onclick="Compta.exportCSV()">📥 Export CSV</button>
        <button class="btn btn-ghost" style="flex:1;" onclick="Compta.exportExcel()">📊 Export Excel</button>
      </div>`;

    document.getElementById('comptaTypeModal').classList.add('active');
  },

  closeSoldeModal() { document.getElementById('comptaSoldeModal').classList.remove('active'); },
  closeTypeModal() { document.getElementById('comptaTypeModal').classList.remove('active'); },

  openTable() { document.getElementById('comptaTableModal').classList.add('active'); this.renderTable(); },
  closeTable() { document.getElementById('comptaTableModal').classList.remove('active'); },

  sortBy(field) {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
    this.renderTable();
  },

  renderTable() {
    const q = (document.getElementById('comptaSearch').value || '').toLowerCase();
    let list = this.getAll();
    if (q) list = list.filter(e => [e.date, e.piece, e.yapla, e.tiers, e.paiement, e.items.map(i => i.name).join(' ')].join(' ').toLowerCase().includes(q));
    list.sort((a, b) => {
      let va = a[this.sortField] || '', vb = b[this.sortField] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this.sortAsc ? -1 : 1;
      if (va > vb) return this.sortAsc ? 1 : -1;
      return 0;
    });
    const tbody = document.getElementById('comptaTableBody');
    if (!tbody) return;
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="11" style="padding:20px;text-align:center;color:var(--text-light);">Aucune donnée</td></tr>'; return; }
    const sortedByDate = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    const cumulMap = {};
    let c = 0;
    sortedByDate.forEach(e => { c += e.type === 'recette' ? e.total : -e.total; cumulMap[e.id] = c; });
    tbody.innerHTML = list.map(e => `
      <tr>
        <td style="padding:8px;border:1px solid var(--border);">${Utils.formatDate(e.date)}</td>
        <td style="padding:8px;border:1px solid var(--border);">${Utils.escapeHtml(e.piece)}</td>
        <td style="padding:8px;border:1px solid var(--border);">${Utils.escapeHtml(e.yapla)}</td>
        <td style="padding:8px;border:1px solid var(--border);">${Utils.escapeHtml(e.tiers)}</td>
        <td style="padding:8px;border:1px solid var(--border);">${Utils.escapeHtml(e.intervention)}</td>
        <td style="padding:8px;border:1px solid var(--border);">${e.items.map(i => Utils.escapeHtml(i.name) + ' (' + i.amount.toFixed(2) + '€)').join('<br>')}</td>
        <td style="padding:8px;border:1px solid var(--border);">${e.paiement}</td>
        <td style="padding:8px;border:1px solid var(--border);color:var(--success);font-weight:600;">${e.type === 'recette' ? e.total.toFixed(2) : ''}</td>
        <td style="padding:8px;border:1px solid var(--border);color:var(--danger);font-weight:600;">${e.type === 'depense' ? e.total.toFixed(2) : ''}</td>
        <td style="padding:8px;border:1px solid var(--border);font-weight:700;">${cumulMap[e.id].toFixed(2)}</td>
        <td style="padding:8px;border:1px solid var(--border);">
          <button onclick="Compta.edit(${e.id})" style="background:var(--accent);color:#fff;border:none;padding:5px 8px;border-radius:6px;cursor:pointer;margin-right:4px;">✏️</button>
          <button onclick="Compta.remove(${e.id})" style="background:var(--danger);color:#fff;border:none;padding:5px 8px;border-radius:6px;cursor:pointer;">🗑️</button>
        </td>
      </tr>`).join('');
  },

  edit(id) {
    const e = this.getAll().find(x => x.id === id);
    if (!e) return;
    this.editingId = id;
    this.setType(e.type);
    document.getElementById('comptaDate').value = e.date;
    document.getElementById('comptaPiece').value = e.piece;
    document.getElementById('comptaYapla').value = e.yapla;
    document.getElementById('comptaTiers').value = e.tiers;
    document.getElementById('comptaIntervention').value = e.intervention;
    document.getElementById('comptaPaiement').value = e.paiement;
    this.selectedNatures = e.items.map(i => ({ ...i }));
    this.renderNatures();
    this.closeTable();
    Router.go('comptabilite');
  },

  remove(id) {
    if (!confirm('Supprimer cette opération ?')) return;
    this.saveAll(this.getAll().filter(e => e.id !== id));
    this.render();
    this.renderTable();
    BricoBol.updateStorageInfo();
  },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucune donnée.'); return; }
    const headers = ['Date','N° Pièce','ID Yapla','Tiers','Intervention','Nature & Montant','Paiement','Encaissement','Décaissement','Solde cumulé'];
    let csv = headers.join(';') + '\n';
    let cumul = 0;
    [...list].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(e => {
      cumul += e.type === 'recette' ? e.total : -e.total;
      const items = e.items.map(i => `${i.name} (${i.amount.toFixed(2)})`).join(' | ');
      const row = [e.date, e.piece, e.yapla, e.tiers, e.intervention, items, e.paiement,
        e.type === 'recette' ? e.total.toFixed(2) : '',
        e.type === 'depense' ? e.total.toFixed(2) : '', cumul.toFixed(2)]
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
      csv += row + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'comptabilite_bricobol.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  },

  exportExcel() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucune donnée.'); return; }
    if (typeof XLSX === 'undefined') { alert('SheetJS non chargé.'); return; }

    const rows = [[
      'Date', 'N° Pièce', 'Yapla', 'Tiers', 'Intervention',
      'Nature & Montant', 'Paiement', 'Encaissement', 'Décaissement', 'Solde cumulé'
    ]];

    let cumul = 0;
    const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(e => {
      cumul += e.type === 'recette' ? e.total : -e.total;
      const items = e.items.map(i => `${i.name} (${i.amount.toFixed(2)})`).join(' | ');
      rows.push([
        Utils.formatDate(e.date),
        e.piece || '',
        e.yapla || '',
        e.tiers || '',
        e.intervention || '',
        items,
        e.paiement || '',
        e.type === 'recette' ? e.total : '',
        e.type === 'depense' ? e.total : '',
        cumul
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 25 }, { wch: 20 },
      { wch: 45 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let r = 1; r <= range.e.r; r++) {
      for (let c of [7, 8, 9]) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (ws[addr] && typeof ws[addr].v === 'number') {
          ws[addr].z = '#,##0.00 €';
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Comptabilité');
    XLSX.writeFile(wb, 'comptabilite_bricobol_' + Utils.todayISO() + '.xlsx');
  },

  getViewHTML() {
    return `
      <section class="view" id="view-comptabilite">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Comptabilité</h1><p>Recettes, dépenses et suivi du solde</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Compta.openTable()">📊 Grand tableau</button>
            <button class="btn btn-ghost" onclick="Compta.exportCSV()">📥 CSV</button>
            <button class="btn btn-ghost" onclick="Compta.exportExcel()">📊 Excel</button>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card success clickable" onclick="Compta.openSoldeModal()" title="Voir le détail du solde">
            <div class="stat-label">Solde actuel</div>
            <div class="stat-value" id="comptaSolde">0,00 €</div>
            <div class="stat-sub">Recettes − Dépenses</div>
          </div>
          <div class="stat-card clickable" onclick="Compta.openRecettesModal()" title="Voir toutes les recettes">
            <div class="stat-label">Recettes</div>
            <div class="stat-value" id="comptaRecettes">0,00 €</div>
            <div class="stat-sub">Total encaissé</div>
          </div>
          <div class="stat-card orange clickable" onclick="Compta.openDepensesModal()" title="Voir toutes les dépenses">
            <div class="stat-label">Dépenses</div>
            <div class="stat-value" id="comptaDepenses">0,00 €</div>
            <div class="stat-sub">Total décaissé</div>
          </div>
          <div class="stat-card purple clickable" onclick="Compta.openTable()" title="Voir le grand tableau">
            <div class="stat-label">Opérations</div>
            <div class="stat-value" id="comptaNbOps">0</div>
            <div class="stat-sub">Total enregistré</div>
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">Nouvelle opération</h3>
          <form id="comptaForm" onsubmit="Compta.save(event)">
            <input type="hidden" id="comptaEditId">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <button type="button" class="type-btn active recette" id="btnRecette" onclick="Compta.setType('recette')">➕ Recette</button>
              <button type="button" class="type-btn depense" id="btnDepense" onclick="Compta.setType('depense')">➖ Dépense</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="form-group"><label>Date</label><input type="date" id="comptaDate" required></div>
              <div class="form-group"><label>N° Pièce</label><input type="text" id="comptaPiece" required></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="form-group"><label>ID Yapla (optionnel)</label><input type="text" id="comptaYapla" placeholder="YAP-1024 ou -"></div>
              <div class="form-group"><label>Tiers / Bénéficiaire</label><input type="text" id="comptaTiers" list="comptaTiersList" placeholder="Nom" required><datalist id="comptaTiersList"></datalist></div>
            </div>
            <div class="form-group" id="comptaInterventionGroup">
              <label>Nature de l'intervention (gratuite)</label>
              <select id="comptaIntervention">
                <option value="Aucune / Autre">-- Aucune / Autre --</option>
                <option value="🛠️ Petit Bricolage">🛠️ Petit Bricolage</option>
                <option value="🌿 Entretien des accès">🌿 Entretien des accès</option>
                <option value="📦 Manutention & Livraison">📦 Manutention & Livraison</option>
                <option value="💻 Numérique">💻 Numérique</option>
                <option value="⚡ Électroménager">⚡ Électroménager</option>
                <option value="🍎 Cueillette solidaire">🍎 Cueillette solidaire</option>
              </select>
            </div>
            <div class="form-group">
              <label id="comptaNatureLabel">Nature & Montant</label>
              <select id="comptaNature" onchange="Compta.addNature()">
                <option value="" disabled selected>-- Sélectionner une nature --</option>
              </select>
              <div id="comptaCustomNatureContainer" style="margin-top:8px;display:none;gap:8px;">
                <input type="text" id="comptaCustomNature" placeholder="Autre libellé...">
                <button type="button" onclick="Compta.addCustomNature()" class="btn btn-secondary" style="padding:0 16px;">Ajouter</button>
              </div>
              <div id="comptaSelectedNatures" style="margin-top:12px;"></div>
            </div>
            <div class="form-group">
              <label>Mode de paiement</label>
              <select id="comptaPaiement">
                <option value="Espèces">Espèces</option>
                <option value="Virement">Virement</option>
                <option value="CB">CB</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div class="form-group" style="background:#f0fdf4;padding:14px;border-radius:10px;border:1px solid #dcfce7;">
              <label style="color:#166534;font-size:.95rem;">Montant total (€)</label>
              <input type="number" step="0.01" id="comptaMontantTotal" placeholder="0.00" readonly style="background:#fff;font-weight:bold;font-size:1.15rem;color:#166534;">
            </div>
            <button type="submit" class="btn" style="width:100%;">💾 Enregistrer l'opération</button>
          </form>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:12px;color:var(--primary);font-weight:700;">Dernières opérations</h3>
          <div id="comptaHistory"></div>
        </div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <!-- Modale SOLDE -->
      <div class="modal" id="comptaSoldeModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>💚 Détail du solde</h2>
            <button class="close-btn" onclick="Compta.closeSoldeModal()">&times;</button>
          </div>
          <div class="modal-body" id="comptaSoldeModalBody"></div>
        </div>
      </div>

      <!-- Modale RECETTES / DÉPENSES -->
      <div class="modal" id="comptaTypeModal">
        <div class="modal-content" style="max-width:640px;">
          <div class="modal-header">
            <h2 id="comptaTypeModalTitle">Détail</h2>
            <button class="close-btn" onclick="Compta.closeTypeModal()">&times;</button>
          </div>
          <div class="modal-body" id="comptaTypeModalBody"></div>
        </div>
      </div>

      <!-- Grand tableau -->
      <div class="modal" id="comptaTableModal">
        <div class="modal-content" style="max-width:1200px;">
          <div class="modal-header">
            <h2>Grand tableau — Comptabilité</h2>
            <button class="close-btn" onclick="Compta.closeTable()">&times;</button>
          </div>
          <div class="modal-body">
            <input type="text" id="comptaSearch" placeholder="🔍 Rechercher…" oninput="Compta.renderTable()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;">
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:.85rem;white-space:nowrap;">
                <thead>
                  <tr style="background:#f1f5f9;">
                    <th style="padding:10px;border:1px solid var(--border);cursor:pointer;" onclick="Compta.sortBy('date')">Date</th>
                    <th style="padding:10px;border:1px solid var(--border);cursor:pointer;" onclick="Compta.sortBy('piece')">N° Pièce</th>
                    <th style="padding:10px;border:1px solid var(--border);cursor:pointer;" onclick="Compta.sortBy('yapla')">Yapla</th>
                    <th style="padding:10px;border:1px solid var(--border);cursor:pointer;" onclick="Compta.sortBy('tiers')">Tiers</th>
                    <th style="padding:10px;border:1px solid var(--border);">Intervention</th>
                    <th style="padding:10px;border:1px solid var(--border);">Nature & Montant</th>
                    <th style="padding:10px;border:1px solid var(--border);">Paiement</th>
                    <th style="padding:10px;border:1px solid var(--border);">Encaissement</th>
                    <th style="padding:10px;border:1px solid var(--border);">Décaissement</th>
                    <th style="padding:10px;border:1px solid var(--border);">Solde cumulé</th>
                    <th style="padding:10px;border:1px solid var(--border);">Actions</th>
                  </tr>
                </thead>
                <tbody id="comptaTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
  },
  refreshTiersList() {
    const dl = document.getElementById('comptaTiersList');
    if (!dl) return;
    const contacts = Storage.getAdherents()
      .filter(a => a.prenom && a.nom)
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    dl.innerHTML = contacts.map(c => 
      `<option value="${Utils.escapeHtml(c.prenom + ' ' + c.nom)}"></option>`
    ).join('');
  },

  mount() {
    this.setType('recette');
    this.refreshTiersList();
    const d = document.getElementById('comptaDate');
    if (d) d.value = Utils.todayISO();
  },

  onShow() { this.render(); }
};

// ---- Enregistrement ----
Router.register({
  view: 'comptabilite',
  title: 'Comptabilité',
  icon: '💰',
  section: 'Gestion',
  order: 1,
  getViewHTML: () => Compta.getViewHTML(),
  getModalsHTML: () => Compta.getModalsHTML(),
  mount: () => Compta.mount(),
  onShow: () => Compta.onShow()
});
