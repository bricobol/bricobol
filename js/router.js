// ============================================================
// MODULE : ROUTER — Navigation + injection dynamique des vues
// ============================================================

const Router = {

  registry: {},
  currentView: null,

  register(moduleConfig) {
    this.registry[moduleConfig.view] = moduleConfig;
  },

  buildMenu() {
    const sections = {};
    Object.values(this.registry).forEach(m => {
      const s = m.section || 'Autres';
      if (!sections[s]) sections[s] = [];
      sections[s].push(m);
    });

    const sectionOrder = ['Vue d\'ensemble', 'Activité', 'Gestion', 'Autres'];

    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';

    sectionOrder.forEach(sectionName => {
      const items = sections[sectionName];
      if (!items || items.length === 0) return;
      items.sort((a, b) => (a.order || 100) - (b.order || 100));

      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'nav-section';
      sectionDiv.innerHTML = `<div class="nav-section-title">${sectionName}</div>`;

      items.forEach(m => {
        const link = document.createElement('a');
        link.className = 'nav-item';
        link.dataset.view = m.view;
        link.innerHTML = `<span class="nav-item-icon">${m.icon}</span><span>${m.title}</span>`;
        link.addEventListener('click', () => this.go(m.view));
        sectionDiv.appendChild(link);
      });

      nav.appendChild(sectionDiv);
    });
  },

  // ✅ MODIFIÉ : accepte un 2e paramètre "params" transmis à onShow
  go(viewName, params = null) {
    const module = this.registry[viewName];
    if (!module) {
      console.warn('Module introuvable :', viewName);
      return;
    }

    this.mountIfNeeded(viewName, module);

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const view = document.getElementById('view-' + viewName);
    const navItem = document.querySelector('.nav-item[data-view="' + viewName + '"]');
    if (view) view.classList.add('active');
    if (navItem) navItem.classList.add('active');

    document.getElementById('topbarTitle').textContent = module.title;

    try { localStorage.setItem('bricobol_active_view', viewName); } catch(e){}

    if (typeof BricoBol !== 'undefined' && BricoBol.closeSidebar) {
      BricoBol.closeSidebar();
    }

    const c = document.getElementById('contentArea');
    if (c) c.scrollTop = 0;

    this.currentView = viewName;

    // Met à jour le hash d'URL sans déclencher hashchange
    try {
      const hashCible = '#' + viewName;
      if (window.location.hash !== hashCible) {
        history.replaceState(null, '', hashCible);
      }
    } catch (e) {}

    // ✅ Passe les params à onShow
    if (module.onShow) module.onShow(params);
  },

  mountIfNeeded(viewName, module) {
    const viewId = 'view-' + viewName;
    if (document.getElementById(viewId)) return;

    if (module.getViewHTML) {
      const html = module.getViewHTML();
      document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    }

    if (module.getModalsHTML) {
      const modals = module.getModalsHTML();
      document.getElementById('modalsContainer').insertAdjacentHTML('beforeend', modals);
    }

    if (module.mount) module.mount();
  },

  _getViewFromHash() {
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (!hash) return null;
    return this.registry[hash] ? hash : null;
  },

  init() {
    this.buildMenu();
    const hashView = this._getViewFromHash();
    const saved = localStorage.getItem('bricobol_active_view') || 'dashboard';
    const target = hashView || (this.registry[saved] ? saved : 'dashboard');
    this.go(target);
    window.addEventListener('hashchange', () => {
      const h = this._getViewFromHash();
      if (h && h !== this.currentView) this.go(h);
    });
  }
};
