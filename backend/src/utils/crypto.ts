import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;
  if (!keyEnv) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  if (keyEnv.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
  }

  return Buffer.from(keyEnv);
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const keyMaterial = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

  // @ts-ignore - createCipherGCM may not be in type definitions
  const cipher = crypto.createCipherGCM(ALGORITHM, keyMaterial, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: salt:iv:authTag:encrypted
  const result = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]).toString('base64');

  return result;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const decoded = Buffer.from(encryptedText, 'base64');

  // Extract components
  const salt = decoded.subarray(0, SALT_LENGTH);
  const iv = decoded.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = decoded.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = decoded.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const keyMaterial = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
  // @ts-ignore - createDecipherGCM may not be in type definitions
  const decipher = crypto.createDecipherGCM(ALGORITHM, keyMaterial, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(Buffer.from(encrypted));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hashed: string): boolean {
  return hashPassword(password) === hashed;
}
