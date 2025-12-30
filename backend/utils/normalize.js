// normalize.js
// Utility to normalize Vietnamese text: remove diacritics and lowercase.
export function normalizeText(s = "") {
  // Use Unicode normalization and remove diacritic marks
  try {
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/đ/g, 'd') // Special case for Vietnamese đ
      .replace(/Đ/g, 'D')
      .toLowerCase();
  } catch (err) {
    // Fallback for older Node versions without \p{Diacritic}
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
}
