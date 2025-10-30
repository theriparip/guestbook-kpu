/**
 * Sanitize input untuk mencegah XSS attacks
 * @param {string} input - String yang akan disanitasi
 * @returns {string} - String yang sudah disanitasi
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
}

/**
 * Validasi format nomor telepon Indonesia
 * @param {string} phone - Nomor telepon
 * @returns {boolean} - True jika valid
 */
export function validatePhoneNumber(phone) {
  if (!phone) return true; // Optional field

  // Format: 08xx-xxxx-xxxx atau +62xxx atau 62xxx (8-15 digit)
  const phoneRegex = /^(\+62|62|0)[0-9]{8,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validasi email
 * @param {string} email - Email address
 * @returns {boolean} - True jika valid
 */
export function validateEmail(email) {
  if (!email) return true; // Optional field

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escape HTML untuk mencegah XSS
 * @param {string} text - Text yang akan di-escape
 * @returns {string} - Text yang sudah di-escape
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Validasi panjang string
 * @param {string} input - String yang akan divalidasi
 * @param {number} min - Panjang minimum
 * @param {number} max - Panjang maksimum
 * @returns {boolean} - True jika valid
 */
export function validateLength(input, min = 0, max = 255) {
  if (!input) return min === 0;

  const length = input.trim().length;
  return length >= min && length <= max;
}
