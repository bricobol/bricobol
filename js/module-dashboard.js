// ============================================================
// MODULE : DASHBOARD — Tableau de bord avec alertes Tournée
// ============================================================

const Dashboard = {

  render() {
    // ---- Solde comptable ----
    if (typeof Compta !== 'undefined' && Compta.getAll) {
      const list = Compta.getAll();
      const rec = list.filter(e => e.type === 'recette').reduce((s, e) => s + e.total, 0);
      const dep = list.filter(e => e.type === 'depense').reduce((s, e) => s + e.total, 0);
      const el = document.getElementById('dashSolde');
      if (el) el.textContent = (rec - dep).toFixed(2) + ' €';
    }

    // ---- Adhérents actifs ----
    if (typeof Adherents !== 'undefined' && Adherents.getAll) {
      const adhs = Adherents.getAll();
      const actifs = adhs.filter(a => Utils.statutAdherent(a.dateExpiration) !== 'expire').length;
      const el = document.getElementById('dashAdherents');
      if (el) el.textContent = actifs;
    }

    // ---- Interventions en cours/planifiées ----
    if (typeof Interventions !== 'undefined' && Interventions.getAll) {
      const inter = Interventions.getAll();
      const enCours = inter.filter(i => i.statut === 'en_cours' || i.statut === 'planifiee').length;
      const el = document.getElementById('dashInterventions');
      if (el) el.textContent = enCours;
    }

    // ---- 🆕 Interventions AUJOURD'HUI ----
    if (typeof Tournee !== 'undefined') {
      const jour = Tournee.getJour();
      const el = document.getElementById('dashTournee');
      if (el) el.textContent = jour.length;
      const elSub = document.getElementById('dashTourneeSub');
      if (elSub) {
        if (jour.length === 0) {
          elSub.textContent = 'Aucune prévue →';
        } else {
          const nbB = Tournee._compterBenevoles(jour);
          elSub.textContent = `${nbB} bénévole${nbB > 1 ? 's' : ''} mobilisé${nbB > 1 ? 's' : ''} →`;
        }
      }
    }

    // ---- Frais à rembourser ----
    if (typeof Frais !== 'undefined' && Frais.getAll) {
      const list = Frais.getAll();
      const aRembourser = list.filter(f => !f.rembourse).reduce((s, f) => s + (f.montant || 0), 0);
      const el = document.getElementById('dashFrais');
      if (el) el.textContent = aRembourser.toFixed(2) + ' €';
    }

    // ---- Cotisations à valider ----
    if (typeof Cotisations !== 'undefined' && Cotisations.countEnAttente) {
      const nb = Cotisations.countEnAttente();
      const el = document.getElementById('dashCotisationsAttente');
      if (el) el.textContent = nb;
      const card = document.getElementById('dashCotisationsAttenteCard');
      if (card) {
        card.style.opacity = nb > 0 ? '1' : '0.5';
        card.style.cursor = nb > 0 ? 'pointer' : 'default';
      }
    }

    // ---- Bandeau d'alerte global ----
    this.renderAlertes();
  },

  // ---------- Bandeau d'alerte ----------
  renderAlertes() {
    const container = document.getElementById('dashAlertes');
    if (!container) return;

    const alertes = [];

    // 🆕 Tournée : en retard
    if (typeof Tournee !== 'undefined') {
      const enRetard = Tournee.getEnRetard();
      if (enRetard.length > 0) {
        alertes.push({
          icon: '⚠️',
          texte: `${enRetard.length} intervention${enRetard.length > 1 ? 's' : ''} en retard à traiter`,
          action: 'Voir les retards',
          view: 'missions',
          params: { tab: 'aujourdhui' },
          couleur: '#dc2626',
          bg: '#fef2f2',
          border: '#fecaca'
        });
      }
    }

    // 🆕 Tournée : interventions du jour
    if (typeof Tournee !== 'undefined') {
      const jour = Tournee.getJour();
      if (jour.length > 0) {
        const nbB = Tournee._compterBenevoles(jour);
        alertes.push({
          icon: '📅',
          texte: `${jour.length} intervention${jour.length > 1 ? 's' : ''} prévue${jour.length > 1 ? 's' : ''} aujourd'hui · ${nbB} bénévole${nbB > 1 ? 's' : ''}`,
          action: 'Voir les interventions',
          view: 'missions',
          params: { tab: 'aujourdhui' },
          couleur: '#2563eb',
          bg: '#eff6ff',
          border: '#bfdbfe'
        });
      }
    }

    // Cotisations en attente
    if (typeof Cotisations !== 'undefined' && Cotisations.countEnAttente) {
      const nb = Cotisations.countEnAttente();
      if (nb > 0) {
        const total = Cotisations.getEnAttente().reduce((s, c) => s + (c.montant || 0), 0);
        alertes.push({
          icon: '⏳',
          texte: `${nb} cotisation${nb > 1 ? 's' : ''} en attente de validation (${total.toFixed(2)} €)`,
          action: 'Voir les cotisations',
          view: 'cotisations',
          params: null,
          couleur: '#f59e0b',
          bg: '#fffbeb',
          border: '#fcd34d'
        });
      }
    }

    // Bénévoles à mettre à jour
    if (typeof Adherents !== 'undefined' && Adherents.getAll) {
      const adhs = Adherents.getAll();
      const aMaj = adhs.filter(a => a.aMettreAJour);
      if (aMaj.length > 0) {
        alertes.push({
          icon: '📝',
          texte: `${aMaj.length} bénévole${aMaj.length > 1 ? 's' : ''} à mettre à jour`,
          action: 'Voir les fiches',
          view: 'adherents',
          params: { adhFilter: 'a_maj' },
          couleur: '#8b5cf6',
          bg: '#faf5ff',
          border: '#c4b5fd'
        });
      }
    }

    // Adhésions expirant bientôt (30 jours)
    if (typeof Adherents !== 'undefined' && Adherents.getAll) {
      const adhs = Adherents.getAll();
      const bientot = adhs.filter(a => {
        if (!a.dateExpiration) return false;
        const d = Utils.daysUntil(a.dateExpiration);
        return d !== null && d >= 0 && d <= 30;
      });
      if (bientot.length > 0) {
        alertes.push({
          icon: '📆',
          texte: `${bientot.length} adhésion${bientot.length > 1 ? 's' : ''} expire${bientot.length > 1 ? 'nt' : ''} dans les 30 jours`,
          action: 'Voir les adhérents',
          view: 'adherents',
          params: null,
          couleur: '#0ea5e9',
          bg: '#f0f9ff',
          border: '#bfdbfe'
        });
      }
    }

    // Frais à rembourser
    if (typeof Frais !== 'undefined' && Frais.getAll) {
      const list = Frais.getAll();
      const aRembourser = list.filter(f => !f.rembourse);
      if (aRembourser.length > 0) {
        const total = aRembourser.reduce((s, f) => s + (f.montant || 0), 0);
        alertes.push({
          icon: '🚗',
          texte: `${aRembourser.length} déplacement${aRembourser.length > 1 ? 's' : ''} à rembourser (${total.toFixed(2)} €)`,
          action: 'Voir les frais',
          view: 'frais',
          params: null,
          couleur: '#8b5cf6',
          bg: '#faf5ff',
          border: '#c4b5fd'
        });
      }
    }

    // Interventions urgentes non terminées
    if (typeof Interventions !== 'undefined' && Interventions.getAll) {
      const inter = Interventions.getAll();
      const urgentes = inter.filter(i => i.priorite === 'urgente' && i.statut !== 'terminee' && i.statut !== 'annulee');
      if (urgentes.length > 0) {
        alertes.push({
          icon: '🚨',
          texte: `${urgentes.length} intervention${urgentes.length > 1 ? 's' : ''} urgente${urgentes.length > 1 ? 's' : ''} en cours`,
          action: 'Voir les interventions',
          view: 'interventions',
          params: null,
          couleur: '#dc2626',
          bg: '#fef2f2',
          border: '#fecaca'
        });
      }
    }

    if (alertes.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = alertes.map((a, i) => `
      <div class="dash-alerte" data-alerte-idx="${i}" style="background:${a.bg};border:1.5px solid ${a.border};border-radius:12px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <span style="font-size:1.5rem;">${a.icon}</span>
        <div style="flex:1;font-size:.88rem;font-weight:600;color:${a.couleur};">
          ${a.texte}
        </div>
        <span style="font-size:.8rem;color:${a.couleur};font-weight:700;white-space:nowrap;">${a.action} →</span>
      </div>
    `).join('');

    container.querySelectorAll('.dash-alerte').forEach((el, i) => {
      el.addEventListener('click', () => {
        const a = alertes[i];
        Router.go(a.view, a.params);
      });
    });
  },

  getViewHTML() {
    return `
      <section class="view" id="view-dashboard">
        <div class="view-header"><h1>Tableau de bord</h1><p>Vue d'ensemble de l'association</p></div>

        <div id="dashAlertes"></div>

        <div class="stats-grid">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid #2563eb;" onclick="Router.go('missions', { tab: 'aujourdhui' })" title="Voir les interventions du jour">
            <div class="stat-label">📅 Aujourd'hui</div>
            <div class="stat-value" id="dashTournee">—</div>
            <div class="stat-sub" id="dashTourneeSub">Interventions prévues →</div>
          </div>
          <div class="stat-card success" onclick="Router.go('comptabilite')" style="cursor:pointer;">
            <div class="stat-label">Solde actuel</div>
            <div class="stat-value" id="dashSolde">— €</div>
            <div class="stat-sub">Comptabilité →</div>
          </div>
          <div class="stat-card" onclick="Router.go('adherents')" style="cursor:pointer;">
            <div class="stat-label">Adhérents actifs</div>
            <div class="stat-value" id="dashAdherents">—</div>
            <div class="stat-sub">Annuaire →</div>
          </div>
          <div class="stat-card orange" onclick="Router.go('interventions')" style="cursor:pointer;">
            <div class="stat-label">Interventions</div>
            <div class="stat-value" id="dashInterventions">—</div>
            <div class="stat-sub">En cours / planifiées →</div>
          </div>
          <div class="stat-card purple" onclick="Router.go('frais')" style="cursor:pointer;">
            <div class="stat-label">Frais à rembourser</div>
            <div class="stat-value" id="dashFrais">— €</div>
            <div class="stat-sub">Bénévoles →</div>
          </div>
          <div class="stat-card warning" id="dashCotisationsAttenteCard" onclick="Router.go('cotisations')" style="cursor:pointer;">
            <div class="stat-label">Cotisations à valider</div>
            <div class="stat-value" id="dashCotisationsAttente">0</div>
            <div class="stat-sub">Paiements en attente →</div>
          </div>
        </div>

        <div class="card">
          <div class="card-placeholder">
            <div class="card-placeholder-icon">🧰</div>
            <h3>Bienvenue dans Gestion BricoBol</h3>
            <p>Utilisez le menu de gauche pour accéder aux différents modules.</p>
          </div>
        </div>
      </section>`;
  },

  getModalsHTML() { return ''; },

  onShow() { this.render(); }
};

Router.register({
  view: 'dashboard',
  title: 'Tableau de bord',
  icon: '🏠',
  section: "Vue d'ensemble",
  order: 1,
  getViewHTML: () => Dashboard.getViewHTML(),
  getModalsHTML: () => Dashboard.getModalsHTML(),
  onShow: () => Dashboard.onShow()
});
