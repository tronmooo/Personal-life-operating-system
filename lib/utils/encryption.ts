/**
 * Encryption Utility for Sensitive Data
 * Uses AES-256-GCM for encrypting sensitive tokens and credentials
 */

import crypto from 'crypto'

// Get encryption key from environment (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || 'dev-key-change-in-production!'

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.warn('⚠️ ENCRYPTION_KEY not set or too short. Using fallback (INSECURE for production).')
}

// Ensure key is exactly 32 bytes
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted data with IV and auth tag
 */
export function encrypt(text: string): EncryptedData {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16)

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get the auth tag for GCM mode
    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Encrypted data object
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: EncryptedData): string {
  try {
    const { encrypted, iv, authTag } = encryptedData

    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    )

    // Set the auth tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt and encode as a single string (for easier database storage)
 * Format: iv:authTag:encrypted
 */
export function encryptToString(text: string): string {
  const { encrypted, iv, authTag } = encrypt(text)
  return `${iv}:${authTag}:${encrypted}`
}

/**
 * Decrypt from encoded string
 */
export function decryptFromString(encryptedString: string): string {
  const [iv, authTag, encrypted] = encryptedString.split(':')

  if (!iv || !authTag || !encrypted) {
    throw new Error('Invalid encrypted string format')
  }

  return decrypt({ encrypted, iv, authTag })
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * Useful for storing references that don't need to be decrypted
 */
export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}

/**
 * Verify if plain text matches a hash
 */
export function verifyHash(text: string, hashedText: string): boolean {
  return hash(text) === hashedText
}
