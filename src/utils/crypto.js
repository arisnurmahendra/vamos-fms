/**
 * VAMOS FMS - Client-Side Cryptography Utility
 * [SEC-004] Client-Side Data Encryption (CryptoJS AES-256)
 */

import CryptoJS from 'crypto-js';
import logger from './logger.js';

// Ambil secret key dari Vite Environment atau fallback default dev
const CRYPTO_SECRET_KEY = import.meta.env.VITE_CRYPTO_KEY || 'VAMOS_SECURE_CIPHER_SECRET_KEY_2026';

/**
 * Enkripsi teks atau objek menjadi Ciphertext string (AES-256)
 * @param {string|Object} data
 * @returns {string} Ciphertext base64
 */
export function encryptData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  try {
    const stringToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const encrypted = CryptoJS.AES.encrypt(stringToEncrypt, CRYPTO_SECRET_KEY).toString();
    return encrypted;
  } catch (err) {
    logger.error('[CRYPTO] Encryption error:', err);
    throw new Error('Gagal mengenkripsi data sensitif: ' + err.message);
  }
}

/**
 * Dekripsi Ciphertext kembali menjadi plaintext atau Object
 * @param {string} ciphertext
 * @param {boolean} parseJson
 * @returns {string|Object}
 */
export function decryptData(ciphertext, parseJson = false) {
  if (!ciphertext || typeof ciphertext !== 'string') {
    return ciphertext;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CRYPTO_SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      throw new Error('Ciphertext rusak atau secret key salah.');
    }

    if (parseJson) {
      try {
        return JSON.parse(decryptedText);
      } catch {
        return decryptedText;
      }
    }

    return decryptedText;
  } catch (err) {
    logger.error('[CRYPTO] Decryption error:', err);
    throw new Error('Gagal mendekripsi data: ' + err.message);
  }
}

export default {
  encryptData,
  decryptData
};
