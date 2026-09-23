// ============================================================
// MODULE : AGENDA — Vue jour/semaine/mois + événements
// ============================================================

const Agenda = {

  currentView: 'jour', // jour | semaine | mois
  currentDate: new Date(),
  filterBenevole: '',
  filterStatut: '',

  // ---------- Données ----------
  getEvenements() { return Storage.get('evenements', []); },
  saveEvenements(list) { return Storage.set('evenements', list); },

  // Récupère toutes les interventions avec date prévue
  getInterventionsPlanifiees() {
    return Interventions.getAll().filter(i => i.datePrevue && i.statut !== 'annulee');
  },

  // Récupère tous les items (interventions + événements) sur une période
  getItemsBetween(startDate, endDate) {
    const items = [];
    // Interventions
    this.getInterventionsPlanifiees().forEach(i => {
      const d = i.datePrevue;
      if (!d) return;
      if (d >= startDate && d <= endDate) {
        if (this.filterBenevole && (i.benevole || '').toLowerCase().indexOf(this.filterBenevole.toLowerCase()) === -1) return;
        if (this.filterStatut && i.statut !== this.filterStatut) return;
        items.push({
          type: 'intervention',
          id: i.id,
          numero: i.numero,
          titre: i.type,
          demandeur: i.demandeur,
          benevole: i.benevole,
          date: i.datePrevue,
          heure: i.heurePrevue || '',
          statut: i.statut,
          couleur: Interventions.STATUTS[i.statut]?.color || '#2563eb',
          badge: Interventions.STATUTS[i.statut]?.label || '',
          urgent: i.priorite === 'urgente'
        });
      }
    });
    // Événements
    this.getEvenements().forEach(e => {
      if (!e.date) return;
      if (e.date >= startDate && e.date <= endDate) {
        items.push({
          type: 'evenement',
          id: e.id,
          titre: e.titre,
          description: e.description || '',
          date: e.date,
          heure: e.heure || '',
          heureFin: e.heureFin || '',
          couleur: e.couleur || '#8b5cf6',
          badge: e.typeEvenement || 'Événement'
        });
      }
    });
    items.sort((a, b) => {
      const ka = `${a.date} ${a.heure || '00:00'}`;
      const kb = `${b.date} ${b.heure || '00:00'}`;
      return ka.localeCompare(kb);
    });
    return items;
  },

  // ---------- Utilitaires dates ----------
  toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  startOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  },

  endOfWeek(d) {
    const date = this.startOfWeek(d);
    date.setDate(date.getDate() + 6);
    return date;
  },

  startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },

  endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  },

  formatMois(d) {
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return `${mois[d.getMonth()]} ${d.getFullYear()}`;
  },

  formatJourCourt(d) {
    const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    return jours[d.getDay()];
  },

  // ---------- Navigation ----------
  goToday() {
    this.currentDate = new Date();
    this.render();
  },

  prev() {
    if (this.currentView === 'jour') this.currentDate.setDate(this.currentDate.getDate() - 1);
    else if (this.currentView === 'semaine') this.currentDate.setDate(this.currentDate.getDate() - 7);
    else this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  },

  next() {
    if (this.currentView === 'jour') this.currentDate.setDate(this.currentDate.getDate() + 1);
    else if (this.currentView === 'semaine') this.currentDate.setDate(this.currentDate.getDate() + 7);
    else this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  },

  setView(view) {
    this.currentView = view;
    this.render();
  },

  // ---------- Rendu principal ----------
  render() {
    const container = document.getElementById('agendaContainer');
    const titre = document.getElementById('agendaTitre');
    if (!container || !titre) return;

    // Titre selon la vue
    if (this.currentView === 'jour') {
      titre.textContent = this.currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (this.currentView === 'semaine') {
      const sw = this.startOfWeek(this.currentDate);
      const ew = this.endOfWeek(this.currentDate);
      titre.textContent = `Semaine du ${Utils.formatDate(this.toISODate(sw))} au ${Utils.formatDate(this.toISODate(ew))}`;
    } else {
      titre.textContent = this.formatMois(this.currentDate);
    }

    // Boutons actifs
    ['jour', 'semaine', 'mois'].forEach(v => {
      const btn = document.getElementById('agendaBtn' + v.charAt(0).toUpperCase() + v.slice(1));
      if (btn) btn.classList.toggle('active', this.currentView === v);
    });

    // Rendu selon la vue
    if (this.currentView === 'jour') this.renderJour(container);
    else if (this.currentView === 'semaine') this.renderSemaine(container);
    else this.renderMois(container);

    // Notifications
    this.checkNotifications();
  },

  renderJour(container) {
    const iso = this.toISODate(this.currentDate);
    const items = this.getItemsBetween(iso, iso);

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--text-light);">
          <div style="font-size:3rem;margin-bottom:12px;">📭</div>
          <p>Aucun élément prévu ce jour.</p>
          <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button class="btn" onclick="Interventions.openFormFromAgenda('${iso}', '')">➕ Intervention</button>
            <button class="btn btn-ghost" onclick="Agenda.openEvenementForm(null, '${iso}')">➕ Événement</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button class="btn" style="flex:1;" onclick="Interventions.openFormFromAgenda('${iso}', '')">➕ Intervention</button>
        <button class="btn btn-ghost" style="flex:1;" onclick="Agenda.openEvenementForm(null, '${iso}')">➕ Événement</button>
      </div>
      ${items.map(it => this.renderItemCard(it)).join('')}
    `;
  },

  renderItemCard(it) {
    if (it.type === 'intervention') {
      const isToday = it.date === Utils.todayISO();
      const overdue = it.date < Utils.todayISO() && it.statut !== 'terminee';
      return `
        <div class="agenda-item" style="border-left:4px solid ${it.couleur};padding:12px;background:#fff;border-radius:10px;margin-bottom:8px;cursor:pointer;" onclick="Interventions.openDetail(${it.id})">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div style="flex:1;">
              <div style="font-weight:700;font-size:.95rem;">
                ${it.heure ? `<span style="color:var(--accent);">${it.heure}</span> · ` : ''}${Utils.escapeHtml(it.titre)}
                ${it.urgent ? '<span class="badge badge-danger" style="font-size:.65rem;margin-left:6px;">URGENT</span>' : ''}
              </div>
              <div style="font-size:.82rem;color:var(--text-light);margin-top:4px;">
                👤 ${Utils.escapeHtml(it.demandeur)}
                ${it.benevole ? ' · 🤝 ' + Utils.escapeHtml(it.benevole) : ''}
              </div>
              <div style="margin-top:6px;font-size:.75rem;">
                <span class="badge" style="background:${it.couleur}22;color:${it.couleur};">${it.badge}</span>
                ${overdue ? '<span class="badge badge-danger" style="font-size:.65rem;margin-left:4px;">En retard</span>' : ''}
                ${isToday ? '<span class="badge badge-info" style="font-size:.65rem;margin-left:4px;">Aujourd\'hui</span>' : ''}
              </div>
            </div>
            <div style="font-size:.75rem;color:var(--accent);font-weight:600;">${Utils.escapeHtml(it.numero)}</div>
          </div>
        </div>`;
    } else {
      return `
        <div class="agenda-item" style="border-left:4px solid ${it.couleur};padding:12px;background:#faf5ff;border-radius:10px;margin-bottom:8px;cursor:pointer;" onclick="Agenda.openEvenementForm(${it.id})">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <div style="font-weight:700;font-size:.95rem;">
                ${it.heure ? `<span style="color:${it.couleur};">${it.heure}${it.heureFin ? ' - ' + it.heureFin : ''}</span> · ` : ''}${Utils.escapeHtml(it.titre)}
              </div>
              ${it.description ? `<div style="font-size:.82rem;color:var(--text-light);margin-top:4px;white-space:pre-wrap;">${Utils.escapeHtml(it.description.substring(0, 100))}${it.description.length > 100 ? '…' : ''}</div>` : ''}
              <div style="margin-top:6px;"><span class="badge" style="background:${it.couleur}22;color:${it.couleur};">${it.badge}</span></div>
            </div>
            <span style="font-size:1.2rem;">📅</span>
          </div>
        </div>`;
    }
  },

  renderSemaine(container) {
    const sw = this.startOfWeek(this.currentDate);
    const jours = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sw);
      d.setDate(d.getDate() + i);
      jours.push(d);
    }
    const isoStart = this.toISODate(jours[0]);
    const isoEnd = this.toISODate(jours[6]);
    const items = this.getItemsBetween(isoStart, isoEnd);

    const isoAujourdhui = Utils.todayISO();
    const grid = jours.map(d => {
      const iso = this.toISODate(d);
      const itemsJour = items.filter(it => it.date === iso);
      const isToday = iso === isoAujourdhui;
      return `
        <div style="min-width:140px;flex:1;background:${isToday ? '#eff6ff' : '#fff'};border-radius:10px;border:1px solid ${isToday ? 'var(--accent)' : 'var(--border)'};padding:8px;">
          <div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">
            <div style="font-size:.72rem;color:var(--text-light);text-transform:uppercase;font-weight:700;">${this.formatJourCourt(d)}</div>
            <div style="font-size:1.1rem;font-weight:800;color:${isToday ? 'var(--accent)' : 'inherit'};">${d.getDate()}</div>
          </div>
          ${itemsJour.length === 0
            ? `<div style="text-align:center;color:var(--text-light);font-size:.78rem;padding:8px 0;">—</div>`
            : itemsJour.map(it => `
              <div style="padding:6px;border-radius:6px;background:${it.couleur}15;border-left:3px solid ${it.couleur};margin-bottom:4px;font-size:.75rem;cursor:pointer;"
                   onclick="${it.type === 'intervention' ? `Interventions.openDetail(${it.id})` : `Agenda.openEvenementForm(${it.id})`}">
                ${it.heure ? `<strong>${it.heure}</strong> ` : ''}${Utils.escapeHtml(it.titre.substring(0, 30))}${it.titre.length > 30 ? '…' : ''}
              </div>`).join('')}
        </div>`;
    }).join('');

    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="btn" onclick="Interventions.openFormFromAgenda('${Utils.todayISO()}', '')">➕ Intervention</button>
        <button class="btn btn-ghost" onclick="Agenda.openEvenementForm(null, '${Utils.todayISO()}')">➕ Événement</button>
      </div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;">
        ${grid}
      </div>
    `;
  },

  renderMois(container) {
    const first = this.startOfMonth(this.currentDate);
    const last = this.endOfMonth(this.currentDate);
    const startGrid = this.startOfWeek(first);
    const endGrid = this.endOfWeek(last);
    const items = this.getItemsBetween(this.toISODate(startGrid), this.toISODate(endGrid));
    const isoAujourdhui = Utils.todayISO();

    const cells = [];
    let d = new Date(startGrid);
    while (d <= endGrid) {
      const iso = this.toISODate(d);
      const itemsJour = items.filter(it => it.date === iso);
      const isToday = iso === isoAujourdhui;
      const isCurrentMonth = d.getMonth() === this.currentDate.getMonth();
      cells.push(`
        <div style="min-height:80px;background:${isToday ? '#eff6ff' : (isCurrentMonth ? '#fff' : '#f8fafc')};border:1px solid var(--border);border-radius:8px;padding:4px;cursor:pointer;"
             onclick="Agenda.setDate('${iso}')">
          <div style="font-size:.75rem;font-weight:${isToday ? '800' : '600'};color:${isToday ? 'var(--accent)' : (isCurrentMonth ? 'inherit' : 'var(--text-light)')};margin-bottom:2px;text-align:right;">${d.getDate()}</div>
          ${itemsJour.slice(0, 3).map(it => `
            <div style="height:6px;border-radius:3px;background:${it.couleur};margin-bottom:2px;" title="${Utils.escapeHtml(it.titre)}"></div>
          `).join('')}
          ${itemsJour.length > 3 ? `<div style="font-size:.65rem;text-align:center;color:var(--text-light);">+${itemsJour.length - 3}</div>` : ''}
        </div>`);
      d.setDate(d.getDate() + 1);
    }

    const joursSemaine = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="btn" onclick="Interventions.openFormFromAgenda('${Utils.todayISO()}', '')">➕ Intervention</button>
        <button class="btn btn-ghost" onclick="Agenda.openEvenementForm(null, '${Utils.todayISO()}')">➕ Événement</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;">
        ${joursSemaine.map(j => `<div style="text-align:center;font-size:.72rem;font-weight:700;color:var(--text-light);text-transform:uppercase;">${j}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
        ${cells.join('')}
      </div>
    `;
  },

  setDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    this.currentDate = new Date(y, m - 1, d);
    this.currentView = 'jour';
    this.render();
  },

  // ---------- Événements ----------
  openEvenementForm(id = null, presetDate = null) {
    const form = document.getElementById('evenementForm');
    form.reset();
    document.getElementById('evtEditId').value = '';
    document.getElementById('evtFormTitle').textContent = id ? 'Modifier l\'événement' : 'Nouvel événement';
    if (id) {
      const e = this.getEvenements().find(x => x.id === id);
      if (!e) return;
      document.getElementById('evtEditId').value = e.id;
      document.getElementById('evtTitre').value = e.titre || '';
      document.getElementById('evtType').value = e.typeEvenement || 'Réunion';
      document.getElementById('evtDate').value = e.date || '';
      document.getElementById('evtHeure').value = e.heure || '';
      document.getElementById('evtHeureFin').value = e.heureFin || '';
      document.getElementById('evtCouleur').value = e.couleur || '#8b5cf6';
      document.getElementById('evtDescription').value = e.description || '';
    } else {
      document.getElementById('evtDate').value = presetDate || Utils.todayISO();
      document.getElementById('evtType').value = 'Réunion';
      document.getElementById('evtCouleur').value = '#8b5cf6';
    }
    document.getElementById('evtFormModal').classList.add('active');
  },

  closeEvenementForm() { document.getElementById('evtFormModal').classList.remove('active'); },

  saveEvenement(event) {
    event.preventDefault();
    const id = document.getElementById('evtEditId').value;
    const typeEvt = document.getElementById('evtType').value;
    // Couleur auto selon le type (si pas modifiée manuellement)
    const couleurAuto = {
      'Réunion': '#8b5cf6',
      'AG': '#dc2626',
      'Formation': '#0ea5e9',
      'Sortie': '#16a34a',
      'Autre': '#64748b'
    };
    const couleur = document.getElementById('evtCouleur').value || couleurAuto[typeEvt] || '#8b5cf6';
    const data = {
      titre: document.getElementById('evtTitre').value.trim(),
      typeEvenement: typeEvt,
      date: document.getElementById('evtDate').value,
      heure: document.getElementById('evtHeure').value,
      heureFin: document.getElementById('evtHeureFin').value,
      couleur,
      description: document.getElementById('evtDescription').value.trim()
    };
    if (!data.titre || !data.date) { alert('Titre et date obligatoires.'); return; }
    const list = this.getEvenements();
    if (id) {
      const idx = list.findIndex(e => String(e.id) === String(id));
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: Date.now(), ...data });
    }
    this.saveEvenements(list);
    this.closeEvenementForm();
    this.render();
  },

  removeEvenement(id) {
    const e = this.getEvenements().find(x => x.id === id);
    if (!e) return;
    if (!confirm(`Supprimer l'événement "${e.titre}" ?`)) return;
    this.saveEvenements(this.getEvenements().filter(x => x.id !== id));
    this.closeEvenementForm();
    this.render();
  },

  // ---------- Notifications navigateur ----------
  async requestNotificationPermission() {
    if (!('Notification' in window)) { alert('Votre navigateur ne supporte pas les notifications.'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      alert('✅ Notifications activées. Vous recevrez un rappel quand l\'app est ouverte.');
      this.savePrefs({ notifications: true });
    } else {
      alert('❌ Notifications refusées.');
      this.savePrefs({ notifications: false });
    }
  },

  getPrefs() { return Storage.get('agenda_prefs', { notifications: false, derniereNotifDate: '' }); },
  savePrefs(p) { Storage.set('agenda_prefs', p); },

  checkNotifications() {
    const prefs = this.getPrefs();
    if (!prefs.notifications) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const today = Utils.todayISO();
    if (prefs.derniereNotifDate === today) return;
    const items = this.getItemsBetween(today, today);
    if (items.length === 0) return;

    const nb = items.length;
    const nextItem = items.find(i => i.heure && i.heure >= new Date().toTimeString().substring(0, 5)) || items[0];
    const msg = nextItem.heure
      ? `${nextItem.heure} - ${nextItem.titre}`
      : `${nb} élément(s) prévu(s) aujourd'hui`;

    try {
      new Notification('🧰 Agenda BricoBol', {
        body: msg,
        icon: '/favicon.ico',
        tag: 'bricobol-agenda'
      });
      prefs.derniereNotifDate = today;
      this.savePrefs(prefs);
    } catch (e) { console.error(e); }
  },

  // ---------- Export ICS ----------
  exporterICS() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BricoBol//Agenda//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:BricoBol'
    ];

    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const escapeICS = s => String(s || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

    // Interventions
    this.getInterventionsPlanifiees().forEach(i => {
      if (!i.datePrevue) return;
      const dateCompact = i.datePrevue.replace(/-/g, '');
      const heure = (i.heurePrevue || '09:00').replace(':', '');
      const heureFin = (i.heureRealisee || this.addHours(i.heurePrevue || '09:00', 1)).replace(':', '');
      const dtStart = `DTSTART:${dateCompact}T${heure}00`;
      const dtEnd = `DTEND:${dateCompact}T${heureFin}00`;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:int-${i.id}@bricobol`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(dtStart);
      lines.push(dtEnd);
      lines.push(`SUMMARY:${escapeICS('🛠️ ' + i.type + ' - ' + i.demandeur)}`);
      lines.push(`DESCRIPTION:${escapeICS(i.description || '')}${i.benevole ? '\\nBénévole: ' + i.benevole : ''}`);
      lines.push(`LOCATION:${escapeICS('')}`);
      lines.push(`STATUS:${i.statut === 'terminee' ? 'CONFIRMED' : 'TENTATIVE'}`);
      lines.push('END:VEVENT');
    });

    // Événements
    this.getEvenements().forEach(e => {
      if (!e.date) return;
      const dateCompact = e.date.replace(/-/g, '');
      const heure = (e.heure || '09:00').replace(':', '');
      const heureFin = (e.heureFin || this.addHours(e.heure || '09:00', 1)).replace(':', '');
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:evt-${e.id}@bricobol`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART:${dateCompact}T${heure}00`);
      lines.push(`DTEND:${dateCompact}T${heureFin}00`);
      lines.push(`SUMMARY:${escapeICS('📅 ' + e.titre)}`);
      lines.push(`DESCRIPTION:${escapeICS(e.description || '')}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    const ics = lines.join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bricobol_agenda_${Utils.todayISO()}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
    alert('✅ Fichier .ics téléchargé.\n\nVous pouvez l\'importer dans Google Calendar, Apple Calendrier ou Proton Calendar.');
  },

  addHours(heure, nb) {
    const [h, m] = heure.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setHours(d.getHours() + nb);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  // ---------- Filtres ----------
  setFilterBenevole(val) { this.filterBenevole = val; this.render(); },
  setFilterStatut(val) { this.filterStatut = val; this.render(); },

 renderFiltres() {
    const dl = document.getElementById('agendaBenevolesList');
    if (!dl) return;
    const benevoles = Storage.getAdherents().filter(a => 
      a.type === 'Bénévole' || (a.type === 'Adhérent bénéficiaire' && a.aussiBenevole === true)
    );
    dl.innerHTML = benevoles.map(b => `<option value="${Utils.escapeHtml(b.prenom + ' ' + b.nom)}"></option>`).join('');
},

  // ---------- Vue HTML ----------
  getViewHTML() {
    return `
      <section class="view" id="view-agenda">
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div><h1>Agenda</h1><p>Interventions et événements planifiés</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="Agenda.exporterICS()">📅 Export ICS</button>
            <button class="btn btn-ghost" onclick="Agenda.requestNotificationPermission()">🔔 Activer notifications</button>
          </div>
        </div>

        <div class="card" style="padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost" style="padding:8px 12px;" onclick="Agenda.prev()">◀</button>
              <button class="btn btn-ghost" style="padding:8px 12px;" onclick="Agenda.goToday()">Aujourd'hui</button>
              <button class="btn btn-ghost" style="padding:8px 12px;" onclick="Agenda.next()">▶</button>
            </div>
            <div style="display:flex;gap:4px;background:var(--bg-alt);padding:4px;border-radius:8px;">
              <button id="agendaBtnJour" class="btn" style="padding:6px 12px;font-size:.82rem;background:transparent;color:var(--text);" onclick="Agenda.setView('jour')">Jour</button>
              <button id="agendaBtnSemaine" class="btn" style="padding:6px 12px;font-size:.82rem;background:transparent;color:var(--text);" onclick="Agenda.setView('semaine')">Semaine</button>
              <button id="agendaBtnMois" class="btn" style="padding:6px 12px;font-size:.82rem;background:transparent;color:var(--text);" onclick="Agenda.setView('mois')">Mois</button>
            </div>
          </div>
          <h2 id="agendaTitre" style="font-size:1.1rem;font-weight:800;text-align:center;margin-bottom:12px;">—</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <input type="text" id="agendaFilterBenevole" list="agendaBenevolesList" placeholder="🔍 Filtrer par bénévole" oninput="Agenda.setFilterBenevole(this.value)" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;">
            <datalist id="agendaBenevolesList"></datalist>
            <select id="agendaFilterStatut" onchange="Agenda.setFilterStatut(this.value)" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;">
              <option value="">Tous statuts</option>
              <option value="demande">Demandes</option>
              <option value="planifiee">Planifiées</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminées</option>
            </select>
          </div>
        </div>

        <div id="agendaContainer"></div>
      </section>`;
  },

  getModalsHTML() {
    return `
      <div class="modal" id="evtFormModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2 id="evtFormTitle">Nouvel événement</h2>
            <button class="close-btn" onclick="Agenda.closeEvenementForm()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="evenementForm" onsubmit="Agenda.saveEvenement(event)">
              <input type="hidden" id="evtEditId">
              <div class="form-group">
                <label>Titre *</label>
                <input type="text" id="evtTitre" placeholder="Ex : Réunion bureau, AG annuelle..." required>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group">
                  <label>Type</label>
                  <select id="evtType">
                    <option value="Réunion">Réunion</option>
                    <option value="AG">Assemblée Générale</option>
                    <option value="Formation">Formation</option>
                    <option value="Sortie">Sortie</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Couleur</label>
                  <input type="color" id="evtCouleur" value="#8b5cf6" style="height:42px;padding:4px;">
                </div>
              </div>
              <div class="form-group">
                <label>Date *</label>
                <input type="date" id="evtDate" required>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="form-group"><label>Heure début</label><input type="time" id="evtHeure"></div>
                <div class="form-group"><label>Heure fin</label><input type="time" id="evtHeureFin"></div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="evtDescription" rows="3"></textarea>
              </div>
              <div style="display:flex;gap:10px;margin-top:14px;">
                <button type="submit" class="btn" style="flex:1;">💾 Enregistrer</button>
                <button type="button" class="btn btn-ghost" id="evtDeleteBtn" style="display:none;background:var(--danger);color:#fff;" onclick="Agenda.removeEvenement(parseInt(document.getElementById('evtEditId').value))">🗑️ Supprimer</button>
                <button type="button" class="btn btn-ghost" onclick="Agenda.closeEvenementForm()">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
  },

  onShow() {
    this.renderFiltres();
    this.render();
    // Afficher bouton supprimer si on édite
    const evtId = document.getElementById('evtEditId');
    const delBtn = document.getElementById('evtDeleteBtn');
    if (delBtn && evtId) {
      // Observateur simple
      const observer = new MutationObserver(() => {
        delBtn.style.display = evtId.value ? 'block' : 'none';
      });
      observer.observe(evtId, { attributes: true, attributeFilter: ['value'] });
    }
  }
};

Router.register({
  view: 'agenda',
  title: 'Agenda',
  icon: '📅',
  section: 'Activité',
  order: 3,
  getViewHTML: () => Agenda.getViewHTML(),
  getModalsHTML: () => Agenda.getModalsHTML(),
  onShow: () => Agenda.onShow()
});
