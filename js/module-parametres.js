// ============================================================
// MODULE : PARAMÈTRES — Configuration & sauvegardes (avec onglets)
// ============================================================

const Parametres = {

  currentTab: 'asso',

  ENGAGEMENTS_DEFAUT: [
    { id: 'terrain',       icon: '🛠️', label: 'Intervenant terrain',          desc: 'Fait des interventions chez les bénéficiaires', actif: true },
    { id: 'aide_asso',     icon: '🏢', label: 'Aide à l\'association',        desc: 'Bureau, permanence, administratif, compta', actif: true },
    { id: 'evenements',    icon: '🎪', label: 'Organisation d\'événements',   desc: 'Vide-greniers, fêtes, collectes, AG', actif: true },
    { id: 'communication', icon: '📣', label: 'Communication',                desc: 'Flyers, réseaux sociaux, presse, affichage', actif: true },
    { id: 'materiel',      icon: '🚚', label: 'Soutien matériel',             desc: 'Prête véhicule, local, outillage, matériel', actif: true },
    { id: 'formation',     icon: '🎓', label: 'Formation / transmission',     desc: 'Apprend aux autres, encadre', actif: true },
    { id: 'sympathisant',  icon: '👀', label: 'Sympathisant',                 desc: 'Juste tenu au courant, coup de main ponctuel', actif: true }
  ],

  COMPETENCES_DEFAUT: [
    { id: 'numerique', icon: '💻', label: 'Numérique', actif: true, items: [
      { id: 'demarches',   label: 'Démarches en ligne', actif: true },
      { id: 'pc',          label: 'Maintenance PC', actif: true },
      { id: 'mobile',      label: 'Smartphone / tablette', actif: true },
      { id: 'box',         label: 'Installation box / wifi', actif: true },
      { id: 'imprimante',  label: 'Configuration imprimante', actif: true },
      { id: 'sauvegarde',  label: 'Sauvegarde de données', actif: true },
      { id: 'visio',       label: 'Aide visio (Zoom, Teams…)', actif: true },
      { id: 'autre_num',   label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'bricolage', icon: '🛠️', label: 'Petit bricolage', actif: true, items: [
      { id: 'menuiserie',  label: 'Menuiserie', actif: true },
      { id: 'plomberie',   label: 'Plomberie légère', actif: true },
      { id: 'electricite', label: 'Électricité', actif: true },
      { id: 'peinture',    label: 'Peinture / papier peint', actif: true },
      { id: 'montage',     label: 'Montage de meubles', actif: true },
      { id: 'etageres',    label: 'Pose d\'étagères / tableaux', actif: true },
      { id: 'serrurerie',  label: 'Serrurerie légère', actif: true },
      { id: 'autre_bri',   label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'electromenager', icon: '⚡', label: 'Électroménager', actif: true, items: [
      { id: 'diagnostic',  label: 'Diagnostic panne', actif: true },
      { id: 'reparation',  label: 'Réparation', actif: true },
      { id: 'petits_app',  label: 'Petits appareils', actif: true },
      { id: 'branchement', label: 'Branchement / mise en route', actif: true },
      { id: 'autre_elec',  label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'coups_main', icon: '🤝', label: 'Petits coups de main extérieurs', actif: true, items: [
      { id: 'jardinage',   label: 'Petit jardinage', actif: true },
      { id: 'feuilles',    label: 'Ramassage de feuilles', actif: true },
      { id: 'taille',      label: 'Taille légère', actif: true },
      { id: 'nettoyage',   label: 'Nettoyage extérieur', actif: true },
      { id: 'acces',       label: 'Entretien des accès', actif: true },
      { id: 'arrosage',    label: 'Arrosage ponctuel', actif: true },
      { id: 'autre_ext',   label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'manutention', icon: '📦', label: 'Manutention', actif: true, items: [
      { id: 'port_leger',  label: 'Port de charges léger (1 pers.)', actif: true },
      { id: 'demenagement', label: 'Aide au déménagement (plusieurs pers.)', actif: true },
      { id: 'livraison',   label: 'Livraison courses / colis', actif: true },
      { id: 'conduite',    label: 'Conduite utilitaire', actif: true },
      { id: 'montage_dem', label: 'Montage / démontage meubles', actif: true },
      { id: 'autre_manu',  label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'cueillette', icon: '🍎', label: 'Cueillette solidaire', actif: true, items: [
      { id: 'fruits',      label: 'Fruits', actif: true },
      { id: 'legumes',     label: 'Légumes', actif: true },
      { id: 'maraichage',  label: 'Maraîchage', actif: true },
      { id: 'autre_cue',   label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'aide_personne', icon: '❤️', label: 'Aide à la personne', actif: true, items: [
      { id: 'courses',     label: 'Accompagnement courses', actif: true },
      { id: 'admin',       label: 'Accompagnement administratif', actif: true },
      { id: 'visite',      label: 'Visite de courtoisie', actif: true },
      { id: 'pers_agees',  label: 'Aide aux personnes âgées', actif: true },
      { id: 'autre_aide',  label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'transport', icon: '🚗', label: 'Transport', actif: true, items: [
      { id: 'personnes',   label: 'Transport de personnes', actif: true },
      { id: 'covoit',      label: 'Covoiturage solidaire', actif: true },
      { id: 'autre_trans', label: 'Autre', actif: true, libre: true }
    ]},
    { id: 'relationnel', icon: '💬', label: 'Relationnel & communication', actif: true, items: [
      { id: 'dons',        label: 'Collecte de dons / sponsors', actif: true },
      { id: 'animation',   label: 'Animation de groupe', actif: true },
      { id: 'accueil',     label: 'Accueil / permanence', actif: true },
      { id: 'parole',      label: 'Prise de parole en public', actif: true },
      { id: 'redaction',   label: 'Rédaction de courriers', actif: true },
      { id: 'photo',       label: 'Photographie / vidéo', actif: true },
      { id: 'encadrement', label: 'Encadrement de nouveaux bénévoles', actif: true },
      { id: 'ateliers',    label: 'Animation d\'ateliers', actif: true },
      { id: 'traduction',  label: 'Traduction', actif: true },
      { id: 'autre_rel',   label: 'Autre', actif: true, libre: true }
    ]}
  ],

  MESSAGE_BIENVENUE_DEFAUT: "Merci de rejoindre l'équipe 🤝\n\nCe petit formulaire nous aide à mieux te connaître pour te proposer des missions qui te correspondent vraiment. Prends 5 minutes pour le remplir tranquillement, il n'y a aucune obligation et tout est modifiable à tout moment.",

  TEXTE_ADHESION_DEFAUT: "Votre adhésion annuelle est à prix libre. Elle est automatique en tant que bénévole et votre statut de membre est acquis.\n\nMontant suggéré : 5 €. Vous pouvez donner plus, moins, ou mettre 0 pour ne rien donner — aucun jugement, donner de son temps est déjà énorme. C'est vous qui voyez.",

  PLATEFORMES: ['Yapla', 'HelloAsso', 'Stripe', 'PayPal', 'Autre'],

  getParam() {
    const p = Storage.get('parametres', {});
    return {
      nomAssociation: p.nomAssociation || 'Bricobol Aide Solidaire',
      emailContact: p.emailContact || 'bricobol.asso@proton.me',
      adresseAsso: p.adresseAsso || '',
      cpAsso: p.cpAsso || '',
      villeAsso: p.villeAsso || '',
      siretAsso: p.siretAsso || '',
      rnaAsso: p.rnaAsso || '',
      interetGeneral: !!p.interetGeneral,
      emettreRecusDefaut: !!p.emettreRecusDefaut,
      baremeKm: p.baremeKm || 0.40,
      cotisationAnnuelle: p.cotisationAnnuelle || 10,
      cotisationBenevoleSuggeree: p.cotisationBenevoleSuggeree || 5,
      seuilMecene: p.seuilMecene || 200,
      exerciceCourant: p.exerciceCourant || new Date().getFullYear(),
      campagnes: p.campagnes || ['Campagne annuelle'],
      engagements: p.engagements || JSON.parse(JSON.stringify(this.ENGAGEMENTS_DEFAUT)),
      competences: p.competences || JSON.parse(JSON.stringify(this.COMPETENCES_DEFAUT)),
      messageBienvenue: p.messageBienvenue || this.MESSAGE_BIENVENUE_DEFAUT,
      texteAdhesion: p.texteAdhesion || this.TEXTE_ADHESION_DEFAUT,
      paiements: p.paiements || {
        cb: { actif: true, lien: '', plateforme: 'Yapla' },
        virement: { actif: true, lien: '', plateforme: 'Yapla', iban: '', bic: '', titulaire: '' },
        espece: { actif: true, note: 'À remettre à un membre de l\'équipe' },
        cheque: { actif: true, note: 'À l\'ordre de l\'association', remiseEquipe: true, envoiCourrier: false }
      },
      signatureMessage: p.signatureMessage || "L'équipe BricoBol – aide solidaire",
      lienSiteMessage: p.lienSiteMessage || 'https://sites.google.com/view/bricobol',
      modelesMessages: p.modelesMessages || [
        { id: 'confirmation', label: '✅ Confirmation RDV', sujet: 'Confirmation de votre rendez-vous', corps: 'Bonjour {prenom},\n\nJe vous confirme notre rendez-vous le {date} à {heure}.\n\nN\'hésitez pas à nous contacter en cas de changement.' },
        { id: 'rappel', label: '⏰ Rappel RDV', sujet: 'Rappel : rendez-vous demain', corps: 'Bonjour {prenom},\n\nPetit rappel : nous avons rendez-vous demain à {heure}.\n\nÀ bientôt !' },
        { id: 'renouvellement', label: '💶 Renouvellement adhésion', sujet: 'Renouvellement de votre adhésion', corps: 'Bonjour {prenom},\n\nVotre adhésion à {asso} arrive à échéance. N\'hésitez pas à nous recontacter pour la renouveler.' },
        { id: 'evenement', label: '🎉 Événement', sujet: 'Invitation : {asso}', corps: 'Bonjour {prenom},\n\nNous avons le plaisir de vous inviter à notre prochain événement.\n\nAu plaisir de vous y voir !' },
        { id: 'autre', label: '📝 Autre', sujet: '', corps: '' }
      ],
    };
  },

  saveParam(p) { return Storage.set('parametres', p); },

  // ---------- Helpers ----------
  getEngagements(actifsSeulement = true) {
    const list = this.getParam().engagements || [];
    return actifsSeulement ? list.filter(e => e.actif !== false) : list;
  },
  getEngagement(id) { return this.getParam().engagements.find(e => e.id === id); },
  getCompetences(actifsSeulement = true) {
    const list = this.getParam().competences || [];
    if (!actifsSeulement) return list;
    return list.filter(c => c.actif !== false).map(c => ({ ...c, items: (c.items || []).filter(i => i.actif !== false) }));
  },
  getCompetenceItem(itemId) {
    for (const cat of this.getParam().competences) {
      const item = (cat.items || []).find(i => i.id === itemId);
      if (item) return { cat, item };
    }
    return null;
  },
  getPaiements() { return this.getParam().paiements; },
  getMessageBienvenue() { return this.getParam().messageBienvenue; },
  getTexteAdhesion() { return this.getParam().texteAdhesion; },
  getEmailContact() { return this.getParam().emailContact; },

  // ---------- Navigation onglets ----------
  setTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.param-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.param-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
    // Scroll en haut du contenu
    const c = document.getElementById('contentArea');
    if (c) c.scrollTop = 0;
  },

  // ---------- Rendu principal ----------
  render() {
    const p = this.getParam();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    // Onglet Association
    set('paramNomAsso', p.nomAssociation);
    set('paramEmailContact', p.emailContact);
    set('paramAdresseAsso', p.adresseAsso);
    set('paramCPAsso', p.cpAsso);
    set('paramVilleAsso', p.villeAsso);
    set('paramSiretAsso', p.siretAsso);
    set('paramRNAAsso', p.rnaAsso);

    // Onglet Cotisations
    set('paramCotisation', p.cotisationAnnuelle);
    set('paramCotisationBenevole', p.cotisationBenevoleSuggeree);
    set('paramTexteAdhesion', p.texteAdhesion);

    // Onglet Paiements
    const paie = p.paiements;
    setCheck('paramPaieCBActif', paie.cb.actif);
    set('paramPaieCBPlateforme', paie.cb.plateforme || 'Yapla');
    set('paramPaieCBLien', paie.cb.lien || '');
    setCheck('paramPaieVirementActif', paie.virement.actif);
    set('paramPaieVirementPlateforme', paie.virement.plateforme || 'Yapla');
    set('paramPaieVirementLien', paie.virement.lien || '');
    set('paramPaieIBAN', paie.virement.iban || '');
    set('paramPaieBIC', paie.virement.bic || '');
    set('paramPaieTitulaire', paie.virement.titulaire || '');
    setCheck('paramPaieEspeceActif', paie.espece.actif);
    set('paramPaieEspeceNote', paie.espece.note || '');
    setCheck('paramPaieChequeActif', paie.cheque.actif);
    set('paramPaieChequeNote', paie.cheque.note || '');
    setCheck('paramPaieChequeRemise', paie.cheque.remiseEquipe);
    setCheck('paramPaieChequeCourrier', paie.cheque.envoiCourrier);

    this.togglePaieCB();
    this.togglePaieVirement();
    this.togglePaieEspece();
    this.togglePaieCheque();

    // Onglet Bénévoles
    set('paramMessageBienvenue', p.messageBienvenue);

    // Onglet Dons
    setCheck('paramInteretGeneral', p.interetGeneral);
    setCheck('paramEmettreRecus', p.emettreRecusDefaut);
    set('paramSeuilMecene', p.seuilMecene);

    // Onglet Divers
    set('paramBareme', p.baremeKm);
    set('paramExercice', p.exerciceCourant);

    // Sous-listes
    this.renderCampagnes();
    this.renderEngagements();
    this.renderCompetences();
    // Onglet Messages
    set('paramSignatureMessage', p.signatureMessage);
    set('paramLienSiteMessage', p.lienSiteMessage);
    this.renderModelesMessages();
    this.updateStorageInfo();

    // Appliquer l'onglet courant
    this.setTab(this.currentTab);
  },

  togglePaieCB() { const a = document.getElementById('paramPaieCBActif')?.checked; const b = document.getElementById('paramPaieCBBody'); if (b) b.style.display = a ? 'block' : 'none'; },
  togglePaieVirement() { const a = document.getElementById('paramPaieVirementActif')?.checked; const b = document.getElementById('paramPaieVirementBody'); if (b) b.style.display = a ? 'block' : 'none'; },
  togglePaieEspece() { const a = document.getElementById('paramPaieEspeceActif')?.checked; const b = document.getElementById('paramPaieEspeceBody'); if (b) b.style.display = a ? 'block' : 'none'; },
  togglePaieCheque() { const a = document.getElementById('paramPaieChequeActif')?.checked; const b = document.getElementById('paramPaieChequeBody'); if (b) b.style.display = a ? 'block' : 'none'; },

  copierTexte(texte) {
    if (!texte) return;
    navigator.clipboard.writeText(texte).then(() => alert('✅ Copié.'))
      .catch(() => prompt('Copie manuelle (Ctrl+C) :', texte));
  },

  // ---------- Campagnes ----------
  renderCampagnes() {
    const p = this.getParam();
    const c = document.getElementById('paramCampagnesList');
    if (!c) return;
    if (p.campagnes.length === 0) { c.innerHTML = '<div style="color:var(--text-light);font-size:.85rem;padding:8px;">Aucune campagne.</div>'; return; }
    c.innerHTML = p.campagnes.map((n, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-alt);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
        <span>${Utils.escapeHtml(n)}</span>
        <button type="button" onclick="Parametres.supprimerCampagne(${i})" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.8rem;">✕</button>
      </div>`).join('');
  },
  ajouterCampagne() {
    const input = document.getElementById('paramNouvelleCampagne');
    const nom = (input.value || '').trim();
    if (!nom) { alert('Saisissez un nom.'); return; }
    const p = this.getParam();
    if (p.campagnes.includes(nom)) { alert('Existe déjà.'); return; }
    p.campagnes.push(nom);
    this.saveParam(p);
    input.value = '';
    this.renderCampagnes();
  },
  supprimerCampagne(i) {
    const p = this.getParam();
    if (!confirm(`Supprimer "${p.campagnes[i]}" ?`)) return;
    p.campagnes.splice(i, 1);
    this.saveParam(p);
    this.renderCampagnes();
  },

  // ---------- Engagements ----------
  renderEngagements() {
    const c = document.getElementById('paramEngagementsList');
    if (!c) return;
    const list = this.getParam().engagements;
    c.innerHTML = list.map((e, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:${e.actif === false ? '#f8fafc' : '#fff'};border:1px solid var(--border);border-radius:8px;margin-bottom:6px;${e.actif === false ? 'opacity:.6;' : ''}">
        <span style="font-size:1.2rem;">${e.icon || '❓'}</span>
        <div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:.9rem;">${Utils.escapeHtml(e.label)}</div>${e.desc ? `<div style="font-size:.75rem;color:var(--text-light);">${Utils.escapeHtml(e.desc)}</div>` : ''}</div>
        <button type="button" onclick="Parametres.toggleEngagement(${i})" style="background:${e.actif === false ? 'var(--success)' : 'var(--warning)'};color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.75rem;">${e.actif === false ? '👁️' : '🚫'}</button>
        <button type="button" onclick="Parametres.editEngagement(${i})" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.75rem;">✏️</button>
        <button type="button" onclick="Parametres.supprimerEngagement(${i})" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.75rem;">🗑️</button>
      </div>`).join('');
  },
  toggleEngagement(i) { const p = this.getParam(); p.engagements[i].actif = p.engagements[i].actif === false ? true : false; this.saveParam(p); this.renderEngagements(); },
  editEngagement(i) {
    const p = this.getParam();
    const e = p.engagements[i];
    const l = prompt(`Renommer "${e.label}" :`, e.label);
    if (l === null) return;
    const ic = prompt(`Icône :`, e.icon || '');
    if (ic === null) return;
    p.engagements[i].label = l.trim() || e.label;
    p.engagements[i].icon = ic.trim() || e.icon;
    this.saveParam(p);
    this.renderEngagements();
  },
  ajouterEngagement() {
    const l = prompt('Nom :');
    if (!l || !l.trim()) return;
    const ic = prompt('Icône :', '✨') || '✨';
    const p = this.getParam();
    p.engagements.push({ id: 'eng_' + Date.now(), icon: ic.trim(), label: l.trim(), desc: '', actif: true });
    this.saveParam(p);
    this.renderEngagements();
  },
  supprimerEngagement(i) {
    const p = this.getParam();
    const e = p.engagements[i];
    const adh = Storage.getAdherents();
    const used = adh.filter(a => (a.engagements || []).includes(e.id)).length;
    let m = `Supprimer "${e.label}" ?`;
    if (used > 0) m += `\n\n⚠️ ${used} bénévole(s) l'ont coché.`;
    if (!confirm(m)) return;
    if (used > 0) { adh.forEach(a => { if (a.engagements) a.engagements = a.engagements.filter(x => x !== e.id); }); Storage.saveAdherents(adh); }
    p.engagements.splice(i, 1);
    this.saveParam(p);
    this.renderEngagements();
  },

  // ---------- Compétences ----------
  renderCompetences() {
    const c = document.getElementById('paramCompetencesList');
    if (!c) return;
    const list = this.getParam().competences;
    c.innerHTML = list.map((cat, i) => `
      <div style="border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:10px;background:${cat.actif === false ? '#f8fafc' : '#fff'};${cat.actif === false ? 'opacity:.6;' : ''}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:1.3rem;">${cat.icon || '📁'}</span>
          <div style="flex:1;font-weight:700;">${Utils.escapeHtml(cat.label)}</div>
          <button type="button" onclick="Parametres.toggleCompetenceCat(${i})" style="background:${cat.actif === false ? 'var(--success)' : 'var(--warning)'};color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.75rem;">${cat.actif === false ? '👁️' : '🚫'}</button>
          <button type="button" onclick="Parametres.editCompetenceCat(${i})" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.75rem;">✏️</button>
          <button type="button" onclick="Parametres.supprimerCompetenceCat(${i})" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.75rem;">🗑️</button>
        </div>
        <div style="padding-left:10px;">
          ${(cat.items || []).map((item, j) => `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;font-size:.85rem;${item.actif === false ? 'opacity:.5;' : ''}">
              <span style="flex:1;">${item.libre ? '✏️' : '•'} ${Utils.escapeHtml(item.label)}</span>
              ${item.libre ? '<span style="font-size:.7rem;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:6px;">Libre</span>' : ''}
              <button type="button" onclick="Parametres.toggleCompetenceItem(${i}, ${j})" style="background:transparent;border:none;cursor:pointer;font-size:.85rem;">${item.actif === false ? '👁️' : '🚫'}</button>
              ${!item.libre ? `<button type="button" onclick="Parametres.editCompetenceItem(${i}, ${j})" style="background:transparent;border:none;cursor:pointer;font-size:.85rem;">✏️</button>` : ''}
              <button type="button" onclick="Parametres.supprimerCompetenceItem(${i}, ${j})" style="background:transparent;border:none;cursor:pointer;font-size:.85rem;">🗑️</button>
            </div>`).join('')}
          <button type="button" onclick="Parametres.ajouterCompetenceItem(${i})" style="margin-top:6px;background:var(--bg-alt);color:var(--text);border:1px dashed var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.8rem;">➕ Ajouter</button>
        </div>
      </div>`).join('');
  },
  toggleCompetenceCat(i) { const p = this.getParam(); p.competences[i].actif = p.competences[i].actif === false ? true : false; this.saveParam(p); this.renderCompetences(); },
  editCompetenceCat(i) {
    const p = this.getParam();
    const cat = p.competences[i];
    const l = prompt(`Renommer "${cat.label}" :`, cat.label);
    if (l === null) return;
    const ic = prompt(`Icône :`, cat.icon || '') || cat.icon;
    p.competences[i].label = l.trim() || cat.label;
    p.competences[i].icon = ic.trim();
    this.saveParam(p);
    this.renderCompetences();
  },
  ajouterCompetenceCat() {
    const l = prompt('Nom de la catégorie :');
    if (!l || !l.trim()) return;
    const ic = prompt('Icône :', '📁') || '📁';
    const p = this.getParam();
    p.competences.push({ id: 'cat_' + Date.now(), icon: ic.trim(), label: l.trim(), actif: true, items: [{ id: 'autre_' + Date.now(), label: 'Autre', actif: true, libre: true }] });
    this.saveParam(p);
    this.renderCompetences();
  },
  supprimerCompetenceCat(i) {
    const p = this.getParam();
    const cat = p.competences[i];
    const adh = Storage.getAdherents();
    const ids = (cat.items || []).map(it => it.id);
    let used = 0;
    adh.forEach(a => { if (a.competences) ids.forEach(id => { if (a.competences[id]) used++; }); });
    let m = `Supprimer "${cat.label}" ?`;
    if (used > 0) m += `\n\n⚠️ ${used} compétence(s) seront retirées.`;
    if (!confirm(m)) return;
    if (used > 0) { adh.forEach(a => { if (a.competences) ids.forEach(id => { delete a.competences[id]; }); }); Storage.saveAdherents(adh); }
    p.competences.splice(i, 1);
    this.saveParam(p);
    this.renderCompetences();
  },
  toggleCompetenceItem(i, j) { const p = this.getParam(); p.competences[i].items[j].actif = p.competences[i].items[j].actif === false ? true : false; this.saveParam(p); this.renderCompetences(); },
  editCompetenceItem(i, j) {
    const p = this.getParam();
    const item = p.competences[i].items[j];
    const l = prompt(`Renommer "${item.label}" :`, item.label);
    if (l === null) return;
    p.competences[i].items[j].label = l.trim() || item.label;
    this.saveParam(p);
    this.renderCompetences();
  },
  ajouterCompetenceItem(i) {
    const l = prompt('Nom :');
    if (!l || !l.trim()) return;
    const p = this.getParam();
    p.competences[i].items.push({ id: 'item_' + Date.now(), label: l.trim(), actif: true, libre: false });
    this.saveParam(p);
    this.renderCompetences();
  },
  supprimerCompetenceItem(i, j) {
    const p = this.getParam();
    const item = p.competences[i].items[j];
    const adh = Storage.getAdherents();
    let used = 0;
    adh.forEach(a => { if (a.competences && a.competences[item.id]) used++; });
    let m = `Supprimer "${item.label}" ?`;
    if (used > 0) m += `\n\n⚠️ ${used} bénévole(s) l'ont cochée.`;
    if (!confirm(m)) return;
    if (used > 0) { adh.forEach(a => { if (a.competences) delete a.competences[item.id]; }); Storage.saveAdherents(adh); }
    p.competences[i].items.splice(j, 1);
    this.saveParam(p);
    this.renderCompetences();
  },
    renderModelesMessages() {
    const c = document.getElementById('paramModelesMessages');
    if (!c) return;
    const p = this.getParam();
    const ms = p.modelesMessages || [];
    if (ms.length === 0) {
      c.innerHTML = '<div style="color:var(--text-light);font-size:.85rem;padding:8px;">Aucun modèle. Cliquez sur ➕ Ajouter pour en créer un.</div>';
      return;
    }
    c.innerHTML = ms.map((m, i) => `
      <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px;background:#f8fafc;">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <input type="text" class="modeleTitre" data-idx="${i}" value="${Utils.escapeHtml(m.label || '')}" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:.9rem;font-weight:700;">
          <button type="button" onclick="Parametres.supprimerModeleMessage(${i})" style="background:var(--danger);color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:.85rem;" title="Supprimer ce modèle">✖️</button>
        </div>
        <div class="form-group">
          <label style="font-size:.78rem;">Sujet (email)</label>
          <input type="text" class="modeleSujet" data-idx="${i}" value="${Utils.escapeHtml(m.sujet || '')}" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:.85rem;">
        </div>
        <div class="form-group">
          <label style="font-size:.78rem;">Corps du message</label>
          <textarea class="modeleCorps" data-idx="${i}" rows="4" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:.85rem;font-family:inherit;">${Utils.escapeHtml(m.corps || '')}</textarea>
        </div>
      </div>
    `).join('') + `
      <button type="button" class="btn" onclick="Parametres.ajouterModeleMessage()" style="width:100%;margin-top:8px;background:var(--success);">➕ Ajouter un modèle</button>
    `;
  },

  ajouterModeleMessage() {
    const msg = `Type de modèle à créer :

1. Court (messages simples)
2. Formel (messages officiels)

Tapez 1 ou 2 :`;
    const choix = prompt(msg, '1');
    if (choix === null) return;
    const p = this.getParam();
    p.modelesMessages = p.modelesMessages || [];
    let nouveau;
    if (choix === '2') {
      nouveau = {
        id: 'modele_' + Date.now(),
        label: 'Nouveau modèle formel',
        sujet: '',
        corps: `Bonjour {prenom} {nom},

[votre message]

Nous restons à votre disposition pour toute question.

Cordialement,
L'équipe {asso}
{site}`
      };
    } else {
      nouveau = {
        id: 'modele_' + Date.now(),
        label: 'Nouveau modèle court',
        sujet: '',
        corps: `Bonjour {prenom},

[votre message]

Cordialement,
{asso}`
      };
    }
    p.modelesMessages.push(nouveau);
    this.saveParam(p);
    this.renderModelesMessages();
  },

  supprimerModeleMessage(i) {
    const p = this.getParam();
    const m = (p.modelesMessages || [])[i];
    if (!m) return;
    if (!confirm('Supprimer le modèle "' + (m.label || 'sans titre') + '" ?')) return;
    p.modelesMessages.splice(i, 1);
    this.saveParam(p);
    this.renderModelesMessages();
  },
  resetCompetences() { if (!confirm('Réinitialiser ?')) return; const p = this.getParam(); p.competences = JSON.parse(JSON.stringify(this.COMPETENCES_DEFAUT)); this.saveParam(p); this.renderCompetences(); },
  resetEngagements() { if (!confirm('Réinitialiser ?')) return; const p = this.getParam(); p.engagements = JSON.parse(JSON.stringify(this.ENGAGEMENTS_DEFAUT)); this.saveParam(p); this.renderEngagements(); },
  resetMessageBienvenue() { if (!confirm('Réinitialiser ?')) return; const p = this.getParam(); p.messageBienvenue = this.MESSAGE_BIENVENUE_DEFAUT; this.saveParam(p); document.getElementById('paramMessageBienvenue').value = p.messageBienvenue; },
  resetTexteAdhesion() { if (!confirm('Réinitialiser ?')) return; const p = this.getParam(); p.texteAdhesion = this.TEXTE_ADHESION_DEFAUT; this.saveParam(p); document.getElementById('paramTexteAdhesion').value = p.texteAdhesion; },
  
  // ---------- Storage info ----------
  updateStorageInfo() {
    const el = document.getElementById('paramStorageInfo');
    if (!el) return;
    let total = 0;
    const d = [];
    const keys = [
      { k: 'adherents', label: 'Contacts' }, { k: 'adh_counter', label: 'Compteur' },
      { k: 'cotisations', label: 'Cotisations' }, { k: 'entries', label: 'Compta' },
      { k: 'interventions', label: 'Interventions' }, { k: 'deplacements', label: 'Déplacements' },
      { k: 'dons', label: 'Dons' }, { k: 'evenements', label: 'Événements' },
      { k: 'documents', label: 'Documents' }, { k: 'parametres', label: 'Paramètres' }
    ];
    keys.forEach(({ k, label }) => {
      const size = (localStorage.getItem('bricobol_' + k) || '').length;
      total += size;
      d.push(`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.85rem;"><span>${label}</span><span style="color:var(--text-light);">${(size / 1024).toFixed(2)} Ko</span></div>`);
    });
    el.innerHTML = d.join('') + `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:.9rem;font-weight:700;border-top:1px solid var(--border);margin-top:6px;"><span>Total</span><span style="color:var(--accent);">${(total / 1024).toFixed(2)} Ko</span></div>`;
  },

  // ---------- Sauvegarde des paramètres ----------
  saveParams(event) {
    if (event) event.preventDefault();
    const p = this.getParam();

    // Onglet Association
    p.nomAssociation = document.getElementById('paramNomAsso').value.trim() || 'Bricobol Aide Solidaire';
    p.emailContact = document.getElementById('paramEmailContact').value.trim() || 'bricobol.asso@proton.me';
    p.adresseAsso = document.getElementById('paramAdresseAsso').value.trim();
    p.cpAsso = document.getElementById('paramCPAsso').value.trim();
    p.villeAsso = document.getElementById('paramVilleAsso').value.trim();
    p.siretAsso = document.getElementById('paramSiretAsso').value.trim();
    p.rnaAsso = document.getElementById('paramRNAAsso').value.trim();

    // Onglet Cotisations
    p.cotisationAnnuelle = parseFloat(document.getElementById('paramCotisation').value) || 10;
    p.cotisationBenevoleSuggeree = parseFloat(document.getElementById('paramCotisationBenevole').value) || 5;
    p.texteAdhesion = document.getElementById('paramTexteAdhesion').value.trim() || this.TEXTE_ADHESION_DEFAUT;

    // Onglet Paiements
    p.paiements = {
      cb: {
        actif: document.getElementById('paramPaieCBActif').checked,
        plateforme: document.getElementById('paramPaieCBPlateforme').value,
        lien: document.getElementById('paramPaieCBLien').value.trim()
      },
      virement: {
        actif: document.getElementById('paramPaieVirementActif').checked,
        plateforme: document.getElementById('paramPaieVirementPlateforme').value,
        lien: document.getElementById('paramPaieVirementLien').value.trim(),
        iban: document.getElementById('paramPaieIBAN').value.trim(),
        bic: document.getElementById('paramPaieBIC').value.trim(),
        titulaire: document.getElementById('paramPaieTitulaire').value.trim()
      },
      espece: {
        actif: document.getElementById('paramPaieEspeceActif').checked,
        note: document.getElementById('paramPaieEspeceNote').value.trim()
      },
      cheque: {
        actif: document.getElementById('paramPaieChequeActif').checked,
        note: document.getElementById('paramPaieChequeNote').value.trim(),
        remiseEquipe: document.getElementById('paramPaieChequeRemise').checked,
        envoiCourrier: document.getElementById('paramPaieChequeCourrier').checked
      }
    };

    // Onglet Bénévoles
    p.messageBienvenue = document.getElementById('paramMessageBienvenue').value.trim() || this.MESSAGE_BIENVENUE_DEFAUT;

    // Onglet Dons
    p.interetGeneral = document.getElementById('paramInteretGeneral').checked;
    p.emettreRecusDefaut = document.getElementById('paramEmettreRecus').checked;
    p.seuilMecene = parseFloat(document.getElementById('paramSeuilMecene').value) || 200;

    // Onglet Divers
    p.baremeKm = parseFloat(document.getElementById('paramBareme').value) || 0.40;
    p.exerciceCourant = parseInt(document.getElementById('paramExercice').value) || new Date().getFullYear();


    // Onglet Messages
    p.signatureMessage = document.getElementById('paramSignatureMessage').value.trim() || "L'équipe BricoBol – aide solidaire";
    p.lienSiteMessage = document.getElementById('paramLienSiteMessage').value.trim() || 'https://sites.google.com/view/bricobol';
    p.modelesMessages = p.modelesMessages || [];
        document.querySelectorAll('.modeleTitre').forEach(el => {
      const i = parseInt(el.dataset.idx);
      if (p.modelesMessages && p.modelesMessages[i]) p.modelesMessages[i].label = el.value;
    });
    document.querySelectorAll('.modeleSujet').forEach(el => {
      const i = parseInt(el.dataset.idx);
      if (p.modelesMessages[i]) p.modelesMessages[i].sujet = el.value;
    });
    document.querySelectorAll('.modeleCorps').forEach(el => {
      const i = parseInt(el.dataset.idx);
      if (p.modelesMessages[i]) p.modelesMessages[i].corps = el.value;
    });
    this.saveParam(p);
    alert('✅ Paramètres enregistrés.');
  },

  // ---------- Export JSON ----------
    async migrerVersSupabase() {
    await Storage.migrerVersSupabase();
    if (typeof BricoBol !== 'undefined') BricoBol.updateStorageInfo();
  },

    exportJSON() {
    if (typeof Notifier !== 'undefined' && Notifier.exporterPartager) {
      Notifier.exporterPartager();
      return;
    }
    // Fallback (Notifier non chargé)
    const data = {
      version: '1.0', dateExport: new Date().toISOString(),
      association: this.getParam().nomAssociation,
      adherents: Storage.getAdherents(), adh_counter: Storage.getCounter(),
      entries: Storage.getEntries(), interventions: Storage.getInterventions(),
      deplacements: Storage.getDeplacements(), cotisations: Storage.get('cotisations', []),
      dons: Storage.get('dons', []), evenements: Storage.get('evenements', []),
      documents: Storage.get('documents', []), parametres: this.getParam()
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bricobol_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  // ---------- Import JSON ----------
  importJSON() {
    const file = document.getElementById('paramImportFile').files[0];
    if (!file) { alert('Choisissez un fichier .json'); return; }
    if (!confirm('⚠️ Cela va REMPLACER toutes les données.\n\nContinuer ?')) { document.getElementById('paramImportFile').value = ''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version) { alert('Fichier non reconnu.'); return; }
        if (data.adherents) Storage.saveAdherents(data.adherents);
        if (data.adh_counter) Storage.saveCounter(data.adh_counter);
        if (data.entries) Storage.saveEntries(data.entries);
        if (data.interventions) Storage.saveInterventions(data.interventions);
        if (data.deplacements) Storage.saveDeplacements(data.deplacements);
        if (data.cotisations) Storage.set('cotisations', data.cotisations);
        if (data.dons) Storage.set('dons', data.dons);
        if (data.evenements) Storage.set('evenements', data.evenements);
        if (data.documents) Storage.set('documents', data.documents);
        if (data.parametres) this.saveParam(data.parametres);
        alert('✅ Sauvegarde restaurée.\n\nLa page va se recharger.');
        location.reload();
      } catch (err) { console.error(err); alert('Erreur de lecture.'); }
    };
    reader.readAsText(file);
  },

  // ---------- Réinitialisations ----------
  resetAll() {
    if (!confirm('⚠️ Effacer TOUTES les données ?')) return;
    if (!confirm('Confirmation définitive ?')) return;
    ['adherents', 'adh_counter', 'entries', 'interventions', 'deplacements', 'cotisations', 'dons', 'evenements', 'documents', 'parametres'].forEach(k => Storage.remove(k));
    alert('Tout effacé.');
    location.reload();
  },
  resetOnlyCompta() { if (!confirm('Vider la compta ?')) return; Storage.remove('entries'); if (typeof Compta !== 'undefined') Compta.render(); },
  resetOnlyInterventions() { if (!confirm('Vider les interventions ?')) return; Storage.remove('interventions'); if (typeof Interventions !== 'undefined') Interventions.render(); },
  resetOnlyDeplacements() { if (!confirm('Vider les déplacements ?')) return; Storage.remove('deplacements'); if (typeof Frais !== 'undefined') Frais.render(); },
  resetOnlyDons() { if (!confirm('Vider les dons ?')) return; Storage.remove('dons'); if (typeof Dons !== 'undefined') Dons.render(); },
  resetOnlyCotisations() { if (!confirm('Vider les cotisations ?')) return; Storage.remove('cotisations'); if (typeof Cotisations !== 'undefined') Cotisations.render(); },
  resetOnlyContacts() {
    if (!confirm('⚠️ Supprimer TOUS les contacts (adhérents, bénévoles, donateurs) ?\n\nLes recettes, cotisations et dons en compta NE seront PAS supprimés.')) return;
    if (!confirm('Confirmation définitive ?')) return;
    Storage.remove('adherents');
    Storage.remove('adh_counter');
    alert('Tous les contacts ont été effacés.');
    if (typeof Adherents !== 'undefined') Adherents.render();
    if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
  },
  
  // ---------- Vue HTML avec onglets ----------
  getViewHTML() {
    const plateformesOptions = (sel) => this.PLATEFORMES.map(p => `<option value="${p}" ${p === sel ? 'selected' : ''}>${p}</option>`).join('');
    return `
      <section class="view" id="view-parametres">
        <div class="view-header"><h1>Paramètres</h1><p>Configuration, sauvegardes et maintenance</p></div>

        <div class="param-tabs">
  <button type="button" class="param-tab active" data-tab="asso" onclick="Parametres.setTab('asso')">🏛️ Association</button>
  <button type="button" class="param-tab" data-tab="cotisations" onclick="Parametres.setTab('cotisations')">💶 Cotisations</button>
  <button type="button" class="param-tab" data-tab="paiements" onclick="Parametres.setTab('paiements')">💳 Paiements</button>
  <button type="button" class="param-tab" data-tab="benevoles" onclick="Parametres.setTab('benevoles')">🤝 Bénévoles</button>
  <button type="button" class="param-tab" data-tab="dons" onclick="Parametres.setTab('dons')">🎁 Dons</button>
  <button type="button" class="param-tab" data-tab="messages" onclick="Parametres.setTab('messages')">✉️ Messages</button>
  <button type="button" class="param-tab" data-tab="divers" onclick="Parametres.setTab('divers')">⚙️ Divers</button>
  <button type="button" class="param-tab" data-tab="donnees" onclick="Parametres.setTab('donnees')">💾 Données</button>
</div>

        <form onsubmit="Parametres.saveParams(event)">

          <!-- ============ ONGLET ASSOCIATION ============ -->
          <div class="param-panel active" data-panel="asso">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">🏛️ Identité de l'association</h3>
              <div class="form-group"><label>Nom</label><input type="text" id="paramNomAsso"></div>
              <div class="form-group"><label>Email de contact (reçoit les fiches bénévoles)</label><input type="email" id="paramEmailContact" placeholder="bricobol.asso@proton.me"></div>
              <div class="form-group"><label>Adresse</label><input type="text" id="paramAdresseAsso"></div>
              <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;">
                <div class="form-group"><label>Code postal</label><input type="text" id="paramCPAsso"></div>
                <div class="form-group"><label>Ville</label><input type="text" id="paramVilleAsso"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>SIRET</label><input type="text" id="paramSiretAsso"></div>
                <div class="form-group"><label>N° RNA</label><input type="text" id="paramRNAAsso"></div>
              </div>
              <button type="submit" class="btn" style="width:100%;">💾 Enregistrer</button>
            </div>
          </div>

          <!-- ============ ONGLET COTISATIONS ============ -->
          <div class="param-panel" data-panel="cotisations">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">💶 Cotisations</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Cotisation adhérent (€)</label><input type="number" step="0.01" id="paramCotisation"></div>
                <div class="form-group"><label>Cotisation bénévole suggérée (€)</label><input type="number" step="0.01" id="paramCotisationBenevole"></div>
              </div>
              <div class="form-group" style="background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #dcfce7;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <label style="margin:0;color:#166534;font-weight:700;">Texte d'explication (formulaire bénévole)</label>
                  <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:.72rem;" onclick="Parametres.resetTexteAdhesion()">🔄</button>
                </div>
                <textarea id="paramTexteAdhesion" rows="5" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;"></textarea>
              </div>
              <button type="submit" class="btn" style="width:100%;">💾 Enregistrer</button>
            </div>
          </div>

          <!-- ============ ONGLET PAIEMENTS ============ -->
          <div class="param-panel" data-panel="paiements">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:6px;color:var(--primary);font-weight:700;">💳 Paiements acceptés</h3>
              <p style="font-size:.82rem;color:var(--text-light);margin-bottom:14px;">Les infos "PUBLIC" apparaissent dans le formulaire bénévole. L'IBAN reste privé.</p>

              <div style="margin-bottom:12px;border:1px solid var(--border);border-radius:10px;padding:12px;background:#f8fafc;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px;">
                  <input type="checkbox" id="paramPaieCBActif" onchange="Parametres.togglePaieCB()" style="width:auto;">
                  <span>💳 <strong>CB en ligne</strong> <span style="font-size:.72rem;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:8px;">PUBLIC</span></span>
                </label>
                <div id="paramPaieCBBody" style="display:none;padding-left:22px;">
                  <div class="form-group"><label>Plateforme</label><select id="paramPaieCBPlateforme">${plateformesOptions('Yapla')}</select></div>
                  <div class="form-group"><label>Lien de paiement</label><input type="url" id="paramPaieCBLien" placeholder="https://..."></div>
                </div>
              </div>

              <div style="margin-bottom:12px;border:1px solid var(--border);border-radius:10px;padding:12px;background:#f8fafc;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px;">
                  <input type="checkbox" id="paramPaieVirementActif" onchange="Parametres.togglePaieVirement()" style="width:auto;">
                  <span>🏦 <strong>Virement</strong> <span style="font-size:.72rem;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:8px;">PUBLIC</span> <span style="font-size:.72rem;background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:8px;">IBAN privé</span></span>
                </label>
                <div id="paramPaieVirementBody" style="display:none;padding-left:22px;">
                  <div class="form-group"><label>Plateforme (si en ligne)</label><select id="paramPaieVirementPlateforme">${plateformesOptions('Yapla')}</select></div>
                  <div class="form-group"><label>Lien de paiement (optionnel)</label><input type="url" id="paramPaieVirementLien" placeholder="https://..."></div>
                  <div style="margin-top:12px;padding:10px;background:#fef3c7;border-radius:8px;border:1px solid #fcd34d;">
                    <div style="font-size:.78rem;color:#92400e;margin-bottom:6px;font-weight:700;">🔐 Coordonnées bancaires (jamais publiées)</div>
                    <div class="form-group"><label>Titulaire</label><input type="text" id="paramPaieTitulaire"></div>
                    <div class="form-group"><label>IBAN</label><input type="text" id="paramPaieIBAN"></div>
                    <div class="form-group"><label>BIC</label><input type="text" id="paramPaieBIC"></div>
                    <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.78rem;" onclick="Parametres.copierTexte('Titulaire : ' + document.getElementById('paramPaieTitulaire').value + '\\nIBAN : ' + document.getElementById('paramPaieIBAN').value + '\\nBIC : ' + document.getElementById('paramPaieBIC').value)">📋 Copier</button>
                  </div>
                </div>
              </div>

              <div style="margin-bottom:12px;border:1px solid var(--border);border-radius:10px;padding:12px;background:#f8fafc;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px;">
                  <input type="checkbox" id="paramPaieEspeceActif" onchange="Parametres.togglePaieEspece()" style="width:auto;">
                  <span>💵 <strong>Espèces</strong> <span style="font-size:.72rem;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:8px;">PUBLIC</span></span>
                </label>
                <div id="paramPaieEspeceBody" style="display:none;padding-left:22px;">
                  <div class="form-group"><label>Note affichée</label><input type="text" id="paramPaieEspeceNote"></div>
                </div>
              </div>

              <div style="margin-bottom:12px;border:1px solid var(--border);border-radius:10px;padding:12px;background:#f8fafc;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px;">
                  <input type="checkbox" id="paramPaieChequeActif" onchange="Parametres.togglePaieCheque()" style="width:auto;">
                  <span>📝 <strong>Chèque</strong> <span style="font-size:.72rem;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:8px;">PUBLIC</span></span>
                </label>
                <div id="paramPaieChequeBody" style="display:none;padding-left:22px;">
                  <div class="form-group"><label>Ordre du chèque</label><input type="text" id="paramPaieChequeNote"></div>
                  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:8px;font-size:.85rem;">
                    <input type="checkbox" id="paramPaieChequeRemise" style="width:auto;">
                    <span>Remise possible à un membre de l'équipe</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:.85rem;">
                    <input type="checkbox" id="paramPaieChequeCourrier" style="width:auto;">
                    <span>Envoi par courrier (adresse du siège)</span>
                  </label>
                </div>
              </div>

              <button type="submit" class="btn" style="width:100%;">💾 Enregistrer</button>
            </div>
          </div>

          <!-- ============ ONGLET BÉNÉVOLES ============ -->
          <div class="param-panel" data-panel="benevoles">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">🤝 Façons d'aider</h3>
              <div style="display:flex;justify-content:flex-end;gap:6px;margin-bottom:10px;">
                <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem;" onclick="Parametres.ajouterEngagement()">➕ Ajouter</button>
                <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem;" onclick="Parametres.resetEngagements()">🔄</button>
              </div>
              <div id="paramEngagementsList"></div>
            </div>

            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">📚 Compétences bénévoles</h3>
              <div style="display:flex;justify-content:flex-end;gap:6px;margin-bottom:10px;">
                <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem;" onclick="Parametres.ajouterCompetenceCat()">➕ Catégorie</button>
                <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem;" onclick="Parametres.resetCompetences()">🔄</button>
              </div>
              <div id="paramCompetencesList"></div>
            </div>

            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3 style="font-size:1rem;color:var(--primary);font-weight:700;margin:0;">💌 Message de bienvenue</h3>
                <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:.75rem;" onclick="Parametres.resetMessageBienvenue()">🔄</button>
              </div>
              <p style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">Apparaît en haut du formulaire bénévole.</p>
              <textarea id="paramMessageBienvenue" rows="4" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.88rem;"></textarea>
              <button type="submit" class="btn" style="width:100%;margin-top:12px;">💾 Enregistrer</button>
            </div>
          </div>

          <!-- ============ ONGLET DONS ============ -->
          <div class="param-panel" data-panel="dons">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">🎁 Dons & reçus fiscaux</h3>
              <div class="form-group" style="padding:12px;background:#fef3c7;border-radius:10px;border:1px solid #fcd34d;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
                  <input type="checkbox" id="paramInteretGeneral" style="width:auto;">
                  <span><strong>Reconnue d'intérêt général</strong><br><small style="color:var(--text-light);font-weight:400;">Nécessaire pour les reçus fiscaux.</small></span>
                </label>
              </div>
              <div class="form-group" style="padding:12px;background:#f0f9ff;border-radius:10px;border:1px solid #bfdbfe;">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
                  <input type="checkbox" id="paramEmettreRecus" style="width:auto;">
                  <span><strong>Émettre les reçus fiscaux par défaut</strong></span>
                </label>
              </div>
              <div class="form-group">
                <label>Seuil Mécène (€)</label>
                <input type="number" step="1" id="paramSeuilMecene">
                <small style="color:var(--text-light);font-size:.72rem;">Un donateur dépassant ce seuil devient automatiquement Mécène.</small>
              </div>
            </div>

            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">📢 Campagnes de dons</h3>
              <div id="paramCampagnesList" style="margin-bottom:12px;"></div>
              <div style="display:flex;gap:8px;">
                <input type="text" id="paramNouvelleCampagne" placeholder="Nouvelle campagne" style="flex:1;padding:9px;border:1px solid var(--border);border-radius:8px;">
                <button type="button" class="btn" onclick="Parametres.ajouterCampagne()">➕</button>
              </div>
            </div>

            <button type="submit" class="btn" style="width:100%;">💾 Enregistrer</button>
          </div>

          <!-- ============ ONGLET DIVERS ============ -->
          <!-- ============ ONGLET MESSAGES ============ -->
          <div class="param-panel" data-panel="messages">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">✉️ Signature et lien</h3>
              <div class="form-group">
                <label>Signature automatique</label>
                <input type="text" id="paramSignatureMessage">
                <small style="color:var(--text-light);font-size:.72rem;">Ajoutée automatiquement en bas de chaque message.</small>
              </div>
              <div class="form-group">
                <label>Lien du site</label>
                <input type="url" id="paramLienSiteMessage">
                <small style="color:var(--text-light);font-size:.72rem;">Utilisable dans les modèles avec {site}.</small>
              </div>
            </div>

            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:6px;color:var(--primary);font-weight:700;">📝 Modèles de messages</h3>
              <p style="font-size:.82rem;color:var(--text-light);margin-bottom:14px;">
                Variables disponibles : <code>{prenom}</code>, <code>{nom}</code>, <code>{date}</code>, <code>{heure}</code>, <code>{asso}</code>, <code>{site}</code>
              </p>
              <div id="paramModelesMessages"></div>
            </div>

            <button type="submit" class="btn" style="width:100%;">💾 Enregistrer</button>
          </div>
          <div class="param-panel" data-panel="divers">
            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">⚙️ Réglages métier</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Barème km (€/km)</label><input type="number" step="0.01" id="paramBareme"></div>
                <div class="form-group"><label>Exercice courant</label><input type="number" id="paramExercice"></div>
              </div>
              <button type="submit" class="btn" style="width:100%;">💾 Enregistrer</button>
            </div>

            <div class="card" style="background:#f8fafc;">
              <h3 style="font-size:.95rem;margin-bottom:10px;color:var(--primary);font-weight:700;">ℹ️ À propos</h3>
              <p style="font-size:.85rem;color:var(--text-light);line-height:1.7;">
                <strong>Gestion BricoBol</strong> v0.5<br>
                Application de gestion associative<br>
                Toutes les données sont stockées <strong>localement</strong> dans votre navigateur.
              </p>
            </div>
          </div>

          <!-- ============ ONGLET DONNÉES ============ -->
          <div class="param-panel" data-panel="donnees">
            <div class="param-panel" data-panel="donnees">
  <div class="card">
    <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">☁️ Synchronisation Supabase</h3>
    <p style="font-size:.82rem;color:var(--text-light);margin-bottom:14px;line-height:1.5;">
      Envoie toutes les données de cet appareil vers le serveur Supabase.
      À faire <strong>une seule fois</strong>, sur l'appareil qui a le plus de données.
    </p>
    <button type="button" class="btn" onclick="Parametres.migrerVersSupabase()" style="width:100%;background:linear-gradient(135deg,#0ea5e9,#0284c7);margin-bottom:14px;">☁️ Migrer les données locales vers Supabase</button>
    <p style="font-size:.75rem;color:var(--text-light);margin-bottom:14px;">Les données locales sont conservées après migration.</p>
  </div>

  <div class="card">
    <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">💾 Sauvegarde</h3>
              <button type="button" class="btn btn-success" onclick="Parametres.exportJSON()" style="width:100%;margin-bottom:14px;">📤 Exporter tout (JSON)</button>
              <div class="form-group"><label>Restaurer</label><input type="file" id="paramImportFile" accept=".json"></div>
              <button type="button" class="btn btn-secondary" onclick="Parametres.importJSON()" style="width:100%;">📥 Importer et remplacer</button>
            </div>

            <div class="card">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--primary);font-weight:700;">📊 Utilisation du stockage</h3>
              <div id="paramStorageInfo"></div>
              <button type="button" class="btn btn-ghost" onclick="Parametres.updateStorageInfo()" style="margin-top:12px;width:100%;">🔄 Actualiser</button>
            </div>

            <div class="card" style="border-color:#fca5a5;">
              <h3 style="font-size:1rem;margin-bottom:14px;color:var(--danger);font-weight:700;">⚠️ Zone dangereuse</h3>
              <p style="font-size:.82rem;color:var(--text-light);margin-bottom:12px;">Ces actions sont irréversibles. Faites un export JSON avant.</p>
              <div style="display:grid;grid-template-columns:1fr;gap:8px;">
                <button type="button" class="btn btn-ghost" onclick="Parametres.resetOnlyContacts()" style="border-color:#fca5a5;color:var(--danger);">🗑️ Vider les contacts (adhérents, bénévoles…)</button>
                <button type="button" class="btn btn-ghost" onclick="Parametres.resetOnlyCompta()" style="border-color:#fca5a5;color:var(--danger);">🗑️ Vider la comptabilité</button>
                <button type="button" class="btn btn-ghost" onclick="Parametres.resetOnlyInterventions()" style="border-color:#fca5a5;color:var(--danger);">🗑️ Vider les interventions</button>
                <button type="button" class="btn btn-ghost" onclick="Parametres.resetOnlyDeplacements()" style="border-color:#fca5a5;color:var(--danger);">🗑️ Vider les déplacements</button>
                <button type="button" class="btn btn-ghost" onclick="Parametres.resetOnlyDons()" style="border-color:#fca5a5;color:var(--danger);">🗑️ Vider les dons</button>
                <button type="button" class="btn btn-ghost" onclick="Parametres.resetOnlyCotisations()" style="border-color:#fca5a5;color:var(--danger);">🗑️ Vider les cotisations</button>
                <button type="button" class="btn btn-danger" onclick="Parametres.resetAll()" style="margin-top:8px;">🗑️ TOUT EFFACER</button>
              </div>
            </div>
          </div>

        </form>
      </section>`;
  },

  getModalsHTML() { return ''; },

  onShow() { this.render(); }
};

Router.register({
  view: 'parametres',
  title: 'Paramètres',
  icon: '⚙️',
  section: 'Gestion',
  order: 4,
  getViewHTML: () => Parametres.getViewHTML(),
  getModalsHTML: () => Parametres.getModalsHTML(),
  onShow: () => Parametres.onShow()
});
