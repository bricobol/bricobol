// ============================================================
// MODULE : STORAGE — Cache + Supabase + DELETE + dates vides
// ============================================================

const Storage = {
  PREFIX: 'bricobol_',
  cache: {},
  _charge: false,
  _syncActif: false,
  _fileAttente: [],

  _maps: {
    adherents: {
      aussi_benevole: 'aussiBenevole',
      date_creation: 'dateCreation',
      date_expiration: 'dateExpiration',
      yapla_id: 'yaplaId',
      institution_type: 'institutionType',
      adresse_depart: 'adresseDepart',
      remarque_generale: 'remarqueGenerale',
      condition_seul: 'conditionSeul',
      a_mettre_a_jour: 'aMettreAJour',
      date_ajout: 'dateAjout',
      updated_at: 'updatedAt'
    },
    cotisations: {
      adherent_id: 'adherentId',
      adherent_nom: 'adherentNom',
      compta_id: 'comptaId',
      compta_piece: 'comptaPiece',
      yapla_adhesion_numero: 'yaplaAdhesionNumero',
      date_creation: 'dateCreation',
      date_enregistrement: 'dateEnregistrement',
      date_validation: 'dateValidation',
      date_maj_import: 'dateMajImport',
      updated_at: 'updatedAt'
    },
    entries: {
      don_id: 'donId',
      versement_id: 'versementId',
      updated_at: 'updatedAt'
    },
    interventions: {
      date_creation: 'dateCreation',
      date_prevue: 'datePrevue',
      heure_prevue: 'heurePrevue',
      date_realisee: 'dateRealisee',
      heure_realisee: 'heureRealisee',
      adherent_id: 'adherentId',
      benevole_2: 'benevole2',
      a_relancer: 'aRelancer',
      pris_en_charge_le: 'prisEnChargeLe',
      demarree_le: 'demarreeLe',
      fini_le: 'finiLe',
      km_declares: 'kmDeclares',
      km_valides: 'kmValides',
      remarque_benevole: 'remarqueBenevole',
      validee_le: 'valideeLe',
      deplacement_id: 'deplacementId',
      updated_at: 'updatedAt'
    },
    deplacements: {
      date_remboursement: 'dateRemboursement',
      compta_id: 'comptaId',
      compta_piece: 'comptaPiece',
      mode_remboursement: 'modeRemboursement',
      note_remboursement: 'noteRemboursement',
      updated_at: 'updatedAt'
    },
    dons: {
      numero_donateur: 'numeroDonateur',
      adherent_id: 'adherentId',
      montant_total: 'montantTotal',
      nombre_dons: 'nombreDons',
      intervention_id: 'interventionId',
      intervention_numero: 'interventionNumero',
      recu_demande: 'recuDemande',
      recu_numero: 'recuNumero',
      recu_genere: 'recuGenere',
      date_recu: 'dateRecu',
      recette_generee: 'recetteGeneree',
      compta_ids: 'comptaIds',
      date_import: 'dateImport',
      updated_at: 'updatedAt'
    },
    evenements: {
      type_evenement: 'typeEvenement',
      heure_fin: 'heureFin',
      updated_at: 'updatedAt'
    },
    documents: {
      updated_at: 'updatedAt'
    }
  },

  // Convertit un objet app → SQL (camelCase → snake_case)
  // + FIX : convertit les chaînes vides "" en null pour les colonnes DATE
  _versSQL(table, obj) {
    const map = this._maps[table] || {};
    const out = { ...obj };
    if (out.id !== undefined) out.id = String(out.id);
    for (const sqlKey in map) {
      const appKey = map[sqlKey];
      if (out[appKey] !== undefined) {
        out[sqlKey] = out[appKey];
        delete out[appKey];
      }
    }
    // ✅ Convertir "" en null pour les colonnes DATE/TIMESTAMP
    const dateFields = [
      'date', 'date_creation', 'date_expiration', 'date_ajout',
      'date_enregistrement', 'date_validation', 'date_maj_import',
      'date_prevue', 'date_realisee', 'date_remboursement',
      'date_recu', 'date_import', 'updated_at'
    ];
    dateFields.forEach(f => {
      if (out[f] === '') out[f] = null;
    });
    return out;
  },

  // Convertit un objet SQL → app (snake_case → camelCase)
  // + reconvertit les id en nombres
  _versApp(table, obj) {
    const map = this._maps[table] || {};
    const out = { ...obj };
    for (const sqlKey in map) {
      const appKey = map[sqlKey];
      if (out[sqlKey] !== undefined) {
        out[appKey] = out[sqlKey];
        delete out[sqlKey];
      }
    }
    const idFields = ['id', 'adherentId', 'comptaId', 'donId', 'versementId', 'interventionId'];
    idFields.forEach(f => {
      if (out[f] !== undefined && out[f] !== null && typeof out[f] === 'string') {
        const n = Number(out[f]);
        if (!isNaN(n) && String(n) === out[f]) out[f] = n;
      }
    });
    return out;
  },

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  async chargerToutDepuisSupabase() {
    if (!SupaClient || !SupaClient.client) {
      console.warn('Supabase non connecté — utilisation localStorage');
      this._chargerDepuisLocal();
      return;
    }
    console.log('⏳ Chargement depuis Supabase...');
    const tables = ['adherents', 'cotisations', 'entries', 'interventions', 'deplacements', 'dons', 'evenements', 'documents'];
    for (const t of tables) {
      const rows = await SupaClient.chargerTout(t);
      if (rows === null) {
        this._chargerDepuisLocal();
        return;
      }
      this.cache[t] = rows.map(r => this._versApp(t, r));
    }
    const param = await SupaClient.getSingleton('parametres', 'id', 1);
    this.cache.parametres = param ? (param.data || {}) : {};
    const counter = await SupaClient.getSingleton('counters', 'key', 'adh_counter');
    this.cache.adh_counter = counter ? counter.value : 1;

    this._charge = true;
    this._sauverCacheLocal();
    console.log('✅ Chargé : ' + tables.map(t => t + '=' + (this.cache[t]||[]).length).join(', '));
    this._majBandeau();
  },

  _chargerDepuisLocal() {
    const tables = ['adherents', 'cotisations', 'entries', 'interventions', 'deplacements', 'dons', 'evenements', 'documents'];
    for (const t of tables) {
      this.cache[t] = this._getLocal(t, []);
    }
    this.cache.parametres = this._getLocal('parametres', {});
    this.cache.adh_counter = this._getLocal('adh_counter', 1);
    this._charge = true;
    console.log('📦 Chargé depuis localStorage (cache de secours)');
  },

  _sauverCacheLocal() {
    try {
      for (const t of ['adherents', 'cotisations', 'entries', 'interventions', 'deplacements', 'dons', 'evenements', 'documents', 'parametres', 'adh_counter']) {
        if (this.cache[t] !== undefined) {
          localStorage.setItem(this.PREFIX + t, JSON.stringify(this.cache[t]));
        }
      }
    } catch(e) { console.warn('Cache local plein', e); }
  },

  _getLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  },

  _setLocal(key, val) {
    try { localStorage.setItem(this.PREFIX + key, JSON.stringify(val)); } catch(e) {}
  },

  _majBandeau() {
    if (typeof SupaClient !== 'undefined' && SupaClient.renderBandeau) {
      SupaClient.renderBandeau();
    }
  },

  // ============================================================
  // API PUBLIQUE
  // ============================================================

  get(key, fallback = null) {
    if (this.cache[key] !== undefined) return this.cache[key];
    return this._getLocal(key, fallback);
  },

  set(key, value) {
    const ancienneValeur = this.cache[key];
    this.cache[key] = value;
    this._setLocal(key, value);
    this._derniereEcriture = Date.now();
    this._syncVersSupabase(key, value, ancienneValeur);
    return true;
  },

  remove(key) {
    delete this.cache[key];
    localStorage.removeItem(this.PREFIX + key);
    if (SupaClient && SupaClient.client && this._tableDeKey(key)) {
      SupaClient.toutSupprimer(this._tableDeKey(key));
    }
  },

  getAdherents() { return this.get('adherents', []); },
  saveAdherents(list) { this.set('adherents', list); },
  getCounter() { return this.get('adh_counter', 1); },
  saveCounter(n) { this.set('adh_counter', n); },
  getEntries() { return this.get('entries', []); },
  saveEntries(list) { this.set('entries', list); },
  getInterventions() { return this.get('interventions', []); },
  saveInterventions(list) { this.set('interventions', list); },
  getDeplacements() { return this.get('deplacements', []); },
  saveDeplacements(list) { this.set('deplacements', list); },
  getParametres() {
    return this.cache.parametres || this._getLocal('parametres', {
      baremeKm: 0.40, cotisationAnnuelle: 10, exerciceCourant: new Date().getFullYear()
    });
  },
  saveParametres(p) {
    this.cache.parametres = p;
    this._setLocal('parametres', p);
    if (SupaClient && SupaClient.client) {
      SupaClient.setSingleton('parametres', 'id', 1, p);
    }
    return true;
  },

  // ============================================================
  // SYNCHRONISATION
  // ============================================================

  _tableDeKey(key) {
    const map = {
      'adherents': 'adherents',
      'cotisations': 'cotisations',
      'entries': 'entries',
      'interventions': 'interventions',
      'deplacements': 'deplacements',
      'dons': 'dons',
      'evenements': 'evenements',
      'documents': 'documents'
    };
    return map[key] || null;
  },

  async _syncVersSupabase(key, value, ancienneValeur) {
    if (key === 'adh_counter') {
      if (SupaClient && SupaClient.client && SupaClient.enLigne) {
        SupaClient.setCounter('adh_counter', value);
      } else {
        this._fileAttente.push({ key, value, ancienneValeur });
        this._majBandeau();
      }
      return;
    }
    if (key === 'parametres') {
      if (SupaClient && SupaClient.client && SupaClient.enLigne) {
        SupaClient.setSingleton('parametres', 'id', 1, value);
      } else {
        this._fileAttente.push({ key, value, ancienneValeur });
        this._majBandeau();
      }
      return;
    }
    const table = this._tableDeKey(key);
    if (!table) return;

    if (!SupaClient || !SupaClient.client || !SupaClient.enLigne) {
      this._fileAttente.push({ key, value, ancienneValeur });
      console.log('📵 Hors-ligne — modif en attente :', key);
      this._majBandeau();
      return;
    }

    if (Array.isArray(value)) {
      this._syncActif = true;
      this._majBandeau();

      const rows = value.map(item => this._versSQL(table, item));
      const upRes = await SupaClient.upsert(table, rows);

      // DELETE des IDs qui étaient présents avant et plus maintenant
      if (Array.isArray(ancienneValeur) && ancienneValeur.length > 0) {
        const nouveauxIds = new Set(value.map(item => String(item.id)));
        const idsASupprimer = ancienneValeur
          .filter(item => item && item.id !== undefined && item.id !== null)
          .map(item => String(item.id))
          .filter(id => !nouveauxIds.has(id));

        if (idsASupprimer.length > 0) {
          console.log('🗑️ Suppression Supabase : ' + idsASupprimer.length + ' ligne(s) dans ' + table);
          const delRes = await SupaClient.supprimerIds(table, idsASupprimer);
          if (delRes.error) {
            console.error('Erreur DELETE', table, delRes.error);
          }
        }
      }

      this._syncActif = false;
      this._majBandeau();
      if (upRes.error) {
        this._fileAttente.push({ key, value, ancienneValeur });
        this._majBandeau();
      }
    }
  },

  async viderFileAttente() {
    if (this._fileAttente.length === 0) return;
    if (!SupaClient || !SupaClient.client || !SupaClient.enLigne) return;
    console.log('🔄 Vidage file d\'attente : ' + this._fileAttente.length + ' opérations');
    const file = [...this._fileAttente];
    this._fileAttente = [];
    this._majBandeau();
    for (const op of file) {
      await this._syncVersSupabase(op.key, op.value, op.ancienneValeur);
    }
  },

  // ============================================================
  // MIGRATION
  // ============================================================

  async migrerVersSupabase() {
    if (!SupaClient || !SupaClient.client) { alert('Pas connecté à Supabase'); return; }
    if (!SupaClient.enLigne) { alert('Vous êtes hors-ligne. Connectez-vous d\'abord.'); return; }
    if (!confirm('⚠️ Cette opération va envoyer TOUTES vos données locales vers Supabase.\n\nContinuer ?')) return;
    if (!confirm('Confirmation : vos données locales restent intactes, mais elles seront copiées sur le serveur.\n\nConfirmer ?')) return;

    const tables = ['adherents', 'cotisations', 'entries', 'interventions', 'deplacements', 'dons', 'evenements', 'documents'];
    let total = 0;
    const recap = [];

    for (const t of tables) {
      const localData = this._getLocal(t, []);
      if (!Array.isArray(localData) || localData.length === 0) {
        recap.push(`${t}: 0`);
        continue;
      }
      const rows = localData.map(item => this._versSQL(t, item));
      const res = await SupaClient.upsert(t, rows);
      if (!res.error) {
        total += rows.length;
        recap.push(`${t}: ${rows.length}`);
      } else {
        recap.push(`${t}: ERREUR`);
      }
    }

    const param = this._getLocal('parametres', {});
    await SupaClient.setSingleton('parametres', 'id', 1, param);

    const counter = this._getLocal('adh_counter', 1);
    await SupaClient.setCounter('adh_counter', counter);

    localStorage.setItem('bricobol_migre_v1', '1');

    alert(`✅ Migration terminée.\n\n${total} enregistrement(s) envoyé(s).\n\nDétail :\n${recap.join('\n')}`);

    await this.chargerToutDepuisSupabase();
    if (typeof Router !== 'undefined' && Router.currentView) {
      const mod = Router.registry[Router.currentView];
      if (mod && mod.onShow) mod.onShow();
    }
  },

  // ============================================================
  // RESET
  // ============================================================

  async toutVider() {
    if (!confirm('⚠️ Vider TOUT (local + Supabase) ?')) return;
    if (!confirm('Confirmation définitive ?')) return;

    const tables = ['adherents', 'cotisations', 'entries', 'interventions', 'deplacements', 'dons', 'evenements', 'documents'];
    for (const t of tables) {
      if (SupaClient && SupaClient.client) await SupaClient.toutSupprimer(t);
      localStorage.removeItem(this.PREFIX + t);
      this.cache[t] = [];
    }
    if (SupaClient && SupaClient.client) {
      await SupaClient.setSingleton('parametres', 'id', 1, {});
      await SupaClient.setCounter('adh_counter', 1);
    }
    localStorage.removeItem(this.PREFIX + 'parametres');
    localStorage.removeItem(this.PREFIX + 'adh_counter');
    this.cache.parametres = {};
    this.cache.adh_counter = 1;

    alert('✅ Tout est vidé.');
    location.reload();
  }
};

// ============================================================
// RAFRAÎCHISSEMENT AUTO
// ============================================================

let _dernierFocusRechargement = 0;

window.addEventListener('focus', async () => {
  if (!Storage._charge) return;
  if (typeof SupaClient === 'undefined' || !SupaClient.client) return;
  if (!SupaClient.enLigne) return;
  if (Date.now() - _dernierFocusRechargement < 30000) return;
  if (Storage._derniereEcriture && (Date.now() - Storage._derniereEcriture) < 8000) {
    console.log('⏭️ Focus ignoré (écriture récente)');
    return;
  }
  if (Storage._syncActif) {
    console.log('⏭️ Focus ignoré (sync en cours)');
    return;
  }
  _dernierFocusRechargement = Date.now();
  console.log('🔄 Retour de focus → rechargement');
  await Storage.chargerToutDepuisSupabase();
  if (typeof Router !== 'undefined' && Router.currentView) {
    const mod = Router.registry[Router.currentView];
    if (mod && mod.onShow) mod.onShow();
  }
});

window.addEventListener('online', async () => {
  console.log('🌐 Retour en ligne');
  if (typeof SupaClient !== 'undefined') {
    SupaClient.enLigne = true;
    SupaClient.renderBandeau();
  }
  await Storage.viderFileAttente();
});

window.addEventListener('offline', () => {
  console.log('📵 Hors-ligne');
  if (typeof SupaClient !== 'undefined') {
    SupaClient.enLigne = false;
    SupaClient.renderBandeau();
  }
});
