// ============================================================
// MODULE : UTILS — Fonctions utilitaires
// ============================================================
// Dates, formatage, échappement HTML, calculs de statuts.

const Utils = {

  // --- Dates ---
  todayISO() {
    return new Date().toISOString().split('T')[0];
  },

  addOneYear(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  },

  formatDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  },

  daysUntil(iso) {
    if (!iso) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(iso); exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  },

  // --- Statut adhérent (actif / bientôt / expiré) ---
  statutAdherent(dateExpiration) {
    const d = this.daysUntil(dateExpiration);
    if (d === null) return 'actif';
    if (d < 0) return 'expire';
    if (d <= 60) return 'bientot';
    return 'actif';
  },

  statutLabel(s) {
    return { actif: 'À jour', bientot: 'Expire bientôt', expire: 'Expiré' }[s] || s;
  },

  statutBadge(s) {
    const map = { actif: 'badge-success', bientot: 'badge-warning', expire: 'badge-danger' };
    return `<span class="badge ${map[s] || 'badge-neutral'}">${this.statutLabel(s)}</span>`;
  },

  // --- Sécurité HTML ---
  escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  },

  // --- Formatage monétaire ---
  formatEuro(n) {
    if (n == null || isNaN(n)) return '0,00 €';
    return Number(n).toFixed(2).replace('.', ',') + ' €';
  },

  // --- Formatage kilométrique ---
  formatKm(n) {
    if (n == null || isNaN(n)) return '0 km';
    return Number(n).toFixed(1).replace('.', ',') + ' km';
  },

  // --- Tri commun : preference memorisee par liste (localStorage) ---
  // vue = identifiant de la liste, ex: 'interventions' ; valeurs : 'recent' ou 'ancien'
  getTri(vue, defaut) {
    try {
      const v = localStorage.getItem('bricobol_tri_' + vue);
      if (v === 'recent' || v === 'ancien') return v;
    } catch (e) { /* stockage indisponible */ }
    return defaut === 'ancien' ? 'ancien' : 'recent';
  },

  setTri(vue, valeur) {
    try { localStorage.setItem('bricobol_tri_' + vue, valeur); } catch (e) { /* ignore */ }
  },

  // Renvoie une COPIE triee. getKey(item) = chaine triable (ex: date ISO + heure).
  trierListe(list, vue, getKey, defaut) {
    const sens = this.getTri(vue, defaut) === 'ancien' ? 1 : -1;
    return list.slice().sort((a, b) => sens * String(getKey(a) || '').localeCompare(String(getKey(b) || '')));
  },

  // Liste deroulante de tri. onchange = code JS lance apres le choix (sans guillemets doubles).
  triSelectHTML(vue, onchange, defaut) {
    const cur = this.getTri(vue, defaut);
    return '<select onchange="Utils.setTri(\'' + vue + '\', this.value);' + (onchange || '') + '" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;">'
      + '<option value="recent"' + (cur === 'recent' ? ' selected' : '') + '>\u2193 Plus r\u00E9cents en haut</option>'
      + '<option value="ancien"' + (cur === 'ancien' ? ' selected' : '') + '>\u2191 Plus anciens en haut</option>'
      + '</select>';
  },

  // --- ID unique simple ---
  uid() {
    return Date.now() + Math.random();
  }
};
