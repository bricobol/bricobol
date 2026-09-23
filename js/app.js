// ============================================================
// MODULE : APP — Initialisation globale
// ============================================================

const BricoBol = {

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
  },

  closeSidebar() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('overlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('active');
  },

  openGpsPopup(address) {
    if (!address) return;
    const enc = encodeURIComponent(address);
    document.getElementById('gpsGoogleMaps').href = `https://www.google.com/maps/search/?api=1&query=${enc}`;
    document.getElementById('gpsWaze').href = `https://waze.com/ul?q=${enc}`;
    document.getElementById('gpsAppleMaps').href = `http://maps.apple.com/?q=${enc}`;
    document.getElementById('gpsPopup').classList.add('active');
  },

  closeGpsPopup() {
    const p = document.getElementById('gpsPopup');
    if (p) p.classList.remove('active');
  },

  ensureModuleMounted(viewName) {
    if (typeof Router === 'undefined' || !Router.registry[viewName]) return;
    const module = Router.registry[viewName];
    if (!document.getElementById('view-' + viewName) && module.getViewHTML) {
      document.getElementById('contentArea').insertAdjacentHTML('beforeend', module.getViewHTML());
      if (module.mount) module.mount();
    }
    if (module.getModalsHTML) {
      const modalHTML = module.getModalsHTML();
      if (modalHTML) {
        const ids = [...modalHTML.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
        const dejaPresents = ids.filter(id => document.getElementById(id));
        if (dejaPresents.length === 0 && ids.length > 0) {
          document.getElementById('modalsContainer').insertAdjacentHTML('beforeend', modalHTML);
        }
      }
    }
  },

  updateStorageInfo() {
    const info = document.getElementById('storageInfo');
    if (!info) return;
    try {
      const nbAdh = (Storage.getAdherents() || []).length;
      info.textContent = nbAdh + ' contacts';
    } catch (e) {
      info.textContent = 'Supabase';
    }
  },

  async recharger() {
    const btn = document.getElementById('btnRecharger');
    if (btn) {
      btn.style.transform = 'rotate(360deg)';
      btn.style.transition = 'transform 0.6s';
      setTimeout(() => { btn.style.transform = ''; btn.style.transition = ''; }, 650);
    }
    if (!SupaClient || !SupaClient.client) return;
    if (!SupaClient.enLigne) { alert('Hors-ligne. Attendez la reconnexion.'); return; }
    await Storage.chargerToutDepuisSupabase();
    if (Router.currentView) {
      const mod = Router.registry[Router.currentView];
      if (mod && mod.onShow) mod.onShow();
    }
    this.updateStorageInfo();
  },

  init() {
    const demarrer = () => {
      Router.init();
      this.updateStorageInfo();
      console.log('%c🧰 Gestion BricoBol v0.5', 'font-size:14px;font-weight:bold;color:#2563eb');
      console.log('Modules enregistrés :', Object.keys(Router.registry).join(', '));
    };

    if (typeof SupaClient !== 'undefined') {
      SupaClient.init().then(async () => {
        await Storage.chargerToutDepuisSupabase();
        demarrer();
      });
    } else {
      demarrer();
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  BricoBol.init();
});
