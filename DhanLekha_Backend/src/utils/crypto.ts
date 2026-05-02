import CryptoJS from 'crypto-js';
import crypto from 'crypto';
import { config } from '../config/env';

const KEY = config.encryption.key;
const IV = config.encryption.iv;

// AES-256 symmetric encryption for sensitive data
export const encrypt = (plaintext: string): string => {
  const encrypted = CryptoJS.AES.encrypt(
    plaintext,
    CryptoJS.enc.Utf8.parse(KEY.padEnd(32, '0').slice(0, 32)),
    {
      iv: CryptoJS.enc.Utf8.parse(IV.padEnd(16, '0').slice(0, 16)),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return encrypted.toString();
};

export const decrypt = (ciphertext: string): string => {
  const decrypted = CryptoJS.AES.decrypt(
    ciphertext,
    CryptoJS.enc.Utf8.parse(KEY.padEnd(32, '0').slice(0, 32)),
    {
      iv: CryptoJS.enc.Utf8.parse(IV.padEnd(16, '0').slice(0, 16)),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
};

// SHA-256 hash for documents/files
export const hashDocument = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Hash for PII (one-way)
export const hashPII = (value: string): string => {
  return crypto.createHash('sha256').update(value + KEY).digest('hex');
};

// Mask sensitive strings
export const maskString = (val: string, visibleEnd = 4): string => {
  if (val.length <= visibleEnd) return val;
  return '•'.repeat(val.length - visibleEnd) + val.slice(-visibleEnd);
};

// Generate a secure random token
export const generateToken = (bytes = 32): string =>
  crypto.randomBytes(bytes).toString('hex');

// Generate numeric OTP
export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};
