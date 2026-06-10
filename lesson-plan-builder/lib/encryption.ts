/**
 * Encryption Service for AI Settings Center
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive data like API keys.
 * Uses environment variable for encryption key with fallback generation.
 * 
 * Security features:
 * - AES-256-GCM for authenticated encryption
 * - Random IV for each encryption
 * - Key derivation from env variable
 * - No raw keys exposed in code or logs
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Encryption algorithm
const ALGORITHM = "aes-256-gcm";

// IV length for AES-GCM (96 bits = 12 bytes)
const IV_LENGTH = 12;

// Auth tag length for AES-GCM (128 bits = 16 bytes)
const AUTH_TAG_LENGTH = 16;

// Key length for AES-256 (256 bits = 32 bytes)
const KEY_LENGTH = 32;

// Salt length for key derivation
const SALT_LENGTH = 16;

/**
 * Get or derive encryption key from environment
 * Priority:
 * 1. AI_SETTINGS_ENCRYPTION_KEY (dedicated env var)
 * 2. NEXTAUTH_SECRET (common Next.js auth secret)
 * 3. Generate from other env vars (fallback)
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.AI_SETTINGS_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  
  if (envKey) {
    // Derive fixed-length key from env variable using scrypt
    const salt = Buffer.alloc(SALT_LENGTH, 0); // Fixed salt for deterministic key
    return scryptSync(envKey, salt, KEY_LENGTH);
  }
  
  // Fallback: Generate a key from multiple env vars
  // NOTE: This is less secure - data encrypted this way cannot be decrypted
  // on different machines or after env changes. For production, always set
  // AI_SETTINGS_ENCRYPTION_KEY.
  const fallbackInput = [
    process.env.DATABASE_URL,
    process.env.OPENAI_API_KEY?.slice(0, 10), // Use partial key as salt source
    process.env.KIMI_API_KEY?.slice(0, 10),
    "lesson-plan-builder-fallback-key"
  ].filter(Boolean).join("-");
  
  const salt = Buffer.alloc(SALT_LENGTH, 1); // Different salt from explicit key
  return scryptSync(fallbackInput, salt, KEY_LENGTH);
}

/**
 * Encrypt sensitive text (e.g., API key)
 * Returns base64-encoded string containing: salt:iv:authTag:ciphertext
 */
export function encrypt(text: string): string {
  if (!text || text.length === 0) {
    return "";
  }
  
  try {
    const key = getEncryptionKey();
    
    // Generate random IV
    const iv = randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine: iv:authTag:ciphertext (all base64)
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "base64")]);
    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypt encrypted text
 * Input should be base64-encoded string from encrypt()
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || encryptedText.length === 0) {
    return "";
  }
  
  try {
    const key = getEncryptionKey();
    
    // Decode combined buffer
    const combined = Buffer.from(encryptedText, "base64");
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(ciphertext.toString("base64"), "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data. Encryption key may have changed.");
  }
}

/**
 * Mask an API key for display purposes
 * Shows first 4 chars as **** and last 4 chars of the actual key
 * Example: "sk-xxxxxxxxxxxxxxxx" -> "****sk-...xxxx"
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) {
    return "****";
  }
  
  // Find prefix patterns (sk-, gsk-, etc.)
  const prefixMatch = key.match(/^[a-z]+-[a-z]+-/i);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const keyBody = prefix ? key.slice(prefix.length) : key;
  
  if (keyBody.length <= 8) {
    return prefix + "****";
  }
  
  const first4 = keyBody.slice(0, 4);
  const last4 = keyBody.slice(-4);
  
  return `${prefix}****${first4}...${last4}`;
}

/**
 * Validate if a string is encrypted by our system
 * Basic check: must be base64 and have minimum length
 */
export function isEncrypted(text: string): boolean {
  if (!text || text.length < 30) {
    return false;
  }
  
  try {
    const buffer = Buffer.from(text, "base64");
    // Must have at least IV + auth tag + some ciphertext
    return buffer.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Safely decrypt for display - returns masked version
 * Use this when you only need to show the key, not use it
 */
export function decryptForDisplay(encryptedText: string): string {
  try {
    const decrypted = decrypt(encryptedText);
    return maskApiKey(decrypted);
  } catch {
    return "**** (decryption failed)";
  }
}

/**
 * Re-encrypt data with current key
 * Useful for key rotation
 */
export function rotateEncryption(encryptedText: string): string {
  const decrypted = decrypt(encryptedText);
  return encrypt(decrypted);
}

/**
 * Check if encryption is properly configured
 * Returns true if a dedicated encryption key is set
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.AI_SETTINGS_ENCRYPTION_KEY || !!process.env.NEXTAUTH_SECRET;
}

/**
 * Get encryption status for diagnostics
 */
export function getEncryptionStatus(): {
  configured: boolean;
  source: "dedicated" | "nextauth" | "fallback";
  warning?: string;
} {
  if (process.env.AI_SETTINGS_ENCRYPTION_KEY) {
    return { configured: true, source: "dedicated" };
  }
  
  if (process.env.NEXTAUTH_SECRET) {
    return {
      configured: true,
      source: "nextauth",
      warning: "Using NEXTAUTH_SECRET. For better security, set AI_SETTINGS_ENCRYPTION_KEY"
    };
  }
  
  return {
    configured: false,
    source: "fallback",
    warning: "Using fallback key derivation. Set AI_SETTINGS_ENCRYPTION_KEY for production!"
  };
}