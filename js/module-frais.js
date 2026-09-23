// ============================================================
// MODULE : BÉNÉVOLES & FRAIS — Remboursement + compta
// ============================================================

const Frais = {

  BAREME_DEFAUT: 0.40,
  repartitionTemp: [],
  calculEnCours: false,

  getAll() { return Storage.getDeplacements(); },
  saveAll(list) { Storage.saveDeplacements(list); },

  getBareme() {
    const p = Storage.getParametres();
    return p.baremeKm || this.BAREME_DEFAUT;
  },

  nextNumero() {
    const n = this.getAll().length + 1;
    return 'DEP-' + String(n).padStart(3, '0');
  },

  getFiltered() {
    const q = (document.getElementById('fraisSearch').value || '').toLowerCase();
    const filtre = document.getElementById('fraisFilterStatut').value;
    return this.getAll().filter(f => {
      if (q) {
        const hay = [f.numero, f.benevole, f.motif, f.trajet].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filtre === 'a_rembourser' && f.rembourse) return false;
      if (filtre === 'rembourse' && !f.rembourse) return false;
      return true;
    });
  },

  render() {
    const container = document.getElementById('fraisListContainer');
    if (!container) return;
    const all = this.getAll();
    const list = this.getFiltered();

    const aRembourser = all.filter(f => !f.rembourse).reduce((s, f) => s + (f.montant || 0), 0);
    const totalKm = all.reduce((s, f) => s + (f.km || 0), 0);
    const totalRembourse = all.filter(f => f.rembourse).reduce((s, f) => s + (f.montant || 0), 0);

    const elAR = document.getElementById('fraisStatARembourser');
    const elKm = document.getElementById('fraisStatKm');
    const elNb = document.getElementById('fraisStatNb');
    const elTot = document.getElementById('fraisStatTotal');
    if (elAR) elAR.textContent = aRembourser.toFixed(2) + ' €';
    if (elKm) elKm.textContent = totalKm.toFixed(0) + ' km';
    if (elNb) elNb.textContent = all.length;
    if (elTot) elTot.textContent = totalRembourse.toFixed(2) + ' €';

    const cnt = document.getElementById('fraisCount');
    if (cnt) cnt.textContent = `${list.length} déplacement${list.length > 1 ? 's' : ''} · Barème : ${this.getBareme().toFixed(2)} €/km`;

    if (list.length === 0) {
      container.innerHTML = '<div class="card"><div class="empty-state">Aucun déplacement. Cliquez sur « ➕ Nouveau déplacement ».</div></div>';
      return;
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = list.map(f => this.renderCard(f)).join('');
  },

  renderCard(f) {
    const statut = f.rembourse ? 'success' : 'warning';
    const badge = f.rembourse ? '<span class="badge badge-success">Remboursé</span>' : '<span class="badge badge-warning">À rembourser</span>';
    const nbInter = (f.interventions || []).length;
    const infoInter = nbInter > 0 ? ` · <strong>${nbInter} intervention${nbInter > 1 ? 's' : ''}</strong> (prorata)` : '';
    return `
      <div class="adh-card statut-${statut}" onclick="Frais.openDetail(${f.id})">
        <div class="adh-card-info">
          <div class="adh-card-name">
            <span class="adh-card-numero">${Utils.escapeHtml(f.numero)}</span>
            ${Utils.escapeHtml(f.benevole)} — ${f.km} km
          </div>
          <div class="adh-card-details">
            📅 ${Utils.formatDate(f.date)} · 🚗 ${Utils.escapeHtml(f.trajet || '—')}<br>
            💶 <strong>${(f.montant || 0).toFixed(2)} €</strong>${infoInter}<br>
            ${badge} ${f.motif ? '· ' + Utils.escapeHtml(f.motif) : ''}
            ${f.comptaPiece ? ' · 💰 ' + Utils.escapeHtml(f.comptaPiece) : ''}
          </div>
        </div>
        <div class="adh-card-actions">
          ${!f.rembourse ? `<button style="background:var(--success);color:#fff;border:none;border-radius:8px;padding:8px;cursor:pointer;min-width:36px;height:36px;" onclick="event.stopPropagation();Frais.openRembourseModal(${f.id})" title="Marquer remboursé">✅</button>` : ''}
          <button class="adh-btn-edit" onclick="event.stopPropagation();Frais.openForm(${f.id})" title="Modifier">✏️</button>
          <button class="adh-btn-del" onclick="event.stopPropagation();Frais.remove(${f.id})" title="Supprimer">🗑️</button>
        </div>
      </div>`;
  },

  openForm(id = null) {
    const form = document.getElementById('fraisForm');
    form.reset();
    document.getElementById('fraisEditId').value = '';
    this.repartitionTemp = [];
    this.refreshBenevolesFraisList();
    this.refreshInterventionsList();
    const baremeEl = document.getElementById('fraisBaremeAffiche');
    if (baremeEl) baremeEl.textContent = this.getBareme().toFixed(2);
    const statut = document.getElementById('fraisCalcStatut');
    if (statut) statut.innerHTML = '';

    if (id) {
      const f = this.getAll().find(x => x.id === id);
      if (!f) return;
      document.getElementById('fraisFormTitle').textContent = 'Modifier ' + f.numero;
      document.getElementById('fraisEditId').value = f.id;
      document.getElementById('fraisDate').value = f.date || '';
      document.getElementById('fraisBenevole').value = f.benevole || '';
      document.getElementById('fraisKm').value = f.km || '';
      document.getElementById('fraisTrajet').value = f.trajet || '';
      document.getElementById('fraisMotif').value = f.motif || '';
      document.getElementById('fraisNotes').value = f.notes || '';
      document.getElementById('fraisRembourse').checked = !!f.rembourse;
      if (Array.isArray(f.interventions) && f.interventions.length > 0 && typeof f.interventions[0] === 'object') {
        this.repartitionTemp = f.interventions.map(i => ({ ...i }));
      }
    } else {
      document.getElementById('fraisFormTitle').textContent = 'Nouveau déplacement';
      document.getElementById('fraisDate').value = Utils.todayISO();
    }
    this.renderRepartition();
    this.updateMontant();
    document.getElementById('fraisFormModal').classList.add('active');
  },

  closeForm() { document.getElementById('fraisFormModal').classList.remove('active'); },

  refreshBenevolesFraisList() {
    const dl = document.getElementById('benevolesFraisList');
    if (!dl) return;
    const list = Storage.getAdherents().filter(a => 
      a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole === true)
    );
    dl.innerHTML = list.map(b => `<option value="${Utils.escapeHtml(b.prenom + ' ' + b.nom)}"></option>`).join('');
  },

  refreshInterventionsList() {
    const sel = document.getElementById('fraisInterventions');
    if (!sel) return;
    if (typeof Interventions === 'undefined') return;
    const inter = Interventions.getAll().filter(i => i.statut === 'demande' || i.statut === 'terminee' || i.statut === 'en_cours' || i.statut === 'planifiee');
    sel.innerHTML = inter.map(i => `<option value="${Utils.escapeHtml(i.numero)}">${Utils.escapeHtml(i.numero)} · ${Utils.escapeHtml(i.demandeur)} · ${Utils.escapeHtml(i.type)}</option>`).join('');
  },

  syncRepartitionFromSelect() {
    const sel = document.getElementById('fraisInterventions');
    if (!sel) return;
    const selected = Array.from(sel.selectedOptions).map(o => o.value);
    const newRep = selected.map(num => {
      const existing = this.repartitionTemp.find(r => r.numero === num);
      return existing || { numero: num, kmIndividuel: 0, part: 0 };
    });
    this.repartitionTemp = newRep;
    this.renderRepartition();
    this.updateMontant();
  },

  renderRepartition() {
    const container = document.getElementById('fraisRepartitionContainer');
    if (!container) return;
    if (this.repartitionTemp.length === 0) {
      container.innerHTML = '<div style="padding:10px;color:var(--text-light);font-size:.85rem;text-align:center;border:1px dashed var(--border);border-radius:8px;">Sélectionnez au moins une intervention ci-dessus pour activer la répartition au prorata.</div>';
      return;
    }
    let html = '<div style="font-size:.8rem;color:var(--text-light);margin-bottom:8px;">Distance individuelle (si l\'intervention avait été seule).</div>';
    this.repartitionTemp.forEach((r, i) => {
      html += `
        <div style="display:grid;grid-template-columns:1fr 100px 90px;gap:8px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--bg-alt);">
          <div style="font-size:.82rem;font-weight:600;">${Utils.escapeHtml(r.numero)}</div>
          <input type="number" step="1" min="0" placeholder="km seul" value="${r.kmIndividuel || ''}" oninput="Frais.setKmIndividuel(${i}, this.value)" style="padding:6px;border:1px solid var(--border);border-radius:6px;font-size:.85rem;">
          <div id="fraisPart_${i}" style="text-align:right;font-weight:700;font-size:.88rem;color:var(--accent);">${(r.part || 0).toFixed(2)} €</div>
        </div>`;
    });
    container.innerHTML = html;
  },

  setKmIndividuel(i, val) {
    this.repartitionTemp[i].kmIndividuel = parseFloat(val) || 0;
    this.updateMontant();
  },

  updateMontant() {
    const kmTotal = parseFloat(document.getElementById('fraisKm').value) || 0;
    const bareme = this.getBareme();
    const coutReel = kmTotal * bareme;
    const totalKmInd = this.repartitionTemp.reduce((s, r) => s + (r.kmIndividuel || 0), 0);

    if (totalKmInd > 0) {
      this.repartitionTemp.forEach(r => {
        r.part = (r.kmIndividuel / totalKmInd) * coutReel;
      });
    } else {
      this.repartitionTemp.forEach(r => { r.part = 0; });
    }

    const el = document.getElementById('fraisMontant');
    if (el) el.value = coutReel.toFixed(2) + ' €';

    this.repartitionTemp.forEach((r, i) => {
      const partEl = document.getElementById('fraisPart_' + i);
      if (partEl) partEl.textContent = (r.part || 0).toFixed(2) + ' €';
    });

    const rec = document.getElementById('fraisRecapProrata');
    if (rec) {
      if (this.repartitionTemp.length === 0) {
        rec.style.display = 'none';
      } else if (totalKmInd === 0) {
        rec.style.display = 'block';
        rec.innerHTML = `<div style="font-size:.82rem;color:var(--warning);">💡 Saisissez les distances individuelles pour calculer la répartition.</div>`;
      } else {
        rec.style.display = 'block';
        const sommeParts = this.repartitionTemp.reduce((s, r) => s + r.part, 0);
        const economie = totalKmInd * bareme - coutReel;
        const pctEco = (totalKmInd * bareme) > 0 ? ((economie / (totalKmInd * bareme)) * 100).toFixed(0) : 0;
        rec.innerHTML = `
          <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;font-size:.82rem;">
            <div style="font-weight:700;margin-bottom:6px;color:#1e40af;">📊 Récapitulatif du prorata</div>
            <div>Coût réel de la tournée : <strong>${coutReel.toFixed(2)} €</strong> (${kmTotal} km × ${bareme.toFixed(2)} €)</div>
            <div>Total virtuel (si séparés) : <strong>${(totalKmInd * bareme).toFixed(2)} €</strong> (${totalKmInd} km)</div>
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #bfdbfe;">
              Économie totale : <strong style="color:var(--success);">${economie.toFixed(2)} €</strong> (${pctEco} %)
            </div>
            <div style="margin-top:6px;font-size:.78rem;color:var(--text-light);">
              Vérification : somme des parts = ${sommeParts.toFixed(2)} € ✓
            </div>
          </div>`;
      }
    }
  },

  async geocode(adresse) {
    if (!adresse) return null;
    try {
      const urlFR = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`;
      const resFR = await fetch(urlFR);
      if (resFR.ok) {
        const dataFR = await resFR.json();
        if (dataFR.features && dataFR.features.length > 0) {
          const coords = dataFR.features[0].geometry.coordinates;
          console.log('✅ BAN géocodé :', adresse, '→', coords);
          return [coords[0], coords[1]];
        }
      }
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          console.log('✅ Nominatim géocodé :', adresse);
          return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
        }
      }
      console.warn('❌ Adresse introuvable :', adresse);
      return null;
    } catch (e) {
      console.error('Geocode error:', adresse, e);
      return null;
    }
  },

  async route(points) {
    if (points.length < 2) return 0;
    try {
      const coords = points.map(p => `${p[0]},${p[1]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.routes && data.routes[0]) {
        return data.routes[0].distance / 1000;
      }
      return 0;
    } catch (e) {
      console.error('Route error:', e);
      return 0;
    }
  },

  async calculerDistances() {
    if (this.calculEnCours) return;
    const statut = document.getElementById('fraisCalcStatut');
    const setStatut = (msg, color = 'var(--text-light)') => {
      if (statut) statut.innerHTML = `<span style="color:${color};">${msg}</span>`;
    };

    const benevoleNom = document.getElementById('fraisBenevole').value.trim();
    if (!benevoleNom) { alert('Sélectionnez d\'abord un bénévole.'); return; }
    const benevole = Storage.getAdherents().find(a => 
      a.type === 'Bénévole' && 
      `${a.prenom} ${a.nom}`.toLowerCase() === benevoleNom.toLowerCase()
    );
    if (!benevole) { alert('Bénévole introuvable dans l\'annuaire.'); return; }

    const adresseDepart = benevole.adresseDepart || 
      [benevole.adresse, benevole.cp, benevole.ville, benevole.pays].filter(Boolean).join(', ');
    if (!adresseDepart) { alert('Le bénévole n\'a pas d\'adresse renseignée.'); return; }

    if (this.repartitionTemp.length === 0) {
      alert('Sélectionnez au moins une intervention.');
      return;
    }

    this.calculEnCours = true;
    setStatut('⏳ Géocodage de l\'adresse de départ...', 'var(--accent)');

    const coordsDepart = await this.geocode(adresseDepart);
    if (!coordsDepart) {
      setStatut('❌ Impossible de géocoder l\'adresse de départ : ' + adresseDepart, 'var(--danger)');
      this.calculEnCours = false;
      return;
    }

    const arrets = [];
    const problemes = [];

    for (let i = 0; i < this.repartitionTemp.length; i++) {
      const r = this.repartitionTemp[i];
      setStatut(`⏳ Géocodage ${i + 1}/${this.repartitionTemp.length} : ${r.numero}...`, 'var(--accent)');

      const inter = (typeof Interventions !== 'undefined')
        ? Interventions.getAll().find(x => x.numero === r.numero)
        : null;
      if (!inter) {
        arrets.push(null);
        problemes.push(`${r.numero} : intervention introuvable`);
        continue;
      }

      let adresseArret = null;
      let adh = null;

      if (inter.adherentId) {
        adh = Storage.getAdherents().find(a => a.id === inter.adherentId);
      }

      if (!adh && inter.demandeur) {
        const nomCherche = inter.demandeur.toLowerCase().trim();
        adh = Storage.getAdherents().find(a => {
          const nomComplet = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase().trim();
          const nomInverse = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase().trim();
          return nomComplet === nomCherche || nomInverse === nomCherche;
        });
        if (!adh) {
          const mots = nomCherche.split(/\s+/).filter(m => m.length > 1);
          if (mots.length >= 2) {
            adh = Storage.getAdherents().find(a => {
              const prenom = (a.prenom || '').toLowerCase();
              const nom = (a.nom || '').toLowerCase();
              return mots.every(m => prenom.includes(m) || nom.includes(m));
            });
          }
        }
      }

      if (adh) {
        adresseArret = [adh.adresse, adh.cp, adh.ville].filter(Boolean).join(', ');
      }

      if (!adresseArret && inter.description) {
        const match = inter.description.match(/Adresse\s*:\s*([^\n]+)/i);
        if (match && match[1]) adresseArret = match[1].trim();
      }

      if (!adresseArret) {
        arrets.push(null);
        problemes.push(`${r.numero} : adresse introuvable pour "${inter.demandeur}"`);
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      const coords = await this.geocode(adresseArret);
      arrets.push(coords);
      if (!coords) problemes.push(`${r.numero} : géocodage échoué (${adresseArret})`);
    }

    const pointsTournee = [coordsDepart, ...arrets.filter(Boolean), coordsDepart];
    setStatut('🚗 Calcul de l\'itinéraire complet...', 'var(--accent)');
    const kmTotal = Math.round(await this.route(pointsTournee));

    for (let i = 0; i < arrets.length; i++) {
      if (!arrets[i]) { this.repartitionTemp[i].kmIndividuel = 0; continue; }
      setStatut(`🚗 Trajet individuel ${i + 1}/${arrets.length}...`, 'var(--accent)');
      await new Promise(resolve => setTimeout(resolve, 200));
      const kmInd = await this.route([coordsDepart, arrets[i], coordsDepart]);
      this.repartitionTemp[i].kmIndividuel = Math.round(kmInd);
    }

    document.getElementById('fraisKm').value = kmTotal;
    if (!document.getElementById('fraisTrajet').value) {
      document.getElementById('fraisTrajet').value = 'Départ → ' + this.repartitionTemp.map(r => r.numero).join(' → ') + ' → Retour';
    }
    this.renderRepartition();
    this.updateMontant();

    const nbManquants = arrets.filter(a => a === null).length;
    setStatut(
      `✅ Calcul terminé : ${kmTotal} km (${this.repartitionTemp.length} interventions)` +
      (nbManquants > 0 ? ` — ⚠️ ${nbManquants} adresse(s) introuvable(s)` : ''),
      nbManquants > 0 ? 'var(--warning)' : 'var(--success)'
    );

    if (problemes.length > 0) {
      setTimeout(() => {
        alert('⚠️ Problèmes détectés :\n\n' + problemes.join('\n'));
      }, 500);
    }

    this.calculEnCours = false;
  },

  save(event) {
    event.preventDefault();
    const id = document.getElementById('fraisEditId').value;
    const km = parseFloat(document.getElementById('fraisKm').value) || 0;
    const bareme = this.getBareme();
    const coutReel = km * bareme;

    const data = {
      date: document.getElementById('fraisDate').value,
      benevole: document.getElementById('fraisBenevole').value.trim(),
      km,
      trajet: document.getElementById('fraisTrajet').value.trim(),
      motif: document.getElementById('fraisMotif').value.trim(),
      notes: document.getElementById('fraisNotes').value.trim(),
      rembourse: document.getElementById('fraisRembourse').checked,
      montant: coutReel,
      bareme,
      interventions: this.repartitionTemp.map(r => ({
        numero: r.numero,
        kmIndividuel: r.kmIndividuel || 0,
        part: r.part || 0
      }))
    };
    if (!data.benevole || km <= 0) { alert('Bénévole et kilométrage obligatoires.'); return; }

    const list = this.getAll();
    if (id) {
      const idx = list.findIndex(f => String(f.id) === String(id));
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: Date.now(), numero: this.nextNumero(), ...data });
    }
    this.saveAll(list);
    this.closeForm();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    BricoBol.updateStorageInfo();
  },

  remove(id) {
    const f = this.getAll().find(x => x.id === id);
    if (!f) return;
    if (!confirm(`Supprimer le déplacement ${f.numero} ?`)) return;
    this.saveAll(this.getAll().filter(x => x.id !== id));
    this.render();
    this.closeDetail();
    BricoBol.updateStorageInfo();
  },

  // ============================================================
  // REMBOURSEMENT
  // ============================================================

  openRembourseModal(id) {
    const f = this.getAll().find(x => x.id === id);
    if (!f) return;

    if (f.rembourse) {
      alert(`ℹ️ Ce déplacement est déjà remboursé${f.dateRemboursement ? ' le ' + Utils.formatDate(f.dateRemboursement) : ''}.\n\nPour modifier, supprimez l'écriture comptable associée et annulez le remboursement manuellement.`);
      return;
    }

    document.getElementById('fraisRembId').value = id;
    document.getElementById('fraisRembBenevole').textContent = f.benevole;
    document.getElementById('fraisRembMontant').textContent = (f.montant || 0).toFixed(2) + ' €';
    document.getElementById('fraisRembDate').value = Utils.todayISO();
    document.getElementById('fraisRembMode').value = 'Espèces';
    document.getElementById('fraisRembNotes').value = '';

    document.getElementById('fraisRembourseModal').classList.add('active');
  },

  closeRembourseModal() {
    document.getElementById('fraisRembourseModal').classList.remove('active');
  },

  confirmerRembourse(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('fraisRembId').value);
    const f = this.getAll().find(x => x.id === id);
    if (!f) { alert('Déplacement introuvable.'); return; }
    if (f.rembourse) { alert('Ce déplacement est déjà remboursé.'); this.closeRembourseModal(); return; }

    const dateRemb = document.getElementById('fraisRembDate').value;
    const mode = document.getElementById('fraisRembMode').value;
    const note = document.getElementById('fraisRembNotes').value.trim();
    const montant = f.montant || 0;

    if (montant <= 0) { alert('Le montant du déplacement est nul, impossible de rembourser.'); return; }

    // 1) Créer l'écriture compta (dépense)
    const comptaList = (typeof Compta !== 'undefined') ? Compta.getAll() : Storage.getEntries();
    const comptaId = Date.now() + Math.random();
    const pieceCount = comptaList.filter(e => e.type === 'depense').length + 1;
    const piece = 'DEP-' + String(pieceCount).padStart(3, '0');

    const entry = {
      id: comptaId,
      type: 'depense',
      date: dateRemb,
      piece,
      yapla: '-',
      tiers: f.benevole,
      intervention: 'Aucune / Autre',
      paiement: mode,
      items: [{ name: '🚗 Remboursement frais de route', amount: montant, category: 'variable' }],
      total: montant,
      source: 'frais-remboursement',
      notes: note || ''
    };
    comptaList.push(entry);
    if (typeof Compta !== 'undefined') Compta.saveAll(comptaList);
    else Storage.saveEntries(comptaList);

    // 2) Marquer le déplacement comme remboursé
    const list = this.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx].rembourse = true;
      list[idx].dateRemboursement = dateRemb;
      list[idx].modeRemboursement = mode;
      list[idx].noteRemboursement = note;
      list[idx].comptaId = comptaId;
      list[idx].comptaPiece = piece;
      this.saveAll(list);
    }

    // 3) Rafraîchir
    if (typeof Compta !== 'undefined') Compta.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    this.render();
    this.closeRembourseModal();
    this.closeDetail();
    BricoBol.updateStorageInfo();

    alert(`✅ Remboursement enregistré.\n\n💶 ${montant.toFixed(2)} € — ${mode}\n💰 Écriture compta : ${piece}`);
  },

  openDetail(id) {
    const f = this.getAll().find(x => x.id === id);
    if (!f) return;
    const statut = f.rembourse ? '<span class="badge badge-success">Remboursé</span>' : '<span class="badge badge-warning">À rembourser</span>';

    let repartitionHTML = '';
    const inter = f.interventions || [];
    if (inter.length > 0 && typeof inter[0] === 'object' && inter[0].part !== undefined) {
      const totalKmInd = inter.reduce((s, r) => s + (r.kmIndividuel || 0), 0);
      const totalVirtuel = totalKmInd * (f.bareme || 0.40);
      const economie = totalVirtuel - (f.montant || 0);
      repartitionHTML = `
        <div class="adh-detail-section">
          <h4>Répartition au prorata (${inter.length} intervention${inter.length > 1 ? 's' : ''})</h4>
          <table style="width:100%;font-size:.85rem;border-collapse:collapse;margin-top:6px;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);">
                <th style="text-align:left;padding:6px 4px;">Intervention</th>
                <th style="text-align:right;padding:6px 4px;">Km seul</th>
                <th style="text-align:right;padding:6px 4px;">Prix seul</th>
                <th style="text-align:right;padding:6px 4px;">Part</th>
              </tr>
            </thead>
            <tbody>
              ${inter.map(r => {
                const nom = r.nom || '';
                const typ = r.type || '';
                return `
                  <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:6px 4px;font-weight:600;font-size:.82rem;">${Utils.escapeHtml(r.numero)}${nom ? ' · ' + Utils.escapeHtml(nom) : ''}${typ ? '<br><span style="font-weight:400;color:var(--text-light);">' + Utils.escapeHtml(typ) + '</span>' : ''}</td>
                    <td style="text-align:right;padding:6px 4px;">${r.kmIndividuel || 0} km</td>
                    <td style="text-align:right;padding:6px 4px;color:var(--text-light);">${((r.kmIndividuel || 0) * (f.bareme || 0.40)).toFixed(2)} €</td>
                    <td style="text-align:right;padding:6px 4px;color:var(--accent);font-weight:700;">${(r.part || 0).toFixed(2)} €</td>
                  </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="border-top:2px solid var(--border);font-weight:700;">
                <td style="padding:6px 4px;">TOTAL</td>
                <td style="text-align:right;padding:6px 4px;">${totalKmInd} km</td>
                <td style="text-align:right;padding:6px 4px;color:var(--text-light);">${totalVirtuel.toFixed(2)} €</td>
                <td style="text-align:right;padding:6px 4px;color:var(--success);">${(f.montant || 0).toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top:10px;font-size:.8rem;color:var(--text-light);">
            💡 Sans tournée groupée, coût virtuel = <strong>${totalVirtuel.toFixed(2)} €</strong><br>
            💰 Économie réalisée = <strong style="color:var(--success);">${economie.toFixed(2)} €</strong>
          </div>
        </div>`;
    } else if (inter.length > 0) {
      repartitionHTML = `<div class="adh-detail-section"><h4>Interventions liées</h4>${inter.map(n => {
        const num = typeof n === 'string' ? n : n.numero;
        const info = Interventions.getAll().find(x => x.numero === num);
        const nom = info ? info.demandeur : '';
        const typ = info ? info.type : '';
        return `<p>🛠️ <strong>${Utils.escapeHtml(num)}</strong>${nom ? ' · ' + Utils.escapeHtml(nom) : ''}${typ ? ' — ' + Utils.escapeHtml(typ) : ''}</p>`;
      }).join('')}</div>`;
    }

    let rembHTML = '';
    if (f.rembourse) {
      rembHTML = `
        <div class="adh-detail-section" style="background:#f0fdf4;border:1px solid #86efac;">
          <h4 style="color:#166534;">✅ Remboursement</h4>
          <p style="font-size:.88rem;">📅 Le <strong>${Utils.formatDate(f.dateRemboursement)}</strong></p>
          ${f.modeRemboursement ? `<p style="font-size:.88rem;">💳 Mode : ${Utils.escapeHtml(f.modeRemboursement)}</p>` : ''}
          ${f.comptaPiece ? `<p style="font-size:.88rem;">💰 Écriture compta : <strong>${Utils.escapeHtml(f.comptaPiece)}</strong></p>` : ''}
          ${f.noteRemboursement ? `<p style="font-size:.88rem;">📝 ${Utils.escapeHtml(f.noteRemboursement)}</p>` : ''}
        </div>`;
    }

    document.getElementById('fraisDetailBody').innerHTML = `
      <div style="padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:1.25rem;font-weight:800;">${Utils.escapeHtml(f.numero)}</div>
          ${statut}
        </div>
        <div style="color:var(--text-light);font-size:.85rem;margin-top:4px;">${Utils.formatDate(f.date)}</div>
      </div>
      <div class="adh-detail-section">
        <h4>Bénévole</h4>
        <p>👤 ${Utils.escapeHtml(f.benevole)}</p>
      </div>
      <div class="adh-detail-section">
        <h4>Trajet global</h4>
        <p>🚗 ${Utils.escapeHtml(f.trajet || '—')}</p>
        <p>📍 ${f.km} km × ${(f.bareme || 0.40).toFixed(2)} € = <strong>${(f.montant || 0).toFixed(2)} €</strong></p>
      </div>
      ${f.motif ? `<div class="adh-detail-section"><h4>Motif</h4><p>${Utils.escapeHtml(f.motif)}</p></div>` : ''}
      ${repartitionHTML}
      ${rembHTML}
      ${f.notes ? `<div class="adh-detail-section"><h4>Notes</h4><p>${Utils.escapeHtml(f.notes)}</p></div>` : ''}
      <div class="adh-detail-actions">
        ${!f.rembourse ? `<button class="btn btn-success" onclick="Frais.closeDetail();Frais.openRembourseModal(${f.id});">✅ Marquer remboursé</button>` : ''}
        <button class="btn btn-secondary" onclick="Frais.closeDetail();Frais.openForm(${f.id});">✏️ Modifier</button>
        <button class="btn btn-danger" onclick="Frais.remove(${f.id})">🗑️ Supprimer</button>
      </div>`;
    document.getElementById('fraisDetailModal').classList.add('active');
  },

  openARembourserModal() {
    this._openFraisModal('a_rembourser', '💶 À rembourser', '#8b5cf6', '#faf5ff', '#c4b5fd');
  },

  openRemboursesModal() {
    this._openFraisModal('rembourse', '✅ Déjà remboursés', '#16a34a', '#f0fdf4', '#86efac');
  },

  openKmModal() {
    this._openFraisModal('all', '🚗 Kilométrage total', '#0ea5e9', '#f0f9ff', '#bfdbfe');
  },

  openDeplacementsModal() {
    this._openFraisModal('all', '📦 Tous les déplacements', '#f97316', '#fff7ed', '#fdba74');
  },

  _openFraisModal(filtre, titre, color, bg, border) {
    let list = this.getAll();
    if (filtre === 'a_rembourser') list = list.filter(f => !f.rembourse);
    else if (filtre === 'rembourse') list = list.filter(f => f.rembourse);
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalMontant = list.reduce((s, f) => s + (f.montant || 0), 0);
    const totalKm = list.reduce((s, f) => s + (f.km || 0), 0);

    document.getElementById('fraisModalTitle').textContent = titre;
    document.getElementById('fraisModalBody').innerHTML = `
      <div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:16px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;">
        <div>
          <div style="font-size:.72rem;color:${color};text-transform:uppercase;font-weight:700;">Montant</div>
          <div style="font-size:1.6rem;font-weight:800;color:${color};">${totalMontant.toFixed(2)} €</div>
        </div>
        <div>
          <div style="font-size:.72rem;color:${color};text-transform:uppercase;font-weight:700;">Kilométrage</div>
          <div style="font-size:1.6rem;font-weight:800;color:${color};">${totalKm} km</div>
        </div>
      </div>
      <div style="text-align:center;font-size:.82rem;color:var(--text-light);margin-bottom:16px;">
        ${list.length} déplacement${list.length > 1 ? 's' : ''}
      </div>

      ${list.length === 0
        ? '<div class="empty-state">Aucun déplacement.</div>'
        : `<div style="max-height:420px;overflow-y:auto;">
            ${list.map(f => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fff;border:1px solid var(--border);border-left:4px solid ${f.rembourse ? '#16a34a' : '#f59e0b'};border-radius:8px;margin-bottom:6px;cursor:pointer;"
                   onclick="Frais.closeFraisModal();Frais.openDetail(${f.id});">
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:700;font-size:.88rem;">
                    <span style="color:var(--accent);font-size:.72rem;">${Utils.escapeHtml(f.numero)}</span>
                    ${Utils.escapeHtml(f.benevole)}
                  </div>
                  <div style="font-size:.76rem;color:var(--text-light);margin-top:2px;">
                    📅 ${Utils.formatDate(f.date)} · 🚗 ${f.km} km<br>
                    ${Utils.escapeHtml(f.trajet || '—')}
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:8px;">
                  <div style="font-weight:800;color:var(--text);font-size:.95rem;">${(f.montant || 0).toFixed(2)} €</div>
                  <div style="font-size:.68rem;color:${f.rembourse ? 'var(--success)' : 'var(--warning)'};font-weight:700;">
                    ${f.rembourse ? '✓ Remboursé' : '⏳ À rembourser'}
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
    `;
    document.getElementById('fraisModal').classList.add('active');
  },

  closeFraisModal() {
    document.getElementById('fraisModal').classList.remove('active');
  },

  closeDetail() { document.getElementById('fraisDetailModal').classList.remove('active'); },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucun déplacement.'); return; }
    const headers = ['Numéro','Date','Bénévole','Trajet','Motif','Km total','Barème','Coût réel','Remboursé','Date remboursement','Mode','Compta','Répartition'];
    let csv = headers.join(';') + '\n';
    list.forEach(f => {
      const rep = (f.interventions || []).map(r => typeof r === 'string' ? r : `${r.numero} (${r.kmIndividuel}km→${(r.part||0).toFixed(2)}€)`).join(' | ');
      const row = [
        f.numero, f.date, f.benevole, f.trajet, f.motif, f.km, f.bareme, (f.montant || 0).toFixed(2),
        f.rembourse ? 'Oui' : 'Non', f.dateRemboursement || '', f.modeRemboursement || '', f.comptaPiece || '', rep
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
      csv += row + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'frais_bricobol.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  },

  getViewHTML() {
    return `
      <section class="view" id="view-frais">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Bénévoles & Frais</h1><p>Déplacements kilométriques et remboursements</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Frais.exportCSV()">📥 Export CSV</button>
            <button class="btn" onclick="Frais.openForm()">➕ Nouveau déplacement</button>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card warning clickable" onclick="Frais.openARembourserModal()" title="Voir les déplacements à rembourser">
            <div class="stat-label">À rembourser</div>
            <div class="stat-value" id="fraisStatARembourser">0,00 €</div>
            <div class="stat-sub">Total en attente</div>
          </div>
          <div class="stat-card clickable" onclick="Frais.openKmModal()" title="Voir le kilométrage">
            <div class="stat-label">Kilométrage</div>
            <div class="stat-value" id="fraisStatKm">0 km</div>
            <div class="stat-sub">Total parcouru</div>
          </div>
          <div class="stat-card orange clickable" onclick="Frais.openDeplacementsModal()" title="Voir tous les déplacements">
            <div class="stat-label">Déplacements</div>
            <div class="stat-value" id="fraisStatNb">0</div>
            <div class="stat-sub">Total enregistré</div>
          </div>
          <div class="stat-card success clickable" onclick="Frais.openRemboursesModal()" title="Voir les déplacements remboursés">
            <div class="stat-label">Déjà remboursé</div>
            <div class="stat-value" id="fraisStatTotal">0,00 €</div>
            <div class="stat-sub">Cumul historique</div>
          </div>
        </div>
        <div class="card" style="padding:14px;">
          <input type="text" id="fraisSearch" placeholder="🔍 Rechercher (bénévole, trajet, motif)" oninput="Frais.render()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:.92rem;">
          <div style="margin-top:10px;">
            <select id="fraisFilterStatut" onchange="Frais.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;width:100%;">
              <option value="">Tous les statuts</option>
              <option value="a_rembourser">À rembourser</option>
              <option value="rembourse">Remboursés</option>
            </select>
          </div>
          <div style="margin-top:10px;font-size:.82rem;color:var(--text-light);" id="fraisCount">0 déplacement</div>
        </div>
        <div id="fraisListContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="fraisFormModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="fraisFormTitle">Nouveau déplacement</h2>
            <button class="close-btn" onclick="Frais.closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="fraisForm" onsubmit="Frais.save(event)">
              <input type="hidden" id="fraisEditId">

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Date *</label><input type="date" id="fraisDate" required></div>
                <div class="form-group"><label>Bénévole *</label><input type="text" id="fraisBenevole" list="benevolesFraisList" placeholder="Nom du bénévole" required><datalist id="benevolesFraisList"></datalist></div>
              </div>

              <div class="form-group">
                <label>Interventions de la tournée <small style="color:var(--text-light);font-weight:400;">(Ctrl+clic / Cmd+clic pour plusieurs)</small></label>
                <select id="fraisInterventions" multiple style="min-height:100px;" onchange="Frais.syncRepartitionFromSelect()"></select>
              </div>

              <div style="margin-bottom:14px;">
                <button type="button" class="btn" style="width:100%;background:var(--accent);" onclick="Frais.calculerDistances()">
                  🔍 Calculer les distances automatiquement
                </button>
                <div id="fraisCalcStatut" style="font-size:.82rem;margin-top:6px;min-height:18px;text-align:center;"></div>
              </div>

              <div class="form-group">
                <label>Distance totale de la tournée (km) * <small style="color:var(--text-light);font-weight:400;">— compteur réel ou calcul auto</small></label>
                <input type="number" step="1" id="fraisKm" placeholder="Ex : 60" oninput="Frais.updateMontant()" required>
              </div>
              <div style="font-size:.8rem;color:var(--text-light);margin-top:-8px;margin-bottom:12px;">Barème : <span id="fraisBaremeAffiche">0.40</span> €/km</div>

              <div class="form-group"><label>Trajet</label><input type="text" id="fraisTrajet" placeholder="Ex : Saint-Saud → A → B → C → Saint-Saud"></div>
              <div class="form-group"><label>Motif</label><input type="text" id="fraisMotif" placeholder="Ex : Tournée groupée 3 interventions"></div>

              <div class="form-group" id="fraisRepartitionContainer"></div>
              <div id="fraisRecapProrata" style="display:none;margin-bottom:14px;"></div>

              <div class="form-group">
                <label>Coût réel remboursé au bénévole</label>
                <input type="text" id="fraisMontant" readonly style="background:var(--bg);font-weight:700;color:var(--success);font-size:1.1rem;">
              </div>

              <div class="form-group"><label>Notes</label><textarea id="fraisNotes" rows="2"></textarea></div>

              <div class="form-group" style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="fraisRembourse" style="width:auto;">
                <label for="fraisRembourse" style="margin:0;">Déjà remboursé</label>
              </div>

              <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="submit" class="btn" style="flex:1;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" onclick="Frais.closeForm()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal" id="fraisDetailModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Fiche déplacement</h2>
            <button class="close-btn" onclick="Frais.closeDetail()">&times;</button>
          </div>
          <div class="modal-body" id="fraisDetailBody"></div>
        </div>
      </div>

      <div class="modal" id="fraisModal">
        <div class="modal-content" style="max-width:640px;">
          <div class="modal-header">
            <h2 id="fraisModalTitle">Détail</h2>
            <button class="close-btn" onclick="Frais.closeFraisModal()">&times;</button>
          </div>
          <div class="modal-body" id="fraisModalBody"></div>
        </div>
      </div>

      <div class="modal" id="fraisRembourseModal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h2>✅ Rembourser frais de route</h2>
            <button class="close-btn" onclick="Frais.closeRembourseModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="Frais.confirmerRembourse(event)">
              <input type="hidden" id="fraisRembId">
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:.75rem;color:var(--text-light);text-transform:uppercase;">Bénévole</div>
                <div style="font-size:1.1rem;font-weight:800;" id="fraisRembBenevole">—</div>
                <div style="margin-top:6px;font-size:.85rem;color:#166534;">
                  Montant à rembourser : <strong id="fraisRembMontant">0,00 €</strong>
                </div>
              </div>

              <div class="form-group">
                <label>Date de remboursement *</label>
                <input type="date" id="fraisRembDate" required>
              </div>

              <div class="form-group">
                <label>Mode de paiement *</label>
                <select id="fraisRembMode" required>
                  <option value="Espèces">Espèces</option>
                  <option value="Virement">Virement</option>
                  <option value="CB">CB</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>

              <div class="form-group">
                <label>Notes (optionnel)</label>
                <textarea id="fraisRembNotes" rows="2" placeholder="Ex : remis en main propre"></textarea>
              </div>

              <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-bottom:16px;font-size:.82rem;">
                ℹ️ Une écriture comptable (dépense) sera créée automatiquement dans le grand livre.
              </div>

              <div style="display:flex;gap:10px;">
                <button type="submit" class="btn btn-success" style="flex:1;">💾 Valider et créer la dépense</button>
                <button type="button" class="btn btn-ghost" onclick="Frais.closeRembourseModal()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  },

  onShow() { this.render(); }
};

Router.register({
  view: 'frais',
  title: 'Bénévoles & Frais',
  icon: '🚗',
  section: 'Activité',
  order: 3,
  getViewHTML: () => Frais.getViewHTML(),
  getModalsHTML: () => Frais.getModalsHTML(),
  onShow: () => Frais.onShow()
});
