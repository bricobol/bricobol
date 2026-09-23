// ============================================================
// MODULE : DONS — Campagne, versements, reçus fiscaux
// ============================================================

const Dons = {

  getAll() { return Storage.get('dons', []); },
  saveAll(list) { return Storage.set('dons', list); },

  getSeuilMecene() {
    const p = Storage.getParametres();
    return p.seuilMecene || 200;
  },

  getCampagnes() {
    const p = Storage.getParametres();
    return p.campagnes || ['Campagne annuelle'];
  },

  interetGeneralActif() {
    const p = Storage.getParametres();
    return !!p.interetGeneral;
  },

  emettreRecusDefaut() {
    const p = Storage.getParametres();
    return !!p.emettreRecusDefaut;
  },

  // ---------- Trouver contact ----------
  trouverContact(don) {
    const contacts = Storage.getAdherents();
    if (don.email) {
      const parEmail = contacts.find(a => (a.email || '').toLowerCase() === don.email.toLowerCase());
      if (parEmail) return parEmail;
    }
    return contacts.find(a =>
      a.prenom && a.nom &&
      a.prenom.toLowerCase() === (don.prenom || '').toLowerCase() &&
      a.nom.toLowerCase() === (don.nom || '').toLowerCase()
    ) || null;
  },

  upsertContact(don) {
    const contacts = Storage.getAdherents();
    const seuil = this.getSeuilMecene();
    const typeCible = don.montantTotal >= seuil ? 'Mécène' : 'Donateur';

    let contact = this.trouverContact(don);
    if (contact) {
      const idx = contacts.findIndex(a => a.id === contact.id);
      if (idx !== -1) {
        if (don.email && !contacts[idx].email) contacts[idx].email = don.email;
        if (don.tel && !contacts[idx].tel) contacts[idx].tel = don.tel;
        if (don.adresse && !contacts[idx].adresse) contacts[idx].adresse = don.adresse;
        if (don.cp && !contacts[idx].cp) contacts[idx].cp = don.cp;
        if (don.ville && !contacts[idx].ville) contacts[idx].ville = don.ville;
        Storage.saveAdherents(contacts);
      }
      return { id: contact.id, type: contact.type, nouveau: false };
    }

    const n = Storage.getCounter();
    Storage.saveCounter(n + 1);
    const numero = 'ADH-' + String(n).padStart(3, '0');

    const newContact = {
      id: Date.now() + Math.random(),
      numero,
      prenom: don.prenom,
      nom: don.nom,
      email: don.email || '',
      tel: don.tel || '',
      adresse: don.adresse || '',
      cp: don.cp || '',
      ville: don.ville || '',
      pays: don.pays || 'France',
      type: typeCible,
      situation: '',
      dateCreation: Utils.todayISO(),
      dateExpiration: null,
      yaplaId: null,
      notes: '',
      adresseDepart: null,
      dateAjout: new Date().toISOString()
    };
    contacts.push(newContact);
    Storage.saveAdherents(contacts);
    return { id: newContact.id, type: typeCible, nouveau: true };
  },

  recalculerTotaux(don) {
    don.versements = don.versements || [];
    don.montantTotal = don.versements.reduce((s, v) => s + (v.montant || 0), 0);
    don.nombreDons = don.versements.length;
    return don;
  },

  // ---------- Import Excel Yapla ----------
  openImport() { document.getElementById('donsImportModal').classList.add('active'); },
  closeImport() { document.getElementById('donsImportModal').classList.remove('active'); },

  importFromExcel() {
    const file = document.getElementById('donsImportFile').files[0];
    if (!file) { alert('Choisissez un fichier .xlsx'); return; }
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
        const findCol = (names) => { for (let i = 0; i < headers.length; i++) if (names.includes(headers[i])) return i; return -1; };

        const cNum = findCol(['numéro de donateur', 'numero de donateur']);
        const cPrenom = findCol(['prénom', 'prenom']);
        const cNom = findCol(['nom']);
        const cEmail = findCol(['courriel', 'email']);
        const cTel = findCol(['téléphone', 'telephone']);
        const cStatut = findCol(['statut']);
        const cNbDons = findCol(['nombre de dons']);
        const cMontant = findCol(['montant total des dons']);
        const cAdresse = findCol(['adresse']);
        const cVille = findCol(['ville']);
        const cCP = findCol(['code postal']);
        const cPays = findCol(['pays']);
        const cNotes = findCol(['notes']);

        if (cPrenom === -1 || cNom === -1 || cMontant === -1) { alert('Colonnes obligatoires manquantes : Prénom, Nom et/ou Montant.'); return; }

        const anneeStr = prompt("Année fiscale des dons :", new Date().getFullYear());
        if (!anneeStr) return;
        const exercice = parseInt(anneeStr);

        // Choix de la campagne depuis les paramètres
        const campagnes = this.getCampagnes();
        const campagneChoix = prompt(
          "Campagne de dons :\n" + campagnes.map((c, i) => `${i + 1}. ${c}`).join('\n') + `\n${campagnes.length + 1}. Aucune / Autre`,
          "1"
        );
        let campagne = '';
        if (campagneChoix && parseInt(campagneChoix) >= 1 && parseInt(campagneChoix) <= campagnes.length) {
          campagne = campagnes[parseInt(campagneChoix) - 1];
        }

        const parseMontant = (s) => {
          if (!s) return 0;
          const clean = String(s).replace(/[^\d,.-]/g, '').replace(',', '.');
          return parseFloat(clean) || 0;
        };

        let ajoutes = 0, maj = 0, ignores = 0, contactsCrees = 0, promusMecene = 0;
        let totalMontant = 0;
        const list = this.getAll();

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const prenom = String(r[cPrenom] || '').trim();
          const nom = String(r[cNom] || '').trim();
          if (!prenom && !nom) { ignores++; continue; }
          const montant = parseMontant(r[cMontant]);
          if (montant <= 0) { ignores++; continue; }

          const numDonateur = cNum !== -1 ? String(r[cNum] || '').trim() : '';
          const nombreDons = cNbDons !== -1 ? parseInt(r[cNbDons]) || 1 : 1;

          const recTemp = {
            prenom, nom,
            email: cEmail !== -1 ? String(r[cEmail] || '').trim() : '',
            tel: cTel !== -1 ? String(r[cTel] || '').trim() : '',
            adresse: cAdresse !== -1 ? String(r[cAdresse] || '').trim() : '',
            cp: cCP !== -1 ? String(r[cCP] || '').trim() : '',
            ville: cVille !== -1 ? String(r[cVille] || '').trim() : '',
            pays: cPays !== -1 ? String(r[cPays] || '').trim() : 'France',
            montantTotal: montant
          };
          const contactInfo = this.upsertContact(recTemp);
          if (contactInfo.nouveau) contactsCrees++;
          if (contactInfo.type === 'Mécène') promusMecene++;

          let existing = null;
          if (numDonateur) existing = list.find(d => d.numeroDonateur === numDonateur && d.exercice === exercice);
          if (!existing && recTemp.email) existing = list.find(d => d.email === recTemp.email && d.exercice === exercice);

          const versement = {
            id: Date.now() + Math.random(),
            date: `${exercice}-12-31`,
            montant,
            mode: 'CB',
            notes: nombreDons > 1 ? `${nombreDons} dons regroupés` : ''
          };

          const rec = {
            numeroDonateur: numDonateur,
            adherentId: contactInfo.id,
            prenom, nom,
            email: recTemp.email,
            tel: recTemp.tel,
            adresse: recTemp.adresse,
            cp: recTemp.cp,
            ville: recTemp.ville,
            pays: recTemp.pays,
            statut: cStatut !== -1 ? String(r[cStatut] || '').trim() : 'Actif',
            versements: [versement],
            notes: cNotes !== -1 ? String(r[cNotes] || '').trim() : '',
            exercice,
            campagne,
            interventionId: null,
            interventionNumero: null,
            recuDemande: this.interetGeneralActif() ? this.emettreRecusDefaut() : false,
            source: 'import-yapla',
            dateImport: new Date().toISOString()
          };
          this.recalculerTotaux(rec);

          if (existing) {
            existing.versements = [versement];
            existing.campagne = campagne || existing.campagne;
            existing.adherentId = contactInfo.id;
            this.recalculerTotaux(existing);
            maj++;
          } else {
            rec.id = Date.now() + Math.random();
            rec.recuNumero = null;
            rec.recuGenere = false;
            rec.recetteGeneree = false;
            rec.comptaIds = [];
            list.push(rec);
            ajoutes++;
          }
          totalMontant += montant;
        }

        this.saveAll(list);
        this.render();
        if (typeof Adherents !== 'undefined') Adherents.render();
        this.closeImport();
        BricoBol.updateStorageInfo();

        alert(
          `✅ Import terminé.\n\n` +
          `💰 ${ajoutes} dons importés\n` +
          `🔄 ${maj} mis à jour\n` +
          `👥 ${contactsCrees} nouveaux contacts\n` +
          `💎 ${promusMecene} mécènes (≥ ${this.getSeuilMecene()} €)\n` +
          `⏭️ ${ignores} ignorés\n\n` +
          `Total : ${totalMontant.toFixed(2)} €`
        );
      } catch (err) {
        console.error(err);
        alert('Erreur : ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // ---------- Formulaire ----------
  openForm(id = null, options = {}) {
    const form = document.getElementById('donForm');
    form.reset();
    document.getElementById('donEditId').value = '';
    document.getElementById('donFormTitle').textContent = id ? 'Modifier le don' : 'Nouveau don';
    document.getElementById('donContactMode').value = 'existant';
    this.toggleContactMode();
    this.refreshContactsList();
    this.refreshInterventionsList();
    this.refreshCampagnesList();
    this.versementsTemp = [];
    this.majCaseRecu();

    if (id) {
      const d = this.getAll().find(x => x.id === id);
      if (!d) return;
      document.getElementById('donEditId').value = d.id;
      document.getElementById('donExercice').value = d.exercice;
      document.getElementById('donCampagne').value = d.campagne || '';
      document.getElementById('donIntervention').value = d.interventionNumero || '';
      document.getElementById('donNotes').value = d.notes || '';
      document.getElementById('donRecuFiscal').checked = !!d.recuDemande;
      if (d.adherentId) {
        document.getElementById('donContactMode').value = 'existant';
        this.toggleContactMode();
        document.getElementById('donContactId').value = d.adherentId;
      } else {
        document.getElementById('donContactMode').value = 'nouveau';
        this.toggleContactMode();
        document.getElementById('donNewPrenom').value = d.prenom;
        document.getElementById('donNewNom').value = d.nom;
        document.getElementById('donNewEmail').value = d.email || '';
        document.getElementById('donNewTel').value = d.tel || '';
      }
      this.versementsTemp = (d.versements || []).map(v => ({ ...v }));
    } else {
      document.getElementById('donExercice').value = new Date().getFullYear();
      // Pré-remplissage depuis une intervention
      if (options.interventionId) {
        document.getElementById('donIntervention').value = options.interventionNumero || '';
      }
      if (options.adherentId) {
        document.getElementById('donContactId').value = options.adherentId;
      }
      const campagnes = this.getCampagnes();
      if (campagnes.length > 0) document.getElementById('donCampagne').value = campagnes[0];
      this.versementsTemp = [{ id: Date.now(), date: Utils.todayISO(), montant: 0, mode: 'Espèces', notes: '' }];
    }
    this.renderVersements();
    document.getElementById('donFormModal').classList.add('active');
  },

  closeForm() { document.getElementById('donFormModal').classList.remove('active'); },

  toggleContactMode() {
    const mode = document.getElementById('donContactMode').value;
    document.getElementById('donContactExistantGroup').style.display = mode === 'existant' ? 'block' : 'none';
    document.getElementById('donContactNouveauGroup').style.display = mode === 'nouveau' ? 'block' : 'none';
  },

  majCaseRecu() {
    const group = document.getElementById('donRecuGroup');
    const checkbox = document.getElementById('donRecuFiscal');
    if (!group || !checkbox) return;
    if (!this.interetGeneralActif()) {
      group.style.display = 'none';
      checkbox.checked = false;
    } else {
      group.style.display = 'block';
      if (!document.getElementById('donEditId').value) {
        checkbox.checked = this.emettreRecusDefaut();
      }
    }
  },

  refreshContactsList() {
    const sel = document.getElementById('donContactId');
    if (!sel) return;
    const contacts = Storage.getAdherents().slice().sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    sel.innerHTML = '<option value="">— Choisir un contact —</option>' +
      contacts.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.nom)} ${Utils.escapeHtml(c.prenom || '')} (${Utils.escapeHtml(c.numero)})</option>`).join('');
  },

  refreshInterventionsList() {
    const sel = document.getElementById('donIntervention');
    if (!sel) return;
    if (typeof Interventions === 'undefined') { sel.innerHTML = '<option value="">— Module Interventions indisponible —</option>'; return; }
    const inter = Interventions.getAll().slice().sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
    sel.innerHTML = '<option value="">— Aucune —</option>' +
      inter.map(i => `<option value="${Utils.escapeHtml(i.numero)}">${Utils.escapeHtml(i.numero)} · ${Utils.escapeHtml(i.demandeur)} · ${Utils.escapeHtml(i.type)}</option>`).join('');
  },

  refreshCampagnesList() {
    const sel = document.getElementById('donCampagne');
    if (!sel) return;
    const campagnes = this.getCampagnes();
    sel.innerHTML = '<option value="">— Aucune —</option>' +
      campagnes.map(c => `<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join('');
  },

  renderVersements() {
    const container = document.getElementById('donVersementsContainer');
    if (!container) return;
    let total = 0;
    container.innerHTML = this.versementsTemp.map((v, i) => {
      total += v.montant || 0;
      return `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;margin-bottom:6px;padding:8px;background:var(--bg-alt);border:1px solid var(--border);border-radius:8px;align-items:center;">
          <input type="date" value="${v.date || ''}" onchange="Dons.setVersement(${i}, 'date', this.value)" style="padding:6px;font-size:.82rem;border:1px solid var(--border);border-radius:6px;">
          <input type="number" step="0.01" min="0" placeholder="Montant €" value="${v.montant || ''}" onchange="Dons.setVersement(${i}, 'montant', this.value)" style="padding:6px;font-size:.82rem;border:1px solid var(--border);border-radius:6px;">
          <select onchange="Dons.setVersement(${i}, 'mode', this.value)" style="padding:6px;font-size:.82rem;border:1px solid var(--border);border-radius:6px;">
            <option value="Espèces" ${v.mode === 'Espèces' ? 'selected' : ''}>Espèces</option>
            <option value="CB" ${v.mode === 'CB' ? 'selected' : ''}>CB</option>
            <option value="Chèque" ${v.mode === 'Chèque' ? 'selected' : ''}>Chèque</option>
            <option value="Virement" ${v.mode === 'Virement' ? 'selected' : ''}>Virement</option>
          </select>
          <button type="button" onclick="Dons.removeVersement(${i})" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;">✕</button>
        </div>`;
    }).join('');
    document.getElementById('donTotalAffiche').textContent = total.toFixed(2) + ' €';
  },

  setVersement(i, field, value) {
    if (field === 'montant') value = parseFloat(value) || 0;
    this.versementsTemp[i][field] = value;
    this.renderVersements();
  },

  addVersement() {
    this.versementsTemp.push({ id: Date.now() + Math.random(), date: Utils.todayISO(), montant: 0, mode: 'Espèces', notes: '' });
    this.renderVersements();
  },

  removeVersement(i) {
    if (this.versementsTemp.length <= 1) { alert('Au moins un versement requis.'); return; }
    this.versementsTemp.splice(i, 1);
    this.renderVersements();
  },

  save(event) {
    event.preventDefault();
    const id = document.getElementById('donEditId').value;
    const exercice = parseInt(document.getElementById('donExercice').value) || new Date().getFullYear();
    const campagne = document.getElementById('donCampagne').value.trim();
    const interventionNumero = document.getElementById('donIntervention').value;
    const notes = document.getElementById('donNotes').value.trim();
    const recuDemande = this.interetGeneralActif() && document.getElementById('donRecuFiscal').checked;

    const versements = this.versementsTemp.filter(v => (v.montant || 0) > 0);
    if (versements.length === 0) { alert('Au moins un versement avec un montant positif.'); return; }

    let contactId = null;
    let contact = null;
    const contactMode = document.getElementById('donContactMode').value;
    if (contactMode === 'existant') {
      contactId = parseInt(document.getElementById('donContactId').value);
      if (!contactId) { alert('Sélectionnez un contact.'); return; }
      contact = Storage.getAdherents().find(a => a.id === contactId);
    } else {
      const prenom = document.getElementById('donNewPrenom').value.trim();
      const nom = document.getElementById('donNewNom').value.trim();
      if (!prenom || !nom) { alert('Prénom et nom obligatoires.'); return; }
      const totalTemp = versements.reduce((s, v) => s + v.montant, 0);
      const r = this.upsertContact({
        prenom, nom,
        email: document.getElementById('donNewEmail').value.trim(),
        tel: document.getElementById('donNewTel').value.trim(),
        montantTotal: totalTemp
      });
      contactId = r.id;
      contact = Storage.getAdherents().find(a => a.id === contactId);
    }

    // Récupérer l'ID de l'intervention liée si le numéro est fourni
    let interventionId = null;
    if (interventionNumero && typeof Interventions !== 'undefined') {
      const inter = Interventions.getAll().find(i => i.numero === interventionNumero);
      if (inter) interventionId = inter.id;
    }

    const data = {
      adherentId: contactId,
      prenom: contact.prenom,
      nom: contact.nom,
      email: contact.email || '',
      tel: contact.tel || '',
      adresse: contact.adresse || '',
      cp: contact.cp || '',
      ville: contact.ville || '',
      pays: contact.pays || 'France',
      exercice,
      campagne,
      interventionId,
      interventionNumero: interventionNumero || null,
      notes,
      recuDemande,
      versements: versements.map(v => ({ id: v.id || Date.now() + Math.random(), date: v.date, montant: v.montant, mode: v.mode, notes: v.notes || '' })),
      source: 'manuelle',
      statut: 'Actif'
    };
    this.recalculerTotaux(data);

    const list = this.getAll();
    if (id) {
      const idx = list.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        data.recetteGeneree = list[idx].recetteGeneree;
        data.comptaIds = list[idx].comptaIds || [];
        data.recuNumero = list[idx].recuNumero;
        data.recuGenere = list[idx].recuGenere;
        list[idx] = { ...list[idx], ...data };
      }
    } else {
      data.id = Date.now() + Math.random();
      data.recuNumero = null;
      data.recuGenere = false;
      data.recetteGeneree = false;
      data.comptaIds = [];
      list.push(data);
    }
    this.saveAll(list);
    this.closeForm();
    this.render();
    if (typeof Adherents !== 'undefined') Adherents.render();
    BricoBol.updateStorageInfo();
    alert('✅ Don enregistré.');
  },

  genererRecettesCompta() {
    if (typeof Compta === 'undefined') { alert('Module Comptabilité non disponible.'); return; }
    const list = this.getAll().filter(d => !d.recetteGeneree && d.montantTotal > 0);
    if (list.length === 0) { alert('Aucun don à transférer.'); return; }
    if (!confirm(`Créer les recettes en comptabilité pour ${list.length} donateur(s) ?\n\n1 recette par versement.`)) return;

    const comptaList = Compta.getAll();
    let created = 0;

    list.forEach(d => {
      d.comptaIds = [];
      (d.versements || []).forEach(v => {
        if (!v.montant || v.montant <= 0) return;
        const pieceCount = comptaList.filter(e => e.type === 'recette').length + 1;
        const piece = 'REC-' + String(pieceCount).padStart(3, '0');
        const entry = {
          id: Date.now() + Math.random(),
          type: 'recette',
          date: v.date,
          piece,
          yapla: d.numeroDonateur || '-',
          tiers: `${d.prenom} ${d.nom}`,
          intervention: d.interventionNumero || 'Aucune / Autre',
          paiement: v.mode || 'CB',
          items: [{ name: `🎁 Don${d.campagne ? ' — ' + d.campagne : ''}`, amount: v.montant, category: '' }],
          total: v.montant,
          source: 'don',
          donId: d.id,
          versementId: v.id
        };
        comptaList.push(entry);
        d.comptaIds.push(entry.id);
        created++;
      });
      const all = this.getAll();
      const idx = all.findIndex(x => x.id === d.id);
      if (idx !== -1) {
        all[idx].recetteGeneree = true;
        all[idx].comptaIds = d.comptaIds;
        this.saveAll(all);
      }
    });

    Compta.saveAll(comptaList);
    Compta.render();
    this.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
    alert(`✅ ${created} recette(s) créée(s).`);
  },

  remove(id) {
    const d = this.getAll().find(x => x.id === id);
    if (!d) return;
    if (!confirm(`Supprimer le don de ${d.prenom} ${d.nom} (${d.montantTotal.toFixed(2)} €) ?\n\nLes recettes comptables liées seront supprimées.`)) return;
    if (d.comptaIds && d.comptaIds.length > 0 && typeof Compta !== 'undefined') {
      const comptaList = Compta.getAll().filter(e => !d.comptaIds.includes(e.id));
      Compta.saveAll(comptaList);
      Compta.render();
    }
    this.saveAll(this.getAll().filter(x => x.id !== id));
    this.render();
    BricoBol.updateStorageInfo();
  },

  // ---------- Reçu fiscal ----------
  genererRecu(id) {
    const d = this.getAll().find(x => x.id === id);
    if (!d) return;
    if (!this.interetGeneralActif()) {
      alert('⚠️ L\'association n\'est pas reconnue d\'intérêt général.\n\nActivez la reconnaissance dans Paramètres avant de générer un reçu fiscal.');
      return;
    }
    const params = Storage.getParametres();
    const nomAsso = params.nomAssociation || 'Bricobol Aide Solidaire';
    const list = this.getAll().filter(x => x.exercice === d.exercice);
    const rang = list.findIndex(x => x.id === d.id) + 1;
    const numRecu = String(rang).padStart(3, '0') + '/' + d.exercice;
    const html = this._buildRecuHTML(d, numRecu, nomAsso, params);
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les popups.'); return; }
    w.document.write(html);
    w.document.close();
    const all = this.getAll();
    const idx = all.findIndex(x => x.id === id);
    if (idx !== -1) {
      all[idx].recuNumero = numRecu;
      all[idx].recuGenere = true;
      all[idx].recuDemande = true;
      all[idx].dateRecu = new Date().toISOString();
      this.saveAll(all);
      this.render();
    }
  },

  _buildRecuHTML(d, numRecu, nomAsso, params) {
    const montantLettres = this._montantEnLettres(d.montantTotal);
    const adresseDonateur = [d.adresse, d.cp, d.ville, d.pays].filter(Boolean).join(', ');
    const adresseAsso = [params.adresseAsso, params.cpAsso, params.villeAsso].filter(Boolean).join(', ');
    const dateJour = new Date().toLocaleDateString('fr-FR');
    return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Reçu fiscal ${numRecu}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, serif; max-width: 800px; margin: 30px auto; padding: 30px; color: #000; line-height: 1.5; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
  .asso { font-size: 13px; }
  .asso strong { font-size: 15px; }
  .titre { font-size: 22px; font-weight: bold; text-align: center; margin: 30px 0; text-transform: uppercase; letter-spacing: 2px; }
  .sous-titre { text-align: center; font-size: 12px; font-style: italic; margin-bottom: 40px; }
  .infos { background: #f8f8f8; border: 1px solid #ccc; padding: 20px; margin-bottom: 30px; }
  .infos-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 6px 0; border-bottom: 1px dotted #999; }
  .infos-row:last-child { border-bottom: none; }
  .versements { font-size: 12px; margin-top: 10px; }
  .versements table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .versements th, .versements td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
  .montant-box { background: #fff; border: 2px solid #000; padding: 20px; text-align: center; margin: 30px 0; }
  .montant-chiffres { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
  .montant-lettres { font-style: italic; font-size: 14px; }
  .legal { font-size: 11px; text-align: justify; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
  .signature { margin-top: 60px; display: flex; justify-content: space-between; }
  .signature-box { border-top: 1px solid #000; padding-top: 8px; width: 250px; text-align: center; font-size: 12px; }
  .num-recu { font-size: 11px; text-align: right; margin-top: 20px; }
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
      Association loi 1901, reconnue d'intérêt général
    </div>
    <div style="text-align: right; font-size: 12px;">
      Reçu n° <strong>${numRecu}</strong><br>
      Émis le ${dateJour}
    </div>
  </div>
  <div class="titre">Reçu au titre des dons</div>
  <div class="sous-titre">(Article 200 du Code général des impôts)</div>
  <div class="infos">
    <div class="infos-row"><span>Bénéficiaire du reçu :</span><strong>${d.prenom} ${d.nom}</strong></div>
    <div class="infos-row"><span>Adresse :</span><span>${adresseDonateur || '—'}</span></div>
    ${d.email ? `<div class="infos-row"><span>Courriel :</span><span>${d.email}</span></div>` : ''}
    <div class="infos-row"><span>Exercice fiscal :</span><strong>${d.exercice}</strong></div>
    ${d.campagne ? `<div class="infos-row"><span>Campagne :</span><span>${d.campagne}</span></div>` : ''}
    <div class="versements">
      <strong>Détail des versements :</strong>
      <table>
        <tr><th>Date</th><th>Montant</th><th>Mode</th></tr>
        ${(d.versements || []).map(v => `<tr><td>${Utils.formatDate(v.date)}</td><td>${v.montant.toFixed(2)} €</td><td>${v.mode || '—'}</td></tr>`).join('')}
      </table>
    </div>
  </div>
  <div class="montant-box">
    <div class="montant-chiffres">${d.montantTotal.toFixed(2).replace('.', ',')} €</div>
    <div class="montant-lettres">Soit : ${montantLettres}</div>
  </div>
  <p style="text-align: center; font-size: 13px; margin: 30px 0;">
    Je soussigné(e), représentant(e) légal(e) de l'association <strong>${nomAsso}</strong>,<br>
    certifie avoir reçu le montant ci-dessus à titre de don et qu'il ouvre droit<br>
    à la réduction d'impôt prévue à l'article 200 du Code général des impôts.
  </p>
  <div class="legal">
    <strong>Mention légale :</strong> Ce reçu est à conserver par le donateur. Il doit être produit à l'appui de la déclaration de revenus.
    La réduction d'impôt est égale à 66 % du montant des dons dans la limite de 20 % du revenu imposable,
    soit une réduction d'impôt de <strong>${(d.montantTotal * 0.66).toFixed(2).replace('.', ',')} €</strong> pour ce don.
  </div>
  <div class="signature">
    <div class="signature-box">Signature du donateur</div>
    <div class="signature-box">Pour l'association :<br>Le Président</div>
  </div>
  <div class="num-recu">Reçu n° ${numRecu} — ${nomAsso} — Exercice ${d.exercice}</div>
</body></html>`;
  },

  _montantEnLettres(n) {
    const entier = Math.floor(n);
    const centimes = Math.round((n - entier) * 100);
    const units = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
    const tens = ['','','vingt','trente','quarante','cinquante','soixante','soixante-dix','quatre-vingt','quatre-vingt-dix'];
    const conv = (x) => {
      if (x < 20) return units[x];
      if (x < 100) { const t = Math.floor(x / 10), u = x % 10; return tens[t] + (u > 0 ? '-' + units[u] : ''); }
      if (x < 1000) { const c = Math.floor(x / 100), r = x % 100; return (c > 1 ? units[c] + ' cent' + (r > 0 ? 's ' : 's ') : 'cent ') + (r > 0 ? conv(r) : ''); }
      return x.toString();
    };
    let result = conv(entier) + ' euro' + (entier > 1 ? 's' : '');
    if (centimes > 0) result += ' et ' + conv(centimes) + ' centime' + (centimes > 1 ? 's' : '');
    return result;
  },

  genererTousRecus() {
    if (!this.interetGeneralActif()) { alert('⚠️ Activez la reconnaissance d\'intérêt général dans Paramètres.'); return; }
    const list = this.getAll().filter(d => d.recuDemande);
    if (list.length === 0) { alert('Aucun don avec reçu demandé.'); return; }
    if (!confirm(`Générer ${list.length} reçu(s) ?\n\nOuvrir dans de nouveaux onglets (autorisez les popups).`)) return;
    list.forEach((d, i) => setTimeout(() => this.genererRecu(d.id), i * 300));
  },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) { alert('Aucun don.'); return; }
    const headers = ['Numéro donateur','Prénom','Nom','Email','Téléphone','Adresse','CP','Ville','Pays','Exercice','Campagne','Intervention','Nb versements','Montant total','Source','N° reçu','Compta','Détail versements'];
    let csv = headers.join(';') + '\n';
    list.forEach(d => {
      const detail = (d.versements || []).map(v => `${v.date} ${v.montant.toFixed(2)}€ ${v.mode}`).join(' | ');
      const row = [d.numeroDonateur || '', d.prenom, d.nom, d.email, d.tel, d.adresse, d.cp, d.ville, d.pays, d.exercice, d.campagne || '', d.interventionNumero || '', (d.versements || []).length, d.montantTotal.toFixed(2), d.source || 'manuelle', d.recuNumero || '', d.recetteGeneree ? 'Oui' : 'Non', detail]
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';');
      csv += row + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dons_bricobol.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  },

  render() {
    const container = document.getElementById('donsListContainer');
    if (!container) return;
    const all = this.getAll();
    const year = parseInt(document.getElementById('donsFilterYear').value) || new Date().getFullYear();
    const q = (document.getElementById('donsSearch').value || '').toLowerCase();

    let list = all.filter(d => d.exercice === year);
    if (q) list = list.filter(d => `${d.prenom} ${d.nom} ${d.email}`.toLowerCase().includes(q));
    list.sort((a, b) => b.montantTotal - a.montantTotal);

    const total = all.filter(d => d.exercice === year).reduce((s, d) => s + d.montantTotal, 0);
    const nb = all.filter(d => d.exercice === year).length;
    const moyen = nb > 0 ? total / nb : 0;
    const aTransferer = all.filter(d => d.exercice === year && !d.recetteGeneree).length;

    const elTotal = document.getElementById('donsStatTotal');
    const elNb = document.getElementById('donsStatNb');
    const elMoyen = document.getElementById('donsStatMoyen');
    const elATransf = document.getElementById('donsStatATransferer');
    if (elTotal) elTotal.textContent = total.toFixed(2) + ' €';
    if (elNb) elNb.textContent = nb;
    if (elMoyen) elMoyen.textContent = moyen.toFixed(2) + ' €';
    if (elATransf) elATransf.textContent = aTransferer;

    if (list.length === 0) {
      container.innerHTML = '<div class="card"><div class="empty-state">Aucun don pour ' + year + '.</div></div>';
      return;
    }

    const ig = this.interetGeneralActif();

    container.innerHTML = list.map(d => {
      const adh = d.adherentId ? Storage.getAdherents().find(a => a.id === d.adherentId) : null;
      const adhLink = adh
        ? `<span class="badge badge-info" style="font-size:.65rem;">${Utils.escapeHtml(adh.numero)} · ${Utils.escapeHtml(adh.type)}</span>`
        : '';
      const comptaBadge = d.recetteGeneree
        ? `<span class="badge badge-success" style="font-size:.65rem;">💶 Compta</span>`
        : `<span class="badge badge-warning" style="font-size:.65rem;">À transférer</span>`;
      const recuBadge = d.recuGenere
        ? `<span class="badge badge-success" style="font-size:.65rem;">📄 ${Utils.escapeHtml(d.recuNumero || '')}</span>`
        : (d.recuDemande ? `<span class="badge badge-info" style="font-size:.65rem;">📄 Reçu à générer</span>` : '');
      const sourceBadge = d.source === 'import-yapla'
        ? `<span class="badge badge-info" style="font-size:.65rem;">Yapla</span>`
        : `<span class="badge badge-neutral" style="font-size:.65rem;">Manuel</span>`;
      const nbV = (d.versements || []).length;
      const interBadge = d.interventionNumero
        ? `<span class="badge" style="font-size:.65rem;background:#fef3c7;color:#92400e;">🛠️ ${Utils.escapeHtml(d.interventionNumero)}</span>` : '';
      const recuBtn = ig
        ? `<button class="btn" style="padding:8px 12px;font-size:.8rem;background:var(--purple);" onclick="Dons.genererRecu(${d.id})">📄</button>`
        : '';

      return `
        <div class="adh-card" style="border-left-color:var(--purple);">
          <div class="adh-card-info">
            <div class="adh-card-name">
              ${Utils.escapeHtml(d.prenom)} ${Utils.escapeHtml(d.nom)}
              <span style="float:right;color:var(--success);font-weight:800;">${d.montantTotal.toFixed(2)} €</span>
            </div>
            <div class="adh-card-details">
              ${nbV} versement${nbV > 1 ? 's' : ''} · ${Utils.escapeHtml(d.email || '—')}<br>
              ${d.campagne ? '📢 ' + Utils.escapeHtml(d.campagne) + ' ' : ''}${interBadge}<br>
              ${sourceBadge} ${adhLink} ${comptaBadge} ${recuBadge}
            </div>
          </div>
          <div class="adh-card-actions">
            ${recuBtn}
            <button class="adh-btn-edit" onclick="Dons.openForm(${d.id})">✏️</button>
            <button class="adh-btn-del" onclick="Dons.remove(${d.id})">🗑️</button>
          </div>
        </div>`;
    }).join('');
  },

  getViewHTML() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) years.push(y);
    const optionsYears = years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('');

    return `
      <section class="view" id="view-dons">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Dons</h1><p>Campagne de dons et reçus fiscaux</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Dons.openImport()">📂 Importer Yapla</button>
            <button class="btn btn-ghost" onclick="Dons.exportCSV()">📥 Export CSV</button>
            <button class="btn" onclick="Dons.openForm()">➕ Nouveau don</button>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card success"><div class="stat-label">Total ${currentYear}</div><div class="stat-value" id="donsStatTotal">0,00 €</div><div class="stat-sub">Dons reçus</div></div>
          <div class="stat-card"><div class="stat-label">Donateurs</div><div class="stat-value" id="donsStatNb">0</div><div class="stat-sub">Nombre</div></div>
          <div class="stat-card purple"><div class="stat-label">Don moyen</div><div class="stat-value" id="donsStatMoyen">0,00 €</div><div class="stat-sub">Moyenne</div></div>
          <div class="stat-card warning"><div class="stat-label">À transférer</div><div class="stat-value" id="donsStatATransferer">0</div><div class="stat-sub">En compta</div></div>
        </div>
        <div class="card" style="padding:14px;">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:8px;">
            <input type="text" id="donsSearch" placeholder="🔍 Rechercher" oninput="Dons.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
            <select id="donsFilterYear" onchange="Dons.render()" style="padding:9px;border:1px solid var(--border);border-radius:8px;font-size:.88rem;">
              ${optionsYears}
            </select>
          </div>
          <button class="btn btn-success" style="width:100%;" onclick="Dons.genererRecettesCompta()">💰 Transférer les dons en comptabilité</button>
        </div>
        <div id="donsListContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="donsImportModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>Importer la liste des donateurs</h2>
            <button class="close-btn" onclick="Dons.closeImport()">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:14px;color:var(--text-light);font-size:.88rem;">
              Export Yapla « Liste des donateurs » (.xlsx).
            </p>
            <input type="file" id="donsImportFile" accept=".xlsx, .xls">
            <div style="margin-top:14px;display:flex;gap:10px;">
              <button class="btn" style="flex:1;" onclick="Dons.importFromExcel()">📂 Lancer</button>
              <button class="btn btn-ghost" onclick="Dons.closeImport()">Annuler</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal" id="donFormModal">
        <div class="modal-content" style="max-width:640px;">
          <div class="modal-header">
            <h2 id="donFormTitle">Nouveau don</h2>
            <button class="close-btn" onclick="Dons.closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="donForm" onsubmit="Dons.save(event)">
              <input type="hidden" id="donEditId">

              <div class="form-group">
                <label>Contact *</label>
                <select id="donContactMode" onchange="Dons.toggleContactMode()" style="margin-bottom:8px;">
                  <option value="existant">Contact existant</option>
                  <option value="nouveau">Nouveau contact</option>
                </select>
              </div>

              <div id="donContactExistantGroup">
                <div class="form-group">
                  <label>Sélectionner un contact</label>
                  <select id="donContactId"></select>
                </div>
              </div>

              <div id="donContactNouveauGroup" style="display:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                  <div class="form-group"><label>Prénom *</label><input type="text" id="donNewPrenom"></div>
                  <div class="form-group"><label>Nom *</label><input type="text" id="donNewNom"></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                  <div class="form-group"><label>Email</label><input type="email" id="donNewEmail"></div>
                  <div class="form-group"><label>Téléphone</label><input type="tel" id="donNewTel"></div>
                </div>
              </div>

              <hr style="border:none;border-top:1px solid var(--border);margin:14px 0;">

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Exercice fiscal *</label><input type="number" id="donExercice" required></div>
                <div class="form-group">
                  <label>Campagne</label>
                  <select id="donCampagne"></select>
                </div>
              </div>

              <div class="form-group">
                <label>Intervention liée (optionnel)</label>
                <select id="donIntervention"></select>
              </div>

              <div class="form-group" style="margin-top:10px;">
                <label style="display:flex;justify-content:space-between;align-items:center;">
                  <span>Versements *</span>
                  <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem;" onclick="Dons.addVersement()">➕ Ajouter</button>
                </label>
                <div id="donVersementsContainer" style="margin-top:8px;"></div>
                <div style="text-align:right;padding:10px;background:#f0fdf4;border-radius:8px;font-weight:700;color:#166534;">
                  Total : <span id="donTotalAffiche">0.00 €</span>
                </div>
              </div>

              <div class="form-group" id="donRecuGroup" style="padding:12px;background:#f0f9ff;border-radius:10px;border:1px solid #bfdbfe;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
                  <input type="checkbox" id="donRecuFiscal" style="width:auto;">
                  <span><strong>Émettre un reçu fiscal Cerfa 11580</strong><br>
                  <small style="color:var(--text-light);font-weight:400;">Nécessite la reconnaissance d'intérêt général.</small></span>
                </label>
              </div>

              <div class="form-group"><label>Notes (optionnel)</label><textarea id="donNotes" rows="2"></textarea></div>

              <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="submit" class="btn" style="flex:1;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" onclick="Dons.closeForm()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  },

  onShow() { this.render(); }
};

Router.register({
  view: 'dons',
  title: 'Dons',
  icon: '🎁',
  section: 'Activité',
  order: 4,
  getViewHTML: () => Dons.getViewHTML(),
  getModalsHTML: () => Dons.getModalsHTML(),
  onShow: () => Dons.onShow()
});
