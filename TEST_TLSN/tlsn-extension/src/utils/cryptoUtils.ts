// src/utils/cryptoUtils.js

import CryptoJS from 'crypto-js';
import { H256 } from '@polkadot/types/interfaces';
import { hexToU8a } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';

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

export function hexStringToH256(hexString: string): H256 {
  let registry = new TypeRegistry();

  if (hexString.length !== 66 || !hexString.startsWith('0x')) {
    throw new Error('Invalid hex string format for H256');
  }

  return registry.createType('H256', hexToU8a(hexString));
}