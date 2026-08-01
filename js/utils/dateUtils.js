/**
 * Local Date and Time Utility Functions
 * Ensures dates are derived from the local timezone rather than UTC truncation
 */

export function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatArabicDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

window.NEXORA = window.NEXORA || {};
window.NEXORA.DateUtils = {
  getLocalDateString,
  formatArabicDate
};
