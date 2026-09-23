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

  // --- ID unique simple ---
  uid() {
    return Date.now() + Math.random();
  }
};
