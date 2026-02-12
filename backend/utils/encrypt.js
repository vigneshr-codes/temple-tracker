/**
 * AES-256-GCM encryption/decryption for sensitive settings stored in MongoDB.
 * Key is loaded from SETTINGS_ENCRYPTION_KEY env var (64-char hex = 32 bytes).
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'enc:'; // unambiguous marker — plaintext values never start with this

// Read key dynamically so it picks up the env var even after module load
const getKey = () => {
  const keyHex = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('SETTINGS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(keyHex, 'hex');
};

/**
 * Encrypt a plaintext string.
 * Returns a prefixed string: enc:iv:authTag:ciphertext (all hex encoded).
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;
  // Already encrypted — don't double-encrypt
  if (String(plaintext).startsWith(ENCRYPTED_PREFIX)) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plaintext, or the value unchanged if it was never encrypted.
 */
const decrypt = (value) => {
  if (!value || !String(value).startsWith(ENCRYPTED_PREFIX)) return value; // not encrypted — return as-is
  try {
    const data = String(value).slice(ENCRYPTED_PREFIX.length);
    const [ivHex, authTagHex, encryptedHex] = data.split(':');
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encryptedBuffer) + decipher.final('utf8');
  } catch (err) {
    // Log the failure so it's visible in backend logs instead of silently breaking
    console.error('[encrypt] decrypt failed:', err.message);
    return null; // return null so callers can detect failure instead of sending garbled data
  }
};

/**
 * Encrypt all sensitive fields in a notifications config object (mutates in-place).
 * Safe to call even if fields are already encrypted or undefined.
 */
const encryptNotifSecrets = (notif) => {
  if (!notif) return notif;
  if (notif.whatsAppConfig?.apiKey) notif.whatsAppConfig.apiKey = encrypt(notif.whatsAppConfig.apiKey);
  if (notif.smsConfig?.apiKey) notif.smsConfig.apiKey = encrypt(notif.smsConfig.apiKey);
  if (notif.emailConfig?.password) notif.emailConfig.password = encrypt(notif.emailConfig.password);
  return notif;
};

/**
 * Decrypt all sensitive fields in a notifications config object.
 * Returns a deep clone so the DB document is not modified.
 */
const decryptNotifSecrets = (notif) => {
  if (!notif) return notif;
  // Deep clone to avoid mutating the Mongoose document
  const n = JSON.parse(JSON.stringify(notif));
  if (n.whatsAppConfig?.apiKey) n.whatsAppConfig.apiKey = decrypt(n.whatsAppConfig.apiKey);
  if (n.smsConfig?.apiKey) n.smsConfig.apiKey = decrypt(n.smsConfig.apiKey);
  if (n.emailConfig?.password) n.emailConfig.password = decrypt(n.emailConfig.password);
  return n;
};

module.exports = { encrypt, decrypt, encryptNotifSecrets, decryptNotifSecrets };
