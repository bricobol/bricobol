// ============================================================
// MODULE : SUPA-CLIENT — Connexion + CRUD + pause detection
// ============================================================

const SupaClient = {
  url: 'https://qhdrzapdcvjvjkzagkza.supabase.co',
  key: 'sb_publishable_AEEocm-2pofdWsumlxS83Q_0mesUy9R',
  projectRef: 'qhdrzapdcvjvjkzagkza',
  client: null,
  user: null,
  enLigne: false,
  enPause: false,

  async init() {
    if (typeof supabase === 'undefined') {
      console.error('❌ supabase-js non chargé');
      this.enLigne = false;
      return;
    }
    this.client = supabase.createClient(this.url, this.key, {
      auth: { persistSession: true, autoRefreshToken: true }
    });

    window.addEventListener('online', () => { this.enLigne = true; this.renderBandeau(); });
    window.addEventListener('offline', () => { this.enLigne = false; this.renderBandeau(); });
    this.enLigne = navigator.onLine;

    const { data: { session } } = await this.client.auth.getSession();
    if (session && session.user) {
      this.user = session.user;
      this._masquerLogin();
      this.renderBandeau();
      return;
    }

    this._afficherLogin();
    return new Promise(resolve => { this._resolveLogin = resolve; });
  },

  async login(email, password, souvenir) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    if (souvenir) {
      localStorage.setItem('bricobol_supa_creds', JSON.stringify({ email, password }));
    }
    this._masquerLogin();
    this.renderBandeau();
    if (this._resolveLogin) this._resolveLogin();
  },

  async logout() {
    if (!confirm('Se déconnecter ?')) return;
    await this.client.auth.signOut();
    localStorage.removeItem('bricobol_supa_creds');
    this.user = null;
    location.reload();
  },

  // ============================================================
  // CRUD générique
  // ============================================================

  async chargerTout(table) {
    const { data, error } = await this.client.from(table).select('*');
    if (error) {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur SELECT', table, error);
      return null;
    }
    return data;
  },

  async upsert(table, rows, conflictKey = 'id') {
    if (!rows || rows.length === 0) return { error: null };
    const { error } = await this.client.from(table).upsert(rows, { onConflict: conflictKey });
    if (error) {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur UPSERT', table, error);
    }
    return { error };
  },

  async supprimerIds(table, ids) {
    if (!ids || ids.length === 0) return { error: null };
    const { error } = await this.client.from(table).delete().in('id', ids);
    if (error) {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur DELETE', table, error);
    }
    return { error };
  },

  async toutSupprimer(table) {
    const { error } = await this.client.from(table).delete().neq('id', '___jamais___');
    if (error) {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur DELETE ALL', table, error);
    }
    return { error };
  },

  async getSingleton(table, idKey, idValue) {
    const { data, error } = await this.client.from(table).select('*').eq(idKey, idValue).single();
    if (error && error.code !== 'PGRST116') {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur SELECT singleton', table, error);
    }
    return data || null;
  },
  async setCounter(key, value) {
    const payload = { key, value, updated_at: new Date().toISOString() };
    const { error } = await this.client.from('counters').upsert(payload, { onConflict: 'key' });
    if (error) {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur UPSERT counter', key, error);
    }
    return { error };
  },

  async setSingleton(table, idKey, idValue, data) {
    const payload = { [idKey]: idValue, data, updated_at: new Date().toISOString() };
    const { error } = await this.client.from(table).upsert(payload, { onConflict: idKey });
    if (error) {
      if (this.estEnPause(error)) this.afficherPause();
      console.error('Erreur UPSERT singleton', table, error);
    }
    return { error };
  },

  // ============================================================
  // DÉTECTION DE PAUSE
  // ============================================================

  estEnPause(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const code = String(error.code || '');
    return (
      msg.includes('paused') ||
      msg.includes('pause') ||
      msg.includes('project is paused') ||
      msg.includes('inactive') ||
      error.status === 503 ||
      code === 'PGRST503'
    );
  },

  afficherPause() {
    if (this.enPause) return;
    this.enPause = true;
    this.renderBandeauPause();
  },

  masquerPause() {
    if (!this.enPause) return;
    this.enPause = false;
    const el = document.getElementById('pauseBandeau');
    if (el) el.style.display = 'none';
  },

  async testerConnexion() {
    const btn = document.getElementById('pauseTestBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Test en cours...'; }

    try {
      const { error } = await this.client.from('adherents').select('id').limit(1);
      if (error && this.estEnPause(error)) {
        this.afficherPause();
        alert('⚠️ La base est toujours en pause.\n\nAllez sur supabase.com et cliquez sur « Restore project ».');
      } else if (error) {
        alert('Erreur : ' + (error.message || 'inconnue'));
      } else {
        this.masquerPause();
        alert('✅ Connexion rétablie ! Le bandeau disparaît.');
        // Recharger les données
        if (typeof Storage !== 'undefined') {
          await Storage.chargerToutDepuisSupabase();
          if (typeof Router !== 'undefined' && Router.currentView) {
            const mod = Router.registry[Router.currentView];
            if (mod && mod.onShow) mod.onShow();
          }
        }
      }
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Tester la connexion'; }
    }
  },

  renderBandeauPause() {
    const el = document.getElementById('pauseBandeau');
    if (!el) return;

    // Récupérer les identifiants mémorisés
    let email = 'bricobol.asso@proton.me';
    let password = '';
    try {
      const creds = JSON.parse(localStorage.getItem('bricobol_supa_creds') || '{}');
      if (creds.email) email = creds.email;
      if (creds.password) password = creds.password;
    } catch(e) {}

    const aPassword = password ? true : false;
    const passwordMasque = aPassword ? '•'.repeat(password.length) : '(non mémorisé)';

    el.style.cssText = 'display:block;background:#fef2f2;border-bottom:3px solid #dc2626;padding:16px;font-size:.88rem;';
    el.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
        <span style="font-size:2rem;flex-shrink:0;">⚠️</span>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:1rem;color:#991b1b;margin-bottom:4px;">Base Supabase en pause</div>
          <div style="color:#7f1d1d;line-height:1.5;">
            Le projet a été mis en pause automatiquement après 7 jours d'inactivité.<br>
            Réactivez-le pour continuer à synchroniser.
          </div>
        </div>
      </div>

      <div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-weight:700;color:#64748b;font-size:.75rem;text-transform:uppercase;min-width:100px;">Identifiant</span>
          <code style="flex:1;background:#f1f5f9;padding:6px 10px;border-radius:6px;font-size:.85rem;min-width:200px;">${email}</code>
          <button onclick="SupaClient.copier('${email.replace(/'/g, "\\'")}', this)" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.8rem;font-weight:700;">📋 Copier</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-weight:700;color:#64748b;font-size:.75rem;text-transform:uppercase;min-width:100px;">Mot de passe</span>
          <code id="pausePassword" style="flex:1;background:#f1f5f9;padding:6px 10px;border-radius:6px;font-size:.85rem;min-width:200px;">${passwordMasque}</code>
          ${aPassword ? `
            <button onclick="SupaClient.togglePassword()" style="padding:6px 10px;background:#f1f5f9;color:#1e293b;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-size:.8rem;">👁️</button>
            <button onclick="SupaClient.copier(document.getElementById('pausePassword').dataset.real, this)" style="padding:6px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.8rem;font-weight:700;">📋 Copier</button>
          ` : `
            <span style="color:#64748b;font-size:.8rem;font-style:italic;">Cochez « Se souvenir de moi » à la prochaine connexion</span>
          `}
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="https://supabase.com/dashboard/project/${this.projectRef}" target="_blank" style="padding:10px 16px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:.85rem;">🔗 Ouvrir Supabase</a>
        <button id="pauseTestBtn" onclick="SupaClient.testerConnexion()" style="padding:10px 16px;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:.85rem;">🔄 Tester la connexion</button>
      </div>
    `;

    // Stocker le vrai mot de passe dans un dataset pour le copier/révéler
    const elPass = document.getElementById('pausePassword');
    if (elPass && aPassword) {
      elPass.dataset.real = password;
      elPass.dataset.masque = passwordMasque;
      elPass.dataset.revele = '0';
    }
  },

  togglePassword() {
    const el = document.getElementById('pausePassword');
    if (!el || !el.dataset.real) return;
    const revele = el.dataset.revele === '1';
    el.textContent = revele ? el.dataset.masque : el.dataset.real;
    el.dataset.revele = revele ? '0' : '1';
  },

  copier(texte, btn) {
    if (!texte) return;
    const afficherOk = () => {
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(afficherOk).catch(() => {
        this._copieFallback(texte); afficherOk();
      });
    } else {
      this._copieFallback(texte); afficherOk();
    }
  },

  _copieFallback(texte) {
    const ta = document.createElement('textarea');
    ta.value = texte;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  },

  // ============================================================
  // UI : login + bandeau état
  // ============================================================

  _afficherLogin() {
    const modal = document.getElementById('supaLoginModal');
    if (modal) modal.style.display = 'flex';
    const creds = localStorage.getItem('bricobol_supa_creds');
    if (creds) {
      try {
        const c = JSON.parse(creds);
        const elEmail = document.getElementById('supaEmail');
        const elPass = document.getElementById('supaPassword');
        if (elEmail) elEmail.value = c.email || '';
        if (elPass) elPass.value = c.password || '';
      } catch(e) {}
    }
  },

  _masquerLogin() {
    const modal = document.getElementById('supaLoginModal');
    if (modal) modal.style.display = 'none';
  },

  renderBandeau() {
    const el = document.getElementById('syncBandeau');
    if (!el) return;

    // Pause prioritaire : ne rien afficher d'autre
    if (this.enPause) {
      el.style.display = 'none';
      return;
    }

    const enLigne = this.enLigne;
    const fileAttente = (typeof Storage !== 'undefined' && Storage._fileAttente) ? Storage._fileAttente.length : 0;
    const enSync = (typeof Storage !== 'undefined' && Storage._syncActif) ? Storage._syncActif : false;

    let bg, border, color, icon, texte;

    if (!enLigne && fileAttente > 0) {
      bg = '#fef2f2'; border = '#fecaca'; color = '#991b1b';
      icon = '📵';
      texte = `Hors-ligne — ${fileAttente} modification${fileAttente > 1 ? 's' : ''} en attente`;
    } else if (!enLigne) {
      bg = '#fffbeb'; border = '#fcd34d'; color = '#92400e';
      icon = '📵';
      texte = 'Hors-ligne — lecture seule';
    } else if (enSync) {
      bg = '#eff6ff'; border = '#bfdbfe'; color = '#1e40af';
      icon = '⏳';
      texte = 'Synchronisation…';
    } else {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }

    el.style.cssText = `
      display:flex;align-items:center;gap:10px;padding:8px 14px;
      background:${bg};border-bottom:1.5px solid ${border};
      font-size:.82rem;font-weight:600;color:${color};
      flex-shrink:0;
    `;
    el.innerHTML = `<span style="font-size:1.1rem;">${icon}</span><span>${texte}</span>`;
  }
};

// Branchement du formulaire de connexion
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('supaLoginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('supaEmail').value.trim();
    const password = document.getElementById('supaPassword').value;
    const souvenir = document.getElementById('supaSouvenir').checked;
    const errEl = document.getElementById('supaLoginError');
    const btn = document.getElementById('supaLoginBtn');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Connexion...';
    try {
      await SupaClient.login(email, password, souvenir);
    } catch (err) {
      let msg = err.message || 'Erreur de connexion';
      if (SupaClient.estEnPause(err)) {
        msg = '⚠️ Base Supabase en pause. Allez sur supabase.com pour la réactiver.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Email ou mot de passe incorrect.';
      }
      errEl.textContent = msg;
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
});
