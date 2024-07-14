// src/utils/cryptoUtils.js

import CryptoJS from 'crypto-js';

// Encrypt data
export function encryptData(data: any, key: any) {
  return CryptoJS.AES.encrypt(data, key).toString();
}

// Decrypt data
export function decryptData(encryptedData: any, key: any) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Function to generate a constant encryption key
export function generateConstantKey() {
  return 'myconstantkey123456'; // Must be 16, 24, or 32 characters long
}
